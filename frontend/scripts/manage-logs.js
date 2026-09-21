#!/usr/bin/env node

/**
 * Validra CLI — Security Audit Logs Management Script
 *
 * Usage:
 *   node scripts/manage-logs.js             # Interactive Menu
 *   node scripts/manage-logs.js list        # List recent audit logs
 *   node scripts/manage-logs.js stats       # Show audit ledger statistics
 *   node scripts/manage-logs.js truncate    # Truncate / Clear all audit logs (with confirmation)
 *   node scripts/manage-logs.js acknowledge # Acknowledge pending security alert
 *   node scripts/manage-logs.js seed-sample # Add sample realistic security events
 */

const {
  initPrisma,
  colorize,
  askQuestion,
  askYesNo,
  closeRL,
} = require("./utils");

async function listAuditLogs(limit = 15) {
  const prisma = initPrisma();
  console.log(colorize(`\n--- Recent Security Audit Trail (Last ${limit} records) ---`, "bold"));

  try {
    const logs = await prisma.$queryRawUnsafe(
      `SELECT id, log_code, timestamp, user_name, user_email, action, severity, status, ip_address, description
       FROM audit_logs
       ORDER BY timestamp DESC
       LIMIT $1`,
      limit
    );

    if (!logs || logs.length === 0) {
      console.log(colorize("\n[!] The audit log ledger in PostgreSQL is currently EMPTY (0 records).\n", "yellow"));
      return [];
    }

    console.log();
    console.table(
      logs.map((l) => ({
        "Log Code": l.log_code || l.id,
        "Timestamp (UTC)": new Date(l.timestamp).toISOString().substring(0, 19).replace("T", " "),
        "Severity": l.severity,
        "Action Code": l.action,
        "Status": l.status,
        "Officer / Actor": `${l.user_name} (${l.user_email})`,
        "Origin IP": l.ip_address,
      }))
    );
    console.log();
    return logs;
  } catch (err) {
    console.error(colorize(`\n[!] Failed to query audit_logs: ${err.message}`, "red"));
    return [];
  }
}

async function showAuditStats() {
  const prisma = initPrisma();
  console.log(colorize("\n--- PostgreSQL Audit Ledger Statistics ---", "bold"));

  try {
    const [totalRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM audit_logs`);
    const [critRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM audit_logs WHERE severity = 'CRITICAL'`);
    const [highRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM audit_logs WHERE severity = 'HIGH'`);
    const [unackRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM audit_logs WHERE status = 'SECURITY_ALERT' AND acknowledged_by IS NULL`);

    console.log(`  Total Recorded Events:      ${colorize(totalRes?.count || 0, "bold")}`);
    console.log(`  Critical Severity Alerts:   ${colorize(critRes?.count || 0, critRes?.count > 0 ? "red" : "green")}`);
    console.log(`  High Severity Alerts:       ${colorize(highRes?.count || 0, highRes?.count > 0 ? "yellow" : "green")}`);
    console.log(`  Unacknowledged Incidents:   ${colorize(unackRes?.count || 0, unackRes?.count > 0 ? "red" : "green")}\n`);
  } catch (err) {
    console.error(colorize(`[!] Failed to fetch audit statistics: ${err.message}`, "red"));
  }
}

async function truncateAuditLogs() {
  const prisma = initPrisma();
  console.log(colorize("\n--- Truncate / Clear Audit Ledger ---", "bold"));

  const [countRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM audit_logs`);
  const currentCount = countRes?.count || 0;

  if (currentCount === 0) {
    console.log(colorize("[i] Audit ledger is already empty. Nothing to truncate.\n", "cyan"));
    return;
  }

  console.log(colorize(`[!] WARNING: You are about to permanently delete all ${currentCount} audit log records from PostgreSQL.`, "yellow"));
  const confirmed = await askYesNo("Are you sure you want to proceed with TRUNCATE?", "n");

  if (!confirmed) {
    console.log(colorize("[*] Truncate operation canceled by user.\n", "cyan"));
    return;
  }

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE audit_logs CASCADE`);
    console.log(colorize(`\n[+] Successfully truncated audit_logs table. Deleted ${currentCount} records.\n`, "green"));
  } catch (err) {
    console.error(colorize(`\n[!] Error truncating table: ${err.message}`, "red"));
  }
}

async function acknowledgeAlert() {
  const prisma = initPrisma();
  console.log(colorize("\n--- Acknowledge Security Alert ---", "bold"));

  try {
    const unackLogs = await prisma.$queryRawUnsafe(
      `SELECT id, log_code, action, description, ip_address, timestamp
       FROM audit_logs
       WHERE status = 'SECURITY_ALERT' AND acknowledged_by IS NULL
       ORDER BY timestamp DESC`
    );

    if (!unackLogs || unackLogs.length === 0) {
      console.log(colorize("[i] There are no pending unacknowledged security alerts.\n", "green"));
      return;
    }

    console.log("Unacknowledged Alerts:");
    unackLogs.forEach((l, idx) => {
      console.log(`  [${idx + 1}] ${colorize(l.log_code, "bold")} · ${colorize(l.action, "yellow")} from ${l.ip_address}: ${l.description}`);
    });

    const targetCode = await askQuestion("\nEnter Log Code or Number to acknowledge (or press Enter to cancel)");
    if (!targetCode) return;

    let selectedLog = null;
    const num = parseInt(targetCode, 10);
    if (!isNaN(num) && num >= 1 && num <= unackLogs.length) {
      selectedLog = unackLogs[num - 1];
    } else {
      selectedLog = unackLogs.find((l) => l.log_code.toLowerCase() === targetCode.toLowerCase() || l.id === targetCode);
    }

    if (!selectedLog) {
      console.log(colorize("[!] Alert record not found.\n", "red"));
      return;
    }

    const approverEmail = await askQuestion("Supervisor Email", "admin@validra.gov.in");
    await prisma.$executeRawUnsafe(
      `UPDATE audit_logs
       SET status = 'ACKNOWLEDGED', acknowledged_by = $1, acknowledged_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      approverEmail,
      selectedLog.id
    );

    console.log(colorize(`\n[+] Alert ${selectedLog.log_code} successfully acknowledged by ${approverEmail}.\n`, "green"));
  } catch (err) {
    console.error(colorize(`[!] Failed to acknowledge alert: ${err.message}`, "red"));
  }
}

async function seedSampleLogs() {
  const prisma = initPrisma();
  console.log(colorize("\n--- Seed Sample Regulatory Audit Events ---", "bold"));

  const confirmed = await askYesNo("Insert 3 sample statutory security events into PostgreSQL?", "y");
  if (!confirmed) return;

  const now = new Date();
  const samples = [
    {
      id: `cuid_${Date.now()}_1`,
      logCode: `AUD-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
      timestamp: new Date(Date.now() - 3600000),
      userName: "System Admin",
      userEmail: "admin@validra.gov.in",
      userRole: "admin",
      action: "ADMIN_LOGIN",
      entityType: "user",
      entityId: "SYSTEM",
      ipAddress: "127.0.0.1",
      severity: "INFO",
      status: "SUCCESS",
      description: "Administrative console accessed via credentials authentication.",
      metadata: JSON.stringify({ userAgent: "CLI Management Script" }),
    },
    {
      id: `cuid_${Date.now()}_2`,
      logCode: `AUD-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0002`,
      timestamp: new Date(Date.now() - 1800000),
      userName: "Intrusion Detector",
      userEmail: "security@validra.gov.in",
      userRole: "system",
      action: "BRUTE_FORCE_TRIGGER",
      entityType: "security",
      entityId: "AUTH_PORTAL",
      ipAddress: "198.51.100.84",
      severity: "CRITICAL",
      status: "SECURITY_ALERT",
      description: "5 consecutive failed authentication attempts from external IP. Subnet temporarily rate-limited.",
      metadata: JSON.stringify({ rateLimitWindow: "15m", failedCount: 5 }),
    },
    {
      id: `cuid_${Date.now()}_3`,
      logCode: `AUD-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0003`,
      timestamp: new Date(),
      userName: "System Admin",
      userEmail: "admin@validra.gov.in",
      userRole: "admin",
      action: "RULE_UPDATE",
      entityType: "rule",
      entityId: "C01",
      ipAddress: "127.0.0.1",
      severity: "INFO",
      status: "SUCCESS",
      description: "Updated mandatory statutory declaration text pattern for Rule C01 (MRP Currency Prefix).",
      metadata: JSON.stringify({ ruleCode: "C01", version: "v1.4.0" }),
    },
  ];

  try {
    for (const s of samples) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO audit_logs (
          id, log_code, timestamp, user_name, user_email, user_role,
          action, entity_type, entity_id, ip_address, severity, status,
          description, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::json, NOW(), NOW()
        ) ON CONFLICT (log_code) DO NOTHING`,
        s.id,
        s.logCode,
        s.timestamp,
        s.userName,
        s.userEmail,
        s.userRole,
        s.action,
        s.entityType,
        s.entityId,
        s.ipAddress,
        s.severity,
        s.status,
        s.description,
        s.metadata
      );
    }
    console.log(colorize("\n[+] Inserted sample regulatory security events into PostgreSQL.\n", "green"));
  } catch (err) {
    console.error(colorize(`[!] Error seeding sample logs: ${err.message}`, "red"));
  }
}

async function interactiveMenu() {
  while (true) {
    console.log(colorize("===============================================", "blue"));
    console.log(colorize("     VALIDRA SECURITY AUDIT LOGS MANAGER       ", "bold"));
    console.log(colorize("===============================================", "blue"));
    console.log("  1. List recent audit records");
    console.log("  2. View audit telemetry statistics");
    console.log("  3. Truncate / Clear all audit logs (PostgreSQL)");
    console.log("  4. Acknowledge pending security alert");
    console.log("  5. Seed sample regulatory audit events");
    console.log("  6. Exit");
    console.log(colorize("-----------------------------------------------", "dim"));

    const choice = await askQuestion("Select an option [1-6]", "1");

    switch (choice) {
      case "1":
        await listAuditLogs(20);
        break;
      case "2":
        await showAuditStats();
        break;
      case "3":
        await truncateAuditLogs();
        break;
      case "4":
        await acknowledgeAlert();
        break;
      case "5":
        await seedSampleLogs();
        break;
      case "6":
        console.log(colorize("Exiting.", "dim"));
        closeRL();
        process.exit(0);
      default:
        console.log(colorize("Invalid option. Try again.", "red"));
    }
  }
}

async function main() {
  const arg = process.argv[2];

  switch (arg) {
    case "list":
      await listAuditLogs(50);
      closeRL();
      break;
    case "stats":
      await showAuditStats();
      closeRL();
      break;
    case "truncate":
    case "clear":
      await truncateAuditLogs();
      closeRL();
      break;
    case "acknowledge":
    case "ack":
      await acknowledgeAlert();
      closeRL();
      break;
    case "seed-sample":
    case "seed":
      await seedSampleLogs();
      closeRL();
      break;
    default:
      await interactiveMenu();
      break;
  }
}

main().catch((err) => {
  console.error(colorize(`Fatal error: ${err.message}`, "red"));
  closeRL();
  process.exit(1);
});
