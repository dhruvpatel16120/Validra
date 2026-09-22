@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   🚀 VALIDRA BACKEND - SETUP ^& ENVIRONMENT BOOTSTRAPPER
echo ============================================================

:: 1. Check Python installation
where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    where py >nul 2>nul
    IF %ERRORLEVEL% NEQ 0 (
        echo [!] Python 3.10+ was not found on PATH.
        echo     Please install Python from https://www.python.org/ and verify 'Add to PATH' is checked.
        exit /b 1
    )
)

:: 2. Create virtual environment if missing
IF NOT EXIST .venv (
    echo [+] Creating Python virtual environment (.venv)...
    python -m venv .venv
    IF %ERRORLEVEL% NEQ 0 (
        echo [!] Could not create .venv. Continuing with system Python...
    )
) ELSE (
    echo [=] Virtual environment (.venv) detected.
)

set PYTHON_BIN=.\.venv\Scripts\python.exe
IF NOT EXIST "%PYTHON_BIN%" (
    set PYTHON_BIN=python
)

:: 3. Launch interactive Python setup
IF EXIST "scripts\setup.py" (
    "%PYTHON_BIN%" scripts\setup.py %*
    exit /b %ERRORLEVEL%
) ELSE (
    echo [!] Notice: scripts\setup.py not found. Running standalone fallback setup...
    IF NOT EXIST .env IF EXIST .env.example copy .env.example .env
    IF NOT EXIST uploads mkdir uploads
    "%PYTHON_BIN%" -m pip install --upgrade pip
    "%PYTHON_BIN%" -m pip install -r requirements.txt
    echo [✓] Standalone fallback setup complete.
)
