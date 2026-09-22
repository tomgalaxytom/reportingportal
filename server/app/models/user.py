from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class User(Base):
    """SQLAlchemy model for TNPCB System Users (DEE / JCEE)."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_name = Column(String(100), nullable=True)
    officer_email = Column(String(150), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # 'dee' or 'jcee'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
