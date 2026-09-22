/**
 * PM2 Ecosystem Configuration for FastAPI Application
 * Cross-platform support for Windows (venv/Scripts/python.exe) and Linux (venv/bin/python).
 */
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
      env: {
        APP_ENV: 'local',
      },
      env_prodlocal: {
        APP_ENV: 'prodlocal',
      },
      env_production: {
        APP_ENV: 'production',
      },
    },
  ],
};
