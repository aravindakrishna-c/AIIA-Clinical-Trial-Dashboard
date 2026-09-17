from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIIA Clinical Trials Management System"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Database
    ENVIRONMENT: str = "production"
    # Standard PostgreSQL default, with fallback to SQLite if needed
    DATABASE_URL: str = Field(
        default="sqlite:///./aiia_ctms.db",
        description="Database connection string (PostgreSQL or SQLite)"
    )
    
    # JWT Settings
    JWT_SECRET: str = Field(default="aiia_super_secret_ctms_development_key_change_in_production_2026", description="Secret key for JWT generation")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    CORS_ORIGIN_REGEX: str = r".*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
