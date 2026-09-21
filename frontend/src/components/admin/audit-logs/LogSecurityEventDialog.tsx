"use client";

import * as React from "react";
import { X, ShieldPlus, AlertCircle, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/shared";
import { logSecurityEvent } from "@/services/admin-audit-service";
import { AuditLogEntry, AuditSeverity } from "@/types/audit-log";

interface LogSecurityEventDialogProps {
  onClose: () => void;
  onSuccess: (newEntry: AuditLogEntry) => void;
}

export function LogSecurityEventDialog({
  onClose,
  onSuccess,
}: LogSecurityEventDialogProps) {
  const [action, setAction] = React.useState("IP_BLOCKED");
  const [severity, setSeverity] = React.useState<AuditSeverity>("HIGH");
  const [entityType, setEntityType] = React.useState("security");
  const [entityId, setEntityId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter an event description / narrative.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const entry = await logSecurityEvent({
        action,
        severity,
        entityType,
        entityId: entityId.trim() || "SYSTEM",
        description: description.trim(),
        status: severity === "CRITICAL" || severity === "HIGH" ? "SECURITY_ALERT" : "SUCCESS",
        metadata: {
          manualEntry: true,
          entryTimestamp: new Date().toISOString(),
          recordedVia: "Admin Supervisory Portal",
        },
      });

      onSuccess(entry);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record audit event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-2xs">
              <ShieldPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                Record Statutory Security Event
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Append tamper-evident entry to official WORM audit ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                Event Action Code
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
              >
                <option value="IP_BLOCKED">IP_BLOCKED</option>
                <option value="BRUTE_FORCE_TRIGGER">BRUTE_FORCE_TRIGGER</option>
                <option value="JWT_KEY_ROTATION">JWT_KEY_ROTATION</option>
                <option value="RBAC_VIOLATION">RBAC_VIOLATION</option>
                <option value="INSPECTION_REVIEW_OVERRIDE">INSPECTION_REVIEW_OVERRIDE</option>
                <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
                <option value="SECURITY_MAINTENANCE">SECURITY_MAINTENANCE</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AuditSeverity)}
                className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
              >
                <option value="INFO">INFO · Routine Operation</option>
                <option value="MEDIUM">MEDIUM · Configuration Change</option>
                <option value="HIGH">HIGH · Security Alert</option>
                <option value="CRITICAL">CRITICAL · Urgent Breach / Attack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                Target Entity Domain
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
              >
                <option value="security">security</option>
                <option value="system">system</option>
                <option value="user">user</option>
                <option value="inspection">inspection</option>
                <option value="rule">rule</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                Target Entity ID
              </label>
              <Input
                placeholder="e.g. 198.51.100.84 or C01"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
              Event Narrative / Forensic Description *
            </label>
            <textarea
              rows={3}
              placeholder="Describe the operational context, anomalous behavior, or administrative action taken..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 font-sans"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-8.5 text-xs bg-emerald-800 hover:bg-emerald-900 text-white font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording...
                </span>
              ) : (
                "Append to Audit Ledger"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
