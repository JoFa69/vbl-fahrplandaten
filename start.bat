@echo off
echo Stopping old VDV processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq VDV Backend*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq VDV Frontend*" >nul 2>&1

echo Starting VDV Schedule App...

:: Start Backend in a new window (Port 8000 — must match vite.config.js proxy!)
echo Starting Backend (Port 8000)...
start "VDV Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

:: Wait for Backend to fully initialize before starting Frontend
echo Waiting for Backend to be ready...
set RETRIES=0
:wait_loop
timeout /t 1 /nobreak >nul
set /a RETRIES+=1
powershell -Command "(Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/stats' -UseBasicParsing -TimeoutSec 2).StatusCode" >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Backend is ready!
    goto :start_frontend
)
if %RETRIES% GEQ 15 (
    echo WARNING: Backend did not respond after 15s — starting Frontend anyway.
    goto :start_frontend
)
goto :wait_loop

:start_frontend
:: Start Frontend in a new window (Port 3001)
echo Starting Frontend (Port 3001)...
start "VDV Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   App started!
echo   Frontend: http://localhost:3001
echo   Backend:  http://localhost:8000/api
echo ========================================================
pause
