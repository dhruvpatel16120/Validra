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

The **Validra Frontend** is built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**. It serves as the primary user-facing web interface for inspectors and administrators to execute product label scans, review compliance violations, analyze extracted OCR text, and inspect legal references.

---

## ⚡ Quick Start

### 1. Automated Environment Setup & Install

Run the automated setup script to generate `.env` (from `.env.example`) and install dependencies:

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
| `npm run setup` | `node scripts/setup.js` | Automated `.env` setup & dependency installation |
| `npm run dev` | `next dev` | Start Next.js development server with hot reload |
| `npm run build` | `next build` | Build optimized production application bundle |
| `npm run start` | `next start` | Run production server |
| `npm run lint` | `eslint` | Run ESLint across code workspace |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` to configure application variables:

```env
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# App Environment
NEXT_PUBLIC_APP_ENV=development
```

---

## 📁 Directory Structure

```text
frontend/
├── public/                # Static visual assets & fonts
├── scripts/
│   └── setup.js          # Automated environment & dependency setup script
├── src/                   # Next.js App Router source code
│   └── app/               # Application routes, page components, and layouts
├── .env.example           # Environment template
├── eslint.config.mjs      # ESLint configuration
├── next.config.ts         # Next.js configuration
├── package.json           # npm dependencies & script commands
├── postcss.config.mjs     # PostCSS configuration
└── tsconfig.json          # TypeScript configuration
```

---

## 📚 Related Documentation

- 📄 [Frontend Setup Guide](../docs/setup/frontend_setup.mdx)
- 🎨 [UI/UX & System Design Specifications](../docs/frontend/Design.md)
- 👥 [Team Domain Ownership Mapping](../docs/team-guide/Team_Role.md)
