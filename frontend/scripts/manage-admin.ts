/**
 * Admin Management Script for Validra.
 *
 * Usage:
 *   npx tsx scripts/manage-admin.ts create
 *   npx tsx scripts/manage-admin.ts list
 *   npx tsx scripts/manage-admin.ts deactivate <email>
 *   npx tsx scripts/manage-admin.ts activate <email>
 *   npx tsx scripts/manage-admin.ts reset-password <email> <new-password>
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function createAdmin() {
  const args = process.argv.slice(3);

  // Accept inline args: create <name> <email> <password>
  let name: string;
  let email: string;
  let password: string;

  if (args.length >= 3) {
    name = args[0];
    email = args[1];
    password = args[2];
  } else {
    console.error(
      "Usage: npx tsx scripts/manage-admin.ts create <full-name> <email> <password>"
    );
    console.error(
      'Example: npx tsx scripts/manage-admin.ts create "System Admin" admin@validra.gov.in SecurePass123'
    );
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    console.error(`Error: User with email '${normalizedEmail}' already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName: name.trim(),
      role: "ADMIN",
      isActive: true,
      isVerified: true,
    },
  });

  console.log(`\n✅ Admin created successfully!`);
  console.log(`   ID:    ${admin.id}`);
  console.log(`   Name:  ${admin.fullName}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role:  ${admin.role}`);
  console.log(`   Active: ${admin.isActive}`);
  console.log(`   Verified: ${admin.isVerified}\n`);
}

async function listAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
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

  if (admins.length === 0) {
    console.log("\nNo admin users found.\n");
    return;
  }

  console.log(`\n📋 Admin Users (${admins.length}):`);
  console.log("─".repeat(80));
  for (const admin of admins) {
    const status = admin.isActive ? "🟢 Active" : "🔴 Inactive";
    console.log(
      `  ${status}  ${admin.fullName.padEnd(25)} ${admin.email.padEnd(35)} ${admin.createdAt.toISOString().slice(0, 10)}`
    );
  }
  console.log("─".repeat(80) + "\n");
}

async function setAdminActive(email: string, active: boolean) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    console.error(`Error: No user found with email '${normalizedEmail}'.`);
    process.exit(1);
  }

  if (user.role !== "ADMIN") {
    console.error(`Error: User '${normalizedEmail}' is not an admin (role: ${user.role}).`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isActive: active },
  });

  console.log(
    `\n✅ Admin '${user.fullName}' (${normalizedEmail}) has been ${active ? "activated" : "deactivated"}.\n`
  );
}

async function resetPassword(email: string, newPassword: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    console.error(`Error: No user found with email '${normalizedEmail}'.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { passwordHash },
  });

  console.log(
    `\n✅ Password reset for '${user.fullName}' (${normalizedEmail}).\n`
  );
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case "create":
        await createAdmin();
        break;
      case "list":
        await listAdmins();
        break;
      case "deactivate": {
        const deactivateEmail = process.argv[3];
        if (!deactivateEmail) {
          console.error("Usage: npx tsx scripts/manage-admin.ts deactivate <email>");
          process.exit(1);
        }
        await setAdminActive(deactivateEmail, false);
        break;
      }
      case "activate": {
        const activateEmail = process.argv[3];
        if (!activateEmail) {
          console.error("Usage: npx tsx scripts/manage-admin.ts activate <email>");
          process.exit(1);
        }
        await setAdminActive(activateEmail, true);
        break;
      }
      case "reset-password": {
        const rpEmail = process.argv[3];
        const rpPassword = process.argv[4];
        if (!rpEmail || !rpPassword) {
          console.error(
            "Usage: npx tsx scripts/manage-admin.ts reset-password <email> <new-password>"
          );
          process.exit(1);
        }
        await resetPassword(rpEmail, rpPassword);
        break;
      }
      default:
        console.log(`
Validra Admin Management Script
================================

Commands:
  create <name> <email> <password>    Create a new admin user
  list                                 List all admin users
  activate <email>                     Activate an admin account
  deactivate <email>                   Deactivate an admin account
  reset-password <email> <password>    Reset an admin's password

Examples:
  npx tsx scripts/manage-admin.ts create "System Admin" admin@validra.gov.in Pass123!
  npx tsx scripts/manage-admin.ts list
  npx tsx scripts/manage-admin.ts deactivate admin@validra.gov.in
  npx tsx scripts/manage-admin.ts reset-password admin@validra.gov.in NewPass456!
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
