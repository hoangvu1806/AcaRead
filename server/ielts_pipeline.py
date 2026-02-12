#!/usr/bin/env python3
"""
IELTS Dynamic Exam Generation Pipeline
Modular approach: Preprocess -> Generate Passage -> Plan Questions -> Generate Questions
"""
import os
import re
import json
import random
from typing import Dict, Any, List, Optional, Tuple, Callable
from pathlib import Path

# Import utilities
try:
    from utils.retry import retry_with_backoff, RetryExhausted
    from utils.validation import exam_validator
    HAS_UTILS = True
except ImportError:
    HAS_UTILS = False
    print("Warning: utils not available, running without retry/validation")


# Question type pool with metadata
QUESTION_TYPES = {
    "multiple_choice": {
        "name": "Multiple Choice",
        "schema_file": "questions/multiple_choice_schema.json",
        "min_questions": 3,
        "max_questions": 6,
    },
    "true_false_not_given": {
        "name": "True/False/Not Given",
        "schema_file": "questions/true_false_not_given_schema.json",
        "min_questions": 4,
        "max_questions": 6,
    },
    "yes_no_not_given": {
        "name": "Yes/No/Not Given",
        "schema_file": "questions/yes_no_not_given_schema.json",
        "min_questions": 4,
        "max_questions": 6,
    },
    "matching_headings": {
        "name": "Matching Headings",
        "schema_file": "questions/matching_headings_schema.json",
        "min_questions": 4,
        "max_questions": 7,
    },
    "matching_information": {
        "name": "Matching Information",
        "schema_file": "questions/matching_information_schema.json",
        "min_questions": 4,
        "max_questions": 6,
    },
    "matching_features": {
        "name": "Matching Features",
        "schema_file": "questions/matching_features_schema.json",
        "min_questions": 3,
        "max_questions": 5,
    },
    "sentence_completion": {
        "name": "Sentence Completion",
        "schema_file": "questions/sentence_completion_schema.json",
        "min_questions": 3,
        "max_questions": 5,
    },
    "summary_completion": {
        "name": "Summary Completion",
        "schema_file": "questions/summary_completion_schema.json",
        "min_questions": 4,
        "max_questions": 6,
    },
    "short_answer": {
        "name": "Short Answer Questions",
        "schema_file": "questions/short_answer_schema.json",
        "min_questions": 3,
        "max_questions": 5,
    },
}


class IELTSPipeline:
    """Pipeline for generating IELTS Reading exams."""

    def __init__(self, llm, schema_dir: str = None):
        """
        Initialize the pipeline.
        
        Args:
            llm: LLM instance for generation
            schema_dir: Directory containing schema files
        """
        self.llm = llm
        self.schema_dir = schema_dir or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "schema", "ielts"
        )
        self.passages_dir = os.path.join(self.schema_dir, "passages")

    # =========================================================================
    # STAGE 1: PREPROCESSING
    # =========================================================================
    def clean_references(self, content: str) -> str:
        """
        Remove references/bibliography section from the content.
        
        Args:
            content: Raw markdown content
            
        Returns:
            Cleaned content without references
        """
        # Common reference section headers
        reference_patterns = [
            r"\n##?\s*References?\s*\n",
            r"\n##?\s*Bibliography\s*\n",
            r"\n##?\s*Works?\s*Cited\s*\n",
            r"\n##?\s*Literature\s*\n",
            r"\n##?\s*Sources?\s*\n",
            r"\n##?\s*Tài liệu tham khảo\s*\n",
        ]
        
        # Find the earliest reference section
        earliest_pos = len(content)
        for pattern in reference_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match and match.start() < earliest_pos:
                earliest_pos = match.start()
        
        # Cut content at reference section
        cleaned = content[:earliest_pos].strip()
        
        # Also remove footnote-style references like [1], [2], etc.
        cleaned = re.sub(r'\[\d+\]', '', cleaned)
        
        # Remove excessive whitespace
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        
        return cleaned

    def count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())

    # =========================================================================
    # STAGE 2: PASSAGE GENERATION
    # =========================================================================
    def _load_schema(self, schema_path: str) -> Dict[str, Any]:
        """Load JSON schema from file."""
        with open(schema_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def generate_passage(
        self,
        source_content: str,
        passage_type: int = 1,
    ) -> Dict[str, Any]:
        """
        Generate IELTS reading passage from source content.
        
        Args:
            source_content: Cleaned source material
            passage_type: 1, 2, or 3 (difficulty/style)
            
        Returns:
            Generated passage dict with title, content, topic
        """
        schema_file = os.path.join(self.passages_dir, f"passage{passage_type}_schema.json")
        schema = self._load_schema(schema_file)
        
        # Word count targets by passage type
        word_targets = {
            1: (700, 900),
            2: (700, 1000),
            3: (750, 1200),
        }
        min_words, max_words = word_targets.get(passage_type, (700, 1000))
        
        prompt = f"""You are an IELTS exam writer. Create a reading passage based on the source material below.

REQUIREMENTS:
- Write a coherent, academic passage between {min_words}-{max_words} words
- Passage Type {passage_type}: {"General interest, factual" if passage_type == 1 else "Problem/solution focus" if passage_type == 2 else "Abstract, argumentative, research-based"}
- Use formal academic English
- Structure with clear paragraphs (label them A, B, C, etc. for reference)
- Do NOT include any questions
- Output ONLY valid JSON matching the schema

SOURCE MATERIAL:
{source_content[:8000]}

OUTPUT SCHEMA:
{json.dumps(schema, indent=2)}

Return ONLY the JSON object, no explanation."""

        result = self.llm.invoke_json(prompt, schema=schema)
        
        # Validate word count
        if "content" in result:
            word_count = self.count_words(result["content"])
            result["word_count"] = word_count
            if word_count < min_words:
                print(f"WARNING: Passage has {word_count} words, below minimum {min_words}")
        
        return result

    # =========================================================================
    # STAGE 3: QUESTION STRATEGY PLANNING
    # =========================================================================
    def plan_question_strategy(
        self,
        total_questions: int = 14,
        num_types: int = None,
    ) -> List[Dict[str, Any]]:
        """
        Plan question distribution strategy.
        
        Args:
            total_questions: Total number of questions (12-15, default 14)
            num_types: Number of question types to use (2-3, random if None)
            
        Returns:
            List of task configs with type and count
        """
        if num_types is None:
            num_types = random.choice([2, 3])
        
        num_types = max(2, min(3, num_types))
        
        # Randomly select question types
        available_types = list(QUESTION_TYPES.keys())
        selected_types = random.sample(available_types, num_types)
        
        # Distribute questions
        base_count = total_questions // num_types
        remainder = total_questions % num_types
        
        tasks = []
        question_number = 1
        
        for i, q_type in enumerate(selected_types):
            count = base_count + (1 if i < remainder else 0)
            
            # Respect min/max constraints
            type_info = QUESTION_TYPES[q_type]
            count = max(type_info["min_questions"], min(type_info["max_questions"], count))
            
            tasks.append({
                "type_key": q_type,
                "type_name": type_info["name"],
                "schema_file": type_info["schema_file"],
                "question_count": count,
                "start_number": question_number,
            })
            question_number += count
        
        # Adjust if total doesn't match
        actual_total = sum(t["question_count"] for t in tasks)
        if actual_total != total_questions:
            diff = total_questions - actual_total
            # Add/remove from last task
            tasks[-1]["question_count"] += diff
        
        return tasks

    # =========================================================================
    # STAGE 4: MODULAR QUESTION GENERATION
    # =========================================================================
    def generate_questions_for_task(
        self,
        passage: Dict[str, Any],
        task_config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate questions for a specific task type.
        
        Args:
            passage: The generated passage
            task_config: Task configuration from planning stage
            
        Returns:
            Generated questions matching the schema
        """
        schema_path = os.path.join(self.schema_dir, task_config["schema_file"])
        schema = self._load_schema(schema_path)
        
        type_name = task_config["type_name"]
        count = task_config["question_count"]
        start_num = task_config["start_number"]
        
        prompt = f"""You are an IELTS exam writer. Generate {count} {type_name} questions.

PASSAGE:
Title: {passage.get('title', 'Reading Passage')}

{passage.get('content', '')}

REQUIREMENTS:
- Create exactly {count} questions numbered {start_num} to {start_num + count - 1}
- Questions must be answerable from the passage text
- Each question must have clear explanation citing evidence
- Follow standard IELTS format for {type_name}
- Output ONLY valid JSON matching the schema

OUTPUT SCHEMA:
{json.dumps(schema, indent=2)}

Return ONLY the JSON object, no explanation."""

        result = self.llm.invoke_json(prompt, schema=schema)
        
        # Validate question count
        if "questions" in result:
            actual_count = len(result["questions"])
            if actual_count != count:
                print(f"WARNING: Expected {count} questions, got {actual_count}")
        
        return result

    # =========================================================================
    # ANSWER EXTRACTION
    # =========================================================================
    def extract_answers(self, tasks: list) -> Dict[str, Any]:
        """
        Extract answer key from generated tasks.
        
        Returns:
            Answer key with question numbers and correct answers
        """
        answers = {
            "total_questions": 0,
            "tasks": [],
        }
        
        question_num = 1
        for task in tasks:
            task_answers = {
                "task_type": task.get("task_type"),
                "answers": [],
            }
            
            questions = task.get("questions", [])
            for q in questions:
                # Check for various answer keys depending on schema
                answer_val = (
                    q.get("correct_answer") or 
                    q.get("answer") or 
                    q.get("correct_feature_id") or 
                    q.get("correct_heading_id") or 
                    q.get("correct_paragraph") or
                    q.get("correct_ending_id")
                )
                
                answer_entry = {
                    "question": question_num,
                    "answer": answer_val,
                }
                
                # Include explanation if available
                if "explanation" in q:
                    answer_entry["explanation"] = q["explanation"]
                
                task_answers["answers"].append(answer_entry)
                question_num += 1
            
            answers["tasks"].append(task_answers)
        
        answers["total_questions"] = question_num - 1
        return answers

    # =========================================================================
    # FULL PIPELINE EXECUTION
    # =========================================================================
    def generate_exam(
        self,
        source_content: str,
        passage_type: int = 1,
        total_questions: int = 14,
        num_question_types: int = None,
        progress_callback: Callable[[str, int], None] = None,
    ) -> Dict[str, Any]:
        """
        Execute full pipeline to generate IELTS exam.
        
        Args:
            source_content: Raw content from PDF
            passage_type: 1, 2, or 3
            total_questions: Number of questions (12-15)
            num_question_types: Number of different question types (2-3)
            progress_callback: Optional function(stage_name, progress_percent)
            
        Returns:
            Complete exam with passage, questions, and answers
        """
        if progress_callback:
            progress_callback("preprocessing", 10)

        print("=" * 60)
        print("IELTS EXAM GENERATION PIPELINE")
        print("=" * 60)
        
        # Stage 1: Preprocessing
        print("\n[Stage 1] Preprocessing content...")
        cleaned_content = self.clean_references(source_content)
        print(f"  - Original: {self.count_words(source_content)} words")
        print(f"  - Cleaned: {self.count_words(cleaned_content)} words")
        
        if progress_callback:
            progress_callback("generating_passage", 30)

        # Stage 2: Passage Generation
        print(f"\n[Stage 2] Generating Passage (Type {passage_type})...")
        passage = self.generate_passage(cleaned_content, passage_type)
        print(f"  - Title: {passage.get('title', 'N/A')}")
        print(f"  - Word count: {passage.get('word_count', 'N/A')}")
        
        if progress_callback:
            progress_callback("planning_strategy", 50)

        # Stage 3: Question Strategy
        print(f"\n[Stage 3] Planning question strategy ({total_questions} questions)...")
        tasks = self.plan_question_strategy(total_questions, num_question_types)
        for task in tasks:
            print(f"  - {task['type_name']}: {task['question_count']} questions")
        
        if progress_callback:
            progress_callback("generating_questions", 60)

        # Stage 4: Question Generation
        print("\n[Stage 4] Generating questions...")
        question_sections = []
        total_tasks = len(tasks)
        for i, task in enumerate(tasks):
            print(f"  - Generating {task['type_name']}...")
            questions = self.generate_questions_for_task(passage, task)
            question_sections.append({
                "task_type": task["type_name"],
                "task_key": task["type_key"],
                **questions
            })
            if progress_callback:
                # Calculate progress between 60% and 90% based on tasks done
                current_percent = 60 + int((i + 1) / total_tasks * 30)
                progress_callback("generating_questions", current_percent)
        
        if progress_callback:
            progress_callback("finalizing", 95)

        # Stage 5: Extract Answers
        print("\n[Stage 5] Extracting answer key...")
        answers = self.extract_answers(question_sections)
        print(f"  - Total answers: {answers['total_questions']}")
        
        # Compile final exam
        exam = {
            "exam_type": "IELTS",
            "passage_type": passage_type,
            "reading_passage": passage,
            "total_questions": total_questions,
            "tasks": question_sections,
            "answers": answers,
        }
        
        print("\n" + "=" * 60)
        print("EXAM GENERATION COMPLETE")
        print("=" * 60)
        
        if progress_callback:
            progress_callback("completed", 100)

        return exam
