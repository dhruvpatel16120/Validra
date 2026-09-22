# Validra — System Blueprint

> Consolidated design reference for Frontend, Backend, ML/CV, Rule Engine, Database, and Report Generation.
> Derived from team research, Legal Metrology (Packaged Commodities) Rules 2011 analysis, and existing architecture docs.

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Frontend Design](#2-frontend-design)
- [3. Backend Design](#3-backend-design)
- [4. ML / Computer Vision Pipeline](#4-ml--computer-vision-pipeline)
- [5. Rule Engine Design](#5-rule-engine-design)
- [6. Database Design](#6-database-design)
- [7. Report Generation](#7-report-generation)
- [8. API Contract Summary](#8-api-contract-summary)
- [9. Security Architecture](#9-security-architecture)
- [10. Team Ownership Matrix](#10-team-ownership-matrix)

---

## 1. System Overview

### 1.1 Core Pipeline

```
Image → Quality Gate → Preprocessing → OCR → Field Extraction → Rule Engine → Evidence → Report → Dashboard
```

### 1.2 Architecture Layers

```
┌───────────────────────────────────────────────┐
│  Layer 1 — USER EXPERIENCE (Next.js 16+)      │
│  Scan · Dashboard · Review · Reports · Admin  │
├───────────────────────────────────────────────┤
│  Layer 2 — ORCHESTRATION (FastAPI)            │
│  Auth Middleware · APIs · Task Queue · DB Ops │
├───────────────────────────────────────────────┤
│  Layer 3 — AI UNDERSTANDING                   │
│  Quality Gate · RGB Preprocess · OCR.space · Groq│
├───────────────────────────────────────────────┤
│  Layer 4 — COMPLIANCE INTELLIGENCE            │
│  Deterministic Rule Engine · Legal References │
├───────────────────────────────────────────────┤
│  Layer 5 — EVIDENCE & DATA                    │
│  PostgreSQL (Dual-ORM) · Object Storage       │
└───────────────────────────────────────────────┘
```

### 1.3 Core Principle

**AI extracts and assists → Rules evaluate → Human reviews uncertain cases.**

Validra is a decision-support system, not a replacement for authorized legal judgment.

### 1.4 User Personas

| Persona | Primary Purpose | Key Workflows |
|---|---|---|
| **Inspector** | Conduct field inspections | Scan → Review → Finalize → Report |
| **Supervisor/Controller** | Monitor & review | Dashboard → Analytics → Pending Reviews |
| **Admin** | System management | Users · Rules · Audit Logs |

---

## 2. Frontend Design

### 2.1 Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16+ (16.3.4 App Router) |
| Runtime | React 19 (19.2.8) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (@tailwindcss/postcss) |
| Auth | NextAuth v5 (Auth.js) + Nodemailer + Prisma |
| Database ORM | Prisma 6.19+ (PostgreSQL) |
| Icons | Lucide React |

### 2.2 Route Map

| Area | Routes | Description |
|---|---|---|
| **Public** | `/` `/about` `/features` `/how-it-works` `/contact` `/faq` | Landing, marketing, SEO-optimized |
| **Auth** | `/login` `/admin-login` `/register` `/verify-email` `/pending-approval` `/forgot-password` `/reset-password` | Auth flows via NextAuth |
| **Inspector** | `/dashboard` `/scan/new` `/scan/[id]/processing` `/scan/[id]/review` `/inspections` `/inspections/[id]` `/reports` `/reports/[id]` | Core inspection workflow |
| **Admin** | `/admin/dashboard` `/admin/users` `/admin/rules` `/admin/inspections` `/admin/audit-logs` `/admin/settings` | Administration portal |
| **Common** | `/profile` `/help` | Shared pages |

### 2.3 Component Architecture

Build shared components **before** pages:

```
AppShell
├── Sidebar / Navigation
├── Header
├── PageHeader
├── DataTable (sortable, filterable, paginated)
├── StatusBadge (COMPLIANT / VIOLATION / NEEDS_REVIEW)
├── ConfidenceIndicator (progress bar + percentage)
├── EvidenceViewer (image + bounding box overlay)
├── FindingCard (violation details + evidence + legal ref)
├── ComplianceScoreRing
├── EmptyState
├── LoadingState / Skeleton
├── ErrorState
├── Toast / Notification
└── ConfirmationDialog
```

### 2.4 Inspection UX — Highest Priority

The core flow that must receive the most design effort:

```
1. Upload / Capture Images (drag-drop, camera, multi-image)
   ↓
2. Upload Progress Bar
   ↓
3. Processing Status (Queued → OCR → Extracting → Validating)
   ↓
4. Review Inspection Page
   ├── Extracted Fields Table (field, value, confidence, evidence)
   ├── Evidence Viewer (original image + bounding boxes)
   ├── Findings Panel (per-finding: status, severity, rule, legal ref)
   ├── Inspector Actions (Accept / Reject / Modify per finding)
   ├── Remarks / Notes Input
   └── Finalize Inspection
   ↓
5. Generate / Download Report (PDF)
```

### 2.5 Evidence-First Display Pattern

Every finding must show:

```
┌─────────────────────────────────────────────┐
│  ⚠️ POTENTIAL VIOLATION                      │
│                                             │
│  Missing mandatory declaration              │
│  Field: Consumer Complaint Contact          │
│  Severity: HIGH                             │
│  Confidence: 94%                            │
│                                             │
│  📷 Evidence: [cropped image region]        │
│  📍 Location: bounding box on original      │
│  📖 Legal Ref: Rule 6(2), PC Rules 2011    │
│                                             │
│  Inspector Decision: [Accept] [Reject] [Modify] │
│  Remarks: [_________________________]       │
└─────────────────────────────────────────────┘
```

### 2.6 Design System Tokens

Define before development begins:

- **Compliance Colors**: `COMPLIANT=#00C853` `VIOLATION=#FF1744` `NEEDS_REVIEW=#FFAB00` `NOT_APPLICABLE=#9E9E9E`
- **Confidence Thresholds**: `HIGH ≥ 85%` `MEDIUM 60–84%` `LOW < 60%`
- **Typography**: Inter / system font, scale: 12/14/16/20/24/32px
- **Spacing**: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- **Border Radius**: 4px (inputs), 8px (cards), 12px (modals), full (badges)
- **Shadows**: sm/md/lg/xl elevation tokens

### 2.7 State Matrix

Every page must design for all states:

| State | UI Treatment |
|---|---|
| Loading | Skeleton / spinner with status text |
| Success | Data display with actions |
| Empty | Illustration + CTA |
| Error | Error message + retry action |
| Unauthorized | Redirect to login or 403 page |
| Processing | Multi-step progress indicator |
| Partial failure | Show successful results + error banner for failures |

### 2.8 Performance Rules

- Server Components by default; `"use client"` only for interactivity
- Dynamic imports for heavy components (EvidenceViewer, charts)
- Optimize evidence images (WebP, lazy loading, responsive srcset)
- Pagination for inspection history (not infinite scroll for auditability)
- Skeletons instead of blocking page loads
- No hardcoded API URLs in components — use environment config

### 2.9 Functional Requirements Summary

| ID | Requirement |
|---|---|
| FR-01 | Register, login, logout, session management |
| FR-02 | Role-based UI (Inspector vs Admin) |
| FR-03 | Upload/capture product images |
| FR-04 | Client-side file type/size validation |
| FR-05 | Upload progress + processing status display |
| FR-06 | Display OCR/extracted fields with confidence |
| FR-07 | Display compliance status (COMPLIANT / VIOLATION / NEEDS_REVIEW) |
| FR-08 | Display findings with severity, confidence, evidence |
| FR-09 | Evidence image viewer with bounding box overlay |
| FR-10 | Display applicable legal references per finding |
| FR-11 | Inspector: Accept/Reject/Modify findings |
| FR-12 | Inspector: Add remarks/notes |
| FR-13 | Save/finalize inspection |
| FR-14 | View inspection history |
| FR-15 | Search, filter, sort, paginate inspections |
| FR-16 | Generate/view/download PDF reports |
| FR-17 | Admin: manage users, rules |
| FR-18 | Admin: view audit logs |
| FR-19 | Responsive: desktop, tablet, mobile |
| FR-20 | Notifications/toasts for actions |

---

## 3. Backend Design

### 3.1 Technology Stack

| Component | Technology |
|---|---|
| Framework | FastAPI (Python 3.10+) |
| ORM | SQLAlchemy 2.0 (asyncpg / aiosqlite fallback) |
| Schemas | Pydantic v2 |
| OCR Engine | OCR.space Cloud API (primary) with Groq LLM field extraction |
| Entity Extraction | Groq Cloud LLM (`openai/gpt-oss-120b`) |
| Auth Middleware | JWT verification (python-jose, HS256 shared secret with NextAuth) + passlib (bcrypt) |
| File Storage | Local filesystem / S3-compatible Object Storage |
| PDF Generation | ReportLab (Platypus) |
| Email Notifications | aiosmtplib (async SMTP) |
| Setup & Tooling | Interactive terminal wizard (`backend/scripts/setup.py`, `setup.ps1`, `setup.bat`, `setup.sh`) |
| Deployment | Vercel (read-only filesystem) |

### 3.2 Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── admin/                    # Admin endpoints (dashboard, users, rules, reports, scans, audit_logs)
│   │   ├── auth.py                   # Login, registration, token verification
│   │   ├── deps.py                   # Dependency injection (Auth, DB session)
│   │   ├── inspections.py            # Inspection queries, finding updates, finalization
│   │   ├── reports.py                # ReportLab PDF generation and download
│   │   ├── router.py                 # API router aggregation (prefix: /api)
│   │   ├── rules.py                  # Statutory rule listing & details
│   │   ├── scans.py                  # Multi-panel scan intake & status polling
│   │   ├── dashboard.py              # Inspector metrics
│   │   └── users.py                  # User profile and role management
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                 # Pydantic BaseSettings (.env configuration)
│   │   └── security.py               # JWT creation, verification, password hashing
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                   # DeclarativeBase
│   │   └── session.py                # SQLAlchemy async engine & sessionmaker
│   ├── models/                       # SQLAlchemy 2.0 domain models
│   │   ├── __init__.py
│   │   ├── audit_log.py              # Immutable audit log entries
│   │   ├── inspection.py             # Core inspection record & lifecycle state + Image model
│   │   ├── report.py                 # Generated PDF report metadata & checksums
│   │   ├── rule.py                   # Formal Legal Metrology rule records
│   │   ├── scan_result.py            # OCR tokens & extracted statutory fields
│   │   └── user.py                   # Backend user accounts & RBAC roles
│   ├── schemas/                      # Pydantic v2 validation models
│   │   ├── __init__.py
│   │   ├── scan.py
│   │   ├── rule.py
│   │   ├── report.py
│   │   ├── dashboard.py
│   │   └── user.py
│   ├── services/                     # Core domain business logic
│   │   ├── email_service.py          # Async SMTP notification service
│   │   ├── extraction_service.py     # Groq LLM structured declaration extractor
│   │   ├── ocr_service.py            # OCR.space cloud API text extraction
│   │   ├── report_service.py         # ReportLab Platypus PDF report builder
│   │   ├── rule_engine.py            # Deterministic Legal Metrology evaluator
│   │   ├── seed_rules.py             # Automatic rule seeding on startup
│   │   └── ocr/                      # Computer Vision (M3) OCR Pipeline
│   │       ├── engine.py             # Cloud OCR engine stub (EasyOCR removed for Vercel)
│   │       ├── field_parser.py       # Regex token extractor for MRP, FSSAI, net quantity, dates
│   │       ├── geometry.py           # Bounding box polygons & visual evidence overlays
│   │       ├── measurement.py        # Character height & font size measurement
│   │       ├── ocr_main.py           # OCRPipeline coordinator (single-pass RGB upscale)
│   │       ├── preprocessor.py       # CLAHE contrast, deskew & RGB upscaling
│   │       ├── quality_gate.py       # Laplacian blur, brightness & glare assessment
│   │       ├── storage.py            # File persistence for scan assets
│   │       └── variant_fusion.py     # Bounding box IoU deduplication & clustering
│   ├── utils/
│   │   └── image_validation.py       # File format & MIME type validation
│   ├── __init__.py
│   └── main.py                       # FastAPI entrypoint with lifespan DB init
├── tests/                            # Pytest test suite
│   ├── conftest.py
│   └── test_main.py
├── .env.example
├── pytest.ini
├── requirements.txt
├── setup.bat
├── setup.ps1
└── setup.sh
```

### 3.3 Scan Orchestration Pipeline

```
POST /api/scans (multipart: 1 to 6 panel images: front, back, sides, top, bottom)
    │
    ├── 1. Validate images (type: JPEG/PNG/WebP, size <= 5MB per image)
    ├── 2. Store originals to storage (uploads/scans/...)
    ├── 3. Create Inspection record (status: PROCESSING)
    ├── 4. Execute scan pipeline (async thread pool):
    │      │
    │      ├── Preprocessing: Single-pass RGB upscaling & contrast normalization
    │      │
    │      ├── OCR.space: Cloud-based text detection & recognition
    │      │
    │      ├── Groq LLM: Extract statutory declarations (MRP, Net Qty, Dates, Mfg, Contact)
    │      │
    │      ├── Rule Engine: Deterministic evaluation against Legal Metrology Rules (C01–C26)
    │      │
    │      ├── Confidence Gating: If confidence < 85% → status: NEEDS_REVIEW
    │      │
    │      └── Persist scan results & findings → PostgreSQL (SQLAlchemy async)
    │
    └── Return: { inspection_id, status: "processing" }
```

### 3.4 Error Handling Contract

All API errors use a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Image file size exceeds 5MB limit",
    "details": { "max_size_mb": 5, "actual_size_mb": 7.4 }
  }
}
```

Standard HTTP codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `422` unprocessable, `500` internal.

---

## 4. ML / Computer Vision Pipeline

### 4.1 Pipeline Architecture

```
Product Image
     │
     ▼
┌─────────────────┐
│  QUALITY GATE   │  Module: backend/app/services/ocr/quality_gate.py
│                 │
│  blur_score     │  Laplacian variance > threshold
│  brightness     │  mean pixel value in range
│  glare_ratio    │  overexposed pixel % < threshold
│  resolution     │  min width/height
│  text_presence  │  edge density check
└────────┬────────┘
         │ PASS / REJECT
         ▼
┌─────────────────┐
│ PREPROCESSING   │  Module: backend/app/services/ocr/preprocessor.py
│                 │
│  RGB Upscaling  │  Single-pass high-quality PIL/OpenCV bicubic interpolation
│  Contrast Norm  │  Histogram / adaptive contrast enhancement
│  Deskew/Denoise │  Fast spatial filtering without artifact generation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   OCR.SPACE     │  Cloud API — https://api.ocr.space
│                 │
│  Text Detection │  OCR Engine 2 (server-side)
│  Recognition    │  Cloud-hosted text recognition
│                 │  Called via REST API from ocr_service.py
│  Output per region:
│    text, confidence
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GROQ LLM PARSER │  Module: backend/app/services/extraction_service.py
│                 │
│  Model          │  openai/gpt-oss-120b via Groq Cloud API
│  Role Classify  │  manufacturer vs packer vs importer
│  Date Parsing   │  MFG/EXP/PKD date extraction & ISO normalization
│  Unit Parsing   │  quantity value + SI unit separation
│  JSON Validation│  Strict Pydantic schema validation
└─────────────────┘
```

### 4.2 OCR & Extraction Architecture: OCR.space + Groq Cloud LLM

Validra pairs **OCR.space cloud API** for text recognition with **Groq Cloud LLM (`openai/gpt-oss-120b`)** for statutory field parsing:

| Criteria | OCR.space + Groq LLM |
|---|---|
| Deployment | Cloud-based, no local model loading — compatible with Vercel read-only filesystem |
| Extraction Quality | LLM understands complex multilingual phrasing, typos, and fuzzy packaging text |
| Setup Complexity | Zero local dependencies — REST API calls only |
| Latency | ~1–3s per panel via cloud inference |

Configuration:

```python
import requests

OCR_SPACE_URL = "https://api.ocr.space/parse/image"

response = requests.post(
    OCR_SPACE_URL,
    files={"file": ("image.jpg", image_buffer, "image/jpeg")},
    data={"apikey": api_key, "language": "eng", "OCREngine": 2, "scale": "true"},
)
result = response.json()
```

### 4.3 OCR Output Schema (CV → Backend Contract)

Every OCR result includes provenance for evidence:

```json
{
  "quality": {
    "passed": true,
    "blur_score": 182.4,
    "brightness": 126.2,
    "glare_ratio": 0.012,
    "resolution": [3024, 4032],
    "text_region_detected": true
  },
  "ocr": {
    "engine": "ocr_space",
    "model_version": "ocr_space_v2",
    "processing_time_ms": 1240,
    "regions": [
      {
        "text": "MRP ₹99",
        "confidence": 0.97,
        "bbox": [120, 340, 420, 390],
        "bbox_height_px": 50
      }
    ]
  },
  "fields": {
    "mrp": {
      "value": 99,
      "currency": "INR",
      "raw_text": "MRP ₹99",
      "confidence": 0.97,
      "bbox": [120, 340, 420, 390],
      "bbox_height_px": 50,
      "status": "found"
    },
    "net_quantity": {
      "value": 500,
      "unit": "g",
      "measurement_type": "mass",
      "raw_text": "Net Qty 500 g",
      "confidence": 0.94,
      "status": "found"
    },
    "manufacturer": {
      "name": "ABC Foods Pvt Ltd",
      "address": "Ahmedabad, Gujarat",
      "role": "manufacturer",
      "confidence": 0.91,
      "status": "found"
    },
    "packer": null,
    "importer": null,
    "manufacturing_date": {
      "value": "2026-06",
      "type": "manufacturing_date",
      "raw_text": "Mfg: June 2026",
      "confidence": 0.89,
      "status": "found"
    },
    "consumer_contact": {
      "name": "ABC Foods Pvt Ltd",
      "phone": "18001234567",
      "email": "care@abc.com",
      "address": "Ahmedabad, Gujarat",
      "confidence": 0.86,
      "status": "found"
    },
    "commodity_name": {
      "value": "Shampoo",
      "raw_text": "Shampoo",
      "confidence": 0.92,
      "status": "found"
    }
  }
}
```

### 4.4 Field Extraction Patterns

Target patterns for regex + NLP extraction:

| Field | Patterns to Recognize |
|---|---|
| MRP | `MRP`, `M.R.P.`, `Max Retail Price`, `Maximum Retail Price`, `Rs.`, `₹` |
| Net Quantity | `Net Qty`, `Net Weight`, `Net Wt`, `Net Content`, `N.W.`, value + unit |
| Manufacturer | `Manufactured by`, `Mfg by`, `Mfd by`, company name following |
| Packer | `Packed by`, `Packaged by`, `Pkd by` |
| Importer | `Imported by`, `Importer` |
| Dates | `Mfg:`, `MFD:`, `Packed:`, `PKD:`, `Exp:`, `Best Before`, `Use By` |
| FSSAI | `FSSAI`, `Lic No`, 14-digit number pattern |
| Consumer Care | `Consumer Care`, `Customer Care`, `Helpline`, `Toll Free`, phone/email patterns |

### 4.5 Critical Design Constraints

1. **OCR ≠ Compliance**: OCR detects text; Rule Engine evaluates compliance. Never mix.
2. **Confidence is mandatory**: Every extracted field must carry a confidence score.
3. **Bounding boxes preserved**: Spatial data must flow from OCR → extraction → evidence → report.
4. **Provenance chain**: Store `raw_text`, `extraction_rule`, `model_version` for every field.
5. **Font size limitation**: Pixel height is the honest signal; claiming physical mm requires a reference scale.

---

## 5. Rule Engine Design

### 5.1 Architecture Principle

> **Don't build Validra as an OCR checker. Build it as a rule engine whose input happens to come from OCR + computer vision.**

The Rule Engine:
- Receives structured JSON from Field Extraction
- Never reads images or performs OCR
- Makes deterministic compliance decisions
- Outputs structured findings with rule references

### 5.2 Rule Schema

Every rule stored in the `rules` table:

```json
{
  "rule_id": "PC-MRP-001",
  "rule_code": "RULE_6_1_E",
  "version": "2011-v1",
  "field": "mrp",
  "category": "mandatory_declaration",
  "applicable_package_type": ["retail"],
  "applicable_product_category": ["all"],
  "condition": "field_present",
  "validation_logic": "mrp.value IS NOT NULL AND mrp.currency == 'INR'",
  "required": true,
  "severity": "HIGH",
  "legal_reference": "Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011",
  "description": "Every retail package must declare the Maximum Retail Price inclusive of all taxes",
  "effective_from": "2011-01-01",
  "effective_until": null,
  "exemptions": ["packages ≤10g/10ml per Rule 26"]
}
```

### 5.3 Compliance Checks Derived from Rules 2011

| ID | Check | Rules | CV-Verifiable? |
|---|---|---|---|
| C01 | Package applicability / exemption check | Rule 3, 26 | Partially |
| C02 | Manufacturer name present | Rule 6, 10 | ✅ |
| C03 | Manufacturer address present | Rule 6, 10 | ✅ |
| C04 | Packer name/address (if different) | Rule 6, 10 | ✅ |
| C05 | Importer name/address (if imported) | Rule 6, 10 | ✅ |
| C06 | Commodity common/generic name | Rule 6(1)(b) | ✅ |
| C07 | Multiple-product identification | Rule 6(1)(b) | ✅ |
| C08 | Net quantity declaration | Rule 6, 11 | ✅ |
| C09 | Correct quantity unit for commodity type | Rule 12, 13 | ✅ |
| C10 | SI-unit compliance (no dozen/gross) | Rule 13 | ✅ |
| C11 | Manufacturing/packing/import month+year | Rule 6(1)(d) | ✅ |
| C12 | MRP declaration present | Rule 6(1)(e) | ✅ |
| C13 | MRP inclusive of taxes statement | Rule 6(1)(e) | ✅ |
| C14 | Dimensions where applicable | Rule 6(1)(f), 14-17 | ✅ |
| C15 | Consumer complaint contact info | Rule 6(2) | ✅ |
| C16 | Declaration on Principal Display Panel | Rule 7, 8 | Partially |
| C17 | Quantity numeral minimum size | Rule 7 | ⚠️ Relative only |
| C18 | Letter height minimum | Rule 7 | ⚠️ Relative only |
| C19 | Quantity declaration clear space | Rule 8 | Partially |
| C20 | Legibility / prominence | Rule 9 | Partially |
| C21 | MRP/net quantity contrast | Rule 9 | ✅ (contrast score) |
| C22 | Language (Hindi or English required) | Rule 9 | ✅ |
| C23 | No misleading quantity wording | Rule 12 | ✅ |
| C24 | Standard package quantity compliance | Rule 5 + Second Schedule | ✅ with category |
| C25 | Sticker does not cover original MRP | Rule 6(3) | ⚠️ Advanced CV |
| C26 | Deceptive packaging suspicion | Rule 23 | ⚠️ → NEEDS_REVIEW |

### 5.4 Rule Evaluation Pipeline

```
Extracted Product JSON
        ↓
┌──────────────────┐
│ APPLICABILITY    │  Is this a retail package? Exempt?
│ ENGINE           │  Package type classification
└────────┬─────────┘
         │ applicable rules subset
         ▼
┌──────────────────┐
│ RULE EVALUATOR   │  For each applicable rule:
│                  │    1. Check field presence
│                  │    2. Validate format
│                  │    3. Validate value
│                  │    4. Check exceptions
│                  │    5. Assign status
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ CONFIDENCE GATE  │  If OCR confidence < threshold:
│                  │    status = NEEDS_REVIEW
│                  │  Else:
│                  │    status = PASS / FAIL
└────────┬─────────┘
         │
         ▼
   Compliance Result JSON
```

### 5.5 Decision States

| State | Code | When Used |
|---|---|---|
| Compliant | `PASS` | Field present, valid, high confidence |
| Non-Compliant | `FAIL` | Field missing/invalid, high confidence |
| Needs Review | `NEEDS_REVIEW` | Low confidence, ambiguous, partial match |
| Not Applicable | `NOT_APPLICABLE` | Rule exempt for this product/package |
| Not Verifiable | `NOT_VERIFIABLE_FROM_IMAGE` | Physical measurement required |

### 5.6 Rule Engine Output Schema

```json
{
  "inspection_id": "INS-000124",
  "overall_status": "NEEDS_REVIEW",
  "compliance_score": 78,
  "total_rules_evaluated": 14,
  "passed": 10,
  "failed": 2,
  "needs_review": 1,
  "not_applicable": 1,
  "findings": [
    {
      "finding_id": "F-001",
      "rule_id": "PC-MRP-001",
      "rule_code": "RULE_6_1_E",
      "field": "mrp",
      "status": "PASS",
      "severity": "HIGH",
      "detected_value": "₹99",
      "confidence": 0.97,
      "evidence_bbox": [120, 340, 420, 390],
      "legal_reference": "Rule 6(1)(e)",
      "explanation": null
    },
    {
      "finding_id": "F-002",
      "rule_id": "PC-CONTACT-001",
      "rule_code": "RULE_6_2",
      "field": "consumer_contact",
      "status": "FAIL",
      "severity": "HIGH",
      "detected_value": null,
      "confidence": 0.94,
      "evidence_bbox": null,
      "legal_reference": "Rule 6(2)",
      "explanation": "Consumer complaint contact information not detected"
    }
  ]
}
```

---

## 6. Database Design

### 6.1 Database Architecture: Dual-ORM Strategy

Validra utilizes a unified **PostgreSQL** database accessed concurrently by two specialized ORMs:

| ORM Layer | Scope | Key Tables / Responsibilities |
|---|---|---|
| **Prisma 6.19+** | Frontend (Next.js 16) | NextAuth v5 session management, verification tokens, password resets, user authentication (`users`, `accounts`, `sessions`, `verification_tokens`, `password_reset_tokens`, `audit_logs`). |
| **SQLAlchemy 2.0 (asyncpg)** | Backend (FastAPI) | Domain entities, scan orchestration, multi-panel image links, rule checks, violation reports, and security audits (`users`, `inspections`, `images`, `scan_results`, `rules`, `reports`, `audit_logs`). |

### 6.2 Entity Relationship Diagram

```
users (Auth / Prisma & SQLAlchemy)
  │ 1:N
  ▼
inspections (SQLAlchemy)
  │
  ├── 1:N ── images (panel_index, type: original/processed/annotated, storage_path, SHA-256)
  ├── 1:N ── scan_results (rule_id, extracted_value, is_applicable, is_compliant)
  ├── 1:N ── reports (reported_by, status, notes, email_sent)
  └── 1:N ── audit_logs (action, entity_type, ip_address, details JSONB)

rules (SQLAlchemy)
  │ 1:N
  └── scan_results (references rule_id, legal clause_reference, validation_type)
```

### 6.3 Active Table Definitions

#### `users` (Shared Auth)
```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role          VARCHAR(50) NOT NULL DEFAULT 'inspector' CHECK (role IN ('inspector', 'admin', 'supervisor')),
    is_active     BOOLEAN DEFAULT true,
    is_verified   BOOLEAN DEFAULT false,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `inspections` (Core Scan Record)
```sql
CREATE TABLE inspections (
    inspection_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID,
    product_name      VARCHAR(255),
    brand             VARCHAR(255),
    category          VARCHAR(50) NOT NULL DEFAULT 'general',
    inspector_id      VARCHAR(64),
    status            VARCHAR(50) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'processing', 'completed', 'flagged', 'needs_review', 'finalized')),
    overall_status    VARCHAR(50) NOT NULL DEFAULT 'pending',
    compliance_score  NUMERIC(5, 2),
    inspector_remarks TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    completed_at      TIMESTAMPTZ,
    finalized_at      TIMESTAMPTZ
);
```

#### `images` (Multi-Panel Label Images)
```sql
CREATE TABLE images (
    image_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    panel_index   INTEGER NOT NULL DEFAULT 0,
    type          VARCHAR(50) NOT NULL DEFAULT 'original', -- original, processed, evidence_crop, annotated
    storage_path  TEXT NOT NULL,
    file_name     VARCHAR(255),
    file_size     INTEGER,
    mime_type     VARCHAR(100),
    image_hash    VARCHAR(64), -- SHA-256
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `scan_results` (Rule Compliance Findings)
```sql
CREATE TABLE scan_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id         UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    rule_id         INTEGER REFERENCES rules(rule_id) ON DELETE SET NULL,
    extracted_value TEXT,
    is_applicable   BOOLEAN NOT NULL DEFAULT true,
    is_compliant    BOOLEAN,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `rules` (Legal Metrology Statutory Checklist)
```sql
CREATE TABLE rules (
    rule_id               SERIAL PRIMARY KEY,
    field_name            VARCHAR(100) NOT NULL,
    clause_reference      VARCHAR(255) NOT NULL,
    description           TEXT,
    validation_type       VARCHAR(50) NOT NULL DEFAULT 'presence', -- presence, regex, custom
    applicable_categories JSON NOT NULL DEFAULT '[]',
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

#### `reports` (Violation Escalation & PDF Records)
```sql
CREATE TABLE reports (
    report_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id      UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    reported_by  VARCHAR(255),
    status       VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, under_review, resolved, dismissed
    notes        TEXT,
    email_sent   BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

#### `audit_logs` (Security & Decision Trail)
```sql
CREATE TABLE audit_logs (
    log_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     VARCHAR(64),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   VARCHAR(64),
    ip_address  VARCHAR(45),
    details     JSON,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 Storage Strategy

| Data Type | Storage | Why |
|---|---|---|
| Structured metadata | PostgreSQL | Relational queries, joins, analytics |
| Raw OCR JSON | PostgreSQL JSONB | Reprocessing, auditing, debugging |
| Product images | Object Storage (S3/Supabase) | Binary files don't belong in RDBMS |
| Evidence crops | Object Storage | Referenced by path in DB |
| PDF reports | Object Storage | Large binary artifacts |

### 6.5 Key Indexes

```sql
CREATE INDEX idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_created ON inspections(created_at DESC);
CREATE INDEX idx_violations_inspection ON violations(inspection_id);
CREATE INDEX idx_violations_severity ON violations(severity);
CREATE INDEX idx_extracted_fields_inspection ON extracted_fields(inspection_id);
CREATE INDEX idx_rules_active ON rules(is_active, field);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
```

---

## 7. Report Generation

### 7.1 Architecture

```
Compliance Result JSON + Evidence Images
           ↓
┌──────────────────────┐
│  Evidence Service    │  Crop bounding boxes with padding
│  (Pillow)            │  Annotate original image
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Report Generator    │  ReportLab Platypus
│                      │
│  Page 1: Cover       │  Logo, report ID, date, product image, overall status, score
│  Page 2: Summary     │  Fields table (field, value, confidence, status)
│  Page 3: Quality     │  Image quality metrics table
│  Page 4+: Evidence   │  Per-finding: annotated image + crop + details
│  Final: Compliance   │  Summary, pass/fail counts, recommendations
│  Footer: Integrity   │  Pipeline version, model version, image hash, report hash, QR
└──────────────────────┘
```

### 7.2 Report Data Model

```json
{
  "report_id": "VAL-2026-00125",
  "generated_at": "2026-09-12T10:30:00Z",
  "product": { "name": "...", "category": "...", "brand": "..." },
  "overall_status": "NEEDS_REVIEW",
  "compliance_score": 78,
  "fields": [
    {
      "name": "MRP",
      "value": "₹99",
      "status": "PASS",
      "confidence": 0.97,
      "evidence_id": "EV-001"
    }
  ],
  "quality": {
    "blur": 0.12, "brightness": 0.71, "glare": 0.08,
    "resolution": "1920x1080", "text_region_detected": true
  },
  "evidence": [
    {
      "id": "EV-001",
      "field": "MRP",
      "original_image": "product.jpg",
      "crop_image": "evidence/crop_001.jpg",
      "bbox": [120, 340, 420, 390],
      "confidence": 0.97
    }
  ],
  "integrity": {
    "pipeline_version": "Validra 1.0.0",
    "ocr_engine": "OCR.space v2",
    "ruleset": "PC-2011-v1",
    "image_sha256": "8d72...a91f",
    "report_sha256": "31af...c92e"
  }
}
```

### 7.3 QR Code Verification

Each report includes a QR code linking to:
```
https://validra.app/verify/VAL-2026-00125
```

Enables downstream verification of report authenticity.

---

## 8. API Contract Summary

### 8.1 Core Endpoints

All backend endpoints are mounted under `/api` via FastAPI APIRouter:

| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Inspector / Admin login | ❌ | All |
| `POST` | `/api/auth/register` | User self-registration | ❌ | All |
| `POST` | `/api/auth/forgot-password` | Request password reset token | ❌ | All |
| `POST` | `/api/auth/reset-password` | Confirm password reset | ❌ | All |
| `POST` | `/api/scans` | Multi-panel package upload & scan dispatch | ✅ | Inspector |
| `GET` | `/api/scans/{id}` | Poll scan processing status | ✅ | Inspector |
| `GET` | `/api/inspections` | List inspections (paginated, filtered) | ✅ | Inspector / Supervisor |
| `GET` | `/api/inspections/{id}` | Get inspection detail with panels & findings | ✅ | Inspector / Supervisor |
| `PATCH` | `/api/inspections/{id}/findings/{fid}` | Accept/reject/modify finding | ✅ | Inspector |
| `POST` | `/api/inspections/{id}/finalize` | Finalize inspection record | ✅ | Inspector |
| `POST` | `/api/reports/{id}` | Generate ReportLab PDF report | ✅ | Inspector |
| `GET` | `/api/reports/{id}/download` | Download compiled PDF compliance report | ✅ | Inspector / Supervisor |
| `GET` | `/api/admin/users` | List registered users & manage roles | ✅ | Admin |
| `POST` | `/api/admin/rules` | Create or update Legal Metrology statutory rule | ✅ | Admin |
| `GET` | `/api/admin/audit-logs` | Audit log trail query | ✅ | Admin |

### 8.2 Pagination Contract

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 248,
    "total_pages": 13
  }
}
```

### 8.3 Filter/Sort Query Parameters

```
GET /api/inspections?status=needs_review&sort=-created_at&page=2&per_page=20
```

---

## 9. Security Architecture

### 9.1 Auth Flow

```
Next.js (Auth.js) → Issues signed JWT → Frontend sends Bearer token →
FastAPI middleware independently verifies JWT signature + expiry + RBAC →
Grants/denies access
```

### 9.2 Security Rules

| Rule | Enforcement |
|---|---|
| JWT validation | FastAPI middleware on every protected endpoint |
| RBAC | Role checked server-side, never trust frontend |
| Secrets | Never hardcoded; use `.env` / secrets manager |
| File upload | Validate type + size server-side |
| API keys | Never exposed to frontend |
| Session expiry | Handle gracefully in UI (redirect to login) |
| Audit trail | Log all inspector decisions and admin actions |
| Image integrity | SHA-256 hash stored at upload time |

---

## 10. Team Ownership Matrix

| Module | Domain | Owner | Directory |
|---|---|---|---|
| **M1** | Frontend (Next.js 16+, UI/UX) | FE Team | `frontend/` |
| **M2** | Backend & Infrastructure (FastAPI, Dual-ORM) | Backend Lead | `backend/` |
| **M3** | Computer Vision (OpenCV, OCR.space) | CV Lead | `backend/app/services/ocr/` |
| **M4** | Rule Engine (Legal Metrology Rules C01–C26) | Rules Lead | `backend/app/services/rule_engine.py` |
| **M5** | Research & QA (Benchmarking, E2E Testing) | QA Lead | `tests/` |

### Frontend Sub-ownership

| Member | Responsibility |
|---|---|
| FE-1 | Design system + Public pages + App Shell |
| FE-2 | Inspector workflow: Scan + Review + Evidence |
| FE-3 | Dashboard + History + Reports + Admin UI |

---

> **This blueprint is the single source of truth for Validra's system design. All modules must build against the contracts defined here. Update this document when architectural decisions change.**
