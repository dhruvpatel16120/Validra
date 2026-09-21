export type AuditActionType =
  | "USER_LOGIN"
  | "ADMIN_LOGIN"
  | "AUTH_FAILURE"
  | "BRUTE_FORCE_TRIGGER"
  | "RBAC_VIOLATION"
  | "JWT_KEY_ROTATION"
  | "INSPECTOR_APPROVED"
  | "USER_ROLE_CHANGE"
  | "USER_INVITED"
  | "USER_STATUS_TOGGLE"
  | "RULE_CREATE"
  | "RULE_UPDATE"
  | "RULE_DELETE"
  | "INSPECTION_REVIEW_OVERRIDE"
  | "SETTINGS_UPDATE"
  | "REPORT_EXPORT"
  | "IP_BLOCKED"
  | "ALERT_ACKNOWLEDGED";

export type AuditEntityType =
  | "user"
  | "rule"
  | "inspection"
  | "setting"
  | "system"
  | "security"
  | "admin";

export type AuditSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";

export type AuditStatus = "SUCCESS" | "FAILURE" | "SECURITY_ALERT" | "ACKNOWLEDGED";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: AuditActionType | string;
  entityType: AuditEntityType | string;
  entityId: string;
  ipAddress: string;
  severity: AuditSeverity;
  status: AuditStatus;
  description: string;
  metadata: Record<string, unknown>;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
}

export interface AuditLogStats {
  totalEvents: number;
  criticalAlerts: number;
  highAlerts: number;
  failedLogins24h: number;
  unacknowledgedAlerts: number;
  activeIncidents: number;
}
