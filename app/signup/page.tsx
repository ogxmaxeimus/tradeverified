"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Field, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { useStore, type SignupInput } from "@/lib/store";
import { TRADES, type Plan, type Role, type Trade } from "@/lib/types";

export default function SignupPage() {
  return (
    <Suspense fallback={<Shell><p className="p-10 text-muted">Loading…</p></Shell>}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  useTitle("Sign up");
  const params = useSearchParams();
  const router = useRouter();
  const { signup } = useStore();
  const initialRole: Role = params.get("role") === "employer" ? "employer" : "worker";
  const initialPlan: Plan = params.get("plan") === "pro" ? "pro" : "free";
  const [form, setForm] = useState<SignupInput>({
    name: "",
    email: "",
    password: "",
    role: initialRole,
    city: "",
    region: "",
    trade: "HVAC",
    title: "",
    company: "",
    plan: initialPlan,
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SignupInput>(key: K, value: SignupInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Shell>
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Saved in this browser. You can reset the workspace any time from the account menu.</p>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-soft p-1">
          {(["worker", "employer"] as Role[]).map((role) => (
            <button
              key={role}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${form.role === role ? "bg-surface shadow" : "text-muted"}`}
              onClick={() => set("role", role)}
              type="button"
            >
              {role === "worker" ? "Tradesperson" : "Employer"}
            </button>
          ))}
        </div>
        <form
          className="mt-6 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const result = signup(form);
            if (result) setError(result);
            else router.push("/dashboard");
          }}
        >
          <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => set("name", event.target.value)} required /></Field>
          <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={(event) => set("email", event.target.value)} required /></Field>
          <Field label="Password"><input type="password" className={inputClass} value={form.password} onChange={(event) => set("password", event.target.value)} minLength={8} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City"><input className={inputClass} value={form.city} onChange={(event) => set("city", event.target.value)} required /></Field>
            <Field label="State or province"><input className={inputClass} value={form.region} onChange={(event) => set("region", event.target.value)} placeholder="TX" required /></Field>
          </div>
          {form.role === "worker" ? (
            <>
              <Field label="Trade">
                <select className={inputClass} value={form.trade} onChange={(event) => set("trade", event.target.value as Trade)}>
                  {TRADES.map((trade) => <option key={trade}>{trade}</option>)}
                </select>
              </Field>
              <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Journeyman electrician" /></Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.plan === "pro"} onChange={(event) => set("plan", event.target.checked ? "pro" : "free")} />
                Start on Pro so the profile is featured
              </label>
            </>
          ) : (
            <Field label="Company"><input className={inputClass} value={form.company} onChange={(event) => set("company", event.target.value)} required /></Field>
          )}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button className={btnPrimary}>Create account</button>
        </form>
        <p className="mt-4 text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand">Log in</Link></p>
      </div>
    </Shell>
  );
}
