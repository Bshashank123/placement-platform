
Backend 

cd C:\Users\shash\OneDrive\Desktop\placement-platform\backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000


Front 

cd C:\Users\shash\OneDrive\Desktop\placement-platform\frontend
npm run dev




# Placement Readiness & Resume Intelligence Platform

> Multi-tenant SaaS for colleges — ATS scoring, student ranking, faculty reviews, company matching.

---

## Project Structure

```
placement-platform/
├── backend/                  # FastAPI (Python)
│   ├── app/
│   │   ├── core/             # config.py, security.py
│   │   ├── models/           # All 18 SQLAlchemy tables
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── dependencies.py   # JWT auth guards
│   │   ├── database.py       # DB session + Base
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # Database migrations
│   ├── scripts/
│   │   └── seed.py           # Seed colleges + test accounts
│   ├── tests/
│   │   └── test_auth.py      # Module 1 tests
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                 # Next.js 14 (TypeScript)
    └── src/
        ├── app/
        │   ├── auth/
        │   │   ├── login/    # Login page
        │   │   └── signup/   # Signup page
        │   └── dashboard/    # Protected dashboard + layout
        ├── hooks/
        │   └── useAuthStore.ts  # Zustand auth state
        ├── lib/
        │   └── api.ts        # Axios instance with JWT interceptor
        └── types/
            └── index.ts      # Shared TypeScript types
```

---

## Prerequisites

| Tool        | Minimum version | Check                  |
|-------------|-----------------|------------------------|
| Python      | 3.11+           | `python --version`     |
| Node.js     | 18+             | `node --version`       |
| PostgreSQL  | 14+             | `psql --version`       |

---

## 1. Database Setup

Open `psql` and create the database:

```sql
CREATE DATABASE placement_platform;
```

That's it. Tables are created automatically on first run.

---

## 2. Backend Setup

```bash
cd placement-platform/backend

# Create and activate virtual environment
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and edit your DB password
cp .env.example .env
# Open .env and set DATABASE_URL with your postgres password

# Run the seed script (creates colleges + test accounts)
python scripts/seed.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend is now running at: **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

---

## 3. Frontend Setup

```bash
cd placement-platform/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend is now running at: **http://localhost:3000**

---

## 4. Test Credentials

After running `python scripts/seed.py`:

| Role        | Email                      | Password       |
|-------------|----------------------------|----------------|
| Student     | student@vit.edu            | Student@1234   |
| Student     | student@srm.edu            | Student@1234   |
| Student     | student@demo.edu           | Student@1234   |
| Faculty     | faculty@vit.edu            | Faculty@1234   |
| Admin       | admin@vit.edu              | Admin@1234     |
| Super Admin | superadmin@platform.com    | Admin@1234     |

---

## 5. API Endpoints — Module 1

Base URL: `http://localhost:8000/api/v1`

### Auth

| Method | Endpoint       | Auth     | Description                          |
|--------|----------------|----------|--------------------------------------|
| POST   | /auth/signup   | None     | Register (auto-detects college)      |
| POST   | /auth/login    | None     | Login → returns Bearer JWT           |
| GET    | /auth/me       | Bearer   | Get current user                     |

### Tenants (super_admin only)

| Method | Endpoint                     | Description            |
|--------|------------------------------|------------------------|
| POST   | /tenants/                    | Create college tenant  |
| GET    | /tenants/                    | List all tenants       |
| GET    | /tenants/{id}                | Get tenant by ID       |
| PATCH  | /tenants/{id}/deactivate     | Deactivate tenant      |

### Example: Signup

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"yourname@vit.edu","password":"Password1","name":"Your Name","role":"student"}'
```

### Example: Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@vit.edu","password":"Student@1234"}'
```

### Example: Get current user

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <your_token>"
```

---

## 6. How Tenant Detection Works

```
student@vit.edu
     ↓
Extract domain → "vit.edu"
     ↓
Look up tenants table WHERE domain = "vit.edu"
     ↓
Found → assign tenant_id = VIT
Not found → 400 "No college found for domain @vit.edu"
```

Students registering with `@vit.edu` are automatically placed inside the VIT tenant.
All their data (resumes, scores, rankings) is isolated from other colleges.

---

## 7. JWT Payload

Every token contains:

```json
{
  "sub":       "42",
  "role":      "student",
  "tenant_id": 1,
  "exp":       1234567890,
  "iat":       1234567890
}
```

The backend reads `tenant_id` from the token on every request to enforce
data isolation — no student can ever see another college's data.

---

## 8. Run Tests

```bash
cd backend
pytest tests/ -v
```

Tests use an in-memory SQLite database — no Postgres needed for testing.

---

## 9. Database Migrations (optional, for schema changes)

```bash
cd backend

# Generate a migration after changing models
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

---

## 10. Module Build Order

| # | Module                   | Status     | What it adds                                 |
|---|--------------------------|------------|----------------------------------------------|
| 1 | Auth + Tenant System     | ✅ Done    | Login, signup, JWT, tenant isolation         |
| 2 | Student Module           | 🔜 Next    | Student profiles, skills, dashboard data     |
| 3 | Resume Upload + Parsing  | 🔜         | PDF upload, text extraction, bullet parsing  |
| 4 | ATS Scoring Engine       | 🔜         | Impact / skills / structure / brevity scores |
| 5 | Faculty Review           | 🔜         | Resume comments, faculty dashboard           |
| 6 | Admin / Super Admin      | 🔜         | Companies, matching, analytics, tenant mgmt  |

---

## 11. Roles and Permissions

| Role        | Can do                                          |
|-------------|------------------------------------------------|
| student     | Upload resumes, view ATS score, see rank        |
| faculty     | View student resumes, leave reviews             |
| admin       | Add companies, view analytics, manage placement |
| super_admin | Create colleges, assign admins, manage platform |

---

## 12. Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS|
| State     | Zustand                             |
| Forms     | React Hook Form + Zod               |
| Backend   | FastAPI (Python 3.12)               |
| Database  | PostgreSQL 16 (SQLAlchemy ORM)      |
| Auth      | JWT (python-jose) + bcrypt          |
| Migrations| Alembic                             |
| Parsing   | PyMuPDF + spaCy (Module 3+)         |
