/**
 * Violation-report service - the user's own filed reports.
 *
 * GET /api/reports           list the caller's reports
 * GET /api/reports/{id}      one report
 * POST /api/reports          file a new one (see scan-service.reportViolation)
 * GET /api/reports/{id}/pdf  download PDF report
 */

import { apiClient, API_BASE_URL, getAuthToken } from "./api";
import type { ReportFileResponse, ReportItem, ReportListResponse } from "@/types/report";

export const REPORT_ENDPOINTS = {
  LIST: "/api/reports",
  DETAIL: (id: string) => `/api/reports/${id}`,
  FILE: "/api/reports",
  PDF: (id: string) => `/api/reports/${id}/pdf`,
} as const;

class ReportService {
  async getReports(status?: string): Promise<ReportItem[]> {
    const suffix = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    const response = await apiClient.get<ReportListResponse>(`${REPORT_ENDPOINTS.LIST}${suffix}`);
    return response.items || [];
  }

  async getReportById(reportId: string): Promise<ReportItem> {
    return apiClient.get<ReportItem>(REPORT_ENDPOINTS.DETAIL(reportId));
  }

  async fileReport(scanId: string): Promise<ReportFileResponse> {
    return apiClient.post<ReportFileResponse>(REPORT_ENDPOINTS.FILE, { scan_id: scanId });
  }

  /** Download PDF report — opens in a new tab or triggers download. */
  async downloadReportPdf(reportId: string): Promise<void> {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${REPORT_ENDPOINTS.PDF(reportId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF report. Please try again.");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `validra-report-${reportId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }
}

export const reportService = new ReportService();
