#

<p align="center">
  <img src="https://img.shields.io/badge/🛡️_VALIDRA-Intelligent_Product_Compliance-0d1117?style=for-the-badge&labelColor=0d1117&color=58a6ff" alt="Validra"/>
</p>

<p align="center">
  <strong>"See → Extract → Validate → Explain → Evidence → Report → Review"</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Smart_India_Hackathon-2026-ff6b35?style=for-the-badge&logo=government&logoColor=white" alt="SIH 2026" />
  <img src="https://img.shields.io/badge/Problem_Statement-26034-7c3aed?style=for-the-badge" alt="PS 26034" />
  <img src="https://img.shields.io/badge/Status-Active_Development-00c853?style=for-the-badge&logo=statuspage&logoColor=white" alt="Status" />
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-Apache_2.0-red?style=for-the-badge&logo=apache&logoColor=white" alt="License" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat&logo=opencv&logoColor=white" alt="OpenCV" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</p>

---

## 📖 Overview

**Validra** is an AI-assisted compliance checking system designed to help
inspect packaged commodities against applicable requirements under
India's **Legal Metrology Act, 2009** and **Legal Metrology (Packaged
Commodities) Rules, 2011**.

The platform analyzes product/package images and product information,
extracts mandatory declarations, evaluates them through a rule-based
compliance engine, retrieves relevant legal context using RAG, and
generates evidence-backed compliance reports.

> 🌟 **Smart India Hackathon 2026 — Problem Statement ID: 26034**

---

## 📑 Table of Contents

- [🎯 Problem](#-problem)
- [💡 Solution](#-solution)
- [🧠 Why Validra?](#-why-validra)
- [🚀 Key Features](#-key-features)
- [🏗️ System Design & Architecture](#-system-design--architecture)
- [🔄 Processing Pipeline](#-processing-pipeline)
- [⚖️ Rule Engine + RAG](#-rule-engine--rag)
- [📊 Confidence-Aware Inspection](#-confidence-aware-inspection)
- [🗃️ Core Data Model](#-core-data-model)
- [🔌 API Overview](#-api-overview)
- [🧩 Technology Stack](#-technology-stack)
- [📁 Repository Structure](#-repository-structure)
- [🧪 Testing Strategy](#-testing-strategy)
- [🛡️ Responsible AI & Legal Disclaimer](#-responsible-ai--legal-disclaimer)
- [🛠️ Development Roadmap](#-development-roadmap)
- [👥 Team Domains](#-team-domains)
- [🤝 Contribution Workflow](#-contribution-workflow)
- [🚀 Getting Started](#-getting-started)
- [📖 Interactive Documentation](#-interactive-documentation)
- [🏆 Smart India Hackathon 2026](#-smart-india-hackathon-2026)
- [📌 Status](#-status)
- [📄 License](#-license)
- [🌟 Support Our Mission](#-support-our-mission)

---

## 🎯 Problem

Packaged commodities sold through retail stores, supermarkets, and
e-commerce platforms are expected to carry prescribed declarations such
as manufacturer/packer/importer details, net quantity, MRP, date-related
information, consumer-care details, and other applicable declarations.

Manual inspection across a large and diverse product ecosystem is
time-consuming and resource-intensive. Validra aims to assist
enforcement personnel by automating the initial inspection, extraction,
validation, evidence collection, and reporting workflow.

```mermaid
pie title Common Compliance Issues
    "Missing Declarations" : 35
    "Incorrect MRP" : 20
    "Font/Readability" : 15
    "Format Violations" : 15
    "Placement Issues" : 10
    "Other" : 5
```

---

## 💡 Solution

Validra follows an evidence-first pipeline:

```mermaid
flowchart TD
    A["📷 Product Image / Information"] --> B["🔧 Image Preprocessing"]
    B --> C["👁️ OCR + Computer Vision"]
    C --> D["📋 Information Extraction"]
    D --> E["⚖️ Compliance Rule Engine"]
    E --> F{"Decision"}
    F -->|"✅"| G["COMPLIANT"]
    F -->|"❌"| H["VIOLATION"]
    F -->|"⚠️"| I["NEEDS REVIEW"]
    G --> J["📝 Evidence + Legal Context"]
    H --> J
    I --> J
    J --> K["📄 Compliance Report"]
    K --> L["💾 Database / Inspection History"]
    L --> M["📊 Enforcement Dashboard"]

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style E fill:#1a1a2e,stroke:#0f3460,color:#fff
    style G fill:#0d3b0d,stroke:#00c853,color:#fff
    style H fill:#3b0d0d,stroke:#ff1744,color:#fff
    style I fill:#3b3b0d,stroke:#ffab00,color:#fff
    style M fill:#1a1a2e,stroke:#58a6ff,color:#fff
```

### Core Principle

**AI extracts and assists → Rules evaluate → RAG explains and references
→ Human reviews uncertain cases.**

Validra is a decision-support system, not a replacement for authorized
legal or enforcement judgment. AI/CV outputs are accompanied by
confidence information, and uncertain cases can be routed for manual
review.

---

## 🧠 Why Validra?

| ❌ Traditional Manual Inspection | ✅ Validra — AI-Assisted Inspection |
|:---|:---|
| 🐢 Slow, manual label reading | ⚡ Instant AI-powered scanning |
| 📝 Paper-based records | 💾 Digital evidence preservation |
| 🧑 Single inspector bottleneck | 🤖 Scalable, consistent checks |
| 🔍 Misses subtle violations | 🎯 Detects missing/incorrect declarations |
| 📊 No analytics or trends | 📊 Real-time enforcement dashboard |
| 🗂️ Hard to retrieve past records | 🔎 Searchable inspection history |

```mermaid

flowchart TD
    subgraph OLD["❌ Old Way — Traditional Manual Inspection"]
        direction TB
        O1["👤 Officer Reads Label Manually"] --> O2["🧠 Recalls Rules from Memory"]
        O2 --> O3["📝 Fills Out Paper Reports"]
        O3 --> O4["📁 Stores Hard Copies in Cabinets"]
    end

    subgraph NEW["✅ Validra Way — AI-Assisted Inspection"]
        direction TB
        N1["📱 Officer Scans Product Label"] --> N2["🤖 AI Preprocesses, OCRs & Extracts Data"]
        N2 --> N3["⚖️ Deterministic Rule Engine Validates"]
        N3 --> N4["📊 Instant Evidence-Backed Report & Searchable History"]
    end

    OLD ==>|"🚀 Upgrade & Automate"| NEW

    style OLD fill:#1e1014,stroke:#ff3366,stroke-width:2px,color:#fff,padding-top: 2px
    style NEW fill:#0d231a,stroke:#00e676,stroke-width:2px,color:#fff
```

---

## 🚀 Key Features

### 📷 Product Scanning

-   Upload or capture packaged commodity images.
-   Process package and label images.
-   Preserve original and processed evidence.

### 👁️ Computer Vision & OCR

-   Image preprocessing using OpenCV.
-   Text detection and OCR.
-   Bounding-box based text localization.
-   Relevant label-region extraction.
-   Readability and font-related analysis where technically measurable.

### 🧾 Information Extraction

Identify structured fields such as:

-   MRP
-   Net quantity
-   Manufacturer
-   Packer
-   Importer
-   Manufacturing/packing/import-related date information
-   Consumer-care information
-   Other applicable declarations

### ⚖️ Rule-Based Compliance Engine

-   Check required declarations.
-   Validate extracted values and formats.
-   Apply category-specific rules where applicable.
-   Detect missing or potentially non-compliant declarations.
-   Classify findings by severity.
-   Maintain rule references and versions.

### 🧠 RAG & Legal Intelligence

-   Ingest authoritative legal/regulatory documents.
-   Retrieve relevant provisions for findings.
-   Provide contextual explanations.
-   Connect findings with supporting legal references.

### 📊 Enforcement Dashboard

-   Inspection statistics.
-   Compliance/non-compliance trends.
-   Violation categories.
-   Product and inspection history.
-   Search and retrieval of previous inspections.

### 📄 Compliance Reports

Generate reports containing:

-   Product information
-   Extracted declarations
-   Compliance status
-   Violations
-   Evidence images
-   Evidence locations
-   Confidence values
-   Applicable legal references
-   Inspection metadata

### 🔐 Security

-   Authentication
-   Role-based access
-   Protected APIs
-   Inspection history
-   Audit records

---

## 🏗️ System Design & Architecture

### High-Level System Architecture

```mermaid
flowchart TD
    USER["👤 Officer / User"]

    subgraph FRONTEND["🖥️ Frontend — Next.js"]
        F1["Login"]
        F2["Scan Product"]
        F3["Results"]
        F4["Dashboard"]
        F5["History"]
        F6["Reports"]
        F7["Admin"]
    end

    subgraph BACKEND["⚙️ Backend — FastAPI"]
        B1["Authentication / Authorization"]
        B2["API Gateway / Request Validation"]
        B3["Scan Orchestration"]
        B4["File Management"]
        B5["Report Management"]
        B6["Database Operations"]
    end

    subgraph AI["🤖 AI Understanding"]
        subgraph CV["👁️ CV Pipeline"]
            CV1["OpenCV Preprocessing"]
            CV2["Text Detection"]
            CV3["OCR"]
            CV4["Bounding Boxes"]
            CV5["Readability Analysis"]
        end
        subgraph IE["📋 Information Extraction"]
            IE1["MRP"]
            IE2["Net Quantity"]
            IE3["Manufacturer"]
            IE4["Dates"]
            IE5["Consumer Care"]
        end
    end

    subgraph COMPLIANCE["⚖️ Compliance Intelligence"]
        RE["Rule Engine\nRequired? · Correct? · Readable?\nFormat? · Placement?"]
        RAG["RAG Engine\nLegal Documents · Embeddings\nRetrieval · Explanation"]
    end

    subgraph DATA["💾 Evidence & Data"]
        DB["PostgreSQL\nUsers · Products · Inspections\nViolations · Reports"]
        OBJ["Object Storage\nProduct Images · Evidence\nProcessed Images · Reports"]
        VDB["Vector Database\nLegal Embeddings"]
    end

    USER --> FRONTEND
    FRONTEND -->|"REST / JSON"| BACKEND
    BACKEND --> AI
    AI --> COMPLIANCE
    RE <--> RAG
    COMPLIANCE --> DATA
    DATA --> BACKEND
    BACKEND --> FRONTEND

    style USER fill:#0d1117,stroke:#58a6ff,color:#fff
    style FRONTEND fill:#0d1117,stroke:#7c3aed,color:#fff
    style BACKEND fill:#0d1117,stroke:#e94560,color:#fff
    style CV fill:#0d1117,stroke:#00bcd4,color:#fff
    style IE fill:#0d1117,stroke:#ff9800,color:#fff
    style COMPLIANCE fill:#0d1117,stroke:#4caf50,color:#fff
    style DATA fill:#0d1117,stroke:#ff6b35,color:#fff
```

### Five-Layer Architecture

``` text
┌───────────────────────────────────────────┐
│              USER EXPERIENCE              │
│     Next.js • Scan • Dashboard • Reports  │
├───────────────────────────────────────────┤
│              ORCHESTRATION                │
│       FastAPI • Auth • APIs • DB          │
├───────────────────────────────────────────┤
│             AI UNDERSTANDING              │
│      OpenCV • OCR • CV • Extraction       │
├───────────────────────────────────────────┤
│            COMPLIANCE INTELLIGENCE        │
│       Rule Engine • RAG • Legal Context   │
├───────────────────────────────────────────┤
│             EVIDENCE & DATA               │
│ PostgreSQL • Object Storage • Vector DB   │
└───────────────────────────────────────────┘
```

### Complete Inspection Sequence

```mermaid
sequenceDiagram
    actor Officer as 👤 Officer
    participant FE as 🖥️ Frontend
    participant BE as ⚙️ Backend
    participant CV as 👁️ CV/OCR
    participant RE as ⚖️ Rule Engine
    participant RAG as 🧠 RAG
    participant DB as 💾 Database

    Officer->>FE: Upload product image
    FE->>BE: POST /scans (image)
    BE->>DB: Create Inspection ID
    BE->>BE: Store image in Object Storage

    BE->>CV: Send image for processing
    CV->>CV: OpenCV preprocessing
    CV->>CV: Text detection + OCR
    CV->>CV: Bounding boxes + confidence
    CV-->>BE: Extracted text + spatial data

    BE->>BE: Information Extraction
    Note over BE: MRP, Quantity, Manufacturer,<br/>Dates, Consumer Care

    BE->>RE: Structured data + applicable rules
    RE->>RE: Validate declarations
    RE->>RE: Classify violations + severity
    RE-->>BE: Compliance findings

    BE->>RAG: Query relevant legal context
    RAG->>RAG: Retrieve legal provisions
    RAG->>RAG: Generate explanation
    RAG-->>BE: Legal context + references

    BE->>BE: Generate evidence + report
    BE->>DB: Save inspection + violations
    BE-->>FE: Compliance result
    FE-->>Officer: Display result + evidence
    Officer->>FE: Download/share report
```

---

## 🔄 Processing Pipeline

```mermaid
flowchart TD
    A["📷 Raw Product Image"] --> B["✅ Image Validation"]
    B --> C["🔧 OpenCV Preprocessing"]

    C --> D["Resize"]
    C --> E["Denoise"]
    C --> F["Perspective Correction"]

    D --> G["🔍 Text Detection"]
    E --> G
    F --> G

    G --> H["📝 OCR"]
    H --> I["Text + Bounding Boxes"]
    I --> J["📋 Information Extraction"]

    J --> K["MRP"]
    J --> L["Net Quantity"]
    J --> M["Manufacturer"]
    J --> N["Dates"]
    J --> O["Consumer Care"]

    K --> P["📦 Structured Product JSON"]
    L --> P
    M --> P
    N --> P
    O --> P

    P --> Q["⚖️ Applicable Rules"]
    Q --> R["Rule Evaluation"]
    R --> S{"Decision"}

    S -->|"✅"| T["Compliant"]
    S -->|"❌"| U["Non-Compliant"]
    S -->|"⚠️"| V["Needs Review"]

    T --> W["📝 Evidence + Legal Context"]
    U --> W
    V --> W

    W --> X["📄 Report + Database"]

    style A fill:#0d1117,stroke:#58a6ff,color:#fff
    style P fill:#0d1117,stroke:#ff9800,color:#fff
    style T fill:#0d3b0d,stroke:#00c853,color:#fff
    style U fill:#3b0d0d,stroke:#ff1744,color:#fff
    style V fill:#3b3b0d,stroke:#ffab00,color:#fff
    style X fill:#0d1117,stroke:#7c3aed,color:#fff
```

Example OCR output:

``` json
{
  "text": "MRP ₹50",
  "confidence": 0.96,
  "bbox": [120, 340, 280, 390]
}
```

Example extracted field:

``` json
{
  "mrp": {
    "value": 50.0,
    "currency": "INR",
    "confidence": 0.96
  }
}
```

---

## ⚖️ Rule Engine + RAG

Validra separates **compliance decisions** from **language generation**.

```mermaid
flowchart TD
    subgraph IN["📥 Input Stage"]
        A["📋 Extracted Product Data"]
    end

    subgraph RE["⚖️ Rule Engine — Decision Layer"]
        direction TB
        B["⚙️ Load Applicable Legal Rules"] --> C["🔍 Validate Extracted Values & Formats"]
        C --> D{"⚡ Compliance Check"}
        D -->|"Pass"| E["✅ COMPLIANT"]
        D -->|"Fail"| F["❌ NON-COMPLIANT"]
        D -->|"Low Confidence"| G["⚠️ NEEDS REVIEW"]
    end

    subgraph RAG["🧠 RAG Engine — Explanation Layer"]
        direction TB
        H["🔎 Vector DB Legal Context Query"] --> I["📚 Retrieve Act & Rule Provisions"]
        I --> J["📝 Generate Contextual Explanation"]
        J --> K["📌 Attach Authoritative References"]
    end

    subgraph OUT["📤 Final Inspection Output"]
        L["📄 Evidence-Backed Compliance Finding & Report"]
    end

    A --> B
    E --> H
    F --> H
    G --> H
    K --> L

    style IN fill:#0d1117,stroke:#58a6ff,stroke-width:2px,color:#fff
    style RE fill:#0d1117,stroke:#4caf50,stroke-width:2px,color:#fff
    style RAG fill:#0d1117,stroke:#7c3aed,stroke-width:2px,color:#fff
    style OUT fill:#0d1117,stroke:#ff9800,stroke-width:2px,color:#fff
```

The rule engine provides deterministic validation wherever requirements
can be expressed as rules. RAG retrieves supporting regulatory context
and helps explain findings; it should not independently make the final
legal decision.

### Rule Engine Decision States

| State | Icon | Meaning | When Used |
|:------|:-----|:--------|:----------|
| **Compliant** | ✅ | Declaration passes validation | High confidence, rule satisfied |
| **Non-Compliant** | ❌ | Violation detected | Declaration missing/invalid, high confidence |
| **Needs Review** | ⚠️ | Uncertain result | Low OCR/extraction confidence |

---

## 📊 Confidence-Aware Inspection

Validra tracks uncertainty throughout the AI pipeline.

```mermaid
flowchart LR
    subgraph STAGE1["Stage 1"]
        A["📝 OCR\nConfidence: 96%"]
    end
    subgraph STAGE2["Stage 2"]
        B["📋 Extraction\nConfidence: 94%"]
    end
    subgraph STAGE3["Stage 3"]
        C["✅ Validation\nConfidence: 99%"]
    end
    subgraph RESULT["Result"]
        D["🎯 Overall\nConfidence: 93%"]
    end

    A --> B --> C --> D

    style A fill:#0d3b0d,stroke:#00c853,color:#fff
    style B fill:#0d3b0d,stroke:#00c853,color:#fff
    style C fill:#0d3b0d,stroke:#00c853,color:#fff
    style D fill:#0d3b0d,stroke:#00c853,color:#fff
```

### High vs Low Confidence Examples

| Stage | ✅ High Confidence | ⚠️ Low Confidence |
|:------|:-------------------|:-------------------|
| OCR | 96% | 48% |
| Extraction | 94% | 42% |
| Validation | 99% | — |
| **Overall** | **93%** | **Low** |
| **Result** | ✅ `COMPLIANT` | ⚠️ `NEEDS REVIEW` |

This reduces false certainty and helps officers focus on ambiguous
cases.

---

## 🗃️ Core Data Model

```mermaid
erDiagram
    USER ||--o{ INSPECTION : creates
    INSPECTION ||--|| PRODUCT : inspects
    INSPECTION ||--o{ IMAGE : has
    INSPECTION ||--o{ EXTRACTED_FIELD : produces
    INSPECTION ||--|| COMPLIANCE_RESULT : generates
    INSPECTION ||--o{ VIOLATION : finds
    VIOLATION }o--|| RULE : references
    INSPECTION ||--o| REPORT : generates

    USER {
        uuid user_id PK
        string name
        string email
        string role
        timestamp created_at
    }

    INSPECTION {
        uuid inspection_id PK
        uuid product_id FK
        uuid inspector_id FK
        string status
        float compliance_score
        timestamp created_at
        timestamp completed_at
    }

    PRODUCT {
        uuid product_id PK
        string name
        string category
        string barcode
    }

    IMAGE {
        uuid image_id PK
        uuid inspection_id FK
        string type
        string storage_path
    }

    EXTRACTED_FIELD {
        uuid field_id PK
        uuid inspection_id FK
        string field_name
        string value
        float confidence
        json bbox
    }

    COMPLIANCE_RESULT {
        uuid result_id PK
        uuid inspection_id FK
        string status
        float score
        int total_rules
        int passed
        int failed
        int review
    }

    VIOLATION {
        uuid violation_id PK
        uuid inspection_id FK
        uuid rule_id FK
        string violation_type
        string description
        string severity
        float confidence
        json bbox
        string evidence_image
    }

    RULE {
        uuid rule_id PK
        string rule_code
        string field
        boolean required
        string validation
        string severity
        string legal_reference
        date effective_date
    }

    REPORT {
        uuid report_id PK
        uuid inspection_id FK
        string format
        string storage_path
        timestamp generated_at
    }
```

Potential entities:

``` text
users
products
inspections
images
extracted_fields
compliance_results
violations
rules
reports
audit_logs
```

| Table | Purpose | Key Relationships |
|:------|:--------|:------------------|
| `users` | Officer/admin accounts | Creates inspections |
| `products` | Product information | Inspected via inspections |
| `inspections` | Core inspection record | Links all entities |
| `images` | Original + processed images | Belong to inspection |
| `extracted_fields` | OCR/extraction results | Per inspection, with confidence |
| `compliance_results` | Overall compliance status | One per inspection |
| `violations` | Individual violations found | References rules |
| `rules` | Legal compliance rules | Referenced by violations |
| `reports` | Generated PDF reports | One per inspection |
| `audit_logs` | Who did what, when | System-wide tracking |

---

## 🔌 API Overview

| Method | Endpoint | Purpose | Auth |
|:-------|:---------|:--------|:----:|
| `POST` | `/auth/login` | Authenticate user | ❌ |
| `POST` | `/scans` | Upload/start inspection | ✅ |
| `GET` | `/scans/{id}` | Get processing status | ✅ |
| `GET` | `/inspections/{id}` | Retrieve inspection | ✅ |
| `GET` | `/products` | Search products | ✅ |
| `GET` | `/violations` | Retrieve violations | ✅ |
| `GET` | `/dashboard` | Dashboard statistics | ✅ |
| `POST` | `/reports/{id}` | Generate report | ✅ |
| `GET` | `/reports/{id}` | Retrieve report | ✅ |

API contracts should be versioned and documented through
FastAPI/OpenAPI.

<details>
<summary><strong>📡 Example API Usage</strong></summary>

**Start Inspection:**
```http
POST /scans
Content-Type: multipart/form-data

image = product.jpg
```

**Response:**
```json
{
  "inspection_id": "INS-000124",
  "status": "processing"
}
```

**Poll for result:**
```http
GET /scans/INS-000124
```

```json
{
  "status": "completed",
  "compliance_status": "non_compliant",
  "score": 78,
  "violations": 2
}
```

</details>

---

## 🧩 Technology Stack

| Layer | Technology | Badge | Purpose |
|:------|:-----------|:------|:--------|
| **Frontend** | Next.js, TypeScript | ![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) | High-performance, SEO-friendly UI |
| **UI** | Tailwind CSS, shadcn/ui | ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white) ![shadcn](https://img.shields.io/badge/shadcn/ui-000?style=flat&logo=shadcnui&logoColor=white) | Modern utility-first styling |
| **Backend** | FastAPI, Python | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) | Async REST API & orchestration |
| **Database** | PostgreSQL | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white) | Relational data storage |
| **Computer Vision** | OpenCV | ![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat&logo=opencv&logoColor=white) | Image preprocessing & analysis |
| **OCR** | PaddleOCR / selected engine | ![PaddleOCR](https://img.shields.io/badge/PaddleOCR-0062B0?style=flat&logo=paddlepaddle&logoColor=white) | Text recognition |
| **ML/NLP** | spaCy, scikit-learn | ![spaCy](https://img.shields.io/badge/spaCy-09A3D5?style=flat&logo=spacy&logoColor=white) | NLP & extraction |
| **RAG** | Embeddings + Vector DB | ![VectorDB](https://img.shields.io/badge/Vector_DB-FF6B35?style=flat) | Legal document retrieval |
| **LLM** | Configurable provider | ![LLM](https://img.shields.io/badge/LLM-7c3aed?style=flat) | Explanation generation |
| **Auth** | JWT / configurable | ![JWT](https://img.shields.io/badge/JWT-000?style=flat&logo=jsonwebtokens&logoColor=white) | Authentication & authorization |
| **Reports** | ReportLab | ![ReportLab](https://img.shields.io/badge/ReportLab-333?style=flat) | PDF report generation |
| **API** | REST / JSON | ![REST](https://img.shields.io/badge/REST-02569B?style=flat) | API protocol |

Technology choices may evolve based on accuracy, benchmarks, cost, and
deployment constraints.

---

## 📁 Repository Structure

``` text
validra/
│
├── frontend/                 # Next.js application
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   ├── core/             # Config, security
│   │   ├── database/         # DB connections
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   └── requirements.txt
│
├── cv/                       # Computer Vision & OCR
│   ├── preprocessing/
│   ├── detection/
│   ├── ocr/
│   └── extraction/
│
├── rule-engine/              # Compliance rule system
│   ├── rules/
│   ├── validators/
│   ├── evaluators/
│   └── schemas/
│
├── rag/                      # Legal RAG pipeline
│   ├── ingestion/
│   ├── retrieval/
│   ├── embeddings/
│   └── generation/
│
├── research/                 # Legal research, datasets, benchmarks
├── tests/                    # Unit, integration & E2E tests
│
├── docs/                     # 📖 Interactive MDX documentation
│   └── base_setup.mdx        # Beginner-friendly environment setup
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🧪 Testing Strategy

```mermaid
flowchart TD
    A["Unit Testing"] --> B["Integration Testing"]
    B --> C["OCR / Model Evaluation"]
    C --> D["Rule Validation Testing"]
    D --> E["API Testing"]
    E --> F["End-to-End Testing"]
    F --> G["User Acceptance Testing"]

    style A fill:#0d1117,stroke:#58a6ff,color:#fff
    style G fill:#0d1117,stroke:#00c853,color:#fff
```

Important test cases include:

-   Clear images
-   Blurred images
-   Rotated images
-   Low-light images
-   Missing declarations
-   Incorrect formats
-   OCR errors
-   Low-confidence extraction
-   Multiple product categories
-   Conflicting information
-   API failures
-   Unauthorized access
-   Report-generation failures

### Evaluation Metrics

| Domain | Metrics |
|:-------|:--------|
| **OCR / Extraction** | Character/Word Error Rate, Field Accuracy, Precision, Recall, F1-score |
| **Computer Vision** | Detection Precision/Recall, IoU where applicable |
| **Compliance Engine** | Rule Validation Accuracy, False-Positive Rate, False-Negative Rate, Violation Classification |
| **System** | Average Processing Time, API Latency, Successful Processing Rate, Report Generation Time |

---

## 🛡️ Responsible AI & Legal Disclaimer

Validra is an **AI-assisted inspection and decision-support system**.

The system should:

-   ✅ Preserve supporting evidence.
-   ✅ Display confidence levels.
-   ✅ Provide applicable rule references.
-   ✅ Flag uncertain cases for manual review.
-   ❌ Avoid presenting low-confidence AI outputs as definitive legal
    conclusions.

> **Final legal interpretation and enforcement action should remain with the authorized authority.**

---

## 🛠️ Development Roadmap

```mermaid
flowchart TD
    subgraph P1["Phase 1: 🏗️ Foundation"]
        direction TB
        P1A["Repo Setup"] --> P1B["Next.js + FastAPI Skeleton"]
        P1B --> P1C["PostgreSQL Schema"]
        P1C --> P1D["Auth & API Contracts"]
    end

    subgraph P2["Phase 2: 🔧 Core AI Pipeline"]
        direction TB
        P2A["Image Upload API"] --> P2B["OpenCV Preprocessing"]
        P2B --> P2C["OCR & Bounding Boxes"]
        P2C --> P2D["Field Extraction & Initial Rules"]
    end

    subgraph P3["Phase 3: 🧠 Compliance Intelligence"]
        direction TB
        P3A["Rule Repository & Evaluator"] --> P3B["Violation Classification"]
        P3B --> P3C["Confidence Propagation"]
        P3C --> P3D["Evidence Region Localization"]
    end

    subgraph P4["Phase 4: 📚 Legal RAG Engine"]
        direction TB
        P4A["Legal Doc Ingestion"] --> P4B["Chunking & Embeddings"]
        P4B --> P4C["Vector Search & Retrieval"]
        P4C --> P4D["Contextual Explanation Gen"]
    end

    subgraph P5["Phase 5: 🚀 Productization"]
        direction TB
        P5A["Enforcement Dashboard"] --> P5B["Inspection History & Search"]
        P5B --> P5C["PDF Compliance Reports"]
        P5C --> P5D["Role-Based Access & Audit Logs"]
    end

    subgraph P6["Phase 6: ✅ Validation & Deployment"]
        direction TB
        P6A["Model & Rule Benchmarking"] --> P6B["End-to-End System Testing"]
        P6B --> P6C["Security Audits & Optimization"]
        P6C --> P6D["Production Deployment & SIH Demo"]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6

    style P1 fill:#0d1117,stroke:#58a6ff,stroke-width:2px,color:#fff
    style P2 fill:#0d1117,stroke:#00bcd4,stroke-width:2px,color:#fff
    style P3 fill:#0d1117,stroke:#ff9800,stroke-width:2px,color:#fff
    style P4 fill:#0d1117,stroke:#7c3aed,stroke-width:2px,color:#fff
    style P5 fill:#0d1117,stroke:#e94560,stroke-width:2px,color:#fff
    style P6 fill:#0d1117,stroke:#00c853,stroke-width:2px,color:#fff
```

### Phase 1 — Foundation

-   [ ] Repository setup
-   [ ] Next.js frontend
-   [ ] FastAPI backend
-   [ ] PostgreSQL schema
-   [ ] Authentication
-   [ ] API contracts

### Phase 2 — Core AI Pipeline

-   [ ] Image upload
-   [ ] OpenCV preprocessing
-   [ ] OCR integration
-   [ ] Bounding-box extraction
-   [ ] Mandatory-field extraction
-   [ ] Initial compliance rules

### Phase 3 — Compliance Intelligence

-   [ ] Rule repository
-   [ ] Rule evaluator
-   [ ] Violation classification
-   [ ] Confidence propagation
-   [ ] Evidence localization

### Phase 4 — RAG

-   [ ] Legal document ingestion
-   [ ] Chunking
-   [ ] Embeddings
-   [ ] Vector search
-   [ ] Relevant-rule retrieval
-   [ ] Explanation generation

### Phase 5 — Productization

-   [ ] Enforcement dashboard
-   [ ] Inspection history
-   [ ] PDF reports
-   [ ] Search and filtering
-   [ ] Role-based access
-   [ ] Audit logs

### Phase 6 — Validation & Deployment

-   [ ] Dataset creation
-   [ ] Model benchmarking
-   [ ] End-to-end testing
-   [ ] Security testing
-   [ ] Performance optimization
-   [ ] Deployment
-   [ ] Documentation
-   [ ] SIH demonstration

---

## 👥 Team Domains

```mermaid
flowchart TD
    V["🛡️ VALIDRA"]

    V --> UI["🎨 M1\nFrontend"]
    V --> API["⚙️ M2\nBackend + Infra"]
    V --> CVT["👁️ M3\nComputer Vision"]
    V --> RET["⚖️ M4\nRule Engine"]
    V --> RAGT["🧠 M5\nRAG + AI"]
    V --> QAT["🔬 M6\nResearch + QA"]

    UI -.->|"supports"| QAT
    API -.->|"integrates"| UI
    CVT -.->|"feeds"| RET
    RAGT -.->|"explains"| RET
    QAT -.->|"tests"| CVT

    style V fill:#0d1117,stroke:#58a6ff,color:#fff
    style UI fill:#0d1117,stroke:#7c3aed,color:#fff
    style API fill:#0d1117,stroke:#e94560,color:#fff
    style CVT fill:#0d1117,stroke:#00bcd4,color:#fff
    style RET fill:#0d1117,stroke:#4caf50,color:#fff
    style RAGT fill:#0d1117,stroke:#ff9800,color:#fff
    style QAT fill:#0d1117,stroke:#ff6b35,color:#fff
```

| Domain | Responsibility |
|:-------|:---------------|
| 🎨 **Frontend** | Next.js, UI/UX, dashboard, scanning workflow |
| ⚙️ **Backend & Infrastructure** | FastAPI, APIs, DB, Auth, storage, deployment |
| 👁️ **Computer Vision** | OpenCV, OCR, detection, readability analysis |
| ⚖️ **Rule Engine** | Legal rules, validation, violations, compliance scoring |
| 🧠 **RAG & AI** | Legal retrieval, embeddings, LLM integration |
| 🔬 **Research & QA** | Legal research, datasets, evaluation, testing, documentation |

All members contribute to integration, debugging, and final system
validation.

---

## 🤝 Contribution Workflow

```mermaid
gitGraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "setup"

    branch feature/frontend-auth
    commit id: "login-ui"
    commit id: "dashboard"
    checkout develop
    merge feature/frontend-auth

    branch feature/backend-api
    commit id: "fastapi-setup"
    commit id: "scan-endpoint"
    checkout develop
    merge feature/backend-api

    branch feature/cv-ocr
    commit id: "opencv-pipeline"
    commit id: "ocr-integration"
    checkout develop
    merge feature/cv-ocr

    branch feature/rule-engine
    commit id: "rule-schema"
    commit id: "evaluator"
    checkout develop
    merge feature/rule-engine

    checkout main
    merge develop id: "v0.1.0" tag: "MVP"
```

Recommended Git workflow:

``` text
main
 │
 └── develop
       │
       ├── feature/frontend-*   (M1)
       ├── feature/backend-*    (M2)
       ├── feature/cv-*         (M3)
       ├── feature/rule-engine-* (M4)
       ├── feature/rag-*        (M5)
       └── feature/qa-*         (M6)
```

### 📋 Issue & Pull Request Templates

We have established end-to-end GitHub templates for streamlined tracking:

- 🐛 **[Bug Report Form](https://github.com/dhruvpatel16120/Validra/issues/new?template=bug_report.yml)** — Structured bug submission tagged by team domain (M1–M6) & component type.
- 💡 **[Feature Request Form](https://github.com/dhruvpatel16120/Validra/issues/new?template=feature_request.yml)** — Propose new features with user story and acceptance criteria.
- ⚖️ **[Legal Rule Addition Form](https://github.com/dhruvpatel16120/Validra/issues/new?template=rule_addition.yml)** — Formalize Legal Metrology Act/PC Rules into machine rules.
- 🔬 **[QA & Benchmarking Task Form](https://github.com/dhruvpatel16120/Validra/issues/new?template=qa_test_task.yml)** — Track OCR evaluation runs, test datasets, and performance tests.
- 🔀 **[PR Templates](.github/PULL_REQUEST_TEMPLATE.md)** — Standardized PR templates with domain tags (M1–M6), type selectors (`frontend`, `backend`, `db`), testing checklists, and visual evidence sections.

> 📖 **Complete Developer & QA Workflow Guide:** See [`.github/WORKFLOW_GUIDE.md`](.github/WORKFLOW_GUIDE.md) for full branch naming, issue-linking, and QA verification procedures.

Before opening a pull request:

-   ✅ Keep changes focused.
-   ✅ Tag primary domain (`M1` to `M6`) and component type (`frontend`, `backend`, `db`, `cv`, `rule-engine`, `rag`, `qa`).
-   ✅ Test locally.
-   ✅ Update documentation when required.
-   ❌ Never commit secrets or `.env` files.
-   ✅ Add/update tests for important functionality.
-   ✅ Explain what changed and attach visual/test evidence.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|:-----|:--------|:--------|
| Git | Latest | Version control |
| Node.js | 18+ LTS | Frontend runtime |
| Python | 3.10+ | Backend + AI |
| PostgreSQL | 15+ | Database |
| OCR/CV deps | — | Required OCR/CV dependencies |

> 📖 **New to development?** Check our **[Base Setup Guide](./docs/base_setup.mdx)** for step-by-step installation instructions starting from scratch!

### Clone

``` bash
git clone https://github.com/dhruvpatel16120/Validra.git
cd validra
```

### Frontend

``` bash
cd frontend
npm install
npm run dev
```

### Backend

``` bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

> ⚠️ **Important:** Create your local `.env` from `.env.example`. Never commit API keys, passwords, or private credentials.

---

## 📖 Interactive Documentation

Validra uses **MDX** (Markdown + JSX) for interactive, component-rich documentation with embedded **Mermaid diagrams** for visual system explanations.

| Document | Description | Status |
|:---------|:------------|:------:|
| [`docs/base_setup.mdx`](./docs/base_setup.mdx) | 🟢 Base environment setup guide (Git, IDE, Node, Python, PostgreSQL) | ✅ Available |
| `docs/frontend_setup.mdx` | 🔵 Frontend development environment setup | 🔜 Coming Soon |
| `docs/backend_setup.mdx` | 🟣 Backend development environment setup | 🔜 Coming Soon |
| `docs/architecture.md` | System architecture deep-dive | 🔜 Planned |
| `docs/api.md` | API documentation | 🔜 Planned |
| `docs/database.md` | Database schema & migrations | 🔜 Planned |
| `docs/cv-pipeline.md` | CV/OCR pipeline documentation | 🔜 Planned |
| `docs/rule-engine.md` | Rule engine documentation | 🔜 Planned |
| `docs/rag.md` | RAG pipeline documentation | 🔜 Planned |
| `docs/testing.md` | Testing strategy & guidelines | 🔜 Planned |

### Why MDX + Mermaid?

- 📊 **Mermaid Diagrams** — Flowcharts, sequence diagrams, ER diagrams, and more rendered directly in documentation
- ⚛️ **MDX Components** — Interactive callouts, tabs, steps, and code blocks
- 🔄 **Version Controlled** — Documentation lives with the code
- 🎨 **Beautiful Rendering** — Rich formatting with syntax highlighting

---

## 🏆 Smart India Hackathon 2026

| Field | Details |
|:------|:--------|
| **Problem Statement** | 26034 |
| **Organization** | Ministry of Consumer Affairs, Food & Public Distribution |
| **Department** | Department of Consumer Affairs (DoCA) |
| **Category** | Software |
| **Theme** | Miscellaneous |
| **Project** | **Validra — Intelligent Product Compliance** |

> **Validra — Intelligent Product Compliance.**

---

## 📌 Status

🚧 **Active Development**

The architecture and module boundaries are being established. Model
selection, rule coverage, datasets, and implementation details will be
validated experimentally during development.

---

## 📄 License

Distributed under the terms of the **Apache License 2.0**. See [`LICENSE`](./LICENSE) for full details and license text.

---

## 🌟 Support Our Mission

> 💡 **Enforcement Intelligence for Consumer Protection**

If you find **Validra** impactful, innovative, or useful in advancing AI-powered compliance for Legal Metrology, please consider giving this repository a **Star**! ⭐ Your support helps us gain visibility, foster open-source collaboration, and bridge the digital enforcement gap.

<p align="center">
  <a href="https://github.com/dhruvpatel16120/Validra">
    <img src="https://img.shields.io/github/stars/dhruvpatel16120/Validra?style=social&label=Star%20Validra" alt="GitHub stars" />
  </a>
</p>

<br/>

<p align="center">Made with ❤️ for <b>Smart India Hackathon 2026</b> by <b>Team Validra</b></p>
