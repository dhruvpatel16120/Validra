"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

export interface VerifyEmailCardProps {
  /** Optional email address the verification was sent to */
  email?: string;
  /** Optional container class name */
  className?: string;
}

/**
 * VerifyEmailCard component with real API integration.
 * Calls /api/auth/resend-verification for resend functionality.
 * Auto-detects error/expired states from URL params.
 */
export function VerifyEmailCard({ email, className }: VerifyEmailCardProps) {
  const searchParams = useSearchParams();
  const [isSending, setIsSending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  // Check for error from redirect (expired token, etc.)
  const errorFromRedirect = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  // Manage 30-second cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (isSending || cooldown > 0 || !email) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatusMessage("Verification email sent successfully.");
      } else {
        setStatusMessage("Failed to send verification email. Please try again.");
      }
      setCooldown(30);
    } catch {
      setStatusMessage("Unable to connect to server. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center text-center space-y-5", className)}>
      {/* Visual Mail Icon */}
      <div
        className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/10"
        aria-hidden="true"
      >
        <MailCheck className="w-7 h-7" />
      </div>

      {/* Heading & Instructions */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Check your email
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          We&apos;ve sent a verification link to your email address. Please check your inbox and follow the link to verify your account.
        </p>
      </div>

      {/* Optional Email Address Badge */}
      {email && (
        <div className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
          <span>Verification email sent to </span>
          <span className="font-semibold text-slate-800 break-all">{email}</span>
        </div>
      )}

      {/* Error from redirect (expired token, etc.) */}
      {errorFromRedirect && errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium w-full"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Status Message */}
      {statusMessage && statusMessage.includes("successfully") && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium w-full"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Error Status Message */}
      {statusMessage && !statusMessage.includes("successfully") && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium w-full"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Actions */}
      <div className="w-full space-y-3.5 pt-1">
        <Button
          type="button"
          onClick={handleResend}
          disabled={isSending || cooldown > 0 || !email}
          className="w-full h-11 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Sending...</span>
            </>
          ) : cooldown > 0 ? (
            `Resend available in ${cooldown}s`
          ) : (
            "Resend verification email"
          )}
        </Button>

        {/* Navigation Links */}
        <div className="flex items-center justify-between gap-4 pt-2 text-xs text-slate-500">
          <Link
            href="/login"
            className="hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:underline font-medium"
          >
            Back to sign in
          </Link>
          <Link
            href="/register"
            className="hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:underline font-medium"
          >
            Use a different email
          </Link>
        </div>
      </div>
    </div>
  );
}
