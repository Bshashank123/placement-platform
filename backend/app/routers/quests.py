from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models import User, UserRole, Faculty, Student, SkillQuest, QuestCompletion
from app.schemas.quest import QuestCreate, QuestOut, QuestCompletionOut

router = APIRouter(prefix="/quests", tags=["Skill Quests"])

@router.post("/faculty", response_model=QuestOut, summary="Create a new Skill Quest (Faculty only)")
def create_quest(
    payload: QuestCreate,
    current_user: User = Depends(require_role(["faculty", "admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty and current_user.role == UserRole.faculty:
        raise HTTPException(404, "Faculty profile not found.")
    
    faculty_id = faculty.id if faculty else 0 # fallback for admin if needed, but primarily faculty
    if not faculty:
        # If admin is creating, we might need a fallback or block. For now, block if no faculty profile.
        raise HTTPException(status_code=403, detail="Only faculty can create quests currently.")

    quest = SkillQuest(
        tenant_id=current_user.tenant_id,
        faculty_id=faculty_id,
        title=payload.title,
        description=payload.description,
        target_departments=payload.target_departments,
        points=payload.points
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return quest

@router.get("/faculty", response_model=List[QuestOut], summary="Get all quests created by faculty")
def get_faculty_quests(
    current_user: User = Depends(require_role(["faculty", "admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    quests = db.query(SkillQuest).filter(SkillQuest.tenant_id == current_user.tenant_id).order_by(SkillQuest.created_at.desc()).all()
    
    result = []
    for q in quests:
        count = db.query(QuestCompletion).filter(QuestCompletion.quest_id == q.id).count()
        # Create a dict first to avoid Pydantic validation issues with adding dynamic fields to SQLAlchemy model directly
        quest_data = {
            "id": q.id,
            "tenant_id": q.tenant_id,
            "faculty_id": q.faculty_id,
            "title": q.title,
            "description": q.description,
            "target_departments": q.target_departments,
            "points": q.points,
            "is_active": q.is_active,
            "created_at": q.created_at,
            "completion_count": count
        }
        result.append(quest_data)
        
    return result

@router.get("/student", response_model=List[QuestOut], summary="Get applicable quests for student")
def get_student_quests(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found.")

    # Get active quests for this tenant
    all_quests = db.query(SkillQuest).filter(
        SkillQuest.tenant_id == current_user.tenant_id,
        SkillQuest.is_active == True
    ).order_by(SkillQuest.created_at.desc()).all()

    # Filter by department
    applicable_quests = []
    for q in all_quests:
        targets = [t.strip().upper() for t in q.target_departments.split(",")]
        if "ALL" in targets or (student.department and student.department.upper() in targets):
            applicable_quests.append(q)

    # Attach completion status
    result = []
    for q in applicable_quests:
        is_completed = db.query(QuestCompletion).filter(
            QuestCompletion.quest_id == q.id,
            QuestCompletion.student_id == student.id
        ).first() is not None
        
        quest_data = {
            "id": q.id,
            "tenant_id": q.tenant_id,
            "faculty_id": q.faculty_id,
            "title": q.title,
            "description": q.description,
            "target_departments": q.target_departments,
            "points": q.points,
            "is_active": q.is_active,
            "created_at": q.created_at,
            "is_completed": is_completed
        }
        result.append(quest_data)

    return result

@router.post("/student/{quest_id}/complete", summary="Mark a quest as completed")
def complete_quest(
    quest_id: int,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found.")

    quest = db.query(SkillQuest).filter(SkillQuest.id == quest_id).first()
    if not quest or quest.tenant_id != current_user.tenant_id or not quest.is_active:
        raise HTTPException(404, "Quest not found or inactive.")

    # Verify department eligibility
    targets = [t.strip().upper() for t in quest.target_departments.split(",")]
    if "ALL" not in targets and (not student.department or student.department.upper() not in targets):
        raise HTTPException(403, "Quest is not applicable to your department.")

    # Check if already completed
    existing = db.query(QuestCompletion).filter(
        QuestCompletion.quest_id == quest_id,
        QuestCompletion.student_id == student.id
    ).first()
    if existing:
        return {"message": "Quest already completed."}

    completion = QuestCompletion(
        quest_id=quest_id,
        student_id=student.id
    )
    db.add(completion)

    # Add points to ATS Score and recalculate ranks
    from app.models.analytics import StudentRanking
    ranking = db.query(StudentRanking).filter(
        StudentRanking.student_id == student.id,
        StudentRanking.tenant_id == student.tenant_id
    ).first()

    if ranking:
        ranking.ats_score += quest.points
        db.flush()

        # Recalculate rank for department
        dept_rankings = (
            db.query(StudentRanking)
            .filter(
                StudentRanking.tenant_id == student.tenant_id,
                StudentRanking.department == student.department
            )
            .order_by(StudentRanking.ats_score.desc())
            .all()
        )
        for i, r in enumerate(dept_rankings, start=1):
            r.rank = i

    db.commit()
    
    return {"message": "Quest completed successfully!", "points_awarded": quest.points}
