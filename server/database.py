"""
Database Models for AcaRead
SQLite-based user and session management with SQLAlchemy ORM.
"""
import os
import secrets
import string
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/acaread.db")

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def generate_short_id(length: int = 6) -> str:
    """Generate a short alphanumeric ID."""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class User(Base):
    """User account model."""
    __tablename__ = "users"

    id = Column(String(8), primary_key=True, index=True)  # Short 6-char ID
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    image = Column(Text, nullable=True)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    
    # Subscription plan
    plan_type = Column(String(20), default="free")  # free, starter, pro, enterprise
    plan_exams_limit = Column(Integer, default=5)  # Monthly exam limit
    plan_exams_used = Column(Integer, default=0)  # Exams used this month
    plan_started_at = Column(DateTime, nullable=True)
    plan_expires_at = Column(DateTime, nullable=True)
    
    # Credit system (weekly, non-cumulative)
    # Free: 20 credits/week, Create: 2 credits, Edit: 1 credit
    credits_balance = Column(Integer, default=20)  # Current credits
    credits_weekly_limit = Column(Integer, default=20)  # Weekly limit based on plan
    credits_week_start = Column(DateTime, default=datetime.utcnow)  # Start of current week
    credits_total_used = Column(Integer, default=0)  # Lifetime credits used
    
    # Usage tracking
    total_exams_created = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    storage_used_mb = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    
    # Relationships
    exam_sessions = relationship("ExamSession", back_populates="user", cascade="all, delete-orphan")
    exam_results = relationship("ExamResult", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "image": self.image,
            "is_active": self.is_active,
            "plan": {
                "type": self.plan_type,
                "exams_limit": self.plan_exams_limit,
                "exams_used": self.plan_exams_used,
                "started_at": self.plan_started_at.isoformat() if self.plan_started_at else None,
                "expires_at": self.plan_expires_at.isoformat() if self.plan_expires_at else None,
            },
            "credits": {
                "balance": self.credits_balance,
                "weekly_limit": self.credits_weekly_limit,
                "week_start": self.credits_week_start.isoformat() if self.credits_week_start else None,
                "total_used": self.credits_total_used,
            },
            "total_exams_created": self.total_exams_created,
            "total_sessions": self.total_sessions,
            "storage_used_mb": self.storage_used_mb,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }


class ExamSession(Base):
    """Exam generation session linked to user."""
    __tablename__ = "exam_sessions"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Session info
    filename = Column(String(255), nullable=True)
    source_type = Column(String(50), default="file")  # file, url
    word_count = Column(Integer, default=0)
    
    # Exam configuration
    exam_type = Column(String(50), default="IELTS")  # IELTS, TOEIC
    passage_type = Column(Integer, default=1)
    total_questions = Column(Integer, default=14)
    
    # Status tracking
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    has_exam = Column(Boolean, default=False)
    has_answers = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="exam_sessions")
    results = relationship("ExamResult", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "source_type": self.source_type,
            "word_count": self.word_count,
            "exam_type": self.exam_type,
            "passage_type": self.passage_type,
            "total_questions": self.total_questions,
            "status": self.status,
            "has_exam": self.has_exam,
            "has_answers": self.has_answers,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class ExamResult(Base):
    """User exam attempt result."""
    __tablename__ = "exam_results"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("exam_sessions.id"), nullable=False, index=True)
    
    # Score tracking
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    
    # Time tracking
    time_spent_seconds = Column(Integer, default=0)
    
    # User answers (JSON string)
    user_answers = Column(Text, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="exam_results")
    session = relationship("ExamSession", back_populates="results")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "total_questions": self.total_questions,
            "correct_answers": self.correct_answers,
            "score_percentage": self.score_percentage,
            "time_spent_seconds": self.time_spent_seconds,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    print("[Database] Tables created successfully")


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Initialize database on import
init_db()
