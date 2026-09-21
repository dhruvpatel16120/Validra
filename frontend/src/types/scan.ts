/** Scan types - mirror the FastAPI /api/scans, POST /api/scans and GET /api/scans/{id} responses. */

export type ScanStatus = "compliant" | "flagged" | "pending" | "processing" | "needs_review";

export const CATEGORIES = ["general", "food", "cosmetic", "pharma", "seeds"] as const;
export type ScanCategory = (typeof CATEGORIES)[number];

export interface ScanResultRule {
  rule_id: number;
  field_name: string | null;
  clause_reference: string | null;
  description?: string | null;
  extracted_value: string | null;
  is_applicable: boolean;
  is_compliant: boolean | null;
}

export interface ImageMetadata {
  image_id: string;
  panel_index?: number;
  type: string;
  storage_path: string;
  url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  image_hash?: string | null;
  created_at: string;
}

/** Response of POST /api/scans. */
export interface ScanUploadResponse {
  scan_id: string;
  image_id?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  image_hash?: string | null;
  product_name?: string | null;
  brand?: string | null;
  category?: string;
  overall_status: string;
  status: string;
  ocr?: Record<string, unknown> | null;
  images: ImageMetadata[];
  results: ScanResultRule[];
  scanned_at: string;
  created_at: string;
}

/** A summary item from GET /api/scans (list endpoint). */
export interface ScanSummary {
  scan_id: string;
  product_name: string | null;
  brand: string | null;
  category: string;
  status: string;
  overall_status: string;
  compliance_score: number | null;
  violations_count: number;
  passed_count: number;
  skipped_count: number;
  created_at: string;
}

export interface ScanListResponse {
  items: ScanSummary[];
  total: number;
}

export interface ScanRuleCounts {
  violations: number;
  passed: number;
  skipped: number;
}

/** Response of GET /api/scans/{scan_id}. */
export interface ScanDetailResponse {
  scan_id: string;
  product_name: string | null;
  brand: string | null;
  category: string;
  status: string;
  overall_status: string;
  compliance_score: number | null;
  inspector_remarks: string | null;
  created_at: string;
  completed_at: string | null;
  images: ImageMetadata[];
  results: ScanResultRule[];
}

export type ScanUploadState = "idle" | "uploading" | "complete" | "error";

/** Share of applicable checks that passed, as a 0-100 score. */
export function complianceScore(counts: ScanRuleCounts): number {
  const applicable = counts.passed + counts.violations;
  if (!applicable) return counts.skipped > 0 ? 100 : 0;
  return Math.round((counts.passed / applicable) * 100);
}

/** Human-friendly short code for a scan id, e.g. "SCAN-1A2B3C". */
export function scanCode(scanId: string): string {
  return `SCAN-${scanId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
