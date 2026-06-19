"""
Auth Service — Module 1
Tenant detection → signup → login → JWT
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import User, Tenant, Student, Faculty, CollegeAdmin, UserRole
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import SignupRequest, LoginRequest


# ── Helpers ───────────────────────────────────────────────────────────────────

def _domain(email: str) -> str:
    return email.split("@")[-1].lower()


def get_tenant_by_domain(db: Session, domain: str) -> Tenant | None:
    return db.query(Tenant).filter(
        Tenant.domain == domain, Tenant.is_active == True
    ).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


# ── Signup ────────────────────────────────────────────────────────────────────

def signup_user(db: Session, payload: SignupRequest) -> User:
    email = payload.email.lower()

    # Duplicate check
    if get_user_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Super admin — no college required
    if payload.role == UserRole.super_admin:
        # Attach to any tenant (use id=1 as a sentinel; handled by seeder)
        tenant = db.query(Tenant).first()
        if not tenant:
            raise HTTPException(400, "No tenants configured yet. Run the seed script.")
        user = User(
            tenant_id=tenant.id,
            email=email,
            password_hash=hash_password(payload.password),
            role=UserRole.super_admin,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # Resolve tenant from email domain
    tenant = get_tenant_by_domain(db, _domain(email))
    if tenant is None:
        raise HTTPException(
            status_code=400,
            detail=f"No college found for domain '@{_domain(email)}'. "
                   "Use your official college email.",
        )

    user = User(
        tenant_id=tenant.id,
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_verified=False,
        requires_password_change=False,
        mobile_number=payload.mobile_number,
    )
    db.add(user)
    db.flush()

    if payload.role == UserRole.student:
        db.add(Student(user_id=user.id, tenant_id=tenant.id, name=payload.name))

    elif payload.role in (UserRole.faculty, UserRole.admin):
        db.add(Faculty(user_id=user.id, tenant_id=tenant.id, name=payload.name))
        if payload.role == UserRole.admin:
            db.add(CollegeAdmin(user_id=user.id, tenant_id=tenant.id))

    db.commit()
    db.refresh(user)
    return user


# ── Login ─────────────────────────────────────────────────────────────────────

def login_user(db: Session, payload: LoginRequest) -> dict:
    email = payload.email.lower()
    user  = get_user_by_email(db, email)

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated. Contact your placement office.",
        )

    if user.requires_password_change:
        from datetime import timedelta
        setup_token = create_access_token(
            subject=user.id, role=user.role, tenant_id=user.tenant_id, expires_delta=timedelta(minutes=15)
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "password_change_required",
                "setup_token": setup_token
            }
        )

    from app.core.security import create_refresh_token
    access_token = create_access_token(
        subject=user.id, role=user.role, tenant_id=user.tenant_id
    )
    refresh_token = create_refresh_token(
        subject=user.id, role=user.role, tenant_id=user.tenant_id
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}


# ── Password Setup & Reset ──────────────────────────────────────────────────

def setup_password(db: Session, user: User, new_password: str) -> dict:
    if not user.requires_password_change:
        raise HTTPException(400, "Password change not required.")
        
    user.password_hash = hash_password(new_password)
    user.requires_password_change = False
    db.commit()
    db.refresh(user)
    
    from app.core.security import create_refresh_token
    access_token = create_access_token(
        subject=user.id, role=user.role, tenant_id=user.tenant_id
    )
    refresh_token = create_refresh_token(
        subject=user.id, role=user.role, tenant_id=user.tenant_id
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}


# Simple in-memory OTP store for prototyping (Use Redis in production)
OTP_STORE = {}

def request_password_reset(db: Session, identifier: str) -> dict:
    from sqlalchemy import or_
    import random
    
    user = db.query(User).filter(
        or_(User.email == identifier.lower(), User.mobile_number == identifier)
    ).first()
    
    if not user:
        # Don't reveal if user exists or not
        return {"message": "If an account exists, an OTP has been sent."}
        
    otp = str(random.randint(100000, 999999))
    OTP_STORE[identifier] = {"otp": otp, "user_id": user.id}
    
    # Mocking sending SMS/Email
    print(f"\n{'='*50}\n[MOCK SMS/EMAIL] To: {identifier}\nYour OTP is: {otp}\n{'='*50}\n")
    
    return {"message": "If an account exists, an OTP has been sent."}


def reset_password_with_otp(db: Session, payload) -> dict:
    record = OTP_STORE.get(payload.mobile_or_email)
    if not record or record["otp"] != payload.otp:
        raise HTTPException(400, "Invalid or expired OTP.")
        
    user = db.query(User).filter(User.id == record["user_id"]).first()
    if not user:
        raise HTTPException(404, "User not found.")
        
    user.password_hash = hash_password(payload.new_password)
    user.requires_password_change = False
    db.commit()
    db.refresh(user)
    
    # Invalidate OTP
    del OTP_STORE[payload.mobile_or_email]
    
    from app.core.security import create_refresh_token
    access_token = create_access_token(
        subject=user.id, role=user.role, tenant_id=user.tenant_id
    )
    refresh_token = create_refresh_token(
        subject=user.id, role=user.role, tenant_id=user.tenant_id
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}
