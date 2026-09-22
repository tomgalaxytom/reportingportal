from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.database import Base


class WasteReport(Base):
    """SQLAlchemy model for Monthly District Waste Reports."""

    __tablename__ = "waste_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_name = Column(String(100), nullable=False, index=True)
    officer_name = Column(String(150), nullable=False)
    officer_email = Column(String(150), nullable=False)
    waste_type = Column(String(80), nullable=False, index=True)
    reporting_month = Column(String(50), nullable=False, index=True)
    quantity_generated_mt = Column(Float, nullable=False, default=0.0)
    quantity_processed_mt = Column(Float, nullable=False, default=0.0)
    authorized_facilities_count = Column(Integer, default=1)
    status = Column(String(50), nullable=False, default="Pending", index=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
