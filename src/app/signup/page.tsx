import type { Metadata } from "next";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">Create an account</h1>
      <p className="mt-2 mb-6 text-slate-600">
        Choose worker or employer. Admin review access is assigned in the database, not at signup.
      </p>
      <SignupForm />
    </div>
  );
}
