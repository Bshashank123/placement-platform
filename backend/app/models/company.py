from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Company(Base):
    __tablename__ = "companies"

    id           = Column(Integer, primary_key=True, index=True)
    tenant_id    = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name         = Column(String(150), nullable=False)
    role         = Column(String(150), nullable=True)
    min_cgpa     = Column(Float,   nullable=True)
    min_projects = Column(Integer, default=0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    tenant          = relationship("Tenant",               back_populates="companies")
    required_skills = relationship("CompanyRequiredSkill", back_populates="company", cascade="all, delete-orphan")
    match_scores    = relationship("CompanyMatchScore",    back_populates="company")
    drives          = relationship("PlacementDrive",       back_populates="company")
    offers          = relationship("PlacementOffer",       back_populates="company")


class CompanyRequiredSkill(Base):
    __tablename__ = "company_required_skills"

    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    skill_name = Column(String(100), nullable=False)

    company = relationship("Company", back_populates="required_skills")


class CompanyMatchScore(Base):
    __tablename__ = "company_match_scores"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    company_id  = Column(Integer, ForeignKey("companies.id"),nullable=False)
    resume_id   = Column(Integer, ForeignKey("resumes.id"),  nullable=False)
    match_score = Column(Float, nullable=False, default=0.0)

    student = relationship("Student", back_populates="company_matches")
    company = relationship("Company", back_populates="match_scores")
    resume  = relationship("Resume",  back_populates="company_matches")
