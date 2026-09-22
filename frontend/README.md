# 🎨 Validra — Frontend Application (Next.js 16)

<p align="center">
  <a href="../README.md">
    <img src="../Assets/Repo/logo_repo.png" alt="Validra Logo" width="140" />
  </a>
</p>

> **Team VisionMinds — Think. Build. Transform.**  
> **Domain M1:** Frontend, UI/UX, Scanning Interface, Inspection Dashboard, and Evidence Viewer.

---

## 📖 Overview

The **Validra Frontend** is built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Prisma 6.19+**. It serves as the primary user-facing web interface for inspectors and administrators to execute product label scans, review compliance violations with spatial evidence overlays, analyze extracted statutory text, and inspect Legal Metrology references.

---

## ⚡ Quick Start

### 1. Automated Environment Setup & Install

Run the interactive setup wizard to configure `.env` (from `.env.example`) and install dependencies:

```bash
npm run setup
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`.

---

## 🛠️ Available npm Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run setup` | `node scripts/setup.js` | Automated `.env` configuration & dependency installation |
| `npm run dev` | `next dev` | Start Next.js development server with hot reload |
| `npm run build` | `next build` | Build optimized production application bundle |
| `npm run start` | `next start` | Run production server |
| `npm run lint` | `eslint` | Run ESLint across code workspace |

---

## 🔑 Environment Variables

Configured in `.env` (template in `.env.example`):

```env
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development

# Database (PostgreSQL - Shared with Backend)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/validra"

# NextAuth Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="validra-secret-key-change-in-production-min-32-chars"

# SMTP Email Transport (Verification Links)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@validra.gov.in"
```

---

## 📁 Directory Structure

```text
frontend/
├── prisma/
│   ├── schema.prisma     # Prisma ORM schema for Auth & User accounts
│   └── seed.ts           # Admin provisioning seed script
├── public/               # Static visual assets & fonts
├── scripts/
│   └── setup.js          # Interactive setup & dependency installer
├── src/                  # Next.js App Router source code
│   ├── app/              # Routes, page layouts, and route handlers
│   └── components/       # Shared UI primitives & evidence viewers
├── .env.example          # Environment template
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── package.json          # npm dependencies & script commands
├── postcss.config.mjs    # PostCSS configuration
└── tsconfig.json         # TypeScript configuration
```

---

## 📚 Related Documentation

- 📄 [Frontend Setup Guide](../docs/setup/frontend_setup.md)
- 🎨 [UI/UX & System Design Specifications](../docs/Design.md)
- 🏛️ [Master System Architecture](../docs/Architecture.md)
- 📋 [Product Requirements Document (PRD)](../docs/PRD.md)
- 👥 [Team Domain Ownership Mapping](../docs/team-guide/Team_Role.md)
