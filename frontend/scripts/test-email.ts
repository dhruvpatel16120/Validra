/**
 * Email Testing & Diagnostics Tool for Validra
 * Usage:
 *   npx tsx scripts/test-email.ts [recipient-email]
 */

import dotenv from "dotenv";
import path from "path";
import nodemailer from "nodemailer";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const rawEmail = process.env.EMAIL_FROM || "validra.metrology@gmail.com";
const rawPass = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "").replace(/^["']|["']$/g, "");
const recipient = process.argv[2] || rawEmail;

console.log("\n=======================================================");
console.log(" 📧 Validra SMTP & Email Diagnostics Tool");
console.log("=======================================================");
console.log(` From User : ${rawEmail}`);
console.log(` Pass Len  : ${rawPass.length} chars (masked: ${rawPass.slice(0, 3)}...${rawPass.slice(-3)})`);
console.log(` Target To : ${recipient}`);
console.log("-------------------------------------------------------");

async function run() {
  console.log("1. Testing connection to Gmail SMTP service...");
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: rawEmail,
      pass: rawPass,
    },
  });

  try {
    const verified = await transporter.verify();
    console.log("   ✅ SMTP Server Connection: VERIFIED & READY!", verified);
  } catch (err: any) {
    console.error("   ❌ Connection Failed!");
    console.error(`      Message: ${err.message}`);
    if (err.responseCode === 535 || err.code === "EAUTH") {
      console.log("\n   💡 [TROUBLESHOOTING GMAIL 535 BAD CREDENTIALS]:");
      console.log("      1. Go to: https://myaccount.google.com/security");
      console.log("      2. Ensure '2-Step Verification' is turned ON for this Google account.");
      console.log("      3. Go to: https://myaccount.google.com/apppasswords");
      console.log("      4. Create a new App Password named 'Validra'.");
      console.log("      5. Copy the 16-character code and put it in frontend/.env:");
      console.log("         EMAIL_PASSWORD=\"xxxx xxxx xxxx xxxx\"");
      console.log("      6. Re-run: npm run email:test");
    }
    return;
  }

  console.log(`\n2. Sending test template to ${recipient}...`);
  try {
    const { sendVerificationEmail } = await import("../src/lib/email");
    await sendVerificationEmail(recipient, "test-diagnostic-token-123456", "Test Inspector");
    console.log(`   ✅ Test verification email dispatched successfully to ${recipient}!`);
    console.log("   Check your inbox/spam folder to see the template.");
  } catch (sendErr: any) {
    console.error("   ❌ Failed to send email:", sendErr.message);
  }
  console.log("=======================================================\n");
}

run();
