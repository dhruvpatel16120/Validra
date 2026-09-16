/**
 * NextAuth v5 (Auth.js) configuration for Validra.
 * Uses CredentialsProvider with Prisma-backed user store.
 *
 * Auth flow:
 * - Inspector: register → verify email → admin approves → login
 * - Admin: created via script → login
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { UserRole } from "@prisma/client";

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
          throw new Error("Email and password are required.");
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          throw new Error("INVALID_CREDENTIALS");
        }

        // Check email verification
        if (!user.isVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // Check admin approval (inspectors must be approved)
        if (!user.isActive) {
          throw new Error("ACCOUNT_NOT_APPROVED");
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
