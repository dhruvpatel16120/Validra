"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/inspector/common";
import {
  InspectionFilters,
  InspectionTable,
} from "@/components/inspector/inspections";
import { inspectionService } from "@/services/inspection-service";
import { getUserFriendlyErrorMessage } from "@/services/api";
import {
  InspectionFilterState,
  InspectionListItem,
  InspectionPaginationState,
} from "@/types/inspection";

const VALID_STATUSES = ["compliant", "flagged", "pending"] as const;

function parseStatusParam(value: string | null): InspectionFilterState["status"] {
  return value && (VALID_STATUSES as readonly string[]).includes(value)
    ? (value as InspectionFilterState["status"])
    : "all";
}

function InspectionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial filter values from URL params
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = parseStatusParam(searchParams.get("status"));
  const initialCategory = searchParams.get("category") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [filters, setFilters] = React.useState<InspectionFilterState>({
    search: initialSearch,
    status: initialStatus,
    category: initialCategory,
  });

  const [page, setPage] = React.useState<number>(initialPage || 1);
  const [items, setItems] = React.useState<InspectionListItem[]>([]);
  const [pagination, setPagination] = React.useState<InspectionPaginationState>({
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync URL search parameters whenever filters or page changes
  const updateUrl = React.useCallback(
    (newFilters: InspectionFilterState, newPage: number) => {
      const params = new URLSearchParams();
      if (newFilters.search.trim()) params.set("search", newFilters.search.trim());
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newFilters.category && newFilters.category !== "all") params.set("category", newFilters.category);
      if (newPage > 1) params.set("page", String(newPage));

      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const handleRetry = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await inspectionService.getInspections(filters, page, 5);
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err: unknown) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  React.useEffect(() => {
    let isMounted = true;

    inspectionService
      .getInspections(filters, page, 5)
      .then((result) => {
        if (isMounted) {
          setItems(result.items);
          setPagination(result.pagination);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(getUserFriendlyErrorMessage(err));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filters, page]);

  const handleFilterChange = (newFilters: InspectionFilterState) => {
    setFilters(newFilters);
    setPage(1);
    setIsLoading(true);
    updateUrl(newFilters, 1);
  };

  const handleResetFilters = () => {
    const resetState: InspectionFilterState = {
      search: "",
      status: "all",
      category: "all",
    };
    setFilters(resetState);
    setPage(1);
    setIsLoading(true);
    updateUrl(resetState, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setIsLoading(true);
    updateUrl(filters, newPage);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Inspections"
        description="Search, filter, and review completed product package audits and compliance records."
      />

      {/* Filter and Search Bar */}
      <InspectionFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* State Transitions: Loading -> Error -> Empty -> Results Table */}
      {isLoading ? (
        <LoadingState message="Loading inspection records..." />
      ) : error ? (
        <ErrorState
          title="Unable to load inspections"
          description={error}
          onRetry={handleRetry}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No inspections match your criteria"
          description="Try adjusting your search keywords or status filter to locate audits."
        />
      ) : (
        <InspectionTable
          items={items}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default function InspectionsPage() {
  return (
    <React.Suspense fallback={<LoadingState message="Initializing inspections..." />}>
      <InspectionsContent />
    </React.Suspense>
  );
}
