/**
 * Scan-history ("Inspections") view models.
 *
 * The backend calls these "scans"; the UI presents them as inspections.
 * This is the presentation shape derived from the real API.
 */

import type { ScanResultRule, ScanStatus } from "./scan";

export type InspectionStatusType = "all" | ScanStatus;

export interface InspectionListItem {
  id: string;
  /** Display code, e.g. "SCAN-1A2B3C". */
  code: string;
  productName: string;
  brand: string | null;
  category: string;
  status: string;
  /** Pre-formatted date for display. */
  date: string;
  /** ISO timestamp from the API. */
  scannedAt: string;
  /** 0-100 share of applicable checks that passed. */
  score: number;
  scanId: string;
  violations: number;
  passed: number;
  skipped: number;
  imageUrl: string | null;
}

export interface InspectionFilterState {
  search: string;
  status: "all" | ScanStatus;
  category: string;
}

export interface InspectionPaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface InspectionDetail extends InspectionListItem {
  results: ScanResultRule[];
  images: string[];
  rawOcrText: string | null;
}

export const DEFAULT_INSPECTION_FILTERS: InspectionFilterState = {
  search: "",
  status: "all",
  category: "all",
};
