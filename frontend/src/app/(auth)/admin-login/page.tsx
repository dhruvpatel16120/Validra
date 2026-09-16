import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Administrative access portal for the Validra Legal Metrology System.",
};

export default function AdminLoginPage() {
  return (
    <AuthCard
      title="Admin Portal"
      description="Sign in with your administrator credentials."
    >
      <AdminLoginForm />
    </AuthCard>
  );
}
