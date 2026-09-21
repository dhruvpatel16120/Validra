"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/inspector/common";
import { ComplianceScoreRing } from "./ComplianceScoreRing";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { ExtractedFieldsTable } from "./ExtractedFieldsTable";
import { EvidenceViewer } from "./EvidenceViewer";
import { FindingsList } from "./FindingsList";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { ReviewData } from "@/types/review";
import type { ReportFileResponse } from "@/types/report";
import { scanService } from "@/services/scan-service";
import { getUserFriendlyErrorMessage } from "@/services/api";
import { cn } from "@/lib/utils";

export interface ReviewPageProps {
  initialData: ReviewData;
}

/** Render the API's ISO timestamp as a readable local date-time. */
function formatScannedAt(value: string): string {
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * ReviewPage composition container: the automated compliance verdict for one
 * scan, its evidence, and (for flagged scans) escalation to Consumer Affairs.
 */
export function ReviewPage({ initialData }: ReviewPageProps) {
  const data = initialData;

  const [reportState, setReportState] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [report, setReport] = React.useState<ReportFileResponse | null>(null);
  const [reportError, setReportError] = React.useState<string | null>(null);

  const confidences = data.extractedFields
    .map((field) => field.confidence)
    .filter((value): value is number => value !== null && value !== undefined);
  const averageConfidence = confidences.length
    ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
    : null;

  const isFlagged = data.status === "flagged";
  const isCompliant = data.status === "compliant";

  const handleReport = async () => {
    if (reportState === "submitting") return;
    setReportState("submitting");
    setReportError(null);

    try {
      const result = await scanService.reportViolation(data.scanId);
      setReport(result);
      setReportState("success");
    } catch (err: unknown) {
      setReportError(getUserFriendlyErrorMessage(err));
      setReportState("error");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="Inspection Review"
        description={`Automated Legal Metrology verdict for ${data.productName} — Scan Reference: ${data.scanId}`}
        actions={
          <Link href="/inspections">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Inspections</span>
            </Button>
          </Link>
        }
      />

      {/* Overall verdict stamp */}
      <div
        role="status"
        className={cn(
          "p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3",
          isFlagged
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : isCompliant
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        )}
      >
        <div className="flex items-start gap-2.5">
          {isFlagged ? (
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          ) : isCompliant ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <Clock className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          )}

          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {isFlagged
                ? `Flagged — ${data.counts.violations} statutory violation${
                    data.counts.violations === 1 ? "" : "s"
                  } detected`
                : isCompliant
                ? "Compliant — every applicable declaration passed"
                : "Pending — this scan has not been evaluated yet"}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              {data.brand ? `${data.brand} • ` : ""}
              {data.category} • Scanned {formatScannedAt(data.scannedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Badge variant="success" className="gap-1 text-xs">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
            <span>{data.counts.passed} passed</span>
          </Badge>
          {data.counts.violations > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <XCircle className="w-3 h-3" aria-hidden="true" />
              <span>{data.counts.violations} violations</span>
            </Badge>
          )}
          {data.counts.skipped > 0 && (
            <Badge variant="outline" className="gap-1 text-xs text-slate-600">
              <span>{data.counts.skipped} exempt</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Top Grid: Compliance Summary & Evidence Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6 flex flex-col justify-between">
          <ComplianceScoreRing
            score={data.complianceScore}
            status={data.status}
          />
          <ConfidenceIndicator confidence={averageConfidence} />
        </div>

        <EvidenceViewer images={data.evidenceImages} />
      </div>

      {/* Extracted Package Information Table */}
      <ExtractedFieldsTable fields={data.extractedFields} />

      {/* Findings / Violations */}
      <FindingsList findings={data.findings} />

      {/* Escalation to Consumer Affairs — only a flagged scan can be reported */}
      {isFlagged && (
        <section
          aria-labelledby="report-violation-title"
          className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2
                id="report-violation-title"
                className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
              >
                Escalate to Consumer Affairs
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                File a formal violation report for this scan with the Department of
                Consumer Affairs. The {data.counts.violations} detected violation
                {data.counts.violations === 1 ? "" : "s"} and the label evidence will be
                attached to the report.
              </p>
            </div>

            {reportState !== "success" && (
              <Button
                type="button"
                variant="destructive"
                size="md"
                onClick={handleReport}
                disabled={reportState === "submitting"}
                className="gap-2 font-semibold shrink-0"
              >
                {reportState === "submitting" ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {reportState === "submitting"
                    ? "Filing Report..."
                    : "Report to Consumer Affairs"}
                </span>
              </Button>
            )}
          </div>

          {/* Report failure */}
          {reportState === "error" && reportError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-2">
                <p>{reportError}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleReport}
                  className="h-8 px-2.5 text-xs"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}

          {/* Report success */}
          {reportState === "success" && report && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold">
                  Report filed with Consumer Affairs
                </p>
                <p className="text-xs font-mono break-words">
                  Report ID: {report.report_id}
                </p>
                <p className="text-xs">
                  {report.violations?.length || 0} violation
                  {(report.violations?.length || 0) === 1 ? "" : "s"} recorded &bull; Status:{" "}
                  {report.status}
                </p>

                {!report.email_sent && (
                  <p className="text-xs text-amber-700 pt-1">
                    No notification email was sent — email delivery is not configured on
                    this deployment. The report is stored and visible to reviewers.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
