#!/usr/bin/env python3
"""
Session cleanup and maintenance utilities.
"""
import os
import shutil
import asyncio
from datetime import datetime, timedelta
from typing import Optional


class SessionCleaner:
    """
    Handles automatic session cleanup based on age and storage limits.
    """
    
    def __init__(
        self,
        sessions_dir: str,
        max_age_hours: int = 24,
        max_sessions: int = 100,
        max_storage_mb: int = 1024,
    ):
        """
        Initialize SessionCleaner.
        
        Args:
            sessions_dir: Directory containing sessions
            max_age_hours: Delete sessions older than this (hours)
            max_sessions: Maximum number of sessions to keep
            max_storage_mb: Maximum total storage (MB)
        """
        self.sessions_dir = sessions_dir
        self.max_age_hours = max_age_hours
        self.max_sessions = max_sessions
        self.max_storage_bytes = max_storage_mb * 1024 * 1024
    
    def get_session_info(self, session_id: str) -> dict:
        """Get session info including age and size."""
        session_dir = os.path.join(self.sessions_dir, session_id)
        
        if not os.path.isdir(session_dir):
            return None
        
        # Get creation time from metadata or folder mtime
        metadata_path = os.path.join(session_dir, "metadata.json")
        if os.path.exists(metadata_path):
            mtime = os.path.getmtime(metadata_path)
        else:
            mtime = os.path.getmtime(session_dir)
        
        # Calculate size
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(session_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)
        
        return {
            "session_id": session_id,
            "created_at": datetime.fromtimestamp(mtime),
            "age_hours": (datetime.now() - datetime.fromtimestamp(mtime)).total_seconds() / 3600,
            "size_bytes": total_size,
            "size_mb": total_size / (1024 * 1024),
        }
    
    def get_all_sessions(self) -> list:
        """Get info for all sessions, sorted by age (oldest first)."""
        sessions = []
        
        if not os.path.exists(self.sessions_dir):
            return sessions
        
        for session_id in os.listdir(self.sessions_dir):
            info = self.get_session_info(session_id)
            if info:
                sessions.append(info)
        
        # Sort by creation time (oldest first)
        sessions.sort(key=lambda x: x["created_at"])
        return sessions
    
    def get_total_storage(self) -> dict:
        """Get total storage usage."""
        sessions = self.get_all_sessions()
        total_bytes = sum(s["size_bytes"] for s in sessions)
        
        return {
            "total_sessions": len(sessions),
            "total_bytes": total_bytes,
            "total_mb": total_bytes / (1024 * 1024),
            "limit_mb": self.max_storage_bytes / (1024 * 1024),
            "usage_percent": (total_bytes / self.max_storage_bytes) * 100 if self.max_storage_bytes > 0 else 0,
        }
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session directory."""
        session_dir = os.path.join(self.sessions_dir, session_id)
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)
            print(f"[Cleanup] Deleted session: {session_id}")
            return True
        return False
    
    def cleanup_old_sessions(self) -> int:
        """Delete sessions older than max_age_hours."""
        deleted = 0
        sessions = self.get_all_sessions()
        
        for session in sessions:
            if session["age_hours"] > self.max_age_hours:
                if self.delete_session(session["session_id"]):
                    deleted += 1
        
        if deleted > 0:
            print(f"[Cleanup] Deleted {deleted} sessions older than {self.max_age_hours}h")
        
        return deleted
    
    def cleanup_excess_sessions(self) -> int:
        """Delete oldest sessions if count exceeds max_sessions."""
        deleted = 0
        sessions = self.get_all_sessions()
        
        excess = len(sessions) - self.max_sessions
        if excess > 0:
            # Delete oldest sessions first
            for session in sessions[:excess]:
                if self.delete_session(session["session_id"]):
                    deleted += 1
        
        if deleted > 0:
            print(f"[Cleanup] Deleted {deleted} excess sessions (limit: {self.max_sessions})")
        
        return deleted
    
    def cleanup_storage_limit(self) -> int:
        """Delete oldest sessions if storage exceeds limit."""
        deleted = 0
        sessions = self.get_all_sessions()
        
        total_bytes = sum(s["size_bytes"] for s in sessions)
        
        while total_bytes > self.max_storage_bytes and sessions:
            oldest = sessions.pop(0)
            if self.delete_session(oldest["session_id"]):
                total_bytes -= oldest["size_bytes"]
                deleted += 1
        
        if deleted > 0:
            print(f"[Cleanup] Deleted {deleted} sessions to meet storage limit")
        
        return deleted
    
    def run_cleanup(self) -> dict:
        """Run all cleanup tasks."""
        report = {
            "deleted_old": self.cleanup_old_sessions(),
            "deleted_excess": self.cleanup_excess_sessions(),
            "deleted_storage": self.cleanup_storage_limit(),
        }
        report["total_deleted"] = sum(report.values())
        report["storage_after"] = self.get_total_storage()
        return report


async def periodic_cleanup(cleaner: SessionCleaner, interval_minutes: int = 60):
    """Run cleanup periodically in the background."""
    while True:
        await asyncio.sleep(interval_minutes * 60)
        try:
            report = cleaner.run_cleanup()
            if report["total_deleted"] > 0:
                print(f"[Periodic Cleanup] {report}")
        except Exception as e:
            print(f"[Periodic Cleanup] Error: {e}")
