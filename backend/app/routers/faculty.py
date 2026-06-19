"""
Faculty Router — Module 5
GET  /faculty/students                  → list students with ATS scores
GET  /faculty/students/{id}             → single student detail
GET  /faculty/students/{id}/resumes     → student's resumes
GET  /faculty/resume/{id}               → resume detail
GET  /faculty/resume/{id}/reviews       → reviews on a resume
POST /faculty/review/{resume_id}        → leave a review
GET  /faculty/ranking/{department}      → department ranking table
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models import User, UserRole, Resume, ResumeSection, ResumeBullet, Student
from app.schemas.faculty import FacultyReviewCreate, FacultyReviewOut
from app.schemas.resume import ResumeDetailOut
from app.services import faculty_service
from app.services.parser import extract_skills

router = APIRouter(prefix="/faculty", tags=["Faculty — Module 5"])

ALLOWED = ["faculty", "admin", "super_admin"]


@router.get("/students", summary="List all students — faculty/admin only")
def list_students(
    department: str | None = None,
    branch: str | None = None,
    year: int | None = None,
    min_ats: float | None = None,
    max_ats: float | None = None,
    search: str | None = None,
    current_user: User = Depends(require_role(ALLOWED)),
    db: Session = Depends(get_db),
):
    tenant_id = current_user.tenant_id
    return faculty_service.list_students_for_faculty(
        db, tenant_id, department, branch, year, min_ats, max_ats, search
    )


@router.get("/students/{student_id}/resumes",
            summary="Get a student's resumes — faculty/admin only")
def get_student_resumes(
    student_id: int,
    current_user: User = Depends(require_role(ALLOWED)),
    db: Session = Depends(get_db),
):
    return faculty_service.get_student_resumes_for_faculty(
        db, student_id, current_user.tenant_id
    )


@router.get("/resume/{resume_id}", response_model=ResumeDetailOut,
            summary="View parsed resume detail — faculty/admin only")
def get_resume_detail(
    resume_id: int,
    current_user: User = Depends(require_role(ALLOWED)),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")
    if current_user.role != UserRole.super_admin and resume.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Access denied.")

    sections = db.query(ResumeSection).filter(
        ResumeSection.resume_id == resume_id
    ).all()
    bullets = db.query(ResumeBullet).filter(
        ResumeBullet.resume_id == resume_id
    ).all()

    all_text = " ".join([s.content or "" for s in sections])
    all_text += " ".join([b.bullet_text for b in bullets])
    detected_skills = extract_skills(all_text)

    return ResumeDetailOut(
        id=resume.id,
        student_id=resume.student_id,
        tenant_id=resume.tenant_id,
        file_name=resume.file_name,
        resume_type=resume.resume_type,
        is_primary=resume.is_primary,
        uploaded_at=resume.uploaded_at,
        sections=sections,
        bullets=bullets,
        detected_skills=detected_skills,
    )


@router.get("/resume/{resume_id}/reviews",
            summary="Get reviews on a resume")
def get_reviews(
    resume_id: int,
    current_user: User = Depends(require_role(ALLOWED)),
    db: Session = Depends(get_db),
):
    return faculty_service.get_reviews_for_resume(db, resume_id)


@router.post("/review/{resume_id}",
             summary="Leave a review on a student resume")
def leave_review(
    resume_id: int,
    payload: FacultyReviewCreate,
    current_user: User = Depends(require_role(ALLOWED)),
    db: Session = Depends(get_db),
):
    review = faculty_service.create_review(db, resume_id, current_user.id, payload)
    return {
        "id": review.id,
        "resume_id": review.resume_id,
        "comments": review.comments,
        "created_at": review.created_at,
    }


@router.get("/ranking/{department}",
            summary="Department ranking table — faculty/admin only")
def department_ranking(
    department: str,
    current_user: User = Depends(require_role(ALLOWED)),
    db: Session = Depends(get_db),
):
    return faculty_service.get_department_ranking(
        db, current_user.tenant_id, department
    )