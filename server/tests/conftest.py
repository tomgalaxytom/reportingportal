import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Set test environment
os.environ["APP_ENV"] = "local"
os.environ["DATABASE_URL"] = "sqlite:///./test_reportingportal.db"
os.environ["SECRET_KEY"] = "test-secret-key-32-chars-minimum-secure"

from app.database import Base, get_db
from app.main import app

# SQLite engine for tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_reportingportal.db"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create test tables and cleanup after tests finish."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_reportingportal.db"):
        try:
            os.remove("./test_reportingportal.db")
        except Exception:
            pass


@pytest.fixture(scope="function")
def db_session():
    """Yield fresh test DB session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Override get_db with test database session for API tests."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
