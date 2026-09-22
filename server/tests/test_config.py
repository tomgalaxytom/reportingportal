import os
import pytest
from app.config import Settings, get_env_file


def test_env_file_selection():
    """Verify get_env_file picks corresponding file based on APP_ENV."""
    old_env = os.environ.get("APP_ENV")
    try:
        os.environ["APP_ENV"] = "production"
        assert get_env_file() == ".env.production"

        os.environ["APP_ENV"] = "prodlocal"
        assert get_env_file() == ".env.prodlocal"

        os.environ["APP_ENV"] = "local"
        assert get_env_file() == ".env"
    finally:
        if old_env is not None:
            os.environ["APP_ENV"] = old_env


def test_settings_cors_parsing():
    """Verify CORS origins string is parsed properly into list."""
    s1 = Settings(
        app_env="local",
        database_url="sqlite:///./test.db",
        secret_key="secret",
        cors_origins="*",
    )
    assert s1.get_cors_origins() == ["*"]

    s2 = Settings(
        app_env="production",
        database_url="sqlite:///./test.db",
        secret_key="secret",
        cors_origins="https://tnpcb.gov.in, https://tnega.tn.gov.in",
    )
    origins = s2.get_cors_origins()
    assert len(origins) == 2
    assert "https://tnpcb.gov.in" in origins
    assert "https://tnega.tn.gov.in" in origins
