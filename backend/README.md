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

The **Validra Backend** is built with **FastAPI**, **Python 3.10+**, **SQLAlchemy 2.0 (asyncpg)**, and **Pydantic v2**. It provides high-performance asynchronous REST API endpoints, JWT token verification, RBAC permissions, database persistence, task orchestration, EasyOCR text detection, Groq Cloud LLM statutory entity extraction, deterministic Legal Metrology rule validation, and ReportLab PDF report generation.

---

## ⚡ Quick Start

### 1. Interactive Setup Wizard (Recommended)

An interactive setup wizard manages `.venv`, synchronizes configuration from `frontend/.env` (DB URL, JWT Secret, SMTP), installs dependencies with an automatic fallback mechanism, and checks PostgreSQL connectivity:

- **Windows (PowerShell):**

  ```powershell
  .\setup.ps1
  ```

  _(For automated CI/CD without prompts: `.\setup.ps1 -NonInteractive`)_

- **Windows (CMD):**

  ```cmd
  setup.bat
  ```

  _(Automated: `setup.bat --non-interactive`)_

- **Linux / macOS:**

  ```bash
  chmod +x setup.sh
  ./setup.sh
  ```

  _(Automated: `./setup.sh --non-interactive`)_

- **Direct Python:**
  ```bash
  python scripts/setup.py
  ```
  _(Automated: `python scripts/setup.py -y`)_

### 2. Manual Setup

If you prefer manual setup:

```bash
python -m venv .venv

# Activate virtual environment:
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Windows (CMD): .venv\Scripts\activate.bat
# Linux/macOS: source .venv/bin/activate

cp .env.example .env
pip install --upgrade pip
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

Configured in `.env` (template provided in `.env.example`):

```env
# Application Settings
PROJECT_NAME="Validra API"
API_STR="/ml-api"
ENV="development"
HOST="0.0.0.0"
PORT=8000

# Database (PostgreSQL)
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/validra"
DATABASE_ECHO=false

# Authentication & Security (Must match frontend/.env)
JWT_SECRET="validra-secret-key-change-in-production-min-32-chars"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM Extraction (Groq Cloud)
GROQ_API_KEY=""

# Email Notifications (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
EMAILS_FROM_EMAIL="noreply@validra.gov.in"
EMAILS_FROM_NAME="Validra System"
```

---

## 📁 Directory Structure

```text
backend/
├── app/
│   ├── api/                  # Direct REST endpoints (mounted at /api)
│   │   ├── admin.py          # Rule management & audit log queries
│   │   ├── auth.py           # Login, registration, password recovery
│   │   ├── deps.py           # Dependency injection (Auth, DB session)
│   │   ├── inspections.py    # Inspection detail, finding reviews, finalization
│   │   ├── reports.py        # ReportLab PDF generation and download
│   │   ├── router.py         # Root APIRouter combining all sub-routers
│   │   ├── rules.py          # Statutory rule listing & details
│   │   ├── scans.py          # Multi-panel package upload & scan dispatch
│   │   └── users.py          # User profile and role management
│   ├── core/
│   │   ├── config.py         # Pydantic BaseSettings (.env configuration)
│   │   └── security.py       # JWT verification & password hashing
│   ├── db/
│   │   ├── init_db.py        # Table initialization & lifespan hook
│   │   ├── seed_rules.py     # Legal Metrology C01–C26 rule seeder
│   │   └── session.py        # Async SQLAlchemy engine & sessionmaker
│   ├── models/               # SQLAlchemy 2.0 domain models
│   │   ├── audit_log.py      # Immutable security & action logs
│   │   ├── inspection.py     # Core inspection record & Image model
│   │   ├── report.py         # Violation escalation & report records
│   │   ├── rule.py           # Statutory checklist definitions
│   │   ├── scan_result.py    # Evaluated rule findings
│   │   └── user.py           # User accounts & RBAC
│   ├── schemas/              # Pydantic v2 request/response contracts
│   ├── services/             # Core business logic
│   │   ├── easyocr_service.py # Portable EasyOCR runner (asyncio.to_thread)
│   │   ├── email_service.py   # Async SMTP notifications
│   │   ├── groq_service.py    # Groq LLM statutory declaration extractor
│   │   ├── report_service.py  # ReportLab Platypus PDF report builder
│   │   └── rule_engine.py     # Deterministic Legal Metrology evaluator
│   └── main.py               # FastAPI entrypoint with lifespan DB init
├── data/                     # Local data & sample assets
├── scripts/
│   └── setup.py              # Interactive terminal setup wizard
├── tests/                    # Pytest test suite
│   ├── conftest.py
│   └── test_main.py
├── uploads/                  # Scan images & generated PDF reports
├── .env.example
├── pytest.ini
├── requirements.txt
├── setup.bat
├── setup.ps1
└── setup.sh
```

---

## 📚 Related Documentation

- ⚙️ [Backend Setup Guide](../docs/setup/backend_setup.md)
- 📐 [Backend Architecture Blueprint](../docs/blueprints/backend/backend-blueprint.md)
- 🏛️ [Master System Architecture](../docs/Architecture.md)
- 📋 [Product Requirements Document (PRD)](../docs/PRD.md)
- 👥 [Team Domain Ownership Mapping](../docs/team-guide/Team_Role.md)
