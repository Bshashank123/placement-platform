"""
Faculty Service — Module 5
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models import (
    Student, StudentSkill, Resume, ResumeScore,
    Faculty, FacultyReview, StudentRanking, User
)
from app.schemas.faculty import (
    FacultyReviewCreate, StudentSummaryOut, RankingOut, MyRankingOut
)


# ── Faculty profile lookup ────────────────────────────────────────────────────

def get_faculty_by_user_id(db: Session, user_id: int) -> Faculty:
    faculty = db.query(Faculty).filter(Faculty.user_id == user_id).first()
    if not faculty:
        raise HTTPException(404, "Faculty profile not found.")
    return faculty


# ── Student listing with ATS scores ──────────────────────────────────────────

def list_students_for_faculty(
    db: Session,
    tenant_id: int,
    department: str | None = None,
    branch: str | None = None,
    year: int | None = None,
    min_ats: float | None = None,
    max_ats: float | None = None,
    search: str | None = None,
) -> list[dict]:
    """
    Return enriched student list with best ATS score attached.
    Faculty only see students from their own college (tenant).
    """
    query = db.query(Student).filter(Student.tenant_id == tenant_id)

    if department:
        query = query.filter(Student.department == department)
    if branch:
        query = query.filter(Student.branch == branch)
    if year:
        query = query.filter(Student.year == year)
    if search:
        query = query.filter(Student.name.ilike(f"%{search}%"))

    students = query.order_by(Student.name).all()

    result = []
    for s in students:
        # Get best ATS score
        resume_ids = [r.id for r in db.query(Resume.id).filter(Resume.student_id == s.id).all()]
        best_score = None
        if resume_ids:
            score_row = (
                db.query(ResumeScore)
                .filter(ResumeScore.resume_id.in_(resume_ids))
                .order_by(ResumeScore.ats_score.desc())
                .first()
            )
            if score_row:
                best_score = score_row.ats_score

        # Apply ATS filter
        if min_ats is not None and (best_score is None or best_score < min_ats):
            continue
        if max_ats is not None and best_score is not None and best_score > max_ats:
            continue

        skills = [sk.skill_name for sk in db.query(StudentSkill).filter(
            StudentSkill.student_id == s.id
        ).limit(8).all()]

        result.append({
            "id": s.id,
            "name": s.name,
            "roll_number": s.roll_number,
            "department": s.department,
            "branch": s.branch,
            "year": s.year,
            "cgpa": s.cgpa,
            "ats_score": best_score,
            "resume_count": len(resume_ids),
            "skills": skills,
        })

    # Sort the resulting list by ats_score descending, so it serves as a ranking
    result.sort(key=lambda x: x["ats_score"] or -1.0, reverse=True)

    return result


# ── Faculty resume view ───────────────────────────────────────────────────────

def get_student_resumes_for_faculty(
    db: Session, student_id: int, faculty_tenant_id: int
) -> list[Resume]:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found.")
    if student.tenant_id != faculty_tenant_id:
        raise HTTPException(403, "Access denied.")
    return (
        db.query(Resume)
        .filter(Resume.student_id == student_id)
        .order_by(Resume.is_primary.desc(), Resume.uploaded_at.desc())
        .all()
    )


# ── Faculty review ────────────────────────────────────────────────────────────

def create_review(
    db: Session,
    resume_id: int,
    faculty_user_id: int,
    payload: FacultyReviewCreate,
) -> FacultyReview:
    faculty = get_faculty_by_user_id(db, faculty_user_id)

    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    # Tenant check — faculty can only review resumes in their college
    if resume.tenant_id != faculty.tenant_id:
        raise HTTPException(403, "Access denied.")

    review = FacultyReview(
        resume_id=resume_id,
        faculty_id=faculty.id,
        comments=payload.comments.strip(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_reviews_for_resume(db: Session, resume_id: int) -> list[dict]:
    reviews = (
        db.query(FacultyReview)
        .filter(FacultyReview.resume_id == resume_id)
        .order_by(FacultyReview.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        faculty = db.query(Faculty).filter(Faculty.id == r.faculty_id).first()
        result.append({
            "id": r.id,
            "resume_id": r.resume_id,
            "faculty_id": r.faculty_id,
            "comments": r.comments,
            "created_at": r.created_at,
            "faculty_name": faculty.name if faculty else "Unknown",
            "faculty_designation": faculty.designation if faculty else None,
        })
    return result


def get_all_reviews_for_student(db: Session, student_id: int) -> list[dict]:
    """Get all faculty reviews across all resumes for a student."""
    resume_ids = [
        r.id for r in db.query(Resume.id)
        .filter(Resume.student_id == student_id).all()
    ]
    if not resume_ids:
        return []

    reviews = (
        db.query(FacultyReview)
        .filter(FacultyReview.resume_id.in_(resume_ids))
        .order_by(FacultyReview.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        faculty = db.query(Faculty).filter(Faculty.id == r.faculty_id).first()
        resume  = db.query(Resume).filter(Resume.id == r.resume_id).first()
        result.append({
            "id": r.id,
            "resume_id": r.resume_id,
            "resume_name": resume.file_name if resume else "Unknown",
            "faculty_id": r.faculty_id,
            "comments": r.comments,
            "created_at": r.created_at,
            "faculty_name": faculty.name if faculty else "Unknown",
            "faculty_designation": faculty.designation if faculty else None,
        })
    return result


# ── Ranking service (used by both student + faculty views) ───────────────────

def get_department_ranking(
    db: Session, tenant_id: int, department: str
) -> list[dict]:
    rankings = (
        db.query(StudentRanking)
        .filter(
            StudentRanking.tenant_id  == tenant_id,
            StudentRanking.department == department,
        )
        .order_by(StudentRanking.rank)
        .all()
    )
    result = []
    for r in rankings:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        result.append({
            "rank": r.rank,
            "student_id": r.student_id,
            "student_name": student.name if student else "Unknown",
            "department": r.department,
            "ats_score": r.ats_score,
        })
    return result


def get_my_ranking(db: Session, user_id: int) -> dict | None:
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        return None

    ranking = db.query(StudentRanking).filter(
        StudentRanking.student_id == student.id
    ).first()
    if not ranking:
        return None

    # Total in department
    total = db.query(StudentRanking).filter(
        StudentRanking.tenant_id  == student.tenant_id,
        StudentRanking.department == ranking.department,
    ).count()

    # Department average
    avg_result = db.query(func.avg(StudentRanking.ats_score)).filter(
        StudentRanking.tenant_id  == student.tenant_id,
        StudentRanking.department == ranking.department,
    ).scalar() or 0.0

    # Students above this student
    students_above = ranking.rank - 1

    # Points to next rank
    points_to_next = None
    if ranking.rank > 1:
        next_rank = db.query(StudentRanking).filter(
            StudentRanking.tenant_id  == student.tenant_id,
            StudentRanking.department == ranking.department,
            StudentRanking.rank       == ranking.rank - 1,
        ).first()
        if next_rank:
            points_to_next = round(next_rank.ats_score - ranking.ats_score, 1)

    # Top 20% threshold
    top_20_threshold = None
    if total > 0:
        top_20_pos = max(1, int(total * 0.20))
        top_20_entry = db.query(StudentRanking).filter(
            StudentRanking.tenant_id  == student.tenant_id,
            StudentRanking.department == ranking.department,
        ).order_by(StudentRanking.rank).offset(top_20_pos - 1).first()
        if top_20_entry:
            top_20_threshold = top_20_entry.ats_score

    pct = round(((total - ranking.rank) / total) * 100) if total > 0 else 0

    return {
        "rank": ranking.rank,
        "total": total,
        "department": ranking.department,
        "ats_score": ranking.ats_score,
        "percentile": f"Top {100 - pct}%",
        "above_avg": round(ranking.ats_score - avg_result, 1),
        "dept_avg": round(avg_result, 1),
        "students_above_you": students_above,
        "points_to_next_rank": points_to_next,
        "top_20_threshold": top_20_threshold,
    }