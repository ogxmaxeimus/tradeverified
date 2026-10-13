import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setApplicationStatus, setJobStatus } from "@/app/actions/jobs";
import { DashboardNav, Flash, VerificationBadge } from "@/components/ui";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { location, unwrap } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Applicants" };

type Applicant = {
  id: string;
  status: string;
  cover_note: string | null;
  created_at: string;
  worker_id: string;
  worker_profiles: {
    trade: string;
    verification_status: string;
    profiles: { full_name: string; city: string | null; state: string | null } | { full_name: string; city: string | null; state: string | null }[] | null;
  } | null;
};

export default async function ApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const { supabase, viewer } = await requireRole("employer");
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, status, trade, city, state")
    .eq("id", id)
    .eq("employer_id", viewer.id)
    .maybeSingle();
  if (!job) notFound();

  const { data } = await supabase
    .from("applications")
    .select(
      `id, status, cover_note, created_at, worker_id,
       worker_profiles(trade, verification_status, profiles(full_name, city, state))`,
    )
    .eq("job_id", id)
    .order("created_at", { ascending: false });
  const applicants = (data ?? []) as unknown as Applicant[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="mt-1 text-slate-500">
          {job.trade} · {location(job.city, job.state)} · {job.status}
        </p>
      </div>
      <DashboardNav role={viewer.role} />
      <Flash error={flash.error} notice={flash.notice} />
      <div className="flex flex-wrap gap-2">
        <Link className="btn btn-ghost" href={`/jobs/${job.id}`}>Public job page</Link>
        <form action={setJobStatus}>
          <input type="hidden" name="id" value={job.id} />
          <input type="hidden" name="status" value={job.status === "open" ? "closed" : "open"} />
          <button className="btn btn-ghost" type="submit">
            {job.status === "open" ? "Close job" : "Reopen job"}
          </button>
        </form>
      </div>
      {applicants.length === 0 ? <p className="text-slate-600">No applications yet.</p> : null}
      <ul className="space-y-4">
        {applicants.map((application) => {
          const worker = unwrap(application.worker_profiles);
          const profile = unwrap(worker?.profiles ?? null);
          return (
            <li key={application.id} className="card space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/workers/${application.worker_id}`} className="text-lg font-semibold hover:text-blue-700">
                    {profile?.full_name ?? "Worker"}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {worker?.trade} · {location(profile?.city ?? null, profile?.state ?? null)}
                  </p>
                </div>
                {worker ? <VerificationBadge status={worker.verification_status} /> : null}
              </div>
              {application.cover_note ? <p className="text-sm text-slate-700">{application.cover_note}</p> : null}
              <form action={setApplicationStatus} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={application.id} />
                <input type="hidden" name="job_id" value={job.id} />
                <label className="label">
                  Status
                  <select className="input" name="status" defaultValue={application.status}>
                    {APPLICATION_STATUSES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-primary" type="submit">Save</button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
