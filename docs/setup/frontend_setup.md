
# 🎨 Validra — Frontend Setup Guide

<p align="center">
  <a href="../../README.md">
    <img src="../../Assets/Repo/logo_repo.png" alt="Validra Logo" width="140" />
  </a>
</p>

> **Team VisionMinds — Think. Build. Transform.**  
> **Domain M1:** Frontend & UI/UX

---

## 📋 System Requirements

| Tool | Required Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | 18.0+ (LTS 22+ recommended) | JavaScript/TypeScript Runtime |
| **npm** | 9.0+ | Package Manager |
| **PostgreSQL** | 15+ | Database (for Prisma/Auth) |
| **Git** | 2.40+ | Version Control |

> [!IMPORTANT]
> Complete the [Base Setup Guide](./base_setup.mdx) first if you haven't installed these tools.

---

## 📦 Current Stack Versions

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.3.4 | App Router, Server Components default |
| React | 19.2.8 | React 19 concurrent features |
| TypeScript | ^5 | Strict mode |
| Tailwind CSS | ^4 | v4 (@tailwindcss/postcss) |
| Prisma | ^6.19.3 | PostgreSQL ORM for auth, users & audit logs |
| NextAuth / Auth.js | ^5.0.0-beta.32 | JWT session strategy & credentials provider |
| Nodemailer | ^8.0.11 | Transactional email & verification delivery |
| Lucide React | ^1.46.0 | Modern UI icon library |

---

## 🚀 Quick Setup (Automated)

The fastest way to get running:

```bash
cd frontend
npm run setup
```

This runs `scripts/setup.js` which:
1. Checks for `.env` — copies from `.env.example` if missing
2. Installs all npm dependencies
3. Runs `prisma generate` to generate Prisma Client types

Then start the dev server:

```bash
npm run dev
```

Frontend available at: **http://localhost:3000**

---

## 🛠️ Manual Setup (Step-by-Step)

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your local values:

```env
# ─── API ───────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development

# ─── Database (Prisma) ─────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/validra"

# ─── NextAuth / Auth.js ────────────────────────
NEXTAUTH_SECRET="your-development-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# ─── Email (Nodemailer SMTP — Gmail App Password) ───────────
EMAIL_FROM="validra.metrology@gmail.com"
EMAIL_PASSWORD="your-16-char-app-password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587

# ─── Inspection Auth Bypass (Development Only) ───
NEXT_PUBLIC_BYPASS_INSPECTION_AUTH=false
NEXT_PUBLIC_DEV_AUTH_BYPASS=false
```

> [!TIP]
> Generate `NEXTAUTH_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

> [!TIP]
> For Gmail SMTP, enable 2-Factor Auth and create a 16-character [App Password](https://myaccount.google.com/apppasswords). Then verify connection with `npm run email:test`.

### 3. Install Dependencies

```bash
npm install
```

### 4. Create the PostgreSQL Database

Open a new terminal and run:

```bash
psql -U postgres
```

Then in the PostgreSQL shell:

```sql
CREATE DATABASE validra;
\q
```

### 5. Set Up Prisma with PostgreSQL (Database ORM)

Prisma is configured as the ORM for Next.js authentication, inspector accounts, and security audit logs accessing the shared PostgreSQL database.

#### 1. Configure Database URL

Ensure your `frontend/.env` file contains your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/validra"
```

Replace `postgres` (user), `your_password`, and `validra` (database name) with your local credentials.

#### 2. Prisma Schema (`prisma/schema.prisma`)

The Prisma schema defines the core authentication and audit logging models:

```prisma
// frontend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  INSPECTOR
  ADMIN
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  fullName          String
  role              UserRole  @default(INSPECTOR)
  isActive          Boolean   @default(false)
  isVerified        Boolean   @default(false)
  badgeNumber       String?
  jurisdiction      String?
  verifyToken       String?   @unique
  verifyTokenExpiry DateTime?
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([email])
  @@index([role, isActive])
  @@map("users")
}

model AuditLog {
  id              String    @id @default(cuid())
  logCode         String    @unique @map("log_code")
  timestamp       DateTime  @default(now()) @map("timestamp")
  userName        String    @map("user_name")
  userEmail       String    @map("user_email")
  userRole        String    @default("admin") @map("user_role")
  action          String
  entityType      String    @default("system") @map("entity_type")
  entityId        String    @default("SYSTEM") @map("entity_id")
  ipAddress       String    @default("127.0.0.1") @map("ip_address")
  severity        String    @default("INFO")
  status          String    @default("SUCCESS")
  description     String
  metadata        Json      @default("{}")
  acknowledgedBy  String?   @map("acknowledged_by")
  acknowledgedAt  DateTime? @map("acknowledged_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@index([severity, status])
  @@index([timestamp])
  @@index([action])
  @@map("audit_logs")
}
```

#### 3. Push or Migrate the Database Schema

To push the schema definitions to your local PostgreSQL database:

```bash
# Push schema changes directly to PostgreSQL
npm run db:push

# Generate Prisma Client types
npm run db:generate
```

For formal migration files:

```bash
npm run db:migrate
```

To explore the database tables visually in your browser:

```bash
npm run db:studio
```

#### 4. Provision Initial Admin Account

Admin accounts are created securely via the CLI script:

```bash
npm run admin:create
```

Follow the interactive prompts to enter the admin name, email, and password.

---

## 🏃 Running the Development Server

```bash
npm run dev
```

| URL | Purpose |
| :--- | :--- |
| `http://localhost:3000` | Landing Page & Public Information |
| `http://localhost:3000/login` | Field Inspector Login |
| `http://localhost:3000/admin-login` | Dedicated Admin Portal Login |
| `http://localhost:3000/dashboard` | Inspector Workspace & Scan Management |
| `http://localhost:3000/admin/dashboard` | Administration & Enforcement Portal |
| `http://localhost:3000/api/auth/token` | JWT Bridge for Backend FastAPI Requests |

---

## 🧪 Available Scripts

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run setup` | `node scripts/setup.js` | Automated env config, dependency install & prisma generate |
| `npm run dev` | `next dev` | Start dev server with hot reload |
| `npm run build` | `prisma generate && next build` | Create optimized production build |
| `npm run start` | `next start` | Start production server |
| `npm run lint` | `eslint` | Run ESLint static analysis across code |
| `npm run db:generate` | `prisma generate` | Generate Prisma Client types |
| `npm run db:push` | `prisma db push` | Push schema changes directly to PostgreSQL |
| `npm run db:migrate` | `prisma migrate dev` | Create and apply database migration files |
| `npm run db:studio` | `prisma studio` | Launch visual Prisma Studio database manager |
| `npm run manage` | `node scripts/manage.js` | Unified interactive CLI management launcher |
| `npm run admin:manage` | `node scripts/manage-admin.js` | Admin interactive management CLI |
| `npm run admin:create` | `node scripts/manage-admin.js create` | Create a new administrator account |
| `npm run admin:list` | `node scripts/manage-admin.js list` | List all administrator accounts |
| `npm run inspector:manage` | `node scripts/manage-inspector.js` | Inspector interactive management CLI |
| `npm run inspector:approve` | `node scripts/manage-inspector.js approve` | Approve pending inspector accounts |
| `npm run inspector:pending` | `node scripts/manage-inspector.js list-pending` | List inspector accounts awaiting approval |
| `npm run inspector:list` | `node scripts/manage-inspector.js list` | List all registered inspector accounts |
| `npm run email:test` | `node scripts/test-email.js` | Verify SMTP connection & test verification email |
| `npm run logs:manage` | `node scripts/manage-logs.js` | Security audit logs interactive CLI |
| `npm run logs:list` | `node scripts/manage-logs.js list` | View recent system audit log events |
| `npm run logs:stats` | `node scripts/manage-logs.js stats` | View audit telemetry summary statistics |
| `npm run logs:clear` | `node scripts/manage-logs.js truncate` | Truncate audit log records |

---

## 📁 Project Directory Structure

```text
frontend/
├── prisma/
│   └── schema.prisma          # Database schema (User & AuditLog models)
├── public/                    # Static assets, branding, and icons
├── scripts/
│   ├── setup.js               # Automated setup script
│   ├── manage.js              # Unified interactive management launcher
│   ├── manage-admin.js        # Admin user CLI manager
│   ├── manage-inspector.js    # Inspector approval & lifecycle CLI
│   ├── manage-logs.js         # Security audit log CLI
│   ├── test-email.js          # Nodemailer SMTP diagnostic test
│   └── utils.js               # Shared CLI formatting & prompt utilities
├── src/
│   ├── app/
│   │   ├── (landing)/         # Public/marketing pages (FE-1)
│   │   │   ├── layout.tsx     # Navbar + Footer shell
│   │   │   ├── page.tsx       # "/" — Composed container landing page
│   │   │   ├── about/         # "/about"
│   │   │   ├── features/      # "/features"
│   │   │   ├── how-it-works/  # "/how-it-works"
│   │   │   ├── contact/       # "/contact"
│   │   │   └── faq/           # "/faq"
│   │   ├── (auth)/            # Auth pages (FE-2)
│   │   │   ├── layout.tsx     # Centered auth card layout
│   │   │   ├── login/         # "/login" (Inspector login)
│   │   │   ├── admin-login/   # "/admin-login" (Dedicated Admin login)
│   │   │   ├── register/      # "/register" (Inspector self-registration)
│   │   │   ├── verify-email/  # "/verify-email" (Token confirmation)
│   │   │   ├── pending-approval/ # "/pending-approval" (Awaiting admin approval)
│   │   │   ├── forgot-password/  # "/forgot-password"
│   │   │   └── reset-password/   # "/reset-password"
│   │   ├── (inspector)/       # Inspector workspace (FE-2)
│   │   │   ├── layout.tsx     # InspectorShell (sidebar + header + auth guard)
│   │   │   ├── dashboard/     # "/dashboard" (Enforcement KPIs & recent scans)
│   │   │   ├── scan/
│   │   │   │   ├── new/       # "/scan/new" (Multi-photo upload / camera)
│   │   │   │   └── [id]/
│   │   │   │       ├── processing/ # "/scan/[id]/processing" (Pipeline status)
│   │   │   │       └── review/     # "/scan/[id]/review" (Dedicated review UI)
│   │   │   ├── inspections/   # "/inspections", "/inspections/[id]"
│   │   │   ├── reports/       # "/reports", "/reports/[id]"
│   │   │   ├── profile/       # "/profile"
│   │   │   └── help/          # "/help" (Legal metrology rules cheatsheet)
│   │   ├── (admin)/           # Admin portal (FE-3)
│   │   │   ├── layout.tsx     # AdminShell (admin sidebar + header + RBAC guard)
│   │   │   ├── page.tsx       # Redirects to /admin/dashboard
│   │   │   └── admin/
│   │   │       ├── dashboard/ # "/admin/dashboard" (System enforcement KPIs)
│   │   │       ├── users/     # "/admin/users", "/admin/users/[id]"
│   │   │       ├── rules/     # "/admin/rules", "/admin/rules/new", "/admin/rules/[id]"
│   │   │       ├── inspections/ # "/admin/inspections", "/admin/inspections/[id]"
│   │   │       ├── audit-logs/  # "/admin/audit-logs" (Court audit trail)
│   │   │       └── settings/    # "/admin/settings" (System thresholds)
│   │   ├── api/auth/          # Next.js internal auth endpoints
│   │   │   ├── [...nextauth]/ # Auth.js handler
│   │   │   ├── token/         # JWT minting bridge for backend FastAPI requests
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── verify-email/
│   │   │   ├── resend-verification/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── layout.tsx         # Root layout (fonts, providers)
│   │   ├── globals.css        # Tailwind v4 styles + design tokens
│   │   └── favicon.ico
│   ├── components/
│   │   ├── landing/           # Landing sections & containers (Hero, Features, etc.)
│   │   ├── auth/              # Forms: Login, AdminLogin, Register, VerifyEmail, etc.
│   │   ├── inspector/         # Inspector components (scan, review, reports, layout)
│   │   ├── admin/             # Admin components (dashboard, users, rules, audit-logs)
│   │   └── shared/            # Shared UI primitives (Button, Card, Badge, Input, Logo)
│   ├── hooks/                 # Custom React hooks (useAuth)
│   ├── services/              # API clients & service layers (scan, report, admin, etc.)
│   ├── lib/                   # Auth config, prisma client, email templates, utils
│   ├── types/                 # TypeScript type definitions (inspection, rule, audit, etc.)
│   └── middleware.ts          # Edge route security & RBAC guard
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## 👥 Team Ownership & Authentication Workflow

### Team Ownership

The frontend is split into **three isolated route groups** so team members work independently without code conflicts:

| Team Member | Route Group | Components Folder | Branch Pattern |
|-------------|-------------|-------------------|----------------|
| **FE-1** | `(landing)/` | `components/landing/` | `feature/landing-*` |
| **FE-2** | `(auth)/` + `(inspector)/` | `components/auth/` + `components/inspector/` | `feature/inspector-*` |
| **FE-3** | `(admin)/` | `components/admin/` | `feature/admin-*` |

**Shared across all:** `components/shared/ui/` (primitives) and `src/services/api.ts`.

### Inspector Onboarding Lifecycle

```
[Register] ──> [Verify Email Link] ──> [Pending Admin Approval] ──> [Admin Approves Account] ──> [Login & Dashboard]
```

1. **Self-Registration**: Officer fills `/register`. A verification link with token is sent via Nodemailer.
2. **Email Verification**: Clicking `/verify-email?token=...` marks `isVerified = true`.
3. **Pending Approval**: Account remains `isActive = false` until administrator review. Accessing protected pages redirects to `/pending-approval`.
4. **Admin Approval**: Administrator approves via `/admin/users` UI or CLI `npm run inspector:approve`.
5. **Dashboard Access**: Officer can now log in at `/login` and access `/dashboard`.

### Admin Provisioning & Access

1. **Provisioning**: Admin accounts cannot self-register; they are provisioned via `npm run admin:create`.
2. **Access**: Admins sign in at `/admin-login` and are routed directly to `/admin/dashboard`. Non-admin accounts attempting access are redirected.

---

## 📖 Blueprints — What to Build

Detailed page specs, functional requirements, and component trees for each module:

| Blueprint | Owner | Location |
|-----------|-------|----------|
| Landing Pages | FE-1 | [docs/blueprints/frontend/landing/](../blueprints/frontend/landing/landing-blueprint.md) |
| Inspector + Auth | FE-2 | [docs/blueprints/frontend/inspector/](../blueprints/frontend/inspector/inspector-blueprint.md) |
| Admin Portal | FE-3 | [docs/blueprints/frontend/admin/](../blueprints/frontend/admin/admin-blueprint.md) |
| Database Schema | All | [docs/blueprints/db/prisma/](../blueprints/db/prisma/schema-blueprint.md) |

---

## 🆘 Troubleshooting

<details>
<summary><strong>"Module not found" errors after cloning</strong></summary>

Run `npm install` to install all dependencies:

```bash
cd frontend
npm install
```

</details>

<details>
<summary><strong>Prisma errors — "Cannot find database"</strong></summary>

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env` matches your PostgreSQL credentials
3. Run `npx prisma migrate dev` to apply migrations

</details>

<details>
<summary><strong>Port 3000 already in use</strong></summary>

```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or start on a different port
npm run dev -- -p 3001
```

</details>

<details>
<summary><strong>Tailwind styles not applying</strong></summary>

Tailwind CSS v4 uses a CSS-first configuration. Ensure `postcss.config.mjs` includes `@tailwindcss/postcss` and your `globals.css` has the Tailwind imports.

</details>

---

<div align="center">

<br/>

**🎨 Validra Frontend — Ready to Build!**

*Read your team's blueprint, create your feature branch, and start building.* 🚀

<br/>

[← Back to README](../../README.md) · [Base Setup →](./base_setup.mdx) · [Backend Setup →](./backend_setup.mdx)

</div>
