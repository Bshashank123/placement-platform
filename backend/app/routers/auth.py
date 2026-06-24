from fastapi import APIRouter, Depends, status, Response, Request, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserOut
from app.services import auth_service
from app.models import User
from app.core.config import settings
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Removed _set_cookies: using Bearer tokens in localStorage for CSRF protection


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED,
             summary="Register a new user")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    return auth_service.signup_user(db, payload)


@router.post("/login", response_model=TokenResponse, summary="Login — returns Bearer tokens")
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login_user(db, payload)


@router.get("/me", response_model=UserOut, summary="Get current user from token")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == current_user.id).first()


@router.post("/logout", summary="Log out")
def logout():
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
@limiter.limit("10/minute")
def refresh_token(request: Request, db: Session = Depends(get_db)):
    from app.core.security import decode_access_token, create_access_token
    # Extract from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Refresh token missing")
    token = auth_header.split(" ")[1]
    
    try:
        payload = decode_access_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User inactive or deleted")
            
        new_access_token = create_access_token(
            subject=user.id, role=user.role, tenant_id=user.tenant_id
        )
        return {"access_token": new_access_token, "token_type": "bearer", "user": user}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


from app.schemas.auth import SetupPasswordRequest, ForgotPasswordRequest, ResetPasswordRequest

@router.post("/setup-password", response_model=TokenResponse, summary="Set new password after first login")
def setup_password(
    payload: SetupPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.setup_password(db, current_user, payload.new_password)


@router.post("/forgot-password", summary="Request OTP for password reset via mobile or email")
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    return auth_service.request_password_reset(db, payload.mobile_or_email)


@router.post("/reset-password", response_model=TokenResponse, summary="Reset password using OTP")
@limiter.limit("3/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    return auth_service.reset_password_with_otp(db, payload)
