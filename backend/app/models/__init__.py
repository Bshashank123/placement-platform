"""
Central registry for all SQLAlchemy models.
Importing this file will register all models with the declarative Base.
"""

from app.database import Base
from .base_enums import UserRole, ResumeType, ResumeStatus, DriveRSVPStatus

from .tenant import Tenant, BroadcastMessage, PlatformFeedback
from .user import User, CollegeAdmin
from .student import Student, StudentSkill
from .faculty import Faculty, FacultyReview
from .company import Company, CompanyRequiredSkill, CompanyMatchScore
from .resume import Resume, ResumeSection, ResumeBullet, ResumeScore, ResumeSuggestion
from .analytics import DepartmentAnalytics, ATSDistribution, StudentRanking
from .drive import PlacementDrive, DriveRSVP, PlacementOffer
from .quest import SkillQuest, QuestCompletion

# This ensures all models are loaded when we import `app.models` in main.py
# and helps Alembic automatically discover them.
__all__ = [
    "Base",
    "UserRole", "ResumeType", "ResumeStatus", "DriveRSVPStatus",
    "Tenant", "BroadcastMessage", "PlatformFeedback",
    "User", "CollegeAdmin",
    "Student", "StudentSkill",
    "Faculty", "FacultyReview",
    "Company", "CompanyRequiredSkill", "CompanyMatchScore",
    "Resume", "ResumeSection", "ResumeBullet", "ResumeScore", "ResumeSuggestion",
    "DepartmentAnalytics", "ATSDistribution", "StudentRanking",
    "PlacementDrive", "DriveRSVP", "PlacementOffer",
    "SkillQuest", "QuestCompletion"
]
