import * as React from "react";
import { TrendingUp } from "lucide-react";
import { ComplianceTrendPoint } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export interface ComplianceTrendChartProps {
  /** Daily compliance trend from GET /api/dashboard (`scans_by_day`). */
  data: ComplianceTrendPoint[];
  className?: string;
}

/** Render the API's ISO day ("2026-09-16") as a compact axis label. */
function formatDateLabel(date: string): string {
  const isoDay = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDay.test(date)) return date;
  const parsed = new Date(`${date}T00:00:00`);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/**
 * Lightweight SVG-based compliance trend line chart.
 * Responsive, accessible, and free of heavyweight dependencies.
 */
export function ComplianceTrendChart({ data = [], className }: ComplianceTrendChartProps) {
  const hasData = data && data.length > 0;

  // Chart SVG coordinate calculations
  const width = 500;
  const height = 200;
  const paddingX = 45;
  const paddingY = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const maxRate = 100;
  const lowestRate = hasData
    ? Math.min(...data.map((p) => p.complianceRate))
    : maxRate;
  const minRate =
    lowestRate >= 50 ? 50 : Math.max(0, Math.floor((lowestRate - 5) / 10) * 10);
  const gridLevels = [0, 1, 2, 3].map((step) =>
    Math.round(maxRate - (step * (maxRate - minRate)) / 3)
  );

  const getCoordinates = (index: number, rate: number) => {
    const x =
      data.length > 1
        ? paddingX + (index / (data.length - 1)) * graphWidth
        : paddingX + graphWidth / 2;
    const clampedRate = Math.min(Math.max(rate, minRate), maxRate);
    const normalizedY = (clampedRate - minRate) / (maxRate - minRate);
    const y = height - paddingY - normalizedY * graphHeight;
    return { x, y };
  };

  const coords = (data || []).map((p, i) => getCoordinates(i, p.complianceRate));
  const pathD = coords.reduce(
    (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
    ""
  );

  const averageRate = hasData
    ? Math.round(data.reduce((sum, p) => sum + p.complianceRate, 0) / data.length)
    : null;

  return (
    <section
      aria-labelledby="compliance-trend-heading"
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <h2
            id="compliance-trend-heading"
            className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
          >
            Compliance Trend
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit pass rate over recent inspection cycles
          </p>
        </div>

        {averageRate !== null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Avg {averageRate}%</span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="my-4 flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-1">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No scan activity yet</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Your day-by-day compliance rate will be charted here once product scans are
            executed.
          </p>
        </div>
      ) : (
        <div className="pt-4 pb-2 w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-48 sm:h-56 overflow-visible"
            role="img"
            aria-label="Compliance trend chart displaying audit pass rates over recent days"
          >
            {/* Horizontal Grid lines and Y-axis Labels */}
            {gridLevels.map((level) => {
              const normalizedY = (level - minRate) / (maxRate - minRate);
              const y = height - paddingY - normalizedY * graphHeight;
              return (
                <g key={level}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[11px] font-mono select-none"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Trend Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Area under curve fill (subtle emerald glow) */}
            <path
              d={`${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`}
              fill="url(#trend-gradient)"
              opacity="0.15"
            />

            <defs>
              <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Data Points and Value Badges */}
            {coords.map((c, i) => (
              <g key={`${data[i].date}-${i}`} className="cursor-pointer group">
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="4.5"
                  className="fill-white stroke-emerald-600 stroke-2 group-hover:r-6 transition-all"
                />
                {/* Value label above point */}
                <text
                  x={c.x}
                  y={c.y - 10}
                  textAnchor="middle"
                  className="fill-slate-700 text-[11px] font-mono font-semibold select-none group-hover:fill-emerald-600 transition-colors"
                >
                  {data[i].complianceRate}%
                </text>
                {/* X-axis Label below point */}
                <text
                  x={c.x}
                  y={height - paddingY + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-xs font-medium select-none"
                >
                  {formatDateLabel(data[i].date)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
        <span>Deterministic Rule Evaluation</span>
        <span className="text-slate-600 font-mono font-medium">LM Rules 2011</span>
      </div>
    </section>
  );
}
