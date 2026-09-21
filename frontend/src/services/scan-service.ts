/**
 * Scan service - the real OCR/LLM/rule-engine pipeline.
 *
 * POST /api/scans          run a compliance check over 1-4 label photos
 * GET  /api/scans          the signed-in user's own history
 * GET  /api/scans/{id}     one scan with per-rule results and evidence images
 * POST /api/reports        escalate a flagged scan
 */

import { apiClient, apiUpload } from "./api";
import type { ScanDetailResponse, ScanListResponse, ScanUploadResponse } from "@/types/scan";
import type { ReportFileResponse } from "@/types/report";

export const SCAN_ENDPOINTS = {
  UPLOAD: "/api/scans",
  MINE: "/api/scans",
  DETAIL: (id: string) => `/api/scans/${id}`,
  REPORT: "/api/reports",
} as const;

/** OCR + LLM + rule checking takes several seconds; allow a long timeout. */
const SCAN_TIMEOUT_MS = 180_000;

export interface ScanHistoryQuery {
  limit?: number;
  status?: string;
  category?: string;
}

class ScanService {
  /**
   * Upload 1-4 label photos for OCR extraction and compliance checking.
   * Sent as multipart/form-data under the `images` field.
   */
  async uploadScan(files: File | File[]): Promise<ScanUploadResponse> {
    const fileList = Array.isArray(files) ? files : [files];
    if (!fileList.length) {
      throw new Error("Select at least one photo of the product label.");
    }

    const formData = new FormData();
    fileList.slice(0, 4).forEach((file) => {
      formData.append("images", file);
    });

    return apiUpload<ScanUploadResponse>(SCAN_ENDPOINTS.UPLOAD, formData, {
      signal: AbortSignal.timeout(SCAN_TIMEOUT_MS),
    });
  }

  /** Full detail for one scan: record, per-rule results, evidence images. */
  async getScanById(scanId: string): Promise<ScanDetailResponse> {
    return apiClient.get<ScanDetailResponse>(SCAN_ENDPOINTS.DETAIL(scanId));
  }

  /** The signed-in user's own scan history, newest first. */
  async listMyScans(query: ScanHistoryQuery = {}): Promise<ScanListResponse> {
    const params = new URLSearchParams();
    if (query.limit) params.set("limit", String(query.limit));
    if (query.status && query.status !== "all") params.set("status", query.status);
    if (query.category && query.category !== "all") params.set("category", query.category);

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<ScanListResponse>(`${SCAN_ENDPOINTS.MINE}${suffix}`);
  }

  /** File a violation report for a flagged scan with Consumer Affairs. */
  async reportViolation(scanId: string): Promise<ReportFileResponse> {
    return apiClient.post<ReportFileResponse>(SCAN_ENDPOINTS.REPORT, { scan_id: scanId });
  }
}

export const scanService = new ScanService();
