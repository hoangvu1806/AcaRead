#!/usr/bin/env python3
"""
Retry utilities for resilient LLM calls.
"""
import time
import functools
from typing import Callable, Any, Type, Tuple


class RetryExhausted(Exception):
    """All retry attempts exhausted."""
    pass


def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
):
    """
    Decorator for retrying functions with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries (seconds)
        max_delay: Maximum delay between retries (seconds)
        exponential_base: Base for exponential backoff
        exceptions: Tuple of exception types to catch and retry
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_retries:
                        print(f"[Retry] All {max_retries} attempts exhausted for {func.__name__}")
                        raise RetryExhausted(f"Failed after {max_retries} retries: {str(e)}") from e
                    
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    print(f"[Retry] Attempt {attempt + 1}/{max_retries} failed: {str(e)[:100]}")
                    print(f"[Retry] Retrying in {delay:.1f}s...")
                    time.sleep(delay)
            
            raise last_exception
        
        return wrapper
    return decorator


class ProgressCheckpoint:
    """
    Context manager for saving progress checkpoints.
    Allows resuming from last successful stage if pipeline fails.
    """
    
    def __init__(self, session_manager, session_id: str):
        self.session_manager = session_manager
        self.session_id = session_id
        self.checkpoints = {}
    
    def save(self, stage: str, data: Any):
        """Save checkpoint for a stage."""
        self.checkpoints[stage] = data
        # Also persist to session
        self.session_manager.update(
            self.session_id,
            last_checkpoint=stage,
            checkpoint_data={stage: True}
        )
        print(f"[Checkpoint] Saved: {stage}")
    
    def get(self, stage: str) -> Any:
        """Get checkpoint data for a stage."""
        return self.checkpoints.get(stage)
    
    def has(self, stage: str) -> bool:
        """Check if checkpoint exists for a stage."""
        return stage in self.checkpoints
