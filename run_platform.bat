@echo off
title DecisIQ Enterprise Platform Launcher
color 0A

echo ============================================================================
echo   DECISIQ: ENTERPRISE AI DECISION INTELLIGENCE PLATFORM
echo ============================================================================
echo.
echo [*] Starting FastAPI Analytical Engine (Port 8000)...
start "DecisIQ Backend API" cmd /k "python backend/app.py"

echo [*] Starting Vite Glassmorphic Dashboard (Port 5173)...
cd frontend
start "DecisIQ Executive UI" cmd /k "npm run dev"
cd ..

echo.
echo [+] System Online!
echo     - Backend API: http://127.0.0.1:8000
echo     - API Docs:    http://127.0.0.1:8000/docs
echo     - Executive UI: http://localhost:5173
echo.
pause
