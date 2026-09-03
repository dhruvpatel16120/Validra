# ⚙️ Validra — Backend Services (FastAPI)

<p align="center">
  <a href="../README.md">
    <img src="../Assets/Repo/logo_repo.png" alt="Validra Logo" width="140" />
  </a>
</p>

> **Team VisionMinds — Think. Build. Transform.**  
> **Domain M2:** Backend, REST APIs, PostgreSQL Infrastructure, Auth/JWT, Task Orchestration.

---

## 📖 Overview

The **Validra Backend** is built with **FastAPI**, **Python 3.10+**, and **Pydantic**. It handles secure REST API endpoints, JWT token verification, RBAC permissions, database connections, task orchestration, and integration with downstream Computer Vision, Rule Engine, and RAG services.

---

## ⚡ Quick Start

### 1. Automated Setup Scripts

Automated setup scripts create the virtual environment (`.venv`), configure `.env` (from `.env.example`), and install dependencies from `requirements.txt`.

- **Windows (PowerShell):**
  ```powershell
  .\setup.ps1
  ```
- **Windows (CMD):**
  ```cmd
  setup.bat
  ```
- **Linux / macOS:**
  ```bash
  chmod +x setup.sh
  ./setup.sh
  ```

### 2. Manual Setup

If you prefer manual installation:

```bash
python -m venv .venv
# Activate virtual environment:
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Windows (CMD): .venv\Scripts\activate.bat
# Linux/macOS: source .venv/bin/activate

cp .env.example .env
pip install -r requirements.txt
```

### 3. Start Development Server

```bash
uvicorn app.main:app --reload
```

The backend server will be available at:

- **API Base URL:** `http://127.0.0.1:8000`
- **Swagger Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc Docs:** `http://127.0.0.1:8000/redoc`
- **Health Check Endpoint:** `http://127.0.0.1:8000/health`

---

## 🧪 Running Tests

Execute the unit test suite with `pytest`:

```bash
pytest
```

---

## 🔑 Environment Variables

Configured in `.env`:

```env
PROJECT_NAME=Validra Base API
API_V1_STR=/api/v1
ENV=development
HOST=0.0.0.0
PORT=8000
```

---

## 📁 Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── router.py      # APIRouter definitions & endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py      # BaseSettings configuration
│   ├── __init__.py
│   └── main.py            # FastAPI entrypoint
├── tests/
│   ├── conftest.py        # Pytest fixtures
│   └── test_main.py       # API tests
├── .env.example
├── requirements.txt
├── setup.bat
├── setup.ps1
└── setup.sh
```

---

## 📚 Related Documentation

- ⚙️ [Backend Setup Guide](../docs/setup/backend_setup.mdx)
- 🏗️ [System Architecture Specification](../docs/backend/Architecture.md)
- 📋 [Product Requirements Document (PRD)](../docs/backend/PRD.md)
- 👥 [Team Domain Ownership Mapping](../docs/team-guide/Team_Role.md)
