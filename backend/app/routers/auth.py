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

def _set_cookies(response: Response, tokens: dict):
    is_cross_origin = "trycloudflare" in settings.FRONTEND_URL or settings.APP_ENV == "production"
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=is_cross_origin,
        samesite="none" if is_cross_origin else "lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    if "refresh_token" in tokens:
        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh_token"],
            httponly=True,
            secure=is_cross_origin,
            samesite="none" if is_cross_origin else "lax",
            max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        )


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED,
             summary="Register a new user")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    return auth_service.signup_user(db, payload)


@router.post("/login", response_model=TokenResponse, summary="Login — sets HttpOnly cookies")
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    res = auth_service.login_user(db, payload)
    _set_cookies(response, res)
    return res


@router.get("/me", response_model=UserOut, summary="Get current user from token")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == current_user.id).first()


@router.post("/logout", summary="Clear cookies to log out")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token using refresh token cookie")
@limiter.limit("10/minute")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    from app.core.security import decode_access_token, create_access_token
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    try:
        payload = decode_access_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        # Verify user still exists and is active
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User inactive or deleted")
            
        new_access_token = create_access_token(
            subject=user.id, role=user.role, tenant_id=user.tenant_id
        )
        
        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=(settings.APP_ENV == "production"),
            samesite="lax",
            max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        return {"access_token": new_access_token, "token_type": "bearer", "user": user}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


from app.schemas.auth import SetupPasswordRequest, ForgotPasswordRequest, ResetPasswordRequest

@router.post("/setup-password", response_model=TokenResponse, summary="Set new password after first login")
def setup_password(
    payload: SetupPasswordRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    res = auth_service.setup_password(db, current_user, payload.new_password)
    _set_cookies(response, res)
    return res


@router.post("/forgot-password", summary="Request OTP for password reset via mobile or email")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    return auth_service.request_password_reset(db, payload.mobile_or_email)


@router.post("/reset-password", response_model=TokenResponse, summary="Reset password using OTP")
def reset_password(
    payload: ResetPasswordRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    res = auth_service.reset_password_with_otp(db, payload)
    _set_cookies(response, res)
    return res
