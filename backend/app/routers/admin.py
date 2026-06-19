"""
Admin Router — Module 6
College Admin:   POST /admin/company, GET /admin/analytics, GET /admin/companies
Platform Admin:  GET /platform/tenants, POST /platform/tenant
                 GET /platform/users/{tenant_id}, PUT /platform/user-permission
                 POST /platform/assign-admin
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models import User, UserRole, Tenant
from app.schemas.admin import (
    CompanyCreate, CompanyOut,
    DepartmentAnalyticsOut, PlatformAnalyticsOut,
    UserPermissionUpdate, TenantCreate, AssignAdminRequest,
)
from app.services import company_service, admin_service

# ── College Admin router ──────────────────────────────────────────────────────
admin_router = APIRouter(prefix="/admin", tags=["Admin — Module 6"])

# ── Platform (Super) Admin router ─────────────────────────────────────────────
platform_router = APIRouter(prefix="/platform", tags=["Platform Admin — Module 6"])


# ═══════════════════════════════════════════════════════════════
# COLLEGE ADMIN
# ═══════════════════════════════════════════════════════════════

@admin_router.post("/company", summary="Add a company — admin only")
def add_company(
    payload: CompanyCreate,
    current_user: User = Depends(require_role(["admin", "super_admin"])),
    db: Session = Depends(get_db),
):
    company = company_service.create_company(db, current_user.tenant_id, payload)
    skills = [s.skill_name for s in company.required_skills]
    return {
        "id": company.id,
        "name": company.name,
        "role": company.role,
        "min_cgpa": company.min_cgpa,
        "min_projects": company.min_projects,
        "required_skills": skills,
    }


from fastapi import UploadFile, File
import csv
import io

@admin_router.post("/students/bulk-upload", summary="Bulk upload students via CSV")
def bulk_upload_students(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["admin", "super_admin"])),
    db: Session = Depends(get_db),
):
    from app.core.security import hash_password
    from app.models import Student
    
    contents = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(contents))
    
    created_count = 0
    default_password = hash_password("Welcome@123")
    
    for row in reader:
        email = row.get("email", "").strip().lower()
        name = row.get("name", "").strip()
        mobile = row.get("mobile_number", "").strip() or None
        
        if not email or not name:
            continue
            
        # Check if user exists
        if db.query(User).filter(User.email == email).first():
            continue
            
        user = User(
            tenant_id=current_user.tenant_id,
            email=email,
            password_hash=default_password,
            role=UserRole.student,
            is_verified=False,
            requires_password_change=True,
            mobile_number=mobile,
        )
        db.add(user)
        db.flush()
        
        student = Student(user_id=user.id, tenant_id=current_user.tenant_id, name=name)
        db.add(student)
        created_count += 1
        
    db.commit()
    return {"message": f"Successfully onboarded {created_count} students."}


@admin_router.get("/companies", summary="List companies — admin only")
def list_companies(
    current_user: User = Depends(require_role(["admin", "super_admin"])),
    db: Session = Depends(get_db),
):
    return company_service.get_companies(db, current_user.tenant_id)


@admin_router.delete("/company/{company_id}", summary="Delete a company")
def delete_company(
    company_id: int,
    current_user: User = Depends(require_role(["admin", "super_admin"])),
    db: Session = Depends(get_db),
):
    return company_service.delete_company(db, company_id, current_user.tenant_id)


@admin_router.get("/analytics", summary="Department analytics — admin only")
def get_analytics(
    current_user: User = Depends(require_role(["admin", "faculty", "super_admin"])),
    db: Session = Depends(get_db),
):
    return admin_service.get_department_analytics(db, current_user.tenant_id)


# ═══════════════════════════════════════════════════════════════
# STUDENT — COMPANY MATCHES (placed here so it can use company service)
# ═══════════════════════════════════════════════════════════════

@admin_router.get("/matches/me", summary="Get company matches for current student")
def get_my_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models import Student
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Students only.")
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found.")
    return company_service.get_matches_for_student(db, student.id, current_user.tenant_id)


# ═══════════════════════════════════════════════════════════════
# PLATFORM SUPER ADMIN
# ═══════════════════════════════════════════════════════════════

@platform_router.get("/analytics", summary="Platform-wide analytics — super_admin only")
def platform_analytics(
    _=Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    return admin_service.get_platform_analytics(db)


@platform_router.get("/tenants", summary="List all colleges — super_admin only")
def list_tenants(
    _=Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    tenants = admin_service.list_tenants(db)
    return [{"id": t.id, "name": t.name, "slug": t.slug,
             "domain": t.domain, "is_active": t.is_active} for t in tenants]


@platform_router.post("/tenant", summary="Create a new college — super_admin only")
def create_tenant(
    payload: TenantCreate,
    _=Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    t = admin_service.create_tenant(db, payload.name, payload.slug, payload.domain, payload.admin_password)
    return {"id": t.id, "name": t.name, "slug": t.slug, "domain": t.domain}

from app.schemas.admin import PlatformFeedbackCreate, PlatformFeedbackOut

@platform_router.post("/feedback", summary="Submit platform feedback")
def submit_feedback(
    payload: PlatformFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fb = admin_service.submit_feedback(
        db, current_user.id, current_user.tenant_id, current_user.role.value, payload.message
    )
    return {"message": "Feedback submitted successfully.", "id": fb.id}

@platform_router.get("/feedback", response_model=list[PlatformFeedbackOut], summary="List all feedback — super_admin only")
def get_feedback(
    _=Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    return admin_service.get_platform_feedback(db)


@platform_router.patch("/tenant/{tenant_id}/deactivate",
                        summary="Deactivate a college — super_admin only")
def deactivate_tenant(
    tenant_id: int,
    _=Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(404, "Tenant not found.")
    t.is_active = False
    db.commit()
    return {"message": f"Tenant '{t.name}' deactivated."}


@platform_router.get("/users/{tenant_id}",
                      summary="List all users in a college — super_admin only")
def list_users(
    tenant_id: int,
    _=Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    return admin_service.list_users_in_tenant(db, tenant_id)


@platform_router.put("/user-permission",
                      summary="Update user role and active status — super_admin only")
def update_permission(
    payload: UserPermissionUpdate,
    current_user: User = Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    return admin_service.update_user_permission(
        db, payload.user_id, payload.role, payload.is_active, current_user.id
    )


@platform_router.post("/assign-admin",
                       summary="Assign a user as college admin — super_admin only")
def assign_admin(
    payload: AssignAdminRequest,
    _=Depends(require_role(["super_admin"])),
    db: Session = Depends(get_db),
):
    return admin_service.assign_college_admin(db, payload.user_id, payload.tenant_id)