import type { Metadata } from "next";
import Link from "next/link";
import { DashboardNav } from "@/components/ui";
import { location } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "My jobs" };

type JobRow = {
  id: string;
  title: string;
  status: string;
  trade: string;
  city: string;
  state: string;
  applications: { id: string }[] | null;
};

export default async function EmployerJobsPage() {
  const { supabase, viewer } = await requireRole("employer");
  const { data } = await supabase
    .from("jobs")
    .select("id, title, status, trade, city, state, applications(id)")
    .eq("employer_id", viewer.id)
    .order("created_at", { ascending: false });
  const jobs = (data ?? []) as JobRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">My jobs</h1>
        <Link href="/jobs/new" className="btn btn-primary">Post a job</Link>
      </div>
      <DashboardNav role={viewer.role} />
      {jobs.length === 0 ? <p className="text-slate-600">No jobs yet.</p> : null}
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold hover:text-blue-700">{job.title}</Link>
              <p className="text-sm text-slate-500">
                {job.trade} · {location(job.city, job.state)} · {job.status}
              </p>
            </div>
            <span className="text-sm">{job.applications?.length ?? 0} applicants</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
