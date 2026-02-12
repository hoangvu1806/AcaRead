"""
User Service - Business logic for user management.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import User, ExamSession, ExamResult, generate_short_id

# Credit costs
CREDIT_COST_CREATE = 2  # Creating new exam
CREDIT_COST_EDIT = 1    # Editing/regenerating

# Weekly limits by plan
CREDITS_BY_PLAN = {
    "free": 20,
    "starter": 50,
    "pro": 200,
    "enterprise": -1,  # Unlimited
}


class UserService:
    """Service class for user-related operations."""

    @staticmethod
    def get_or_create_google_user(
        db: Session,
        email: str,
        name: str = None,
        image: str = None,
        google_id: str = None,
    ) -> User:
        """
        Get existing user or create new one from Google OAuth.
        
        Returns:
            User object (existing or newly created)
        """
        # Try to find by google_id first
        if google_id:
            user = db.query(User).filter(User.google_id == google_id).first()
            if user:
                # Update last login
                user.last_login_at = datetime.utcnow()
                user.name = name or user.name
                user.image = image or user.image
                db.commit()
                return user

        # Try to find by email
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link google_id if not already linked
            if google_id and not user.google_id:
                user.google_id = google_id
            user.last_login_at = datetime.utcnow()
            user.name = name or user.name
            user.image = image or user.image
            db.commit()
            return user

        # Create new user with short ID
        user = User(
            id=generate_short_id(6),
            email=email,
            name=name,
            image=image,
            google_id=google_id,
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_stats(db: Session, user_id: str) -> Dict[str, Any]:
        """Get user statistics."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Count sessions
        total_sessions = db.query(ExamSession).filter(
            ExamSession.user_id == user_id
        ).count()

        # Count exams with results
        total_exams = db.query(ExamSession).filter(
            ExamSession.user_id == user_id,
            ExamSession.has_exam == True
        ).count()

        # Count exams this month
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        exams_this_month = db.query(ExamSession).filter(
            ExamSession.user_id == user_id,
            ExamSession.has_exam == True,
            ExamSession.created_at >= current_month_start
        ).count()

        # Calculate average score
        avg_score = db.query(func.avg(ExamResult.score_percentage)).filter(
            ExamResult.user_id == user_id
        ).scalar()

        return {
            "total_sessions": total_sessions,
            "total_exams": total_exams,
            "exams_this_month": exams_this_month,
            "avg_score": round(avg_score, 2) if avg_score else None,
        }

    @staticmethod
    def get_user_sessions(
        db: Session,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> List[ExamSession]:
        """Get user's exam sessions with pagination."""
        return db.query(ExamSession).filter(
            ExamSession.user_id == user_id
        ).order_by(
            ExamSession.created_at.desc()
        ).offset(offset).limit(limit).all()

    @staticmethod
    def increment_user_exam_count(db: Session, user_id: str):
        """Increment user's total exam count."""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_exams_created += 1
            db.commit()

    @staticmethod
    def increment_user_session_count(db: Session, user_id: str):
        """Increment user's total session count."""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_sessions += 1
            db.commit()

    @staticmethod
    def _reset_weekly_credits_if_needed(db: Session, user: User) -> None:
        """Reset credits if a new week has started (non-cumulative)."""
        if user.credits_week_start is None:
            user.credits_week_start = datetime.utcnow()
            user.credits_balance = user.credits_weekly_limit
            db.commit()
            return
        
        # Check if 7 days have passed
        days_since_reset = (datetime.utcnow() - user.credits_week_start).days
        if days_since_reset >= 7:
            # Reset to weekly limit (non-cumulative)
            user.credits_balance = user.credits_weekly_limit
            user.credits_week_start = datetime.utcnow()
            db.commit()

    @staticmethod
    def check_credits(db: Session, user_id: str, action: str = "create") -> Tuple[bool, int, str]:
        """
        Check if user has enough credits for an action.
        
        Args:
            db: Database session
            user_id: User ID
            action: "create" (2 credits) or "edit" (1 credit)
            
        Returns:
            Tuple of (has_credits, balance, message)
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, 0, "User not found"
        
        # Enterprise has unlimited credits
        if user.plan_type == "enterprise":
            return True, -1, "Unlimited credits"
        
        # Reset weekly credits if needed
        UserService._reset_weekly_credits_if_needed(db, user)
        
        cost = CREDIT_COST_CREATE if action == "create" else CREDIT_COST_EDIT
        
        if user.credits_balance >= cost:
            return True, user.credits_balance, f"OK ({user.credits_balance} credits available)"
        else:
            return False, user.credits_balance, f"Insufficient credits. Need {cost}, have {user.credits_balance}"

    @staticmethod
    def use_credits(db: Session, user_id: str, action: str = "create") -> Tuple[bool, int, str]:
        """
        Deduct credits for an action.
        
        Args:
            db: Database session
            user_id: User ID
            action: "create" (2 credits) or "edit" (1 credit)
            
        Returns:
            Tuple of (success, remaining_balance, message)
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, 0, "User not found"
        
        # Enterprise has unlimited credits
        if user.plan_type == "enterprise":
            user.credits_total_used += (CREDIT_COST_CREATE if action == "create" else CREDIT_COST_EDIT)
            db.commit()
            return True, -1, "Unlimited credits"
        
        # Reset weekly credits if needed
        UserService._reset_weekly_credits_if_needed(db, user)
        
        cost = CREDIT_COST_CREATE if action == "create" else CREDIT_COST_EDIT
        
        if user.credits_balance < cost:
            return False, user.credits_balance, f"Insufficient credits. Need {cost}, have {user.credits_balance}"
        
        user.credits_balance -= cost
        user.credits_total_used += cost
        db.commit()
        
        return True, user.credits_balance, f"Used {cost} credit(s). {user.credits_balance} remaining"

    @staticmethod
    def get_credits_info(db: Session, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's credit information."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Reset weekly credits if needed
        UserService._reset_weekly_credits_if_needed(db, user)
        
        days_until_reset = 0
        if user.credits_week_start:
            days_since_reset = (datetime.utcnow() - user.credits_week_start).days
            days_until_reset = max(0, 7 - days_since_reset)
        
        return {
            "balance": user.credits_balance,
            "weekly_limit": user.credits_weekly_limit,
            "total_used": user.credits_total_used,
            "days_until_reset": days_until_reset,
            "cost_create": CREDIT_COST_CREATE,
            "cost_edit": CREDIT_COST_EDIT,
            "is_unlimited": user.plan_type == "enterprise",
        }


class ExamResultService:
    """Service class for exam result operations."""

    @staticmethod
    def create_result(
        db: Session,
        user_id: str,
        session_id: str,
        total_questions: int,
        correct_answers: int,
        time_spent_seconds: int = 0,
        user_answers: str = None,
    ) -> ExamResult:
        """Create a new exam result."""
        score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0

        result = ExamResult(
            id=generate_short_id(8),
            user_id=user_id,
            session_id=session_id,
            total_questions=total_questions,
            correct_answers=correct_answers,
            score_percentage=score_percentage,
            time_spent_seconds=time_spent_seconds,
            user_answers=user_answers,
            completed_at=datetime.utcnow(),
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return result

    @staticmethod
    def get_user_results(
        db: Session,
        user_id: str,
        limit: int = 20,
    ) -> List[ExamResult]:
        """Get user's exam results."""
        return db.query(ExamResult).filter(
            ExamResult.user_id == user_id
        ).order_by(
            ExamResult.completed_at.desc()
        ).limit(limit).all()

    @staticmethod
    def get_session_results(db: Session, session_id: str) -> List[ExamResult]:
        """Get all results for a session."""
        return db.query(ExamResult).filter(
            ExamResult.session_id == session_id
        ).order_by(ExamResult.completed_at.desc()).all()
