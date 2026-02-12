#!/usr/bin/env python3
"""
AcaRead API Server v2.4
Clean implementation with organized session management, validation, and auto-cleanup.
Security: IDOR protection, SSRF blocking, answer stripping, auth enforcement.
"""
import os
import json
import shutil
import uvicorn
import asyncio
import requests
import traceback
import logging
import ipaddress
from urllib.parse import urlparse
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()


class StatusEndpointFilter(logging.Filter):
    """Suppress access logs for the /status polling endpoint."""
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        if "/status" in message and ("OPTIONS" in message or "GET" in message):
            return False
        return True


logging.getLogger("uvicorn.access").addFilter(StatusEndpointFilter())
import copy
from typing import Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from fastapi import Depends
from pdf_extractor import PDFExtractor
from ielts_pipeline import IELTSPipeline
from session_manager import session_manager

# Database imports
from database import get_db, SessionLocal, ExamSession as DBExamSession
from user_service import UserService, ExamResultService
from sqlalchemy.orm import Session
from auth import create_access_token, require_auth, optional_auth
from llm import LLM

# Import utilities
try:
    from utils.validation import exam_validator
    from utils.cleanup import SessionCleaner, periodic_cleanup
    HAS_UTILS = True
except ImportError:
    HAS_UTILS = False
    exam_validator = None
    print("Warning: utils not available")


# ============================================================================
# REQUEST MODELS
# ============================================================================
class IELTSExamRequest(BaseModel):
    """Request model for IELTS exam generation."""
    passage_type: int = 1  # 1, 2, or 3
    total_questions: int = 14  # 12-15
    num_question_types: Optional[int] = None  # 2-3, random if None


class RegenerateRequest(BaseModel):
    """Request model for regenerating specific stage."""
    stage: str  # "passage", "questions", or "all"
    passage_type: Optional[int] = None
    total_questions: Optional[int] = None
    num_question_types: Optional[int] = None


class GoogleAuthRequest(BaseModel):
    """Request model for Google OAuth callback."""
    email: str
    name: Optional[str] = None
    image: Optional[str] = None
    google_id: Optional[str] = None


class SubmitResultRequest(BaseModel):
    """Request model for submitting exam result."""
    session_id: str
    total_questions: int
    correct_answers: int
    time_spent_seconds: int = 0
    user_answers: Optional[str] = None


class SubmitExamRequest(BaseModel):
    """Request model for submitting exam answers to retrieve correct answers."""
    user_answers: dict  # {"q-1": "A", "q-2": "TRUE", ...}


# ============================================================================
# APP LIFECYCLE
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup: Initialize cleanup task
    cleanup_task = None
    if HAS_UTILS:
        cleaner = SessionCleaner(
            sessions_dir=session_manager.base_dir,
            max_age_hours=24,
            max_sessions=100,
            max_storage_mb=2048,
        )
        cleanup_task = asyncio.create_task(periodic_cleanup(cleaner, interval_minutes=60))
        print("[Server] Periodic cleanup task started")
    
    yield
    
    # Shutdown: Cancel cleanup task
    if cleanup_task:
        cleanup_task.cancel()
        print("[Server] Cleanup task stopped")


# ============================================================================
# FASTAPI APP
# ============================================================================
app = FastAPI(
    title="AcaRead API",
    description="API for AcaRead - IELTS Exam Generator",
    version="2.4",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
# Allow both local development and production domains
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://acaread.hoangvu.id.vn",
    "https://apisci.hoangvu.id.vn",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# GLOBAL INSTANCES
# ============================================================================
pdf_extractor = PDFExtractor()


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================
def count_words(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def strip_answers_from_exam(exam_data: dict) -> dict:
    """Remove all answer-related fields from exam data before sending to client."""
    sanitized = copy.deepcopy(exam_data)

    sanitized.pop("answers", None)

    for task in sanitized.get("tasks", []):
        for question in task.get("questions", []):
            question.pop("correct_answer", None)
            question.pop("answer", None)
            question.pop("explanation", None)
            question.pop("correct_heading_id", None)
            question.pop("correct_paragraph", None)
            question.pop("correct_feature_id", None)

    return sanitized


def verify_session_ownership(session_id: str, current_user: dict) -> dict:
    """Verify that the current user owns the session. Returns session metadata."""
    session = session_manager.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    session_owner = session.get("user_id")
    if session_owner and session_owner != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return session


BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def validate_url_safe(url: str) -> str:
    """Validate URL is not targeting internal network resources (SSRF protection)."""
    import socket

    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only http and https URLs are allowed")

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="Invalid URL: no hostname")

    blocked_hostnames = {"localhost", "0.0.0.0", "metadata.google.internal"}
    if hostname.lower() in blocked_hostnames:
        raise HTTPException(status_code=400, detail="URL targets a blocked host")

    try:
        resolved_ips = socket.getaddrinfo(hostname, None)
        for family, _, _, _, sockaddr in resolved_ips:
            ip = ipaddress.ip_address(sockaddr[0])
            for network in BLOCKED_IP_NETWORKS:
                if ip in network:
                    raise HTTPException(
                        status_code=400,
                        detail="URL resolves to a private/internal address",
                    )
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"Cannot resolve hostname: {hostname}")

    return url


def _sync_extract_pdf(source_path: str) -> str:
    """Synchronous PDF extraction (runs in thread pool)."""
    markdown_content = pdf_extractor.extract_from_file(source_path)
    pdf_extractor.clean_base64_images()
    return pdf_extractor.markdown_content


# ============================================================================
# ENDPOINTS
# ============================================================================
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "2.4.0",
        "pipeline": "Modular IELTS Pipeline",
        "features": ["google_auth", "user_management", "session_tracking"],
    }


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================
@app.post("/api/v1/auth/google")
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback from frontend.
    Creates or updates user in database and returns JWT token.
    """
    try:
        user = UserService.get_or_create_google_user(
            db=db,
            email=request.email,
            name=request.name,
            image=request.image,
            google_id=request.google_id,
        )
        
        # Generate JWT access token
        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            name=user.name,
        )
        
        return {
            "status": "success",
            "user": user.to_dict(),
            "access_token": access_token,
            "token_type": "Bearer",
        }
    except Exception as e:
        print(f"Error in Google auth: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


# ============================================================================
# USER ENDPOINTS
# ============================================================================
@app.get("/api/v1/users/{user_id}")
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    """Get user by ID. Users can only access their own profile."""
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user.to_dict()}


@app.get("/api/v1/users/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    """Get user statistics. Users can only access their own stats."""
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    stats = UserService.get_user_stats(db, user_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"stats": stats}


@app.get("/api/v1/users/{user_id}/sessions")
async def get_user_sessions(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    """Get user's exam sessions. Users can only access their own sessions."""
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    sessions = UserService.get_user_sessions(db, user_id, limit, offset)
    return {
        "sessions": [s.to_dict() for s in sessions],
        "count": len(sessions),
    }


@app.get("/api/v1/users/{user_id}/results")
async def get_user_results(
    user_id: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    """Get user's exam results. Users can only access their own results."""
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    results = ExamResultService.get_user_results(db, user_id, limit)
    return {
        "results": [r.to_dict() for r in results],
        "count": len(results),
    }


@app.post("/api/v1/users/{user_id}/results")
async def submit_result(
    user_id: str,
    request: SubmitResultRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    """Submit exam result for a user. Users can only submit their own results."""
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        result = ExamResultService.create_result(
            db=db,
            user_id=user_id,
            session_id=request.session_id,
            total_questions=request.total_questions,
            correct_answers=request.correct_answers,
            time_spent_seconds=request.time_spent_seconds,
            user_answers=request.user_answers,
        )
        return {
            "status": "success",
            "result": result.to_dict(),
        }
    except Exception as e:
        print(f"Error submitting result: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/v1/users/{user_id}/credits")
async def get_user_credits(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    """Get user's credit information. Users can only access their own credits."""
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    credits_info = UserService.get_credits_info(db, user_id)
    if not credits_info:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "status": "success",
        "credits": credits_info,
    }


@app.post("/api/v1/users/{user_id}/credits/check")
async def check_user_credits(
    user_id: str,
    action: str = "create",
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    """Check if user has enough credits for an action."""
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    has_credits, balance, message = UserService.check_credits(db, user_id, action)
    return {
        "status": "success" if has_credits else "insufficient",
        "has_credits": has_credits,
        "balance": balance,
        "message": message,
    }


@app.post("/api/v1/documents")
async def create_document(
    pdf_file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),  # Require authentication
):
    """
    Upload PDF file or provide URL and extract content.
    Requires authentication via Bearer token.
    
    Returns session_id for subsequent operations.
    """
    user_id = current_user["id"]  # Get user_id from authenticated token
    
    if pdf_file is None and (url is None or url.strip() == ""):
        raise HTTPException(
            status_code=400,
            detail="Either a PDF file or a valid URL must be provided"
        )
    
    filename = None
    source_type = "file" if pdf_file else "url"
    
    try:
        # Determine filename
        if pdf_file is not None:
            if not pdf_file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="Only PDF files are accepted")
            filename = pdf_file.filename
        else:
            filename = url.split("/")[-1] if "/" in url else "document.pdf"
            if not filename.endswith(".pdf"):
                filename += ".pdf"
        
        # Check credits for logged-in users
        credits_used = 0
        if user_id:
            has_credits, balance, message = UserService.check_credits(db, user_id, "create")
            if not has_credits:
                raise HTTPException(
                    status_code=402,  # Payment Required
                    detail=f"Insufficient credits. {message}. Upgrade your plan or wait for weekly reset."
                )
            # Deduct credits
            success, remaining, msg = UserService.use_credits(db, user_id, "create")
            if success:
                credits_used = 2
                print(f"[Credits] User {user_id} used 2 credits. Remaining: {remaining}")
        
        # Create session (organized by user folder)
        session_id = session_manager.create(filename=filename, source_type=source_type, user_id=user_id)
        print(f"[{session_id}] Created session for: {filename} (user: {user_id or 'guest'})")
        
        # Save source PDF
        source_path = session_manager.get_source_path(session_id)
        
        if pdf_file is not None:
            content = await pdf_file.read()
            await pdf_file.close()
            session_manager.save_source(session_id, content)
        else:
            # Download from URL (with SSRF protection)
            validate_url_safe(url)
            try:
                response = requests.get(url, stream=True, timeout=60, allow_redirects=False)
                response.raise_for_status()
                with open(source_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                session_manager.update_stage(session_id, "upload")
            except requests.RequestException as e:
                session_manager.delete(session_id)
                raise HTTPException(
                    status_code=400,
                    detail=f"Error downloading PDF from URL: {str(e)}"
                )
        
        # Extract content (run in thread pool to avoid blocking event loop)
        print(f"[{session_id}] Extracting PDF...")
        session_manager.update(session_id, status="extracting", progress=10)
        markdown_content = await asyncio.to_thread(_sync_extract_pdf, source_path)
        
        word_count = count_words(markdown_content)
        session_manager.save_extracted(session_id, markdown_content, word_count)
        
        print(f"[{session_id}] Extracted {word_count} words")
        
        # Create database record if user_id is provided
        if user_id:
            try:
                db_session = DBExamSession(
                    id=session_id,
                    user_id=user_id,
                    filename=filename,
                    source_type=source_type,
                    word_count=word_count,
                    status="extracted",
                )
                db.add(db_session)
                db.commit()
                UserService.increment_user_session_count(db, user_id)
            except Exception as db_error:
                print(f"Warning: Failed to create DB session record: {db_error}")
        
        return {
            "session_id": session_id,
            "filename": filename,
            "word_count": word_count,
            "user_id": user_id,
            "status": "success",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating document: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


def process_ielts_exam(
    session_id: str,
    passage_type: int,
    total_questions: int,
    num_question_types: Optional[int],
):
    """Background task to run IELTS pipeline."""
    try:
        print(f"[{session_id}] Starting IELTS generation (Background)...")
        
        # Save exam config and init status
        session_manager.update(session_id, 
            exam_config={
                "passage_type": passage_type,
                "total_questions": total_questions,
                "num_question_types": num_question_types,
            },
            status="queued",
            progress=0
        )
        
        # Load extracted content
        source_content = session_manager.load_extracted(session_id)
        if not source_content:
            print(f"[{session_id}] No source content found")
            session_manager.update(session_id, status="failed", error="No source content")
            return
        
        # Initialize pipeline
        llm = LLM.with_system_prompt(system_prompt_file="system_prompt.md")
        pipeline = IELTSPipeline(llm=llm)
        
        # Progress callback
        def update_progress(stage: str, percent: int):
            session_manager.update(session_id, status=stage, progress=percent)
        
        # Execute pipeline
        result = pipeline.generate_exam(
            source_content=source_content,
            passage_type=passage_type,
            total_questions=total_questions,
            num_question_types=num_question_types,
            progress_callback=update_progress
        )
        
        # Save artifacts
        if "reading_passage" in result:
            session_manager.save_passage(session_id, result["reading_passage"])
        
        if "tasks" in result:
            for i, task in enumerate(result["tasks"]):
                session_manager.save_questions(session_id, i + 1, task)
        
        if "answers" in result:
            session_manager.save_answers(session_id, result["answers"])
        
        # Save full exam (internal, contains answers for server-side use)
        session_manager.save_exam(session_id, result)
        
        # Update database to mark exam as completed and available
        from database import SessionLocal, ExamSession as DBExamSession
        db = SessionLocal()
        try:
            db_session = db.query(DBExamSession).filter(DBExamSession.id == session_id).first()
            if db_session:
                db_session.has_exam = True
                db_session.has_answers = True
                db_session.status = "completed"
                db_session.completed_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()
        
        # Final update in session manager
        session_manager.update(session_id, status="completed", progress=100)
        print(f"[{session_id}] IELTS generation complete")
        
    except Exception as e:
        print(f"[{session_id}] Generation failed: {str(e)}")
        print(traceback.format_exc())
        session_manager.update(session_id, status="failed", error=str(e))
        
        # Update database to mark as failed
        from database import SessionLocal, ExamSession as DBExamSession
        db = SessionLocal()
        try:
            db_session = db.query(DBExamSession).filter(DBExamSession.id == session_id).first()
            if db_session:
                db_session.status = "failed"
                db.commit()
        finally:
            db.close()


@app.post("/api/v1/exams/ielts/{session_id}")
async def create_ielts_exam(
    session_id: str,
    request: IELTSExamRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_auth),
):
    """
    Initiate IELTS exam generation in background.
    Returns immediately with status 'processing'.
    """
    session = verify_session_ownership(session_id, current_user)
    
    # Validate parameters
    if request.passage_type not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="passage_type must be 1, 2, or 3")
    
    if not (12 <= request.total_questions <= 15):
        raise HTTPException(status_code=400, detail="total_questions must be 12-15")
    
    if request.num_question_types is not None and request.num_question_types not in [2, 3]:
        raise HTTPException(status_code=400, detail="num_question_types must be 2 or 3")
    
    # Start background task
    background_tasks.add_task(
        process_ielts_exam,
        session_id=session_id,
        passage_type=request.passage_type,
        total_questions=request.total_questions,
        num_question_types=request.num_question_types,
    )
    
    return {
        "session_id": session_id,
        "status": "processing",
        "message": "Exam generation started in background"
    }


@app.get("/api/v1/exams/{session_id}/status")
async def get_exam_status(
    session_id: str,
    current_user: dict = Depends(require_auth),
):
    """Get status of exam generation."""
    session = verify_session_ownership(session_id, current_user)
    
    return {
        "session_id": session_id,
        "status": session.get("status", "unknown"),
        "progress": session.get("progress", 0),
        "error": session.get("error"),
    }


@app.get("/api/v1/exams/{session_id}/download")
async def download_exam(
    session_id: str,
    current_user: dict = Depends(require_auth),
):
    """Download generated exam as JSON file (answers stripped)."""
    verify_session_ownership(session_id, current_user)
    
    exam = session_manager.load_exam(session_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    sanitized_exam = strip_answers_from_exam(exam)
    
    return JSONResponse(
        content=sanitized_exam,
        headers={
            "Content-Disposition": f'attachment; filename="exam_{session_id}.json"',
        },
    )


@app.get("/api/v1/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: dict = Depends(require_auth),
):
    """Get session information."""
    session = verify_session_ownership(session_id, current_user)
    
    return {
        "session_id": session_id,
        "filename": session.get("filename"),
        "created_at": session.get("created_at"),
        "status": session.get("status"),
        "word_count": session.get("word_count"),
        "stages": session.get("stages"),
        "has_exam": session_manager.has_exam(session_id),
        "has_answers": session_manager.has_answers(session_id),
    }


@app.post("/api/v1/exams/{session_id}/submit")
async def submit_exam(
    session_id: str,
    request: SubmitExamRequest,
    current_user: dict = Depends(require_auth),
):
    """Submit user answers and receive correct answers for grading."""
    verify_session_ownership(session_id, current_user)

    answers = session_manager.load_answers(session_id)
    if answers is None:
        raise HTTPException(status_code=404, detail="Answers not generated yet")

    return {
        "session_id": session_id,
        "answers": answers,
        "status": "success",
    }


@app.get("/api/v1/exams/{session_id}")
async def get_exam(
    session_id: str,
    current_user: dict = Depends(require_auth),
):
    """Get exam data with answers stripped for client-side display."""
    verify_session_ownership(session_id, current_user)
    
    exam = session_manager.load_exam(session_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not generated yet")
    
    sanitized_exam = strip_answers_from_exam(exam)
    
    return {
        "session_id": session_id,
        "result": sanitized_exam,
        "status": "success",
    }


@app.get("/api/v1/sessions")
async def list_sessions(
    limit: int = 20,
    current_user: dict = Depends(require_auth),
):
    """List recent sessions for the authenticated user."""
    sessions = session_manager.list_sessions(limit=limit)
    owned = [s for s in sessions if s.get("user_id") == current_user["id"]]
    return {
        "sessions": owned,
        "count": len(owned),
    }


@app.delete("/api/v1/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(require_auth),
):
    """Delete a session and all its files."""
    verify_session_ownership(session_id, current_user)
    
    session_manager.delete(session_id)
    return {
        "session_id": session_id,
        "status": "deleted",
    }


@app.get("/api/v1/exams/{session_id}/validate")
async def validate_exam(
    session_id: str,
    current_user: dict = Depends(require_auth),
):
    """Validate generated exam against IELTS standards."""
    verify_session_ownership(session_id, current_user)
    
    exam = session_manager.load_exam(session_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam_validator is None:
        return {
            "session_id": session_id,
            "status": "skipped",
            "message": "Validator not available",
        }
    
    is_valid, report = exam_validator.validate_exam(exam)
    
    return {
        "session_id": session_id,
        "valid": is_valid,
        "report": report,
        "status": "success",
    }


@app.post("/api/v1/exams/{session_id}/regenerate")
async def regenerate_exam(
    session_id: str,
    request: RegenerateRequest,
    current_user: dict = Depends(require_auth),
):
    """
    Regenerate specific stage of exam.
    
    Stages:
    - "passage": Regenerate only the passage
    - "questions": Regenerate questions (keeps existing passage)
    - "all": Regenerate everything
    """
    session = verify_session_ownership(session_id, current_user)
    
    try:
        # Load existing config or use new values
        existing_config = session.get("exam_config", {}) or {}
        passage_type = request.passage_type or existing_config.get("passage_type", 1)
        total_questions = request.total_questions or existing_config.get("total_questions", 14)
        num_question_types = request.num_question_types or existing_config.get("num_question_types")
        
        # Initialize pipeline
        llm = LLM.with_system_prompt(system_prompt_file="system_prompt.md")
        pipeline = IELTSPipeline(llm=llm)
        
        source_content = session_manager.load_extracted(session_id)
        if not source_content:
            raise HTTPException(status_code=400, detail="No extracted content found")
        
        if request.stage == "passage":
            # Regenerate only passage
            cleaned = pipeline.clean_references(source_content)
            passage = pipeline.generate_passage(cleaned, passage_type)
            session_manager.save_passage(session_id, passage)
            
            return {
                "session_id": session_id,
                "stage": "passage",
                "result": passage,
                "status": "success",
            }
        
        elif request.stage == "questions":
            # Regenerate questions using existing passage
            passage = session_manager.load_passage(session_id)
            if not passage:
                raise HTTPException(status_code=400, detail="No passage found. Generate passage first.")
            
            tasks = pipeline.plan_question_strategy(total_questions, num_question_types)
            question_sections = []
            
            for task in tasks:
                questions = pipeline.generate_questions_for_task(passage, task)
                question_sections.append({
                    "task_type": task["type_name"],
                    "task_key": task["type_key"],
                    **questions
                })
                session_manager.save_questions(session_id, len(question_sections), questions)
            
            answers = pipeline.extract_answers(question_sections)
            session_manager.save_answers(session_id, answers)
            
            # Strip answers from tasks before returning to client
            sanitized_tasks = []
            for section in question_sections:
                sanitized = copy.deepcopy(section)
                for q in sanitized.get("questions", []):
                    q.pop("correct_answer", None)
                    q.pop("answer", None)
                    q.pop("explanation", None)
                    q.pop("correct_heading_id", None)
                    q.pop("correct_paragraph", None)
                    q.pop("correct_feature_id", None)
                sanitized_tasks.append(sanitized)
            
            return {
                "session_id": session_id,
                "stage": "questions",
                "tasks": sanitized_tasks,
                "status": "success",
            }
        
        else:  # "all"
            # Full regeneration
            result = pipeline.generate_exam(
                source_content=source_content,
                passage_type=passage_type,
                total_questions=total_questions,
                num_question_types=num_question_types,
            )
            
            if "reading_passage" in result:
                session_manager.save_passage(session_id, result["reading_passage"])
            if "tasks" in result:
                for i, task in enumerate(result["tasks"]):
                    session_manager.save_questions(session_id, i + 1, task)
            if "answers" in result:
                session_manager.save_answers(session_id, result["answers"])
            
            session_manager.save_exam(session_id, result)
            
            # Update database
            from database import SessionLocal, ExamSession as DBExamSession
            db_conn = SessionLocal()
            try:
                db_session = db_conn.query(DBExamSession).filter(DBExamSession.id == session_id).first()
                if db_session:
                    db_session.has_exam = True
                    db_session.has_answers = True
                    db_session.status = "completed"
                    db_conn.commit()
            finally:
                db_conn.close()
            
            sanitized_result = strip_answers_from_exam(result)
            
            return {
                "session_id": session_id,
                "stage": "all",
                "result": sanitized_result,
                "status": "success",
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error regenerating: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/v1/stats/storage")
async def get_storage_stats():
    """Get storage usage statistics."""
    if not HAS_UTILS:
        return {"status": "unavailable", "message": "Utils not installed"}
    
    cleaner = SessionCleaner(sessions_dir=session_manager.base_dir)
    stats = cleaner.get_total_storage()
    
    return {
        "stats": stats,
        "status": "success",
    }


@app.post("/api/v1/admin/cleanup")
async def run_cleanup(current_user: dict = Depends(require_auth)):
    """Manually trigger session cleanup. Requires authentication."""
    if not HAS_UTILS:
        return {"status": "unavailable", "message": "Utils not installed"}
    
    cleaner = SessionCleaner(
        sessions_dir=session_manager.base_dir,
        max_age_hours=24,
        max_sessions=100,
        max_storage_mb=2048,
    )
    report = cleaner.run_cleanup()
    
    return {
        "report": report,
        "status": "success",
    }


# ============================================================================
# MAIN
# ============================================================================
def start_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    """Start the API server."""
    print(f"Starting AcaRead API at http://{host}:{port}")
    uvicorn.run("server:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="AcaRead API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args()
    start_server(host=args.host, port=args.port, reload=args.reload)