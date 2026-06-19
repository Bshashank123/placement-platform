"""
Resumes Router — Module 3
POST /resumes/upload         → upload + parse PDF
GET  /resumes/               → list my resumes
GET  /resumes/{id}           → get resume detail (sections + bullets)
DELETE /resumes/{id}         → delete resume
PATCH /resumes/{id}/primary  → set as primary resume
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, UserRole, ResumeSection, ResumeBullet
from app.schemas.resume import (
    ResumeOut, ResumeDetailOut, ResumeUploadResponse
)
from app.services import resume_service

router = APIRouter(prefix="/resumes", tags=["Resumes — Module 3"])


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=202,
    summary="Upload and parse a PDF resume",
)
def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF resume file"),
    resume_type: str = Form(default="General",
        description="SDE | Data Science | AI/ML | General"),
    set_primary: bool = Form(default=False,
        description="Mark this as your primary resume"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Only students can upload resumes.")

    result = resume_service.upload_and_parse_resume(
        db=db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        file=file,
        background_tasks=background_tasks,
        resume_type=resume_type,
        set_primary=set_primary,
    )
    return result


@router.get(
    "/",
    response_model=list[ResumeOut],
    summary="List all my uploaded resumes",
)
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Only students can list their resumes.")
    return resume_service.list_my_resumes(db, current_user.id)


@router.get(
    "/{resume_id}",
    response_model=ResumeDetailOut,
    summary="Get resume with parsed sections and bullet points",
)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = resume_service.get_resume_by_id(
        db, resume_id, current_user.id, current_user.role, current_user.tenant_id
    )

    sections = db.query(ResumeSection).filter(
        ResumeSection.resume_id == resume_id
    ).all()

    bullets = db.query(ResumeBullet).filter(
        ResumeBullet.resume_id == resume_id
    ).all()

    # Re-extract skills from stored bullet text
    from app.services.parser import extract_skills
    all_text = " ".join([b.bullet_text for b in bullets])
    all_text += " ".join([s.content or "" for s in sections])
    detected_skills = extract_skills(all_text)

    return ResumeDetailOut(
        id=resume.id,
        student_id=resume.student_id,
        tenant_id=resume.tenant_id,
        file_name=resume.file_name,
        resume_type=resume.resume_type,
        status=resume.status,
        is_primary=resume.is_primary,
        uploaded_at=resume.uploaded_at,
        sections=sections,
        bullets=bullets,
        detected_skills=detected_skills,
    )


@router.delete(
    "/{resume_id}",
    summary="Delete a resume",
)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Only students can delete their resumes.")
    return resume_service.delete_resume(db, resume_id, current_user.id)


@router.patch(
    "/{resume_id}/primary",
    response_model=ResumeOut,
    summary="Set resume as primary",
)
def set_primary(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.student:
        raise HTTPException(403, "Only students can set their primary resume.")
    return resume_service.set_primary_resume(db, resume_id, current_user.id)


from fastapi.responses import Response

@router.get(
    "/download/{resume_id}",
    summary="Download or view the original PDF resume file",
)
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models import Resume, Student
    from app.services.s3_service import download_file_from_s3
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Not Found")
        
    # Vertical & Horizontal Privilege Escalation Prevention
    if current_user.role == UserRole.student:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or resume.student_id != student.id:
            raise HTTPException(403, "Access denied.")
    elif current_user.role != UserRole.super_admin:
        if resume.tenant_id != current_user.tenant_id:
            raise HTTPException(403, "Access denied.")
    
    try:
        file_bytes = download_file_from_s3(resume.file_path)
    except Exception as e:
        raise HTTPException(404, "File not found on server")
        
    return Response(
        content=file_bytes, 
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{resume.file_name}"'}
    )