from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Tenant, User, Student, Resume, UserRole
from app.schemas.superadmin import (
    TenantOut, TenantCreate, TenantUpdate,
    SuperAdminAnalyticsOut, ResetPasswordRequest
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/superadmin", tags=["Super Admin"])

def check_super_admin(user: User = Depends(get_current_user)):
    if user.role != UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user

@router.get("/tenants", response_model=list[TenantOut])
def get_all_tenants(db: Session = Depends(get_db), current_user: User = Depends(check_super_admin)):
    tenants = db.query(Tenant).all()
    return tenants

@router.post("/tenants", response_model=TenantOut)
def create_tenant(tenant: TenantCreate, db: Session = Depends(get_db), current_user: User = Depends(check_super_admin)):
    new_tenant = Tenant(**tenant.model_dump())
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant

@router.put("/tenants/{tenant_id}", response_model=TenantOut)
def update_tenant(tenant_id: int, updates: TenantUpdate, db: Session = Depends(get_db), current_user: User = Depends(check_super_admin)):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(tenant, k, v)
        
    db.commit()
    db.refresh(tenant)
    return tenant

@router.get("/analytics", response_model=SuperAdminAnalyticsOut)
def get_superadmin_analytics(db: Session = Depends(get_db), current_user: User = Depends(check_super_admin)):
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.is_active == True).count()
    total_users = db.query(User).count()
    total_students = db.query(Student).count()
    total_resumes = db.query(Resume).count()
    
    return SuperAdminAnalyticsOut(
        total_tenants=total_tenants,
        total_users=total_users,
        total_students=total_students,
        total_resumes=total_resumes,
        active_tenants=active_tenants
    )

@router.post("/users/{user_id}/reset_password")
def reset_user_password(user_id: int, req: ResetPasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(check_super_admin)):
    from app.core.security import hash_password
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"detail": f"Password reset successfully for {target_user.email}"}
