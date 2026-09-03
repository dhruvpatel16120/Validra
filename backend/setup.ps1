# Validra Backend Environment Setup Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Validra Backend - Setup Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Create .venv if it does not exist
if (-not (Test-Path ".venv")) {
    Write-Host "[+] Creating Python virtual environment (.venv)..." -ForegroundColor Yellow
    python -m venv .venv
} else {
    Write-Host "[=] Virtual environment (.venv) already exists." -ForegroundColor Green
}

# 2. Copy .env.example to .env if .env does not exist
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "[+] Copying .env.example -> .env..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    }
} else {
    Write-Host "[=] Environment file (.env) already exists." -ForegroundColor Green
}

# 3. Activate .venv & Install requirements
Write-Host "[+] Installing dependencies from requirements.txt..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "`n[✓] Backend setup completed successfully!" -ForegroundColor Green
Write-Host "To start the development server, run:" -ForegroundColor Cyan
Write-Host "  .\.venv\Scripts\activate" -ForegroundColor White
Write-Host "  uvicorn app.main:app --reload" -ForegroundColor White
