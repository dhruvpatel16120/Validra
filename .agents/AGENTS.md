# Validra — Workspace Agent Rules & Guidelines

> ⭐ **Top Constraint**: You are an implementation agent, not an autonomous architect. Preserve the existing Validra architecture and team boundaries. When a task requires cross-module or architectural changes, explain the dependency and request/record coordination before modifying unrelated modules.

---

## Part 1: Token Usage & Implementation Efficiency

### 1. Core Objective

Optimize token usage for implementation quality.
**Priority**:

1. Secure, correct, production-quality code
2. Passing tests
3. Correct architecture and module ownership
4. Efficient token usage
5. Concise communication

Use tokens primarily for understanding implementation, writing code, testing, debugging, and security validation. Do NOT waste tokens on unnecessary conversation, explanations, walkthroughs, or repeated context.

### 2. Communication Rules

- **Greeting**: Use minimum tokens (e.g., `Starting implementation.` or `Understood. Implementing.`).
- **Completion**: Short summary only (What changed, test results, important issues). Avoid step-by-step walkthroughs, repeating requirements, or generic conclusions.

### 3. Token Allocation Budget

- **High allocation**: Code implementation, debugging, test generation, security validation, architecture validation, error investigation.
- **Minimize allocation**: Greetings, status messages, task completion verbosity, repeating existing docs/requirements, unnecessary codebase/browser exploration.

### 4. No Unnecessary Conversation

Communicate ONLY when:

- A decision is required
- A blocking issue exists
- A cross-module dependency exists
- Security risk exists
- Architecture conflict exists
- Implementation is complete

### 5. Implementation-First Workflow

Default workflow:

1. Understand task
2. Locate relevant files
3. Read only required code/context
4. Plan implementation for large task only and avoid for small task or changes
5. Create/update `implementation.md` (or workspace plan)
6. Implement code
7. Test
8. Fix failures & re-test
9. Update required documentation
10. Give concise completion response

### 6. Browser Interaction

DO NOT use browser interaction for normal development tasks unless explicitly requested by the user. Use editor, terminal, repo files, tests, build tools, linters, and type checkers instead.

### 7. Codebase Search Efficiency & Line Mapping

- Search only what is required for the current task.
- Check `.agent/mapping.md` first to locate target modules/files and it's line number.
- Use line-range inspection (read only required line ranges of large files).
- Prefer smart Windows CMD commands (`findstr /S /N /I "symbol" *.py *.ts *.tsx`).

### 8. Documentation Efficiency & Living Docs

Living documentation hierarchy:
`PRD.md` → `Architecture.md` → `Design.md` → `Rules.md` → `Team_Role.md` → `mapping.md` → Implementation → `README.md` / `memory.md`

- Read only relevant documentation sections for the active task.
- Update documentation only when implementation changes alter assumptions, APIs, or design. Do not rewrite entire documents—update affected sections.

### 9. Explanation Requests

Do NOT provide explanations in chat unless explicitly requested. If requested, write the explanation to `temp/explaination.md` and reply concisely: `temp/explaination.md created.`

### 10. Security & Testing Priorities

- Token efficiency must NEVER reduce security or skip testing.
- Always validate Auth, JWT, RBAC, input validation, SQLi/XSS prevention, and secrets handling.
- Mandatory test cycle: Code → Test → Fix → Re-test. Never claim success without runtime/test validation.

---

## Part 2: Validra Technical & Architectural Rules

### 11. Project Understanding & Architecture Preservation

- Read `README.md` and `docs/Architecture.md` before making architectural or cross-module changes.
- when user request for pr template or github related work check .github and give document or file in temp folder and give short summary only in chat.
- Treat the System Design & Architecture section of `README.md` as the high-level architecture.

### 12. Modular Directory Architecture

Follow a directory-based modular structure:

```text
module/
├── components/
├── services/
├── schemas/
├── utils/
├── types/
└── tests/
```

Keep files small, focused, and follow the Single Responsibility Principle without over-engineering simple features. ensure API can handle all test cases and runtime error without fail

### 13. Team Module Ownership (M1–M6) — VERY IMPORTANT

Every task, issue, and code change belongs to a specific team domain owner as defined in `docs/WORKFLOW_GUIDE.md`:

- **M1** → 🎨 **Frontend & Presentation** (Next.js, UI/UX, Scanning interface, Enforcement Dashboard, Reports UI, Evidence viewer) [`frontend`]
- **M2** → ⚙️ **Backend & Infrastructure** (FastAPI, REST APIs, PostgreSQL, Auth/JWT, RBAC, Object Storage, Task orchestration) [`backend` / `db`]
- **M3** → 👁️ **Computer Vision & OCR** (OpenCV preprocessing, OCR engine, Text detection, Bounding boxes, Readability analysis) [`cv`]
- **M4** → ⚖️ **Rule Engine** (Legal Metrology rule formalization, Validation logic, Violation severity, Rule repository) [`rule-engine`]
- **M5** → 🧠 **RAG & AI** (Legal document ingestion, Vector embeddings, Context retrieval, LLM explanations) [`rag`]
- **M6** → 🔬 **Research & QA** (Datasets, Model benchmarking, Rule validation testing, E2E testing, SIH docs) [`qa` / `research`]

**Hard Rule**: Only modify files belonging to your assigned domain. Do NOT refactor another team's module, alter shared APIs without coordination, or modify database schemas while working on an unrelated feature.
If a cross-module change is genuinely required: STOP → Explain dependency → Identify affected modules → Record coordination in `implementation.md` → Make minimum required change.

### 14. Next.js Rules (M1)

- Component-based architecture with reusable UI components.
- Prefer Server Components by default; use Client Components (`"use client"`) only where client interactivity is required.
- Minimize client JS bundle size, avoid redundant API calls, keep pages thin.

### 15. Library Selection

Check existing project dependencies before adding new ones. Prefer established, maintained libraries that solve the exact problem. Avoid adding dependencies for trivial tasks or duplicating library functionality.

### 16. Computer Vision & AI Rules (M3)

- Preserve structured outputs, explicit schemas, and confidence scores.
- Preserve spatial bounding-box information for evidence localization.
- Separate preprocessing, OCR, extraction, and validation into distinct pipeline stages.
- AI assists extraction; deterministic rules evaluate compliance.

### 17. Rule Engine Rules (M4)

- Deterministic, explainable, and versioned compliance evaluation.
- Never let an LLM directly determine the final legal compliance decision.
- Standard rule fields: `rule_id`, `version`, `condition`, `applicable_category`, `validation_logic`, `severity`, `legal_reference`, `effective_date`.

### 18. RAG & Legal Intelligence Rules (M5)

- Ingest authoritative legal sources (Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011).
- Preserve source metadata and return exact section citations.
- RAG provides explanation and citations; it never overrides the deterministic Rule Engine.

### 19. Security Rules 🔐

- Next.js handles Auth (NextAuth/Auth.js + Nodemailer), generating JWT tokens.
- FastAPI backend independently verifies JWT signature + expiry + RBAC for EVERY protected endpoint (OCR, Rule Engine, RAG). Never trust frontend authorization alone.
- Never commit hardcoded secrets, API keys, or `.env` files.

### 20. Database & API Rules (M2)

- API contracts must have clear endpoints, Pydantic/Zod request/response schemas, validation, and error handling.
- Use migrations for database schema changes. Avoid N+1 queries, use proper indexes, keep DB logic out of the frontend.

### 21. Error Handling & NEEDS_REVIEW Fallback

- Never fail silently. When OCR or extraction yields low confidence or partial failure, log the controlled error and set inspection status to `NEEDS_REVIEW` for manual inspector review.

### 22. Git, PR & Final Checklist

- Feature branches (`feature/domain-name`).
- Focused commits with test evidence attached.
- Before completion, verify:
  - [ ] Correct team domain ownership respected
  - [ ] Architecture and security guidelines followed
  - [ ] Tests executed and passed
  - [ ] Relevant living docs (`PRD.md`, `Architecture.md`, `memory.md`) updated if required
