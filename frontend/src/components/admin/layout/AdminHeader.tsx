"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Clock,
  Radio,
} from "lucide-react";
import { Input } from "@/components/shared";
import { getAuditStats } from "@/services/admin-audit-service";

export function AdminHeader() {
  const pathname = usePathname();
  const [unackAlerts, setUnackAlerts] = React.useState<number>(1);
  const [currentTime, setCurrentTime] = React.useState<string>("");

  React.useEffect(() => {
    // Update live clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Fetch alert stats
    getAuditStats().then((stats) => {
      setUnackAlerts(stats.unacknowledgedAlerts);
    }).catch(() => {});

    return () => clearInterval(timer);
  }, []);

  // Compute breadcrumbs from path
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumb = pathParts.length > 1 ? pathParts[1] : "Dashboard";
  const formattedBreadcrumb =
    breadcrumb.charAt(0).toUpperCase() + breadcrumb.slice(1).replace(/-/g, " ");

  return (
    <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Breadcrumbs & Statutory Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 font-mono">PORTAL</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold tracking-tight">{formattedBreadcrumb}</span>
        </div>

        <span className="h-4 w-px bg-slate-200 hidden sm:inline-block" />

        {/* Live Statutory Status Tag */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>STATUTORY ENGINE: NOMINAL</span>
        </div>

        {/* Live Clock */}
        {currentTime && (
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{currentTime}</span>
          </div>
        )}
      </div>

      {/* Right: Security Alerts, Pending Reviews & Search */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-48 lg:w-60 hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search records, rules, IDs..."
            className="h-8 pl-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-700"
          />
        </div>

        {/* Unacknowledged Security Alert Notification */}
        {unackAlerts > 0 ? (
          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs hover:bg-rose-100 transition-colors font-medium animate-pulse"
            title={`${unackAlerts} unacknowledged security alert(s) requiring supervisor review`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-bold font-mono text-rose-900">{unackAlerts}</span>
            <span className="hidden xl:inline text-[11px] font-semibold">Security Alert</span>
          </Link>
        ) : (
          <Link
            href="/admin/audit-logs"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 transition-colors font-medium"
            title="Audit log trail normal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden xl:inline text-[11px]">Audit Secure</span>
          </Link>
        )}

        {/* Pending Reviews notification trigger */}
        <Link
          href="/admin/inspections?status=NEEDS_REVIEW"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs hover:bg-amber-100/80 transition-colors font-medium"
          title="19 inspections requiring supervisor review"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold font-mono text-amber-900">19</span>
          <span className="hidden lg:inline text-[11px]">Pending Reviews</span>
        </Link>

        {/* Statutory Compliance Indicator */}
        <div className="hidden xl:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-mono">
          <span className="font-semibold text-emerald-800">PCR 2011</span>
          <span className="text-slate-400">|</span>
          <span>WORM LOG</span>
        </div>
      </div>
    </header>
  );
}
