from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models import User, Student, UserRole
from app.schemas.student import StudentProfileOut, StudentProfileUpdate, DashboardStats
from app.services import student_service
from app.services import faculty_service

router = APIRouter(prefix="/students", tags=["Students — Module 2"])


@router.get("/profile", response_model=StudentProfileOut,
            summary="Get own student profile")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Only students can access this endpoint.")
    return student_service.get_student_by_user_id(db, current_user.id)


@router.put("/profile", response_model=StudentProfileOut,
            summary="Update own student profile and skills list")
def update_my_profile(
    payload: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Only students can update a student profile.")
    return student_service.update_student_profile(db, current_user.id, payload)


@router.get("/dashboard", response_model=DashboardStats,
            summary="Get aggregated dashboard stats for current student")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Only students can access dashboard stats.")
    return student_service.get_dashboard_stats(db, current_user.id)


@router.get("/ranking", summary="Get my department ranking")
def get_my_ranking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Students only.")
    result = faculty_service.get_my_ranking(db, current_user.id)
    if not result:
        return {"message": "No ranking yet. Upload and score a resume first."}
    return result


@router.get("/reviews", summary="Get all faculty reviews across my resumes")
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Students only.")
    student = student_service.get_student_by_user_id(db, current_user.id)
    return faculty_service.get_all_reviews_for_student(db, student.id)


@router.get("/", response_model=list[StudentProfileOut],
            summary="List students in your college — faculty/admin only")
def list_students(
    department: str | None = None,
    year: int | None = None,
    current_user: User = Depends(require_role(["faculty", "admin", "super_admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Student)
    if current_user.role != UserRole.super_admin:
        query = query.filter(Student.tenant_id == current_user.tenant_id)
    if department:
        query = query.filter(Student.department == department)
    if year:
        query = query.filter(Student.year == year)
    return query.order_by(Student.name).all()


@router.get("/{student_id}/profile", response_model=StudentProfileOut,
            summary="View any student profile — faculty/admin only")
def get_student_profile(
    student_id: int,
    current_user: User = Depends(require_role(["faculty", "admin", "super_admin"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found.")
    if current_user.role != UserRole.super_admin and student.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Access denied.")
    return student