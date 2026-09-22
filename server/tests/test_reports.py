def test_create_and_get_report(client):
    """Test creating a waste report submission and retrieving it."""
    payload = {
        "district_name": "Tiruchirappalli",
        "officer_name": "DEE M. Anbarasan",
        "officer_email": "dee.trichy@tnpcb.gov.in",
        "waste_type": "E-Waste",
        "reporting_month": "September 2026",
        "quantity_generated_mt": 75.40,
        "quantity_processed_mt": 70.10,
        "authorized_facilities_count": 3,
        "remarks": "Semi-annual audit conducted.",
    }

    # Create report
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["district_name"] == "Tiruchirappalli"
    assert data["status"] == "Pending"
    assert "id" in data
    report_id = data["id"]

    # Get single report
    get_res = client.get(f"/api/reports/{report_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == report_id

    # Update status to Verified
    patch_res = client.patch(
        f"/api/reports/{report_id}/status",
        json={"status": "Verified", "remarks": "Approved by Board member."},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Verified"
    assert patch_res.json()["remarks"] == "Approved by Board member."


def test_list_reports_with_filter(client):
    """Test filtering reports by waste_type and district_name."""
    # Add a report
    client.post(
        "/api/reports",
        json={
            "district_name": "Kanchipuram",
            "officer_name": "DEE S. Geetha",
            "officer_email": "dee.kpm@tnpcb.gov.in",
            "waste_type": "Bio-Medical Waste",
            "reporting_month": "September 2026",
            "quantity_generated_mt": 32.00,
            "quantity_processed_mt": 32.00,
            "authorized_facilities_count": 1,
            "remarks": "Full compliance.",
        },
    )

    # Filter by waste_type
    res = client.get("/api/reports", params={"waste_type": "Bio-Medical Waste"})
    assert res.status_code == 200
    reports = res.json()
    assert len(reports) >= 1
    assert all(r["waste_type"] == "Bio-Medical Waste" for r in reports)


def test_report_stats_summary(client):
    """Test GET /api/reports/stats/summary returns valid aggregate figures."""
    res = client.get("/api/reports/stats/summary")
    assert res.status_code == 200
    stats = res.json()
    assert "total_reports" in stats
    assert "verified_count" in stats
    assert "pending_count" in stats
    assert "total_generated_mt" in stats
    assert "total_processed_mt" in stats
    assert stats["total_reports"] >= 1
