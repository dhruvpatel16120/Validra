/**
 * Dashboard types — aligned with backend GET /api/dashboard response.
 */

export interface UserDashboardStats {
  total_scans: number;
  compliant_scans: number;
  flagged_scans: number;
  compliance_rate: number;
  scans_today: number;
}

export interface ViolationBreakdownRaw {
  field_name: string;
  clause_reference?: string | null;
  count: number;
}

export type ViolationSeverity = "high" | "medium" | "low";

export interface ViolationBreakdownItem {
  category: string;
  count: number;
  percentage: number;
  severity: ViolationSeverity;
}

export interface ComplianceTrendPoint {
  date: string;
  complianceRate: number;
  inspectionsCount: number;
}

export interface DashboardStatData {
  id: string;
  label: string;
  value: string | number;
  description: string;
  variant: "primary" | "warning" | "success" | "error";
}

export interface RecentScanItem {
  id: string;
  code: string;
  productName: string;
  status: string;
  statusKey: string;
  date: string;
  score: number;
  violations: number;
}

export interface DashboardData {
  stats: UserDashboardStats;
  statCards: DashboardStatData[];
  recentScans: RecentScanItem[];
  complianceTrends: ComplianceTrendPoint[];
  violationBreakdown: ViolationBreakdownItem[];
}
