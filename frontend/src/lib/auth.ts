/**
 * NextAuth v5 (Auth.js) configuration for Validra.
 * Uses CredentialsProvider with Prisma-backed user store.
 *
 * Auth flow:
 * - Inspector: register → verify email → admin approves → login
 * - Admin: created via script → login
 */

import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { recordAuditLog } from "@/lib/audit";
import { Prisma, type UserRole } from "@prisma/client";
import { AUTH_ERROR_CODES, type AuthErrorCode } from "@/lib/auth-errors";

/**
 * Auth.js masks any non-CredentialsSignin error as "Configuration" on the client,
 * so every failure in the sign-in path is converted to one of these with a specific code.
 */
export class AuthCodeError extends CredentialsSignin {
  constructor(code: AuthErrorCode, cause?: unknown) {
    super(code, { cause });
    this.code = code;
  }
}

export class InvalidCredentialsError extends AuthCodeError {
  constructor() {
    super(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export class EmailNotVerifiedError extends AuthCodeError {
  constructor() {
    super(AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED);
  }
}

export class AccountNotApprovedError extends AuthCodeError {
  constructor() {
    super(AUTH_ERROR_CODES.ACCOUNT_NOT_APPROVED);
  }
}

export class DatabaseAuthError extends AuthCodeError {
  constructor(cause: unknown) {
    super(classifyDatabaseError(cause), cause);
  }
}

function classifyDatabaseError(err: unknown): AuthErrorCode {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return AUTH_ERROR_CODES.DATABASE_UNREACHABLE;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001/P1002: server unreachable/timed out; P2021/P2022: table/column missing
    if (err.code === "P1001" || err.code === "P1002") return AUTH_ERROR_CODES.DATABASE_UNREACHABLE;
    if (err.code === "P2021" || err.code === "P2022") return AUTH_ERROR_CODES.DATABASE_SCHEMA_ERROR;
  }
  return AUTH_ERROR_CODES.DATABASE_ERROR;
}

// Extend the NextAuth session and JWT types
declare module "next-auth" {
  interface User {
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    fullName: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      isActive: boolean;
      isVerified: boolean;
      fullName: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    fullName: string;
  }
}

if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET =
    "7007429cad2e1b7ee968b76e758b0a81761275dc36ba99ed11ad2419264b0d12";
}
process.env.AUTH_TRUST_HOST = "true";

// If on Vercel preview deployment, clear fixed NEXTAUTH_URL so dynamic preview domains are trusted
if (
  process.env.VERCEL &&
  process.env.NEXTAUTH_URL &&
  !process.env.NEXTAUTH_URL.includes("localhost")
) {
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_URL) {
    delete process.env.NEXTAUTH_URL;
  }
}

/**
 * Validates credentials against the Prisma user store.
 * Known failures throw AuthCodeError subclasses; anything else is wrapped by the caller.
 */
async function authorizeCredentials(credentials: Partial<Record<string, unknown>>) {
  const rawEmail = credentials?.email;
  const password = credentials?.password;
  if (typeof rawEmail !== "string" || typeof password !== "string" || !rawEmail.trim() || !password) {
    throw new AuthCodeError(AUTH_ERROR_CODES.INVALID_INPUT);
  }

  const email = rawEmail.toLowerCase().trim();

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email },
    });
  } catch (dbErr) {
    console.error("[auth] Database error in authorize():", dbErr);
    throw new DatabaseAuthError(dbErr);
  }

  if (!user) {
    await recordAuditLog({
      userName: "Unregistered / Unknown",
      userEmail: email,
      userRole: "inspector",
      action: "AUTH_FAILURE",
      severity: "HIGH",
      status: "FAILURE",
      description: `Authentication failed: Account with email ${email} not found.`,
    });
    throw new InvalidCredentialsError();
  }

  let isValid: boolean;
  try {
    isValid = await verifyPassword(password, user.passwordHash);
  } catch (hashErr) {
    console.error(`[auth] Password hash for ${user.email} could not be verified:`, hashErr);
    throw new AuthCodeError(AUTH_ERROR_CODES.PASSWORD_VERIFY_ERROR, hashErr);
  }
  if (!isValid) {
    await recordAuditLog({
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role.toLowerCase(),
      action: "AUTH_FAILURE",
      severity: "HIGH",
      status: "FAILURE",
      description: `Authentication failed: Incorrect password attempt for ${user.email}.`,
    });
    throw new InvalidCredentialsError();
  }

  // Check email verification
  if (!user.isVerified) {
    await recordAuditLog({
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role.toLowerCase(),
      action: "AUTH_FAILURE",
      severity: "MEDIUM",
      status: "FAILURE",
      description: `Authentication blocked for ${user.email}: Email address not verified.`,
    });
    throw new EmailNotVerifiedError();
  }

  // Check admin approval (inspectors must be approved)
  if (!user.isActive) {
    await recordAuditLog({
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role.toLowerCase(),
      action: "AUTH_FAILURE",
      severity: "MEDIUM",
      status: "FAILURE",
      description: `Authentication blocked for ${user.email}: Inspector account pending administrative approval.`,
    });
    throw new AccountNotApprovedError();
  }

  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    fullName: user.fullName,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          return await authorizeCredentials(credentials);
        } catch (err) {
          if (err instanceof CredentialsSignin) throw err;
          console.error("[auth] Unexpected error in authorize():", err);
          throw new AuthCodeError(AUTH_ERROR_CODES.UNEXPECTED_ERROR, err);
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (user?.email) {
        await recordAuditLog({
          userName: user.fullName || user.name || "Officer",
          userEmail: user.email,
          userRole: ((user.role as string) || "INSPECTOR").toLowerCase(),
          action: (user.role as string) === "ADMIN" ? "ADMIN_LOGIN" : "USER_LOGIN",
          severity: "INFO",
          status: "SUCCESS",
          description: `${(user.role as string) === "ADMIN" ? "Administrator" : "Field Inspector"} ${user.fullName || user.email} signed in successfully.`,
        });
      }
    },
    async signOut(message) {
      if ("token" in message && message.token?.email) {
        const token = message.token;
        await recordAuditLog({
          userName: (token.fullName as string) || (token.name as string) || "Officer",
          userEmail: (token.email as string) || "",
          userRole: ((token.role as string) || "INSPECTOR").toLowerCase(),
          action: "USER_LOGOUT",
          severity: "INFO",
          status: "SUCCESS",
          description: `User ${(token.fullName as string) || token.email} signed out from session.`,
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.role = user.role;
        token.isActive = user.isActive;
        token.isVerified = user.isVerified;
        token.fullName = user.fullName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) ?? session.user.email ?? "";
        session.user.role = token.role as UserRole;
        session.user.isActive = token.isActive as boolean;
        session.user.isVerified = token.isVerified as boolean;
        session.user.fullName = token.fullName as string;
      }
      return session;
    },
  },
});
