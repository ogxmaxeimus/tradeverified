import Link from "next/link";
import { JobCard, WorkerCard } from "@/components/cards";
import { STATES, TRADES } from "@/lib/constants";
import { unwrap } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type WorkerHit = {
  id: string;
  full_name: string;
  city: string | null;
  state: string | null;
  headline: string | null;
  trade: string;
  years_experience: number;
  hourly_rate: number | string | null;
  open_to_work: boolean;
  verification_status: string;
  approved_credentials: string[] | null;
};

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

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: workers }, { data: jobs }, { count: workerCount }, { count: jobCount }] =
    await Promise.all([
      supabase.rpc("search_workers", {
        trade_filter: null,
        certification_filter: null,
        city_filter: null,
        state_filter: null,
      }),
      supabase
        .from("jobs")
        .select(
          "id, title, trade, city, state, employment_type, pay_min, pay_max, pay_unit, required_certification, employer_profiles(company_name)",
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("worker_profiles").select("profile_id", { count: "exact", head: true }),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

  const featured = ((workers ?? []) as WorkerHit[]).slice(0, 4);
  const openJobs = ((jobs ?? []) as JobRow[]).map((job) => ({
    ...job,
    company_name: unwrap(job.employer_profiles)?.company_name ?? "Employer",
  }));

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl bg-blue-700 px-6 py-12 text-white sm:px-10">
        <p className="text-sm font-semibold text-blue-100">Pilot marketplace</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight">
          Hire tradespeople whose licenses you can check.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-blue-100">
          Workers keep a profile, upload licenses, and apply to jobs. Employers search by trade,
          certification, and location. Verification in this pilot is a manual review.
        </p>
        <form action="/workers" className="mt-8 grid gap-3 rounded-2xl bg-white p-4 text-slate-900 sm:grid-cols-4">
          <label className="label">
            Trade
            <select className="input" name="trade" defaultValue="">
              <option value="">Any trade</option>
              {TRADES.map((trade) => (
                <option key={trade}>{trade}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Certification
            <input className="input" name="certification" placeholder="EPA 608, journeyman…" />
          </label>
          <label className="label">
            State
            <select className="input" name="state" defaultValue="TX">
              <option value="">Any state</option>
              {STATES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary w-full" type="submit">Search workers</button>
          </div>
        </form>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-blue-100">
          <span>{workerCount ?? 0} worker profiles</span>
          <span>{jobCount ?? 0} open jobs</span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">For tradespeople</h2>
          <p className="mt-2 text-slate-600">
            Free profile, license upload, portfolio, and unlimited applications during the pilot.
          </p>
          <Link href="/signup" className="btn btn-primary mt-4">Join as a worker</Link>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">For employers</h2>
          <p className="mt-2 text-slate-600">
            Post jobs, filter by trade and certification, and review who applied.
          </p>
          <Link href="/signup" className="btn btn-primary mt-4">Join as an employer</Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Workers</h2>
          <Link href="/workers" className="text-sm font-semibold text-blue-700">View all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Open jobs</h2>
          <Link href="/jobs" className="text-sm font-semibold text-blue-700">View all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {openJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </div>
  );
}
