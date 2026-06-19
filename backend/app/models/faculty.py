from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Faculty(Base):
    __tablename__ = "faculty"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"),   nullable=False, unique=True)
    tenant_id   = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name        = Column(String(150), nullable=False)
    department  = Column(String(100), nullable=True)
    designation = Column(String(150), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user    = relationship("User",         back_populates="faculty")
    tenant  = relationship("Tenant",       back_populates="faculty")
    reviews = relationship("FacultyReview", back_populates="faculty")


class FacultyReview(Base):
    __tablename__ = "faculty_reviews"

    id         = Column(Integer, primary_key=True, index=True)
    resume_id  = Column(Integer, ForeignKey("resumes.id"),  nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"),  nullable=False)
    comments   = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume  = relationship("Resume",  back_populates="faculty_reviews")
    faculty = relationship("Faculty", back_populates="reviews")
