from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ResumeSectionOut(BaseModel):
    id: int
    section_name: str
    content: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ResumeBulletOut(BaseModel):
    id: int
    section_name: str
    bullet_text: str
    word_count: Optional[int] = None
    has_metric: bool = False
    weak_verb: bool = False
    model_config = ConfigDict(from_attributes=True)


class ResumeOut(BaseModel):
    id: int
    student_id: int
    tenant_id: int
    file_name: str
    resume_type: str
    is_primary: bool
    status: str
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ResumeDetailOut(BaseModel):
    id: int
    student_id: int
    tenant_id: int
    file_name: str
    resume_type: str
    is_primary: bool
    status: str
    uploaded_at: datetime
    sections: list[ResumeSectionOut] = []
    bullets: list[ResumeBulletOut] = []
    detected_skills: list[str] = []
    model_config = ConfigDict(from_attributes=True)


class ResumeUploadResponse(BaseModel):
    resume_id: int
    status: str
    message: str