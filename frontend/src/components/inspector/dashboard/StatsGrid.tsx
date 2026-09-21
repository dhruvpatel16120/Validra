import * as React from "react";
import { ClipboardCheck, Clock3, CircleCheck, TriangleAlert, LucideIcon } from "lucide-react";
import { DashboardStatData } from "@/types/dashboard";
import { cn } from "@/lib/utils";

/**
 * Icon per card variant. The backend's stat cards carry no icon, so the
 * existing four-metric visual language is preserved by variant.
 */
const ICON_BY_VARIANT: Record<DashboardStatData["variant"], LucideIcon> = {
  primary: ClipboardCheck,
  warning: Clock3,
  success: CircleCheck,
  error: TriangleAlert,
};

const VARIANT_STYLES = {
  primary: {
    iconWrapper: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  warning: {
    iconWrapper: "bg-amber-50 text-amber-700 border-amber-200",
  },
  success: {
    iconWrapper: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  error: {
    iconWrapper: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export interface StatsGridProps {
  /** Ready-to-render cards from GET /api/dashboard. */
  statCards: DashboardStatData[];
  className?: string;
}

/**
 * Reusable StatCard component for dashboard metrics.
 */
export function StatCard({ item }: { item: DashboardStatData }) {
  const Icon = ICON_BY_VARIANT[item.variant] ?? ClipboardCheck;
  const styles = VARIANT_STYLES[item.variant] ?? VARIANT_STYLES.primary;

  return (
    <article
      aria-label={`${item.label}: ${item.value}`}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors hover:border-emerald-200"
    >
      <div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl border flex items-center justify-center mb-4 shrink-0",
            styles.iconWrapper
          )}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>

        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {item.label}
        </span>
        <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          {item.value}
        </p>
      </div>

      <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
        {item.description}
      </p>
    </article>
  );
}

/**
 * Responsive StatsGrid displaying the key compliance metrics returned by
 * GET /api/dashboard. 4 columns on desktop, 2 on tablet, 1 on mobile.
 */
export function StatsGrid({ statCards, className }: StatsGridProps) {
  return (
    <section aria-label="Inspection Metrics Overview">
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
          className
        )}
      >
        {statCards.map((stat) => (
          <StatCard key={stat.id} item={stat} />
        ))}
      </div>
    </section>
  );
}
