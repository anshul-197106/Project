@echo off
title SkillBridge - Full Stack Runner
echo ==========================================
echo    SkillBridge: Starting Services...
echo ==========================================
echo.
echo [1/2] Checking Dependencies...
cd /d "%~dp0"
if not exist node_modules (
    echo [!] Root node_modules missing, installing...
    npm install
)

echo.
echo [2/2] Launching Backend & Frontend Concurrently...
echo.
echo >>> The website will be available at http://localhost:5173
echo.
npm start
pause
