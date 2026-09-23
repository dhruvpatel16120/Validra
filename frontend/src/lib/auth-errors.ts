/**
 * Auth error codes shared between the NextAuth server config and the login forms.
 *
 * Auth.js only forwards a small set of error types to the client; everything else
 * is masked as "Configuration". To keep failures diagnosable, authorize() converts
 * every failure into a CredentialsSignin subclass carrying one of these codes,
 * which the client receives as `result.code` (or `?code=` on redirects).
 *
 * This module must stay free of server-only imports so client components can use it.
 */

export const AUTH_ERROR_CODES = {
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_NOT_APPROVED: "ACCOUNT_NOT_APPROVED",
  DATABASE_UNREACHABLE: "DATABASE_UNREACHABLE",
  DATABASE_SCHEMA_ERROR: "DATABASE_SCHEMA_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  PASSWORD_VERIFY_ERROR: "PASSWORD_VERIFY_ERROR",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

const CODE_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_INPUT: "Please enter both your email address and password.",
  INVALID_CREDENTIALS: "Invalid email address or password. Please check your credentials.",
  EMAIL_NOT_VERIFIED: "Your email address has not been verified yet.",
  ACCOUNT_NOT_APPROVED: "Your account is pending admin approval. You will be notified once approved.",
  DATABASE_UNREACHABLE:
    "Cannot reach the database. Check that DATABASE_URL is set and the database server is running.",
  DATABASE_SCHEMA_ERROR:
    "Database schema is out of date (missing table or column). Run the Prisma migrations for this environment.",
  DATABASE_ERROR: "A database error occurred during sign in. Check the server logs for details.",
  PASSWORD_VERIFY_ERROR:
    "The stored password for this account could not be verified. It may be corrupted; try resetting your password.",
  UNEXPECTED_ERROR: "An unexpected server error occurred during sign in. Check the server logs for details.",
};

// Error types Auth.js itself may report (https://authjs.dev/reference/core/errors)
const TYPE_MESSAGES: Record<string, string> = {
  Configuration:
    "Authentication is misconfigured on the server (e.g. missing AUTH_SECRET or an invalid provider setup). Look for [auth][error] in the server logs.",
  MissingCSRF: "Your sign-in form expired. Please refresh the page and try again.",
  AccessDenied: "Access was denied for this account.",
  Verification: "The verification link is invalid or has expired.",
  CredentialsSignin: "Invalid email address or password. Please check your credentials.",
};

/**
 * Turn an Auth.js `error` type plus optional `code` into a user-facing message.
 */
export function getAuthErrorMessage(error: string | null | undefined, code?: string | null): string {
  if (code && code in CODE_MESSAGES) {
    return CODE_MESSAGES[code as AuthErrorCode];
  }
  if (error && error in TYPE_MESSAGES) {
    return TYPE_MESSAGES[error];
  }
  return `Sign in failed (${[error, code].filter(Boolean).join(" / ") || "unknown error"}). Please try again.`;
}
