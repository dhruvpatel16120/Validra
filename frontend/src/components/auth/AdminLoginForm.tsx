"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Admin-specific login form.
 * Uses NextAuth credentials sign-in, redirects to /admin/dashboard on success.
 * No register link — admins are created via management scripts only.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("INVALID_CREDENTIALS")) {
          setServerError("Invalid admin credentials. Please check your email and password.");
        } else if (result.error.includes("ACCOUNT_NOT_APPROVED")) {
          setServerError("This admin account has been deactivated.");
        } else {
          setServerError("Authentication failed. Please try again.");
        }
      } else if (result?.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setServerError("Unable to connect to server. Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {/* Admin Badge */}
      <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        <span>Administrative access only — managed accounts</span>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="admin-email"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Admin email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@validra.gov.in"
          value={email}
          disabled={isSubmitting}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          aria-invalid={Boolean(errors.email)}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 border text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            errors.email
              ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          )}
        />
        {errors.email && (
          <p role="alert" className="text-xs text-rose-600 mt-1.5 font-medium">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="admin-password"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter admin password"
            value={password}
            disabled={isSubmitting}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            aria-invalid={Boolean(errors.password)}
            className={cn(
              "w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50/70 border text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              errors.password
                ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                : "border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            )}
          />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 rounded-lg transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p role="alert" className="text-xs text-rose-600 mt-1.5 font-medium">
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 transition-all mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Signing in...</span>
          </>
        ) : (
          "Sign in to Admin Portal"
        )}
      </Button>

      {/* Inspector Login Link */}
      <div className="pt-2 text-center text-xs text-slate-500">
        Inspector?{" "}
        <Link
          href="/login"
          className="text-emerald-600 hover:text-emerald-700 font-semibold underline-offset-4 hover:underline transition-colors"
        >
          Sign in here
        </Link>
      </div>
    </form>
  );
}
