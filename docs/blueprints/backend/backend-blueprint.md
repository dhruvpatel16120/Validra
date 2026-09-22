# Validra — Backend API Blueprint

> **Owner:** Backend Team (M2)  
> **Directory:** `backend/`  
> **Tech:** FastAPI + SQLAlchemy 2.0 (Async) + Pydantic v2 + PostgreSQL + EasyOCR Pipeline + Groq LLM + ReportLab  

---

## 1. Overview

The backend serves as the orchestration layer between the Next.js frontend, the Computer Vision / OCR pipeline (Team M3), the Legal Metrology Rule Engine (Team M4), and object storage. It handles authentication verification, direct API routing under `/api`, scan pipeline orchestration, database persistence, and report generation.

Refer to [blueprint.md](../blueprint.md) Section 3 & 4 for the overarching system architecture.

---

## 2. Directory Structure (Current Implemented Layout)

```
backend/
├── app/
│   ├── main.py                        # FastAPI app + lifespan (init_db, seed_rules) + CORS + /api mount + /uploads static
│   │
│   ├── core/
│   │   ├── config.py                  # Pydantic Settings (ENV, DATABASE_URL, API_STR="/api", UPLOAD_DIR, Groq, SMTP)
│   │   └── security.py                # NextAuth v5 HS256 JWT decoding & claims verification
│   │
│   ├── db/
│   │   ├── base.py                    # DeclarativeBase (Base)
│   │   └── session.py                 # AsyncEngine, AsyncSessionLocal, get_db, init_db
│   │
│   ├── api/                           # Direct API routing under /api
│   │   ├── router.py                  # Aggregator router mounting all feature routers
│   │   ├── deps.py                    # get_db, get_current_user, require_role, extract_bearer_token
│   │   ├── auth.py                    # POST /api/auth/verify-token
│   │   ├── scans.py                   # POST /api/scans (multi-panel), POST /api/scans/analyze, GET /api/scans/{id}
│   │   ├── inspections.py             # GET /api/inspections, GET /api/inspections/{id}, PATCH findings, POST finalize, DELETE
│   │   ├── reports.py                 # POST /api/reports/{id}, GET /api/reports/{id}/download, GET verify
│   │   ├── rules.py                   # GET /api/rules, GET /api/rules/{rule_id}
│   │   ├── dashboard.py               # GET /api/dashboard
│   │   ├── users.py                   # GET /api/users/me, PATCH /api/users/me, GET/PATCH /api/profile
│   │   └── admin/                     # Admin endpoints mounted under /api/admin
│   │       ├── router.py              # Admin router aggregator
│   │       ├── dashboard.py           # System-wide metrics, accuracy benchmarks, violation breakdown
│   │       ├── users.py               # Admin user management (CRUD)
│   │       ├── rules.py               # Admin Legal Metrology rule management (CRUD)
│   │       ├── reports.py             # Admin reports overview
│   │       ├── scans.py               # Admin scan oversight and re-runs
│   │       └── audit_logs.py          # Admin audit log inspection and export
│   │
│   ├── services/
│   │   ├── email_service.py           # Async SMTP notification dispatcher (aiosmtplib)
│   │   ├── extraction_service.py      # Groq LLM structured declaration extraction + rule fallback
│   │   ├── ocr_service.py             # OCR helper routines
│   │   ├── report_service.py          # ReportLab court-admissible PDF generation with QR & SHA-256 seal
│   │   ├── rule_engine.py             # Legal Metrology deterministic rules evaluation (C01–C26)
│   │   ├── seed_rules.py              # Automatic rule seeding on startup
│   │   └── ocr/                       # Computer Vision (M3) OCR Pipeline
│   │       ├── engine.py              # EasyOCR portable singleton runtime (async via asyncio.to_thread)
│   │       ├── field_parser.py        # Regex token extractor for MRP, FSSAI, net quantity, dates
│   │       ├── geometry.py            # Bounding box polygons & visual evidence overlays
│   │       ├── measurement.py         # Character height & font size measurement
│   │       ├── ocr_main.py            # OCRPipeline coordinator (single-pass RGB upscale)
│   │       ├── preprocessor.py        # CLAHE contrast, deskew & RGB upscaling
│   │       ├── quality_gate.py        # Laplacian blur, brightness & glare assessment
│   │       ├── storage.py             # File persistence for scan assets
│   │       └── variant_fusion.py      # Bounding box IoU deduplication & clustering
│   │
│   ├── models/                        # SQLAlchemy 2.0 ORM models
│   │   ├── __init__.py
│   │   ├── user.py                    # User model (shared with frontend Prisma users)
│   │   ├── inspection.py              # Inspection & Image models (multi-panel scan records)
│   │   ├── scan_result.py             # ScanResult model (findings per rule)
│   │   ├── rule.py                    # Rule model (Legal Metrology C01–C26 clauses)
│   │   ├── report.py                  # Report model (SHA-256 hash & PDF metadata)
│   │   └── audit_log.py               # AuditLog model (shared with frontend Prisma audit_logs)
│   │
│   ├── schemas/                       # Pydantic v2 schemas
│   │   ├── __init__.py
│   │   ├── scan.py                    # Multi-panel upload, scan analysis & inspection responses
│   │   ├── rule.py                    # Rule definitions & validation schemas
│   │   ├── report.py                  # Report generation & download schemas
│   │   ├── dashboard.py               # Inspector & system metric summaries
│   │   └── user.py                    # UserProfile, UserUpdate, TokenVerify schemas
│   │
│   └── utils/
│       └── image_validation.py        # File format & MIME type validation
│
├── uploads/                           # Local file storage for uploaded images & crops
├── tests/                             # Pytest suite
│   ├── conftest.py
│   └── test_main.py
│
├── requirements.txt                   # Backend dependencies
├── .env.example                       # Environment template
└── setup.bat / setup.ps1 / setup.sh   # Environment bootstrapping scripts
```

---

## 3. Direct API Endpoints Summary (`/api/*`)

All API routes are prefixed directly with `/api` (configured via `settings.API_STR = "/api"`). Versioning sub-paths (such as `/v1`) are avoided in the primary interface for direct alignment with the Next.js frontend and current backend router implementation.

### Public & Authentication

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/auth/verify-token` | Validate NextAuth JWT token and extract user claims from PostgreSQL | Public / Bearer |

### Scans & Image Ingestion

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/scans` | Ingest multi-panel images (1–6 panels), run quality gate, OCR, Groq LLM extraction & rule engine | Inspector |
| `POST` | `/api/scans/analyze` | Perform direct multi-panel OCR analysis and field detection | Inspector |
| `GET` | `/api/scans/{scan_id}` | Retrieve scan progress, status, and compliance results | Inspector |

### Inspections & Review

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/inspections` | List inspections (paginated, filterable by status/date/search query) | Inspector |
| `GET` | `/api/inspections/{inspection_id}` | Fetch full inspection details, images, extracted fields, and violations | Inspector |
| `PATCH` | `/api/inspections/{inspection_id}/findings/{finding_id}` | Override or verify an automated finding decision | Inspector |
| `POST` | `/api/inspections/{inspection_id}/finalize` | Finalize inspection and lock from further edits | Inspector |
| `DELETE` | `/api/inspections/{inspection_id}` | Delete inspection and cascading image / result records | Inspector |

### Statutory Compliance Rules

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/rules` | List all Legal Metrology statutory compliance rules (C01–C26) | Any |
| `GET` | `/api/rules/{rule_id}` | Retrieve single rule definition, clause reference, and thresholds | Any |

### Reports & Verification

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/reports/{inspection_id}` | Trigger court-admissible PDF report compilation via ReportLab | Inspector |
| `GET` | `/api/reports/{report_id}` | Retrieve report metadata, summary and SHA-256 hash | Inspector |
| `GET` | `/api/reports/{report_id}/download` | Download compiled PDF compliance certificate / report | Inspector |
| `GET` | `/api/reports/{report_id}/verify` | Cryptographically verify digital certificate against stored SHA-256 hash | Public |

### Dashboard & Profiles

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/dashboard` | Inspector metrics (scans today, compliance rate, recent scans) | Inspector |
| `GET` | `/api/users/me` | Current authenticated user profile | Any |
| `PATCH` | `/api/users/me` | Update current user preferences/profile | Any |
| `GET` | `/api/profile` | Convenience profile alias | Any |
| `PATCH` | `/api/profile` | Update profile information | Any |

### Administration (`/api/admin/*`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | System-wide scan metrics, accuracy benchmarks, violation breakdown | Admin |
| `GET` | `/api/admin/users` | List all system users with role/status filters | Admin |
| `POST` | `/api/admin/users` | Provision new inspector/admin user | Admin |
| `PATCH` | `/api/admin/users/{id}` | Modify user role or active status | Admin |
| `DELETE` | `/api/admin/users/{id}` | Deactivate or delete user account | Admin |
| `GET` | `/api/admin/rules` | List all Legal Metrology compliance rules | Admin |
| `POST` | `/api/admin/rules` | Create or update rule logic and thresholds | Admin |
| `PATCH` | `/api/admin/rules/{id}` | Toggle active status or adjust parameters of a rule | Admin |
| `DELETE` | `/api/admin/rules/{id}` | Deprecate or remove rule version | Admin |
| `GET` | `/api/admin/reports` | Oversight of all generated compliance reports | Admin |
| `GET` | `/api/admin/reports/{id}` | Retrieve admin details for specific report | Admin |
| `GET` | `/api/admin/scans` | System-wide inspection scan monitor & re-run | Admin |
| `GET` | `/api/admin/audit-logs` | Query tamper-evident audit logs with CSV/JSON export | Admin |


---

## 4. OCR & Computer Vision Pipeline Architecture

The OCR subsystem adheres to a strict separation of concerns across 7 modular stages implemented in [`backend/app/services/ocr/`](../../backend/app/services/ocr/):

```
                      Uploaded Image(s) (via POST /api/scans)
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │     Stage 1: Quality Gate       │
                      │  Blur (Laplacian variance)      │
                      │  Brightness & Overexposure      │
                      │  Glare detection & Resolution   │
                      └────────────────┬────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │ PASS                    │ FAIL
                          ▼                         ▼
             ┌─────────────────────────────┐   Mark status: "quality_failed"
             │  Stage 2: RGB Upscale       │   Return quality advisory to user
             │  Single-pass RGB upscale    │
             │  CLAHE contrast enhancement │
             │  Adaptive deskew & borders  │
             └──────────────┬──────────────┘
                            │
                            ▼
             ┌─────────────────────────────┐
             │ Stage 3: EasyOCR Runtime    │
             │ Thread-safe singleton reader│
             │ Async via asyncio.to_thread │
             │ 4-point polygons & scores   │
             └──────────────┬──────────────┘
                            │
                            ▼
             ┌─────────────────────────────┐
             │ Stage 4: Character Measure  │
             │ Back-projection to original │
             │ Bbox height (px) & font mm  │
             └──────────────┬──────────────┘
                            │
                            ▼
             ┌─────────────────────────────┐
             │ Stage 5: Hybrid Extraction  │
             │ Regex & Token Parser        │
             │ Groq LLM (gpt-oss-120b)     │
             │ Mandatory statutory fields  │
             └──────────────┬──────────────┘
                            │
                            ▼
             ┌─────────────────────────────┐
             │ Stage 6: Visual Evidence    │
             │ Color-coded bounding boxes  │
             │ Draw annotated preview image│
             └──────────────┬──────────────┘
                            │
                            ▼
             ┌─────────────────────────────┐
             │ Stage 7: Rule Evaluation &  │
             │ Persistence                 │
             │ Legal Metrology C01–C26     │
             │ ocr_result.json + DB save   │
             └──────────────┬──────────────┘
```

### 4.1 OCR Engine Design & Rationale

- **Engine Choice**: **EasyOCR (Portable Engine Singleton)**.
  - Selected for high out-of-the-box reliability and zero-friction cross-platform portability on Windows, macOS, and Linux without native C++ compilation overhead or oneDNN PIR engine driver conflicts.
  - **Thread-Safe Async Execution**: Inference runs via `asyncio.to_thread(ocr_engine.run_inference_sync, ...)` to ensure heavy PyTorch tensor operations never block FastAPI's asynchronous event loop.
  - **Single-Pass RGB Upscale**: Packaging label text is processed in full RGB to preserve small font edges and colored brand logos that deteriorate under naive binary thresholding.
- **Bounding Box & Provenance Extraction**:
  - Polygon: 4-point coordinates `[[x1, y1], [x2, y2], [x3, y3], [x4, y4]]`.
  - Axis-Aligned Bounding Box: `[x_min, y_min, x_max, y_max]`.
  - Font Size Metric: Derived from `bbox_height_px = y_max - y_min` with approximate physical height conversion in millimeters based on standard packaging dimensions.
  - Fault Isolation: Low-confidence detections (`< 0.85`) trigger inspection status `needs_review` rather than failing the scan.

### 4.2 Hybrid Statutory Field Extraction (Regex + Groq LLM)

- **Regex / Token Matcher (`field_parser.py`)**: Instant local pattern matching for standard statutory terms (e.g. MRP, FSSAI 14-digit numbers, net quantities in g/kg/ml/l, dates MM/YYYY).
- **Groq LLM Extractor (`extraction_service.py`)**: Uses high-speed LPU inference (`openai/gpt-oss-120b`) to extract fields where packaging text is fragmented across multiple panels or separated spatially. Fallback mechanism guarantees deterministic extraction if API is unreachable.
- **Rule Engine (`rule_engine.py`)**: Deterministically evaluates extracted declarations against Legal Metrology (Packaged Commodities) Rules, 2011 clauses `C01` through `C26`.

---

## 5. Database Storage Architecture

Validra persists structured scan results, images, user records, and audit logs inside PostgreSQL using SQLAlchemy 2.0 async ORM, with image binaries stored on the filesystem (`uploads/`):

### 5.1 Active SQLAlchemy Models (`backend/app/models/`)

```
PostgreSQL Database
  │
  ├── users (Shared with Next.js Prisma ORM)
  │     └── id, email, passwordHash, fullName, role (INSPECTOR/ADMIN), isActive, isVerified, badgeNumber, jurisdiction
  │
  ├── inspections (Master record for package scan session)
  │     └── inspection_id (UUID), product_name, brand, category, inspector_id, status, overall_status, compliance_score, inspector_remarks, timestamps
  │
  ├── images (Multi-panel uploaded image records)
  │     └── image_id (UUID), inspection_id, panel_type (front/back/etc.), file_path, panel_index, is_primary, extracted_text
  │
  ├── scan_results (Individual rule compliance findings)
  │     └── result_id, scan_id, rule_id, extracted_value, is_applicable, is_compliant, confidence, notes, created_at
  │
  ├── rules (Legal Metrology statutory clauses C01–C26)
  │     └── rule_id, field_name, clause_reference, validation_type, applicable_categories, is_active, description
  │
  ├── reports (PDF report provenance & digital verification)
  │     └── report_id (UUID), inspection_id, report_code, pdf_path, qr_code_path, sha256_hash, reported_by, reported_at
  │
  └── audit_logs (Shared with Next.js Prisma audit_logs)
        └── id, action, entityType, entityId, userId, log_code, severity, status, metadata (JSON), createdAt
```

### 5.2 Storage Distribution & Provenance

1. **Relational PostgreSQL Tables**: Store indexable, queryable metadata for rapid dashboard statistics, inspection searches, and user permission checks.
2. **Scan Artifact Directory (`uploads/scans/{scan_id}/`)**: Stores original uploaded images, upscaled RGB working images, annotated evidence images (`annotated.jpg`), and full raw OCR provenance dumps (`ocr_result.json`).
3. **Traceability**: Every rule finding in `scan_results` links back to the inspection, the panel image, and the extracted declaration value.

---

## 6. Scan Orchestration Contract

### 6.1 Multi-Panel Ingestion (`POST /api/scans`)

- **Input**: `multipart/form-data` with:
  - `files: List[UploadFile]` (1 to 6 panel images: front, back, side panels, top, bottom)
  - `product_name: Optional[str]`
  - `brand: Optional[str]`
  - `category: Optional[str]` (e.g., `general`, `food`, `cosmetic`)
- **Validation**:
  - Maximum upload size: `5MB` per image.
  - Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`.
  - Magic byte MIME verification: `image/jpeg`, `image/png`, `image/webp`, `image/bmp`.
  - Deduplication: SHA-256 computed on stream.
- **Persistence**: Images saved to `uploads/scans/{scan_id}/`, records created in `inspections` (status: `"processing"`) and `images` (with `panel_index` and `panel_type`).
- **Pipeline Dispatch**: Dispatched to `OCRPipeline` (`ocr_main.py`), followed by Groq LLM field extraction (`extraction_service.py`) and deterministic rule engine evaluation (`rule_engine.py`). If OCR encounters low confidence or partial failure, the inspection status transitions to `"needs_review"`.

### 6.2 Standard Pipeline Output Schema

```json
{
  "inspection_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "compliant",
  "compliance_score": 92.5,
  "quality": {
    "passed": true,
    "blur_score": 182.4,
    "brightness": 126.2,
    "glare_ratio": 0.012,
    "resolution": [3024, 4032],
    "text_region_detected": true
  },
  "ocr": {
    "engine": "easyocr",
    "processing_time_ms": 1180,
    "annotated_image_path": "/uploads/scans/9b1deb4d/annotated.jpg",
    "regions": [
      {
        "text": "MRP ₹99.00 (Incl. of all taxes)",
        "confidence": 0.98,
        "bbox": [120, 340, 420, 390],
        "bbox_height_px": 50,
        "polygon": [[120, 340], [420, 340], [420, 390], [120, 390]]
      }
    ]
  },
  "declarations": {
    "mrp": {
      "value": "99.00",
      "currency": "INR",
      "confidence": 0.98,
      "status": "found"
    },
    "net_quantity": {
      "value": "500 g",
      "confidence": 0.96,
      "status": "found"
    },
    "fssai_number": {
      "value": "12345678901234",
      "confidence": 0.95,
      "status": "found"
    },
    "commodity_name": {
      "value": "Wheat Flour",
      "confidence": 0.94,
      "status": "found"
    },
    "manufacturer_address": {
      "value": "VisionMinds Foods Pvt Ltd, Industrial Area, Pune 411001",
      "confidence": 0.93,
      "status": "found"
    },
    "consumer_care": {
      "value": "1800-111-222, support@visionminds.in",
      "confidence": 0.92,
      "status": "found"
    },
    "mfg_date": {
      "value": "08/2026",
      "confidence": 0.97,
      "status": "found"
    }
  },
  "rules": [
    {
      "rule_id": "C01",
      "field_name": "mrp",
      "is_compliant": true,
      "clause_reference": "Rule 6(1)(e)",
      "notes": "Maximum retail price declared with inclusive of all taxes"
    },
    {
      "rule_id": "C02",
      "field_name": "net_quantity",
      "is_compliant": true,
      "clause_reference": "Rule 12",
      "notes": "Standard unit (g) declared compliant with Second Schedule"
    }
  ]
}
```

---

## 7. Error Handling & Pagination Contracts

### Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File exceeds maximum allowed size of 5MB",
    "details": {}
  }
}
```

| HTTP Code | Error Code | Scenario |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Unsupported file extension, invalid MIME type, malformed payload |
| `401` | `UNAUTHORIZED` | Expired or missing Bearer token |
| `403` | `FORBIDDEN` | Insufficient role permissions |
| `404` | `NOT_FOUND` | Scan or resource not found |
| `413` | `FILE_TOO_LARGE` | Uploaded image exceeds 5MB limit |
| `422` | `UNPROCESSABLE` | Valid request structure but corrupted image payload |
| `500` | `INTERNAL_ERROR` | Uncaught server or database failure |

### Pagination Envelope

All collection endpoints (`GET /api/inspections`, `GET /api/admin/users`, etc.) adhere to:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 120,
    "total_pages": 6
  }
}
```

Query parameters: `?page=1&per_page=20&sort=-created_at&search=...&status=...`
