"""
Seed Script — run once to populate colleges + test accounts.

  cd backend
  python scripts/seed.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Tenant, User, Student, Faculty, CollegeAdmin, UserRole
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed():
    print("\n🌱  Seeding database...\n")

    # ── Tenants ───────────────────────────────────────────────────────────────
    colleges = [
        {"name": "VIT Vellore",   "slug": "vit",  "domain": "vit.edu"},
        {"name": "SRM Institute", "slug": "srm",  "domain": "srm.edu"},
        {"name": "IIT Madras",    "slug": "iitm", "domain": "iitm.ac.in"},
        {"name": "Demo College",  "slug": "demo", "domain": "demo.edu"},
    ]

    tenant_map = {}
    for c in colleges:
        t = db.query(Tenant).filter(Tenant.slug == c["slug"]).first()
        if not t:
            t = Tenant(**c)
            db.add(t)
            db.flush()
            print(f"  ✅  Tenant  {c['name']:20s}  @{c['domain']}")
        else:
            print(f"  ⏭️   Tenant  {c['name']:20s}  already exists")
        tenant_map[c["slug"]] = t
    db.commit()

    # ── Super Admin ───────────────────────────────────────────────────────────
    _make_user(
        email="superadmin@platform.com",
        password="Admin@1234",
        name="Platform Admin",
        role=UserRole.super_admin,
        tenant=tenant_map["demo"],
        is_verified=True,
        label="Super Admin",
    )

    # ── Sample students ───────────────────────────────────────────────────────
    students = [
        dict(email="student@vit.edu",  password="Student@1234", name="Arjun Sharma",
             tenant="vit",  dept="CSE", branch="B.Tech", year=3, cgpa=8.5, roll="21BCE1001"),
        dict(email="student@srm.edu",  password="Student@1234", name="Priya Nair",
             tenant="srm",  dept="ECE", branch="B.Tech", year=2, cgpa=7.9, roll="RA2011003"),
        dict(email="student@demo.edu", password="Student@1234", name="Test Student",
             tenant="demo", dept="CSE", branch="B.Tech", year=4, cgpa=9.1, roll="DEMO001"),
    ]
    for s in students:
        tenant = tenant_map[s["tenant"]]
        user = _make_user(
            email=s["email"], password=s["password"], name=s["name"],
            role=UserRole.student, tenant=tenant, is_verified=True,
            label=f"Student  {s['name']}",
        )
        if user and not db.query(Student).filter(Student.user_id == user.id).first():
            db.add(Student(
                user_id=user.id, tenant_id=tenant.id, name=s["name"],
                roll_number=s["roll"], department=s["dept"],
                branch=s["branch"], year=s["year"], cgpa=s["cgpa"],
            ))
            db.commit()

    # ── Sample faculty ────────────────────────────────────────────────────────
    user = _make_user(
        email="faculty@vit.edu", password="Faculty@1234", name="Dr. Ramesh Kumar",
        role=UserRole.faculty, tenant=tenant_map["vit"], is_verified=True,
        label="Faculty   Dr. Ramesh Kumar",
    )
    if user and not db.query(Faculty).filter(Faculty.user_id == user.id).first():
        db.add(Faculty(
            user_id=user.id, tenant_id=tenant_map["vit"].id,
            name="Dr. Ramesh Kumar", department="CSE",
            designation="Placement Officer",
        ))
        db.commit()

    # ── Sample admin ──────────────────────────────────────────────────────────
    user = _make_user(
        email="admin@vit.edu", password="Admin@1234", name="VIT Placement Admin",
        role=UserRole.admin, tenant=tenant_map["vit"], is_verified=True,
        label="Admin     VIT Placement Admin",
    )
    if user:
        if not db.query(Faculty).filter(Faculty.user_id == user.id).first():
            db.add(Faculty(user_id=user.id, tenant_id=tenant_map["vit"].id,
                           name="VIT Placement Admin", designation="Admin"))
        if not db.query(CollegeAdmin).filter(CollegeAdmin.user_id == user.id).first():
            db.add(CollegeAdmin(user_id=user.id, tenant_id=tenant_map["vit"].id))
        db.commit()

    print("\n" + "─"*52)
    print("✅  Seed complete!\n")
    print("  Credentials (all passwords shown above)")
    print("  superadmin@platform.com  →  Admin@1234")
    print("  student@vit.edu          →  Student@1234")
    print("  student@srm.edu          →  Student@1234")
    print("  student@demo.edu         →  Student@1234")
    print("  faculty@vit.edu          →  Faculty@1234")
    print("  admin@vit.edu            →  Admin@1234")
    print("─"*52 + "\n")

    db.close()


def _make_user(*, email, password, name, role, tenant, is_verified, label):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"  ⏭️   {label:30s}  already exists")
        return None
    u = User(
        tenant_id=tenant.id, email=email,
        password_hash=hash_password(password),
        role=role, is_verified=is_verified, is_active=True,
    )
    db.add(u)
    db.flush()
    print(f"  ✅  {label:30s}  {email}")
    return u


if __name__ == "__main__":
    seed()
