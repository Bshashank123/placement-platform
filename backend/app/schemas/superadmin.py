from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime

class TenantCreate(BaseModel):
    name: str
    slug: str
    domain: str
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    max_users: int = 5000
    contact_email: Optional[EmailStr] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    max_users: Optional[int] = None
    contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class TenantOut(BaseModel):
    id: int
    name: str
    slug: str
    domain: str
    contract_start_date: Optional[datetime]
    contract_end_date: Optional[datetime]
    max_users: int
    contact_email: Optional[str]
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SuperAdminAnalyticsOut(BaseModel):
    total_tenants: int
    total_users: int
    total_students: int
    total_resumes: int
    active_tenants: int

class ResetPasswordRequest(BaseModel):
    new_password: str
