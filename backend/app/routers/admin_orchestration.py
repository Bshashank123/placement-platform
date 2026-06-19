from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import (
    User, UserRole, PlacementDrive, DriveRSVP, 
    PlacementOffer, BroadcastMessage, Student, ResumeScore, StudentSkill
)
from app.schemas.orchestration import (
    PlacementDriveCreate, PlacementDriveOut, 
    PlacementOfferCreate, PlacementOfferOut,
    BroadcastMessageCreate, BroadcastMessageOut
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/admin-orch", tags=["Admin Orchestration"])

def check_admin(user: User = Depends(get_current_user)):
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ── Shortlisting ─────────────────────────────────────────────────────────────

@router.get("/shortlist", response_model=List[dict])
def generate_shortlist(
    min_cgpa: Optional[float] = Query(None),
    min_ats: Optional[float] = Query(None),
    skills: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    query = db.query(Student).filter(Student.tenant_id == current_user.tenant_id)
    
    if min_cgpa is not None:
        query = query.filter(Student.cgpa >= min_cgpa)
        
    if min_ats is not None:
        query = query.join(Student.resumes).join(ResumeScore).filter(ResumeScore.ats_score >= min_ats)
        
    if skills:
        for skill in skills:
            query = query.filter(Student.skills.any(StudentSkill.skill_name.ilike(f"%{skill}%")))
            
    students = query.all()
    
    res = []
    for s in students:
        ats = 0.0
        if s.resumes and s.resumes[0].score:
            ats = s.resumes[0].score.ats_score
        res.append({
            "id": s.id,
            "name": s.name,
            "roll_number": s.roll_number,
            "department": s.department,
            "cgpa": s.cgpa,
            "ats_score": ats,
            "skills": [sk.skill_name for sk in s.skills]
        })
    return res

# ── Placement Drives ─────────────────────────────────────────────────────────

@router.get("/drives", response_model=List[PlacementDriveOut])
def get_drives(db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    drives = db.query(PlacementDrive).filter(PlacementDrive.tenant_id == current_user.tenant_id).all()
    return drives

@router.post("/drives", response_model=PlacementDriveOut)
def create_drive(drive: PlacementDriveCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    new_drive = PlacementDrive(**drive.model_dump(), tenant_id=current_user.tenant_id)
    db.add(new_drive)
    db.commit()
    db.refresh(new_drive)
    return new_drive

# ── Placement Offers ─────────────────────────────────────────────────────────

@router.post("/offers", response_model=PlacementOfferOut)
def record_offer(offer: PlacementOfferCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    new_offer = PlacementOffer(**offer.model_dump())
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    return new_offer

@router.get("/offers", response_model=List[PlacementOfferOut])
def get_offers(db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    offers = db.query(PlacementOffer).join(Student).filter(Student.tenant_id == current_user.tenant_id).all()
    return offers

# ── Broadcast Messages ───────────────────────────────────────────────────────

@router.post("/broadcast", response_model=BroadcastMessageOut)
def send_broadcast(msg: BroadcastMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    new_msg = BroadcastMessage(
        tenant_id=current_user.tenant_id,
        sender_id=current_user.id,
        subject=msg.subject,
        body=msg.body
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg
