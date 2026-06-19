from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional


class SkillItem(BaseModel):
    id: int
    skill_name: str
    model_config = ConfigDict(from_attributes=True)


class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    tenant_id: int
    name: str
    roll_number: Optional[str] = None
    branch: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    cgpa: Optional[float] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    skills: list[SkillItem] = []
    model_config = ConfigDict(from_attributes=True)


class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = None
    branch: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    cgpa: Optional[float] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    skills: Optional[list[str]] = None

    @field_validator("year")
    @classmethod
    def year_valid(cls, v):
        if v is not None and v not in range(1, 5):
            raise ValueError("Year must be between 1 and 4")
        return v

    @field_validator("cgpa")
    @classmethod
    def cgpa_valid(cls, v):
        if v is not None and not (0.0 <= v <= 10.0):
            raise ValueError("CGPA must be between 0 and 10")
        return v


class DashboardStats(BaseModel):
    ats_score: Optional[float] = None
    rank: Optional[int] = None
    total_in_dept: Optional[int] = None
    percentile: Optional[str] = None
    resume_count: int = 0
    company_match_count: int = 0
    faculty_review_count: int = 0
    top_ats_improvement: Optional[str] = None
    impact_score: Optional[float] = None
    skills_score: Optional[float] = None
    structure_score: Optional[float] = None
    format_score: Optional[float] = None
    brevity_score: Optional[float] = None