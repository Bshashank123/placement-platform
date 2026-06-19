from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import (
    Student, StudentSkill, Resume,
    ResumeScore, StudentRanking, FacultyReview, CompanyMatchScore
)
from app.schemas.student import StudentProfileUpdate, DashboardStats


def get_student_by_user_id(db: Session, user_id: int) -> Student:
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )
    return student


def update_student_profile(
    db: Session, user_id: int, payload: StudentProfileUpdate
) -> Student:
    student = get_student_by_user_id(db, user_id)

    update_fields = payload.model_dump(exclude_none=True, exclude={"skills"})
    for field, value in update_fields.items():
        setattr(student, field, value)

    if payload.skills is not None:
        db.query(StudentSkill).filter(StudentSkill.student_id == student.id).delete()
        seen = set()
        for skill_name in payload.skills:
            name = skill_name.strip()
            if name and name.lower() not in seen:
                seen.add(name.lower())
                db.add(StudentSkill(student_id=student.id, skill_name=name))

    db.commit()
    db.refresh(student)
    return student


def get_dashboard_stats(db: Session, user_id: int) -> DashboardStats:
    student = get_student_by_user_id(db, user_id)

    resumes = db.query(Resume).filter(Resume.student_id == student.id).all()
    resume_count = len(resumes)

    best_score = None
    if resumes:
        resume_ids = [r.id for r in resumes]
        best_score = (
            db.query(ResumeScore)
            .filter(ResumeScore.resume_id.in_(resume_ids))
            .order_by(ResumeScore.ats_score.desc())
            .first()
        )

    ats_score = best_score.ats_score if best_score else None

    ranking = db.query(StudentRanking).filter(
        StudentRanking.student_id == student.id
    ).first()

    rank = None
    total_in_dept = None
    percentile = None

    if ranking:
        rank = ranking.rank
        total_in_dept = db.query(StudentRanking).filter(
            StudentRanking.tenant_id == student.tenant_id,
            StudentRanking.department == ranking.department
        ).count()
        if total_in_dept and total_in_dept > 0:
            pct = round(((total_in_dept - rank) / total_in_dept) * 100)
            percentile = f"Top {100 - pct}%"

    company_match_count = db.query(CompanyMatchScore).filter(
        CompanyMatchScore.student_id == student.id
    ).count()

    faculty_review_count = 0
    if resumes:
        resume_ids = [r.id for r in resumes]
        faculty_review_count = db.query(FacultyReview).filter(
            FacultyReview.resume_id.in_(resume_ids)
        ).count()

    top_tip = None
    if best_score:
        categories = {
            "Add measurable metrics to your bullet points": best_score.impact_score / 40 if best_score.impact_score else 0,
            "Ensure all required sections are present": best_score.sections_score / 20 if best_score.sections_score else 0,
            "Use stronger action verbs in your bullets": best_score.brevity_score / 20 if best_score.brevity_score else 0,
            "Improve formatting and consistency": best_score.style_score / 20 if best_score.style_score else 0,
        }
        top_tip = min(categories, key=categories.get)

    return DashboardStats(
        ats_score=ats_score,
        rank=rank,
        total_in_dept=total_in_dept,
        percentile=percentile,
        resume_count=resume_count,
        company_match_count=company_match_count,
        faculty_review_count=faculty_review_count,
        top_ats_improvement=top_tip,
        impact_score=round((best_score.impact_score / 30) * 100, 1) if best_score else None,
        skills_score=round((best_score.skills_score / 25) * 100, 1) if best_score else None,
        structure_score=round((best_score.structure_score / 20) * 100, 1) if best_score else None,
        format_score=round((best_score.format_score / 15) * 100, 1) if best_score else None,
        brevity_score=round((best_score.brevity_score / 10) * 100, 1) if best_score else None,
    )