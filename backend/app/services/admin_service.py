"""
Admin Service — Module 6
College Admin analytics + Platform (Super) Admin management.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models import (
    Student, Resume, ResumeScore, StudentRanking,
    Tenant, User, Faculty, CollegeAdmin, UserRole
)


# ── College Admin analytics ───────────────────────────────────────────────────

def get_department_analytics(db: Session, tenant_id: int) -> list[dict]:
    """Per-department ATS score breakdown."""
    students = db.query(Student).filter(Student.tenant_id == tenant_id).all()

    dept_map: dict[str, dict] = {}
    for s in students:
        dept = s.department or "Unassigned"
        if dept not in dept_map:
            dept_map[dept] = {
                "department": dept,
                "total_students": 0,
                "scores": [],
            }
        dept_map[dept]["total_students"] += 1

        # Get best ATS score
        resume_ids = [r.id for r in db.query(Resume.id).filter(
            Resume.student_id == s.id
        ).all()]
        if resume_ids:
            best = db.query(ResumeScore).filter(
                ResumeScore.resume_id.in_(resume_ids)
            ).order_by(ResumeScore.ats_score.desc()).first()
            if best:
                dept_map[dept]["scores"].append(best.ats_score)

    result = []
    for dept, data in dept_map.items():
        scores = data["scores"]
        result.append({
            "department": dept,
            "total_students": data["total_students"],
            "scored_students": len(scores),
            "avg_ats_score": round(sum(scores) / len(scores), 1) if scores else 0.0,
            "top_score": max(scores) if scores else 0.0,
            "weak_students": sum(1 for s in scores if s < 50),
            "strong_students": sum(1 for s in scores if s >= 75),
        })

    return sorted(result, key=lambda x: x["avg_ats_score"], reverse=True)


def get_platform_analytics(db: Session) -> dict:
    """Super admin platform-wide stats."""
    total_colleges  = db.query(Tenant).filter(Tenant.is_active == True).count()
    total_students  = db.query(Student).count()
    total_resumes   = db.query(Resume).count()
    total_scores    = db.query(ResumeScore).count()

    avg = db.query(func.avg(ResumeScore.ats_score)).scalar() or 0.0

    return {
        "total_colleges": total_colleges,
        "total_students": total_students,
        "total_resumes": total_resumes,
        "total_scores": total_scores,
        "platform_avg_ats": round(avg, 1),
    }


# ── Platform Admin — tenant + user management ─────────────────────────────────

def list_tenants(db: Session) -> list[Tenant]:
    return db.query(Tenant).order_by(Tenant.name).all()


def list_users_in_tenant(db: Session, tenant_id: int) -> list[dict]:
    users = db.query(User).filter(User.tenant_id == tenant_id).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at,
        })
    return result


def update_user_permission(
    db: Session,
    user_id: int,
    role: str,
    is_active: bool,
    requesting_user_id: int,
) -> dict:
    if user_id == requesting_user_id:
        raise HTTPException(400, "You cannot modify your own permissions.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found.")

    try:
        new_role = UserRole(role)
    except ValueError:
        raise HTTPException(400, f"Invalid role: {role}")

    user.role = new_role
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role, "is_active": user.is_active}


from app.core.security import hash_password
from app.models import PlatformFeedback

def create_tenant(db: Session, name: str, slug: str, domain: str, admin_password: str) -> Tenant:
    clash = db.query(Tenant).filter(
        (Tenant.slug == slug) | (Tenant.domain == domain)
    ).first()
    if clash:
        raise HTTPException(409, "Slug or domain already in use.")
        
    tenant = Tenant(name=name, slug=slug, domain=domain)
    db.add(tenant)
    db.flush() # flush to get tenant.id
    
    # Create the admin user
    admin_email = f"admin@{domain}"
    hashed_pwd = hash_password(admin_password)
    user = User(
        tenant_id=tenant.id,
        email=admin_email,
        password_hash=hashed_pwd,
        role=UserRole.admin,
        is_verified=True,
        requires_password_change=True
    )
    db.add(user)
    db.flush()
    
    # Assign college admin
    ca = CollegeAdmin(user_id=user.id, tenant_id=tenant.id)
    db.add(ca)
    
    db.commit()
    db.refresh(tenant)
    return tenant

def submit_feedback(db: Session, user_id: int, tenant_id: int, role: str, message: str) -> PlatformFeedback:
    fb = PlatformFeedback(tenant_id=tenant_id, user_id=user_id, role=role, message=message)
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb

def get_platform_feedback(db: Session) -> list[dict]:
    feedbacks = db.query(PlatformFeedback).order_by(PlatformFeedback.created_at.desc()).all()
    result = []
    for f in feedbacks:
        result.append({
            "id": f.id,
            "tenant_name": f.tenant.name if f.tenant else "Unknown",
            "user_email": f.user.email if f.user else "Unknown",
            "role": f.role,
            "message": f.message,
            "created_at": f.created_at
        })
    return result


def assign_college_admin(db: Session, user_id: int, tenant_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found.")

    user.role = UserRole.admin
    user.tenant_id = tenant_id

    existing = db.query(CollegeAdmin).filter(CollegeAdmin.user_id == user_id).first()
    if not existing:
        db.add(CollegeAdmin(user_id=user_id, tenant_id=tenant_id))

    db.commit()
    return {"message": f"User {user.email} assigned as admin of tenant {tenant_id}."}