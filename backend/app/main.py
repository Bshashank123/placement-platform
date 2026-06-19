from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.database import engine, Base
import app.models  # noqa

from app.routers.auth     import router as auth_router
from app.routers.students import router as students_router
from app.routers.resumes  import router as resumes_router
from app.routers.ats      import router as ats_router
from app.routers.faculty  import router as faculty_router
from app.routers.admin    import admin_router, platform_router
from app.routers.superadmin import router as superadmin_router
from app.routers.admin_orchestration import router as admin_orchestration_router
from app.routers.faculty_dashboard import router as faculty_dashboard_router
from app.routers.quests import router as quests_router
from app.core.limiter import limiter

@asynccontextmanager
async def lifespan(application: FastAPI):
    # Database is now managed via Alembic migrations.
    # We no longer drop/create tables on startup.
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Placement Readiness & Resume Intelligence Platform
    """,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth_router,     prefix=PREFIX)
app.include_router(students_router, prefix=PREFIX)
app.include_router(resumes_router,  prefix=PREFIX)
app.include_router(ats_router,      prefix=PREFIX)
app.include_router(faculty_router,  prefix=PREFIX)
app.include_router(admin_router,    prefix=PREFIX)
app.include_router(platform_router, prefix=PREFIX)
app.include_router(superadmin_router, prefix=PREFIX)
app.include_router(admin_orchestration_router, prefix=PREFIX)
app.include_router(faculty_dashboard_router, prefix=PREFIX)
app.include_router(quests_router, prefix=PREFIX)


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

@app.get("/", tags=["System"])
def root():
    return {"message": "API running", "docs": "/docs"}