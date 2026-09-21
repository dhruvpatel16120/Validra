"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/inspector/common";
import { ReportViewer } from "@/components/inspector/reports";
import { reportService } from "@/services/report-service";
import { getUserFriendlyErrorMessage } from "@/services/api";
import { ReportItem } from "@/types/report";
import { Button } from "@/components/shared/ui/button";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const resolvedParams = React.use(params);
  const reportId = resolvedParams.id;

  const [report, setReport] = React.useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;

    reportService
      .getReportById(reportId)
      .then((data) => {
        if (!isMounted) return;
        setReport(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(getUserFriendlyErrorMessage(err));
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reportId, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Violation Report"
        description={
          report
            ? `Report reference: ${report.report_id}`
            : `Report reference: ${reportId}`
        }
        actions={
          <Link href="/reports">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Reports</span>
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Loading violation report..." />
        </div>
      ) : error || !report ? (
        <div className="py-8 max-w-lg mx-auto">
          <ErrorState
            title="Violation Report Not Found"
            description={error || "The specified report reference could not be located."}
            onRetry={handleRetry}
            action={
              <div className="flex items-center gap-3">
                <Link href="/reports">
                  <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Reports</span>
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs"
                >
                  Try Again
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <ReportViewer report={report} />
      )}
    </div>
  );
}
