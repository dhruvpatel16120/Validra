# Validra — Project Memory & Decision Log

This document records major architectural decisions, technical conventions, solved problems, and project milestones across all module domains (M1–M6).

---

## Architectural Decision Records (ADR)

### ADR 001: Next.js Auth with Backend FastAPI JWT Validation
- **Date**: 2026-09-03
- **Decision**: Next.js owns authentication (NextAuth/Auth.js + Nodemailer for email verification), generating JWT access tokens. FastAPI backend independently verifies JWT signature, expiration, and user role for every protected endpoint.
- **Rationale**: Keeps authentication UX seamless on Next.js while ensuring FastAPI independently enforces backend authorization without trusting client-side claims.
- **Status**: Accepted & Enforced.

### ADR 002: Human-in-the-Loop "Review Inspection" Workflow
- **Date**: 2026-09-03
- **Decision**: Validra operates as a decision-support system. All AI findings (especially low-confidence or ambiguous OCR extractions) route to a dedicated **Review Inspection** page before generating final reports.
- **Rationale**: Validra assists enforcement personnel; final legal decisions rest with human officers.
- **Status**: Accepted & Enforced.

### ADR 003: Strict Team Domain Isolation (M1–M6) for AI Agents
- **Date**: 2026-09-03
- **Decision**: AI implementation agents must strictly work within their assigned domain files (M1: Frontend, M2: Backend, M3: DB/Auth, M4: CV/OCR, M5: Rule Engine, M6: RAG). Cross-module changes require explicit dependency documentation.
- **Rationale**: Prevents AI-agent-driven codebase drift during parallel development across a six-member team.
- **Status**: Enforced in `.agents/AGENTS.md`.

---

## Solved Problems & Lessons Learned

- **Problem**: Potential token exhaustion during AI agent development runs.
  - **Solution**: Implemented 29 token-usage & communication efficiency rules in `.agents/AGENTS.md` and created `docs/mapping.md` for fast line-range inspection and targeted file navigation.

---

## Log of Key Changes

| Date | Component | Description |
|:-----|:----------|:------------|
| 2026-09-03 | Workspace Rules | Created `.agents/AGENTS.md` with 20 Validra rules + 29 token efficiency rules |
| 2026-09-03 | Architecture Docs | Updated `README.md`, created `docs/PRD.md`, `docs/Architecture.md`, `docs/Design.md` |
| 2026-09-03 | Living Docs | Created `docs/memory.md`, `docs/Rules.md`, `docs/Team_Role.md`, `docs/mapping.md` |
