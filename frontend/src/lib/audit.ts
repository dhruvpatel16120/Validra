import prisma from "@/lib/prisma";

export interface RecordAuditLogParams {
  userName: string;
  userEmail: string;
  userRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  severity?: "INFO" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "SUCCESS" | "FAILURE" | "SECURITY_ALERT" | "ACKNOWLEDGED";
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record a statutory security or authentication event in the immutable PostgreSQL audit_logs table.
 */
export async function recordAuditLog(params: RecordAuditLogParams) {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.auditLog.count();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const logCode = `AUD-${today}-${String(count + 1).padStart(4, "0")}-${randomSuffix}`;

    return await prisma.auditLog.create({
      data: {
        logCode,
        userName: params.userName,
        userEmail: params.userEmail,
        userRole: params.userRole || "inspector",
        action: params.action,
        entityType: params.entityType || "user",
        entityId: params.entityId || "USER",
        ipAddress: params.ipAddress || "127.0.0.1",
        severity: params.severity || "INFO",
        status: params.status || "SUCCESS",
        description: params.description,
        metadata: (params.metadata || {}) as any,
      },
    });
  } catch (error) {
    console.error("Failed to persist audit log entry:", error);
    return null;
  }
}
