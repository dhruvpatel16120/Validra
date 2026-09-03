# Validra — Workspace Rules & Coding Standards

This document summarizes the workspace coding standards, domain boundaries, token efficiency constraints, and safety guidelines for human developers and AI agents working on Validra.

---

## 1. Living Documentation Priority

Every team member and AI agent must consult documentation before implementation:

```text
PRD.md
   ↓
Architecture.md
   ↓
Design.md
   ↓
Rules.md / Team_Role.md
   ↓
mapping.md
   ↓
Implementation
   ↓
README.md / memory.md updated
```

Documentation must stay synchronized with actual codebase implementations.

---

## 2. Team Domain Boundaries (M1 to M6)

| Domain                                 | Scope                                                                               | Path Boundaries           | GitHub Tag            |
| :------------------------------------- | :---------------------------------------------------------------------------------- | :------------------------ | :-------------------- |
| **M1: Frontend & Presentation**  | Next.js, UI/UX, Scanning UI, Enforcement Dashboard, Reports UI, Evidence Viewer     | `frontend/`             | `frontend`          |
| **M2: Backend & Infrastructure** | FastAPI, REST APIs, PostgreSQL, Auth/JWT, RBAC, Object Storage, Task Orchestration  | `backend/`              | `backend` / `db`  |
| **M3: Computer Vision & OCR**    | OpenCV Preprocessing, Text Detection, OCR Engine, Bounding Boxes, Readability       | `cv/`                   | `cv`                |
| **M4: Rule Engine**              | Legal Metrology Rule Formalization, Validation Logic, Violation Severity, Rule Repo | `rule-engine/`          | `rule-engine`       |
| **M5: RAG & AI**                 | Legal Document Ingestion, Vector Embeddings, Context Retrieval, LLM Explanations    | `rag/`                  | `rag`               |
| **M6: Research & QA**            | Datasets, Model Benchmarking, Rule Validation Testing, E2E Testing, SIH Docs        | `research/`, `tests/` | `qa` / `research` |

**Hard Rule**: Never edit code in another team domain without recording cross-module coordination in `implementation.md`.

---

## 3. Token Efficiency & Communication Rules

1. **Concise Communication**: Keep chat responses minimal (`Starting implementation.` / `Implemented and tested.`).
2. **Line-Range Inspection**: Read only the line ranges needed; do not dump huge files into model context.
3. **No Browser Walkthroughs**: Use terminal, linters, typecheckers, and test suites for verification.
4. **`mapping.md` First**: Use `docs/mapping.md` to locate target files directly before performing broad directory searches.
5. **No Unnecessary Explanations**: Write requested explanations to `temp/explaination.md`.

---

## 4. Security & Quality Checklist

Before completing any implementation task:

- [ ] Next.js Auth issues JWT; FastAPI Auth Middleware verifies JWT on every protected endpoint.
- [ ] No hardcoded API keys, passwords, or secrets.
- [ ] Unit & integration tests added/updated and passing.
- [ ] Low OCR confidence routes to `NEEDS_REVIEW` state.
- [ ] Living documentation (`README.md`, `memory.md`) updated if architecture or APIs changed.
