from app.core.celery_app import celery_app
from app.database import SessionLocal
from app.services.ats_engine import run_ats_scoring

@celery_app.task(bind=True, name="score_resume_task")
def score_resume_task(self, resume_id: int):
    """
    Background task to run ATS scoring on a resume.
    """
    db = SessionLocal()
    try:
        run_ats_scoring(db, resume_id)
        return {"status": "success", "resume_id": resume_id}
    except Exception as e:
        # In a real app, you might want to log this or update a status column
        return {"status": "error", "resume_id": resume_id, "detail": str(e)}
    finally:
        db.close()
