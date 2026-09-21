import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Tag,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  ImageOff,
  Scale,
} from "lucide-react";
import { InspectionDetail } from "@/types/inspection";
import type { ScanResultRule } from "@/types/scan";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

export interface InspectionDetailViewProps {
  inspection: InspectionDetail;
  className?: string;
}

type RuleState = "passed" | "violation" | "exempt";

/**
 * A rule is only a violation when it is applicable AND explicitly failed.
 * Non-applicable rules are intentional legal exemptions with a null
 * `is_compliant`, so they must never be presented as failures.
 */
function ruleState(rule: ScanResultRule): RuleState {
  if (!rule.is_applicable) return "exempt";
  return rule.is_compliant ? "passed" : "violation";
}

function StatusIndicator({ status }: { status: InspectionDetail["status"] }) {
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
      <span>Pending</span>
    </Badge>
  );
}

function RuleBadge({ state }: { state: RuleState }) {
  if (state === "violation") {
    return (
      <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
        <XCircle className="w-3 h-3" aria-hidden="true" />
        <span>Violation</span>
      </Badge>
    );
  }

  if (state === "passed") {
    return (
      <Badge variant="success" className="gap-1 text-[11px] font-semibold">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        <span>Passed</span>
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="gap-1 text-[11px] font-semibold">
      <MinusCircle className="w-3 h-3" aria-hidden="true" />
      <span>Not Applicable</span>
    </Badge>
  );
}

function RuleRow({ rule }: { rule: ScanResultRule }) {
  const state = ruleState(rule);

  return (
    <article
      aria-label={`${rule.field_name || "Rule"} result`}
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs border-l-4",
        state === "violation"
          ? "border-l-rose-500"
          : state === "passed"
          ? "border-l-emerald-500"
          : "border-l-slate-300"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            {rule.field_name || "Unspecified field"}
          </span>
          {rule.clause_reference && (
            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
              <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>{rule.clause_reference}</span>
            </div>
          )}
        </div>

        <RuleBadge state={state} />
      </div>

      {rule.description && (
        <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wide">
            Requirement:
          </span>
          <p className="leading-relaxed">{rule.description}</p>
        </div>
      )}

      <div className="text-[11px] font-mono text-slate-500 border-t border-slate-100 pt-2.5 break-words">
        <span className="text-slate-400">Extracted value: </span>
        <span className="text-slate-700">
          {rule.extracted_value === null || rule.extracted_value === ""
            ? "—"
            : rule.extracted_value}
        </span>
      </div>
    </article>
  );
}

function ComplianceSummary({ inspection }: { inspection: InspectionDetail }) {
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const score = Math.min(Math.max(0, inspection.score), 100);
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const strokeColor = score >= 90 ? "#059669" : score >= 75 ? "#d97706" : "#e11d48";

  return (
    <section
      aria-label="Automated compliance score"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6"
    >
      {/* Circular Progress SVG */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {score}%
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            Score
          </span>
        </div>
      </div>

      {/* Summary Description */}
      <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Automated Audit
          </span>
          <StatusIndicator status={inspection.status} />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
          {inspection.status === "compliant"
            ? "High Compliance Adherence"
            : inspection.status === "flagged"
            ? "Violations Detected"
            : "Review Pending"}
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed max-w-md">
          {inspection.passed} passed · {inspection.violations} flagged ·{" "}
          {inspection.skipped} not applicable, evaluated under the Legal
          Metrology (Packaged Commodities) Rules, 2011.
        </p>
      </div>
    </section>
  );
}

function EvidencePanel({ images }: { images: string[] }) {
  return (
    <section
      aria-labelledby="inspection-evidence-title"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col"
    >
      <div className="pb-4 border-b border-slate-100">
        <h2
          id="inspection-evidence-title"
          className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
        >
          Package Evidence
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Label photography stored with this scan record
        </p>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-6 my-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2 flex-1 min-h-[180px]">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
            <ImageOff className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-slate-800">
            No evidence images available
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
            This scan record has no stored label photography.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 my-4">
          {images.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50"
              aria-label={`Open evidence image ${index + 1} in a new tab`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URL; next.config.ts has no remotePatterns */}
              <img
                src={url}
                alt={`Scan evidence ${index + 1}`}
                loading="lazy"
                className="w-full h-32 sm:h-40 object-cover group-hover:opacity-90 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * InspectionDetailView component showing the real per-rule compliance
 * checklist, automated score and stored evidence for one scan.
 */
export function InspectionDetailView({
  inspection,
  className,
}: InspectionDetailViewProps) {
  const evidence =
    inspection.images.length > 0
      ? inspection.images
      : inspection.imageUrl
      ? [inspection.imageUrl]
      : [];

  return (
    <div className={cn("space-y-6 sm:space-y-8", className)}>
      {/* Top Meta Summary Card */}
      <section
        aria-label="Inspection Overview"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">
                #{inspection.code}
              </span>
              <StatusIndicator status={inspection.status} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {inspection.productName}
            </h2>
            {inspection.brand && (
              <p className="text-xs text-slate-500 mt-0.5">{inspection.brand}</p>
            )}
          </div>

          {/* Related Action Links */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href={`/scan/${inspection.scanId}/review`}>
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Review</span>
              </Button>
            </Link>

            <Link href="/inspections">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Inspections</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Category</span>
            </span>
            <p className="font-medium text-slate-800">{inspection.category}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Audit Date</span>
            </span>
            <p className="font-medium text-slate-800">{inspection.date}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Checks Passed</span>
            </span>
            <p className="font-medium text-slate-800 font-mono">
              {inspection.passed}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Rules Evaluated</span>
            </span>
            <p className="font-medium text-slate-800 font-mono">
              {inspection.results.length}
            </p>
          </div>
        </div>
      </section>

      {/* Compliance Score & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceSummary inspection={inspection} />
        <EvidencePanel images={evidence} />
      </div>

      {/* Per-rule Compliance Checklist */}
      <section
        aria-labelledby="compliance-checklist-title"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2
              id="compliance-checklist-title"
              className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
            >
              Compliance Checklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Per-rule assessment, including legal exemptions that are not
              violations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
            <XCircle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            <span>{inspection.violations} Flagged</span>
            <span className="text-slate-400">·</span>
            <MinusCircle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{inspection.skipped} Exempt</span>
          </div>
        </div>

        {inspection.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-1">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              No rule results available
            </h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              The rule engine returned no per-rule assessment for this scan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inspection.results.map((rule) => (
              <RuleRow
                key={`${rule.rule_id}-${rule.field_name}`}
                rule={rule}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
