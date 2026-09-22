#!/usr/bin/env bash
# Validra Backend Environment Setup Script (Bash)
# Interactive environment bootstrapper with fallback recovery.

set -e

echo "============================================================"
echo "  🚀 VALIDRA BACKEND - SETUP & ENVIRONMENT BOOTSTRAPPER"
echo "============================================================"

# 1. Detect Python
PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    if command -v python &>/dev/null; then
        PYTHON_CMD="python"
    else
        echo "❌ Python 3.10+ was not found on PATH."
        echo "   Please install Python 3 and verify it is available in your shell."
        exit 1
    fi
fi

# 2. Check / Create Virtual Environment (.venv)
if [ ! -d ".venv" ]; then
    echo "[+] Creating Python virtual environment (.venv)..."
    "$PYTHON_CMD" -m venv .venv || echo "⚠️  Could not create .venv. Continuing with system Python..."
else
    echo "[=] Virtual environment (.venv) detected."
fi

PYTHON_BIN=".venv/bin/python"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="$PYTHON_CMD"
fi

# 3. Launch interactive Python setup
if [ -f "scripts/setup.py" ]; then
    "$PYTHON_BIN" scripts/setup.py "$@"
    exit $?
else
    echo "[!] Notice: scripts/setup.py not found. Running standalone fallback setup..."
    [ ! -f .env ] && [ -f .env.example ] && cp .env.example .env
    mkdir -p uploads
    "$PYTHON_BIN" -m pip install --upgrade pip
    "$PYTHON_BIN" -m pip install -r requirements.txt
    echo "[✓] Standalone fallback setup complete."
fi
