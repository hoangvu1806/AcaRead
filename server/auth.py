"""
JWT Authentication Module for AcaRead API.
Handles token creation, validation, and user session management.
"""
import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configuration
_jwt_secret_env = os.getenv("JWT_SECRET")
if not _jwt_secret_env:
    import warnings
    warnings.warn(
        "JWT_SECRET environment variable is not set. "
        "Using auto-generated secret (tokens will invalidate on restart). "
        "Set JWT_SECRET in .env for production.",
        stacklevel=2,
    )
    import secrets as _secrets
    _jwt_secret_env = _secrets.token_hex(32)

JWT_SECRET = _jwt_secret_env
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security scheme for Swagger UI
security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, email: str, name: str = None) -> str:
    """
    Generate a JWT access token for authenticated user.
    
    Args:
        user_id: User's unique ID
        email: User's email
        name: User's display name
        
    Returns:
        JWT token string
    """
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Tuple[bool, Optional[dict], str]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Tuple of (is_valid, payload, error_message)
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return True, payload, ""
    except jwt.ExpiredSignatureError:
        return False, None, "Token has expired"
    except jwt.InvalidTokenError as e:
        return False, None, f"Invalid token: {str(e)}"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> Optional[dict]:
    """
    FastAPI dependency to get current authenticated user from token.
    Returns None if no token provided (for optional auth).
    
    Usage:
        @app.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            if not user:
                raise HTTPException(401, "Authentication required")
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    is_valid, payload, error = verify_token(token)
    
    if not is_valid:
        raise HTTPException(status_code=401, detail=error)
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
    }


def require_auth(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    FastAPI dependency that REQUIRES authentication.
    Raises 401 if no token or invalid token.
    
    Usage:
        @app.post("/create-exam")
        async def create_exam(user: dict = Depends(require_auth)):
            # user is guaranteed to be authenticated
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    is_valid, payload, error = verify_token(token)
    
    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail=error,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
    }


def optional_auth(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> Optional[dict]:
    """
    FastAPI dependency for optional authentication.
    Returns user dict if valid token, None if no token, raises 401 if invalid token.
    
    Usage:
        @app.get("/sessions")
        async def get_sessions(user: Optional[dict] = Depends(optional_auth)):
            if user:
                # Show user's sessions
            else:
                # Show public sessions
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    is_valid, payload, error = verify_token(token)
    
    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail=error,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
    }
