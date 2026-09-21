/**
 * Scan-history service.
 *
 * The UI calls these "inspections"; the backend calls them "scans". This maps
 * the real GET /api/scans response into the presentation shape used by the
 * inspection table and detail views.
 */

import { scanService } from "./scan-service";
import { complianceScore, scanCode, type ScanSummary } from "@/types/scan";
import type {
  InspectionDetail,
  InspectionFilterState,
  InspectionListItem,
  InspectionPaginationState,
} from "@/types/inspection";

export function toInspectionListItem(scan: ScanSummary): InspectionListItem {
  const score = complianceScore({
    passed: scan.passed_count ?? 0,
    violations: scan.violations_count ?? 0,
    skipped: scan.skipped_count ?? 0,
  });

  return {
    id: scan.scan_id,
    code: scanCode(scan.scan_id),
    productName: scan.product_name || "Unidentified product",
    brand: scan.brand,
    category: scan.category || "general",
    status: scan.overall_status,
    date: formatScanDate(scan.created_at),
    scannedAt: scan.created_at,
    score,
    scanId: scan.scan_id,
    violations: scan.violations_count ?? 0,
    passed: scan.passed_count ?? 0,
    skipped: scan.skipped_count ?? 0,
    imageUrl: null,
  };
}

export function formatScanDate(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

class InspectionService {
  /**
   * The user's own scan history, filtered and paginated client-side.
   *
   * Filtering/pagination happens here rather than on the server so the status
   * and category filters can be applied against the same loaded snapshot.
   */
  async getInspections(
    filters: InspectionFilterState = { search: "", status: "all", category: "all" },
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ items: InspectionListItem[]; pagination: InspectionPaginationState }> {
    const response = await scanService.listMyScans({ limit: 100 });
    let items = (response.items || []).map(toInspectionListItem);

    const query = filters.search.trim().toLowerCase();
    if (query) {
      items = items.filter(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          (item.brand || "").toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    if (filters.status && filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters.category && filters.category !== "all") {
      items = items.filter((item) => item.category === filters.category);
    }

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      pagination: { currentPage, pageSize, totalItems, totalPages },
    };
  }

  /** Full detail for one scan, shaped for the inspection detail view. */
  async getInspectionById(scanId: string): Promise<InspectionDetail> {
    const detail = await scanService.getScanById(scanId);

    const violations = detail.results.filter((r) => r.is_applicable && r.is_compliant === false).length;
    const passed = detail.results.filter((r) => r.is_applicable && r.is_compliant === true).length;
    const skipped = detail.results.filter((r) => !r.is_applicable).length;

    const base: InspectionListItem = {
      id: detail.scan_id,
      code: scanCode(detail.scan_id),
      productName: detail.product_name || "Unidentified product",
      brand: detail.brand,
      category: detail.category || "general",
      status: detail.overall_status,
      date: formatScanDate(detail.created_at),
      scannedAt: detail.created_at,
      score: complianceScore({ violations, passed, skipped }),
      scanId: detail.scan_id,
      violations,
      passed,
      skipped,
      imageUrl: detail.images?.[0]?.url ?? null,
    };

    const imageUrls = (detail.images || []).map((img) =>
      img.url
        ? img.url.startsWith("http")
          ? img.url
          : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}${img.url}`
        : ""
    );

    return {
      ...base,
      results: detail.results ?? [],
      images: imageUrls,
      rawOcrText: null,
    };
  }

  /** Download inspection PDF report certificate. */
  async downloadInspectionPdf(inspectionId: string): Promise<void> {
    const { API_BASE_URL, getAuthToken } = await import("./api");
    const token = getAuthToken();
    const url = `${API_BASE_URL}/api/inspections/${inspectionId}/pdf`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to generate inspection PDF certificate.");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `validra_inspection_${inspectionId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }
}

export const inspectionService = new InspectionService();

