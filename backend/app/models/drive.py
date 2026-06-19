from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from .base_enums import DriveRSVPStatus

class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id                    = Column(Integer, primary_key=True, index=True)
    tenant_id             = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    company_id            = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title                 = Column(String(200), nullable=False)
    description           = Column(Text, nullable=True)
    drive_date            = Column(DateTime(timezone=True), nullable=False)
    location              = Column(String(255), nullable=True)
    eligibility_cgpa      = Column(Float, nullable=True)
    eligibility_ats_score = Column(Float, nullable=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    tenant  = relationship("Tenant", back_populates="placement_drives")
    company = relationship("Company", back_populates="drives")
    rsvps   = relationship("DriveRSVP", back_populates="drive", cascade="all, delete-orphan")


class DriveRSVP(Base):
    __tablename__ = "drive_rsvps"
    __table_args__ = (
        UniqueConstraint("drive_id", "student_id", name="uq_rsvp_drive_student"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    drive_id   = Column(Integer, ForeignKey("placement_drives.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status     = Column(Enum(DriveRSVPStatus), default=DriveRSVPStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drive   = relationship("PlacementDrive", back_populates="rsvps")
    student = relationship("Student", back_populates="rsvps")


class PlacementOffer(Base):
    __tablename__ = "placement_offers"
    __table_args__ = (
        UniqueConstraint("student_id", "company_id", name="uq_offer_student_company"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role       = Column(String(150), nullable=False)
    ctc_lpa    = Column(Float, nullable=False)
    accepted   = Column(Boolean, default=True)
    offered_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="offers")
    company = relationship("Company", back_populates="offers")
