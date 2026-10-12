"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccountFrame } from "@/components/SideNav";
import { JobCard } from "@/components/JobCard";
import { ProCard } from "@/components/ProCard";
import { Shell } from "@/components/Shell";
import { Empty, btnPrimary, useTitle } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SavedPage() {
  useTitle("Saved");
  const router = useRouter();
  const store = useStore();

  useEffect(() => {
    if (!store.currentUser) router.replace("/login?next=/saved");
  }, [router, store.currentUser]);

  if (!store.currentUser) return <Shell><p className="p-10 text-muted">Redirecting to sign in…</p></Shell>;

  const pros = (store.state.savedPros[store.currentUser.id] ?? [])
    .map((id) => store.state.professionals.find((pro) => pro.id === id))
    .filter((pro) => Boolean(pro));
  const jobs = (store.state.savedJobs[store.currentUser.id] ?? [])
    .map((id) => store.state.jobs.find((job) => job.id === id))
    .filter((job) => Boolean(job));

  return (
    <Shell>
      <AccountFrame>
        <h1 className="text-3xl font-extrabold tracking-tight">Saved</h1>
        <p className="mt-1 text-muted">People and jobs you want to come back to.</p>
        <section className="mt-6">
          <h2 className="font-bold">Tradespeople</h2>
          {pros.length === 0 ? (
            <div className="mt-3">
              <Empty title="No one saved yet" body="Open the network and save the people you would actually call." action={<Link href="/network" className={btnPrimary}>Browse the network</Link>} />
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">{pros.map((pro) => pro ? <ProCard key={pro.id} pro={pro} /> : null)}</div>
          )}
        </section>
        <section className="mt-8">
          <h2 className="font-bold">Jobs</h2>
          {jobs.length === 0 ? <p className="mt-3 text-sm text-muted">Saved jobs show up here.</p> : <div className="mt-3 grid gap-4">{jobs.map((job) => job ? <JobCard key={job.id} job={job} /> : null)}</div>}
        </section>
      </AccountFrame>
    </Shell>
  );
}
