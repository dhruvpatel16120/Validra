# ⚙️ Validr a— Backend Setup Guide

<p align="center">
  <a href="../../README.md">
    <img src="../../Assets/Repo/logo_repo.png" alt="Validra Logo" width="140" />
  </a>
</p>

> **Team VisionMinds — Think. Build. Transform.**  
> **Domain M2:** Backend & Infrastructure

---

## 📋 System Requirements

| Tool           | Required Version         | Purpose                      |
| :------------- | :----------------------- | :--------------------------- |
| **Python**     | 3.10+ (3.12 recommended) | FastAPI Backend & AI Runtime |
| **pip**        | Latest                   | Python Package Manager       |
| **PostgreSQL** | 15+                      | Database                     |
| **Git**        | 2.40+                    | Version Control              |

> [!IMPORTANT]
> Complete the [Base Setup Guide](./base_setup.mdx) first if you haven't installed these tools.

---

## 📦 Current Stack

| Package                                                                                                                    | Version          | Purpose                                                                       |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| [FastAPI](https://fastapi.tiangolo.com/)                                                                                   | ≥0.100.0         | High-performance async REST API framework                                     |
| [Uvicorn](https://www.uvicorn.org/)                                                                                        | ≥0.22.0          | ASGI web server with live reload                                              |
| [Pydantic](https://docs.pydantic.dev/) & [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) | ≥2.0.0           | Type validation & `.env` configuration management                             |
| [SQLAlchemy[asyncio]](https://www.sqlalchemy.org/)                                                                         | ≥2.0.0           | Async ORM for PostgreSQL persistence                                          |
| [asyncpg](https://github.com/MagicStack/asyncpg)                                                                           | ≥0.29.0          | High-performance async PostgreSQL database driver                             |
| [python-jose[cryptography]](https://github.com/mpdavis/python-jose)                                                        | ≥3.3.0           | NextAuth v5 JWT verification & cryptographic claims decoding                  |
| [passlib[bcrypt]](https://passlib.readthedocs.io/)                                                                         | ≥1.7.4           | Password hashing and verification utilities                                   |
| [EasyOCR](https://github.com/JaidedAI/EasyOCR)                                                                             | ≥1.7.0           | Portable multi-language OCR engine for detection and recognition              |
| [OpenCV](https://opencv.org/) (`opencv-python-headless`)                                                                   | ≥4.8.0           | Quality assessment (Laplacian blur, glare), CLAHE contrast & spatial geometry |
| [Pillow (PIL)](https://python-pillow.org/)                                                                                 | ≥10.0.0          | Image processing, EXIF transposition, crops & evidence annotations            |
| [Groq](https://groq.com/)                                                                                                  | ≥0.9.0           | High-speed LLM inference for statutory declaration field extraction           |
| [ReportLab](https://www.reportlab.com/)                                                                                    | ≥5.0.0           | Court-admissible statutory inspection audit PDF report compilation            |
| [aiosmtplib](https://github.com/cole/aiosmtplib)                                                                           | ≥3.0.0           | Asynchronous SMTP client for dispatching email audit reports                  |
| [python-multipart](https://github.com/Kludex/python-multipart)                                                             | ≥0.0.9           | Streaming multipart/form-data multi-panel image uploads                       |
| [pytest](https://docs.pytest.org/) & [httpx](https://www.python-httpx.org/)                                                | ≥7.4.0 / ≥0.24.0 | Unit, integration & async API testing suite                                   |

> [!TIP]
> For OCR engine architecture, refer to the [Computer Vision & OCR Pipeline Architecture](../blueprints/backend/backend-blueprint.md#4-ocr--computer-vision-pipeline-architecture) in the backend blueprint.

---

## 🚀 Quick Setup (Interactive Bootstrapper)

The backend provides an interactive setup wizard matching the frontend setup experience:

- **Interactive `.env` Wizard**: Offers options to keep, backup (`.env.backup.<timestamp>`), or overwrite; auto-detects existing configurations and synchronizes shared keys (PostgreSQL database, NextAuth JWT secret, SMTP settings) from `frontend/.env`.
- **Automatic `.venv` Management**: Creates and verifies the Python virtual environment.
- **Dependency Installation with Fallback**: Upgrades `pip`, installs `requirements.txt`, and features intelligent fallback to core API essentials if heavy OCR wheels encounter environment issues.
- **Database Connectivity & Seeding with Fallback**: Non-blocking connectivity test that automatically initializes tables via `init_db()` and seeds default Legal Metrology rules (`C01`–`C26`).
- **Non-Interactive Mode**: Pass `-NonInteractive` or `-y` for automated CI/CD pipelines.

### Windows (PowerShell)

```powershell
cd backend
.\setup.ps1
```

> [!TIP]
> For silent / CI automated setup: `.\setup.ps1 -NonInteractive`

### Windows (CMD)

```cmd
cd backend
setup.bat
```

### Linux / macOS

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

### Direct Python Invocation

```bash
cd backend
python scripts/setup.py
# Or non-interactive:
python scripts/setup.py -y
```

---

## 🛠️ Manual Setup (Step-by-Step)

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate Virtual Environment

| Platform                 | Command                      |
| ------------------------ | ---------------------------- |
| **Windows (PowerShell)** | `.venv\Scripts\Activate.ps1` |
| **Windows (CMD)**        | `.venv\Scripts\activate.bat` |
| **Linux / macOS**        | `source .venv/bin/activate`  |

You should see `(.venv)` at the start of your terminal prompt.

> [!TIP]
> If PowerShell blocks the activation script, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
PROJECT_NAME=Validra Base API
API_STR=/ml-api
ENV=development
HOST=0.0.0.0
PORT=8000

# ─── Database (PostgreSQL via SQLAlchemy async) ───
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/validra

# ─── Storage & File Constraints ───
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_BYTES=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/bmp

# ─── Auth & Security (NextAuth / JWT Shared Secret) ───
AUTH_SECRET=validra-default-jwt-secret-key-change-in-production
NEXTAUTH_SECRET=validra-default-jwt-secret-key-change-in-production

# ─── OCR & Extraction (Groq LLM + OCR.space) ───
OCR_SPACE_API_KEY=
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# ─── Notifications & Email (SMTP / Nodemailer Compatible) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@validra.gov.in
REPORT_RECIPIENT_EMAIL=complaints.metrology@gov.in
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Set Up PostgreSQL & SQLAlchemy (Database Layer)

SQLAlchemy 2.0 (async with `asyncpg`) is configured as the backend ORM for FastAPI, handling inspections, uploaded image panels, scan results, Legal Metrology rules, reports, and audit logs.

#### 1. Create the PostgreSQL Database

If you haven't created the database yet:

```bash
psql -U postgres
```

In the PostgreSQL prompt:

```sql
CREATE DATABASE validra;
\q
```

#### 2. Database Connection Architecture & Lifespan Bootstrapping

Validra organizes database management inside `app/db/`:

- **[`app/db/base.py`](../../backend/app/db/base.py)**: Modern SQLAlchemy 2.0 `DeclarativeBase` (`Base`).
- **[`app/db/session.py`](../../backend/app/db/session.py)**: Async engine (`create_async_engine`), async session factory (`async_sessionmaker`), `get_db` dependency, and `init_db()`.
- **Automatic Table Initialization & Seeding**:
  When the FastAPI application boots, the lifespan hook in [`app/main.py`](../../backend/app/main.py) automatically:
  1. Invokes `await init_db()`, executing `Base.metadata.create_all()` across all models (`User`, `Inspection`, `Image`, `ScanResult`, `Rule`, `Report`, `AuditLog`).
  2. Invokes `await seed_default_rules(session)`, automatically populating default Legal Metrology rules (`C01`–`C26`) if the rules table is empty.
  3. Ensures the local uploads folder (`uploads/`) exists and is mounted at `/uploads` for static panel evidence images.

- **`get_db()` dependency**: Asynchronous generator yielding database sessions per API request with automatic commit/cleanup:

  ```python
  from fastapi import Depends
  from sqlalchemy.ext.asyncio import AsyncSession
  from app.db.session import get_db

  @router.get("/items")
  async def read_items(db: AsyncSession = Depends(get_db)):
      ...
  ```

#### 3. Dual-ORM Architecture (Prisma + SQLAlchemy)

Validra uses a shared PostgreSQL database between the Next.js frontend (Prisma ORM) and the FastAPI backend (SQLAlchemy 2.0):

- **User Accounts (`users`)**: Authenticated via NextAuth v5 in Next.js, verified cryptographically in FastAPI via [`app/core/security.py`](../../backend/app/core/security.py) using the shared `AUTH_SECRET` / `NEXTAUTH_SECRET`.
- **Audit Logs (`audit_logs`)**: Tamper-evident activity logs written by both frontend actions and backend inspection events.

#### 4. Test Database Configuration

Verify the database module and API endpoints:

```bash
pytest -v tests/test_main.py
```

---

## 🏃 Running the Backend Server

Start the live-reloading development server:

```bash
uvicorn app.main:app --reload
```

| URL                            | Purpose                  |
| :----------------------------- | :----------------------- |
| `http://127.0.0.1:8000`        | API Base URL             |
| `http://127.0.0.1:8000/docs`   | Swagger Interactive Docs |
| `http://127.0.0.1:8000/redoc`  | ReDoc Interactive Docs   |
| `http://127.0.0.1:8000/health` | Health Check Endpoint    |

> [!TIP]
> Swagger at `/docs` is the fastest way to test API endpoints during development.

---

## 🧪 Running Tests

```bash
pytest
```

Run with verbose output:

```bash
pytest -v
```

Run a specific test file:

```bash
pytest tests/test_main.py -v
```

---

## 📁 Current Directory Structure

```text
backend/
├── app/
│   ├── main.py                # FastAPI entrypoint + lifespan + CORS + /api mount + /uploads static
│   ├── api/                   # API routers mounted under /api
│   │   ├── admin/             # Admin endpoints (dashboard, users, rules, reports, scans, audit_logs)
│   │   ├── auth.py            # POST /api/auth/verify-token (NextAuth JWT validation)
│   │   ├── dashboard.py       # GET /api/dashboard (Inspector stats & compliance metrics)
│   │   ├── deps.py            # NextAuth JWT extraction, get_current_user, require_role guards
│   │   ├── inspections.py     # Inspection review, finding overrides & finalization
│   │   ├── reports.py         # PDF report compilation, download & SHA-256 verification
│   │   ├── router.py          # Central APIRouter mounting feature routers
│   │   ├── rules.py           # GET /api/rules, GET /api/rules/{rule_id}
│   │   ├── scans.py           # Multi-panel upload, OCR pipeline dispatch & progress retrieval
│   │   └── users.py           # /api/users/me and /api/profile user endpoints
│   ├── core/
│   │   ├── config.py          # Pydantic BaseSettings (.env loading, JWT, SMTP, Groq keys)
│   │   └── security.py        # NextAuth v5 HS256 JWT decoding & claims verification
│   ├── db/
│   │   ├── base.py            # DeclarativeBase (Base)
│   │   └── session.py         # AsyncEngine, AsyncSessionLocal, get_db, init_db
│   ├── models/                # SQLAlchemy 2.0 ORM models
│   │   ├── audit_log.py       # AuditLog model (shared with frontend Prisma audit_logs)
│   │   ├── inspection.py      # Inspection & Image models (multi-panel scan records)
│   │   ├── report.py          # Report model (SHA-256 hash & PDF metadata)
│   │   ├── rule.py            # Rule model (Legal Metrology C01–C26 clauses)
│   │   ├── scan_result.py     # ScanResult model (findings per rule)
│   │   └── user.py            # User model (shared with frontend Prisma users)
│   ├── schemas/               # Pydantic v2 validation schemas
│   │   ├── dashboard.py       # Dashboard metric responses
│   │   ├── report.py          # Report creation & download schemas
│   │   ├── rule.py            # Legal Metrology rule schemas
│   │   ├── scan.py            # Multi-panel scan requests & inspection responses
│   │   └── user.py            # User profiles & token verification schemas
│   ├── services/              # Business logic & external service connectors
│   │   ├── email_service.py   # Async SMTP dispatch via aiosmtplib
│   │   ├── extraction_service.py # Groq LLM statutory declaration extractor
│   │   ├── ocr_service.py     # Legacy OCR helper fallback
│   │   ├── report_service.py  # ReportLab court-admissible PDF generation
│   │   ├── rule_engine.py     # Deterministic Legal Metrology rule evaluation
│   │   ├── seed_rules.py      # Startup rule seeder (C01–C26)
│   │   └── ocr/               # Modular Computer Vision (M3) OCR Pipeline
│   │       ├── engine.py      # EasyOCR portable singleton runtime
│   │       ├── field_parser.py # Regex token extractor for MRP, FSSAI, net quantity, dates
│   │       ├── geometry.py    # Bounding box polygons & visual evidence overlays
│   │       ├── measurement.py # Font size & character height measurement
│   │       ├── ocr_main.py    # OCRPipeline coordinator (single-pass RGB upscale)
│   │       ├── preprocessor.py # CLAHE, deskew, upscale & multi-variant preprocessing
│   │       ├── quality_gate.py # Laplacian blur, brightness & glare assessment
│   │       ├── storage.py     # Local file persistence helper for scans
│   │       └── variant_fusion.py # Deduplication & spatial IoU box clustering
│   └── utils/
│       └── image_validation.py # MIME type & image payload validation
├── uploads/                   # Local static evidence & report storage
├── tests/                     # Pytest suite
│   ├── conftest.py            # Fixtures & mock client
│   └── test_main.py           # API health & routing tests
├── .env                       # Local secrets (git-ignored)
├── .env.example               # Environment template
├── requirements.txt           # Python dependencies
├── setup.bat / setup.ps1 / setup.sh # Automated setup scripts
```

---

## 👥 Module Ownership

| Module | Domain                      | Owner         | Directory                                                                                                     |
| ------ | --------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| M1     | Frontend                    | Frontend Lead | `frontend/`                                                                                                   |
| M2     | Backend & Infrastructure    | Backend Lead  | `backend/app/api/`, `backend/app/db/`, `backend/app/models/`, `backend/app/schemas/`, `backend/app/services/` |
| M3     | Computer Vision & OCR       | CV Lead       | `backend/app/services/ocr/`, `cv/`                                                                            |
| M4     | Legal Metrology Rule Engine | Rules Lead    | `backend/app/services/rule_engine.py`, `rule-engine/`                                                         |
| M5     | Research & QA               | QA Lead       | `backend/tests/`, `qa/`, `research/`                                                                          |

---

## 📖 Blueprints — What to Build

| Blueprint                     | Location                                                                  |
| ----------------------------- | ------------------------------------------------------------------------- |
| Backend API Design            | [docs/blueprints/backend/](../blueprints/backend/backend-blueprint.md)    |
| Full System Blueprint         | [docs/blueprint.md](../blueprint.md)                                      |
| Database Schema (Prisma/Auth) | [docs/blueprints/db/prisma/](../blueprints/db/prisma/schema-blueprint.md) |

---

## 🆘 Troubleshooting

<details>
<summary><strong>"python is not recognized"</strong></summary>

- Ensure Python was installed with "Add to PATH" checked
- Try `python3` instead of `python`
- On Windows: Settings → Apps → "App execution aliases" → turn off python.exe entries
- Restart your terminal

</details>

<details>
<summary><strong>Virtual environment won't activate (PowerShell)</strong></summary>

Run this once to allow scripts:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again:

```powershell
.venv\Scripts\Activate.ps1
```

</details>

<details>
<summary><strong>Port 8000 already in use</strong></summary>

```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID> /F

# Or start on a different port
uvicorn app.main:app --reload --port 8001
```

</details>

<details>
<summary><strong>PostgreSQL connection refused</strong></summary>

1. Ensure PostgreSQL service is running:
   - Windows: Services → `postgresql-x64-16` → Start
2. Verify port 5432 is open: `psql -U postgres -h localhost -p 5432`
3. Check `DATABASE_URL` in `.env` matches your credentials

</details>

<details>
<summary><strong>pip install fails on Windows</strong></summary>

Some packages require C++ build tools. Install:

```powershell
# Install Microsoft C++ Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools
```

Or download from [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

</details>

---

<div align="center">

<br/>

**⚙️ Validra Backend — Ready to Build!**

_Check the backend blueprint, set up your first API route, and start orchestrating._ 🚀

<br/>

[← Back to README](../../README.md) · [Base Setup →](./base_setup.mdx) · [Frontend Setup →](./frontend_setup.mdx)

</div>
