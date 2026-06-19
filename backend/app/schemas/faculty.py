from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class FacultyReviewCreate(BaseModel):
    comments: str

    def validate_comments(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Review must be at least 10 characters.")
        return v.strip()


class FacultyReviewOut(BaseModel):
    id: int
    resume_id: int
    faculty_id: int
    comments: str
    created_at: datetime
    faculty_name: Optional[str] = None
    faculty_designation: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class StudentSummaryOut(BaseModel):
    id: int
    name: str
    roll_number: Optional[str] = None
    department: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    cgpa: Optional[float] = None
    ats_score: Optional[float] = None
    resume_count: int = 0
    skills: list[str] = []
    model_config = ConfigDict(from_attributes=True)


class RankingOut(BaseModel):
    rank: int
    student_id: int
    student_name: str
    department: str
    ats_score: float
    is_me: bool = False
    model_config = ConfigDict(from_attributes=True)


class MyRankingOut(BaseModel):
    rank: int
    total: int
    department: str
    ats_score: float
    percentile: str
    above_avg: float
    dept_avg: float
    students_above_you: int
    points_to_next_rank: Optional[float] = None
    top_20_threshold: Optional[float] = None