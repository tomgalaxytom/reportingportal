from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.database import Base


class EWasteReport(Base):
    """SQLAlchemy model for E-Waste monthly reporting."""

    __tablename__ = "ewaste_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_name = Column(String(100), nullable=False, index=True)
    officer_email = Column(String(150), nullable=False)
    reporting_month = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Draft", index=True)  # 'Draft' | 'Submitted'

    # Table 1 — Collected (Kg)
    collected_it_telecom = Column(String(50), nullable=True, default="0")
    collected_electrical = Column(String(50), nullable=True, default="0")
    collected_toys = Column(String(50), nullable=True, default="0")
    collected_medical = Column(String(50), nullable=True, default="0")
    collected_others = Column(String(50), nullable=True, default="0")

    # Table 2 — Recovered (Kg)
    recovered_it_telecom = Column(String(50), nullable=True, default="0")
    recovered_electrical = Column(String(50), nullable=True, default="0")
    recovered_toys = Column(String(50), nullable=True, default="0")
    recovered_medical = Column(String(50), nullable=True, default="0")
    recovered_others = Column(String(50), nullable=True, default="0")

    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class BioMedicalWasteReport(Base):
    """SQLAlchemy model for Bio-Medical Waste monthly reporting."""

    __tablename__ = "biomedical_waste_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_name = Column(String(100), nullable=False, index=True)
    officer_email = Column(String(150), nullable=False)
    reporting_month = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Draft", index=True)  # 'Draft' | 'Submitted' | 'Returned'

    generated_qty = Column(String(50), nullable=True, default="0")
    incinerator_treated_qty = Column(String(50), nullable=True, default="0")
    autoclave_treated_qty = Column(String(50), nullable=True, default="0")
    total_treated_qty = Column(String(50), nullable=True, default="0")
    difference_qty = Column(String(50), nullable=True, default="0")
    board_remarks = Column(Text, nullable=True)

    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class PlasticWasteReport(Base):
    """SQLAlchemy model for Plastic Waste monthly reporting (Annexure I & II)."""

    __tablename__ = "plastic_waste_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_name = Column(String(100), nullable=False, index=True)
    officer_email = Column(String(150), nullable=False)
    reporting_month = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Draft", index=True)  # Overall status
    annexure1_status = Column(String(50), nullable=False, default="Draft")
    annexure2_status = Column(String(50), nullable=False, default="Draft")

    # Annexure I — Single Use Plastic Inspection & PWM
    banned_manufacturing_units_closed = Column(String(50), nullable=True, default="0")
    inspection_raids_local_bodies = Column(String(50), nullable=True, default="0")
    seized_plastic_tons = Column(String(50), nullable=True, default="0")
    fine_imposed_lakhs = Column(String(50), nullable=True, default="0")
    total_plastic_recyclers = Column(String(50), nullable=True, default="0")
    recyclers_registered_pwm = Column(String(50), nullable=True, default="0")
    compostable_manufacturing_units = Column(String(50), nullable=True, default="0")
    compostable_units_registered_pwm = Column(String(50), nullable=True, default="0")

    # Annexure II — Meendum Manjappai Awareness Campaign
    eco_alternative_manufacturers = Column(String(50), nullable=True, default="0")
    awareness_activities_count = Column(String(50), nullable=True, default="0")
    manjappai_distributed_count = Column(String(50), nullable=True, default="0")
    mvm_installed_count = Column(String(50), nullable=True, default="0")
    cloth_bags_dispensed_mvm = Column(String(50), nullable=True, default="0")

    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
