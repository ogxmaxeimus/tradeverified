"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Field, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { DEMO_PASSWORD } from "@/lib/types";

const DEMOS = [
  { name: "Marcus Rivera", detail: "HVAC technician · Austin", email: "marcus.rivera@tradeverified.app" },
  { name: "Ethan Reynolds", detail: "Bluewater Plumbing · hiring", email: "ethan.reynolds@bluewater.co" },
];

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Shell><p className="p-10 text-muted">Loading…</p></Shell>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  useTitle("Log in");
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(params.get("next"));

  function submit(nextEmail: string, nextPassword: string) {
    const result = login(nextEmail, nextPassword);
    if (result) setError(result);
    else router.push(next);
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Log in</h1>
          <p className="mt-2 text-sm text-muted">Sample profiles live in this browser. The two accounts below are ready.</p>
          <form
            className="mt-6 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit(email, password);
            }}
          >
            <Field label="Email"><input type="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></Field>
            <Field label="Password"><input type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></Field>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button className={btnPrimary}>Log in</button>
          </form>
          <p className="mt-4 text-sm text-muted">New here? <Link href="/signup" className="font-semibold text-brand">Create an account</Link></p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-bold">Open a sample account</h2>
          <div className="mt-4 grid gap-3">
            {DEMOS.map((demo) => (
              <button
                key={demo.email}
                className="rounded-2xl border border-line p-4 text-left hover:border-brand"
                onClick={() => submit(demo.email, DEMO_PASSWORD)}
              >
                <span className="block font-semibold">{demo.name}</span>
                <span className="block text-sm text-muted">{demo.detail}</span>
                <span className="mt-1 block text-xs text-muted">{demo.email} · {DEMO_PASSWORD}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
