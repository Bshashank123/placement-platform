"""
FastAPI dependencies — auth guards used across all modules.

Usage:
    from app.dependencies import get_current_user, require_role

    @router.get("/profile")
    def profile(user = Depends(get_current_user)):
        ...

    @router.get("/analytics")
    def analytics(user = Depends(require_role(["admin", "super_admin"]))):
        ...
"""

from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.core.security import decode_access_token
from app.models import User, UserRole

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Try reading from cookie
    token = request.cookies.get("access_token")
    
    # 2. Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise exc

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise exc
    except JWTError:
        raise exc

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise exc
    return user


def require_role(allowed: list[str]):
    """Return a dependency that restricts access to specific roles."""
    def _guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required: {', '.join(allowed)}",
            )
        return user
    return _guard
