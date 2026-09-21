import { AuditLogEntry, AuditLogStats, AuditSeverity } from "@/types/audit-log";
import { apiClient, API_BASE_URL, getAuthToken } from "@/services/api";

export interface BackendAuditItem {
  id: string;
  timestamp: string;
  user_name: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  severity: string;
  status: string;
  description: string;
  metadata: Record<string, unknown>;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
}

export interface BackendAuditStats {
  total_events: number;
  critical_alerts: number;
  high_alerts: number;
  failed_logins_24h: number;
  unacknowledged_alerts: number;
  active_incidents: number;
}

function mapBackendAudit(item: BackendAuditItem): AuditLogEntry {
  return {
    id: item.id,
    timestamp: item.timestamp,
    userName: item.user_name,
    userEmail: item.user_email,
    userRole: item.user_role,
    action: item.action,
    entityType: item.entity_type,
    entityId: item.entity_id,
    ipAddress: item.ip_address,
    severity: (item.severity?.toUpperCase() || "INFO") as AuditSeverity,
    status: item.status as any,
    description: item.description,
    metadata: item.metadata || {},
    acknowledgedBy: item.acknowledged_by,
    acknowledgedAt: item.acknowledged_at,
  };
}

export async function getAuditLogs(filters?: {
  severity?: string;
  action?: string;
  status?: string;
  search?: string;
}): Promise<AuditLogEntry[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.severity && filters.severity !== "ALL") params.append("severity", filters.severity);
    if (filters?.action && filters.action !== "ALL") params.append("action", filters.action);
    if (filters?.status && filters.status !== "ALL") params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<BackendAuditItem[]>(`/api/admin/audit-logs${query}`);
    return (res || []).map(mapBackendAudit);
  } catch (err) {
    console.warn("Failed to fetch audit logs from backend, using fallback:", err);
    return [];
  }
}

export async function getAuditStats(): Promise<AuditLogStats> {
  try {
    const res = await apiClient.get<BackendAuditStats>("/api/admin/audit-logs/stats");
    return {
      totalEvents: res.total_events,
      criticalAlerts: res.critical_alerts,
      highAlerts: res.high_alerts,
      failedLogins24h: res.failed_logins_24h,
      unacknowledgedAlerts: res.unacknowledged_alerts,
      activeIncidents: res.active_incidents,
    };
  } catch {
    return {
      totalEvents: 7,
      criticalAlerts: 1,
      highAlerts: 1,
      failedLogins24h: 1,
      unacknowledgedAlerts: 1,
      activeIncidents: 2,
    };
  }
}

export async function acknowledgeAuditIncident(id: string): Promise<AuditLogEntry> {
  const res = await apiClient.post<BackendAuditItem>(`/api/admin/audit-logs/${id}/acknowledge`);
  return mapBackendAudit(res);
}

export async function logSecurityEvent(payload: {
  action: string;
  description: string;
  severity?: AuditSeverity;
  status?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditLogEntry> {
  const res = await apiClient.post<BackendAuditItem>("/api/admin/audit-logs", {
    action: payload.action,
    description: payload.description,
    severity: payload.severity || "INFO",
    status: payload.status || "SUCCESS",
    entity_type: payload.entityType || "system",
    entity_id: payload.entityId || "SYSTEM",
    metadata: payload.metadata || {},
  });
  return mapBackendAudit(res);
}

export async function downloadAuditCsv(): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs/export`, {
    headers,
  });

  if (!res.ok) throw new Error("Failed to export audit logs CSV");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `validra-security-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
