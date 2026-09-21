import * as React from "react";
import { CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import { ExtractedField } from "@/types/review";
import { Badge } from "@/components/shared/ui/badge";
import { cn } from "@/lib/utils";

export interface ExtractedFieldsTableProps {
  fields: ExtractedField[];
  className?: string;
}

/**
 * Three distinct outcomes:
 *  - verified: applicable declaration found on the label
 *  - missing: applicable declaration absent/invalid -> a real violation
 *  - skipped: statutory exemption (is_applicable === false) -> never a failure
 */
function FieldStatusBadge({ status }: { status: ExtractedField["status"] }) {
  if (status === "verified") {
    return (
      <Badge variant="success" className="gap-1 text-[11px] font-medium">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        <span>Verified</span>
      </Badge>
    );
  }

  if (status === "missing") {
    return (
      <Badge variant="destructive" className="gap-1 text-[11px] font-medium">
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
        <span>Missing</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[11px] font-medium text-slate-500">
      <MinusCircle className="w-3 h-3" aria-hidden="true" />
      <span>Not applicable</span>
    </Badge>
  );
}

/**
 * Responsive table displaying extracted Legal Metrology statutory package declarations.
 */
export function ExtractedFieldsTable({
  fields,
  className,
}: ExtractedFieldsTableProps) {
  const detectedCount = fields.filter((field) => field.status === "verified").length;

  return (
    <section
      aria-labelledby="extracted-declarations-title"
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2
            id="extracted-declarations-title"
            className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
          >
            Extracted Package Declarations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mandatory commodities declarations detected via OCR parsing
          </p>
        </div>

        <span className="text-xs font-mono text-slate-500">
          {detectedCount} / {fields.length} detected
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            No declarations extracted
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            The rule engine returned no field-level results for this scan.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / Tablet Table View */}
          <div className="hidden md:block overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3 pr-4">
                    Mandatory Field
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Detected Value
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Confidence
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {fields.map((field) => {
                  const isSkipped = field.status === "skipped";

                  return (
                    <tr
                      key={field.id}
                      className={cn(
                        "transition-colors",
                        isSkipped ? "bg-slate-50/60" : "hover:bg-slate-50/80"
                      )}
                    >
                      <td className="py-3.5 pr-4 align-top">
                        <span
                          className={cn(
                            "font-medium block",
                            isSkipped ? "text-slate-400" : "text-slate-900"
                          )}
                        >
                          {field.label}
                        </span>
                        {field.isMandatory ? (
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            Mandatory (LM Rules)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {field.clauseReference}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {isSkipped ? (
                          <span className="text-slate-400 italic text-xs">
                            Exempt — not assessed
                          </span>
                        ) : field.value ? (
                          <span className="text-slate-800 font-mono text-xs break-words">
                            {field.value}
                          </span>
                        ) : (
                          <span className="text-rose-600 italic text-xs font-medium">
                            Not detected on package
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {field.confidence !== null && field.confidence !== undefined ? (
                          <span className="text-slate-600 font-mono text-xs">
                            {Math.round(field.confidence * 100)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">—</span>
                        )}
                      </td>

                      <td className="py-3.5 pl-4 text-right align-top whitespace-nowrap">
                        <FieldStatusBadge status={field.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {fields.map((field) => {
              const isSkipped = field.status === "skipped";

              return (
                <div key={field.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isSkipped ? "text-slate-400" : "text-slate-900"
                      )}
                    >
                      {field.label}
                    </span>
                    <FieldStatusBadge status={field.status} />
                  </div>

                  <div
                    className={cn(
                      "p-2.5 rounded-xl border text-xs",
                      isSkipped
                        ? "bg-slate-50/60 border-slate-200/60"
                        : "bg-slate-50 border-slate-200/80"
                    )}
                  >
                    {isSkipped ? (
                      <p className="text-slate-400 italic">Exempt — not assessed</p>
                    ) : field.value ? (
                      <p className="text-slate-800 font-mono break-words">{field.value}</p>
                    ) : (
                      <p className="text-rose-600 font-medium italic">
                        Not detected on package
                      </p>
                    )}
                  </div>

                  {field.confidence !== null && field.confidence !== undefined && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>OCR Confidence</span>
                      <span>{Math.round(field.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed pt-3 border-t border-slate-100">
            Fields marked <span className="font-semibold">Not applicable</span> are statutory
            exemptions (for example FSSAI on a non-food product, or dimensions that are not
            auto-assessed). They are excluded from the compliance score and are never violations.
          </p>
        </>
      )}
    </section>
  );
}
