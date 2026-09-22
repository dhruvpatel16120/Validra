# Validra — Inspector Module Blueprint

> **Owner:** FE-2 (Inspector Workflow + Auth Pages)
> **Directory:** `frontend/src/app/(inspector)/` + `frontend/src/app/(auth)/`
> **Isolation:** No imports from `(landing)/` or `(admin)/` component folders.

---

## 1. Module Overview

The Inspector module is the **core product** of Validra. It contains:

1. **Auth Pages** — Login, Register, Verify Email, Forgot Password (shared auth flow)
2. **Inspector Dashboard** — Overview statistics
3. **Scan Workflow** — Upload → Processing → Review
4. **Inspection Management** — History, detail view, search/filter
5. **Reports** — Generate, view, download
6. **Profile & Settings** — Inspector profile management

---

## 2. File Structure

```
frontend/src/
├── app/
│   ├── (auth)/                           ← Auth route group (no sidebar)
│   │   ├── layout.tsx                    ← Centered auth layout (logo + card)
│   │   ├── login/
│   │   │   └── page.tsx                  ← "/login" (Field Inspector login)
│   │   ├── admin-login/
│   │   │   └── page.tsx                  ← "/admin-login" (Dedicated Admin login)
│   │   ├── register/
│   │   │   └── page.tsx                  ← "/register" (Inspector self-registration)
│   │   ├── verify-email/
│   │   │   └── page.tsx                  ← "/verify-email" (Token confirmation)
│   │   ├── pending-approval/
│   │   │   └── page.tsx                  ← "/pending-approval" (Awaiting admin approval)
│   │   ├── forgot-password/
│   │   │   └── page.tsx                  ← "/forgot-password"
│   │   └── reset-password/
│   │       └── page.tsx                  ← "/reset-password?token=..."
│   │
│   ├── (inspector)/                      ← Inspector route group (with sidebar)
│   │   ├── layout.tsx                    ← InspectorShell (sidebar + header + auth guard)
│   │   ├── dashboard/
│   │   │   └── page.tsx                  ← "/dashboard" (Enforcement KPIs & recent scans)
│   │   ├── scan/
│   │   │   ├── new/
│   │   │   │   └── page.tsx              ← "/scan/new" (Upload 1-4 label photos / camera)
│   │   │   └── [id]/
│   │   │       ├── processing/
│   │   │       │   └── page.tsx          ← "/scan/[id]/processing" (Pipeline progress status)
│   │   │       └── review/
│   │   │           └── page.tsx          ← "/scan/[id]/review" (Dedicated Review Inspection ⭐)
│   │   ├── inspections/
│   │   │   ├── page.tsx                  ← "/inspections" (History, search, filter, paginate)
│   │   │   └── [id]/
│   │   │       └── page.tsx              ← "/inspections/[id]" (Inspection detail view)
│   │   ├── reports/
│   │   │   ├── page.tsx                  ← "/reports" (Report catalog)
│   │   │   └── [id]/
│   │   │       └── page.tsx              ← "/reports/[id]" (PDF preview & download)
│   │   ├── profile/
│   │   │   └── page.tsx                  ← "/profile"
│   │   └── help/
│   │       └── page.tsx                  ← "/help" (Legal metrology rules cheatsheet)
│   │
│   ├── api/auth/                         ← Internal Next.js authentication endpoints
│   │   ├── [...nextauth]/route.ts        ← Auth.js handler
│   │   ├── token/route.ts                ← JWT generation bridge for FastAPI backend
│   │   ├── login/route.ts
│   │   ├── register/route.ts
│   │   ├── verify-email/route.ts
│   │   ├── resend-verification/route.ts
│   │   ├── forgot-password/route.ts
│   │   └── reset-password/route.ts
│   │
│   ├── (landing)/                        ← FE-1 owns (DO NOT TOUCH)
│   └── (admin)/                          ← FE-3 owns (DO NOT TOUCH)
│
├── components/
│   ├── auth/                             ← Auth-specific components
│   │   ├── LoginForm.tsx                 ← Inspector credentials login
│   │   ├── AdminLoginForm.tsx            ← Dedicated Admin login
│   │   ├── RegisterForm.tsx              ← Inspector registration
│   │   ├── VerifyEmailCard.tsx           ← Email confirmation view
│   │   ├── ForgotPasswordForm.tsx        ← Request password reset link
│   │   ├── ResetPasswordForm.tsx         ← Set new password with token
│   │   ├── AuthCard.tsx                  ← Shared auth layout wrapper card
│   │   ├── PasswordStrengthMeter.tsx     ← Interactive password strength feedback
│   │   ├── AuthBridge.tsx                ← Client session auth synchronization
│   │   ├── AuthLoadingState.tsx          ← Auth state loading skeleton
│   │   ├── SessionProvider.tsx           ← NextAuth session provider
│   │   └── index.ts
│   │
│   ├── inspector/                        ← Inspector-specific components
│   │   ├── layout/
│   │   │   ├── InspectorShell.tsx        ← Sidebar + Header + Content area
│   │   │   ├── InspectorSidebar.tsx      ← Navigation sidebar
│   │   │   ├── InspectorHeader.tsx       ← Top bar (user badge, profile menu)
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── StatsGrid.tsx             ← Total / Compliant / Violations / Needs Review
│   │   │   ├── RecentInspections.tsx     ← Recent scans list
│   │   │   ├── ComplianceTrendChart.tsx  ← Compliance rate trend chart
│   │   │   ├── ViolationBreakdown.tsx    ← Violation frequency chart
│   │   │   └── index.ts
│   │   ├── scan/
│   │   │   ├── ImageUploader.tsx         ← Drag-drop 1-4 label photos
│   │   │   ├── UploadProgress.tsx        ← Upload progress indicator
│   │   │   ├── ProcessingStatus.tsx      ← Stepped OCR & pipeline status
│   │   │   ├── CameraCapture.tsx         ← Device camera capture integration
│   │   │   └── index.ts
│   │   ├── review/
│   │   │   ├── ReviewPage.tsx            ← Main review layout coordinator
│   │   │   ├── ExtractedFieldsTable.tsx  ← Field, value, confidence, status table
│   │   │   ├── EvidenceViewer.tsx        ← Interactive image zoom & bbox overlay
│   │   │   ├── FindingCard.tsx           ← Per-finding status, legal citation & actions
│   │   │   ├── FindingsList.tsx          ← Scrollable findings collection
│   │   │   ├── InspectorDecisionPanel.tsx← Officer action controls (Accept/Modify/Reject)
│   │   │   ├── RemarksInput.tsx          ← Inspector evidence remarks
│   │   │   ├── FinalizeDialog.tsx        ← Final sign-off & report generation modal
│   │   │   ├── ConfidenceIndicator.tsx   ← Score percentage & confidence badge
│   │   │   ├── ComplianceScoreRing.tsx   ← Overall compliance ring graphic
│   │   │   └── index.ts
│   │   ├── inspections/
│   │   │   ├── InspectionTable.tsx       ← Sortable, paginated inspection history
│   │   │   ├── InspectionFilters.tsx     ← Status, date range, search query
│   │   │   ├── InspectionPagination.tsx  ← Deterministic numbered page navigation
│   │   │   ├── InspectionDetailView.tsx  ← Full inspection detail view
│   │   │   └── index.ts
│   │   ├── reports/
│   │   │   ├── ReportList.tsx            ← Searchable reports catalog
│   │   │   ├── ReportCard.tsx            ← Individual report preview card
│   │   │   ├── ReportViewer.tsx          ← PDF preview renderer
│   │   │   ├── ReportDownloadButton.tsx  ← Download official PDF report
│   │   │   └── index.ts
│   │   ├── common/
│   │   │   ├── PageHeader.tsx            ← Page title, breadcrumb & actions
│   │   │   ├── EmptyState.tsx            ← Standardized empty state view
│   │   │   ├── LoadingState.tsx          ← Standardized loading skeleton
│   │   │   ├── ErrorState.tsx            ← Standardized error display & retry
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── shared/                           ← Shared design system primitives
│       ├── Logo.tsx                      ← Validra brand emblem
│       └── ui/                           ← Button, Card, Badge, Input, etc.
│
├── hooks/
│   └── useAuth.ts                        ← Client authentication & token hook
│
├── services/
│   ├── api.ts                            ← Unified HTTP client, JWT bearer handling, error normalization
│   ├── auth-service.ts                   ← Registration, email verification, password reset
│   ├── scan-service.ts                   ← Multi-image upload (`POST /api/scans`), scan polling
│   ├── inspection-service.ts             ← Inspection history retrieval & report generation
│   ├── review-service.ts                 ← Finding modifications & officer decisions
│   ├── report-service.ts                 ← Report listing, detail & PDF download
│   ├── dashboard-service.ts              ← Officer dashboard statistics
│   └── profile-service.ts                ← Inspector profile metadata
│
└── types/
    ├── auth.ts                           ← Auth tokens, user session, credentials
    ├── inspection.ts                     ← Inspection summary, detail, findings
    ├── scan.ts                           ← Upload payloads, pipeline status
    ├── review.ts                         ← Review decisions, field overrides, remarks
    ├── report.ts                         ← PDF report summaries and metadata
    ├── dashboard.ts                      ← Officer performance KPIs
    └── legal-document.ts                 ← Act & rule reference definitions
```

---

## 3. Auth Pages — Functional Requirements

### 3.1 Login Page — `/login`

| ID | Requirement |
|---|---|
| AUTH-01 | Display login form with email and password fields |
| AUTH-02 | Client-side validation: email format, password not empty |
| AUTH-03 | Submit credentials to NextAuth `signIn()` |
| AUTH-04 | Show loading state during authentication |
| AUTH-05 | Display server error messages (invalid credentials, account locked) |
| AUTH-06 | "Forgot Password?" link → `/forgot-password` |
| AUTH-07 | "Don't have an account? Register" link → `/register` |
| AUTH-08 | On success, redirect to `/dashboard` |
| AUTH-09 | If already logged in, redirect to `/dashboard` |
| AUTH-10 | Remember me checkbox (optional, extends session) |

**Layout:**
```
┌─────────────────────────────────────┐
│           [Validra Logo]            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Welcome Back            │  │
│  │                               │  │
│  │   Email: [________________]   │  │
│  │   Password: [_____________]   │  │
│  │   □ Remember me               │  │
│  │                               │  │
│  │   [      Sign In       ]      │  │
│  │                               │  │
│  │   Forgot Password?            │  │
│  │   Don't have an account?      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3.2 Register Page — `/register`

| ID | Requirement |
|---|---|
| REG-01 | Display registration form: full name, email, password, confirm password |
| REG-02 | Client-side validation: name min 2 chars, email format, password min 8 chars, passwords match |
| REG-03 | Password strength meter (weak/medium/strong) |
| REG-04 | Submit to NextAuth registration endpoint |
| REG-05 | Show loading state during submission |
| REG-06 | On success, show "Verification email sent" message and redirect to `/verify-email` |
| REG-07 | Display server errors (email already exists, etc.) |
| REG-08 | "Already have an account? Sign In" link → `/login` |
| REG-09 | Terms of Service / Privacy Policy checkbox |

> **Note:** This is for Inspector registration only. Admin accounts are created via Next.js CLI scripts — no admin registration page needed.

**Layout:**
```
┌─────────────────────────────────────┐
│           [Validra Logo]            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Create Account          │  │
│  │                               │  │
│  │   Full Name: [____________]   │  │
│  │   Email: [________________]   │  │
│  │   Password: [_____________]   │  │
│  │   [■■■■░░░░░░] Medium         │  │
│  │   Confirm: [______________]   │  │
│  │                               │  │
│  │   □ I agree to Terms          │  │
│  │                               │  │
│  │   [    Create Account   ]     │  │
│  │                               │  │
│  │   Already have an account?    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3.3 Verify Email Page — `/verify-email`

| ID | Requirement |
|---|---|
| VER-01 | Display "Check your email" message with the registered email |
| VER-02 | Handle verification token from email link (`/verify-email?token=...`) |
| VER-03 | On valid token, show success message and redirect to `/login` |
| VER-04 | On invalid/expired token, show error with "Resend verification" button |
| VER-05 | Resend verification email button (rate-limited) |
| VER-06 | Show countdown timer after resend (60 seconds) |

**Layout:**
```
┌─────────────────────────────────────┐
│           [Validra Logo]            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       📧 Check Your Email     │  │
│  │                               │  │
│  │   We sent a verification      │  │
│  │   email to user@example.com   │  │
│  │                               │  │
│  │   Click the link in the       │  │
│  │   email to verify your        │  │
│  │   account.                    │  │
│  │                               │  │
│  │   [  Resend Email (48s)  ]    │  │
│  │                               │  │
│  │   Back to Login               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3.4 Pending Approval Page — `/pending-approval`

| ID | Requirement |
|---|---|
| PEN-01 | Display official pending status banner with badge icons |
| PEN-02 | Show visual step progression: Email Verified (completed) → Admin Approval (pending) |
| PEN-03 | Clarify instructions: An administrator reviews and approves account before workspace access |
| PEN-04 | Provide "Sign In with Another Account" link → `/login` |

### 3.5 Forgot Password Page — `/forgot-password`

| ID | Requirement |
|---|---|
| FPW-01 | Display form with email field |
| FPW-02 | Client-side email format validation |
| FPW-03 | Submit to password reset API |
| FPW-04 | On success, show "Reset email sent" regardless of whether email exists (security) |
| FPW-05 | "Back to Login" link → `/login` |
| FPW-06 | Rate-limit resend requests |

### 3.6 Reset Password Page — `/reset-password`

| ID | Requirement |
|---|---|
| RST-01 | Accept token from email link query param (`/reset-password?token=...`) |
| RST-02 | Display new password + confirm password fields |
| RST-03 | Password strength meter |
| RST-04 | Validate: min 8 chars, passwords match |
| RST-05 | On success, show "Password updated" and redirect to `/login` |
| RST-06 | On invalid/expired token, show error with link to `/forgot-password` |

---

## 4. Inspector Pages — Functional Requirements

### 4.1 Dashboard — `/dashboard`

| ID | Requirement |
|---|---|
| DASH-01 | Display stats grid: Total Inspections, Compliant, Violations, Needs Review |
| DASH-02 | Show recent inspections list (last 5–10) |
| DASH-03 | Compliance trend chart (last 7/30 days) |
| DASH-04 | Violation breakdown by category (pie/bar chart) |
| DASH-05 | Quick action: "New Scan" button |
| DASH-06 | Show inspector's name and greeting |
| DASH-07 | Loading skeletons for all data sections |
| DASH-08 | Empty state for new inspectors (no inspections yet) |

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Sidebar]  │  Welcome back, Inspector Name          │
│             │                                        │
│  Dashboard  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  New Scan   │  │ 248  │ │ 180  │ │  48  │ │  20  │  │
│  History    │  │Total │ │Pass  │ │Fail  │ │Review│  │
│  Reports    │  └──────┘ └──────┘ └──────┘ └──────┘  │
│  Profile    │                                        │
│  Help       │  [Compliance Trend Chart        ]      │
│             │                                        │
│             │  Recent Inspections                    │
│             │  ┌─────────────────────────────────┐   │
│             │  │ INS-124 │ Biscuit │ PASS │ 2h   │   │
│             │  │ INS-123 │ Oil     │ FAIL │ 5h   │   │
│             │  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 4.2 New Scan — `/scan/new`

| ID | Requirement |
|---|---|
| SCAN-01 | Drag-and-drop image upload zone |
| SCAN-02 | Camera capture button (mobile/tablet) |
| SCAN-03 | Support multiple images (front, back, sides) |
| SCAN-04 | Client-side file validation: JPEG/PNG/WebP, max 10MB per image |
| SCAN-05 | Image preview with remove button |
| SCAN-06 | Optional: product name, category, barcode fields |
| SCAN-07 | "Start Scan" button → uploads to `POST /api/v1/scans` |
| SCAN-08 | Show upload progress per image |
| SCAN-09 | On success, redirect to `/scan/[id]/processing` |
| SCAN-10 | Error handling: upload failure, network error, file too large |

### 4.3 Processing Status — `/scan/[id]/processing`

| ID | Requirement |
|---|---|
| PROC-01 | Display multi-step progress indicator |
| PROC-02 | Steps: Uploading → Queued → Quality Check → OCR → Extracting → Validating → RAG → Completed |
| PROC-03 | Poll `GET /api/v1/scans/[id]` every 2–3 seconds |
| PROC-04 | Show current step with animation |
| PROC-05 | On completion, auto-redirect to `/scan/[id]/review` |
| PROC-06 | On failure (quality_failed), show error with "Try Again" link |
| PROC-07 | Cancel button to abort scan |
| PROC-08 | Estimated time remaining (optional) |

### 4.4 Review Inspection — `/scan/[id]/review`

**This is the most important page in the entire application.**

| ID | Requirement |
|---|---|
| REV-01 | Display overall compliance score (ring/gauge) |
| REV-02 | Display overall status: COMPLIANT / NON-COMPLIANT / NEEDS_REVIEW |
| REV-03 | Display extracted fields table: field name, value, confidence, status |
| REV-04 | Display evidence viewer: original image with bounding box overlays |
| REV-05 | Click a finding → highlight corresponding bounding box |
| REV-06 | Display findings list with per-finding: |
|        | — Status badge (PASS / FAIL / NEEDS_REVIEW) |
|        | — Field name and detected value |
|        | — Confidence indicator |
|        | — Severity badge (LOW / MEDIUM / HIGH / CRITICAL) |
|        | — Legal reference |
|        | — Evidence crop image |
|        | — RAG explanation (expandable) |
| REV-07 | Inspector decision per finding: Accept / Reject / Modify |
| REV-08 | Inspector remarks input per finding |
| REV-09 | Global remarks input for the inspection |
| REV-10 | "Finalize Inspection" button with confirmation dialog |
| REV-11 | "Generate Report" button (available after finalize) |
| REV-12 | Quality report section (blur, brightness, glare, resolution) |
| REV-13 | Loading skeletons while data loads |
| REV-14 | Error state if inspection not found or unauthorized |

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Review Inspection INS-000124              │
│             │                                            │
│             │  ┌──────────────────┐  ┌────────────────┐  │
│             │  │                  │  │ Score: 78/100  │  │
│             │  │  Evidence Viewer │  │ Status: REVIEW │  │
│             │  │  [Image + BBox]  │  │                │  │
│             │  │                  │  │ Passed: 10     │  │
│             │  │                  │  │ Failed: 2      │  │
│             │  │                  │  │ Review: 2      │  │
│             │  └──────────────────┘  └────────────────┘  │
│             │                                            │
│             │  Findings                                  │
│             │  ┌──────────────────────────────────────┐   │
│             │  │ ✅ MRP — ₹99 — 97% — PASS          │   │
│             │  │ ❌ Contact — Not Found — FAIL       │   │
│             │  │ ⚠️ Net Qty — 500g — 72% — REVIEW   │   │
│             │  │    [Accept] [Reject] [Modify]       │   │
│             │  │    Remarks: [___________________]   │   │
│             │  └──────────────────────────────────────┘   │
│             │                                            │
│             │  [    Finalize Inspection    ]              │
└──────────────────────────────────────────────────────────┘
```

### 4.5 Inspection History — `/inspections`

| ID | Requirement |
|---|---|
| HIST-01 | DataTable with columns: ID, Product, Status, Score, Date, Actions |
| HIST-02 | Search by product name or inspection ID |
| HIST-03 | Filter by status (All / Compliant / Violation / Needs Review / Finalized) |
| HIST-04 | Filter by date range |
| HIST-05 | Sort by date, score, status |
| HIST-06 | Pagination (20 per page) |
| HIST-07 | Click row → navigate to `/inspections/[id]` |
| HIST-08 | Empty state for no inspections |
| HIST-09 | Loading skeleton for table |

### 4.6 Inspection Detail — `/inspections/[id]`

| ID | Requirement |
|---|---|
| DET-01 | Show all inspection metadata (date, inspector, status, score) |
| DET-02 | Show product information |
| DET-03 | Show all extracted fields with confidence |
| DET-04 | Show all findings with inspector decisions |
| DET-05 | Show evidence images |
| DET-06 | Show legal references |
| DET-07 | Show inspector remarks |
| DET-08 | Link to report if generated |
| DET-09 | Read-only view (no editing after finalization) |

### 4.7 Reports — `/reports`

| ID | Requirement |
|---|---|
| RPT-01 | List all generated reports |
| RPT-02 | Search by report ID or product |
| RPT-03 | Filter by date range |
| RPT-04 | Download PDF button per report |
| RPT-05 | View report inline (PDF preview) |
| RPT-06 | Report metadata: ID, inspection, date, status |

### 4.8 Profile — `/profile`

| ID | Requirement |
|---|---|
| PRF-01 | Display user info (name, email, role) |
| PRF-02 | Edit name |
| PRF-03 | Change password |
| PRF-04 | Inspection statistics summary |

---

## 5. Inspector Shell Layout

```tsx
// components/inspector/layout/InspectorShell.tsx
// Wraps all (inspector)/ pages

<div className="flex h-screen">
  <InspectorSidebar />           {/* Fixed left sidebar */}
  <div className="flex-1 flex flex-col">
    <InspectorHeader />          {/* Top bar: breadcrumb, notifications, user menu */}
    <main className="flex-1 overflow-auto p-6">
      {children}                 {/* Page content */}
    </main>
  </div>
</div>
```

### Sidebar Navigation Items

```
📊 Dashboard        → /dashboard
📷 New Scan         → /scan/new
📋 Inspections      → /inspections
📄 Reports          → /reports
👤 Profile          → /profile
❓ Help             → /help
🚪 Logout           → signOut()
```

---

## 6. Auth Layout

```tsx
// app/(auth)/layout.tsx
// Centered card layout — no sidebar, no header

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
  <div className="w-full max-w-md">
    <Logo className="mx-auto mb-8" />
    {children}
  </div>
</div>
```

---

## 7. State Management

| Data Type | Strategy |
|---|---|
| Server data (inspections, reports) | React Query / TanStack Query with cache |
| Auth state | NextAuth session (useSession hook) |
| Form state | React Hook Form (local) |
| UI state (modals, tabs) | React useState (local) |
| Scan processing status | Polling with usePolling hook |
| Global app state | Not needed — avoid global stores |

---

## 8. API Integration Points

All backend communication maps directly to `/api/*` endpoints through `src/services/api.ts` with automatic Bearer JWT header injection:

| Page / Feature | API Calls | Purpose |
|---|---|---|
| JWT Bridge | `GET /api/auth/token` | Mints HS256 JWT bearer token from active NextAuth session for FastAPI |
| Dashboard | `GET /api/dashboard` | Inspector enforcement statistics & summary |
| New Scan | `POST /api/scans` (multipart) | Uploads 1–4 package label photos to trigger analysis pipeline |
| Processing | `GET /api/scans/[id]` (poll) | Polls OCR & pipeline execution status |
| Review | `GET /api/scans/[id]` | Retrieves detailed scan findings, bounding boxes & declarations |
| Review Action | `POST /api/reports` | Files inspector findings / escalated report |
| History | `GET /api/scans` | Retrieves officer's paginated scan history |
| Reports | `GET /api/reports` | Lists all filed compliance inspection reports |
| Report Detail | `GET /api/reports/[id]` | Inspects specific finalized report details |
| Report PDF | `GET /api/reports/[id]/pdf` | Downloads court-admissible signed PDF report |
| Profile | `GET /api/profile` | Fetches signed-in officer's jurisdiction & badge data |

### Development Bypass Modes

For testing inspection workflows without completing full email verification or admin approval in development environments:
- `NEXT_PUBLIC_BYPASS_INSPECTION_AUTH=true`: Bypasses edge middleware auth checks on inspector routes.
- `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`: Bypasses client-side session checks.

---

## 9. Ownership Rules

| Rule | Detail |
|---|---|
| FE-2 owns | `(auth)/`, `(inspector)/`, `components/auth/`, `components/inspector/`, `hooks/`, `services/`, `types/` |
| FE-2 co-owns | `components/shared/` (design system primitives) |
| FE-2 must NOT | Import from `components/landing/` or `components/admin/` |
| FE-2 must NOT | Create admin-specific pages |
| Branch pattern | `feature/inspector-*`, `feature/auth-*` |

---

## 10. Error & Loading States

Every page must implement:

| State | UI Treatment |
|---|---|
| Loading | Skeleton matching final layout shape |
| Success | Data rendered with all interactive elements |
| Empty | Illustration + helpful message + CTA (e.g., "Start your first scan") |
| Error | Error icon + message + retry button |
| Unauthorized | Redirect to `/login` or show 403 page |
| Not Found | 404 page for invalid inspection/report IDs |
| Processing Failed | Error banner + "Try Again" + details |
| Network Offline | Toast notification + retry on reconnect |
