@echo off
cd /d "%~dp0"
start "MSM Tracker Dev Server" cmd /k "cd /d ""%~dp0"" && npm run dev"
timeout /t 3 >nul
start http://localhost:5173
