from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.report import (
    WasteReportCreate,
    WasteReportUpdateStatus,
    WasteReportResponse,
    WasteReportStats,
)
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[WasteReportResponse])
def list_reports(
    district_name: Optional[str] = Query(None, description="Filter by TN District"),
    waste_type: Optional[str] = Query(None, description="Filter by Waste Stream"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by Status"),
    reporting_month: Optional[str] = Query(None, description="Filter by Reporting Month"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> List[WasteReportResponse]:
    """Retrieve list of district waste reports with optional filters."""
    return report_service.get_reports(
        db=db,
        district_name=district_name,
        waste_type=waste_type,
        status=status_filter,
        reporting_month=reporting_month,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=WasteReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: WasteReportCreate,
    db: Session = Depends(get_db),
) -> WasteReportResponse:
    """Submit a monthly waste management report from District Office."""
    return report_service.create_report(db=db, report_data=report_in)


@router.get("/stats/summary", response_model=WasteReportStats)
def get_stats_summary(db: Session = Depends(get_db)) -> WasteReportStats:
    """Aggregate statistics for CM Dashboard overview."""
    return report_service.get_summary_stats(db=db)


@router.get("/{report_id}", response_model=WasteReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
) -> WasteReportResponse:
    """Retrieve single report by ID."""
    report = report_service.get_report_by_id(db=db, report_id=report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Waste report with ID {report_id} not found",
        )
    return report


@router.patch("/{report_id}/status", response_model=WasteReportResponse)
def update_status(
    report_id: int,
    status_in: WasteReportUpdateStatus,
    db: Session = Depends(get_db),
) -> WasteReportResponse:
    """Update report status (Verify / Request Revision) by Board Section."""
    updated = report_service.update_report_status(
        db=db,
        report_id=report_id,
        status=status_in.status,
        remarks=status_in.remarks,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Waste report with ID {report_id} not found",
        )
    return updated
