@echo off
echo Stopping old VDV processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq VDV Backend*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq VDV Frontend*" >nul 2>&1

echo Starting VDV Schedule App...

:: Start Backend in a new window
echo Starting Backend (Port 8081)...
start "VDV Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8081"

:: Wait for Backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend in a new window
echo Starting Frontend (Port 3001)...
start "VDV Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   App started!
echo   Frontend: http://localhost:3001
echo   Backend:  http://localhost:8081/api
echo ========================================================
pause
