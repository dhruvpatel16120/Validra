/**
 * Validra Legal Metrology — Enterprise Email Service
 * Powered by Nodemailer + Gmail SMTP / Custom SMTP.
 *
 * Provides beautiful, accessible, responsive HTML & plaintext templates for:
 * 1. Email Verification (Registration / Resend)
 * 2. Password Reset (Forgot Password)
 * 3. Account Approval (Admin Approval Notification)
 * 4. Password Changed Security Alert
 * 5. Welcome & Onboarding
 */

import nodemailer from "nodemailer";

// Clean credentials (strip accidental spaces or quotes)
const rawEmail = process.env.EMAIL_FROM || "validra.metrology@gmail.com";
const rawPassword = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "").replace(/^["']|["']$/g, "");
const host = process.env.EMAIL_HOST || "smtp.gmail.com";
const port = Number(process.env.EMAIL_PORT) || 587;
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Create reusable transporter
const transporter = nodemailer.createTransport(
  host === "smtp.gmail.com"
    ? {
        service: "gmail",
        auth: {
          user: rawEmail,
          pass: rawPassword,
        },
      }
    : {
        host,
        port,
        secure: port === 465,
        auth: {
          user: rawEmail,
          pass: rawPassword,
        },
      }
);

const FROM_HEADER = `"Validra Legal Metrology" <${rawEmail}>`;

// Reusable email layout wrapper
function renderEmailShell({
  preheader,
  badgeText,
  badgeColor,
  title,
  subtitle,
  bodyHtml,
  ctaText,
  ctaUrl,
  footnote,
}: {
  preheader: string;
  badgeText: string;
  badgeColor: string; // e.g. '#059669' (emerald), '#2563EB' (blue), '#D97706' (amber)
  title: string;
  subtitle?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footnote?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #E2E8F0;">
  <!-- Preheader text (hidden preview) -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; min-height: 100vh; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #1E293B; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Gov/Metrology Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #064E3B 0%, #065F46 50%, #047857 100%); padding: 24px 32px; text-align: center; border-bottom: 2px solid #10B981;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
                      <span style="font-size: 11px; font-weight: 700; color: #A7F3D0; letter-spacing: 1.5px; text-transform: uppercase;">
                        Government of India • Metrology Division
                      </span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #FFFFFF;">
                      VALID<span style="color: #34D399;">RA</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #D1FAE5; letter-spacing: 1px; text-transform: uppercase; font-weight: 500;">
                      Legal Metrology AI Compliance System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              
              <!-- Badge -->
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; background-color: ${badgeColor}22; border: 1px solid ${badgeColor}66; color: ${badgeColor}; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 6px; letter-spacing: 0.8px; text-transform: uppercase;">
                  ${badgeText}
                </span>
              </div>

              <!-- Title & Subtitle -->
              <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #F8FAFC; line-height: 1.3;">
                ${title}
              </h2>
              ${subtitle ? `<p style="margin: 0 0 24px 0; font-size: 14px; color: #94A3B8; line-height: 1.5;">${subtitle}</p>` : `<div style="margin-bottom: 20px;"></div>`}

              <!-- Custom Body HTML -->
              <div style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
                ${bodyHtml}
              </div>

              <!-- CTA Button Section -->
              ${
                ctaText && ctaUrl
                  ? `
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 24px 0;">
                  <tr>
                    <td align="center">
                      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 10px; text-decoration: none; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); border: 1px solid #34D399;">
                        ${ctaText} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Alternative Link Box -->
                <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 14px 16px; margin: 24px 0 16px 0;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">
                    Button not working? Copy and paste this URL into your browser:
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #38BDF8; word-break: break-all; font-family: 'Courier New', Courier, monospace;">
                    <a href="${ctaUrl}" style="color: #38BDF8; text-decoration: none;">${ctaUrl}</a>
                  </p>
                </div>
              `
                  : ""
              }

              <!-- Security Advisory Box -->
              <div style="background-color: rgba(30, 41, 59, 0.5); border-left: 3px solid #F59E0B; padding: 12px 16px; margin-top: 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 12px; color: #FDE68A; line-height: 1.5;">
                  🔒 <strong>Security Advisory:</strong> Validra officials will never ask for your password or verification codes. If you did not initiate this request, notify security immediately.
                </p>
              </div>

              ${
                footnote
                  ? `<p style="margin: 20px 0 0 0; font-size: 12px; color: #64748B; line-height: 1.5;">${footnote}</p>`
                  : ""
              }

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0B1120; border-top: 1px solid #334155; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #94A3B8;">
                Validra • National Legal Metrology Compliance Engine
              </p>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748B; line-height: 1.5;">
                Enforcing the Legal Metrology Act, 2009 &amp; The Legal Metrology (Packaged Commodities) Rules, 2011.<br/>
                Ministry of Consumer Affairs, Food and Public Distribution, Government of India.
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                This is an automated system notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Robust helper to send email with automatic dev fallback & rich terminal logging.
 */
async function sendMailSafely({
  to,
  subject,
  html,
  text,
  actionType,
  actionUrl,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  actionType: string;
  actionUrl?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: FROM_HEADER,
      to,
      subject,
      text,
      html,
    });
    console.log(`\n✅ [EMAIL SENT] ${actionType} -> ${to} (Subject: "${subject}")\n`);
    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as { responseCode?: number; code?: string; message?: string };
    const isAuthError = errorObj.responseCode === 535 || errorObj.code === "EAUTH";

    console.error(`\n⚠️ [EMAIL DISPATCH WARNING] Could not send ${actionType} email to ${to}:`);
    console.error(`   Error: ${errorObj.message || String(err)}`);

    if (isAuthError) {
      console.warn(`
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔑 GMAIL SMTP AUTHENTICATION NOTICE (Error 535 Bad Credentials)             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Google rejected the Gmail App Password for "${rawEmail}".                   │
│                                                                             │
│ To generate or refresh a working Gmail App Password:                        │
│ 1. Open your Google Account: https://myaccount.google.com/security          │
│ 2. Ensure "2-Step Verification" is turned ON.                               │
│ 3. Go to "App passwords": https://myaccount.google.com/apppasswords          │
│ 4. Name the app "Validra" and generate a 16-character password.             │
│ 5. Paste it in frontend/.env as:                                            │
│    EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"                                     │
│ 6. Restart the server.                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
      `);
    }

    // In development mode, provide developer action links directly in terminal so workflow is NEVER blocked:
    if (actionUrl) {
      console.log(`
╔═════════════════════════════════════════════════════════════════════════════╗
║ 🚀 [DEV ACTION LINK - CLICK TO TEST IN BROWSER]                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║ Action: ${actionType.padEnd(67)} ║
║ Recipient: ${to.padEnd(64)} ║
║ URL: ${actionUrl.padEnd(70)} ║
╚═════════════════════════════════════════════════════════════════════════════╝
      `);
    }

    return {
      success: false,
      simulated: true,
      error: errorObj.message || String(err),
    };
  }
}

// ============================================================================
// Auth Services
// ============================================================================

/**
 * 1. Send Inspector Email Verification Link
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  fullName: string
): Promise<{ success: boolean; simulated?: boolean }> {
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const html = renderEmailShell({
    preheader: `Verify your Validra inspector account: ${fullName}`,
    badgeText: "Account Verification Required",
    badgeColor: "#10B981",
    title: "Verify Your Official Inspector Account",
    subtitle: `Welcome to the Validra Legal Metrology Portal, ${fullName}.`,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">
        You have been registered for an official Inspector account on the <strong>Validra Legal Metrology Verification System</strong>.
      </p>
      <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #E2E8F0;">
          <strong>Account Details:</strong>
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #94A3B8; line-height: 1.8;">
          <li>Inspector Name: <strong style="color: #F8FAFC;">${fullName}</strong></li>
          <li>Official Email: <strong style="color: #F8FAFC;">${email}</strong></li>
          <li>Portal Role: <strong style="color: #10B981;">Legal Metrology Inspector</strong></li>
          <li>Status: <strong style="color: #F59E0B;">Pending Email Verification &amp; Admin Approval</strong></li>
        </ul>
      </div>
      <p style="margin: 16px 0 0 0;">
        Please confirm your email address by clicking the button below. Once verified, your account will be reviewed by an administrator before access to the inspection portal is granted.
      </p>
    `,
    ctaText: "Verify Email Address",
    ctaUrl: verifyUrl,
    footnote: "This verification link is valid for 24 hours. If you did not register for Validra, no action is needed.",
  });

  const text = `
VALIDRA LEGAL METROLOGY PORTAL
Account Verification Required

Hello ${fullName},

Please verify your inspector account on the Validra Portal using the following link:
${verifyUrl}

This link is valid for 24 hours.
Role: Legal Metrology Inspector
Email: ${email}

After verification, an administrator will activate your inspection privileges.
`;

  return sendMailSafely({
    to: email,
    subject: "Verify Your Validra Inspector Account",
    html,
    text,
    actionType: "Inspector Email Verification",
    actionUrl: verifyUrl,
  });
}

/**
 * 2. Send Password Reset Link
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  fullName: string
): Promise<{ success: boolean; simulated?: boolean }> {
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const html = renderEmailShell({
    preheader: `Reset your Validra account password`,
    badgeText: "Password Reset Request",
    badgeColor: "#F59E0B",
    title: "Reset Your Account Password",
    subtitle: `We received a request to reset the password for ${email}.`,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">
        Hello <strong>${fullName}</strong>,
      </p>
      <p style="margin: 0 0 16px 0;">
        A request has been made to reset the password for your Validra Legal Metrology account. To choose a new password, click the secure link below.
      </p>
      <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #94A3B8;">
          ⏳ <strong>Time-sensitive:</strong> For security compliance, this link will expire in exactly <strong>1 hour</strong>.
        </p>
      </div>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #94A3B8;">
        If you did not request this password reset, please ignore this email or notify your system administrator immediately. Your current password remains secure.
      </p>
    `,
    ctaText: "Choose New Password",
    ctaUrl: resetUrl,
    footnote: "This link is single-use and will be invalidated once your password has been reset.",
  });

  const text = `
VALIDRA LEGAL METROLOGY PORTAL
Password Reset Request

Hello ${fullName},

A password reset request was received for your account (${email}).
Reset your password at:
${resetUrl}

This link is valid for 1 hour only.
If you did not request this reset, you can safely ignore this email.
`;

  return sendMailSafely({
    to: email,
    subject: "Reset Your Validra Portal Password",
    html,
    text,
    actionType: "Password Reset",
    actionUrl: resetUrl,
  });
}

/**
 * 3. Send Account Approval Notification (When admin approves an inspector)
 */
export async function sendAccountApprovedEmail(
  email: string,
  fullName: string
): Promise<{ success: boolean; simulated?: boolean }> {
  const loginUrl = `${baseUrl}/login`;

  const html = renderEmailShell({
    preheader: `Your Validra inspector account has been approved and activated!`,
    badgeText: "Account Approved & Active",
    badgeColor: "#10B981",
    title: "Inspector Access Granted",
    subtitle: `Congratulations ${fullName}, your account is now fully active.`,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">
        Your inspector credentials have been verified and approved by the Validra Legal Metrology Administration.
      </p>
      <div style="background-color: #0F172A; border: 1px solid #065F46; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #34D399; font-weight: 700;">
          Authorized Capabilities:
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #CBD5E1; line-height: 1.8;">
          <li>Real-time AI Metrology label scanning &amp; OCR verification</li>
          <li>Legal Metrology Rules 2011 compliance checking</li>
          <li>Digital evidence logging &amp; report generation</li>
          <li>Inspection history and compliance analytics</li>
        </ul>
      </div>
      <p style="margin: 16px 0 0 0;">
        You may now sign in to access the Inspector Dashboard and begin conducting inspections.
      </p>
    `,
    ctaText: "Sign In to Inspector Portal",
    ctaUrl: loginUrl,
    footnote: "Keep your login credentials confidential. All inspection activities are audited.",
  });

  const text = `
VALIDRA LEGAL METROLOGY PORTAL
Account Approved & Activated

Hello ${fullName},

Your Inspector account (${email}) has been approved by the Validra Administration.
You can now sign in to the Inspector Portal at:
${loginUrl}

All inspection activities are logged and audited in compliance with the Legal Metrology Act, 2009.
`;

  return sendMailSafely({
    to: email,
    subject: "Validra Inspector Account Approved — Access Granted",
    html,
    text,
    actionType: "Account Approved",
    actionUrl: loginUrl,
  });
}

/**
 * 4. Send Password Changed Confirmation (Security Alert)
 */
export async function sendPasswordChangedConfirmation(
  email: string,
  fullName: string
): Promise<{ success: boolean; simulated?: boolean }> {
  const loginUrl = `${baseUrl}/login`;

  const html = renderEmailShell({
    preheader: `Security Alert: Your Validra account password was changed`,
    badgeText: "Security Alert",
    badgeColor: "#3B82F6",
    title: "Password Successfully Updated",
    subtitle: `The password for ${email} was changed.`,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">
        Hello <strong>${fullName}</strong>,
      </p>
      <p style="margin: 0 0 16px 0;">
        This is an automated confirmation that the password for your Validra account was recently updated on <strong>${new Date().toUTCString()}</strong>.
      </p>
      <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #FDE68A;">
          ⚠️ If you did NOT initiate this change, your account may be compromised. Please contact your system administrator immediately to suspend access.
        </p>
      </div>
    `,
    ctaText: "Sign In With New Password",
    ctaUrl: loginUrl,
    footnote: "For security reasons, never share your account credentials with anyone.",
  });

  const text = `
VALIDRA LEGAL METROLOGY PORTAL
Security Alert: Password Updated

Hello ${fullName},

Your password for Validra account (${email}) was updated on ${new Date().toUTCString()}.
If you made this change, no further action is required.
If you did not make this change, contact administrator immediately.
`;

  return sendMailSafely({
    to: email,
    subject: "Security Alert: Validra Account Password Changed",
    html,
    text,
    actionType: "Password Changed Alert",
    actionUrl: loginUrl,
  });
}

/**
 * 5. Verify SMTP Connection Health (Diagnostic helper)
 */
export async function verifySmtpConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await transporter.verify();
    return { ok: true, message: "SMTP connection verified successfully." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: message || "Unknown SMTP error" };
  }
}
