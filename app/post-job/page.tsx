"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountFrame } from "@/components/SideNav";
import { Shell } from "@/components/Shell";
import { Field, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { useStore, type JobInput } from "@/lib/store";
import { TRADES, type JobType, type Trade } from "@/lib/types";

export default function PostJobPage() {
  useTitle("Post a job");
  const router = useRouter();
  const store = useStore();
  const [form, setForm] = useState<JobInput>({
    title: "",
    trade: "Plumbing",
    city: "",
    region: "",
    type: "Full-time",
    pay: "",
    description: "",
    requirements: ["", "", ""],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!store.currentUser) router.replace("/login?next=/post-job");
    else if (store.currentUser.role !== "employer") router.replace("/jobs");
  }, [router, store.currentUser]);

  if (store.currentUser?.role !== "employer") return <Shell><p className="p-10 text-muted">Opening the job form…</p></Shell>;

  return (
    <Shell>
      <AccountFrame>
        <h1 className="text-3xl font-extrabold tracking-tight">Post a job</h1>
        <p className="mt-1 text-muted">Write the role the way you would explain it to a lead on the phone.</p>
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-line bg-surface p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const result = store.postJob(form);
            if (result) setError(result);
            else router.push("/dashboard");
          }}
        >
          <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Licensed plumber" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Trade">
              <select className={inputClass} value={form.trade} onChange={(event) => setForm({ ...form, trade: event.target.value as Trade })}>
                {TRADES.map((trade) => <option key={trade}>{trade}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as JobType })}>
                <option>Full-time</option>
                <option>Contract</option>
                <option>Apprenticeship</option>
              </select>
            </Field>
            <Field label="City"><input className={inputClass} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
            <Field label="State or province"><input className={inputClass} value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} /></Field>
          </div>
          <Field label="Pay"><input className={inputClass} value={form.pay} onChange={(event) => setForm({ ...form, pay: event.target.value })} placeholder="$38–48/hr" /></Field>
          <Field label="Description"><textarea className={inputClass} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
          {[0, 1, 2].map((index) => (
            <Field key={index} label={`Requirement ${index + 1}`}>
              <input
                className={inputClass}
                value={form.requirements[index] ?? ""}
                onChange={(event) => {
                  const requirements = [...form.requirements];
                  requirements[index] = event.target.value;
                  setForm({ ...form, requirements });
                }}
              />
            </Field>
          ))}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button className={`${btnPrimary} w-max`}>Publish job</button>
        </form>
      </AccountFrame>
    </Shell>
  );
}
