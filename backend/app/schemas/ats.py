from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SuggestionOut(BaseModel):
    id: int
    category: str
    suggestion_text: str
    priority: int
    model_config = ConfigDict(from_attributes=True)


class ATSScoreOut(BaseModel):
    resume_id: int
    ats_score: float
    impact_score: float
    brevity_score: float
    style_score: float
    sections_score: float
    calculated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ATSResultOut(BaseModel):
    score: ATSScoreOut
    suggestions: list[SuggestionOut]
    # Breakdown percentages for heatmap (0-100)
    impact_pct:    float
    brevity_pct:   float
    style_pct:     float
    sections_pct:  float
    grade: str          # A / B / C / D / F
    summary: str        # one-line verdict


class BulkScoreRequest(BaseModel):
    resume_ids: list[int]