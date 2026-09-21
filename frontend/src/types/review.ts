/**
 * Compliance-review view models for a single scan.
 *
 * Derived entirely from GET /api/scans/{scan_id}: each rule result becomes either a
 * passed check, an applicable violation ("finding"), or an intentionally
 * skipped check (an exemption, e.g. FSSAI on a non-food product).
 */

import type { ScanStatus } from "./scan";

export type FindingSeverity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  title: string;
  severity: FindingSeverity;
  detectedIssue: string;
  relatedField: string;
  ruleReference: string;
  explanation: string;
  evidenceSnippet?: string;
}

export type ExtractedFieldStatus = "verified" | "missing" | "skipped";

export interface ExtractedField {
  id: string;
  label: string;
  value: string | null;
  confidence: number | null;
  isMandatory: boolean;
  status: ExtractedFieldStatus;
  clauseReference: string;
  ruleReference?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: "original" | "processed" | "annotated";
  imageUrl: string;
  description: string;
}

export interface ReviewCounts {
  passed: number;
  violations: number;
  skipped: number;
  total: number;
}

export interface ReviewData {
  scanId: string;
  productName: string;
  brand: string | null;
  category: string;
  status: ScanStatus;
  /** 0-100 share of applicable checks that passed. */
  complianceScore: number;
  counts: ReviewCounts;
  extractedFields: ExtractedField[];
  evidenceImages: EvidenceItem[];
  findings: Finding[];
  scannedAt: string;
}
