from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


class Log(Base):
    """SQLAlchemy model for email sending / system audit logs in reportingportal DB."""

    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String(50), nullable=False)
    recipient_name = Column(String(255), nullable=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, index=True)  # 'Delivered' | 'Failed'
    error_message = Column(Text, nullable=True)


class Schedule(Base):
    """SQLAlchemy model for scheduled email campaigns in reportingportal DB."""

    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body_template = Column(Text, nullable=False)
    csv_filename = Column(String(255), nullable=False)
    recipients_json = Column(Text, nullable=False)
    schedule_type = Column(String(50), nullable=False)  # 'once' | 'daily'
    schedule_time = Column(String(50), nullable=False)
    next_run = Column(String(50), nullable=True)
    last_run = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="active")  # 'active' | 'paused' | 'running' | 'completed'
