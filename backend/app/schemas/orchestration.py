from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PlacementDriveCreate(BaseModel):
    company_id: int
    title: str
    description: Optional[str] = None
    drive_date: datetime
    location: Optional[str] = None
    eligibility_cgpa: Optional[float] = None
    eligibility_ats_score: Optional[float] = None

class PlacementDriveOut(BaseModel):
    id: int
    tenant_id: int
    company_id: int
    title: str
    description: Optional[str] = None
    drive_date: datetime
    location: Optional[str] = None
    eligibility_cgpa: Optional[float] = None
    eligibility_ats_score: Optional[float] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DriveRSVPUpdate(BaseModel):
    status: str # "pending", "attending", "skipped"

class PlacementOfferCreate(BaseModel):
    student_id: int
    company_id: int
    role: str
    ctc_lpa: float
    accepted: bool = True

class PlacementOfferOut(BaseModel):
    id: int
    student_id: int
    company_id: int
    role: str
    ctc_lpa: float
    accepted: bool
    offered_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BroadcastMessageCreate(BaseModel):
    subject: str
    body: str

class BroadcastMessageOut(BaseModel):
    id: int
    tenant_id: int
    sender_id: int
    subject: str
    body: str
    sent_at: datetime
    model_config = ConfigDict(from_attributes=True)
