const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Dhruv@123", 12);
  const inspectorPasswordHash = await bcrypt.hash("dhruv@345", 12);

  // 1. Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: "dhruvpatel16120@gmail.com" },
    update: {
      fullName: "Dhruv Patel",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
      isVerified: true,
    },
    create: {
      fullName: "Dhruv Patel",
      email: "dhruvpatel16120@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
      isVerified: true,
    },
  });
  console.log("✅ Admin created/updated:", admin.email, "(Role: ADMIN, Active: true, Verified: true)");

  // 2. Upsert Inspector
  const inspector = await prisma.user.upsert({
    where: { email: "digitaldhruv21@gmail.com" },
    update: {
      fullName: "Digital Dhruv",
      passwordHash: inspectorPasswordHash,
      role: "INSPECTOR",
      isActive: true,
      isVerified: true,
      badgeNumber: "LM-INSP-001",
      jurisdiction: "National",
    },
    create: {
      fullName: "Digital Dhruv",
      email: "digitaldhruv21@gmail.com",
      passwordHash: inspectorPasswordHash,
      role: "INSPECTOR",
      isActive: true,
      isVerified: true,
      badgeNumber: "LM-INSP-001",
      jurisdiction: "National",
    },
  });
  console.log("✅ Inspector created/approved:", inspector.email, "(Role: INSPECTOR, Active: true, Verified: true)");
}

main()
  .catch((e) => {
    console.error("Error creating users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
