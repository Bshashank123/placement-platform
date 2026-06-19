from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    slug       = Column(String(50),  unique=True, nullable=False)
    domain     = Column(String(100), unique=True, nullable=False)
    logo_url   = Column(String(255), nullable=True)
    is_active  = Column(Boolean, default=True)
    contract_start_date = Column(DateTime(timezone=True), nullable=True)
    contract_end_date   = Column(DateTime(timezone=True), nullable=True)
    max_users           = Column(Integer, default=5000)
    contact_email       = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users    = relationship("User",    back_populates="tenant")
    students = relationship("Student", back_populates="tenant")
    faculty  = relationship("Faculty", back_populates="tenant")
    resumes  = relationship("Resume",  back_populates="tenant")
    companies= relationship("Company", back_populates="tenant")
    placement_drives = relationship("PlacementDrive", back_populates="tenant")
    broadcasts       = relationship("BroadcastMessage", back_populates="tenant")


class BroadcastMessage(Base):
    __tablename__ = "broadcast_messages"

    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    sender_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject    = Column(String(200), nullable=False)
    body       = Column(Text, nullable=False)
    sent_at    = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="broadcasts")
    sender = relationship("User")


class PlatformFeedback(Base):
    __tablename__ = "platform_feedback"

    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    role       = Column(String(50), nullable=False)
    message    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant")
    user   = relationship("User")
