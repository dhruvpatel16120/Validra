"use client";

import * as React from "react";
import { AuditLogStats } from "@/types/audit-log";
import {
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

interface AuditTelemetryCardsProps {
  stats: AuditLogStats;
  onFilterUnacknowledged?: () => void;
}

export function AuditTelemetryCards({
  stats,
  onFilterUnacknowledged,
}: AuditTelemetryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Events */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Audit Ledger
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900">
            {stats.totalEvents}
          </span>
          <span className="text-[11px] font-mono text-emerald-700 font-medium">
            WORM Active
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Immutable forensic entries recorded
        </p>
      </div>

      {/* 2. Critical & High Incidents */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Priority Incidents
          </span>
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              stats.criticalAlerts > 0
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900">
            {stats.criticalAlerts + stats.highAlerts}
          </span>
          <span
            className={`text-[11px] font-mono font-medium ${
              stats.criticalAlerts > 0 ? "text-rose-700" : "text-slate-500"
            }`}
          >
            {stats.criticalAlerts} Critical · {stats.highAlerts} High
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Severity Level 1 & 2 security events
        </p>
      </div>

      {/* 3. Auth & RBAC Anomalies */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Auth Anomaly (24h)
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900">
            {stats.failedLogins24h}
          </span>
          <span className="text-[11px] font-mono text-amber-800 font-medium">
            Failed / Blocked
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Brute-force flags & RBAC boundary checks
        </p>
      </div>

      {/* 4. Unacknowledged Alerts */}
      <div
        onClick={onFilterUnacknowledged}
        className={`p-4 rounded-xl border shadow-2xs transition-all ${
          stats.unacknowledgedAlerts > 0
            ? "bg-rose-50/40 border-rose-200 hover:border-rose-400 cursor-pointer group"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Pending Action
          </span>
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              stats.unacknowledgedAlerts > 0
                ? "bg-rose-100 border-rose-300 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                stats.unacknowledgedAlerts > 0 ? "text-rose-900" : "text-slate-900"
              }`}
            >
              {stats.unacknowledgedAlerts}
            </span>
            <span
              className={`text-[11px] font-mono font-medium ${
                stats.unacknowledgedAlerts > 0 ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {stats.unacknowledgedAlerts > 0 ? "Unacknowledged" : "Clear"}
            </span>
          </div>
          {stats.unacknowledgedAlerts > 0 && onFilterUnacknowledged && (
            <span className="text-xs text-rose-700 group-hover:underline flex items-center gap-0.5 font-medium">
              Filter <ArrowUpRight className="w-3 h-3" />
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {stats.unacknowledgedAlerts > 0
            ? "Requires supervisory review & sign-off"
            : "All security alerts acknowledged"}
        </p>
      </div>
    </div>
  );
}
