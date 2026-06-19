from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Placement Readiness Platform"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/placement_platform"

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes for access token
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days for refresh token

    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10

    REDIS_URL: str = "redis://localhost:6379/0"
    
    AWS_ACCESS_KEY_ID: str = "local"
    AWS_SECRET_ACCESS_KEY: str = "local"
    AWS_S3_BUCKET_NAME: str = "placement-platform-resumes"
    AWS_REGION_NAME: str = "us-east-1"
    
    # Set to True to bypass Redis (run tasks synchronously) and S3 (save to disk)
    LOCAL_DEV_MODE: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
