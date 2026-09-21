/**
 * Violation-report types — mirror the /api/reports endpoints.
 *
 * A report is a deliberate escalation of a flagged scan with its own review
 * lifecycle, so it is distinct from a scan.
 */

export type ReportStatus = "submitted" | "under_review" | "resolved" | "dismissed";

export const REPORT_STATUSES: ReportStatus[] = [
  "submitted",
  "under_review",
  "resolved",
  "dismissed",
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export interface ReportViolation {
  rule_id: number | null;
  field_name: string | null;
  clause_reference: string | null;
  description: string | null;
  extracted_value: string | null;
}

export interface ReportItem {
  report_id: string;
  scan_id: string;
  reported_by: string | null;
  status: ReportStatus;
  notes: string | null;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
  product_name: string | null;
  brand: string | null;
  category: string | null;
  violations: ReportViolation[];
}

export interface ReportListResponse {
  items: ReportItem[];
  total: number;
}

export interface ReportFileResponse {
  report_id: string;
  scan_id: string;
  status: string;
  violations: ReportViolation[];
  email_sent: boolean;
  created_at: string;
  updated_at: string;
  product_name: string | null;
  brand: string | null;
  category: string | null;
}

export type ReportListItem = ReportItem;
export type ReportDetail = ReportItem;
