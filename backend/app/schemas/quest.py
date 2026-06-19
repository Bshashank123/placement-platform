from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class QuestCreate(BaseModel):
    title: str
    description: str
    target_departments: str  # e.g., "ALL" or "CSE,ECE"
    points: int = 10

class QuestOut(BaseModel):
    id: int
    tenant_id: int
    faculty_id: int
    title: str
    description: str
    target_departments: str
    points: int
    is_active: bool
    created_at: datetime
    
    # Extra field to include completions count (for faculty) or completed status (for student)
    completion_count: Optional[int] = None
    is_completed: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

class QuestCompletionOut(BaseModel):
    id: int
    quest_id: int
    student_id: int
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)
