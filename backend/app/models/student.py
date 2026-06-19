from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Student(Base):
    __tablename__ = "students"
    __table_args__ = (
        Index("ix_students_tenant_dept", "tenant_id", "department"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"),   nullable=False, unique=True)
    tenant_id    = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name         = Column(String(150), nullable=False)
    roll_number  = Column(String(50),  nullable=True)
    branch       = Column(String(100), nullable=True)
    department   = Column(String(100), nullable=True)
    year         = Column(Integer,     nullable=True)
    cgpa         = Column(Float,       nullable=True)
    github_url   = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    user            = relationship("User",               back_populates="student")
    tenant          = relationship("Tenant",             back_populates="students")
    skills          = relationship("StudentSkill",       back_populates="student", cascade="all, delete-orphan")
    resumes         = relationship("Resume",             back_populates="student")
    ranking         = relationship("StudentRanking",     back_populates="student", uselist=False)
    company_matches = relationship("CompanyMatchScore",  back_populates="student")
    rsvps           = relationship("DriveRSVP",          back_populates="student")
    offers          = relationship("PlacementOffer",     back_populates="student")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    skill_name = Column(String(100), nullable=False)

    student = relationship("Student", back_populates="skills")
