def test_root_endpoint(client):
    """Test root endpoint returns portal info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "portal" in data
    assert "environment" in data
    assert data["docs"] == "/api/docs"


def test_health_endpoint(client):
    """Test GET /api/health returns status ok and current environment."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "environment" in data
    assert "database" in data
    assert "timestamp" in data


def test_db_health_endpoint(client):
    """Test GET /api/health/db returns database connectivity report."""
    response = client.get("/api/health/db")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
