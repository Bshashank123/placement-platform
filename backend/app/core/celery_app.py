from celery import Celery
from app.core.config import settings

# Create celery instance
celery_app = Celery(
    "placement_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"] # Tasks will be here
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)
