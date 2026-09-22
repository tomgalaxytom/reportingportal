"""
Tests for stream waste report API endpoints:
  GET/POST /api/reports/stream/e-waste
  GET/POST /api/reports/stream/biomedical
  GET/POST /api/reports/stream/plastic
  GET      /api/reports/stream/district-summary
"""

DISTRICT = "TestDistrict"
EMAIL = "test.officer@tnpcb.gov.in"
MONTH = "September 2026"

# ─── E-Waste Tests ────────────────────────────────────────────────────────────

def test_ewaste_get_no_record(client):
    """GET returns null when no record exists for the given district+month."""
    response = client.get(
        "/api/reports/stream/e-waste",
        params={"district_name": DISTRICT, "reporting_month": MONTH},
    )
    assert response.status_code == 200
    assert response.json() is None


def test_ewaste_save_draft(client):
    """POST with status=Draft creates a new record with correct field values."""
    payload = {
        "district_name": DISTRICT,
        "officer_email": EMAIL,
        "reporting_month": MONTH,
        "status": "Draft",
        "collected_it_telecom": "1.5",
        "collected_electrical": "2.0",
        "collected_toys": "0",
        "collected_medical": "0",
        "collected_others": "0.5",
        "recovered_it_telecom": "1.5",
        "recovered_electrical": "2.0",
        "recovered_toys": "0",
        "recovered_medical": "0",
        "recovered_others": "0.5",
    }
    response = client.post("/api/reports/stream/e-waste", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["status"] == "Draft"
    assert data["collected_it_telecom"] == "1.5"
    assert data["submitted_at"] is None  # Not yet submitted


def test_ewaste_get_after_draft(client):
    """GET returns the saved draft record."""
    response = client.get(
        "/api/reports/stream/e-waste",
        params={"district_name": DISTRICT, "reporting_month": MONTH},
    )
    assert response.status_code == 200
    data = response.json()
    assert data is not None
    assert data["status"] == "Draft"
    assert data["collected_it_telecom"] == "1.5"


def test_ewaste_submit(client):
    """POST with status=Submitted upserts the record, sets submitted_at timestamp, locks it."""
    payload = {
        "district_name": DISTRICT,
        "officer_email": EMAIL,
        "reporting_month": MONTH,
        "status": "Submitted",
        "collected_it_telecom": "1.716",
        "collected_electrical": "4.105",
        "collected_toys": "0",
        "collected_medical": "0",
        "collected_others": "1.108",
        "recovered_it_telecom": "1.716",
        "recovered_electrical": "4.105",
        "recovered_toys": "0",
        "recovered_medical": "0",
        "recovered_others": "1.108",
    }
    response = client.post("/api/reports/stream/e-waste", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Submitted"
    assert data["submitted_at"] is not None
    assert data["collected_it_telecom"] == "1.716"


# ─── Bio-Medical Waste Tests ──────────────────────────────────────────────────

def test_bmw_get_no_record(client):
    """GET returns null when no BMW record exists."""
    response = client.get(
        "/api/reports/stream/biomedical",
        params={"district_name": DISTRICT, "reporting_month": MONTH},
    )
    assert response.status_code == 200
    assert response.json() is None


def test_bmw_save_draft_with_autocalculation(client):
    """POST with status=Draft auto-calculates total_treated_qty and difference_qty on backend."""
    payload = {
        "district_name": DISTRICT,
        "officer_email": EMAIL,
        "reporting_month": MONTH,
        "status": "Draft",
        "generated_qty": "2290",
        "incinerator_treated_qty": "1854",
        "autoclave_treated_qty": "336",
    }
    response = client.post("/api/reports/stream/biomedical", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Draft"
    # Backend should calculate: 1854 + 336 = 2190 total, 2290 - 2190 = 100 difference
    assert data["total_treated_qty"] == "2190"
    assert data["difference_qty"] == "100"
    assert data["submitted_at"] is None


def test_bmw_submit(client):
    """POST with status=Submitted locks the BMW record."""
    payload = {
        "district_name": DISTRICT,
        "officer_email": EMAIL,
        "reporting_month": MONTH,
        "status": "Submitted",
        "generated_qty": "2290",
        "incinerator_treated_qty": "1854",
        "autoclave_treated_qty": "336",
    }
    response = client.post("/api/reports/stream/biomedical", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Submitted"
    assert data["submitted_at"] is not None
    assert data["total_treated_qty"] == "2190"
    assert data["difference_qty"] == "100"


# ─── Plastic Waste Tests ──────────────────────────────────────────────────────

def test_plastic_get_no_record(client):
    """GET returns null for plastic when no record exists."""
    response = client.get(
        "/api/reports/stream/plastic",
        params={"district_name": DISTRICT, "reporting_month": MONTH},
    )
    assert response.status_code == 200
    assert response.json() is None


def test_plastic_save_draft(client):
    """POST Plastic Waste with Draft status persists Annexure I & II fields."""
    payload = {
        "district_name": DISTRICT,
        "officer_email": EMAIL,
        "reporting_month": MONTH,
        "status": "Draft",
        "annexure1_status": "Submitted",
        "annexure2_status": "Draft",
        "banned_manufacturing_units_closed": "0",
        "inspection_raids_local_bodies": "2322",
        "seized_plastic_tons": "2.725",
        "fine_imposed_lakhs": "8.6095",
        "total_plastic_recyclers": "19",
        "recyclers_registered_pwm": "4",
        "compostable_manufacturing_units": "3",
        "compostable_units_registered_pwm": "2",
        "eco_alternative_manufacturers": "0",
        "awareness_activities_count": "5",
        "manjappai_distributed_count": "0",
        "mvm_installed_count": "0",
        "cloth_bags_dispensed_mvm": "887",
    }
    response = client.post("/api/reports/stream/plastic", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Draft"
    assert data["annexure1_status"] == "Submitted"
    assert data["annexure2_status"] == "Draft"
    assert data["inspection_raids_local_bodies"] == "2322"
    assert data["cloth_bags_dispensed_mvm"] == "887"


def test_plastic_submit_annexure2(client):
    """POST with annexure2_status=Submitted sets overall status to Submitted."""
    payload = {
        "district_name": DISTRICT,
        "officer_email": EMAIL,
        "reporting_month": MONTH,
        "status": "Submitted",
        "annexure1_status": "Submitted",
        "annexure2_status": "Submitted",
        "banned_manufacturing_units_closed": "0",
        "inspection_raids_local_bodies": "2322",
        "seized_plastic_tons": "2.725",
        "fine_imposed_lakhs": "8.6095",
        "total_plastic_recyclers": "19",
        "recyclers_registered_pwm": "4",
        "compostable_manufacturing_units": "3",
        "compostable_units_registered_pwm": "2",
        "eco_alternative_manufacturers": "0",
        "awareness_activities_count": "5",
        "manjappai_distributed_count": "0",
        "mvm_installed_count": "0",
        "cloth_bags_dispensed_mvm": "887",
    }
    response = client.post("/api/reports/stream/plastic", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Submitted"
    assert data["annexure2_status"] == "Submitted"
    assert data["submitted_at"] is not None


# ─── District Summary Tests ───────────────────────────────────────────────────

def test_district_summary_all_submitted(client):
    """GET district-summary returns Submitted for all streams when all 3 are submitted."""
    response = client.get(
        "/api/reports/stream/district-summary",
        params={"district_name": DISTRICT, "reporting_month": MONTH},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["district_name"] == DISTRICT
    assert data["reporting_month"] == MONTH
    assert data["ewaste_status"] == "Submitted"
    assert data["biomedical_status"] == "Submitted"
    assert data["plastic_status"] == "Submitted"
    assert data["overall_status"] == "Submitted"


def test_district_summary_no_records(client):
    """GET district-summary returns 'Draft — Not Submitted' for a month with no records."""
    empty_month = "January 2020"
    response = client.get(
        "/api/reports/stream/district-summary",
        params={"district_name": DISTRICT, "reporting_month": empty_month},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ewaste_status"] == "Draft \u2014 Not Submitted"
    assert data["biomedical_status"] == "Draft \u2014 Not Submitted"
    assert data["plastic_status"] == "Draft \u2014 Not Submitted"
    assert data["overall_status"] == "Draft"
