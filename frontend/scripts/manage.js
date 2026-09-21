const {
  initPrisma,
  colorize,
  askOptions,
  closeRL,
} = require("./utils");

async function main() {
  console.log(colorize("\n" + "=".repeat(60), "cyan"));
  console.log(colorize("       🛡️   VALIDRA - USER & ACCESS MANAGEMENT CLI", "bold"));
  console.log(colorize("=".repeat(60), "cyan"));

  const options = [
    { label: "👑 Admin Management (Create, List, Passwords, Access)", value: "admin" },
    { label: "👮 Inspector Management (Approve, List, Create, Reject)", value: "inspector" },
    { label: "📜 Security Audit Logs (List, Stats, Truncate, Alerts)", value: "logs" },
    { label: "📋 Quick Overview (All Users Summary)", value: "summary" },
    { label: "🚪 Exit", value: "exit" },
  ];

  try {
    while (true) {
      const choice = await askOptions("Select a section to manage:", options);

      if (choice === "exit") {
        console.log(colorize("\nGoodbye!\n", "green"));
        break;
      }

      if (choice === "admin") {
        delete require.cache[require.resolve("./manage-admin")];
        // Execute admin CLI
        process.argv = [process.argv[0], process.argv[1]];
        require("./manage-admin");
        break;
      }

      if (choice === "inspector") {
        delete require.cache[require.resolve("./manage-inspector")];
        // Execute inspector CLI
        process.argv = [process.argv[0], process.argv[1]];
        require("./manage-inspector");
        break;
      }

      if (choice === "logs") {
        delete require.cache[require.resolve("./manage-logs")];
        // Execute audit logs CLI
        process.argv = [process.argv[0], process.argv[1]];
        require("./manage-logs");
        break;
      }

      if (choice === "summary") {
        const prisma = initPrisma();
        const users = await prisma.user.findMany({
          select: {
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            badgeNumber: true,
            jurisdiction: true,
            createdAt: true,
          },
          orderBy: [{ role: "asc" }, { createdAt: "desc" }],
        });

        console.log(colorize("\n👥 All Users Summary", "cyan"));
        console.log(colorize("━━━━━━━━━━━━━━━━━━━", "cyan"));
        console.table(
          users.map((u) => ({
            Role: u.role,
            Status: u.isActive ? "🟢 Active" : "🔴 Inactive",
            Verified: u.isVerified ? "✅" : "❌",
            Name: u.fullName,
            Email: u.email,
            Zone: u.jurisdiction || "—",
            Joined: u.createdAt.toISOString().slice(0, 10),
          }))
        );
        console.log(colorize(`Total users: ${users.length}\n`, "dim"));
      }
    }
  } catch (error) {
    console.error(colorize(`\n❌ Error: ${error.message}`, "red"));
  } finally {
    closeRL();
    const prisma = initPrisma();
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
