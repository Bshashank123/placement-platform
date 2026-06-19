import logging

from app.database import SessionLocal
from app.models import Resume, ResumeStatus, ResumeSection, ResumeBullet
from app.services.parser import parse_resume
from app.services.s3_service import download_file_from_s3
from app.services.ats_engine import run_ats_scoring, _recalculate_ranking

logger = logging.getLogger(__name__)

def process_resume_task(resume_id: int):
    db = SessionLocal()
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            logger.error(f"Resume {resume_id} not found.")
            return

        # 1. Download file from S3
        file_bytes = download_file_from_s3(resume.file_path)

        # 2. Parse PDF
        parsed = parse_resume(file_bytes)

        # 3. Store sections and bullets
        for section in parsed.sections:
            if section.name == "header":
                continue
            db.add(ResumeSection(
                resume_id=resume.id,
                section_name=section.name,
                content=section.content[:5000] if section.content else "",
            ))

        for bullet in parsed.bullets:
            db.add(ResumeBullet(
                resume_id=resume.id,
                section_name=bullet.section_name,
                bullet_text=bullet.bullet_text[:1000],
                word_count=bullet.word_count,
                has_metric=bullet.has_metric,
                weak_verb=bullet.weak_verb,
            ))
        db.flush()

        # 4. Run ATS Scoring
        run_ats_scoring(db, resume.id)

        # 5. Mark as completed
        resume.status = ResumeStatus.completed
        db.commit()

        # Dispatch ranking recalculation
        recalculate_ranking_task(resume.student_id, resume.tenant_id)

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to process resume {resume_id}: {str(e)}")
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            resume.status = ResumeStatus.failed
            db.commit()
    finally:
        db.close()


def recalculate_ranking_task(student_id: int, tenant_id: int):
    db = SessionLocal()
    try:
        _recalculate_ranking(db, student_id, tenant_id)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to recalculate ranking for student {student_id}: {str(e)}")
    finally:
        db.close()
