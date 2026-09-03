#!/usr/bin/env bash
# Validra Backend Environment Setup Script (Bash)

set -e

echo "========================================"
echo " Validra Backend - Setup Environment"
echo "========================================"

# 1. Create .venv if it does not exist
if [ ! -d ".venv" ]; then
    echo "[+] Creating Python virtual environment (.venv)..."
    python3 -m venv .venv
else
    echo "[=] Virtual environment (.venv) already exists."
fi

# 2. Copy .env.example to .env if .env does not exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "[+] Copying .env.example -> .env..."
        cp .env.example .env
    fi
else
    echo "[=] Environment file (.env) already exists."
fi

# 3. Activate .venv & Install requirements
echo "[+] Installing dependencies from requirements.txt..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "[✓] Backend setup completed successfully!"
echo "To start the development server, run:"
echo "  source .venv/bin/activate"
echo "  uvicorn app.main:app --reload"
