"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { setAuthToken, getAuthToken } from "@/services/api";

/**
 * AuthBridge automatically synchronizes the active NextAuth session
 * with the apiClient in-memory Bearer token used for FastAPI backend calls.
 */
export function AuthBridge() {
  const { data: session, status } = useSession();

  React.useEffect(() => {
    let isMounted = true;

    async function syncToken() {
      if (status === "authenticated" && session?.user) {
        const currentToken = getAuthToken();
        if (!currentToken) {
          try {
            const res = await fetch("/api/auth/token");
            if (res.ok) {
              const data = await res.json();
              if (isMounted && data.accessToken) {
                setAuthToken(data.accessToken);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("validra_jwt_token", data.accessToken);
                }
              }
            }
          } catch (err) {
            console.error("Failed to sync session token with backend API client:", err);
          }
        }
      } else if (status === "unauthenticated") {
        setAuthToken(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("validra_jwt_token");
        }
      }
    }

    syncToken();

    return () => {
      isMounted = false;
    };
  }, [session, status]);

  return null;
}
