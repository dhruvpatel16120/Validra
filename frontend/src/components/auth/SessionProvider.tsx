"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AuthBridge } from "@/components/auth/AuthBridge";

/**
 * Client-side SessionProvider wrapper for NextAuth v5.
 * Wraps the entire app in root layout to provide session context and token synchronization.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <AuthBridge />
      {children}
    </NextAuthSessionProvider>
  );
}
