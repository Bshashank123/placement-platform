from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from .base_enums import UserRole

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        Index("ix_users_tenant_role", "tenant_id", "role"),
    )

    id            = Column(Integer, primary_key=True, index=True)
    tenant_id     = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email         = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role          = Column(Enum(UserRole), nullable=False, default=UserRole.student)
    is_active     = Column(Boolean, default=True)
    is_verified   = Column(Boolean, default=False)
    requires_password_change = Column(Boolean, default=False)
    mobile_number = Column(String(20), nullable=True, unique=True, index=True)
    reset_otp     = Column(String(6), nullable=True)
    reset_otp_expiry = Column(DateTime(timezone=True), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    tenant  = relationship("Tenant",  back_populates="users")
    student = relationship("Student", back_populates="user", uselist=False)
    faculty = relationship("Faculty", back_populates="user", uselist=False)


class CollegeAdmin(Base):
    __tablename__ = "college_admins"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"),   nullable=False, unique=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user   = relationship("User")
    tenant = relationship("Tenant")
