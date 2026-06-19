from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class DepartmentAnalytics(Base):
    __tablename__ = "department_analytics"

    id             = Column(Integer, primary_key=True, index=True)
    tenant_id      = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    department     = Column(String(100), nullable=False)
    avg_ats_score  = Column(Float, default=0.0)
    total_students = Column(Integer, default=0)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ATSDistribution(Base):
    __tablename__ = "ats_distribution"

    id            = Column(Integer, primary_key=True, index=True)
    tenant_id     = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    score_range   = Column(String(20),  nullable=False)   # "0-20", "21-40" ...
    student_count = Column(Integer, default=0)
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class StudentRanking(Base):
    __tablename__ = "student_rankings"
    __table_args__ = (
        UniqueConstraint("student_id", "tenant_id", "department", name="uq_ranking_student_dept"),
        Index("ix_rankings_tenant_dept_rank", "tenant_id", "department", "rank"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"),  nullable=False)
    department = Column(String(100), nullable=False)
    rank       = Column(Integer, nullable=False)
    ats_score  = Column(Float,   nullable=False, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("Student", back_populates="ranking")
