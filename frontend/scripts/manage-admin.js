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

async function createAdminInteractive() {
  console.log(colorize("\n👤 Create or Update Admin Account", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let name = "";
  while (!name) {
    name = await askQuestion(colorize("Full Name", "blue"), "System Admin");
    if (!name) console.log(colorize("❌ Name is required", "red"));
  }

  let email = "";
  while (!email) {
    const val = await askQuestion(colorize("Admin Email", "blue"));
    if (isValidEmail(val)) {
      email = val.toLowerCase().trim();
    } else {
      console.log(colorize("❌ Invalid email format", "red"));
    }
  }

  const password = await promptForPassword("Admin Password");
  const prisma = initPrisma();

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  if (existing) {
    const confirm = await askYesNo(
      colorize(`User '${email}' already exists. Update to ADMIN and set new password?`, "yellow"),
      "y"
    );
    if (!confirm) {
      console.log(colorize("Operation cancelled.", "yellow"));
      return;
    }
    const updated = await prisma.user.update({
      where: { email },
      data: {
        fullName: name.trim(),
        passwordHash,
        role: "ADMIN",
        isActive: true,
        isVerified: true,
      },
    });
    console.log(colorize("\n✅ Admin updated successfully!", "green"));
    console.log(`   ID:     ${updated.id}\n   Name:   ${updated.fullName}\n   Email:  ${updated.email}\n   Role:   ${updated.role}\n`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: name.trim(),
      role: "ADMIN",
      isActive: true,
      isVerified: true,
    },
  });

  console.log(colorize("\n✅ Admin created successfully!", "green"));
  console.log(`   ID:       ${admin.id}`);
  console.log(`   Name:     ${admin.fullName}`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   Active:   ${admin.isActive}`);
  console.log(`   Verified: ${admin.isVerified}\n`);
}

async function listAdmins() {
  console.log(colorize("\n📋 Admin Users", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━", "cyan"));

  const prisma = initPrisma();
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
    console.log(colorize("No admin users found.\n", "yellow"));
    return;
  }

  const tableData = admins.map((a) => ({
    Status: a.isActive ? "🟢 Active" : "🔴 Inactive",
    Verified: a.isVerified ? "✅" : "❌",
    Name: a.fullName,
    Email: a.email,
    Created: a.createdAt.toISOString().slice(0, 10),
  }));

  console.table(tableData);
  console.log(colorize(`Total: ${admins.length} admin(s)\n`, "dim"));
}

async function updateAdminPasswordInteractive() {
  console.log(colorize("\n🔑 Change Admin Password", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let email = await askQuestion(colorize("Admin Email", "blue"));
  email = email.toLowerCase().trim();
  if (!isValidEmail(email)) return console.log(colorize("❌ Invalid email format", "red"));

  const prisma = initPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") return console.log(colorize("❌ No ADMIN found with that email", "red"));

  const password = await promptForPassword("New Password");
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  console.log(colorize(`\n✅ Password updated successfully for '${user.fullName}' (${email})\n`, "green"));
}

async function toggleAdminStatusInteractive() {
  console.log(colorize("\n🔄 Toggle Admin Status (Activate / Deactivate)", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let email = await askQuestion(colorize("Admin Email", "blue"));
  email = email.toLowerCase().trim();
  if (!isValidEmail(email)) return console.log(colorize("❌ Invalid email format", "red"));

  const prisma = initPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") return console.log(colorize("❌ No ADMIN found with that email", "red"));

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
    colorize(`\n✅ Admin '${user.fullName}' is now ${newStatus ? "🟢 ACTIVE" : "🔴 INACTIVE"}\n`, "green")
  );
}

async function deleteAdminInteractive() {
  console.log(colorize("\n🗑️ Delete Admin Account", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let email = await askQuestion(colorize("Admin Email to Delete", "blue"));
  email = email.toLowerCase().trim();
  if (!isValidEmail(email)) return console.log(colorize("❌ Invalid email format", "red"));

  const prisma = initPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") return console.log(colorize("❌ No ADMIN found with that email", "red"));

  const confirm = await askYesNo(
    colorize(`⚠️  Are you sure you want to permanently delete ${user.fullName} (${email})?`, "red"),
    "n"
  );
  if (confirm) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log(colorize("\n✅ Admin account deleted successfully.\n", "green"));
  } else {
    console.log(colorize("\nDeletion cancelled.\n", "yellow"));
  }
}

async function interactiveMenu() {
  console.log(colorize("\n🛡️  VALIDRA - ADMIN MANAGEMENT", "cyan"));
  console.log(colorize("=============================", "cyan"));

  const options = [
    { label: "List Admin Users", value: "list" },
    { label: "Create or Update Admin User", value: "create" },
    { label: "Change Admin Password", value: "password" },
    { label: "Activate / Deactivate Admin", value: "toggle" },
    { label: "Delete Admin Account", value: "delete" },
    { label: "Exit", value: "exit" },
  ];

  try {
    while (true) {
      const choice = await askOptions("Select an operation:", options);
      if (choice === "exit") break;
      if (choice === "list") await listAdmins();
      if (choice === "create") await createAdminInteractive();
      if (choice === "password") await updateAdminPasswordInteractive();
      if (choice === "toggle") await toggleAdminStatusInteractive();
      if (choice === "delete") await deleteAdminInteractive();
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
      case "list":
        await listAdmins();
        break;

      case "create": {
        const name = process.argv[3];
        const email = process.argv[4];
        const password = process.argv[5];

        if (!name || !email || !password) {
          console.log(colorize("Interactive create mode:", "cyan"));
          await createAdminInteractive();
          break;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
          console.error(colorize(`Error: User with email '${normalizedEmail}' already exists.`, "red"));
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
        console.log(colorize(`\n✅ Admin created: ${admin.fullName} (${admin.email})`, "green"));
        break;
      }

      case "reset-password": {
        const email = process.argv[3];
        const newPassword = process.argv[4];

        if (!email || !newPassword) {
          console.error("Usage: node scripts/manage-admin.js reset-password <email> <new-password>");
          process.exit(1);
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user || user.role !== "ADMIN") {
          console.error(colorize(`Error: No admin found with email '${normalizedEmail}'.`, "red"));
          process.exit(1);
        }

        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
        console.log(colorize(`\n✅ Password reset for '${user.fullName}' (${user.email}).`, "green"));
        break;
      }

      case "deactivate": {
        const email = process.argv[3];
        if (!email) {
          console.error("Usage: node scripts/manage-admin.js deactivate <email>");
          process.exit(1);
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.update({
          where: { email: normalizedEmail },
          data: { isActive: false },
        });
        console.log(colorize(`\n🔴 Admin '${user.fullName}' deactivated.`, "yellow"));
        break;
      }

      case "activate": {
        const email = process.argv[3];
        if (!email) {
          console.error("Usage: node scripts/manage-admin.js activate <email>");
          process.exit(1);
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.update({
          where: { email: normalizedEmail },
          data: { isActive: true },
        });
        console.log(colorize(`\n🟢 Admin '${user.fullName}' activated.`, "green"));
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
