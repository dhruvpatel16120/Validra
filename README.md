<div align="center">

---

## 📑 Table of Contents

- [🎯 Problem](#-problem)
- [💡 Solution](#-solution)
- [🧠 Why Validra?](#-why-validra)
- [🚀 Key Features](#-key-features)
- [🏗️ System Design &amp; Architecture](#-system-design--architecture)
- [🔄 Processing Pipeline](#-processing-pipeline)
- [⚖️ Rule Engine + RAG](#-rule-engine--rag)
- [📊 Confidence-Aware Inspection](#-confidence-aware-inspection)
- [🗃️ Data Model](#-data-model)
- [🔌 API Overview](#-api-overview)
- [🧩 Technology Stack](#-technology-stack)
- [📁 Repository Structure](#-repository-structure)
- [🧪 Testing Strategy](#-testing-strategy)
- [🛡️ Responsible AI &amp; Legal Disclaimer](#-responsible-ai--legal-disclaimer)
- [🛠️ Development Roadmap](#-development-roadmap)
- [👥 Team Domains](#-team-domains)
- [🤝 Contribution Workflow](#-contribution-workflow)
- [🚀 Getting Started](#-getting-started)
- [📖 Interactive Documentation](#-interactive-documentation)
- [🏆 Smart India Hackathon 2026](#-smart-india-hackathon-2026)
- [📌 Status](#-status)
- [📄 License](#-license)

---

## 🎯 Problem

<table>
<tr>
<td width="60%">

**Validra** aims to assist enforcement personnel by automating the initial inspection, extraction, validation, evidence collection, and reporting workflow.

---

## 💡 Solution

Validra follows an **evidence-first pipeline** — every finding is traceable back to observable evidence.

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
    K --> L["💾 Database / History"]
    L --> M["📊 Enforcement Dashboard"]

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style E fill:#1a1a2e,stroke:#0f3460,color:#fff
    style G fill:#0d3b0d,stroke:#00c853,color:#fff
    style H fill:#3b0d0d,stroke:#ff1744,color:#fff
    style I fill:#3b3b0d,stroke:#ffab00,color:#fff
    style M fill:#1a1a2e,stroke:#58a6ff,color:#fff
```

### Core Principle

> **AI extracts and assists → Rules evaluate → RAG explains and references → Human reviews uncertain cases.**

Validra is a **decision-support system**, not a replacement for authorized legal or enforcement judgment. AI/CV outputs are accompanied by confidence information, and uncertain cases are routed for manual review.

---

## 🧠 Why Validra?

<table>
<tr>
<th align="center">❌ Traditional Manual Inspection</th>
<th align="center">✅ Validra — AI-Assisted Inspection</th>
</tr>
<tr>
<td>

```mermaid
flowchart LR
    subgraph OLD["❌ Old Way"]
        direction TB
        O1["Officer reads label manually"] --> O2["Checks rules from memory"]
        O2 --> O3["Writes paper report"]
        O3 --> O4["Files in cabinet"]
    end

    subgraph NEW["✅ Validra Way"]
        direction TB
        N1["Officer scans product"] --> N2["AI extracts + validates"]
        N2 --> N3["Evidence-backed report"]
        N3 --> N4["Searchable digital dashboard"]
    end

    OLD -.->|"Upgrade"| NEW

    style OLD fill:#1a0000,stroke:#ff1744,color:#fff
    style NEW fill:#001a0d,stroke:#00c853,color:#fff
```

---

## 🚀 Key Features

<table>
<tr>
<td width="50%">

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
        RE["Rule Engine<br/>Required? · Correct? · Readable?<br/>Format? · Placement?"]
        RAG["RAG Engine<br/>Legal Documents · Embeddings<br/>Retrieval · Explanation"]
    end

    subgraph DATA["💾 Evidence & Data"]
        DB["PostgreSQL<br/>Users · Products · Inspections<br/>Violations · Reports"]
        OBJ["Object Storage<br/>Product Images · Evidence<br/>Processed Images · Reports"]
        VDB["Vector Database<br/>Legal Embeddings"]
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

```mermaid
block-beta
    columns 1
    block:UX["🖥️ USER EXPERIENCE\nNext.js • Scan • Dashboard • Reports"]
        columns 4
        UX1["Login"] UX2["Scan"] UX3["Dashboard"] UX4["Reports"]
    end
    block:ORCH["⚙️ ORCHESTRATION\nFastAPI • Auth • APIs • DB"]
        columns 4
        OR1["Auth"] OR2["APIs"] OR3["Storage"] OR4["Reports"]
    end
    block:AIUND["🤖 AI UNDERSTANDING\nOpenCV • OCR • CV • Extraction"]
        columns 4
        AI1["Preprocess"] AI2["Detect"] AI3["OCR"] AI4["Extract"]
    end
    block:COMP["⚖️ COMPLIANCE INTELLIGENCE\nRule Engine • RAG • Legal Context"]
        columns 4
        CO1["Rules"] CO2["Validate"] CO3["RAG"] CO4["Explain"]
    end
    block:EVDATA["💾 EVIDENCE & DATA\nPostgreSQL • Object Storage • Vector DB"]
        columns 4
        ED1["PostgreSQL"] ED2["Files"] ED3["Vectors"] ED4["Audit"]
    end

    style UX fill:#1a1a2e,stroke:#7c3aed,color:#fff
    style ORCH fill:#1a1a2e,stroke:#e94560,color:#fff
    style AIUND fill:#1a1a2e,stroke:#00bcd4,color:#fff
    style COMP fill:#1a1a2e,stroke:#4caf50,color:#fff
    style EVDATA fill:#1a1a2e,stroke:#ff6b35,color:#fff
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

### Example OCR Output

```json
{
  "text": "MRP ₹50",
  "confidence": 0.96,
  "bbox": [120, 340, 280, 390],
  "field": "mrp"
}
```

### Example Extracted Field

```json
{
  "mrp": {
    "value": 50.0,
    "currency": "INR",
    "confidence": 0.96
  },
  "net_quantity": {
    "value": 100,
    "unit": "g",
    "confidence": 0.94
  },
  "manufacturing_date": {
    "value": "06/2026",
    "confidence": 0.91
  }
}
```

---

## ⚖️ Rule Engine + RAG

Validra separates **compliance decisions** from **language generation**. The Rule Engine makes deterministic decisions; RAG provides legal context and explanations.

```mermaid
flowchart TD
    subgraph INPUT["📥 Input"]
        A["Extracted Product Data"]
    end

    subgraph RULE_ENGINE["⚖️ Rule Engine — Decision Layer"]
        B["Load Applicable Rules"]
        C["Validate Declarations"]
        D{"Compliance Check"}
        E["✅ COMPLIANT"]
        F["❌ NON-COMPLIANT"]
        G["⚠️ NEEDS REVIEW"]
    end

    subgraph RAG_ENGINE["🧠 RAG — Explanation Layer"]
        H["Query Vector DB"]
        I["Retrieve Legal Provisions"]
        J["Generate Explanation"]
        K["Attach Legal References"]
    end

    subgraph OUTPUT["📤 Output"]
        L["Evidence-backed Compliance Finding"]
    end

    A --> B
    B --> C
    C --> D
    D -->|"Pass"| E
    D -->|"Fail"| F
    D -->|"Low Confidence"| G

    E --> H
    F --> H
    G --> H

    H --> I
    I --> J
    J --> K
    K --> L

    style RULE_ENGINE fill:#0d1117,stroke:#4caf50,color:#fff
    style RAG_ENGINE fill:#0d1117,stroke:#7c3aed,color:#fff
```

### Example Conceptual Rule

```json
{
  "rule_id": "LM-PC-001",
  "field": "manufacturer",
  "required": true,
  "validation": "must_exist",
  "severity": "high",
  "legal_reference": "Legal Metrology (PC) Rules, 2011",
  "effective_date": "2011-01-01"
}
```

### Rule Engine Decision States

| State                   | Icon | Meaning                       | When Used                                    |
| ----------------------- | ---- | ----------------------------- | -------------------------------------------- |
| **Compliant**     | ✅   | Declaration passes validation | High confidence, rule satisfied              |
| **Non-Compliant** | ❌   | Violation detected            | Declaration missing/invalid, high confidence |
| **Needs Review**  | ⚠️ | Uncertain result              | Low OCR/extraction confidence                |

---

## 📊 Confidence-Aware Inspection

Validra tracks uncertainty throughout the AI pipeline — this prevents **false certainty** and helps officers focus on ambiguous cases.

```mermaid
flowchart LR
    subgraph STAGE1["Stage 1"]
        A["📝 OCR<br/>Confidence: 96%"]
    end
    subgraph STAGE2["Stage 2"]
        B["📋 Extraction<br/>Confidence: 94%"]
    end
    subgraph STAGE3["Stage 3"]
        C["✅ Validation<br/>Confidence: 99%"]
    end
    subgraph RESULT["Result"]
        D["🎯 Overall<br/>Confidence: 93%"]
    end

    A --> B --> C --> D

    style A fill:#0d3b0d,stroke:#00c853,color:#fff
    style B fill:#0d3b0d,stroke:#00c853,color:#fff
    style C fill:#0d3b0d,stroke:#00c853,color:#fff
    style D fill:#0d3b0d,stroke:#00c853,color:#fff
```

### High vs Low Confidence Examples

<table>
<tr>
<th align="center">✅ High Confidence — Auto Decision</th>
<th align="center">⚠️ Low Confidence — Needs Review</th>
</tr>
<tr>
<td>

---

## 🗃️ Data Model

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

### Core Tables

| Table                  | Purpose                     | Key Relationships               |
| ---------------------- | --------------------------- | ------------------------------- |
| `users`              | Officer/admin accounts      | Creates inspections             |
| `products`           | Product information         | Inspected via inspections       |
| `inspections`        | Core inspection record      | Links all entities              |
| `images`             | Original + processed images | Belong to inspection            |
| `extracted_fields`   | OCR/extraction results      | Per inspection, with confidence |
| `compliance_results` | Overall compliance status   | One per inspection              |
| `violations`         | Individual violations found | References rules                |
| `rules`              | Legal compliance rules      | Referenced by violations        |
| `reports`            | Generated PDF reports       | One per inspection              |
| `audit_logs`         | Who did what, when          | System-wide tracking            |

---

## 🔌 API Overview

<details>
<summary><strong>📡 Click to expand API endpoints</strong></summary>

<br/>

| Method   | Endpoint              | Purpose                           | Auth Required |
| -------- | --------------------- | --------------------------------- | :-----------: |
| `POST` | `/auth/login`       | Authenticate user                 |      ❌      |
| `POST` | `/auth/register`    | Register new user                 |      ❌      |
| `POST` | `/scans`            | Upload product / start inspection |      ✅      |
| `GET`  | `/scans/{id}`       | Get processing status             |      ✅      |
| `GET`  | `/inspections/{id}` | Retrieve full inspection          |      ✅      |
| `GET`  | `/products`         | Search products                   |      ✅      |
| `GET`  | `/violations`       | Retrieve violations               |      ✅      |
| `GET`  | `/dashboard`        | Dashboard statistics              |      ✅      |
| `POST` | `/reports/{id}`     | Generate report                   |      ✅      |
| `GET`  | `/reports/{id}`     | Download/view report              |      ✅      |

### Example: Start Inspection

**Request:**

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

API contracts are versioned and documented through FastAPI/OpenAPI.

</details>

---

## 🧩 Technology Stack

<table>
<tr>
<th>Layer</th>
<th>Technology</th>
<th>Badge</th>
</tr>
<tr>
<td><strong>Frontend</strong></td>
<td>Next.js, TypeScript</td>
<td><img src="https://img.shields.io/badge/Next.js-000?style=flat-square&logo=nextdotjs&logoColor=white"/> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/></td>
</tr>
<tr>
<td><strong>UI</strong></td>
<td>Tailwind CSS, shadcn/ui</td>
<td><img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/> <img src="https://img.shields.io/badge/shadcn/ui-000?style=flat-square&logo=shadcnui&logoColor=white"/></td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>FastAPI, Python</td>
<td><img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white"/> <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white"/></td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>PostgreSQL</td>
<td><img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"/></td>
</tr>
<tr>
<td><strong>Computer Vision</strong></td>
<td>OpenCV</td>
<td><img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white"/></td>
</tr>
<tr>
<td><strong>OCR</strong></td>
<td>PaddleOCR / selected engine</td>
<td><img src="https://img.shields.io/badge/PaddleOCR-0062B0?style=flat-square&logo=paddlepaddle&logoColor=white"/></td>
</tr>
<tr>
<td><strong>ML/NLP</strong></td>
<td>spaCy, scikit-learn</td>
<td><img src="https://img.shields.io/badge/spaCy-09A3D5?style=flat-square&logo=spacy&logoColor=white"/></td>
</tr>
<tr>
<td><strong>RAG</strong></td>
<td>Embeddings + Vector DB</td>
<td><img src="https://img.shields.io/badge/Vector_DB-FF6B35?style=flat-square"/></td>
</tr>
<tr>
<td><strong>LLM</strong></td>
<td>Configurable provider</td>
<td><img src="https://img.shields.io/badge/LLM-7c3aed?style=flat-square"/></td>
</tr>
<tr>
<td><strong>Auth</strong></td>
<td>JWT / configurable</td>
<td><img src="https://img.shields.io/badge/JWT-000?style=flat-square&logo=jsonwebtokens&logoColor=white"/></td>
</tr>
<tr>
<td><strong>Reports</strong></td>
<td>ReportLab</td>
<td><img src="https://img.shields.io/badge/ReportLab-333?style=flat-square"/></td>
</tr>
<tr>
<td><strong>API Protocol</strong></td>
<td>REST / JSON</td>
<td><img src="https://img.shields.io/badge/REST-02569B?style=flat-square"/></td>
</tr>
</table>

> Technology choices may evolve based on accuracy, benchmarks, cost, and deployment constraints.

---

## 📁 Repository Structure

```text
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

<details>
<summary><strong>🔬 Click to expand testing details</strong></summary>

<br/>

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

### Test Cases

| Category                | Test Scenario                                      |
| ----------------------- | -------------------------------------------------- |
| **Image Quality** | Clear, blurred, rotated, low-light images          |
| **Declarations**  | Missing, incorrect, partial declarations           |
| **OCR**           | OCR errors, low-confidence extraction              |
| **Rules**         | Multiple categories, conflicting info              |
| **System**        | API failures, unauthorized access, report failures |

### Evaluation Metrics

| Domain                      | Metrics                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| **OCR / Extraction**  | Character Error Rate, Word Error Rate, Field Accuracy, Precision, Recall, F1 |
| **Computer Vision**   | Detection Precision/Recall, IoU                                              |
| **Compliance Engine** | Rule Accuracy, False Positive/Negative Rate, Violation Classification        |
| **System**            | Avg Processing Time, API Latency, Success Rate, Report Gen Time              |

</details>

---

## 🛡️ Responsible AI & Legal Disclaimer

> [!IMPORTANT]
> Validra is an **AI-assisted inspection and decision-support system**.

The system should:

- ✅ Preserve supporting evidence
- ✅ Display confidence levels
- ✅ Provide applicable rule references
- ✅ Flag uncertain cases for manual review
- ❌ **Never** present low-confidence AI outputs as definitive legal conclusions

> Final legal interpretation and enforcement action should remain with the authorized authority.

---

## 🛠️ Development Roadmap

```mermaid
flowchart LR
    subgraph P1["Phase 1<br/>🏗️ Foundation"]
        P1A["Repo Setup"]
        P1B["Next.js + FastAPI"]
        P1C["PostgreSQL Schema"]
        P1D["Auth + API Contracts"]
    end

    subgraph P2["Phase 2<br/>🔧 Core Pipeline"]
        P2A["Image Upload"]
        P2B["OpenCV + OCR"]
        P2C["Field Extraction"]
        P2D["Initial Rules"]
    end

    subgraph P3["Phase 3<br/>🧠 Intelligence"]
        P3A["Rule Repository"]
        P3B["Confidence Propagation"]
        P3C["Evidence Localization"]
        P3D["Violation Classification"]
    end

    subgraph P4["Phase 4<br/>📚 RAG"]
        P4A["Legal Doc Ingestion"]
        P4B["Embeddings + Vector"]
        P4C["Retrieval"]
        P4D["Explanation Generation"]
    end

    subgraph P5["Phase 5<br/>🚀 Productization"]
        P5A["Dashboard"]
        P5B["Reports"]
        P5C["RBAC"]
        P5D["Audit Logs"]
    end

    subgraph P6["Phase 6<br/>✅ Validation"]
        P6A["Benchmarking"]
        P6B["E2E Testing"]
        P6C["Security"]
        P6D["Deployment"]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6

    style P1 fill:#0d1117,stroke:#58a6ff,color:#fff
    style P2 fill:#0d1117,stroke:#00bcd4,color:#fff
    style P3 fill:#0d1117,stroke:#ff9800,color:#fff
    style P4 fill:#0d1117,stroke:#7c3aed,color:#fff
    style P5 fill:#0d1117,stroke:#e94560,color:#fff
    style P6 fill:#0d1117,stroke:#00c853,color:#fff
```

### Detailed Phase Checklist

<details>
<summary><strong>Phase 1 — Foundation</strong></summary>

- [ ] Repository setup
- [ ] Next.js frontend skeleton
- [ ] FastAPI backend skeleton
- [ ] PostgreSQL schema design
- [ ] Authentication system
- [ ] API contracts definition

</details>

<details>
<summary><strong>Phase 2 — Core AI Pipeline</strong></summary>

- [ ] Image upload endpoint
- [ ] OpenCV preprocessing
- [ ] OCR integration
- [ ] Bounding-box extraction
- [ ] Mandatory-field extraction
- [ ] Initial compliance rules (3–5)

</details>

<details>
<summary><strong>Phase 3 — Compliance Intelligence</strong></summary>

- [ ] Rule repository
- [ ] Rule evaluator
- [ ] Violation classification
- [ ] Confidence propagation
- [ ] Evidence localization

</details>

<details>
<summary><strong>Phase 4 — RAG</strong></summary>

- [ ] Legal document ingestion
- [ ] Chunking strategy
- [ ] Embeddings generation
- [ ] Vector search
- [ ] Relevant-rule retrieval
- [ ] Explanation generation

</details>

<details>
<summary><strong>Phase 5 — Productization</strong></summary>

- [ ] Enforcement dashboard
- [ ] Inspection history
- [ ] PDF reports
- [ ] Search and filtering
- [ ] Role-based access
- [ ] Audit logs

</details>

<details>
<summary><strong>Phase 6 — Validation & Deployment</strong></summary>

- [ ] Dataset creation
- [ ] Model benchmarking
- [ ] End-to-end testing
- [ ] Security testing
- [ ] Performance optimization
- [ ] Deployment
- [ ] Documentation
- [ ] SIH demonstration

</details>

---

## 👥 Team Domains

<details>
<summary><strong>👨‍💻 Click to expand team structure</strong></summary>

<br/>

```mermaid
flowchart TD
    V["🛡️ VALIDRA"]

    V --> UI["🎨 M1<br/>Frontend"]
    V --> API["⚙️ M2<br/>Backend + Infra"]
    V --> CVT["👁️ M3<br/>Computer Vision"]
    V --> RET["⚖️ M4<br/>Rule Engine"]
    V --> RAGT["🧠 M5<br/>RAG + AI"]
    V --> QAT["🔬 M6<br/>Research + QA"]

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

| Domain                                 | Responsibility                                               |
| -------------------------------------- | ------------------------------------------------------------ |
| 🎨**Frontend**                   | Next.js, UI/UX, dashboard, scanning workflow                 |
| ⚙️**Backend & Infrastructure** | FastAPI, APIs, DB, Auth, storage, deployment                 |
| 👁️**Computer Vision**          | OpenCV, OCR, detection, readability analysis                 |
| ⚖️**Rule Engine**              | Legal rules, validation, violations, compliance scoring      |
| 🧠**RAG & AI**                   | Legal retrieval, embeddings, LLM integration                 |
| 🔬**Research & QA**              | Legal research, datasets, evaluation, testing, documentation |

All members contribute to integration, debugging, and final system validation.

</details>

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

### PR Guidelines

Before opening a pull request:

- ✅ Keep changes focused and small
- ✅ Test locally before pushing
- ✅ Update documentation when required
- ❌ Never commit secrets or `.env` files
- ✅ Add/update tests for important functionality
- ✅ Explain what changed and why in the PR description

---

## 🚀 Getting Started

### Prerequisites

| Tool       | Version | Purpose          |
| ---------- | ------- | ---------------- |
| Git        | Latest  | Version control  |
| Node.js    | 18+ LTS | Frontend runtime |
| Python     | 3.10+   | Backend + AI     |
| PostgreSQL | 15+     | Database         |

> 📖 **New to development?** Check our [Base Setup Guide](./docs/base_setup.mdx) for step-by-step installation instructions starting from scratch!

### Clone

```bash
git clone https://github.com/dhruvpatel16120/Validra.git
cd validra
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

> [!WARNING]
> Create your local `.env` from `.env.example`. **Never commit** API keys, passwords, or private credentials.

---

## 📖 Interactive Documentation

Validra uses **MDX** (Markdown + JSX) for interactive, component-rich documentation with embedded **Mermaid diagrams** for visual system explanations.

| Document                                        | Description                                                          |     Status     |
| ----------------------------------------------- | -------------------------------------------------------------------- | :------------: |
| [`docs/base_setup.mdx`](./docs/base_setup.mdx) | 🟢 Base environment setup guide (Git, IDE, Node, Python, PostgreSQL) |  ✅ Available  |
| `docs/frontend_setup.mdx`                     | 🔵 Frontend development environment setup                            | 🔜 Coming Soon |
| `docs/backend_setup.mdx`                      | 🟣 Backend development environment setup                             | 🔜 Coming Soon |
| `docs/architecture.md`                        | System architecture deep-dive                                        |   🔜 Planned   |
| `docs/api.md`                                 | API documentation                                                    |   🔜 Planned   |
| `docs/database.md`                            | Database schema & migrations                                         |   🔜 Planned   |
| `docs/cv-pipeline.md`                         | CV/OCR pipeline documentation                                        |   🔜 Planned   |
| `docs/rule-engine.md`                         | Rule engine documentation                                            |   🔜 Planned   |
| `docs/rag.md`                                 | RAG pipeline documentation                                           |   🔜 Planned   |
| `docs/testing.md`                             | Testing strategy & guidelines                                        |   🔜 Planned   |

### Why MDX + Mermaid?

- 📊 **Mermaid Diagrams** — Flowcharts, sequence diagrams, ER diagrams, and more rendered directly in documentation
- ⚛️ **MDX Components** — Interactive callouts, tabs, steps, and code blocks
- 🔄 **Version Controlled** — Documentation lives with the code
- 🎨 **Beautiful Rendering** — Rich formatting with syntax highlighting

---

## 🏆 Smart India Hackathon 2026

<table>
<tr>
<td><strong>Problem Statement</strong></td>
<td>26034</td>
</tr>
<tr>
<td><strong>Organization</strong></td>
<td>Ministry of Consumer Affairs, Food & Public Distribution</td>
</tr>
<tr>
<td><strong>Department</strong></td>
<td>Department of Consumer Affairs (DoCA)</td>
</tr>
<tr>
<td><strong>Category</strong></td>
<td>Software</td>
</tr>
<tr>
<td><strong>Theme</strong></td>
<td>Miscellaneous</td>
</tr>
<tr>
<td><strong>Project</strong></td>
<td><strong>Validra — Intelligent Product Compliance</strong></td>
</tr>
</table>

---

## 📌 Status

<div align="center">

---

## 📄 License

License to be finalized by the project team based on Smart India Hackathon submission requirements and future project plans.

---

<div align="center">
