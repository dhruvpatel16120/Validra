"use client";

import * as React from "react";
import { Search, Filter, X, ShieldAlert } from "lucide-react";
import { Input, Button } from "@/components/shared";

interface AuditLogFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (val: string) => void;
  actionFilter: string;
  onActionFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onResetFilters: () => void;
}

const SEVERITIES = [
  { label: "All Severities", value: "ALL" },
  { label: "Critical", value: "CRITICAL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Info", value: "INFO" },
];

export function AuditLogFilters({
  search,
  onSearchChange,
  severityFilter,
  onSeverityFilterChange,
  actionFilter,
  onActionFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
}: AuditLogFiltersProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    severityFilter !== "ALL" ||
    actionFilter !== "ALL" ||
    statusFilter !== "ALL";

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
      {/* Top row: Search input + Category & Status dropdowns */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search audit trail by event ID, officer, IP, or forensic keywords..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 pr-8 text-xs bg-slate-50/70 border-slate-200 focus:bg-white focus:border-emerald-700"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action category */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
              Action:
            </span>
            <select
              value={actionFilter}
              onChange={(e) => onActionFilterChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="USER_LOGIN">User Logins</option>
              <option value="ADMIN_LOGIN">Admin Logins</option>
              <option value="INSPECTOR_APPROVED">Inspector Approvals</option>
              <option value="BRUTE_FORCE_TRIGGER">Brute-force Triggers</option>
              <option value="RBAC_VIOLATION">RBAC Violations</option>
              <option value="JWT_KEY_ROTATION">JWT Key Rotations</option>
              <option value="RULE_UPDATE">Rule Modifications</option>
              <option value="INSPECTION_REVIEW_OVERRIDE">Inspection Overrides</option>
              <option value="REPORT_EXPORT">Report & Certificate Exports</option>
              <option value="IP_BLOCKED">IP Block Events</option>
            </select>
          </div>

          {/* Incident Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SECURITY_ALERT">Alert (Unacknowledged)</option>
              <option value="ACKNOWLEDGED">Acknowledged by Supervisor</option>
              <option value="SUCCESS">Standard Success</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-8.5 px-2.5 text-xs bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Severity filter pills */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mr-1 flex-shrink-0">
          Severity:
        </span>
        {SEVERITIES.map((s) => {
          const isSelected = severityFilter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => onSeverityFilterChange(s.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
                isSelected
                  ? s.value === "CRITICAL"
                    ? "bg-rose-900 text-white"
                    : s.value === "HIGH"
                    ? "bg-amber-800 text-white"
                    : s.value === "MEDIUM"
                    ? "bg-sky-800 text-white"
                    : "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200"
              }`}
            >
              {s.value === "CRITICAL" && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              )}
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
