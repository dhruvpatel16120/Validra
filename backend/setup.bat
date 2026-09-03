@echo off
echo ========================================
echo  Validra Backend - Setup Environment
echo ========================================

IF NOT EXIST .venv (
    echo [+] Creating Python virtual environment (.venv)...
    python -m venv .venv
) ELSE (
    echo [=] Virtual environment (.venv) already exists.
)

IF NOT EXIST .env (
    IF EXIST .env.example (
        echo [+] Copying .env.example -^> .env...
        copy .env.example .env
    )
) ELSE (
    echo [=] Environment file (.env) already exists.
)

echo [+] Installing dependencies from requirements.txt...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [✓] Backend setup completed successfully!
echo To start the development server, run:
echo   .venv\Scripts\activate
echo   uvicorn app.main:app --reload
