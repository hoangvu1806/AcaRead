#!/usr/bin/env python3
"""
Validation utilities for exam content.
"""
import json
import os
from typing import Dict, Any, List, Optional, Tuple


class ExamValidator:
    """Validates generated exam content against requirements."""
    
    PASSAGE_WORD_LIMITS = {
        1: (700, 900),
        2: (700, 1000),
        3: (750, 1200),
    }
    
    QUESTION_LIMITS = (12, 15)
    
    def __init__(self, schema_dir: str = None):
        if schema_dir is None:
            schema_dir = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..", "schema", "ielts"
            )
        self.schema_dir = schema_dir
    
    def count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())
    
    def validate_passage(
        self, 
        passage: Dict[str, Any], 
        passage_type: int = 1
    ) -> Tuple[bool, List[str]]:
        """
        Validate passage content.
        
        Returns:
            (is_valid, list of issues)
        """
        issues = []
        
        # Check required fields
        required = ["title", "content", "topic"]
        for field in required:
            if field not in passage:
                issues.append(f"Missing required field: {field}")
        
        if "content" in passage:
            word_count = self.count_words(passage["content"])
            min_words, max_words = self.PASSAGE_WORD_LIMITS.get(passage_type, (700, 1000))
            
            if word_count < min_words:
                issues.append(f"Passage too short: {word_count} words (min: {min_words})")
            elif word_count > max_words * 1.2:  # Allow 20% tolerance
                issues.append(f"Passage too long: {word_count} words (max: {max_words})")
        
        return len(issues) == 0, issues
    
    def validate_questions(
        self,
        tasks: List[Dict[str, Any]],
        expected_total: int
    ) -> Tuple[bool, List[str]]:
        """
        Validate questions structure and count.
        
        Returns:
            (is_valid, list of issues)
        """
        issues = []
        total_questions = 0
        seen_numbers = set()
        
        for task_idx, task in enumerate(tasks):
            task_type = task.get("task_type", f"Task {task_idx + 1}")
            
            if "questions" not in task:
                issues.append(f"{task_type}: Missing 'questions' array")
                continue
            
            questions = task["questions"]
            total_questions += len(questions)
            
            for q_idx, q in enumerate(questions):
                # Check question number
                q_num = q.get("question_number", q.get("number"))
                if q_num:
                    if q_num in seen_numbers:
                        issues.append(f"{task_type}: Duplicate question number {q_num}")
                    seen_numbers.add(q_num)
                
                # Check for answer
                has_answer = any(key in q for key in [
                    "correct_answer", "answer", "correct_heading_id", 
                    "correct_paragraph", "correct_feature_id"
                ])
                if not has_answer:
                    issues.append(f"{task_type} Q{q_idx + 1}: Missing answer")
        
        # Check total count
        if total_questions != expected_total:
            issues.append(f"Question count mismatch: got {total_questions}, expected {expected_total}")
        
        # Check question number sequence
        if seen_numbers:
            expected_seq = set(range(1, max(seen_numbers) + 1))
            missing = expected_seq - seen_numbers
            if missing:
                issues.append(f"Missing question numbers: {sorted(missing)}")
        
        return len(issues) == 0, issues
    
    def validate_answers(
        self,
        answers: Dict[str, Any],
        expected_total: int
    ) -> Tuple[bool, List[str]]:
        """
        Validate answer key structure.
        
        Returns:
            (is_valid, list of issues)
        """
        issues = []
        
        if "total_questions" not in answers:
            issues.append("Missing 'total_questions' field")
        elif answers["total_questions"] != expected_total:
            issues.append(f"Answer count mismatch: {answers['total_questions']} vs {expected_total}")
        
        if "tasks" not in answers:
            issues.append("Missing 'tasks' array in answers")
        else:
            total_answers = sum(len(t.get("answers", [])) for t in answers["tasks"])
            if total_answers != expected_total:
                issues.append(f"Total answers: {total_answers}, expected: {expected_total}")
        
        return len(issues) == 0, issues
    
    def validate_exam(
        self,
        exam: Dict[str, Any],
        passage_type: int = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Full exam validation.
        
        Returns:
            (is_valid, validation_report)
        """
        report = {
            "valid": True,
            "passage": {"valid": True, "issues": []},
            "questions": {"valid": True, "issues": []},
            "answers": {"valid": True, "issues": []},
        }
        
        # Determine passage type
        if passage_type is None:
            passage_type = exam.get("passage_type", 1)
        
        expected_total = exam.get("total_questions", 14)
        
        # Validate passage
        if "reading_passage" in exam:
            valid, issues = self.validate_passage(exam["reading_passage"], passage_type)
            report["passage"] = {"valid": valid, "issues": issues}
            if not valid:
                report["valid"] = False
        
        # Validate questions
        if "tasks" in exam:
            valid, issues = self.validate_questions(exam["tasks"], expected_total)
            report["questions"] = {"valid": valid, "issues": issues}
            if not valid:
                report["valid"] = False
        
        # Validate answers
        if "answers" in exam:
            valid, issues = self.validate_answers(exam["answers"], expected_total)
            report["answers"] = {"valid": valid, "issues": issues}
            if not valid:
                report["valid"] = False
        
        return report["valid"], report


# Global validator instance
exam_validator = ExamValidator()
