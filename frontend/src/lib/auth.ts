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
import type { UserRole } from "@prisma/client";

export class InvalidCredentialsError extends CredentialsSignin {
  code = "INVALID_CREDENTIALS";
}

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

export class AccountNotApprovedError extends CredentialsSignin {
  code = "ACCOUNT_NOT_APPROVED";
}

export class DatabaseAuthError extends CredentialsSignin {
  code = "DATABASE_ERROR";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "validra-default-jwt-secret-key-change-in-production",
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
        if (!credentials?.email || !credentials?.password) {
          throw new InvalidCredentialsError();
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
        } catch (dbErr) {
          console.error("Database connection error in authorize():", dbErr);
          throw new DatabaseAuthError();
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

        const isValid = await verifyPassword(password, user.passwordHash);
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
        session.user.role = token.role as UserRole;
        session.user.isActive = token.isActive as boolean;
        session.user.isVerified = token.isVerified as boolean;
        session.user.fullName = token.fullName as string;
      }
      return session;
    },
  },
});
