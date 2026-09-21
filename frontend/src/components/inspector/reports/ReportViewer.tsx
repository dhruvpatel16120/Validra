"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileCheck2,
  Calendar,
  UserCheck,
  Tag,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
  ImageOff,
  FileWarning,
  Download,
  Loader2,
} from "lucide-react";
import { ReportItem, ReportViolation } from "@/types/report";
import { scanCode } from "@/types/scan";
import { formatScanDate } from "@/services/inspection-service";
import { reportService } from "@/services/report-service";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { reportCode, ReportStatusBadge } from "./ReportCard";
import { cn } from "@/lib/utils";

export interface ReportViewerProps {
  report: ReportItem;
  className?: string;
}

function ScanStatusBadge({ status }: { status: string | null }) {
  if (status === "compliant") {
    return (
      <Badge variant="success" className="gap-1 text-xs">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Compliant</span>
      </Badge>
    );
  }

  if (status === "flagged") {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Flagged</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{status === "pending" ? "Pending" : "Unknown"}</span>
    </Badge>
  );
}

function ViolationCard({ violation }: { violation: ReportViolation }) {
  return (
    <article
      aria-label={`Violation: ${violation.field_name || "unspecified field"}`}
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs",
        "border-l-4 border-l-rose-500"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            {violation.field_name || "Unspecified field"}
          </span>
          {violation.clause_reference && (
            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
              <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{violation.clause_reference}</span>
            </div>
          )}
        </div>

        <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
          <XCircle className="w-3 h-3" aria-hidden="true" />
          <span>Violation</span>
        </Badge>
      </div>

      {violation.description && (
        <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wide">
            Reported condition:
          </span>
          <p className="leading-relaxed">{violation.description}</p>
        </div>
      )}

      <div className="text-[11px] font-mono text-slate-500 border-t border-slate-100 pt-2.5 break-words">
        <span className="text-slate-400">Extracted value: </span>
        <span className="text-slate-700">
          {violation.extracted_value === null || violation.extracted_value === ""
            ? "—"
            : violation.extracted_value}
        </span>
      </div>
    </article>
  );
}

/**
 * ReportViewer component displaying one violation report filed with Consumer
 * Affairs: status, scanned product, evidence, violations list, and PDF download.
 */
export function ReportViewer({ report, className }: ReportViewerProps) {
  const productName = report.product_name || "Unidentified product";
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPdf = async () => {
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
    <div className={cn("space-y-6 sm:space-y-8", className)}>
      {/* Report Header */}
      <section
        aria-label="Violation report summary"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6" aria-hidden="true" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">
                  Report #{reportCode(report.report_id)}
                </span>
                <ReportStatusBadge status={report.status} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {productName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filed {formatScanDate(report.created_at)} for scan{" "}
                {scanCode(report.scan_id)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF Certificate</span>
            </Button>

            <Link href={`/inspections/${report.scan_id}`}>
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Source Inspection</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Report Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Scan Reference</span>
            </span>
            <p className="font-medium text-slate-800 font-mono truncate">
              {scanCode(report.scan_id)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Filed On</span>
            </span>
            <p className="font-medium text-slate-800">
              {formatScanDate(report.created_at)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Reported By</span>
            </span>
            <p className="font-medium text-slate-800 truncate">
              {report.reported_by || "You"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Violations</span>
            </span>
            <p className="font-medium text-slate-800 font-mono">
              {report.violations?.length || 0}
            </p>
          </div>
        </div>
      </section>

      {/* Scanned Product Summary */}
      <section
        aria-labelledby="reported-product-title"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2
              id="reported-product-title"
              className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
            >
              Scanned Product
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The product evaluated for legal metrology compliance
            </p>
          </div>

          <ScanStatusBadge status={report.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500">Product</span>
              <p className="text-sm font-semibold text-slate-900">
                {productName}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Brand</span>
              <p className="font-medium text-slate-800">
                {report.brand || "Unspecified"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Category</span>
              <p className="font-medium text-slate-800">
                {report.category || "general"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Filed Timestamp</span>
              <p className="font-medium text-slate-800">
                {formatScanDate(report.created_at)}
              </p>
            </div>
          </div>

          {report.notes && (
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Inspector Notes</span>
              <p className="text-slate-600 leading-relaxed">{report.notes}</p>
            </div>
          )}
        </div>
      </section>

      {/* Reported Violations */}
      <section
        aria-labelledby="reported-violations-title"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2
              id="reported-violations-title"
              className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
            >
              Reported Violations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Applicable rules that failed the automated compliance check
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
            <XCircle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            <span>
              {report.violations?.length || 0}{" "}
              {(report.violations?.length || 0) === 1 ? "Violation" : "Violations"}
            </span>
          </div>
        </div>

        {(!report.violations || report.violations.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-1">
              <FileWarning className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              No violation details available
            </h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              This report has no per-rule violation records to display.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.violations.map((violation, idx) => (
              <ViolationCard
                key={`${violation.rule_id || idx}-${violation.field_name || idx}`}
                violation={violation}
              />
            ))}
          </div>
        )}
      </section>

      {/* Review Notice */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-500 space-y-1 text-center">
        <p className="font-medium text-slate-700">Consumer Affairs Official Record</p>
        <p className="text-[11px] leading-relaxed max-w-2xl mx-auto">
          This report was generated under Section 18 of the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011. You can generate a tamper-evident PDF certificate anytime using the download button above.
        </p>
      </div>
    </div>
  );
}
