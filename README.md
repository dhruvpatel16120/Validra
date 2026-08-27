# Validra

> **Intelligent Packaged Commodity Compliance & Inspection Platform**

Validra is an AI-assisted compliance checking system designed to help
inspect packaged commodities against applicable requirements under
India\'s **Legal Metrology Act, 2009** and **Legal Metrology (Packaged
Commodities) Rules, 2011**.

The platform analyzes product/package images and product information,
extracts mandatory declarations, evaluates them through a rule-based
compliance engine, retrieves relevant legal context using RAG, and
generates evidence-backed compliance reports.

**Smart India Hackathon 2026 --- Problem Statement ID: 26034**

------------------------------------------------------------------------

## 🎯 Problem 

Packaged commodities sold through retail stores, supermarkets, and
e-commerce platforms are expected to carry prescribed declarations such
as manufacturer/packer/importer details, net quantity, MRP, date-related
information, consumer-care details, and other applicable declarations.

Manual inspection across a large and diverse product ecosystem is
time-consuming and resource-intensive. Validra aims to assist
enforcement personnel by automating the initial inspection, extraction,
validation, evidence collection, and reporting workflow.

------------------------------------------------------------------------

## 💡 Solution

Validra follows an evidence-first pipeline:

``` text
Product Image / Product Information
                ↓
       Image Preprocessing
                ↓
          OCR + Computer Vision
                ↓
       Information Extraction
                ↓
       Compliance Rule Engine
                ↓
       ┌────────┴────────┐
       ↓                 ↓
   COMPLIANT          VIOLATION
       └────────┬────────┘
                ↓
       Evidence + Legal Context
                ↓
        Compliance Report
                ↓
       Database / Inspection History
                ↓
        Enforcement Dashboard
```

### Core Principle

**AI extracts and assists → Rules evaluate → RAG explains and references
→ Human reviews uncertain cases.**

Validra is a decision-support system, not a replacement for authorized
legal or enforcement judgment. AI/CV outputs are accompanied by
confidence information, and uncertain cases can be routed for manual
review.

------------------------------------------------------------------------

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

------------------------------------------------------------------------

## 🏗️ System Architecture 

``` text
                         VALIDRA
                            │
                       User / Officer
                            │
                            ▼
              ┌──────────────────────────┐
              │ Next.js Frontend         │
              │ Scan • Results • Dashboard│
              │ History • Reports • Admin │
              └────────────┬─────────────┘
                           │ REST / JSON
                           ▼
              ┌──────────────────────────┐
              │ FastAPI Backend          │
              │ Auth • APIs • Orchestration│
              │ Storage • Reports • DB   │
              └──────┬────────┬──────────┘
                     │        │
          ┌──────────┘        └───────────┐
          ▼                               ▼
 ┌──────────────────┐             ┌──────────────────┐
 │ CV / OCR         │             │ RAG / AI         │
 │ OpenCV           │             │ Legal Documents  │
 │ OCR              │             │ Embeddings       │
 │ Detection        │             │ Retrieval        │
 │ Bounding Boxes   │             │ Explanation      │
 │ Readability      │             │ References       │
 └────────┬─────────┘             └────────┬─────────┘
          │                                │
          └──────────────┬─────────────────┘
                         ▼
                ┌──────────────────┐
                │ Rule Engine      │
                │ Required?        │
                │ Correct?         │
                │ Readable?        │
                │ Format?          │
                │ Placement?       │
                └────────┬─────────┘
                         ▼
                Compliance Result
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Compliant      Violation     Needs Review
          └──────────────┬──────────────┘
                         ▼
                  Evidence + Report
                         │
                         ▼
            PostgreSQL + Object Storage
                         │
                         ▼
                Enforcement Dashboard
```

------------------------------------------------------------------------

## 🧩 Technology Stack

  Layer             Technology
  ----------------- ---------------------------------------------
  Frontend          Next.js, TypeScript
  UI                Tailwind CSS, shadcn/ui
  Backend           FastAPI, Python
  Database          PostgreSQL
  Computer Vision   OpenCV
  OCR               PaddleOCR / selected OCR engine
  ML/NLP            Python, spaCy/scikit-learn where applicable
  RAG               Embeddings + Vector Database
  LLM               Configurable provider
  Authentication    JWT / configurable auth provider
  Object Storage    Configurable object storage
  Reports           ReportLab
  API               REST / JSON

Technology choices may evolve based on accuracy, benchmarks, cost, and
deployment constraints.

------------------------------------------------------------------------

## 📁 Repository Structure 

``` text
validra/
│
├── frontend/                 # Next.js application
├── backend/                  # FastAPI application
├── cv/                       # Computer Vision & OCR
├── rule-engine/              # Compliance rule system
├── rag/                      # Legal RAG pipeline
├── research/                 # Legal research, datasets, benchmarks
├── tests/                    # Unit, integration & E2E tests
├── docs/                     # Architecture and technical documentation
├── .env.example
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## 🔄 Processing Pipeline

``` text
Image
  ↓
OpenCV Preprocessing
  ↓
Text Detection + OCR
  ↓
Text + Bounding Boxes
  ↓
Information Extraction
  ↓
Structured Product Data
  ↓
Applicable Compliance Rules
  ↓
Rule Evaluation
  ↓
Compliant / Non-Compliant / Needs Review
  ↓
Evidence + Legal Context
  ↓
Report + Database
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

------------------------------------------------------------------------

## 🧠 Rule Engine + RAG 

Validra separates **compliance decisions** from **language generation**.

``` text
Extracted Data
      ↓
Rule Engine
      ↓
Compliance Finding
      ↓
Relevant Legal Context
      ↓
RAG Retrieval
      ↓
Human-readable Explanation
```

The rule engine provides deterministic validation wherever requirements
can be expressed as rules. RAG retrieves supporting regulatory context
and helps explain findings; it should not independently make the final
legal decision.

------------------------------------------------------------------------

## 📊 Confidence-Aware Inspection 

Validra tracks uncertainty throughout the AI pipeline.

``` text
OCR Confidence
      ↓
Extraction Confidence
      ↓
Validation Confidence
      ↓
Overall Finding Confidence
```

Example:

``` text
Manufacturer declaration
OCR confidence        : 48%
Extraction confidence : 42%

Result: ⚠️ NEEDS REVIEW
```

This reduces false certainty and helps officers focus on ambiguous
cases.

------------------------------------------------------------------------

## 🗃️ Core Data Model 

``` text
USER
 │
 └──< INSPECTION
          │
          ├── PRODUCT
          ├── IMAGE
          ├── EXTRACTED_FIELD
          ├── COMPLIANCE_RESULT
          ├── VIOLATION
          │      └── RULE
          └── REPORT
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

------------------------------------------------------------------------

## 🔌 API Overview 

  Method   Endpoint              Purpose
  -------- --------------------- -------------------------
  POST     `/auth/login`         Authenticate user
  POST     `/scans`              Upload/start inspection
  GET      `/scans/{id}`         Get processing status
  GET      `/inspections/{id}`   Retrieve inspection
  GET      `/products`           Search products
  GET      `/violations`         Retrieve violations
  GET      `/dashboard`          Dashboard statistics
  POST     `/reports/{id}`       Generate report
  GET      `/reports/{id}`       Retrieve report

API contracts should be versioned and documented through
FastAPI/OpenAPI.

------------------------------------------------------------------------

## 🧪 Testing Strategy 

``` text
Unit Testing
     ↓
Integration Testing
     ↓
OCR / Model Evaluation
     ↓
Rule Validation Testing
     ↓
API Testing
     ↓
End-to-End Testing
     ↓
User Acceptance Testing
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

**OCR / Extraction**

-   Character/Word Error Rate
-   Field extraction accuracy
-   Precision, Recall, F1-score

**Computer Vision**

-   Detection precision/recall
-   IoU where applicable

**Compliance Engine**

-   Rule validation accuracy
-   False-positive rate
-   False-negative rate
-   Violation classification accuracy

**System**

-   Average processing time
-   API latency
-   Successful processing rate
-   Report generation time

------------------------------------------------------------------------

## 🛡️ Responsible AI & Legal Disclaimer 

Validra is an **AI-assisted inspection and decision-support system**.

The system should:

-   Preserve supporting evidence.
-   Display confidence levels.
-   Provide applicable rule references.
-   Flag uncertain cases for manual review.
-   Avoid presenting low-confidence AI outputs as definitive legal
    conclusions.

Final legal interpretation and enforcement action should remain with the
authorized authority.

------------------------------------------------------------------------

## 🛠️ Development Roadmap 

### Phase 1 --- Foundation {#phase-1--foundation}

-   [ ] Repository setup
-   [ ] Next.js frontend
-   [ ] FastAPI backend
-   [ ] PostgreSQL schema
-   [ ] Authentication
-   [ ] API contracts

### Phase 2 --- Core AI Pipeline {#phase-2--core-ai-pipeline}

-   [ ] Image upload
-   [ ] OpenCV preprocessing
-   [ ] OCR integration
-   [ ] Bounding-box extraction
-   [ ] Mandatory-field extraction
-   [ ] Initial compliance rules

### Phase 3 --- Compliance Intelligence {#phase-3--compliance-intelligence}

-   [ ] Rule repository
-   [ ] Rule evaluator
-   [ ] Violation classification
-   [ ] Confidence propagation
-   [ ] Evidence localization

### Phase 4 --- RAG {#phase-4--rag}

-   [ ] Legal document ingestion
-   [ ] Chunking
-   [ ] Embeddings
-   [ ] Vector search
-   [ ] Relevant-rule retrieval
-   [ ] Explanation generation

### Phase 5 --- Productization {#phase-5--productization}

-   [ ] Enforcement dashboard
-   [ ] Inspection history
-   [ ] PDF reports
-   [ ] Search and filtering
-   [ ] Role-based access
-   [ ] Audit logs

### Phase 6 --- Validation & Deployment {#phase-6--validation--deployment}

-   [ ] Dataset creation
-   [ ] Model benchmarking
-   [ ] End-to-end testing
-   [ ] Security testing
-   [ ] Performance optimization
-   [ ] Deployment
-   [ ] Documentation
-   [ ] SIH demonstration

------------------------------------------------------------------------

## 👥 Team Domains 

  Domain                        Responsibility
  ----------------------------- --------------------------------------------------------------
  🎨 Frontend                   Next.js, UI/UX, dashboard, scanning workflow
  ⚙️ Backend & Infrastructure   FastAPI, APIs, DB, Auth, storage, deployment
  👁️ Computer Vision            OpenCV, OCR, detection, readability analysis
  ⚖️ Rule Engine                Legal rules, validation, violations, compliance scoring
  🧠 RAG & AI                   Legal retrieval, embeddings, LLM integration
  🔬 Research & QA              Legal research, datasets, evaluation, testing, documentation

All members contribute to integration, debugging, and final system
validation.

------------------------------------------------------------------------

## 🤝 Contribution Workflow 

Recommended Git workflow:

``` text
main
 │
 └── develop
       │
       ├── feature/frontend-*
       ├── feature/backend-*
       ├── feature/cv-*
       ├── feature/rule-engine-*
       ├── feature/rag-*
       └── feature/qa-*
```

Before opening a pull request:

-   Keep changes focused.
-   Test locally.
-   Update documentation when required.
-   Never commit secrets or `.env` files.
-   Add/update tests for important functionality.
-   Explain what changed and why.

------------------------------------------------------------------------

## 🚀 Getting Started 

### Prerequisites

-   Node.js
-   Python
-   PostgreSQL
-   Git
-   Required OCR/CV dependencies

### Clone

``` bash
git clone 
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
.venv\Scriptsctivate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create your local `.env` from `.env.example`. Never commit API keys,
passwords, or private credentials.

------------------------------------------------------------------------

## 📚 Documentation 

Detailed technical documentation should live under `/docs`:

``` text
docs/
├── architecture.md
├── api.md
├── database.md
├── cv-pipeline.md
├── rule-engine.md
├── rag.md
├── testing.md
└── deployment.md
```

------------------------------------------------------------------------

## 🏆 Smart India Hackathon 2026

**Problem Statement:** 26034\
**Organization:** Ministry of Consumer Affairs, Food & Public
Distribution\
**Department:** Department of Consumer Affairs (DoCA)\
**Category:** Software\
**Theme:** Miscellaneous\
**Project:** Validra

> **Validra --- Intelligent Product Compliance.**

------------------------------------------------------------------------

## 📌 Status 

🚧 **Active Development**

The architecture and module boundaries are being established. Model
selection, rule coverage, datasets, and implementation details will be
validated experimentally during development.

------------------------------------------------------------------------

## 📄 License 

License to be finalized by the project team based on Smart India
Hackathon submission requirements and future project plans.
