# Validra — Admin Module Blueprint

> **Owner:** FE-3 (Dashboard Analytics + Admin Portal)
> **Directory:** `frontend/src/app/(admin)/`
> **Isolation:** No imports from `(landing)/` or `(inspector)/` component folders.

---

## 1. Module Overview

The Admin module provides system administration capabilities for supervisors and administrators. Admin accounts are **created via Next.js CLI scripts** — there is no admin registration or admin email verification page in the frontend.

### Admin vs Inspector Distinction

| Aspect | Inspector | Admin |
|---|---|---|
| Primary task | Conduct inspections | Manage system |
| UI density | Focused workflow | Dense tables + forms |
| Data access | Own inspections | All inspections |
| Write access | Create inspections, review findings | Manage users, rules, legal docs |
| Auth flow | Register → Verify → Login | Script-created → Login |

---

## 2. File Structure

```
frontend/src/
├── app/
│   ├── (admin)/                              ← Admin route group
│   │   ├── layout.tsx                        ← AdminShell (admin sidebar + header + auth guard + role check)
│   │   ├── page.tsx                          ← Redirects to "/admin/dashboard"
│   │   └── admin/
│   │       ├── dashboard/
│   │       │   └── page.tsx                  ← "/admin/dashboard" (Enforcement KPIs & telemetry)
│   │       ├── users/
│   │       │   ├── page.tsx                  ← "/admin/users" (Inspector accounts management)
│   │       │   └── [id]/
│   │       │       └── page.tsx              ← "/admin/users/[id]" (Officer detail & activity)
│   │       ├── rules/
│   │       │   ├── page.tsx                  ← "/admin/rules" (Rule engine configuration)
│   │       │   ├── new/
│   │       │   │   └── page.tsx              ← "/admin/rules/new" (Create rule)
│   │       │   └── [id]/
│   │       │       └── page.tsx              ← "/admin/rules/[id]" (Edit rule & versioning)
│   │       ├── inspections/
│   │       │   ├── page.tsx                  ← "/admin/inspections" (System-wide inspections)
│   │       │   └── [id]/
│   │       │       └── page.tsx              ← "/admin/inspections/[id]" (Read-only oversight)
│   │       ├── audit-logs/
│   │       │   └── page.tsx                  ← "/admin/audit-logs" (Court-verifiable audit trail)
│   │       └── settings/
│   │           └── page.tsx                  ← "/admin/settings" (System & OCR thresholds)
│   │
│   ├── (auth)/admin-login/                   ← Dedicated Admin Login Page ("/admin-login")
│   ├── (inspector)/                          ← FE-2 owns (Inspector workspace)
│   └── (landing)/                            ← FE-1 owns (Public landing & marketing)
│
├── components/
│   ├── admin/                                ← Admin-specific components
│   │   ├── layout/
│   │   │   ├── AdminShell.tsx                ← Admin sidebar + header + content
│   │   │   ├── AdminSidebar.tsx              ← Admin navigation sidebar
│   │   │   ├── AdminHeader.tsx               ← Top bar (admin badge, profile menu)
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── SystemStatsGrid.tsx           ← Total inspections, users, rules, etc.
│   │   │   ├── ComplianceRateCard.tsx        ← Overall compliance percentage
│   │   │   ├── InspectionTrendChart.tsx      ← Inspections over time
│   │   │   ├── ViolationHeatmap.tsx          ← Violations by category
│   │   │   ├── TopViolationsTable.tsx        ← Most common violations
│   │   │   ├── InspectorActivityTable.tsx    ← Inspector performance
│   │   │   ├── PendingReviewsCard.tsx        ← Items awaiting review
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── UserTable.tsx                 ← Sortable user data table with search
│   │   │   ├── UserFilters.tsx               ← Role filter, status filter, search
│   │   │   ├── UserDetailCard.tsx            ← User profile + inspection history
│   │   │   ├── InviteUserDialog.tsx          ← Invite/create new inspector dialog
│   │   │   └── index.ts
│   │   ├── rules/
│   │   │   ├── RuleTable.tsx                 ← All rules with status badges
│   │   │   ├── RuleFilters.tsx               ← Category, severity, active/inactive
│   │   │   ├── RuleForm.tsx                  ← Create / edit rule form with validation
│   │   │   ├── RuleVersionHistory.tsx        ← Version timeline component
│   │   │   ├── DeleteRuleDialog.tsx          ← Confirmation for destructive rule deletion
│   │   │   └── index.ts
│   │   ├── inspections/
│   │   │   ├── AllInspectionsTable.tsx        ← All inspectors' inspections
│   │   │   ├── InspectionFilters.tsx          ← Status, inspector, date, product
│   │   │   ├── InspectionDetailView.tsx       ← Read-only admin view
│   │   │   └── index.ts
│   │   ├── audit-logs/
│   │   │   ├── AuditLogTable.tsx             ← Audit log entries
│   │   │   ├── AuditLogFilters.tsx           ← User, action, entity, date range
│   │   │   ├── AuditLogDetailDialog.tsx      ← Full log entry detail
│   │   │   └── index.ts
│   │   ├── settings/
│   │   │   ├── SystemSettingsForm.tsx
│   │   │   ├── ConfidenceThresholdConfig.tsx
│   │   │   └── index.ts
│   │   ├── common/
│   │   │   ├── AdminPageHeader.tsx           ← Title + breadcrumb + actions
│   │   │   ├── AdminEmptyState.tsx
│   │   │   ├── ConfirmationDialog.tsx        ← Destructive action confirmation
│   │   │   ├── BulkActionBar.tsx             ← Bulk operations toolbar
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── shared/                               ← Shared design system (co-owned)
│       └── ui/
│
├── services/
│   ├── admin-dashboard-service.ts            ← Admin dashboard KPI metrics
│   ├── admin-user-service.ts                 ← User CRUD & approval actions
│   ├── admin-rule-service.ts                 ← Rule configuration & editing
│   ├── admin-inspection-service.ts           ← System-wide inspection review
│   ├── admin-audit-service.ts                ← Audit trail retrieval & stats
│   └── admin-settings-service.ts             ← System settings persistence
│
└── types/
    ├── admin.ts                              ← Admin UI & form types
    ├── audit-log.ts                          ← Audit event data types
    ├── rule.ts                               ← Rule configuration types
    └── legal-document.ts                     ← Legal document metadata types
```

---

## 3. Admin Pages — Functional Requirements

### 3.1 Admin Dashboard — `/admin/dashboard`

| ID | Requirement |
|---|---|
| ADASH-01 | System-wide stats: total inspections, total users, active rules, compliance rate |
| ADASH-02 | Inspection trend chart (daily/weekly/monthly) |
| ADASH-03 | Violation heatmap by category (MRP, Net Qty, Contact, etc.) |
| ADASH-04 | Top 5 most common violations table |
| ADASH-05 | Inspector activity table (inspections per inspector) |
| ADASH-06 | Pending reviews count with link |
| ADASH-07 | Recent system activity feed |
| ADASH-08 | Date range selector for all charts |
| ADASH-09 | Loading skeletons for all data sections |

### 3.2 User Management — `/admin/users`

| ID | Requirement |
|---|---|
| USR-01 | DataTable: name, email, role, status, last active, inspections count |
| USR-02 | Search by name or email |
| USR-03 | Filter by role (inspector / admin) |
| USR-04 | Filter by status (active / pending / inactive) |
| USR-05 | Sort by name, role, last active, inspections count |
| USR-06 | Pagination |
| USR-07 | Click row → `/admin/users/[id]` detail page |
| USR-08 | Invite new inspector button → InviteUserDialog |
| USR-09 | Approve pending inspector accounts directly from table |

### 3.3 User Detail — `/admin/users/[id]`

| ID | Requirement |
|---|---|
| USRD-01 | User profile information (name, email, role, created, badge, jurisdiction) |
| USRD-02 | Change user role dropdown |
| USRD-03 | Activate / deactivate toggle |
| USRD-04 | User's inspection history (recent inspections) |
| USRD-05 | User's activity statistics |
| USRD-06 | Confirmation dialog for destructive changes |
| USRD-07 | Cannot deactivate own account |

### 3.4 Rule Management — `/admin/rules`

| ID | Requirement |
|---|---|
| RULE-01 | DataTable: rule code, field, category, severity, status, legal ref, version |
| RULE-02 | Search by rule code, field name, or legal reference |
| RULE-03 | Filter by category (mandatory_declaration, format, placement, etc.) |
| RULE-04 | Filter by severity (LOW / MEDIUM / HIGH / CRITICAL) |
| RULE-05 | Filter by status (active / inactive / draft) |
| RULE-06 | Sort by rule code, severity, effective date |
| RULE-07 | "Create Rule" button → `/admin/rules/new` |
| RULE-08 | Click row → `/admin/rules/[id]` edit page |
| RULE-09 | Pagination |

### 3.5 Create / Edit Rule — `/admin/rules/new`, `/admin/rules/[id]`

| ID | Requirement |
|---|---|
| RULEF-01 | Form fields: rule code, field, category, severity, condition, validation logic |
| RULEF-02 | Form fields: legal reference, description, effective from, effective until |
| RULEF-03 | Form fields: applicable package types (multiselect), applicable categories |
| RULEF-04 | Form fields: exemptions (textarea/list) |
| RULEF-05 | Form fields: required (boolean toggle), is active (boolean toggle) |
| RULEF-06 | Zod validation on all fields |
| RULEF-07 | Preview mode: show how the rule would evaluate |
| RULEF-08 | Save as draft or publish |
| RULEF-09 | Version history sidebar (for edit) |
| RULEF-10 | Delete rule with confirmation dialog (edit only) |
| RULEF-11 | Prevent editing published rules — create new version instead |

### 3.6 Legal Documents — `/admin/legal-documents`

| ID | Requirement |
|---|---|
| DOC-01 | DataTable: document title, type, status, chunks count, uploaded date |
| DOC-02 | Status: Processing / Ready / Failed |
| DOC-03 | "Upload Document" button → `/admin/legal-documents/upload` |
| DOC-04 | Click row → detail card (metadata, chunk preview) |
| DOC-05 | Delete document with confirmation |
| DOC-06 | Re-process failed documents |

### 3.7 Upload Legal Document — `/admin/legal-documents/upload`

| ID | Requirement |
|---|---|
| DOCU-01 | PDF file upload (drag-drop or file picker) |
| DOCU-02 | Metadata form: title, document type, effective date, version |
| DOCU-03 | File size limit: 50MB |
| DOCU-04 | Upload progress indicator |
| DOCU-05 | On success: redirect to document list, show ingestion status |
| DOCU-06 | Error handling: invalid file type, size exceeded |

### 3.8 All Inspections — `/admin/inspections`

| ID | Requirement |
|---|---|
| AINSP-01 | DataTable of ALL inspections across all inspectors |
| AINSP-02 | Columns: ID, Product, Inspector, Status, Score, Date |
| AINSP-03 | Filter by inspector, status, date range |
| AINSP-04 | Search by inspection ID or product name |
| AINSP-05 | Sort by date, score, status |
| AINSP-06 | Click row → `/admin/inspections/[id]` (read-only detail view) |
| AINSP-07 | Export filtered results (CSV) |

### 3.9 Audit Logs — `/admin/audit-logs`

| ID | Requirement |
|---|---|
| AUD-01 | DataTable: timestamp, user, action, entity type, entity ID, IP |
| AUD-02 | Filter by user |
| AUD-03 | Filter by action type (login, inspection_created, rule_updated, etc.) |
| AUD-04 | Filter by entity type (inspection, rule, user, document) |
| AUD-05 | Filter by date range |
| AUD-06 | Click row → detail dialog with full JSON details |
| AUD-07 | Read-only — no edit/delete of audit logs |
| AUD-08 | Pagination (50 per page) |

### 3.10 Settings — `/admin/settings`

| ID | Requirement |
|---|---|
| SET-01 | Confidence threshold configuration (OCR, extraction, overall) |
| SET-02 | System-wide default settings |
| SET-03 | Save with confirmation |

---

## 4. Layout Architecture

### Admin Shell Layout

```tsx
// components/admin/layout/AdminShell.tsx

<div className="flex h-screen bg-slate-950 text-slate-100 antialiased">
  <AdminSidebar />              {/* Fixed left sidebar with brand logo, nav links & logout */}
  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
    <AdminHeader />             {/* Top navigation bar: title, admin badge, user menu */}
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      {children}
    </main>
  </div>
</div>
```

### Admin Sidebar Navigation

```
📊 Dashboard           → /admin/dashboard
👥 Users               → /admin/users
📋 Inspections         → /admin/inspections
⚖️ Rules               → /admin/rules
📝 Audit Logs          → /admin/audit-logs
⚙️ Settings            → /admin/settings
🚪 Logout              → signOut()
```

---

## 5. Admin Authentication & Route Protection

> **Admin accounts are provisioned exclusively via CLI scripts. No public admin registration form exists.**

### Admin Creation Flow

```
1. Run: npm run admin:create  (or: node scripts/manage-admin.js create)
2. Script prompts for: Admin Full Name, Email, Password
3. Script creates user in PostgreSQL via Prisma with role: "ADMIN", isVerified: true, isActive: true
4. Admin logs in via dedicated /admin-login page
5. Edge middleware validates role === "ADMIN" and grants access to /admin/*
```

### Route Protection (Edge Middleware)

Route protection is enforced before layout rendering via `frontend/src/middleware.ts`:

```typescript
// frontend/src/middleware.ts (excerpt)
if (isAdminRoute) {
  if (!token) {
    const loginUrl = new URL("/admin-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as string)?.toUpperCase();
  if (role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (token.isActive === false) {
    return NextResponse.redirect(new URL("/admin-login?error=account_deactivated", request.url));
  }

  return NextResponse.next();
}
```

---

## 6. Admin Design Principles

| Principle | Implementation |
|---|---|
| Dense data | Use compact tables, smaller font sizes, more data per row |
| Searchable | Every table has search functionality |
| Filterable | Multi-filter support on all list pages |
| Bulk operations | Checkbox selection + bulk action toolbar |
| Confirmations | Destructive actions require confirmation dialogs |
| Audit awareness | Show who/when for all modifications; auto-records to audit log |
| Version awareness | Rules show version history and revision dates |
| Read-only where needed | Admin can review all inspections but cannot alter inspector findings |

---

## 7. API Integration Points

All admin API calls map directly to `/api/admin/*` endpoints:

| Page | API Calls |
|---|---|
| Dashboard | `GET /api/admin/dashboard` |
| Users | `GET /api/admin/users`, `POST /api/admin/users/[id]/approve`, `PATCH /api/admin/users/[id]`, `DELETE /api/admin/users/[id]` |
| User Detail | `GET /api/admin/users/[id]` |
| Rules | `GET /api/admin/rules`, `POST /api/admin/rules`, `PATCH /api/admin/rules/[id]`, `DELETE /api/admin/rules/[id]` |
| Inspections | `GET /api/admin/inspections`, `GET /api/admin/inspections/[id]` |
| Audit Logs | `GET /api/admin/audit-logs`, `GET /api/admin/audit-logs/stats` |
| Settings | `GET /api/admin/settings`, `PATCH /api/admin/settings` |

---

## 8. Ownership Rules

| Rule | Detail |
|---|---|
| FE-3 owns | `(admin)/`, `components/admin/`, admin services, admin types |
| FE-3 co-owns | `components/shared/` (design system primitives) |
| FE-3 must NOT | Import from `components/landing/` or `components/inspector/` |
| FE-3 must NOT | Create inspector-specific scan/review pages |
| Branch pattern | `feature/admin-*` (e.g., `feature/admin-users`, `feature/admin-rules`) |
