"""
Resume Service — Module 3
Handles upload, storage, and retrieval of resumes.
"""

import os
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile

from app.models import Resume, ResumeSection, ResumeBullet, Student, ResumeType
from app.services.parser import parse_resume
from app.core.config import settings


ALLOWED_TYPES = {"application/pdf", "application/octet-stream"}
MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


def _get_upload_dir(tenant_id: int) -> Path:
    """Return upload directory for a tenant, creating it if needed."""
    path = Path(settings.UPLOAD_DIR) / str(tenant_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


from app.services.s3_service import upload_file_to_s3, get_s3_key
from app.services.tasks import process_resume_task

from fastapi import BackgroundTasks

def upload_and_parse_resume(
    db: Session,
    user_id: int,
    tenant_id: int,
    file: UploadFile,
    background_tasks: BackgroundTasks,
    resume_type: str = "General",
    set_primary: bool = False,
) -> dict:
    """
    Asynchronous upload + parse pipeline:
    1. Validate file
    2. Read bytes
    3. Upload to S3
    4. Store Resume record as PENDING
    5. Dispatch Celery Task
    """
    # ── Validate ──────────────────────────────────────────────────────────────
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")

    file_bytes = file.file.read()
    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(
            400, f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB."
        )
    if len(file_bytes) < 100:
        raise HTTPException(400, "File appears to be empty or corrupt.")

    # ── Get student ───────────────────────────────────────────────────────────
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(404, "Student profile not found.")

    # ── Upload file to S3 ─────────────────────────────────────────────────────
    s3_key = get_s3_key(tenant_id, student.id, file.filename)
    try:
        upload_file_to_s3(file_bytes, s3_key)
    except Exception as e:
        raise HTTPException(500, f"Failed to upload to S3: {str(e)}")

    # ── If set_primary, unset existing primary ────────────────────────────────
    if set_primary:
        db.query(Resume).filter(
            Resume.student_id == student.id,
            Resume.is_primary == True
        ).update({"is_primary": False})

    # ── Create Resume record (PENDING) ────────────────────────────────────────
    try:
        resume_type_enum = ResumeType(resume_type)
    except ValueError:
        resume_type_enum = ResumeType.general

    from app.models import ResumeStatus
    resume = Resume(
        student_id=student.id,
        tenant_id=tenant_id,
        file_path=s3_key,  # Now storing S3 Key
        file_name=file.filename,
        resume_type=resume_type_enum,
        status=ResumeStatus.pending,
        is_primary=set_primary,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # ── Dispatch Background Task ──────────────────────────────────────────────
    background_tasks.add_task(process_resume_task, resume.id)

    return {
        "resume_id": resume.id,
        "status": "pending",
        "message": "Resume uploaded successfully. Processing in background."
    }


def get_resume_by_id(db: Session, resume_id: int, user_id: int, role: str, tenant_id: int) -> Resume:
    """Fetch a resume with ownership / tenant checks."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    if role != "super_admin" and resume.tenant_id != tenant_id:
        raise HTTPException(403, "Access denied.")

    if role == "student":
        student = db.query(Student).filter(Student.user_id == user_id).first()
        if not student or resume.student_id != student.id:
            raise HTTPException(403, "Access denied.")

    return resume


def list_my_resumes(db: Session, user_id: int) -> list[Resume]:
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(404, "Student profile not found.")
    return (
        db.query(Resume)
        .filter(Resume.student_id == student.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )


def delete_resume(db: Session, resume_id: int, user_id: int) -> dict:
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student or resume.student_id != student.id:
        raise HTTPException(403, "Access denied.")

    # Delete file from S3
    from app.services.s3_service import delete_file_from_s3
    delete_file_from_s3(resume.file_path)

    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted."}


def set_primary_resume(db: Session, resume_id: int, user_id: int) -> Resume:
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(404, "Student profile not found.")

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.student_id == student.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    # Unset all primary for this student
    db.query(Resume).filter(
        Resume.student_id == student.id,
        Resume.is_primary == True
    ).update({"is_primary": False})

    resume.is_primary = True
    db.commit()
    db.refresh(resume)
    return resume