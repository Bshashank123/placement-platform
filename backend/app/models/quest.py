from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class SkillQuest(Base):
    __tablename__ = "skill_quests"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    target_departments = Column(String(500), nullable=False) # e.g. "ALL" or "CSE,ECE"
    points = Column(Integer, default=10) # Bonus points for ranking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    tenant = relationship("Tenant")
    faculty = relationship("Faculty")
    completions = relationship("QuestCompletion", back_populates="quest", cascade="all, delete-orphan")

class QuestCompletion(Base):
    __tablename__ = "quest_completions"

    id = Column(Integer, primary_key=True, index=True)
    quest_id = Column(Integer, ForeignKey("skill_quests.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    quest = relationship("SkillQuest", back_populates="completions")
    student = relationship("Student")
