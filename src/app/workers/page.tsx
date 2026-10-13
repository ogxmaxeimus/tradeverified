import type { Metadata } from "next";
import { WorkerCard } from "@/components/cards";
import { STATES, TRADES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Workers" };

type WorkerHit = {
  id: string;
  full_name: string;
  city: string | null;
  state: string | null;
  headline: string | null;
  trade: string;
  years_experience: number;
  open_to_work: boolean;
  verification_status: string;
  approved_credentials: string[] | null;
};

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{
    trade?: string;
    certification?: string;
    city?: string;
    state?: string;
  }>;
}) {
  const params = await searchParams;
  const trade = params.trade ?? "";
  const certification = params.certification ?? "";
  const city = params.city ?? "";
  const state = params.state ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_workers", {
    trade_filter: trade || null,
    certification_filter: certification || null,
    city_filter: city || null,
    state_filter: state || null,
  });
  const workers = (data ?? []) as WorkerHit[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find workers</h1>
        <p className="mt-2 text-slate-600">
          Filter by trade, an approved certification name, and location. Verified profiles are listed first.
        </p>
      </div>
      <form action="/workers" className="card grid gap-3 p-4 md:grid-cols-5">
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
          Certification
          <input className="input" name="certification" defaultValue={certification} placeholder="EPA 608" />
        </label>
        <label className="label">
          City
          <input className="input" name="city" defaultValue={city} placeholder="Austin" />
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
      {workers.length === 0 ? (
        <p className="text-slate-600">No workers match those filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  );
}
