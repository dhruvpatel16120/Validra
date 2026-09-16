import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Clock, Mail, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Pending Approval",
  description: "Your Validra inspector account is awaiting admin approval.",
};

export default function PendingApprovalPage() {
  return (
    <AuthCard
      title="Account Pending Approval"
      description="Your inspector account has been verified but is awaiting administrator approval."
    >
      <div className="flex flex-col items-center text-center space-y-5 py-2">
        {/* Pending Icon */}
        <div
          className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shadow-md shadow-amber-500/10"
          aria-hidden="true"
        >
          <Clock className="w-7 h-7" />
        </div>

        {/* Status Steps */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">Email verified</span>
            <span className="ml-auto text-emerald-500">✓</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">Admin approval</span>
            <span className="ml-auto text-amber-500 font-semibold">Pending</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-500 leading-relaxed max-w-sm">
          <p>
            An administrator will review and approve your account shortly. You will receive an email notification once your account has been activated.
          </p>
          <p className="mt-2">
            If you have questions, please contact the system administrator.
          </p>
        </div>

        {/* Back to Login */}
        <div className="pt-2">
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-emerald-700 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
