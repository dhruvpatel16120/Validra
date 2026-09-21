const bcrypt = require("bcryptjs");
const {
  initPrisma,
  colorize,
  askQuestion,
  askOptions,
  askYesNo,
  isValidEmail,
  promptForPassword,
  closeRL,
} = require("./utils");

const SALT_ROUNDS = 12;

async function listPendingInspectors() {
  console.log(colorize("\n⏳ Inspectors Pending Approval", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  const prisma = initPrisma();
  const inspectors = await prisma.user.findMany({
    where: {
      role: "INSPECTOR",
      isActive: false,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      badgeNumber: true,
      jurisdiction: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (inspectors.length === 0) {
    console.log(colorize("No inspectors pending approval.\n", "green"));
    return [];
  }

  const tableData = inspectors.map((u, i) => ({
    "#": i + 1,
    Verified: u.isVerified ? "✅ Yes" : "❌ No",
    Name: u.fullName,
    Email: u.email,
    Badge: u.badgeNumber || "—",
    Jurisdiction: u.jurisdiction || "—",
    Registered: u.createdAt.toISOString().slice(0, 10),
  }));

  console.table(tableData);
  console.log(colorize(`Total pending: ${inspectors.length}\n`, "dim"));
  return inspectors;
}

async function approveInspectorInteractive() {
  console.log(colorize("\n✅ Approve Pending Inspector", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  const pending = await listPendingInspectors();
  if (pending.length === 0) return;

  const choice = await askQuestion(
    colorize("Enter Inspector # or Email to approve", "blue")
  );
  if (!choice) return;

  let targetUser = null;
  const num = parseInt(choice, 10);
  if (!isNaN(num) && num >= 1 && num <= pending.length) {
    targetUser = pending[num - 1];
  } else {
    targetUser = pending.find(
      (u) => u.email.toLowerCase() === choice.toLowerCase().trim()
    );
  }

  const prisma = initPrisma();

  if (!targetUser) {
    // Try finding by email directly from DB
    targetUser = await prisma.user.findUnique({
      where: { email: choice.toLowerCase().trim() },
    });
  }

  if (!targetUser) {
    console.log(colorize(`❌ No inspector found for '${choice}'.`, "red"));
    return;
  }

  const confirm = await askYesNo(
    colorize(`Approve and activate inspector '${targetUser.fullName}' (${targetUser.email})?`, "green"),
    "y"
  );
  if (!confirm) {
    console.log(colorize("Approval cancelled.", "yellow"));
    return;
  }

  const updated = await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      isActive: true,
      isVerified: true,
    },
  });

  console.log(colorize(`\n🎉 Inspector '${updated.fullName}' (${updated.email}) is now APPROVED & ACTIVE!`, "green"));
  console.log(colorize("   They can now log in to their Validra Inspector workspace.\n", "dim"));
}

async function rejectInspectorInteractive() {
  console.log(colorize("\n❌ Reject Inspector Account", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  const pending = await listPendingInspectors();
  const choice = await askQuestion(
    colorize("Enter Inspector # or Email to reject / delete", "blue")
  );
  if (!choice) return;

  let targetUser = null;
  const num = parseInt(choice, 10);
  if (!isNaN(num) && num >= 1 && num <= pending.length) {
    targetUser = pending[num - 1];
  } else {
    const prisma = initPrisma();
    targetUser = await prisma.user.findUnique({
      where: { email: choice.toLowerCase().trim() },
    });
  }

  if (!targetUser) {
    console.log(colorize(`❌ No user found for '${choice}'.`, "red"));
    return;
  }

  const confirm = await askYesNo(
    colorize(`⚠️  Are you sure you want to permanently delete registration for '${targetUser.fullName}' (${targetUser.email})?`, "red"),
    "n"
  );
  if (!confirm) {
    console.log(colorize("Rejection cancelled.", "yellow"));
    return;
  }

  const prisma = initPrisma();
  await prisma.user.delete({ where: { id: targetUser.id } });
  console.log(colorize(`\n✅ Inspector registration for '${targetUser.fullName}' deleted.\n`, "green"));
}

async function listAllInspectors() {
  console.log(colorize("\n📋 All Field Inspectors", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  const prisma = initPrisma();
  const inspectors = await prisma.user.findMany({
    where: { role: "INSPECTOR" },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      isVerified: true,
      badgeNumber: true,
      jurisdiction: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (inspectors.length === 0) {
    console.log(colorize("No inspector accounts found.\n", "yellow"));
    return;
  }

  const tableData = inspectors.map((u) => ({
    Status: u.isActive ? "🟢 Active" : "⏳ Pending/Off",
    Verified: u.isVerified ? "✅" : "❌",
    Name: u.fullName,
    Email: u.email,
    Badge: u.badgeNumber || "—",
    Jurisdiction: u.jurisdiction || "—",
    Created: u.createdAt.toISOString().slice(0, 10),
  }));

  console.table(tableData);
  console.log(colorize(`Total inspectors: ${inspectors.length}\n`, "dim"));
}

async function createInspectorInteractive() {
  console.log(colorize("\n👤 Create New Inspector Account", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let name = "";
  while (!name) {
    name = await askQuestion(colorize("Full Name", "blue"), "Inspector Sharma");
    if (!name) console.log(colorize("❌ Name is required", "red"));
  }

  let email = "";
  while (!email) {
    const val = await askQuestion(colorize("Inspector Email", "blue"));
    if (isValidEmail(val)) {
      email = val.toLowerCase().trim();
    } else {
      console.log(colorize("❌ Invalid email format", "red"));
    }
  }

  const badgeNumber = await askQuestion(colorize("Badge Number (optional)", "blue"), "LM-DEL-2024-089");
  const jurisdiction = await askQuestion(colorize("Enforcement Zone / Jurisdiction (optional)", "blue"), "Delhi NCR - Central Zone");
  const autoApprove = await askYesNo(colorize("Activate and approve immediately?", "blue"), "y");
  const password = await promptForPassword("Inspector Password");

  const prisma = initPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(colorize(`❌ User with email '${email}' already exists.`, "red"));
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const inspector = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: name.trim(),
      role: "INSPECTOR",
      isActive: autoApprove,
      isVerified: true,
      badgeNumber: badgeNumber.trim() || null,
      jurisdiction: jurisdiction.trim() || null,
    },
  });

  console.log(colorize("\n✅ Inspector account created successfully!", "green"));
  console.log(`   ID:           ${inspector.id}`);
  console.log(`   Name:         ${inspector.fullName}`);
  console.log(`   Email:        ${inspector.email}`);
  console.log(`   Role:         ${inspector.role}`);
  console.log(`   Status:       ${inspector.isActive ? "🟢 ACTIVE" : "⏳ PENDING APPROVAL"}`);
  console.log(`   Jurisdiction: ${inspector.jurisdiction || "—"}\n`);
}

async function updateInspectorPasswordInteractive() {
  console.log(colorize("\n🔑 Change Inspector Password", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let email = await askQuestion(colorize("Inspector Email", "blue"));
  email = email.toLowerCase().trim();
  if (!isValidEmail(email)) return console.log(colorize("❌ Invalid email format", "red"));

  const prisma = initPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "INSPECTOR") return console.log(colorize("❌ No INSPECTOR found with that email", "red"));

  const password = await promptForPassword("New Password");
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  console.log(colorize(`\n✅ Password updated successfully for '${user.fullName}' (${email})\n`, "green"));
}

async function toggleInspectorStatusInteractive() {
  console.log(colorize("\n🔄 Toggle Inspector Status (Activate / Deactivate)", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let email = await askQuestion(colorize("Inspector Email", "blue"));
  email = email.toLowerCase().trim();
  if (!isValidEmail(email)) return console.log(colorize("❌ Invalid email format", "red"));

  const prisma = initPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "INSPECTOR") return console.log(colorize("❌ No INSPECTOR found with that email", "red"));

  const newStatus = !user.isActive;
  const actionName = newStatus ? "activate" : "deactivate";

  const confirm = await askYesNo(
    colorize(`Are you sure you want to ${actionName} '${user.fullName}' (${email})?`, "yellow"),
    "y"
  );
  if (!confirm) {
    console.log(colorize("Operation cancelled.", "yellow"));
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: newStatus },
  });

  console.log(
    colorize(`\n✅ Inspector '${user.fullName}' is now ${newStatus ? "🟢 ACTIVE" : "🔴 INACTIVE"}\n`, "green")
  );
}

async function interactiveMenu() {
  console.log(colorize("\n👮 VALIDRA - INSPECTOR MANAGEMENT", "cyan"));
  console.log(colorize("================================", "cyan"));

  const options = [
    { label: "List Pending Inspector Approvals", value: "pending" },
    { label: "Approve a Pending Inspector", value: "approve" },
    { label: "Reject / Delete Inspector Account", value: "reject" },
    { label: "List All Inspectors", value: "list" },
    { label: "Create New Inspector", value: "create" },
    { label: "Change Inspector Password", value: "password" },
    { label: "Activate / Deactivate Inspector", value: "toggle" },
    { label: "Exit", value: "exit" },
  ];

  try {
    while (true) {
      const choice = await askOptions("Select an operation:", options);
      if (choice === "exit") break;
      if (choice === "pending") await listPendingInspectors();
      if (choice === "approve") await approveInspectorInteractive();
      if (choice === "reject") await rejectInspectorInteractive();
      if (choice === "list") await listAllInspectors();
      if (choice === "create") await createInspectorInteractive();
      if (choice === "password") await updateInspectorPasswordInteractive();
      if (choice === "toggle") await toggleInspectorStatusInteractive();
    }
  } catch (error) {
    console.error(colorize(`\n❌ Error: ${error.message}`, "red"));
  } finally {
    closeRL();
    const prisma = initPrisma();
    await prisma.$disconnect();
  }
}

async function handleCLI() {
  const command = process.argv[2];

  if (!command) {
    await interactiveMenu();
    return;
  }

  const prisma = initPrisma();
  try {
    switch (command.toLowerCase()) {
      case "list-pending":
      case "pending":
        await listPendingInspectors();
        break;

      case "list":
      case "list-all":
        await listAllInspectors();
        break;

      case "approve": {
        const email = process.argv[3];
        if (!email) {
          await approveInspectorInteractive();
          break;
        }
        const normalized = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalized } });
        if (!user || user.role !== "INSPECTOR") {
          console.error(colorize(`Error: No inspector found with email '${normalized}'.`, "red"));
          process.exit(1);
        }
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true, isVerified: true },
        });
        console.log(colorize(`\n✅ Inspector '${updated.fullName}' (${updated.email}) APPROVED & ACTIVATED.`, "green"));
        break;
      }

      case "reject": {
        const email = process.argv[3];
        if (!email) {
          await rejectInspectorInteractive();
          break;
        }
        const normalized = email.toLowerCase().trim();
        await prisma.user.delete({ where: { email: normalized } });
        console.log(colorize(`\n✅ Inspector '${normalized}' deleted.`, "green"));
        break;
      }

      case "deactivate": {
        const email = process.argv[3];
        if (!email) {
          console.error("Usage: node scripts/manage-inspector.js deactivate <email>");
          process.exit(1);
        }
        const normalized = email.toLowerCase().trim();
        const user = await prisma.user.update({
          where: { email: normalized },
          data: { isActive: false },
        });
        console.log(colorize(`\n🔴 Inspector '${user.fullName}' deactivated.`, "yellow"));
        break;
      }

      case "activate": {
        const email = process.argv[3];
        if (!email) {
          console.error("Usage: node scripts/manage-inspector.js activate <email>");
          process.exit(1);
        }
        const normalized = email.toLowerCase().trim();
        const user = await prisma.user.update({
          where: { email: normalized },
          data: { isActive: true },
        });
        console.log(colorize(`\n🟢 Inspector '${user.fullName}' activated.`, "green"));
        break;
      }

      default:
        console.log(colorize(`Unknown command '${command}'. Launching interactive menu...`, "yellow"));
        await interactiveMenu();
        break;
    }
  } finally {
    closeRL();
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  handleCLI();
}
