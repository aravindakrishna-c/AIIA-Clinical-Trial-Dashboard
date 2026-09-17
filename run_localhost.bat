@echo off
title AIIA CTMS Localhost Starter
echo =======================================================
echo   AIIA Clinical Trials Management System (CTMS)
echo   Ministry of Ayush ^& All India Institute of Ayurveda
echo =======================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Database Initialization...
"%~dp0backend\venv\Scripts\python.exe" -m app.database.init_db
echo Database OK.
echo.

echo [2/3] Starting Backend API Server (Port 8000)...
start "AIIA Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo [3/3] Starting Frontend Dev Server (Port 5173)...
start "AIIA Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo =======================================================
echo   Both servers launched successfully!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://127.0.0.1:8000
echo   API Docs:  http://127.0.0.1:8000/docs
echo =======================================================
echo Opening browser...
start http://localhost:5173
echo.
pause
