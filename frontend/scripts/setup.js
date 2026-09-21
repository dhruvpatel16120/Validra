/* eslint-disable */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");
const { execSync } = require("child_process");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function colorize(text, color) {
  return (colors[color] || "") + text + colors.reset;
}

let rl;
function getRL() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

function closeRL() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

function ask(promptText, defaultValue = "") {
  const rlInstance = getRL();
  const prompt = defaultValue
    ? `${colorize(promptText, "cyan")} [${colorize(defaultValue, "dim")}]: `
    : `${colorize(promptText, "cyan")}: `;

  return new Promise((resolve) => {
    rlInstance.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function askOptions(promptText, options) {
  console.log(`\n${colorize(promptText, "bold")}`);
  options.forEach((opt, idx) => {
    console.log(`  ${colorize(String(idx + 1) + ".", "yellow")} ${opt.label}`);
  });
  return new Promise((resolve) => {
    const rlInstance = getRL();
    const promptUser = () => {
      rlInstance.question(colorize("\nSelect an option [1-" + options.length + "]: ", "blue"), (ans) => {
        const num = parseInt(ans.trim(), 10);
        if (!isNaN(num) && num >= 1 && num <= options.length) {
          resolve(options[num - 1].value);
        } else {
          console.log(colorize("❌ Invalid selection. Please choose 1-" + options.length, "red"));
          promptUser();
        }
      });
    };
    promptUser();
  });
}

async function setupEnv(frontendDir) {
  const envPath = path.join(frontendDir, ".env");
  const envExamplePath = path.join(frontendDir, ".env.example");

  console.log(colorize("\n⚙️  Environment Configuration (.env)", "cyan"));
  console.log(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"));

  let existingEnv = {};
  if (fs.existsSync(envPath)) {
    console.log(colorize("⚠️  An existing .env file was detected.", "yellow"));
    const choice = await askOptions("How would you like to proceed with .env?", [
      { label: "Keep current .env (skip configuration)", value: "keep" },
      { label: "Backup current .env and create a new one", value: "backup" },
      { label: "Overwrite current .env directly", value: "overwrite" },
    ]);

    if (choice === "keep") {
      console.log(colorize("✅ Kept existing .env file.", "green"));
      return;
    }

    if (choice === "backup") {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(frontendDir, `.env.backup.${timestamp}`);
      fs.copyFileSync(envPath, backupPath);
      console.log(colorize(`📦 Existing .env backed up to: ${path.basename(backupPath)}`, "green"));
    }

    // Parse existing values to use as defaults
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
          existingEnv[key] = val;
        }
      });
    } catch (_) {}
  }

  console.log(colorize("\nPlease enter your environment configuration values (press Enter to accept defaults):", "dim"));

  // 1. API Base URL
  const apiBaseUrl = await ask(
    "FastAPI Backend URL",
    existingEnv.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  );

  // 2. Database URL
  const dbUrl = await ask(
    "PostgreSQL Database URL (Prisma)",
    existingEnv.DATABASE_URL || "postgresql://postgres:root@localhost:5432/validra"
  );

  // 3. Auth Secret
  const defaultSecret =
    existingEnv.AUTH_SECRET || "validra-default-jwt-secret-key-change-in-production";
  console.log(colorize("\n🔐 Auth Secret (Shared JWT key between Next.js and FastAPI):", "dim"));
  const secretChoice = await askOptions("Select Auth Secret method:", [
    { label: `Use standard development secret ("${defaultSecret}")`, value: "default" },
    { label: "Auto-generate a secure 32-byte hex secret", value: "generate" },
    { label: "Enter a custom secret key manually", value: "custom" },
  ]);

  let authSecret = defaultSecret;
  if (secretChoice === "generate") {
    authSecret = crypto.randomBytes(32).toString("hex");
    console.log(colorize(`   Generated Secret: ${authSecret}`, "green"));
  } else if (secretChoice === "custom") {
    authSecret = await ask("Enter custom AUTH_SECRET", defaultSecret);
  }

  // 4. NextAuth URL
  const nextAuthUrl = await ask(
    "Next.js App URL (NEXTAUTH_URL)",
    existingEnv.NEXTAUTH_URL || "http://localhost:3000"
  );

  // 5. Email Notifications (Nodemailer SMTP)
  console.log(colorize("\n📧 Email / SMTP Configuration (Gmail App Password):", "dim"));
  const emailFrom = await ask(
    "Sender Email (EMAIL_FROM)",
    existingEnv.EMAIL_FROM || "validra.metrology@gmail.com"
  );
  const emailPassword = await ask(
    "SMTP App Password (EMAIL_PASSWORD)",
    existingEnv.EMAIL_PASSWORD || "edjmfmqkgrualfzn"
  );
  const emailHost = await ask("SMTP Host", existingEnv.EMAIL_HOST || "smtp.gmail.com");
  const emailPort = await ask("SMTP Port", existingEnv.EMAIL_PORT || "587");

  // 6. Dev Auth Bypass
  const bypassAuth = await ask(
    "Enable Inspection Auth Bypass for Dev? (true/false)",
    existingEnv.NEXT_PUBLIC_BYPASS_INSPECTION_AUTH || "false"
  );

  // Construct .env content
  const envContent = `# Validra Frontend Environment Variables
# Generated interactively via setup.js on ${new Date().toISOString()}

# Backend API Endpoint
NEXT_PUBLIC_API_BASE_URL=${apiBaseUrl}

# Environment Mode
NEXT_PUBLIC_APP_ENV=development

# Database (Prisma PostgreSQL)
DATABASE_URL="${dbUrl}"

# NextAuth / Auth.js v5 Shared JWT Secrets
AUTH_SECRET="${authSecret}"
NEXTAUTH_SECRET="${authSecret}"
NEXTAUTH_URL="${nextAuthUrl}"

# Email (Nodemailer SMTP)
EMAIL_FROM="${emailFrom}"
EMAIL_PASSWORD="${emailPassword}"
EMAIL_HOST="${emailHost}"
EMAIL_PORT=${emailPort}

# Inspection Auth Bypass (set to true to view inspector pages without login)
NEXT_PUBLIC_BYPASS_INSPECTION_AUTH=${bypassAuth}
NEXT_PUBLIC_DEV_AUTH_BYPASS=${bypassAuth}
`;

  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log(colorize("\n✅ Successfully created/updated .env file!", "green"));
}

async function main() {
  console.log(colorize("\n" + "=".repeat(60), "cyan"));
  console.log(colorize("  🚀 VALIDRA FRONTEND - INTERACTIVE SETUP & INSTALLATION", "bold"));
  console.log(colorize("=".repeat(60), "cyan"));

  const frontendDir = path.resolve(__dirname, "..");

  try {
    // 1. Configure .env
    await setupEnv(frontendDir);

    // 2. Install / Verify Dependencies
    console.log(colorize("\n📦 Checking and installing dependencies via npm...", "cyan"));
    execSync("npm install", {
      cwd: frontendDir,
      stdio: "inherit",
      shell: true,
    });
    console.log(colorize("✅ Dependencies ready.", "green"));

    // 3. Generate Prisma Client
    console.log(colorize("\n🗄️  Generating Prisma Client...", "cyan"));
    try {
      execSync("npx prisma generate", {
        cwd: frontendDir,
        stdio: "inherit",
        shell: true,
      });
      console.log(colorize("✅ Prisma Client generated successfully.", "green"));
    } catch (err) {
      console.log(colorize(`⚠️  Prisma generate notice: ${err.message}`, "yellow"));
    }

    console.log(colorize("\n" + "=".repeat(60), "green"));
    console.log(colorize("  🎉 SETUP COMPLETED SUCCESSFULLY!", "bold"));
    console.log(colorize("=".repeat(60), "green"));
    console.log(colorize("\nNext steps:", "bold"));
    console.log(`  ▶️  Interactive CLI Management: ${colorize("npm run manage", "cyan")}`);
    console.log(`  ▶️  Start Dev Server:          ${colorize("npm run dev", "cyan")}\n`);
  } catch (err) {
    console.error(colorize(`\n❌ Setup encountered an error: ${err.message}`, "red"));
  } finally {
    closeRL();
  }
}

if (require.main === module) {
  main();
}
