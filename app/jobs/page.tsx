"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { Shell } from "@/components/Shell";
import { inputClass, useTitle } from "@/components/ui";
import { filterJobs } from "@/lib/search";
import { useStore } from "@/lib/store";
import { TRADES, type JobType } from "@/lib/types";

export default function JobsPage() {
  return (
    <Suspense fallback={<Shell><p className="p-10 text-muted">Loading jobs…</p></Shell>}>
      <JobsInner />
    </Suspense>
  );
}

function JobsInner() {
  useTitle("Jobs");
  const params = useSearchParams();
  const { state, currentUser } = useStore();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [trade, setTrade] = useState(params.get("trade") ?? "");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");

  const jobs = useMemo(
    () => filterJobs(state.jobs, { q, trade, location, type }),
    [state.jobs, q, trade, location, type],
  );

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Open jobs</h1>
            <p className="mt-1 text-muted">{jobs.length} role{jobs.length === 1 ? "" : "s"} from shops in this workspace.</p>
          </div>
          {currentUser?.role === "employer" ? <Link href="/post-job" className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white">Post a job</Link> : null}
        </div>
        <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-4">
          <input className={inputClass} value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search jobs" />
          <select className={inputClass} value={trade} onChange={(event) => setTrade(event.target.value)}>
            <option value="">All trades</option>
            {TRADES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className={inputClass} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or region" />
          <select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Any type</option>
            {(["Full-time", "Contract", "Apprenticeship"] as JobType[]).map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-5 grid gap-4">
          {jobs.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">No jobs match. Clear a filter or post the role you actually need.</p> : null}
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      </div>
    </Shell>
  );
}
