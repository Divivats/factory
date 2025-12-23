@echo off
echo ========================================
echo Factory Monitoring System Launcher
echo ========================================
echo.
echo This will open 2 terminals:
echo   1. Backend (ASP.NET Core) - Port 5000
echo   2. Frontend (React) - Port 3000
echo.
echo Press any key to start...
pause >nul

start "Factory Backend - Port 5000" cmd /k "cd FactoryMonitoringWeb && dotnet run"
timeout /t 3 >nul
start "Factory Frontend - Port 3000" cmd /k "cd factory-react-ui && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Wait 10 seconds, then open:
echo http://localhost:3000
echo.
timeout /t 5
start http://localhost:3000

