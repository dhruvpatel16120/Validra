# Validra Backend Environment Setup Script (PowerShell)
# Interactive environment bootstrapper with fallback recovery.

param (
    [switch]$NonInteractive
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  🚀 VALIDRA BACKEND - SETUP & ENVIRONMENT BOOTSTRAPPER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Detect Python command
$PythonCmd = ""
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
} elseif (Get-Command "py" -ErrorAction SilentlyContinue) {
    $PythonCmd = "py -3"
} elseif (Get-Command "python3" -ErrorAction SilentlyContinue) {
    $PythonCmd = "python3"
} else {
    Write-Host "❌ Python 3.10+ was not found on PATH." -ForegroundColor Red
    Write-Host "   Please install Python from https://www.python.org/ and verify 'Add to PATH' is checked." -ForegroundColor Yellow
    exit 1
}

# 2. Check / Create Virtual Environment (.venv)
if (-not (Test-Path ".venv")) {
    Write-Host "[+] Creating Python virtual environment (.venv)..." -ForegroundColor Yellow
    Invoke-Expression "$PythonCmd -m venv .venv"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Could not create .venv using standard command. Continuing with system Python..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[=] Virtual environment (.venv) detected." -ForegroundColor Green
}

$VenvPython = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    $VenvPython = "python"
}

# 3. Launch interactive Python setup script
if (Test-Path "scripts\setup.py") {
    $ScriptArgs = @("scripts\setup.py")
    if ($NonInteractive) {
        $ScriptArgs += "--non-interactive"
    }
    & $VenvPython @ScriptArgs
    exit $LASTEXITCODE
} else {
    # Standalone Fallback
    Write-Host "[!] Notice: scripts\setup.py not found. Running standalone fallback setup..." -ForegroundColor Yellow
    if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
        Copy-Item ".env.example" ".env"
        Write-Host "[+] Created .env from .env.example" -ForegroundColor Green
    }
    if (-not (Test-Path "uploads")) {
        New-Item -ItemType Directory -Path "uploads" | Out-Null
    }
    & $VenvPython -m pip install --upgrade pip
    & $VenvPython -m pip install -r requirements.txt
    Write-Host "[✓] Standalone fallback setup complete." -ForegroundColor Green
}
