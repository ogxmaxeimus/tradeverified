import type { Metadata } from "next";
import { JobCard } from "@/components/cards";
import { STATES, TRADES } from "@/lib/constants";
import { unwrap } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Jobs" };

type JobRow = {
  id: string;
  title: string;
  trade: string;
  city: string;
  state: string;
  employment_type: string;
  pay_min: number | string | null;
  pay_max: number | string | null;
  pay_unit: string | null;
  required_certification: string | null;
  employer_profiles: { company_name: string } | { company_name: string }[] | null;
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string; state?: string; city?: string }>;
}) {
  const params = await searchParams;
  const trade = params.trade ?? "";
  const state = params.state ?? "";
  const city = params.city ?? "";
  const supabase = await createClient();
  let query = supabase
    .from("jobs")
    .select(
      "id, title, trade, city, state, employment_type, pay_min, pay_max, pay_unit, required_certification, employer_profiles(company_name)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (trade) query = query.eq("trade", trade);
  if (state) query = query.eq("state", state);
  if (city) query = query.ilike("city", `%${city}%`);

  const { data, error } = await query;
  const jobs = ((data ?? []) as JobRow[]).map((job) => ({
    ...job,
    company_name: unwrap(job.employer_profiles)?.company_name ?? "Employer",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Open jobs</h1>
        <p className="mt-2 text-slate-600">Workers can apply from a job page. Employers post from their dashboard.</p>
      </div>
      <form action="/jobs" className="card grid gap-3 p-4 md:grid-cols-4">
        <label className="label">
          Trade
          <select className="input" name="trade" defaultValue={trade}>
            <option value="">Any</option>
            {TRADES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="label">
          City
          <input className="input" name="city" defaultValue={city} />
        </label>
        <label className="label">
          State
          <select className="input" name="state" defaultValue={state}>
            <option value="">Any</option>
            {STATES.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" type="submit">Search</button>
        </div>
      </form>
      {error ? <p className="text-sm text-red-700">{error.message}</p> : null}
      {jobs.length === 0 ? (
        <p className="text-slate-600">No open jobs match those filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
