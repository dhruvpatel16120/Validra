<!-- 
  Validra Pull Request Template
  Follow the title convention: [TYPE][DOMAIN] Short description
  Examples: 
    [FE][M1] Add camera upload UI to scan page
    [BE][M2] Add POST /scans endpoint and task orchestration
    [CV][M3] Integrate PaddleOCR and bounding box extraction
    [RE][M4] Implement manufacturer declaration validation rule
    [RAG][M5] Add legal vector embedding retrieval service
    [QA][M6] Add end-to-end integration tests for inspection flow
    [DB][M2] Migration for compliance_results table
-->

## 📌 PR Summary

<!-- Provide a high-level summary of what this PR does and why it is needed. -->

---

## 🏷️ Type of Change

Select all that apply:

- [ ] 🎨 **Frontend (`frontend`)** — UI/UX, Next.js, components, state management
- [ ] ⚙️ **Backend (`backend`)** — FastAPI, API routes, services, middleware
- [ ] 🐘 **Database (`db`)** — PostgreSQL schema, migrations, models, queries
- [ ] 👁️ **Computer Vision & OCR (`cv`)** — OpenCV preprocessing, OCR engine, bounding boxes
- [ ] ⚖️ **Rule Engine (`rule-engine`)** — Legal Metrology rules, validation logic, severity
- [ ] 🧠 **RAG & AI (`rag`)** — Vector search, legal document embeddings, LLM explanations
- [ ] 🔬 **Research & QA (`qa`)** — Benchmarks, test suites, datasets, documentation
- [ ] 🛠️ **DevOps & Infra (`infra`)** — Environment setup, Docker, CI/CD pipelines, config

---

## 👥 Primary Team Domain Ownership (M1–M6)

Select the primary team domain responsible for this change:

- [ ] **M1 — Frontend & Presentation** (UI/UX, Scanning, Dashboard, Reports UI)
- [ ] **M2 — Backend & Infrastructure** (FastAPI, APIs, Auth/JWT, RBAC, DB, Storage)
- [ ] **M3 — Computer Vision** (OpenCV, OCR, Detection, Readability, Bboxes)
- [ ] **M4 — Rule Engine** (Legal Metrology Rules, Validation, Violation Classification)
- [ ] **M5 — RAG & AI** (Embeddings, Vector Search, Legal Context, LLM Explanations)
- [ ] **M6 — Research & QA** (Datasets, Model Benchmarking, Testing, SIH Documentation)

---

## 🔗 Related Issues

<!-- Link the GitHub issue(s) resolved or impacted by this PR -->
- Closes #
- Fixes #
- Related to #

---

## 🏗️ Architecture Layer Impacted

Check the layer(s) modified in this PR:

```
┌───────────────────────────────────────────┐
│ [ ] USER EXPERIENCE (Next.js)             │
├───────────────────────────────────────────┤
│ [ ] ORCHESTRATION (FastAPI & Auth)        │
├───────────────────────────────────────────┤
│ [ ] AI UNDERSTANDING (CV & OCR)           │
├───────────────────────────────────────────┤
│ [ ] COMPLIANCE INTELLIGENCE (Rules & RAG) │
├───────────────────────────────────────────┤
│ [ ] EVIDENCE & DATA (PostgreSQL & Storage)│
└───────────────────────────────────────────┘
```

---

## 📝 Detailed Changes

<!-- Bullet points describing key code additions, refactorings, or updates -->
- 
- 
- 

---

## 🧪 QA & Verification Checklist

### Automated Testing
- [ ] Unit tests added/updated (`pytest` / `npm test`)
- [ ] All existing automated tests pass locally
- [ ] API endpoints verified with OpenAPI / Swagger UI

### Manual Verification & Visual Evidence
- [ ] Verified locally on desktop/mobile viewport
- [ ] Attached screenshot, API JSON response, or screen recording below

<!-- Paste screenshots, terminal output, or JSON responses here -->
<details>
<summary>📸 Visual Evidence / Test Output (Click to expand)</summary>

```json
// Paste API Response JSON or test logs here
```

</details>

### Edge Case & Security Check
- [ ] Handled low OCR confidence / uncertain cases (`NEEDS REVIEW` state)
- [ ] Error handling & non-200 HTTP responses tested
- [ ] No hardcoded passwords, private keys, or API tokens committed (`.env` safe)

---

## 🚨 Breaking Changes

- [ ] **No** — Backward compatible
- [ ] **Yes** — Description of breaking change & migration steps required:

---

## 💬 Additional Notes / Reviewer Guidance

<!-- Anything specific the reviewer should test or focus on during code review -->
