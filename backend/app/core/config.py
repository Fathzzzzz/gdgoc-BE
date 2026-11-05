from pathlib import Path
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")
    database_url: str
    jwt_secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=60, gt=0)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = Field(default=20, gt=0)
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

@lru_cache
def get_settings() -> Settings:
    return Settings()
