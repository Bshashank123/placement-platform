from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import (
    User, UserRole, Faculty, Student, StudentSkill, ResumeScore
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/faculty-dash", tags=["Faculty Dashboard"])

def check_faculty(user: User = Depends(get_current_user)):
    if user.role != UserRole.faculty:
        raise HTTPException(status_code=403, detail="Faculty access required")
    return user

@router.get("/cohort", response_model=List[dict])
def get_cohort(db: Session = Depends(get_db), current_user: User = Depends(check_faculty)):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty or not faculty.department:
        return []
        
    students = db.query(Student).filter(
        Student.tenant_id == current_user.tenant_id,
        Student.department == faculty.department
    ).all()
    
    res = []
    for s in students:
        ats = 0.0
        if s.resumes and s.resumes[0].score:
            ats = s.resumes[0].score.ats_score
        
        has_offer = len(s.offers) > 0 if s.offers else False
        
        res.append({
            "id": s.id,
            "name": s.name,
            "roll_number": s.roll_number,
            "ats_score": ats,
            "has_offer": has_offer
        })
    return res

@router.get("/skills-heatmap")
def get_skills_heatmap(db: Session = Depends(get_db), current_user: User = Depends(check_faculty)):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty or not faculty.department:
        return {"skills": []}
        
    # Get top 20 skills in the department
    skills = db.query(
        StudentSkill.skill_name, 
        func.count(StudentSkill.id).label('count')
    ).join(Student).filter(
        Student.tenant_id == current_user.tenant_id,
        Student.department == faculty.department
    ).group_by(StudentSkill.skill_name).order_by(func.count(StudentSkill.id).desc()).limit(20).all()
    
    total_students = db.query(Student).filter(
        Student.tenant_id == current_user.tenant_id,
        Student.department == faculty.department
    ).count()
    
    heatmap = []
    for skill_name, count in skills:
        heatmap.append({
            "skill": skill_name,
            "count": count,
            "percentage": round((count / total_students) * 100, 1) if total_students > 0 else 0
        })
        
    return {"total_students": total_students, "heatmap": heatmap}
