# Validra — Database Schema Blueprint (Prisma)

> **Owner:** FE Team (M1) for frontend/auth tables + Backend Team (M2) for API tables
> **ORM:** Prisma (used by Next.js for auth and user management)
> **Database:** PostgreSQL

---

## 1. Overview

Validra uses **two ORMs** accessing the **same PostgreSQL database**:

| ORM | Used By | Purpose |
|---|---|---|
| **Prisma** | Next.js (Frontend/Auth) | User accounts, sessions, email verification, auth tokens |
| **SQLAlchemy** | FastAPI (Backend) | Inspections, OCR results, compliance, reports, audit logs |

This document defines the **Prisma schema** for the frontend/auth layer. For backend tables (inspections, rules, violations, etc.), see [blueprint.md](../../blueprint.md) Section 7.

---

## 2. Prisma Schema File Structure

```
frontend/
├── prisma/
│   └── schema.prisma              ← Main Prisma schema file (User & AuditLog models)
└── scripts/
    ├── manage.js                  ← Unified interactive CLI launcher
    ├── manage-admin.js            ← Admin provisioning & credentials manager
    ├── manage-inspector.js        ← Inspector approval & lifecycle manager
    ├── manage-logs.js             ← Security audit log manager
    └── test-email.js              ← Nodemailer SMTP diagnostic test
```

---

## 3. Full Prisma Schema

```prisma
// frontend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/// User roles within the Validra Legal Metrology inspection system.
enum UserRole {
  INSPECTOR
  ADMIN
}

/// Core user account for inspectors and administrators.
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  fullName          String
  role              UserRole  @default(INSPECTOR)

  /// Admin must approve inspector accounts before they can log in.
  isActive          Boolean   @default(false)
  /// Email must be verified before login is permitted.
  isVerified        Boolean   @default(false)

  badgeNumber       String?
  jurisdiction      String?

  // Email verification token
  verifyToken       String?   @unique
  verifyTokenExpiry DateTime?

  // Password reset token
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([email])
  @@index([role, isActive])
  @@map("users")
}

/// Security Audit Logs and court-verifiable incident trail.
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
  severity        String    @default("INFO") // CRITICAL, HIGH, MEDIUM, INFO
  status          String    @default("SUCCESS") // SUCCESS, FAILURE, SECURITY_ALERT, ACKNOWLEDGED
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

---

## 4. Model Details

### 4.1 `users` — Core User Account

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | CUID (String) | PK, auto-generated | Unique user identifier |
| `email` | String | UNIQUE, Indexed | Login email identifier |
| `passwordHash` | String | NOT NULL | bcrypt-hashed password |
| `fullName` | String | NOT NULL | Official inspector / administrator name |
| `role` | UserRole | Enum (`INSPECTOR`, `ADMIN`) | Access control role |
| `isActive` | Boolean | DEFAULT: `false` | Approval status (requires admin activation) |
| `isVerified` | Boolean | DEFAULT: `false` | Email confirmation status |
| `badgeNumber` | String? | Nullable | Officer official badge ID |
| `jurisdiction` | String? | Nullable | Assigned enforcement district or zone |
| `verifyToken` | String? | UNIQUE, Nullable | Single-use email verification token |
| `verifyTokenExpiry` | DateTime? | Nullable | Token expiration timestamp (24h) |
| `resetToken` | String? | UNIQUE, Nullable | Single-use password reset token |
| `resetTokenExpiry` | DateTime? | Nullable | Token expiration timestamp (1h) |
| `createdAt` | DateTime | DEFAULT: `now()` | Registration timestamp |
| `updatedAt` | DateTime | `@updatedAt` | Last modification timestamp |

**Indexes:**
- `@@index([email])`: Fast lookup during authentication.
- `@@index([role, isActive])`: Fast filtering for admin approval lists and pending counts.

### 4.2 `audit_logs` — Court-Verifiable Security & Incident Trail

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | CUID (String) | PK, auto-generated | Unique record identifier |
| `logCode` | String | UNIQUE (`log_code`) | Formatted audit code (e.g., `LOG-2026-XXXX`) |
| `timestamp` | DateTime | DEFAULT: `now()` | Exact UTC event timestamp |
| `userName` | String | NOT NULL | Name of officer or actor initiating event |
| `userEmail` | String | NOT NULL | Email address of actor |
| `userRole` | String | DEFAULT: `"admin"` | Role at time of event |
| `action` | String | NOT NULL | Event type (e.g., `AUTH_LOGIN`, `USER_APPROVED`) |
| `entityType` | String | DEFAULT: `"system"` | Entity affected (`user`, `rule`, `inspection`) |
| `entityId` | String | DEFAULT: `"SYSTEM"` | ID of affected entity |
| `ipAddress` | String | DEFAULT: `"127.0.0.1"` | Client IP address for court auditability |
| `severity` | String | DEFAULT: `"INFO"` | `CRITICAL`, `HIGH`, `MEDIUM`, `INFO` |
| `status` | String | DEFAULT: `"SUCCESS"` | `SUCCESS`, `FAILURE`, `SECURITY_ALERT`, `ACKNOWLEDGED` |
| `description` | String | NOT NULL | Human-readable explanation of event |
| `metadata` | Json | DEFAULT: `"{}"` | Structured contextual metadata |
| `acknowledgedBy`| String? | Nullable | Admin user who acknowledged incident |
| `acknowledgedAt`| DateTime? | Nullable | Timestamp of administrative review |

---

## 5. NextAuth v5 Stateless JWT Strategy

Unlike database session adapters that create database writes on every session check, Validra uses NextAuth v5's **Stateless JWT Strategy** (`session: { strategy: "jwt" }`):

1. **Credentials Authentication**: Inspector/Admin submits email & password to `/api/auth/[...nextauth]` via `CredentialsProvider`.
2. **Prisma Lookup**: User is fetched, password hash verified via `bcryptjs.compare`, and `isVerified` + `isActive` states checked.
3. **JWT Minting**: A signed JWT is created with `id`, `email`, `role`, `fullName`, `isActive`, `isVerified`.
4. **FastAPI Authorization Bridge**: When making requests to FastAPI, the frontend calls `/api/auth/token` which mints a signed HS256 JWT bearer token containing claims understood by the FastAPI backend middleware.

---

## 6. Email Service & Notifications

Transactional emails are dispatched via **Nodemailer** using Gmail SMTP or custom SMTP servers (configured in `frontend/src/lib/email.ts`):

| Email Type | Trigger | Content |
|---|---|---|
| **Email Verification** | Inspector registers at `/register` | Official branded verification link (`/verify-email?token=...`) |
| **Password Reset** | Officer requests reset at `/forgot-password` | Secure one-time reset link (`/reset-password?token=...`) |
| **Account Approved** | Admin activates account in `/admin/users` or CLI | Notification that officer may now log in to the workspace |
| **Password Changed** | Password reset successfully completed | Security alert advising officer to report unauthorized activity |
| **Welcome Onboarding**| Email verified successfully | Overview of Legal Metrology enforcement capabilities |

---

## 7. Account Management CLI Tools

Administration accounts and inspector verification states can be managed via command-line tools in `frontend/scripts/`:

```bash
# Unified Interactive CLI Launcher
npm run manage

# Create new administrator account
npm run admin:create

# List all administrator accounts
npm run admin:list

# Approve pending inspector accounts
npm run inspector:approve

# List inspector accounts awaiting approval
npm run inspector:pending

# List all inspector accounts
npm run inspector:list

# Test SMTP email delivery
npm run email:test

# View recent security audit logs
npm run logs:list

# View audit telemetry summary statistics
npm run logs:stats
```

---

## 8. Migration & Maintenance Commands

```bash
# Push schema changes directly to PostgreSQL (development)
npm run db:push

# Generate Prisma Client types
npm run db:generate

# Create and apply migration files (production)
npm run db:migrate

# Launch visual Prisma Studio database manager
npm run db:studio
```

---

## 9. Environment Variables

```env
# frontend/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/validra"
NEXTAUTH_SECRET="your-development-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# Nodemailer SMTP
EMAIL_FROM="validra.metrology@gmail.com"
EMAIL_PASSWORD="your-16-char-app-password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587

# Development bypass flags
NEXT_PUBLIC_BYPASS_INSPECTION_AUTH=false
NEXT_PUBLIC_DEV_AUTH_BYPASS=false
```
