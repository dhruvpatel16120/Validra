import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/shared/ui/badge";
import { RecentScanItem } from "@/types/dashboard";
import type { ScanStatus } from "@/types/scan";
import { cn } from "@/lib/utils";

function StatusIndicator({ status }: { status: ScanStatus | string }) {
  if (status === "compliant") {
    return (
      <Badge variant="success" className="gap-1.5 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Compliant</span>
      </Badge>
    );
  }

  if (status === "flagged") {
    return (
      <Badge variant="destructive" className="gap-1.5 font-medium">
        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Flagged</span>
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="gap-1.5 font-medium">
      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Pending</span>
    </Badge>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  const textColor =
    score >= 90
      ? "text-emerald-700"
      : score >= 75
      ? "text-amber-700"
      : "text-rose-700";

  return <span className={cn("font-semibold font-mono", textColor)}>{score}%</span>;
}

export interface RecentInspectionsProps {
  /** Recent scans from GET /api/dashboard, each linking to its review page. */
  inspections: RecentScanItem[];
  className?: string;
}

/**
 * RecentInspections component for the Inspector Dashboard.
 * Includes desktop/tablet table layout and mobile-optimized card layout to eliminate horizontal scrolling.
 */
export function RecentInspections({
  inspections,
  className,
}: RecentInspectionsProps) {
  return (
    <section
      aria-labelledby="recent-inspections-title"
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs",
        className
      )}
    >
      {/* Header with View All Link */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div>
          <h2
            id="recent-inspections-title"
            className="text-base sm:text-lg font-bold text-slate-900 tracking-tight"
          >
            Recent Inspections
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest product compliance audits and determinations
          </p>
        </div>

        <Link
          href="/inspections"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-md px-1.5 py-1"
        >
          <span>View all</span>
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {inspections.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">No scans yet</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Start a new inspection scan to build your compliance history.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table View (hidden on small mobile screens) */}
          <div className="hidden md:block overflow-hidden pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3.5 pr-4">
                    Product / Inspection
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Status
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Date
                  </th>
                  <th scope="col" className="py-3.5 pl-4 text-right">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {inspections.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 pr-4">
                      <Link
                        href={`/scan/${item.id}/review`}
                        className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-md"
                      >
                        {item.productName}
                      </Link>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {item.code}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusIndicator status={item.statusKey} />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-xs sm:text-sm">
                      {item.date}
                    </td>
                    <td className="py-4 pl-4 text-right whitespace-nowrap">
                      <ScoreIndicator score={item.score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (visible only on small mobile screens to prevent horizontal scroll) */}
          <div className="md:hidden divide-y divide-slate-100 pt-2">
            {inspections.map((item) => (
              <article
                key={item.id}
                aria-label={`${item.productName} (${item.code})`}
                className="py-3.5 first:pt-2 last:pb-0 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/scan/${item.id}/review`}
                      className="text-sm font-semibold text-slate-800 leading-snug hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-md"
                    >
                      {item.productName}
                    </Link>
                    <span className="block text-xs font-mono text-slate-400">
                      #{item.code}
                    </span>
                  </div>
                  <ScoreIndicator score={item.score} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <StatusIndicator status={item.statusKey} />
                  <span>{item.date}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
