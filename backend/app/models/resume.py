from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from .base_enums import ResumeStatus, ResumeType

class Resume(Base):
    __tablename__ = "resumes"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    tenant_id   = Column(Integer, ForeignKey("tenants.id"),  nullable=False)
    file_path   = Column(String(500), nullable=False)
    file_name   = Column(String(255), nullable=False)
    resume_type = Column(Enum(ResumeType), default=ResumeType.general)
    status      = Column(Enum(ResumeStatus), default=ResumeStatus.pending)
    is_primary  = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant          = relationship("Tenant",            back_populates="resumes")
    student         = relationship("Student",           back_populates="resumes")
    sections        = relationship("ResumeSection",     back_populates="resume", cascade="all, delete-orphan")
    bullets         = relationship("ResumeBullet",      back_populates="resume", cascade="all, delete-orphan")
    score           = relationship("ResumeScore",       back_populates="resume", uselist=False, cascade="all, delete-orphan")
    suggestions     = relationship("ResumeSuggestion",  back_populates="resume", cascade="all, delete-orphan")
    faculty_reviews = relationship("FacultyReview",     back_populates="resume")
    company_matches = relationship("CompanyMatchScore", back_populates="resume")


class ResumeSection(Base):
    __tablename__ = "resume_sections"

    id           = Column(Integer, primary_key=True, index=True)
    resume_id    = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    section_name = Column(String(100), nullable=False)
    content      = Column(Text, nullable=True)

    resume = relationship("Resume", back_populates="sections")


class ResumeBullet(Base):
    __tablename__ = "resume_bullets"

    id           = Column(Integer, primary_key=True, index=True)
    resume_id    = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    section_name = Column(String(100), nullable=False)
    bullet_text  = Column(Text, nullable=False)
    word_count   = Column(Integer, nullable=True)
    has_metric   = Column(Boolean, default=False)
    weak_verb    = Column(Boolean, default=False)

    resume = relationship("Resume", back_populates="bullets")


class ResumeScore(Base):
    __tablename__ = "resume_scores"

    id              = Column(Integer, primary_key=True, index=True)
    resume_id       = Column(Integer, ForeignKey("resumes.id"), nullable=False, unique=True)
    ats_score       = Column(Float, nullable=False, default=0.0)   # 0–100
    impact_score    = Column(Float, nullable=False, default=0.0)   # max 40
    brevity_score   = Column(Float, nullable=False, default=0.0)   # max 25
    style_score     = Column(Float, nullable=False, default=0.0)   # max 20
    sections_score  = Column(Float, nullable=False, default=0.0)   # max 15
    calculated_at   = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="score")


class ResumeSuggestion(Base):
    __tablename__ = "resume_suggestions"

    id              = Column(Integer, primary_key=True, index=True)
    resume_id       = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    category        = Column(String(50), nullable=False)   # impact | skills | structure | format | brevity
    suggestion_text = Column(Text, nullable=False)
    priority        = Column(Integer, default=1)           # 1=high 2=medium 3=low

    resume = relationship("Resume", back_populates="suggestions")
