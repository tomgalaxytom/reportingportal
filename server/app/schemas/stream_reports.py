from typing import Optional
from datetime import datetime
from pydantic import BaseModel


# E-Waste Schemas
class EWasteReportBase(BaseModel):
    district_name: str
    officer_email: str
    reporting_month: str
    status: Optional[str] = "Draft"
    collected_it_telecom: Optional[str] = "0"
    collected_electrical: Optional[str] = "0"
    collected_toys: Optional[str] = "0"
    collected_medical: Optional[str] = "0"
    collected_others: Optional[str] = "0"
    recovered_it_telecom: Optional[str] = "0"
    recovered_electrical: Optional[str] = "0"
    recovered_toys: Optional[str] = "0"
    recovered_medical: Optional[str] = "0"
    recovered_others: Optional[str] = "0"


class EWasteReportCreate(EWasteReportBase):
    pass


class EWasteReportResponse(EWasteReportBase):
    id: int
    submitted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Bio-Medical Waste Schemas
class BioMedicalWasteReportBase(BaseModel):
    district_name: str
    officer_email: str
    reporting_month: str
    status: Optional[str] = "Draft"
    generated_qty: Optional[str] = "0"
    incinerator_treated_qty: Optional[str] = "0"
    autoclave_treated_qty: Optional[str] = "0"
    total_treated_qty: Optional[str] = "0"
    difference_qty: Optional[str] = "0"
    board_remarks: Optional[str] = None


class BioMedicalWasteReportCreate(BioMedicalWasteReportBase):
    pass


class BioMedicalWasteReportResponse(BioMedicalWasteReportBase):
    id: int
    submitted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Plastic Waste Schemas
class PlasticWasteReportBase(BaseModel):
    district_name: str
    officer_email: str
    reporting_month: str
    status: Optional[str] = "Draft"
    annexure1_status: Optional[str] = "Draft"
    annexure2_status: Optional[str] = "Draft"
    banned_manufacturing_units_closed: Optional[str] = "0"
    inspection_raids_local_bodies: Optional[str] = "0"
    seized_plastic_tons: Optional[str] = "0"
    fine_imposed_lakhs: Optional[str] = "0"
    total_plastic_recyclers: Optional[str] = "0"
    recyclers_registered_pwm: Optional[str] = "0"
    compostable_manufacturing_units: Optional[str] = "0"
    compostable_units_registered_pwm: Optional[str] = "0"
    eco_alternative_manufacturers: Optional[str] = "0"
    awareness_activities_count: Optional[str] = "0"
    manjappai_distributed_count: Optional[str] = "0"
    mvm_installed_count: Optional[str] = "0"
    cloth_bags_dispensed_mvm: Optional[str] = "0"


class PlasticWasteReportCreate(PlasticWasteReportBase):
    pass


class PlasticWasteReportResponse(PlasticWasteReportBase):
    id: int
    submitted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# District Status Summary Schema
class DistrictStreamStatusSummary(BaseModel):
    district_name: str
    reporting_month: str
    ewaste_status: str  # 'Draft' | 'Submitted' | 'Not Submitted'
    biomedical_status: str  # 'Draft' | 'Submitted' | 'Returned' | 'Not Submitted'
    plastic_status: str  # 'Draft' | 'Submitted' | 'Not Submitted'
    overall_status: str


# Board Consolidated Schemas
class BoardEWasteRow(BaseModel):
    district_name: str
    officer_email: str
    collected_it_telecom: Optional[str] = None
    collected_electrical: Optional[str] = None
    collected_toys: Optional[str] = None
    collected_medical: Optional[str] = None
    collected_others: Optional[str] = None
    recovered_it_telecom: Optional[str] = None
    recovered_electrical: Optional[str] = None
    recovered_toys: Optional[str] = None
    recovered_medical: Optional[str] = None
    recovered_others: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None


class BoardBMWRow(BaseModel):
    district_name: str
    officer_email: str
    generated_qty: Optional[str] = None
    incinerator_treated_qty: Optional[str] = None
    autoclave_treated_qty: Optional[str] = None
    total_treated_qty: Optional[str] = None
    difference_qty: Optional[str] = None
    board_remarks: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None


class BoardPlasticRow(BaseModel):
    district_name: str
    officer_email: str
    banned_manufacturing_units_closed: Optional[str] = None
    inspection_raids_local_bodies: Optional[str] = None
    seized_plastic_tons: Optional[str] = None
    fine_imposed_lakhs: Optional[str] = None
    total_plastic_recyclers: Optional[str] = None
    recyclers_registered_pwm: Optional[str] = None
    compostable_manufacturing_units: Optional[str] = None
    compostable_units_registered_pwm: Optional[str] = None
    eco_alternative_manufacturers: Optional[str] = None
    awareness_activities_count: Optional[str] = None
    manjappai_distributed_count: Optional[str] = None
    mvm_installed_count: Optional[str] = None
    cloth_bags_dispensed_mvm: Optional[str] = None
    annexure1_status: str
    annexure2_status: str
    status: str
    submitted_at: Optional[datetime] = None


class BoardConsolidatedResponse(BaseModel):
    reporting_month: str
    stream: str  # 'e-waste' | 'biomedical' | 'plastic'
    total_submitted: int
    total_draft: int
    total_not_submitted: int
    ewaste_rows: Optional[list] = None
    biomedical_rows: Optional[list] = None
    plastic_rows: Optional[list] = None
