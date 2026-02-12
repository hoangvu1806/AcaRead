"""
Session Manager for AcaRead API.
Handles session creation, storage, and lifecycle management.
"""
import os
import json
import shutil
import secrets
import string
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path


class SessionManager:
    """
    Manages exam generation sessions with organized folder structure.
    
    Session Structure:
    sessions/
    └── {session_id}/
        ├── metadata.json       # Session info
        ├── source.pdf          # Original PDF
        ├── extracted.md        # Extracted markdown
        ├── passage.json        # Generated passage
        ├── questions/          # Question files by type
        │   ├── task_1.json
        │   └── task_2.json
        └── exam.json           # Final combined exam
    """
    
    SESSION_ID_LENGTH = 8
    
    def __init__(self, base_dir: str = None):
        """Initialize SessionManager with base directory."""
        if base_dir is None:
            base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sessions")
        
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        
        # In-memory cache for active sessions
        self._cache: Dict[str, Dict[str, Any]] = {}
        # Map session_id -> user_id for path resolution
        self._session_user_map: Dict[str, str] = {}

    def _generate_session_id(self) -> str:
        """Generate a short, URL-safe session ID."""
        alphabet = string.ascii_lowercase + string.digits
        while True:
            session_id = ''.join(secrets.choice(alphabet) for _ in range(self.SESSION_ID_LENGTH))
            # Check if not exists in any user folder
            if not self._find_session_path(session_id):
                return session_id

    def _find_session_path(self, session_id: str) -> Optional[str]:
        """Find session path across all user folders."""
        # Check cache first
        if session_id in self._session_user_map:
            user_id = self._session_user_map[session_id]
            return os.path.join(self.base_dir, user_id, session_id)
        
        # Search in all user folders
        if os.path.exists(self.base_dir):
            for user_folder in os.listdir(self.base_dir):
                user_path = os.path.join(self.base_dir, user_folder)
                if os.path.isdir(user_path):
                    session_path = os.path.join(user_path, session_id)
                    if os.path.isdir(session_path):
                        self._session_user_map[session_id] = user_folder
                        return session_path
        
        # Legacy: check flat structure (backward compatibility)
        legacy_path = os.path.join(self.base_dir, session_id)
        if os.path.isdir(legacy_path):
            return legacy_path
        
        return None

    def _get_session_dir(self, session_id: str, user_id: str = None) -> str:
        """Get the directory path for a session."""
        # Try to find existing session
        existing_path = self._find_session_path(session_id)
        if existing_path:
            return existing_path
        
        # For new sessions, require user_id
        if user_id:
            return os.path.join(self.base_dir, user_id, session_id)
        
        # Guest sessions go to "guest" folder
        return os.path.join(self.base_dir, "guest", session_id)

    def _get_metadata_path(self, session_id: str) -> str:
        """Get the metadata file path for a session."""
        session_dir = self._find_session_path(session_id) or self._get_session_dir(session_id)
        return os.path.join(session_dir, "metadata.json")

    def exists(self, session_id: str) -> bool:
        """Check if a session exists."""
        return self._find_session_path(session_id) is not None

    def create(self, filename: str, source_type: str = "file", user_id: str = None) -> str:
        """
        Create a new session.
        
        Args:
            filename: Original filename
            source_type: 'file' or 'url'
            user_id: User ID for folder organization
            
        Returns:
            session_id: The generated session ID
        """
        session_id = self._generate_session_id()
        
        # Determine user folder
        folder_id = user_id if user_id else "guest"
        session_dir = os.path.join(self.base_dir, folder_id, session_id)
        
        # Create session directory structure
        os.makedirs(session_dir, exist_ok=True)
        os.makedirs(os.path.join(session_dir, "questions"), exist_ok=True)
        
        # Cache the mapping
        self._session_user_map[session_id] = folder_id
        
        # Initialize metadata
        metadata = {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "filename": filename,
            "source_type": source_type,
            "status": "created",
            "stages": {
                "upload": None,
                "extract": None,
                "passage": None,
                "questions": None,
                "exam": None,
            },
            "word_count": 0,
            "exam_config": None,
        }
        
        self._save_metadata(session_id, metadata)
        self._cache[session_id] = metadata
        
        return session_id

    def _save_metadata(self, session_id: str, metadata: Dict[str, Any]) -> None:
        """Save metadata to file."""
        metadata["updated_at"] = datetime.now().isoformat()
        with open(self._get_metadata_path(session_id), "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

    def _load_metadata(self, session_id: str) -> Dict[str, Any]:
        """Load metadata from file."""
        metadata_path = self._get_metadata_path(session_id)
        if os.path.exists(metadata_path):
            with open(metadata_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session metadata."""
        if session_id in self._cache:
            return self._cache[session_id]
        
        if self.exists(session_id):
            metadata = self._load_metadata(session_id)
            if metadata:
                self._cache[session_id] = metadata
                return metadata
        
        return None

    def update(self, session_id: str, **kwargs) -> None:
        """Update session metadata."""
        metadata = self.get(session_id)
        if metadata is None:
            raise ValueError(f"Session not found: {session_id}")
        
        metadata.update(kwargs)
        self._save_metadata(session_id, metadata)
        self._cache[session_id] = metadata

    def update_stage(self, session_id: str, stage: str, status: str = "completed") -> None:
        """Update a specific stage status."""
        metadata = self.get(session_id)
        if metadata is None:
            raise ValueError(f"Session not found: {session_id}")
        
        metadata["stages"][stage] = {
            "status": status,
            "completed_at": datetime.now().isoformat(),
        }
        metadata["status"] = stage
        self._save_metadata(session_id, metadata)
        self._cache[session_id] = metadata

    # =========================================================================
    # FILE OPERATIONS
    # =========================================================================
    def get_source_path(self, session_id: str) -> str:
        """Get path for the source PDF file."""
        return os.path.join(self._get_session_dir(session_id), "source.pdf")

    def get_extracted_path(self, session_id: str) -> str:
        """Get path for the extracted markdown file."""
        return os.path.join(self._get_session_dir(session_id), "extracted.md")

    def get_passage_path(self, session_id: str) -> str:
        """Get path for the generated passage file."""
        return os.path.join(self._get_session_dir(session_id), "passage.json")

    def get_questions_dir(self, session_id: str) -> str:
        """Get path for the questions directory."""
        return os.path.join(self._get_session_dir(session_id), "questions")

    def get_exam_path(self, session_id: str) -> str:
        """Get path for the final exam file."""
        return os.path.join(self._get_session_dir(session_id), "exam.json")

    def get_answers_path(self, session_id: str) -> str:
        """Get path for the answer key file."""
        return os.path.join(self._get_session_dir(session_id), "answers.json")

    def save_source(self, session_id: str, content: bytes) -> str:
        """Save source PDF file."""
        path = self.get_source_path(session_id)
        with open(path, "wb") as f:
            f.write(content)
        self.update_stage(session_id, "upload")
        return path

    def save_extracted(self, session_id: str, content: str, word_count: int = None) -> str:
        """Save extracted markdown content."""
        path = self.get_extracted_path(session_id)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        
        if word_count:
            self.update(session_id, word_count=word_count)
        
        self.update_stage(session_id, "extract")
        return path

    def load_extracted(self, session_id: str) -> Optional[str]:
        """Load extracted markdown content."""
        path = self.get_extracted_path(session_id)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def save_passage(self, session_id: str, passage: Dict[str, Any]) -> str:
        """Save generated passage."""
        path = self.get_passage_path(session_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(passage, f, ensure_ascii=False, indent=2)
        self.update_stage(session_id, "passage")
        return path

    def load_passage(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load generated passage."""
        path = self.get_passage_path(session_id)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def save_questions(self, session_id: str, task_index: int, questions: Dict[str, Any]) -> str:
        """Save questions for a specific task."""
        path = os.path.join(self.get_questions_dir(session_id), f"task_{task_index}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        return path

    def load_all_questions(self, session_id: str) -> list:
        """Load all question files."""
        questions_dir = self.get_questions_dir(session_id)
        questions = []
        
        if os.path.exists(questions_dir):
            for filename in sorted(os.listdir(questions_dir)):
                if filename.endswith(".json"):
                    with open(os.path.join(questions_dir, filename), "r", encoding="utf-8") as f:
                        questions.append(json.load(f))
        
        return questions

    def save_exam(self, session_id: str, exam: Dict[str, Any]) -> str:
        """Save final combined exam."""
        path = self.get_exam_path(session_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(exam, f, ensure_ascii=False, indent=2)
        self.update_stage(session_id, "exam")
        return path

    def load_exam(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load final exam."""
        path = self.get_exam_path(session_id)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def has_exam(self, session_id: str) -> bool:
        """Check if session has a generated exam."""
        return os.path.exists(self.get_exam_path(session_id))

    def save_answers(self, session_id: str, answers: Dict[str, Any]) -> str:
        """Save answer key separately."""
        path = self.get_answers_path(session_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(answers, f, ensure_ascii=False, indent=2)
        return path

    def load_answers(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load answer key."""
        path = self.get_answers_path(session_id)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def has_answers(self, session_id: str) -> bool:
        """Check if session has answer key."""
        return os.path.exists(self.get_answers_path(session_id))

    # =========================================================================
    # CLEANUP
    # =========================================================================
    def delete(self, session_id: str) -> bool:
        """Delete a session."""
        session_dir = self._get_session_dir(session_id)
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)
            if session_id in self._cache:
                del self._cache[session_id]
            return True
        return False

    def list_sessions(self, limit: int = 50) -> list:
        """List recent sessions."""
        sessions = []
        
        if os.path.exists(self.base_dir):
            for session_id in os.listdir(self.base_dir):
                metadata = self._load_metadata(session_id)
                if metadata:
                    sessions.append({
                        "session_id": session_id,
                        "created_at": metadata.get("created_at"),
                        "filename": metadata.get("filename"),
                        "status": metadata.get("status"),
                        "has_exam": self.has_exam(session_id),
                    })
        
        # Sort by creation time (newest first)
        sessions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return sessions[:limit]


# Global session manager instance
session_manager = SessionManager()
