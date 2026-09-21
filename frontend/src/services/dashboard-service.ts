/**
 * Dashboard service - GET /api/dashboard, scoped to the signed-in user.
 *
 * The backend returns raw aggregates; this maps them into the presentation
 * shapes the dashboard cards and charts consume.
 */

import { apiClient } from "./api";
import type {
  ComplianceTrendPoint,
  DashboardData,
  DashboardStatData,
  RecentScanItem,
  ViolationBreakdownItem,
  ViolationBreakdownRaw,
} from "@/types/dashboard";

export const DASHBOARD_ENDPOINTS = {
  SUMMARY: "/api/dashboard",
} as const;

interface RecentScanRaw {
  scan_id: string;
  product_name: string | null;
  brand: string | null;
  overall_status: string;
  created_at: string;
}

interface ComplianceTrendRaw {
  date: string;
  total_scans: number;
  compliant_scans: number;
  flagged_scans: number;
}

interface DashboardResponse {
  total_scans: number;
  compliant_scans: number;
  flagged_scans: number;
  compliance_rate: number;
  scans_today: number;
  top_violations: ViolationBreakdownRaw[];
  trend: ComplianceTrendRaw[];
  recent_scans: RecentScanRaw[];
}

function severityFor(percentage: number): ViolationBreakdownItem["severity"] {
  if (percentage >= 40) return "high";
  if (percentage >= 20) return "medium";
  return "low";
}

function buildStats(raw: DashboardResponse): DashboardStatData[] {
  return [
    {
      id: "total-scans",
      label: "Total Scans",
      value: raw.total_scans,
      description: "Labels checked",
      variant: "primary",
    },
    {
      id: "compliant",
      label: "Compliant",
      value: raw.compliant_scans,
      description: "Passed every applicable rule",
      variant: "success",
    },
    {
      id: "flagged",
      label: "Flagged",
      value: raw.flagged_scans,
      description: "Missing declarations",
      variant: "error",
    },
    {
      id: "scans-today",
      label: "Scans Today",
      value: raw.scans_today,
      description: `${raw.compliance_rate}% compliance rate`,
      variant: "warning",
    },
  ];
}

function buildRecentScans(scans: RecentScanRaw[]): RecentScanItem[] {
  return scans.map((scan) => ({
    id: scan.scan_id,
    code: `SCAN-${scan.scan_id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    productName: scan.product_name || "Unidentified product",
    status:
      scan.overall_status === "compliant"
        ? "Compliant"
        : scan.overall_status === "flagged"
          ? "Flagged"
          : "Pending",
    date: scan.created_at
      ? new Date(scan.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })
      : "—",
    score: 0,
    violations: 0,
    statusKey: scan.overall_status,
  }));
}

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    const raw = await apiClient.get<DashboardResponse>(DASHBOARD_ENDPOINTS.SUMMARY);

    const complianceTrends: ComplianceTrendPoint[] = (raw.trend || []).map((point) => ({
      date: point.date,
      complianceRate: point.total_scans ? Math.round((point.compliant_scans / point.total_scans) * 100) : 0,
      inspectionsCount: point.total_scans,
    }));

    const totalViolations = (raw.top_violations || []).reduce((s, v) => s + v.count, 0);
    const violationBreakdown: ViolationBreakdownItem[] = (raw.top_violations || []).map(
      (item) => {
        const pct = totalViolations ? Math.round((item.count / totalViolations) * 100) : 0;
        return {
          category: humanizeField(item.field_name),
          count: item.count,
          percentage: pct,
          severity: severityFor(pct),
        };
      }
    );

    return {
      stats: {
        total_scans: raw.total_scans,
        compliant_scans: raw.compliant_scans,
        flagged_scans: raw.flagged_scans,
        compliance_rate: raw.compliance_rate,
        scans_today: raw.scans_today,
      },
      recentScans: buildRecentScans(raw.recent_scans || []),
      complianceTrends,
      violationBreakdown,
      statCards: buildStats(raw),
    };
  }
}

const FIELD_LABELS: Record<string, string> = {
  manufacturer_address: "Manufacturer / Packer Address",
  commodity_name: "Commodity Name",
  net_quantity: "Net Quantity",
  mfg_date: "Date of Manufacture",
  mrp: "Maximum Retail Price",
  consumer_care: "Consumer Care Details",
  fssai_number: "FSSAI Licence Number",
  language: "Language Declaration",
  dimensions: "Dimensions",
};

/** Turn a rule's field_name into a readable label. */
export function humanizeField(field: string): string {
  return FIELD_LABELS[field] || field.replace(/_/g, " ");
}

export const dashboardService = new DashboardService();
