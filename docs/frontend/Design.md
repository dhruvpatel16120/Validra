# Validra — UI/UX & System Design Specifications

## 1. UI Architecture & Design System

Validra frontend is built using **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui** components.

### 1.1 Core Frontend Scope & Tree Structure

```text
Validra Frontend
│
├── Landing
│
├── Auth
│   ├── Login
│   └── Forgot Password
│
├── Inspector Portal
│   ├── Dashboard
│   ├── New Inspection
│   ├── Processing
│   ├── Results
│   ├── Review
│   ├── Evidence
│   ├── History
│   └── Reports
│
└── Admin Portal
    ├── Dashboard
    ├── Inspections
    ├── Analytics
    ├── Users
    ├── Rules
    ├── Legal Documents
    ├── Reports
    ├── Audit Logs
    └── Settings
```

### 1.2 Route Layout Implementation
```text
frontend/app/
│
├── (public)/                 # Landing & Information
│   ├── page.tsx              # Home / Overview
│   ├── problem/page.tsx      # Problem Statement (SIH 26034)
│   ├── solution/page.tsx     # Solution & Workflow
│   ├── features/page.tsx     # System Features
│   ├── how-it-works/page.tsx # Interactive Pipeline Diagram
│   ├── about/page.tsx        # Team VisionMinds
│   └── contact/page.tsx      # Contact & FAQ
│
├── (auth)/                   # Authentication Pages
│   ├── login/page.tsx        # NextAuth Login
│   ├── forgot-password/      # Password Reset via Nodemailer
│   └── verify/page.tsx       # Email Verification
│
├── (inspector)/              # Inspector Portal (M1)
│   ├── dashboard/page.tsx    # Inspection Overview & Quick Scan
│   ├── new-inspection/       # Image Upload & Capture
│   ├── processing/page.tsx   # OCR Processing Status
│   ├── results/page.tsx      # Raw AI Findings
│   ├── review/page.tsx       # Dedicated Review Inspection Page ⭐
│   ├── evidence/page.tsx     # Bounding Box Spatial Evidence Viewer
│   ├── history/page.tsx      # Past Inspection Search
│   └── reports/page.tsx      # PDF Report Download
│
└── (admin)/                  # Admin Portal (M1)
    ├── dashboard/page.tsx    # Enforcement Analytics
    ├── inspections/page.tsx  # Inspection Oversight
    ├── analytics/page.tsx    # Compliance Trends
    ├── users/page.tsx        # User Management & RBAC
    ├── rules/page.tsx        # Rule Engine Configurator
    ├── legal-docs/page.tsx   # RAG Legal Ingestion Management
    ├── reports/page.tsx      # System-wide Reports
    ├── audit-logs/page.tsx   # Security Audit Trails
    └── settings/page.tsx     # System Configuration
```

---

## 2. Dedicated Review Inspection UX Specification

The **Review Inspection** page is a core component of Validra's human-in-the-loop design:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ VALIDRA Inspector Portal — Inspection Review (#INS-000124)             │
├──────────────────────────────────────┬─────────────────────────────────┤
│ 📷 Product Package Evidence          │ 📋 AI Findings & Evidence Check │
│                                      │                                 ┤
│ ┌──────────────────────────────────┐ │ MRP: ₹150.00 (Incls. taxes)     │
│ │ [Bounding Box 1: MRP]            │ │ Status: ✅ COMPLIANT            │
│ │ [Bounding Box 2: Net Qty]        │ │ Confidence: 96%                │
│ │ [Bounding Box 3: Mfg Date]       │ │                                 │
│ └──────────────────────────────────┘ │ Net Qty: 500 g                  │
│                                      │ Status: ⚠️ NEEDS REVIEW          │
│ Zoom: [ + ] [ - ] [ Reset ]          │ Reason: Unit abbreviation format│
│ Toggle Bounding Boxes: [ ON ]        │                                 │
│                                      │ Legal Provision (RAG):          │
│                                      │ Rule 6(1)(e) - Standard Units   │
├──────────────────────────────────────┴─────────────────────────────────┤
│ Inspector Action:                                                       │
│ [ Accept All ]   [ Modify Finding ]   [ Reject Finding ]                │
│                                                                        │
│ Remarks: [ Inspector comments / evidence notes                       ] │
│                                                                        │
│ [ 📄 Finalize & Generate PDF Report ]                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Design Principles (Next.js)

1. **Server Components First**: Use Server Components for data fetching, static landing pages, and initial portal renders to minimize bundle size.
2. **Client Components Only When Needed**: Use `"use client"` exclusively for interactive components (image bounding box viewer, file dropzone, interactive review forms).
3. **Reusability & Modularity**: Keep UI components small, modular, and typed using TypeScript interfaces.
4. **Fast Response Times**: Use optimized image components (`next/image`), dynamic imports, and skeleton loaders.
