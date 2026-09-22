# TNPCB Waste Reporting Portal - Frontend

Modern React application built with **Vite**, **Ant Design (antd)**, **Axios**, and **React Router** for the **Tamil Nadu Pollution Control Board (TNPCB) CM Dashboard-TNEGA Reporting Portal**.

---

## 🚀 Features

- **Responsive Ant Design Layout**: Optimized for desktop and tablet data entry.
- **District Office Form**: Monthly return submission for E-Waste, Bio-Medical Waste, and Plastic Waste.
- **Board Section Dashboard**: Verification table with filtering, search, status approval/revision, and CSV export.
- **System Health Monitor**: Live diagnostics verifying backend API connectivity, latency, and environment parameters.
- **Environment-Isolated Builds**: Supports Local, Staging (`prodlocal`), and Production (`prod`) build targets.

---

## 📁 Directory Structure

```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── StatusTag.jsx
│   │   └── HealthStatusCard.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── DistrictEntryPage.jsx
│   │   ├── BoardDashboardPage.jsx
│   │   ├── HealthPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── services/
│   │   ├── api.js             # Central Axios instance with VITE_API_BASE
│   │   ├── healthService.js
│   │   └── reportService.js
│   ├── hooks/
│   │   ├── useHealth.js
│   │   └── useReports.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── formatters.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                       # Local development config
├── .env.prodlocal             # Staging / Production-Local config
├── .env.production            # Production config
├── .env.example               # Template example
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Environment Configuration

The frontend uses three environment files:

| Environment | File | `VITE_API_BASE` |
|---|---|---|
| **Local Development** | `.env` | `http://192.168.201.40:5000/api` |
| **Production Local / Staging** | `.env.prodlocal` | `http://192.168.201.40:5000/api` |
| **Production** | `.env.production` | `https://tnpcb.gov.in/whitecategory/api` |

> **Note**: In components and services, never hardcode URLs. All requests access `import.meta.env.VITE_API_BASE` through `src/services/api.js`.

---

## 🛠️ Scripts & Build Commands

### 1. Local Development
```bash
npm run dev
```
Starts Vite local development server (default at `http://localhost:5173`).

### 2. Production Local / Staging Build
```bash
npm run build:prodlocal
```
Outputs optimized static assets to `frontend/prodlocal/` with base path `/whitecategory/ui/`.

### 3. Production Build
```bash
npm run build:prod
```
Outputs optimized static assets to `frontend/prod/` with base path `/whitecategory/ui/`.

### 4. Preview Build
```bash
npm run preview
```
Previews local build output.
