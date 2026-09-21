import * as React from "react";
import Link from "next/link";
import { FileWarning, ScanLine } from "lucide-react";
import { ReportItem } from "@/types/report";
import { ReportCard } from "./ReportCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/inspector/common";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

export interface ReportListProps {
  reports: ReportItem[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * ReportList component handling loading, error, empty, and responsive report card grid rendering.
 */
export function ReportList({
  reports,
  isLoading,
  error,
  onRetry,
  className,
}: ReportListProps) {
  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading your violation reports..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 max-w-lg mx-auto">
        <ErrorState
          title="Unable to load your violation reports"
          description={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="py-8 max-w-lg mx-auto">
        <EmptyState
          icon={FileWarning}
          title="You have not reported any violations yet"
          description="When a scan flags a non-compliant product, you can escalate it to Consumer Affairs and track its review status and official PDF certificates here."
          action={
            <Link href="/scan/new">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Start a scan</span>
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
        className
      )}
    >
      {reports.map((report) => (
        <ReportCard key={report.report_id} report={report} />
      ))}
    </div>
  );
}
