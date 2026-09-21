"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import { ReportItem, ReportStatus, REPORT_STATUS_LABELS } from "@/types/report";
import { scanCode } from "@/types/scan";
import { formatScanDate } from "@/services/inspection-service";
import { reportService } from "@/services/report-service";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

export interface ReportCardProps {
  report: ReportItem;
  className?: string;
}

/** Short human-readable code for a report id, e.g. "REP-1A2B3C". */
export function reportCode(reportId: string): string {
  return `REP-${reportId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/**
 * Status pill for a filed violation report, using the real review lifecycle.
 */
export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const label = REPORT_STATUS_LABELS[status] ?? status;

  if (status === "resolved") {
    return (
      <Badge variant="success" className="gap-1 text-xs">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </Badge>
    );
  }

  if (status === "under_review") {
    return (
      <Badge variant="warning" className="gap-1 text-xs">
        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </Badge>
    );
  }

  if (status === "dismissed") {
    return (
      <Badge variant="default" className="gap-1 text-xs">
        <XCircle className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Clock className="w-3 h-3" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}

/**
 * ReportCard component presenting one violation report the signed-in user
 * filed with Consumer Affairs.
 */
export function ReportCard({ report, className }: ReportCardProps) {
  const productName = report.product_name || "Unidentified product";
  const brand = report.brand;
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      await reportService.downloadReportPdf(report.report_id);
    } catch {
      alert("Unable to generate PDF report. Please verify connection to the server.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article
      aria-labelledby={`report-title-${report.report_id}`}
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 hover:shadow-sm transition-all",
        className
      )}
    >
      <div className="space-y-3">
        {/* Header with Reference and Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              #{reportCode(report.report_id)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-400">
              {scanCode(report.scan_id)}
            </span>
          </div>

          <ReportStatusBadge status={report.status} />
        </div>

        {/* Product Name and Brand */}
        <div>
          <h3
            id={`report-title-${report.report_id}`}
            className="text-base font-semibold text-slate-900 leading-snug"
          >
            {productName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            Brand: <span className="text-slate-700 font-medium">{brand || "Unspecified"}</span>
          </p>
        </div>

        {/* Metadata items */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Filed: {formatScanDate(report.created_at)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="font-mono">
              {report.violations?.length || 0}{" "}
              {(report.violations?.length || 0) === 1 ? "violation" : "violations"}
            </span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="h-8 px-2.5 text-xs text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 gap-1.5 cursor-pointer"
          title="Download official ReportLab PDF certificate"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : (
            <Download className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>PDF Report</span>
        </Button>

        <Link href={`/reports/${report.report_id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
