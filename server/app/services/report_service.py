from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.report import WasteReport
from app.schemas.report import WasteReportCreate, WasteReportStats


class ReportService:
    @staticmethod
    def create_report(db: Session, report_data: WasteReportCreate) -> WasteReport:
        db_report = WasteReport(
            district_name=report_data.district_name,
            officer_name=report_data.officer_name,
            officer_email=report_data.officer_email,
            waste_type=report_data.waste_type,
            reporting_month=report_data.reporting_month,
            quantity_generated_mt=report_data.quantity_generated_mt,
            quantity_processed_mt=report_data.quantity_processed_mt,
            authorized_facilities_count=report_data.authorized_facilities_count or 1,
            remarks=report_data.remarks,
            status="Pending",
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report

    @staticmethod
    def get_reports(
        db: Session,
        district_name: Optional[str] = None,
        waste_type: Optional[str] = None,
        status: Optional[str] = None,
        reporting_month: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[WasteReport]:
        query = db.query(WasteReport)

        if district_name and district_name != "ALL":
            query = query.filter(WasteReport.district_name == district_name)
        if waste_type and waste_type != "ALL":
            query = query.filter(WasteReport.waste_type == waste_type)
        if status and status != "ALL":
            query = query.filter(WasteReport.status == status)
        if reporting_month and reporting_month != "ALL":
            query = query.filter(WasteReport.reporting_month == reporting_month)

        return (
            query.order_by(WasteReport.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_report_by_id(db: Session, report_id: int) -> Optional[WasteReport]:
        return db.query(WasteReport).filter(WasteReport.id == report_id).first()

    @staticmethod
    def update_report_status(
        db: Session, report_id: int, status: str, remarks: Optional[str] = None
    ) -> Optional[WasteReport]:
        report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
        if not report:
            return None
        report.status = status
        if remarks is not None:
            report.remarks = remarks
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def get_summary_stats(db: Session) -> WasteReportStats:
        total = db.query(func.count(WasteReport.id)).scalar() or 0
        verified = (
            db.query(func.count(WasteReport.id))
            .filter(WasteReport.status == "Verified")
            .scalar()
            or 0
        )
        revision = (
            db.query(func.count(WasteReport.id))
            .filter(WasteReport.status == "Needs Revision")
            .scalar()
            or 0
        )
        pending = total - verified - revision
        if pending < 0:
            pending = 0

        tot_gen = db.query(func.sum(WasteReport.quantity_generated_mt)).scalar() or 0.0
        tot_proc = db.query(func.sum(WasteReport.quantity_processed_mt)).scalar() or 0.0

        return WasteReportStats(
            total_reports=total,
            verified_count=verified,
            pending_count=pending,
            needs_revision_count=revision,
            total_generated_mt=round(float(tot_gen), 2),
            total_processed_mt=round(float(tot_proc), 2),
        )

    @staticmethod
    def seed_initial_data(db: Session) -> None:
        """Seed sample data if table is empty for instant demonstration."""
        count = db.query(func.count(WasteReport.id)).scalar()
        if count == 0:
            sample_data = [
                WasteReport(
                    district_name="Chennai",
                    officer_name="DEE K. Sundaram",
                    officer_email="dee.chn@tnpcb.gov.in",
                    waste_type="E-Waste",
                    reporting_month="September 2026",
                    quantity_generated_mt=142.50,
                    quantity_processed_mt=138.20,
                    authorized_facilities_count=4,
                    status="Verified",
                    remarks="All 4 authorized recyclers compliant.",
                ),
                WasteReport(
                    district_name="Coimbatore",
                    officer_name="DEE R. Meenakshi",
                    officer_email="dee.cbe@tnpcb.gov.in",
                    waste_type="Plastic Waste Management",
                    reporting_month="September 2026",
                    quantity_generated_mt=210.00,
                    quantity_processed_mt=198.50,
                    authorized_facilities_count=6,
                    status="Verified",
                    remarks="Co-processing in cement kilns completed.",
                ),
                WasteReport(
                    district_name="Madurai",
                    officer_name="DEE S. Raman",
                    officer_email="dee.mdu@tnpcb.gov.in",
                    waste_type="Bio-Medical Waste",
                    reporting_month="September 2026",
                    quantity_generated_mt=48.30,
                    quantity_processed_mt=48.30,
                    authorized_facilities_count=2,
                    status="Pending",
                    remarks="Common Bio-medical Waste Treatment Facility (CBWTF) logs attached.",
                ),
                WasteReport(
                    district_name="Salem",
                    officer_name="DEE V. Karthik",
                    officer_email="dee.slm@tnpcb.gov.in",
                    waste_type="E-Waste",
                    reporting_month="September 2026",
                    quantity_generated_mt=56.80,
                    quantity_processed_mt=51.00,
                    authorized_facilities_count=2,
                    status="Needs Revision",
                    remarks="Discrepancy in unmanifested stock. Re-verification required.",
                ),
            ]
            db.add_all(sample_data)
            db.commit()


report_service = ReportService()
