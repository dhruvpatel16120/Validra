/**
 * Inspector Approval Script for Validra.
 *
 * Usage:
 *   npx tsx scripts/approve-inspector.ts list-pending
 *   npx tsx scripts/approve-inspector.ts list-all
 *   npx tsx scripts/approve-inspector.ts approve <email>
 *   npx tsx scripts/approve-inspector.ts reject <email>
 *   npx tsx scripts/approve-inspector.ts deactivate <email>
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function listPending() {
  const inspectors = await prisma.user.findMany({
    where: {
      role: "INSPECTOR",
      isActive: false,
      isVerified: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (inspectors.length === 0) {
    console.log("\nNo inspectors pending approval.\n");
    return;
  }

  console.log(`\n⏳ Inspectors Pending Approval (${inspectors.length}):`);
  console.log("─".repeat(80));
  for (const inspector of inspectors) {
    const verified = inspector.isVerified ? "✅ Verified" : "❌ Unverified";
    console.log(
      `  ${verified}  ${inspector.fullName.padEnd(25)} ${inspector.email.padEnd(35)} ${inspector.createdAt.toISOString().slice(0, 10)}`
    );
  }
  console.log("─".repeat(80) + "\n");
}

async function listAll() {
  const inspectors = await prisma.user.findMany({
    where: { role: "INSPECTOR" },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (inspectors.length === 0) {
    console.log("\nNo inspector accounts found.\n");
    return;
  }

  console.log(`\n📋 All Inspectors (${inspectors.length}):`);
  console.log("─".repeat(90));
  for (const inspector of inspectors) {
    const active = inspector.isActive ? "🟢 Active  " : "🔴 Inactive";
    const verified = inspector.isVerified ? "✅" : "❌";
    console.log(
      `  ${active}  ${verified}  ${inspector.fullName.padEnd(25)} ${inspector.email.padEnd(35)} ${inspector.createdAt.toISOString().slice(0, 10)}`
    );
  }
  console.log("─".repeat(90) + "\n");
}

async function approveInspector(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    console.error(`Error: No user found with email '${normalizedEmail}'.`);
    process.exit(1);
  }

  if (user.role !== "INSPECTOR") {
    console.error(`Error: User '${normalizedEmail}' is not an inspector (role: ${user.role}).`);
    process.exit(1);
  }

  if (user.isActive) {
    console.log(`Inspector '${user.fullName}' (${normalizedEmail}) is already approved/active.`);
    return;
  }

  if (!user.isVerified) {
    console.error(`Warning: Inspector '${normalizedEmail}' has not verified their email yet.`);
    console.error(`Approving anyway — they will still need to verify before login.`);
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isActive: true },
  });

  console.log(
    `\n✅ Inspector '${user.fullName}' (${normalizedEmail}) has been approved and activated.\n`
  );

  try {
    const { sendAccountApprovedEmail } = await import("../src/lib/email");
    await sendAccountApprovedEmail(normalizedEmail, user.fullName);
  } catch (err) {
    console.error("Note: Failed to send approval notification email:", err);
  }
}

async function rejectInspector(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    console.error(`Error: No user found with email '${normalizedEmail}'.`);
    process.exit(1);
  }

  if (user.role !== "INSPECTOR") {
    console.error(`Error: User '${normalizedEmail}' is not an inspector (role: ${user.role}).`);
    process.exit(1);
  }

  // Delete the rejected inspector account
  await prisma.user.delete({
    where: { email: normalizedEmail },
  });

  console.log(
    `\n🗑️  Inspector '${user.fullName}' (${normalizedEmail}) has been rejected and removed.\n`
  );
}

async function deactivateInspector(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    console.error(`Error: No user found with email '${normalizedEmail}'.`);
    process.exit(1);
  }

  if (user.role !== "INSPECTOR") {
    console.error(`Error: User '${normalizedEmail}' is not an inspector (role: ${user.role}).`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isActive: false },
  });

  console.log(
    `\n🔴 Inspector '${user.fullName}' (${normalizedEmail}) has been deactivated.\n`
  );
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case "list-pending":
        await listPending();
        break;
      case "list-all":
        await listAll();
        break;
      case "approve": {
        const approveEmail = process.argv[3];
        if (!approveEmail) {
          console.error("Usage: npx tsx scripts/approve-inspector.ts approve <email>");
          process.exit(1);
        }
        await approveInspector(approveEmail);
        break;
      }
      case "reject": {
        const rejectEmail = process.argv[3];
        if (!rejectEmail) {
          console.error("Usage: npx tsx scripts/approve-inspector.ts reject <email>");
          process.exit(1);
        }
        await rejectInspector(rejectEmail);
        break;
      }
      case "deactivate": {
        const deactivateEmail = process.argv[3];
        if (!deactivateEmail) {
          console.error("Usage: npx tsx scripts/approve-inspector.ts deactivate <email>");
          process.exit(1);
        }
        await deactivateInspector(deactivateEmail);
        break;
      }
      default:
        console.log(`
Validra Inspector Approval Script
===================================

Commands:
  list-pending                    List inspectors awaiting approval
  list-all                        List all inspector accounts
  approve <email>                 Approve and activate an inspector
  reject <email>                  Reject and delete an inspector account
  deactivate <email>              Deactivate an active inspector

Examples:
  npx tsx scripts/approve-inspector.ts list-pending
  npx tsx scripts/approve-inspector.ts approve inspector@example.com
  npx tsx scripts/approve-inspector.ts reject inspector@example.com
  npx tsx scripts/approve-inspector.ts deactivate inspector@example.com
`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
