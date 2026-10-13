"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, STATES, TRADES } from "@/lib/constants";

const initial: AuthState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? <p className="text-sm text-red-700" role="alert">{state.error}</p> : null}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-slate-500">
        New here? <Link className="font-semibold text-blue-700" href="/signup">Create an account</Link>
      </p>
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Pilot demo accounts</p>
        <p className="mt-1">Password: <span className="font-mono">{DEMO_PASSWORD}</span></p>
        <ul className="mt-2 space-y-1">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <span className="font-medium">{account.role}:</span> {account.email}
              <span className="text-slate-500"> · {account.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  const [role, setRole] = useState<"worker" | "employer">("worker");

  return (
    <form action={action} className="card space-y-4 p-6">
      <fieldset className="space-y-2">
        <legend className="label">I am a</legend>
        <div className="flex gap-2">
          {(["worker", "employer"] as const).map((option) => (
            <label key={option} className={`btn ${role === option ? "btn-primary" : "btn-ghost"}`}>
              <input
                className="sr-only"
                type="radio"
                name="role"
                value={option}
                checked={role === option}
                onChange={() => setRole(option)}
              />
              {option === "worker" ? "Tradesperson" : "Employer"}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="full_name">Full name</label>
        <input className="input" id="full_name" name="full_name" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {role === "worker" ? (
        <div>
          <label className="label" htmlFor="trade">Trade</label>
          <select className="input" id="trade" name="trade" defaultValue="HVAC" required>
            {TRADES.map((trade) => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="company_name">Company</label>
          <input className="input" id="company_name" name="company_name" required />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="city">City</label>
          <input className="input" id="city" name="city" />
        </div>
        <div>
          <label className="label" htmlFor="state">State</label>
          <select className="input" id="state" name="state" defaultValue="TX">
            <option value="">Select</option>
            {STATES.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-red-700" role="alert">{state.error}</p> : null}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm text-slate-500">
        Already have an account? <Link className="font-semibold text-blue-700" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
