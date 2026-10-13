import type { Metadata } from "next";
import { createJob } from "@/app/actions/jobs";
import { Flash } from "@/components/ui";
import { EMPLOYMENT_TYPES, PAY_UNITS, STATES, TRADES } from "@/lib/constants";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("employer");
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Post a job</h1>
      <Flash error={params.error} />
      <form action={createJob} className="card space-y-4 p-6">
        <label className="label">
          Title
          <input className="input" name="title" required />
        </label>
        <label className="label">
          Trade
          <select className="input" name="trade" defaultValue="HVAC">
            {TRADES.map((trade) => (
              <option key={trade}>{trade}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Description
          <textarea className="input min-h-32" name="description" required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">
            City
            <input className="input" name="city" required />
          </label>
          <label className="label">
            State
            <select className="input" name="state" defaultValue="TX">
              {STATES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="label">
          Employment type
          <select className="input" name="employment_type" defaultValue="full_time">
            {EMPLOYMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="label">
            Pay min
            <input className="input" name="pay_min" type="number" min="0" step="0.01" />
          </label>
          <label className="label">
            Pay max
            <input className="input" name="pay_max" type="number" min="0" step="0.01" />
          </label>
          <label className="label">
            Unit
            <select className="input" name="pay_unit" defaultValue="hour">
              <option value="">Not listed</option>
              {PAY_UNITS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="label">
          Required certification
          <input className="input" name="required_certification" placeholder="Optional, for example EPA 608" />
        </label>
        <button className="btn btn-primary" type="submit">Publish job</button>
      </form>
    </div>
  );
}
