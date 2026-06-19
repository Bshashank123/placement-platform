"""
ATS Router — Module 4
POST /ats/{resume_id}/score    → score a resume
GET  /ats/{resume_id}/score    → get existing score
GET  /ats/{resume_id}/suggestions → get improvement suggestions
POST /ats/score-all            → score all my resumes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    User, UserRole, Resume, ResumeScore,
    ResumeSuggestion, Student
)
from app.schemas.ats import ATSResultOut, ATSScoreOut, SuggestionOut
from app.services.ats_engine import run_ats_scoring

router = APIRouter(prefix="/ats", tags=["ATS Scoring — Module 4"])


def _build_result(resume_id: int, db: Session) -> ATSResultOut:
    score = db.query(ResumeScore).filter(
        ResumeScore.resume_id == resume_id
    ).first()
    if not score:
        raise HTTPException(404, "No ATS score found. Run scoring first.")

    suggestions = (
        db.query(ResumeSuggestion)
        .filter(ResumeSuggestion.resume_id == resume_id)
        .order_by(ResumeSuggestion.priority)
        .all()
    )

    grade = _grade(score.ats_score)
    summary = _summary(score.ats_score)

    return ATSResultOut(
        score=score,
        suggestions=suggestions,
        impact_pct=round((score.impact_score    / 40) * 100, 1),
        brevity_pct=round((score.brevity_score  / 25) * 100, 1),
        style_pct=round((score.style_score      / 20) * 100, 1),
        sections_pct=round((score.sections_score / 15) * 100, 1),
        grade=grade,
        summary=summary,
    )


def _grade(score: float) -> str:
    if score >= 85: return "A"
    if score >= 70: return "B"
    if score >= 55: return "C"
    if score >= 40: return "D"
    return "F"


def _summary(score: float) -> str:
    if score >= 85: return "Excellent resume — strong chance of passing ATS filters."
    if score >= 70: return "Good resume — likely to pass most ATS systems with minor improvements."
    if score >= 55: return "Average resume — needs work before applying to competitive roles."
    if score >= 40: return "Weak resume — significant improvements needed across multiple areas."
    return "Resume needs major rework — most ATS systems will likely reject it."


from app.worker.tasks import score_resume_task
from app.core.config import settings

@router.post(
    "/{resume_id}/score",
    summary="Score a resume — runs full ATS engine",
)
def score_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ownership check
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    if current_user.role == UserRole.student:
        student = db.query(Student).filter(
            Student.user_id == current_user.id
        ).first()
        if not student or resume.student_id != student.id:
            raise HTTPException(403, "Access denied.")

    if settings.LOCAL_DEV_MODE:
        run_ats_scoring(db, resume_id)
        return {"status": "completed", "resume_id": resume_id}
    else:
        task = score_resume_task.delay(resume_id)
        return {"status": "processing", "task_id": task.id, "resume_id": resume_id}


@router.get(
    "/score-status/{task_id}",
    summary="Check the status of a background scoring task"
)
def get_score_status(task_id: str):
    from app.core.celery_app import celery_app
    task_result = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }


@router.get(
    "/{resume_id}/score",
    response_model=ATSResultOut,
    summary="Get existing ATS score for a resume",
)
def get_score(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    if current_user.role == UserRole.student:
        student = db.query(Student).filter(
            Student.user_id == current_user.id
        ).first()
        if not student or resume.student_id != student.id:
            raise HTTPException(403, "Access denied.")

    return _build_result(resume_id, db)


@router.get(
    "/{resume_id}/suggestions",
    response_model=list[SuggestionOut],
    summary="Get improvement suggestions for a resume",
)
def get_suggestions(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    return (
        db.query(ResumeSuggestion)
        .filter(ResumeSuggestion.resume_id == resume_id)
        .order_by(ResumeSuggestion.priority)
        .all()
    )


@router.post(
    "/score-all",
    summary="Score all my resumes at once",
)
def score_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Students only.")

    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()
    if not student:
        raise HTTPException(404, "Student profile not found.")

    resumes = db.query(Resume).filter(
        Resume.student_id == student.id
    ).all()

    results = []
    for r in resumes:
        if settings.LOCAL_DEV_MODE:
            try:
                run_ats_scoring(db, r.id)
                results.append({"resume_id": r.id, "status": "completed"})
            except Exception as e:
                results.append({"resume_id": r.id, "status": "error", "detail": str(e)})
        else:
            task = score_resume_task.delay(r.id)
            results.append({"resume_id": r.id, "status": "processing", "task_id": task.id})

    return {"processed": len(results), "results": results}