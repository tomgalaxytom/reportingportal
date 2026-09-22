from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class WasteReportBase(BaseModel):
    district_name: str = Field(..., json_schema_extra={"example": "Chennai"})
    officer_name: str = Field(..., json_schema_extra={"example": "DEE K. Sundaram"})
    officer_email: str = Field(..., json_schema_extra={"example": "dee.chn@tnpcb.gov.in"})
    waste_type: str = Field(..., json_schema_extra={"example": "E-Waste"})
    reporting_month: str = Field(..., json_schema_extra={"example": "September 2026"})
    quantity_generated_mt: float = Field(..., ge=0, json_schema_extra={"example": 124.50})
    quantity_processed_mt: float = Field(..., ge=0, json_schema_extra={"example": 118.20})
    authorized_facilities_count: Optional[int] = Field(default=1, ge=0)
    remarks: Optional[str] = None


class WasteReportCreate(WasteReportBase):
    pass


class WasteReportUpdateStatus(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "Verified"})
    remarks: Optional[str] = None


class WasteReportResponse(WasteReportBase):
    id: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WasteReportStats(BaseModel):
    total_reports: int
    verified_count: int
    pending_count: int
    needs_revision_count: int
    total_generated_mt: float
    total_processed_mt: float
