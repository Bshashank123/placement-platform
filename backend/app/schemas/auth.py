from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from app.models import UserRole


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.student
    mobile_number: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 72:
            raise ValueError("Password must not exceed 72 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TenantOut(BaseModel):
    id: int
    name: str
    slug: str
    domain: str

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    tenant_id: int
    is_active: bool
    is_verified: bool
    requires_password_change: bool
    mobile_number: Optional[str] = None
    tenant: Optional[TenantOut] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class SetupPasswordRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 72:
            raise ValueError("Password must not exceed 72 characters")
        return v


class ForgotPasswordRequest(BaseModel):
    mobile_or_email: str


class ResetPasswordRequest(BaseModel):
    mobile_or_email: str
    otp: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 72:
            raise ValueError("Password must not exceed 72 characters")
        return v
