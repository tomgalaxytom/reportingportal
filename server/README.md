# TNPCB Waste Reporting Portal - Backend Server (FastAPI)

Production-ready FastAPI backend for the **Tamil Nadu Pollution Control Board (TNPCB) CM Dashboard-TNEGA Reporting Portal**.

---

## 📁 Directory Structure

```text
server/
├── venv/                      # Python virtual environment
├── app/
│   ├── __init__.py
│   ├── main.py                # Application entry point, CORS, lifespan & error handlers
│   ├── config.py              # Dynamic Pydantic BaseSettings loading from .env
│   ├── database.py            # Centralized SQLAlchemy engine & session dependency
│   ├── models/
│   │   ├── __init__.py
│   │   └── report.py          # WasteReport SQLAlchemy table model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── health.py          # HealthResponse & DB status schemas
│   │   └── report.py          # WasteReport validation schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py          # /api/health and /api/health/db
│   │   └── reports.py         # /api/reports CRUD & stats
│   ├── services/
│   │   ├── __init__.py
│   │   └── report_service.py  # Business logic & seed data generator
│   └── utils/
│       ├── __init__.py
│       └── logger.py          # Structured logging
├── tests/
│   ├── __init__.py
│   ├── conftest.py            # SQLite test fixtures & TestClient
│   ├── test_config.py         # Settings & CORS parsing tests
│   ├── test_health.py         # Health API endpoint tests
│   └── test_reports.py        # Waste report CRUD & Stats tests
├── .env                       # Local development configuration
├── .env.prodlocal             # Staging / Production-Local configuration
├── .env.production            # Production configuration
├── .env.example               # Template with placeholders
├── requirements.txt           # Python pinned dependencies
├── ecosystem.config.js        # PM2 process configuration
├── run.py                     # Standalone Python entry point
└── README.md
```

---

## ⚙️ Backend Environment Files

The backend uses three environment configuration files. **Credentials and database URLs are never hardcoded.**

### 1. `.env` (Local Development)
```env
APP_ENV=local
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reportingportal
SECRET_KEY=local-dev-secret-key-tnpcb-reporting-portal-32chars
CORS_ORIGINS=*
```

### 2. `.env.prodlocal` (Production Local / Staging)
```env
APP_ENV=prodlocal
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@192.168.201.40:5432/reportingportal
SECRET_KEY=prodlocal-secret-key-tnpcb-reporting-portal-32chars
CORS_ORIGINS=*
```

### 3. `.env.production` (Production)
```env
APP_ENV=production
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:production_password@production-db-host:5432/reportingportal
SECRET_KEY=production-secret-key-tnpcb-reporting-portal-32chars
CORS_ORIGINS=https://tnpcb.gov.in,https://tnpcb.gov.in/whitecategory
```

---

## 🐍 Python Virtual Environment Setup

### 1. Create Virtual Environment
```bash
# Windows
py -m venv venv

# Linux / macOS
python3 -m venv venv
```

### 2. Activate Virtual Environment
```bash
# Windows (PowerShell / CMD)
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

### 3. Install Required Dependencies
```bash
pip install -r requirements.txt
```

---

## 🗄️ Database Setup

All database connections are established strictly via the `DATABASE_URL` environment variable through `app/database.py`.

Ensure PostgreSQL is running and the database `reportingportal` is created:
```sql
CREATE DATABASE reportingportal;
```

When the FastAPI server boots up, SQLAlchemy automatically creates the required tables (`waste_reports`) and seeds initial sample records for demonstration.

---

## 🚀 Running FastAPI Locally

### Option A: Using Uvicorn CLI
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option B: Using run.py
```bash
python run.py
```

### Interactive API Documentation:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

---

## 🧪 Running Automated Tests

Run the complete test suite with `pytest`:
```bash
pytest -v
```

All 8 tests (testing configuration loading, CORS origin parser, `/api/health`, `/api/health/db`, `/api/reports` CRUD, and aggregate calculations) execute against an isolated SQLite test database.

---

## ⚡ PM2 Process Manager

The server includes `ecosystem.config.js` with cross-platform Python binary resolution:

### Start Server with PM2
```bash
pm2 start ecosystem.config.js
```

### Check Process Status & Logs
```bash
pm2 status
pm2 logs reportingportal-fastapi
```

### Stop / Restart
```bash
pm2 restart reportingportal-fastapi
pm2 stop reportingportal-fastapi
```

### Linux Python Path
On Linux production servers, PM2 uses `venv/bin/python` automatically. You can also override the interpreter via the `PYTHON_PATH` environment variable if necessary.
