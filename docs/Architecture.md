# Validra — System Architecture Specification

## 1. High-Level System Architecture

Validra uses a decoupled architecture separating Frontend User Experience (Next.js), Backend Orchestration (FastAPI), AI/CV Processing (OpenCV/OCR), Compliance Engine (Deterministic Rules + RAG), and Data Persistence (PostgreSQL, Object Storage, Vector Store).

```mermaid
flowchart TD
    USER["👤 Inspector / Admin"]

    subgraph FRONTEND["🖥️ Frontend — Next.js (M1)"]
        AUTH_FE["Auth.js / NextAuth & Nodemailer"]
        PAGES["Landing · Inspector Portal · Admin Portal"]
    end

    subgraph SEC["🔐 Security & Auth Layer (M3)"]
        JWT["JWT Access Token"]
    end

    subgraph BACKEND["⚙️ Backend — FastAPI (M2)"]
        AUTH_BE["FastAPI Auth Middleware\n(Verify JWT Signature, Expiry, RBAC)"]
        ORCH["API Gateway & Scan Orchestrator"]
        REPO["Report Generator"]
    end

    subgraph AI["🤖 AI & CV Layer (M4)"]
        CV_ENG["OpenCV Preprocessing"]
        OCR_ENG["Text Detection & OCR (Bounding Boxes)"]
    end

    subgraph COMPLIANCE["⚖️ Compliance Intelligence (M5 & M6)"]
        IE_ENG["Information Extractor"]
        RULE_ENG["Deterministic Rule Engine"]
        RAG_ENG["Legal RAG Engine (Embeddings + Vector DB)"]
    end

    subgraph DATA["💾 Evidence & Data (M3)"]
        PG["PostgreSQL (Users, Inspections, Violations)"]
        S3["Object Storage (Images, PDF Reports)"]
        VDB["Vector Database (Legal Metrology Act/Rules)"]
    end

    USER --> FRONTEND
    AUTH_FE --> JWT
    FRONTEND -->|"Bearer JWT Token"| BACKEND
    AUTH_BE --> ORCH
    ORCH --> AI
    AI --> COMPLIANCE
    RULE_ENG <--> RAG_ENG
    COMPLIANCE --> DATA
    DATA --> BACKEND
    BACKEND --> FRONTEND
```

---

## 2. Authentication & Authorization Security Flow

```mermaid
sequenceDiagram
    actor Client as 👤 Client (Next.js)
    participant AuthJS as 🔐 NextAuth / Auth.js
    participant Mail as 📧 Nodemailer
    participant FastAPI as ⚙️ FastAPI Backend
    participant DB as 💾 PostgreSQL

    Client->>AuthJS: Login / Sign-up request
    AuthJS->>Mail: Send verification email (Nodemailer)
    Client->>AuthJS: Confirm email / Credentials
    AuthJS->>DB: Query / Sync User & Role
    AuthJS-->>Client: Issue Signed JWT Access Token

    Note over Client, FastAPI: Protected API Request (e.g. POST /scans)
    Client->>FastAPI: HTTP Request with Header: "Authorization: Bearer <JWT>"
    FastAPI->>FastAPI: Auth Middleware: Verify Signature, Expiration & Role
    alt Invalid / Expired JWT
        FastAPI-->>Client: 401 Unauthorized / 403 Forbidden
    else Valid JWT
        FastAPI->>FastAPI: Process Request (OCR / Rule Engine / RAG)
        FastAPI-->>Client: 200 OK + Payload
    end
```

### Critical Security Rule

FastAPI **never** trusts a simple `isAuthorized: true` flag from Next.js endpoints. FastAPI independently decodes and validates the JWT signature, expiration, and user permissions before granting access to OCR, Rule Engine, or DB services.

---

## 3. Dedicated Review Inspection Architecture

Validra enforces human-in-the-loop validation for compliance inspection findings:

```mermaid
flowchart TD
    A["📷 Raw Package Image"] --> B["👁️ Preprocessing & OCR"]
    B --> C["📋 Information Extraction (MRP, Qty, Dates)"]
    C --> D["⚖️ Rule Engine Evaluation"]
    D --> E{"Confidence & Status"}
    E -->|"High Confidence"| F["Pass / Fail Classification"]
    E -->|"Low Confidence / Ambiguous"| G["⚠️ NEEDS_REVIEW"]
    F --> H["👮 Dedicated Review Inspection Page"]
    G --> H
    H --> I["Inspector Reviews Bounding Boxes & Evidence"]
    I --> J["Inspector Accepts / Rejects / Modifies Finding"]
    J --> K["Inspector Adds Remarks & Finalizes"]
    K --> L["📄 Final Signed Compliance Report Generated"]
```

---

## 4. Five-Layer System Architecture

1. **User Experience Layer (M1)**: Next.js App Router, Tailwind CSS, shadcn/ui, responsive portal layouts.
2. **Orchestration & Gateway Layer (M2)**: FastAPI, Pydantic data schemas, async task pipelines, REST endpoints.
3. **Database, Auth & Integration Layer (M3)**: NextAuth + Nodemailer authentication, JWT token validation, PostgreSQL relational models, Object Storage.
4. **AI & Computer Vision Layer (M4)**: OpenCV image enhancement, OCR text detection, bounding-box coordinate tracking.
5. **Compliance & Legal Intelligence Layer (M5 & M6)**: Deterministic Rule Engine, structured Information Extraction, RAG Vector Search with Legal Metrology citation generation.
