# Product Requirements Document (PRD) — Validra

## 1. Product Overview

**Validra** is an AI-assisted compliance checking system designed to inspect packaged commodities against applicable requirements under India's **Legal Metrology Act, 2009** and **Legal Metrology (Packaged Commodities) Rules, 2011**.

The platform automates label scanning, OCR text detection, field extraction (MRP, Net Quantity, Dates, Manufacturer/Packer, Consumer Care), deterministic rule engine validation, legal provision retrieval via RAG, evidence localization, and compliance report generation.

---

## 2. Target Users & Portals

### 2.1 Inspector Persona
Enforcement officers and inspectors scanning retail/packaged goods.
- **Key Features**:
  - Image Upload & Capture
  - Real-time Processing & OCR Bounding Box Evidence
  - Dedicated **Review Inspection** Page (AI Result → Inspector Evidence Review → Accept / Reject / Modify Finding → Add Remarks → Finalize Report)
  - Search & Retrieval of Inspection History
  - Export PDF Reports

### 2.2 Admin Persona
Supervisors, legal experts, and system administrators.
- **Key Features**:
  - Analytics & Compliance Rate Dashboard
  - User & Role-Based Access Control (RBAC) Management
  - Rule Management (Adding/updating Legal Metrology rules)
  - Legal Document & Vector RAG Ingestion Management
  - System Audit Logs & Global Inspection Management

---

## 3. Scope & Feature Requirements

### 3.1 Landing & Public Pages (M1)
- **Home**: Vision, SIH 2026 Problem Statement 26034 context, value proposition.
- **Problem & Solution**: Manual inspection bottlenecks vs AI-assisted workflow.
- **Features & How It Works**: Step-by-step pipeline visualization.
- **About & Contact/FAQ**: Team VisionMinds context, FAQ.

### 3.2 Authentication & User Security (M1 / M3)
- **Authentication Source**: Next.js + Auth.js / NextAuth with Nodemailer (Email Verification, Login, Forgot Password, Session Management).
- **Token Security**: Next.js issues JWT token containing user identity and role.
- **Backend Authorization**: FastAPI auth middleware independently validates JWT signature, expiry, and RBAC permissions for every backend endpoint call (OCR, Rule Engine, RAG).

### 3.3 Computer Vision & Extraction Pipeline (M4 / M5)
- Image preprocessing (OpenCV: noise removal, resize, perspective correction).
- OCR text detection and spatial bounding-box localization.
- Structured extraction of mandatory declarations:
  - MRP (currency, value, inclusion of taxes declaration)
  - Net Quantity (standard unit, numerical value)
  - Manufacturer / Packer / Importer details
  - Date of manufacture / packing / import
  - Consumer Care details (email, phone, address)

### 3.4 Compliance Engine & Legal RAG (M5 / M6)
- **Rule Engine**: Deterministic evaluator checking required fields, formats, placement, and units. Assigns compliance status (`COMPLIANT`, `VIOLATION`, `NEEDS_REVIEW`) and confidence scores.
- **RAG Engine**: Vector database query returning exact legal act/rule citations and contextual explanations. RAG never overrides deterministic rule engine decisions.

---

## 4. Non-Functional Requirements

- **Security**: No hardcoded secrets, mandatory JWT validation, strict RBAC.
- **Performance**: Instant UI responsiveness via component-based Next.js rendering, optimized OpenCV/OCR pipeline latency.
- **Human-in-the-Loop**: Low-confidence or ambiguous OCR/extraction results route to `NEEDS_REVIEW` state requiring officer manual review before report finalization.
