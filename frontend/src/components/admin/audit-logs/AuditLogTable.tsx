"use client";

import * as React from "react";
import { AuditLogEntry } from "@/types/audit-log";
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/shared";
import { AuditLogDetailDialog } from "./AuditLogDetailDialog";
import { acknowledgeAuditIncident } from "@/services/admin-audit-service";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  onAcknowledged?: (updated: AuditLogEntry) => void;
}

export function AuditLogTable({ logs, onAcknowledged }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = React.useState<AuditLogEntry | null>(null);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [acknowledgingId, setAcknowledgingId] = React.useState<string | null>(null);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const paginated = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInlineAcknowledge = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    try {
      setAcknowledgingId(entryId);
      const updated = await acknowledgeAuditIncident(entryId);
      if (onAcknowledged) onAcknowledged(updated);
    } catch (err) {
      console.error("Failed to acknowledge incident:", err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-44">Timestamp (UTC)</th>
                <th className="py-3 px-3 w-24">Severity</th>
                <th className="py-3 px-4 w-56">Officer / Subject</th>
                <th className="py-3 px-4">Action Code & Narrative</th>
                <th className="py-3 px-4 w-40">Target Entity</th>
                <th className="py-3 px-3 w-32">Origin IP</th>
                <th className="py-3 px-3 w-36">Status</th>
                <th className="py-3 px-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((entry) => {
                const isAlert = entry.status === "SECURITY_ALERT";
                const isAck = entry.status === "ACKNOWLEDGED";
                const isSuccess = entry.status === "SUCCESS";
                const isAcknowledging = acknowledgingId === entry.id;

                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedLog(entry)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isAlert ? "bg-rose-50/30" : ""
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] font-semibold text-slate-800">
                        {entry.timestamp?.substring(11, 19) || "—"} UTC
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <span>{entry.timestamp?.substring(0, 10)}</span>
                        <span>·</span>
                        <span className="text-slate-600 font-medium">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          entry.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-900 border-rose-200"
                            : entry.severity === "HIGH"
                            ? "bg-amber-100 text-amber-900 border-amber-200"
                            : entry.severity === "MEDIUM"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {entry.severity === "CRITICAL" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        )}
                        {entry.severity}
                      </span>
                    </td>

                    {/* Officer / Subject */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{entry.userName}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-200/70 text-slate-600 uppercase font-bold flex-shrink-0">
                          {entry.userRole}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {entry.userEmail}
                      </div>
                    </td>

                    {/* Action & Narrative */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {entry.action}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                        {entry.description}
                      </p>
                    </td>

                    {/* Entity Target */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] text-emerald-800 font-semibold truncate">
                        {entry.entityType?.toUpperCase()}: {entry.entityId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {entry.id}
                      </div>
                    </td>

                    {/* Origin IP */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      <div>{entry.ipAddress}</div>
                      <span className="text-[9px] text-slate-400">
                        {entry.ipAddress === "127.0.0.1" ? "Localhost" : "Remote Node"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {isAlert && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-900 border border-rose-200">
                          <ShieldAlert className="w-3 h-3 text-rose-700" />
                          <span>ALERT</span>
                        </span>
                      )}
                      {isAck && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-800 border border-emerald-200" title={`Acknowledged by ${entry.acknowledgedBy || "Supervisor"}`}>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>REVIEWED</span>
                        </span>
                      )}
                      {isSuccess && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>RECORDED</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAlert && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleInlineAcknowledge(e, entry.id)}
                            disabled={isAcknowledging}
                            className="h-7 px-2 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 font-semibold"
                            title="Acknowledge alert as supervisor"
                          >
                            {isAcknowledging ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3 h-3 mr-0.5" />
                                Ack
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(entry);
                          }}
                          className="h-7 px-2 text-xs text-slate-600 hover:text-emerald-800 hover:bg-slate-100"
                          title="View forensic details"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Inspect
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50/90 text-xs text-slate-600">
          <div className="text-[11px] font-mono">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, logs.length)} of {logs.length} forensic entries
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7.5 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="font-mono px-2 text-xs text-slate-700 font-semibold">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7.5 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {selectedLog && (
        <AuditLogDetailDialog
          entry={selectedLog}
          onClose={() => setSelectedLog(null)}
          onAcknowledged={(updated) => {
            setSelectedLog(updated);
            if (onAcknowledged) onAcknowledged(updated);
          }}
        />
      )}
    </div>
  );
}
