from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.stream_reports import EWasteReport, BioMedicalWasteReport, PlasticWasteReport
from app.schemas.stream_reports import (
    EWasteReportCreate,
    EWasteReportResponse,
    BioMedicalWasteReportCreate,
    BioMedicalWasteReportResponse,
    PlasticWasteReportCreate,
    PlasticWasteReportResponse,
    DistrictStreamStatusSummary,
    BoardEWasteRow,
    BoardBMWRow,
    BoardPlasticRow,
)

router = APIRouter(prefix="/reports/stream", tags=["Stream Waste Reports"])


# ==================== E-WASTE ENDPOINTS ====================

@router.get("/e-waste", response_model=Optional[EWasteReportResponse])
def get_ewaste_report(
    district_name: str = Query(...),
    reporting_month: str = Query(...),
    db: Session = Depends(get_db),
):
    """Fetch E-Waste report for a district and month."""
    report = (
        db.query(EWasteReport)
        .filter(
            EWasteReport.district_name.ilike(district_name.strip()),
            EWasteReport.reporting_month == reporting_month.strip(),
        )
        .first()
    )
    return report


@router.post("/e-waste", response_model=EWasteReportResponse)
def save_or_submit_ewaste_report(
    payload: EWasteReportCreate,
    db: Session = Depends(get_db),
):
    """Save draft or submit E-Waste report."""
    district = payload.district_name.strip()
    month = payload.reporting_month.strip()

    report = (
        db.query(EWasteReport)
        .filter(
            EWasteReport.district_name.ilike(district),
            EWasteReport.reporting_month == month,
        )
        .first()
    )

    submitted_at_val = datetime.now(timezone.utc) if payload.status == "Submitted" else None

    if report:
        # Update existing record
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(report, field, value)
        if payload.status == "Submitted":
            report.submitted_at = submitted_at_val
    else:
        # Create new record
        report = EWasteReport(
            **payload.model_dump(),
            submitted_at=submitted_at_val,
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return report


# ==================== BIO-MEDICAL WASTE ENDPOINTS ====================

@router.get("/biomedical", response_model=Optional[BioMedicalWasteReportResponse])
def get_biomedical_report(
    district_name: str = Query(...),
    reporting_month: str = Query(...),
    db: Session = Depends(get_db),
):
    """Fetch Bio-Medical Waste report for a district and month."""
    report = (
        db.query(BioMedicalWasteReport)
        .filter(
            BioMedicalWasteReport.district_name.ilike(district_name.strip()),
            BioMedicalWasteReport.reporting_month == reporting_month.strip(),
        )
        .first()
    )
    return report


@router.post("/biomedical", response_model=BioMedicalWasteReportResponse)
def save_or_submit_biomedical_report(
    payload: BioMedicalWasteReportCreate,
    db: Session = Depends(get_db),
):
    """Save draft or submit Bio-Medical Waste report."""
    district = payload.district_name.strip()
    month = payload.reporting_month.strip()

    # Calculate Total Treated & Difference
    try:
        gen = float(payload.generated_qty or 0)
        inc = float(payload.incinerator_treated_qty or 0)
        auto = float(payload.autoclave_treated_qty or 0)
        tot = inc + auto
        diff = gen - tot
        payload.total_treated_qty = str(int(tot) if tot.is_integer() else tot)
        payload.difference_qty = str(int(diff) if diff.is_integer() else diff)
    except Exception:
        pass

    report = (
        db.query(BioMedicalWasteReport)
        .filter(
            BioMedicalWasteReport.district_name.ilike(district),
            BioMedicalWasteReport.reporting_month == month,
        )
        .first()
    )

    submitted_at_val = datetime.now(timezone.utc) if payload.status == "Submitted" else None

    if report:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(report, field, value)
        if payload.status == "Submitted":
            report.submitted_at = submitted_at_val
    else:
        report = BioMedicalWasteReport(
            **payload.model_dump(),
            submitted_at=submitted_at_val,
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return report


# ==================== PLASTIC WASTE ENDPOINTS ====================

@router.get("/plastic", response_model=Optional[PlasticWasteReportResponse])
def get_plastic_report(
    district_name: str = Query(...),
    reporting_month: str = Query(...),
    db: Session = Depends(get_db),
):
    """Fetch Plastic Waste report for a district and month."""
    report = (
        db.query(PlasticWasteReport)
        .filter(
            PlasticWasteReport.district_name.ilike(district_name.strip()),
            PlasticWasteReport.reporting_month == reporting_month.strip(),
        )
        .first()
    )
    return report


@router.post("/plastic", response_model=PlasticWasteReportResponse)
def save_or_submit_plastic_report(
    payload: PlasticWasteReportCreate,
    db: Session = Depends(get_db),
):
    """Save draft or submit Plastic Waste report."""
    district = payload.district_name.strip()
    month = payload.reporting_month.strip()

    report = (
        db.query(PlasticWasteReport)
        .filter(
            PlasticWasteReport.district_name.ilike(district),
            PlasticWasteReport.reporting_month == month,
        )
        .first()
    )

    submitted_at_val = (
        datetime.now(timezone.utc)
        if payload.status == "Submitted"
        or payload.annexure1_status == "Submitted"
        or payload.annexure2_status == "Submitted"
        else None
    )

    if report:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(report, field, value)
        if (
            payload.status == "Submitted"
            or payload.annexure1_status == "Submitted"
            or payload.annexure2_status == "Submitted"
        ):
            report.submitted_at = submitted_at_val
    else:
        report = PlasticWasteReport(
            **payload.model_dump(),
            submitted_at=submitted_at_val,
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return report


# ==================== DISTRICT SUMMARY ENDPOINT ====================

@router.get("/district-summary", response_model=DistrictStreamStatusSummary)
def get_district_summary(
    district_name: str = Query(...),
    reporting_month: str = Query(...),
    db: Session = Depends(get_db),
):
    """Fetch real-time status of all 3 waste streams for district dashboard badges."""
    district = district_name.strip()
    month = reporting_month.strip()

    ewaste = (
        db.query(EWasteReport)
        .filter(
            EWasteReport.district_name.ilike(district),
            EWasteReport.reporting_month == month,
        )
        .first()
    )

    bmw = (
        db.query(BioMedicalWasteReport)
        .filter(
            BioMedicalWasteReport.district_name.ilike(district),
            BioMedicalWasteReport.reporting_month == month,
        )
        .first()
    )

    plastic = (
        db.query(PlasticWasteReport)
        .filter(
            PlasticWasteReport.district_name.ilike(district),
            PlasticWasteReport.reporting_month == month,
        )
        .first()
    )

    ewaste_st = ewaste.status if ewaste else "Draft — Not Submitted"
    bmw_st = bmw.status if bmw else "Draft — Not Submitted"
    plastic_st = plastic.status if plastic else "Draft — Not Submitted"

    # Overall calculation
    statuses = [ewaste_st, bmw_st, plastic_st]
    if all(s == "Submitted" for s in statuses):
        overall = "Submitted"
    elif any(s == "Returned" for s in statuses):
        overall = "Returned"
    else:
        overall = "Draft"

    return DistrictStreamStatusSummary(
        district_name=district,
        reporting_month=month,
        ewaste_status=ewaste_st,
        biomedical_status=bmw_st,
        plastic_status=plastic_st,
        overall_status=overall,
    )


# ==================== BOARD CONSOLIDATED ENDPOINT ====================

@router.get("/board-consolidated")
def get_board_consolidated(
    reporting_month: str = Query(...),
    stream: str = Query(..., description="e-waste | biomedical | plastic"),
    db: Session = Depends(get_db),
):
    """Fetch all district records for a stream+month. Powers the JCEE Board Dashboard."""
    month = reporting_month.strip()
    stream_key = stream.strip().lower()

    if stream_key == "e-waste":
        records = (
            db.query(EWasteReport)
            .filter(EWasteReport.reporting_month == month)
            .order_by(EWasteReport.district_name)
            .all()
        )
        rows = [
            BoardEWasteRow(
                district_name=r.district_name,
                officer_email=r.officer_email,
                collected_it_telecom=r.collected_it_telecom,
                collected_electrical=r.collected_electrical,
                collected_toys=r.collected_toys,
                collected_medical=r.collected_medical,
                collected_others=r.collected_others,
                recovered_it_telecom=r.recovered_it_telecom,
                recovered_electrical=r.recovered_electrical,
                recovered_toys=r.recovered_toys,
                recovered_medical=r.recovered_medical,
                recovered_others=r.recovered_others,
                status=r.status,
                submitted_at=r.submitted_at,
            ).model_dump()
            for r in records
        ]
        submitted = sum(1 for r in records if r.status == "Submitted")
        draft = sum(1 for r in records if r.status == "Draft")
        return {
            "reporting_month": month,
            "stream": stream_key,
            "total_submitted": submitted,
            "total_draft": draft,
            "total_not_submitted": 0,
            "rows": rows,
        }

    elif stream_key == "biomedical":
        records = (
            db.query(BioMedicalWasteReport)
            .filter(BioMedicalWasteReport.reporting_month == month)
            .order_by(BioMedicalWasteReport.district_name)
            .all()
        )
        rows = [
            BoardBMWRow(
                district_name=r.district_name,
                officer_email=r.officer_email,
                generated_qty=r.generated_qty,
                incinerator_treated_qty=r.incinerator_treated_qty,
                autoclave_treated_qty=r.autoclave_treated_qty,
                total_treated_qty=r.total_treated_qty,
                difference_qty=r.difference_qty,
                board_remarks=r.board_remarks,
                status=r.status,
                submitted_at=r.submitted_at,
            ).model_dump()
            for r in records
        ]
        submitted = sum(1 for r in records if r.status == "Submitted")
        draft = sum(1 for r in records if r.status == "Draft")
        return {
            "reporting_month": month,
            "stream": stream_key,
            "total_submitted": submitted,
            "total_draft": draft,
            "total_not_submitted": 0,
            "rows": rows,
        }

    elif stream_key == "plastic":
        records = (
            db.query(PlasticWasteReport)
            .filter(PlasticWasteReport.reporting_month == month)
            .order_by(PlasticWasteReport.district_name)
            .all()
        )
        rows = [
            BoardPlasticRow(
                district_name=r.district_name,
                officer_email=r.officer_email,
                banned_manufacturing_units_closed=r.banned_manufacturing_units_closed,
                inspection_raids_local_bodies=r.inspection_raids_local_bodies,
                seized_plastic_tons=r.seized_plastic_tons,
                fine_imposed_lakhs=r.fine_imposed_lakhs,
                total_plastic_recyclers=r.total_plastic_recyclers,
                recyclers_registered_pwm=r.recyclers_registered_pwm,
                compostable_manufacturing_units=r.compostable_manufacturing_units,
                compostable_units_registered_pwm=r.compostable_units_registered_pwm,
                eco_alternative_manufacturers=r.eco_alternative_manufacturers,
                awareness_activities_count=r.awareness_activities_count,
                manjappai_distributed_count=r.manjappai_distributed_count,
                mvm_installed_count=r.mvm_installed_count,
                cloth_bags_dispensed_mvm=r.cloth_bags_dispensed_mvm,
                annexure1_status=r.annexure1_status,
                annexure2_status=r.annexure2_status,
                status=r.status,
                submitted_at=r.submitted_at,
            ).model_dump()
            for r in records
        ]
        submitted = sum(1 for r in records if r.status == "Submitted")
        draft = sum(1 for r in records if r.status == "Draft")
        return {
            "reporting_month": month,
            "stream": stream_key,
            "total_submitted": submitted,
            "total_draft": draft,
            "total_not_submitted": 0,
            "rows": rows,
        }

    raise HTTPException(status_code=400, detail=f"Unknown stream: '{stream}'. Use e-waste, biomedical, or plastic.")
