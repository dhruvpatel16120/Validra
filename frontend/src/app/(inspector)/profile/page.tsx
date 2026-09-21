"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  MapPin,
  LogOut,
  CheckCircle2,
  ClipboardCheck,
  CircleCheck,
  AlertTriangle,
  FileText,
  CalendarDays,
  Hash,
  RefreshCw,
  Clock,
  ArrowUpRight,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { PageHeader } from "@/components/inspector/common";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profile-service";
import { getUserFriendlyErrorMessage } from "@/services/api";
import { Button } from "@/components/shared/ui/button";
import type { ProfileResponse } from "@/types/auth";

const ROLE_LABELS: Record<string, string> = {
  inspector: "Legal Metrology Inspector",
  admin: "Administrator",
  citizen: "Citizen",
};

/** Render ISO timestamp as a formatted date and time string */
function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { user, logout } = useAuth();

  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);

  // Load real data from PostgreSQL backend
  const loadProfileData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      setLoadError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Derive real database fields from users table
  const apiUser = profile?.user;

  const realFullName =
    apiUser?.full_name ||
    apiUser?.fullName ||
    session?.user?.fullName ||
    session?.user?.name ||
    user?.fullName ||
    "Authorized Officer";

  const realEmail =
    apiUser?.email ||
    session?.user?.email ||
    user?.email ||
    "—";

  const rawRole = (apiUser?.role || user?.role || "inspector").toLowerCase();
  const realRole = ROLE_LABELS[rawRole] || "Legal Metrology Inspector";

  // Exact fields from users DB table
  const realUserId = apiUser?.id || user?.id || "—";
  const realBadgeNumber = apiUser?.badge_number || apiUser?.badgeNumber || user?.badgeNumber || null;
  const realJurisdiction = apiUser?.jurisdiction || user?.jurisdiction || null;
  const realIsActive = apiUser?.is_active ?? user?.isActive ?? true;
  const realIsVerified = apiUser?.is_verified ?? user?.isVerified ?? true;
  const realCreatedAt = apiUser?.created_at || user?.createdAt || null;
  const realUpdatedAt = apiUser?.updated_at || user?.updatedAt || null;

  // Real statistics from inspections and reports DB tables
  const stats = profile?.stats ?? {
    total_scans: 0,
    compliant: 0,
    flagged: 0,
    needs_review: 0,
    reports: 0,
    avg_compliance_score: 0,
  };

  const initials =
    realFullName
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "IN";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Inspector Profile"
          description="Official credentials, assigned metrology jurisdiction, and active enforcement records."
        />
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadProfileData}
            disabled={isLoading}
            className="text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-600" : "text-slate-400"}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <section
        aria-label="Profile Details"
        className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-700 flex items-center justify-center text-2xl font-bold font-mono shrink-0 shadow-2xs">
            {initials}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {realFullName}
            </h2>

            <p className="text-xs text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <span className="font-medium text-slate-800">{realRole}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-mono text-slate-600">{realEmail}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Legal Metrology Enforcement Activity (Real Database Data) */}
      <section
        aria-label="Legal Metrology Enforcement Activity"
        className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Legal Metrology Enforcement Activity</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inspection records and escalated compliance findings from the database.
            </p>
          </div>

          <Link
            href="/inspections"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All Inspections</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadError ? (
          <div
            role="alert"
            className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadProfileData}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Scans */}
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Total Scans</span>
                <ClipboardCheck className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900">
                {isLoading ? "…" : stats.total_scans}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium">Logged package inspections</p>
            </div>

            {/* Compliant */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Compliant</span>
                <CircleCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-700">
                {isLoading ? "…" : stats.compliant}
              </p>
              <p className="text-[10.5px] text-emerald-700 font-medium">Fully verified adherence</p>
            </div>

            {/* Flagged */}
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-1">
              <div className="flex items-center justify-between text-rose-800">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Violations</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-rose-600">
                {isLoading ? "…" : stats.flagged}
              </p>
              <p className="text-[10.5px] text-rose-600 font-medium">Non-compliance detected</p>
            </div>

            {/* Reports */}
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Reports</span>
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900">
                {isLoading ? "…" : stats.reports}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium">Official escalated filings</p>
            </div>
          </div>
        )}
      </section>

      {/* Statutory Authority & Jurisdiction (Professional Fields from users DB Table) */}
      <section
        aria-label="Statutory Authority & Jurisdiction"
        className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Statutory Authority & Jurisdiction</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Official metrology division credentials and identity verification records.
          </p>
        </div>

        {/* Professional Database Record Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Assigned Jurisdiction */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Assigned Metrology Jurisdiction
              </span>
              <span className="text-slate-900 text-xs block mt-1 font-medium">
                {realJurisdiction || (
                  <span className="text-slate-500">Central Enforcement Jurisdiction</span>
                )}
              </span>
            </div>
          </div>

          {/* Inspector Badge Reference */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <Hash className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Official Inspector Badge Number
              </span>
              <span className="text-slate-900 font-mono text-xs block mt-1">
                {realBadgeNumber || (
                  <span className="text-slate-500 font-sans">Pending Formal Issuance</span>
                )}
              </span>
            </div>
          </div>

          {/* Officer Reference ID */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Officer Identification ID
              </span>
              <span className="text-slate-900 font-mono text-[11.5px] break-all block mt-1">
                {realUserId}
              </span>
            </div>
          </div>

          {/* Authorized Account Role */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Authorized System Role
              </span>
              <span className="text-slate-900 text-xs block mt-1 font-semibold">
                {realRole}
              </span>
            </div>
          </div>

          {/* Official Email */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Official Department Email
              </span>
              <span className="text-slate-900 font-mono text-xs break-all block mt-1">
                {realEmail}
              </span>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Account Status & Verification
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{realIsActive ? "Active Status" : "Inactive"}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{realIsVerified ? "Verified Identity" : "Unverified"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Commissioned / Registration Date */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Appointment Date
              </span>
              <span className="text-slate-900 text-xs block mt-1">
                {formatDateOnly(realCreatedAt)}
              </span>
            </div>
          </div>

          {/* Last Profile Synchronization */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                Last Credential Synchronization
              </span>
              <span className="text-slate-900 text-xs block mt-1">
                {formatDateTime(realUpdatedAt || realCreatedAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Session Security & Sign Out */}
      <section
        aria-label="Active Session"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="space-y-0.5 text-center sm:text-left">
          <h3 className="text-xs font-semibold text-slate-900">
            Active Authentication Session
          </h3>
          <p className="text-[11.5px] text-slate-500">
            Signed in as <span className="font-mono text-slate-700">{realEmail}</span>
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setShowSignOutConfirm(true)}
          className="gap-2 text-xs font-medium cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Button>
      </section>

      {/* Sign-Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 max-w-sm w-full mx-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">End Session</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to sign out? You will need to authenticate again to access the portal.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSignOutConfirm(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={async () => {
                  try {
                    await logout();
                  } catch {
                    // ignore
                  }
                  await signOut({ callbackUrl: "/login" });
                }}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
