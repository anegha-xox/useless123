@echo off
title The Gaslight Mirror
cd /d "%~dp0"

echo ================================================================
echo    THE GASLIGHT MIRROR - BOOTSTRAP SYSTEM
echo ================================================================

where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python was not found in your PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

if not exist venv (
    echo [1/3] Creating virtual environment...
    python -m venv venv
)

echo [2/3] Activating virtual environment & installing requirements...
call venv\Scripts\activate.bat
python -m pip install -q --upgrade pip
python -m pip install -r requirements.txt

echo [3/3] Launching Gaslight Mirror server...
start http://localhost:5000
python app.py

pause
