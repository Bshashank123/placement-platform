from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CompanyCreate(BaseModel):
    name: str
    role: Optional[str] = None
    min_cgpa: Optional[float] = None
    min_projects: int = 0
    required_skills: list[str] = []


class CompanyOut(BaseModel):
    id: int
    tenant_id: int
    name: str
    role: Optional[str] = None
    min_cgpa: Optional[float] = None
    min_projects: int = 0
    required_skills: list[str] = []
    model_config = ConfigDict(from_attributes=True)


class CompanyMatchOut(BaseModel):
    company_id: int
    company_name: str
    role: Optional[str] = None
    match_score: float
    skill_match_pct: float
    cgpa_eligible: bool
    matched_skills: list[str] = []
    missing_skills: list[str] = []


class DepartmentAnalyticsOut(BaseModel):
    department: str
    total_students: int
    scored_students: int
    avg_ats_score: float
    top_score: float
    weak_students: int    # score < 50
    strong_students: int  # score >= 75


class PlatformAnalyticsOut(BaseModel):
    total_colleges: int
    total_students: int
    total_resumes: int
    total_scores: int
    platform_avg_ats: float


class UserPermissionUpdate(BaseModel):
    user_id: int
    role: str
    is_active: bool


class TenantCreate(BaseModel):
    name: str
    slug: str
    domain: str
    admin_password: str


class AssignAdminRequest(BaseModel):
    user_id: int
    tenant_id: int


class PlatformFeedbackCreate(BaseModel):
    message: str


class PlatformFeedbackOut(BaseModel):
    id: int
    tenant_name: str
    user_email: str
    role: str
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True