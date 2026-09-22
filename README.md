# TNPCB CM Dashboard-TNEGA Reporting Portal
### Production-Ready Full-Stack React + FastAPI Application

Comprehensive reporting portal for the **Tamil Nadu Pollution Control Board (TNPCB)** to record, verify, and compile monthly district returns for **E-Waste**, **Bio-Medical Waste**, and **Plastic Waste Management** feeding into the **CM Dashboard - TNEGA**.

---

## 🏗️ Repository Architecture

The project is structured into two completely decoupled tiers:

```text
reportingportal/
├── .gitignore                         # Multi-environment secrets and build artifact rules
├── README.md                          # Master documentation & setup guide
├── frontend/                          # React + Vite + Ant Design single-page app
│   ├── public/
│   ├── src/
│   │   ├── components/                # Navbar, Footer, StatusTag, HealthStatusCard
│   │   ├── pages/                     # Landing, DistrictEntry, BoardDashboard, Health, 404
│   │   ├── services/                  # api.js (Central Axios client), healthService, reportService
│   │   ├── hooks/                     # useHealth, useReports
│   │   ├── utils/                     # constants, formatters
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                  # Custom theme tokens & responsive styles
│   ├── .env                           # Local development frontend config
│   ├── .env.prodlocal                 # Staging / Production-Local config
│   ├── .env.production                # Production config
│   ├── .env.example                   # Template config
│   ├── package.json                   # Build scripts for prod, prodlocal, and dev
│   ├── vite.config.js
│   └── README.md
└── server/                            # FastAPI Python REST API & PostgreSQL backend
    ├── venv/                          # Python isolated virtual environment
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                    # FastAPI entrypoint, CORS, lifespan, exception handlers
    │   ├── config.py                  # Pydantic BaseSettings loading environment dynamically
    │   ├── database.py                # Centralized SQLAlchemy engine & session dependency
    │   ├── models/                    # WasteReport table model
    │   ├── schemas/                   # Pydantic validation models
    │   ├── routers/                   # /api/health and /api/reports routers
    │   ├── services/                  # Business logic & seeding
    │   └── utils/                     # Structured logging
    ├── tests/                         # Pytest test suite (100% passing)
    ├── .env                           # Local server config
    ├── .env.prodlocal                 # Staging server config
    ├── .env.production                # Production server config
    ├── .env.example                   # Template config
    ├── requirements.txt               # Pinned backend dependencies
    ├── ecosystem.config.js            # PM2 cross-platform process manager config
    ├── run.py                         # Standalone runner
    └── README.md
```

---

## 1. Project Creation

The frontend application was initialized using **Vite** with the React template:

```bash
npm create vite@latest frontend -- --template react
```

This creates an ultra-fast build setup with native ES modules, Hot Module Replacement (HMR), and modular bundling.

---

## 2. Ant Design Installation

**Ant Design (antd)** and its official icons package were integrated to provide an enterprise-grade, accessible, and responsive UI design system:

```bash
cd frontend
npm install antd @ant-design/icons
```

Custom branding is applied using Ant Design's `ConfigProvider` configured with TNPCB primary theme color (`#0b4f8a`).

---

## 3. Axios Installation

**Axios** was installed alongside **React Router** for API communication and client-side routing:

```bash
cd frontend
npm install axios react-router-dom
```

A central API instance is encapsulated in `frontend/src/services/api.js`:
- Base URL dynamically initialized from `import.meta.env.VITE_API_BASE`.
- Request and response interceptors handle consistent payload formatting and error propagation.

---

## 4. Frontend Environment Files

Three distinct environment files configure the API endpoint target without code modification:

### `.env` (Local Development)
```env
VITE_API_BASE=http://192.168.201.40:5000/api
```

### `.env.prodlocal` (Production Local / Staging)
```env
VITE_API_BASE=http://192.168.201.40:5000/api
```

### `.env.production` (Production)
```env
VITE_API_BASE=https://tnpcb.gov.in/whitecategory/api
```

### `.env.example` (Template)
```env
VITE_API_BASE=http://192.168.201.40:5000/api
```

> **Rule**: Components **never** hardcode URLs. All requests access the central client in `src/services/api.js`.

---

## 5. Frontend Build Commands

The frontend `package.json` contains specialized build scripts:

```bash
# 1. Start local Vite development server
npm run dev

# 2. Build for Production Local / Staging (Outputs to frontend/prodlocal/)
npm run build:prodlocal

# 3. Build for Production (Outputs to frontend/prod/)
npm run build:prod

# 4. Preview local build
npm run preview
```

Output directories generated:
- `frontend/prodlocal/` with base path `/whitecategory/ui/`
- `frontend/prod/` with base path `/whitecategory/ui/`

---

## 6. Python Virtual Environment

The backend utilizes an isolated Python virtual environment (`venv`) to avoid dependency collisions:

### Create Virtual Environment
```bash
# Windows
py -m venv server/venv

# Linux / macOS
python3 -m venv server/venv
```

### Activate Virtual Environment
```bash
# Windows (PowerShell / CMD)
server\venv\Scripts\activate

# Linux / macOS
source server/venv/bin/activate
```

---

## 7. Python Package Installation

All server dependencies are declared in `server/requirements.txt`:

```bash
cd server
pip install -r requirements.txt
```

### `requirements.txt` Packages:
- `fastapi` - Modern, high-performance web framework
- `uvicorn[standard]` - Lightning-fast ASGI web server
- `pydantic` & `pydantic-settings` - Robust data validation and dynamic environment settings loading
- `python-dotenv` - Dotenv file parser
- `sqlalchemy` - SQL toolkit and Object-Relational Mapper (ORM)
- `psycopg2-binary` - PostgreSQL database adapter
- `pytest` - Automated testing framework
- `httpx` - Async HTTP client for test integration

---

## 8. Backend Environment Files

The backend configuration is managed dynamically by `app/config.py` using Pydantic's `BaseSettings`.

### `server/.env` (Local)
```env
APP_ENV=local
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reportingportal
SECRET_KEY=local-dev-secret-key-tnpcb-reporting-portal-32chars
CORS_ORIGINS=*
```

### `server/.env.prodlocal` (Staging)
```env
APP_ENV=prodlocal
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@192.168.201.40:5432/reportingportal
SECRET_KEY=prodlocal-secret-key-tnpcb-reporting-portal-32chars
CORS_ORIGINS=*
```

### `server/.env.production` (Production)
```env
APP_ENV=production
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:production_password@production-db-host:5432/reportingportal
SECRET_KEY=production-secret-key-tnpcb-reporting-portal-32chars
CORS_ORIGINS=https://tnpcb.gov.in,https://tnpcb.gov.in/whitecategory
```

---

## 9. Database Configuration

- Database connections are strictly managed via the `DATABASE_URL` environment variable.
- Connection pooling, health probing, and session lifecycle are centralized in `server/app/database.py`.
- No database credentials or connection strings are ever hardcoded in application logic.
- When the server boots, `init_db()` automatically registers table schemas and safely seeds demonstration records if the table is empty.

---

## 10. FastAPI Architecture & Endpoints

All API routes are grouped into routers mounted under the `/api` prefix:

### 1. Health Router (`/api/health`)
- `GET /api/health` — Returns status, active environment (`local` / `prodlocal` / `production`), database connectivity, server timestamp, and version.
- `GET /api/health/db` — Detailed PostgreSQL connectivity check.

### 2. Reports Router (`/api/reports`)
- `GET /api/reports` — List waste reports with filtering (`district_name`, `waste_type`, `status`, `reporting_month`, `limit`, `offset`).
- `POST /api/reports` — Submit new monthly district waste return.
- `GET /api/reports/{id}` — Fetch specific report by primary key.
- `PATCH /api/reports/{id}/status` — Verify or request revision with remarks (Board Section).
- `GET /api/reports/stats/summary` — Overview metrics for dashboard KPIs.

### Interactive API Documentation
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

---

## 11. Automated Testing

The server includes a complete test suite written in `pytest` located in `server/tests/`:

```bash
cd server
.\venv\Scripts\pytest -v
```

### Test Coverage:
1. `test_config.py` — Dynamic environment file loading and CORS origin parsing.
2. `test_health.py` — Root endpoint, `/api/health`, and `/api/health/db`.
3. `test_reports.py` — Report creation, filtering, status transitions, and aggregate calculations.

*All tests run against an isolated in-memory test database and pass with zero errors.*

---

## 12. Running FastAPI Manually

To run the FastAPI server directly with Uvicorn:

```bash
cd server

# Activate venv
venv\Scripts\activate

# Launch with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or using the standalone entry point:
```bash
python run.py
```

---

## 13. PM2 Process Manager

PM2 configuration is defined in `server/ecosystem.config.js` with cross-platform Python binary discovery:

```javascript
const path = require('path');

const isWindows = process.platform === 'win32';
const pythonPath = process.env.PYTHON_PATH || (isWindows ? 'venv/Scripts/python.exe' : 'venv/bin/python');

module.exports = {
  apps: [
    {
      name: 'reportingportal-fastapi',
      script: pythonPath,
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8000',
      cwd: __dirname,
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: { APP_ENV: 'local' },
      env_prodlocal: { APP_ENV: 'prodlocal' },
      env_production: { APP_ENV: 'production' }
    }
  ]
};
```

### PM2 Commands:
```bash
# Start server
pm2 start ecosystem.config.js

# Start with specific environment
pm2 start ecosystem.config.js --env prodlocal
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View live logs
pm2 logs reportingportal-fastapi

# Restart or stop
pm2 restart reportingportal-fastapi
pm2 stop reportingportal-fastapi

# Save PM2 state (if supported)
pm2 save
```
# pm2 reload
pm2 reload reportingportal-fastapi

---

## 14. Production Build Verification

To compile the frontend for production or staging deployment:

```bash
cd frontend

# Production Build -> frontend/prod/
npm run build:prod

# Staging Build -> frontend/prodlocal/
npm run build:prodlocal
```

Verification output:
```text
frontend/prod/
├── index.html
└── assets/
    ├── index-X3YI3p3A.css
    └── index-Bu4bbsrA.js

frontend/prodlocal/
├── index.html
└── assets/
    ├── index-X3YI3p3A.css
    └── index-k1h_dy3f.js
```

---

## 15. Deployment Architecture

```text
               +----------------------------------------------------+
               |              TNPCB Web Gateway / Reverse Proxy     |
               +-------------------------+--------------------------+
                                         |
            +----------------------------+----------------------------+
            |                                                         |
            v                                                         v
   [Frontend Static Server]                                  [Backend PM2 / Uvicorn]
   Path: /whitecategory/ui/                                   Path: /api/*
   Files: frontend/prod/ or frontend/prodlocal/               Host: 0.0.0.0:8000
                                                                      |
                                                                      v
                                                             [PostgreSQL Database]
                                                             Host: production-db-host:5432
                                                             DB: reportingportal
```

### Deployment Steps:
1. **Frontend**: Deploy contents of `frontend/prod/` (or `frontend/prodlocal/`) to your web server / NGINX / Apache document root under the base path `/whitecategory/ui/`.
2. **Backend**:
   - Copy `server/` to the application server.
   - Create Python virtual environment: `python3 -m venv venv`.
   - Install packages: `venv/bin/pip install -r requirements.txt`.
   - Ensure PostgreSQL database `reportingportal` is created and accessible.
   - Start process with PM2: `pm2 start ecosystem.config.js --env production`.
3. **Reverse Proxy (NGINX Example)**:
   ```nginx
   # Static Frontend UI
   location /whitecategory/ui/ {
       alias /var/www/reportingportal/frontend/prod/;
       try_files $uri $uri/ /whitecategory/ui/index.html;
   }

   # FastAPI Backend
   location /whitecategory/api/ {
       proxy_pass http://127.0.0.1:8000/api/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

---

## 🛡️ Security & Git Best Practices

The root `.gitignore` protects all sensitive credentials and environment files from being tracked:
- `.env`, `.env.prodlocal`, `.env.production` are ignored.
- Build output directories (`dist/`, `prod/`, `prodlocal/`) are excluded.
- Python caches (`__pycache__/`, `.pytest_cache/`, `*.pyc`) and `venv/` are excluded.
- Node modules (`node_modules/`) are excluded.
- Safe templates (`.env.example`) are provided with non-sensitive placeholder values.
