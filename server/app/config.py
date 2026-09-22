import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


def get_env_file() -> str:
    """Determine the appropriate env file based on APP_ENV variable."""
    env = os.getenv("APP_ENV", "local").lower()
    if env == "production":
        return ".env.production"
    elif env in ("prodlocal", "staging"):
        return ".env.prodlocal"
    return ".env"


class Settings(BaseSettings):
    """Application configuration loaded strictly from environment files / variables."""

    app_env: str = "local"
    host: str = "0.0.0.0"
    port: int = 8000
    database_url: str
    secret_key: str
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=get_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_cors_origins(self) -> List[str]:
        """Parse comma-separated cors origins into list."""
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
