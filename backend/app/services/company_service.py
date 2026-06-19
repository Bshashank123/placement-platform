"""
Company Service — Module 6
Handles company CRUD, match score calculation, and student eligibility.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import (
    Company, CompanyRequiredSkill, CompanyMatchScore,
    Student, StudentSkill, Resume
)
from app.schemas.admin import CompanyCreate


def create_company(db: Session, tenant_id: int, payload: CompanyCreate) -> Company:
    company = Company(
        tenant_id=tenant_id,
        name=payload.name,
        role=payload.role,
        min_cgpa=payload.min_cgpa,
        min_projects=payload.min_projects,
    )
    db.add(company)
    db.flush()

    for skill in payload.required_skills:
        skill = skill.strip()
        if skill:
            db.add(CompanyRequiredSkill(company_id=company.id, skill_name=skill))

    db.commit()
    db.refresh(company)
    return company


def get_companies(db: Session, tenant_id: int) -> list[dict]:
    companies = db.query(Company).filter(Company.tenant_id == tenant_id).all()
    result = []
    for c in companies:
        skills = [s.skill_name for s in db.query(CompanyRequiredSkill).filter(
            CompanyRequiredSkill.company_id == c.id
        ).all()]
        result.append({
            "id": c.id,
            "tenant_id": c.tenant_id,
            "name": c.name,
            "role": c.role,
            "min_cgpa": c.min_cgpa,
            "min_projects": c.min_projects,
            "required_skills": skills,
        })
    return result


def delete_company(db: Session, company_id: int, tenant_id: int):
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.tenant_id == tenant_id,
    ).first()
    if not company:
        raise HTTPException(404, "Company not found.")
    db.delete(company)
    db.commit()
    return {"message": "Company deleted."}


def calculate_match_score(
    student: Student,
    student_skills: list[str],
    project_count: int,
    required_skills: list[str],
    min_cgpa: float | None,
    min_projects: int,
) -> dict:
    """
    Match score = weighted combination of:
    - Skill match %: 60 pts
    - CGPA eligibility: 25 pts
    - Project count: 15 pts
    """
    student_skills_lower = [s.lower() for s in student_skills]
    required_lower = [s.lower() for s in required_skills]

    # Skill match
    if required_lower:
        matched = [s for s in required_lower if s in student_skills_lower]
        missing = [s for s in required_skills if s.lower() not in student_skills_lower]
        skill_pct = len(matched) / len(required_lower)
    else:
        matched = []
        missing = []
        skill_pct = 1.0  # no requirements = full score

    skill_score = skill_pct * 60

    # CGPA eligibility
    cgpa_eligible = True
    cgpa_score = 25.0
    if min_cgpa is not None:
        if student.cgpa is None or student.cgpa < min_cgpa:
            cgpa_eligible = False
            cgpa_score = 0.0

    # Project count
    project_score = 15.0
    if min_projects > 0:
        if project_count < min_projects:
            project_score = max(0.0, (project_count / min_projects) * 15)

    total = round(skill_score + cgpa_score + project_score, 1)

    return {
        "match_score": total,
        "skill_match_pct": round(skill_pct * 100, 1),
        "cgpa_eligible": cgpa_eligible,
        "matched_skills": [s for s in required_skills if s.lower() in student_skills_lower],
        "missing_skills": missing,
    }


def get_matches_for_student(db: Session, student_id: int, tenant_id: int) -> list[dict]:
    """Calculate and return company matches for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found.")

    student_skills = [
        sk.skill_name for sk in db.query(StudentSkill).filter(
            StudentSkill.student_id == student_id
        ).all()
    ]

    # Find the primary resume or the latest uploaded resume
    primary_resume = db.query(Resume).filter(
        Resume.student_id == student_id,
        Resume.is_primary == True,
    ).first() or db.query(Resume).filter(
        Resume.student_id == student_id
    ).first()

    # Count actual projects from parsed bullets in the resume
    project_count = 0
    if primary_resume:
        project_count = db.query(ResumeBullet).filter(
            ResumeBullet.resume_id == primary_resume.id,
            ResumeBullet.section_name == "projects"
        ).count()

    companies = db.query(Company).filter(Company.tenant_id == tenant_id).all()
    results = []

    for company in companies:
        required_skills = [
            s.skill_name for s in db.query(CompanyRequiredSkill).filter(
                CompanyRequiredSkill.company_id == company.id
            ).all()
        ]

        match = calculate_match_score(
            student=student,
            student_skills=student_skills,
            project_count=project_count,
            required_skills=required_skills,
            min_cgpa=company.min_cgpa,
            min_projects=company.min_projects,
        )

        if primary_resume:
            existing = db.query(CompanyMatchScore).filter(
                CompanyMatchScore.student_id == student_id,
                CompanyMatchScore.company_id  == company.id,
            ).first()
            if existing:
                existing.match_score = match["match_score"]
            else:
                db.add(CompanyMatchScore(
                    student_id=student_id,
                    company_id=company.id,
                    resume_id=primary_resume.id,
                    match_score=match["match_score"],
                ))

        results.append({
            "company_id": company.id,
            "company_name": company.name,
            "role": company.role,
            **match,
        })

    db.commit()
    return sorted(results, key=lambda x: x["match_score"], reverse=True)