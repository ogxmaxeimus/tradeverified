import type { Metadata } from "next";
import Link from "next/link";
import { DashboardNav, Flash, VerificationBadge } from "@/components/ui";
import { location } from "@/lib/format";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  jobs: { id: string; title: string; city: string; state: string; trade: string } | { id: string; title: string; city: string; state: string; trade: string }[] | null;
};

type EmployerJob = {
  id: string;
  title: string;
  status: string;
  trade: string;
  city: string;
  state: string;
  applications: { id: string }[] | null;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { supabase, viewer } = await requireViewer();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hello, {viewer.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-slate-600 capitalize">{viewer.role} account</p>
      </div>
      <DashboardNav role={viewer.role} />
      <Flash error={flash.error} notice={flash.notice} />
      {viewer.role === "worker" ? <WorkerHome supabase={supabase} userId={viewer.id} /> : null}
      {viewer.role === "employer" ? <EmployerHome supabase={supabase} userId={viewer.id} /> : null}
      {viewer.role === "admin" ? <AdminHome supabase={supabase} /> : null}
    </div>
  );
}

async function WorkerHome({
  supabase,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof requireViewer>>["supabase"];
  userId: string;
}) {
  const [{ data: worker }, { data: apps }] = await Promise.all([
    supabase
      .from("worker_profiles")
      .select("trade, verification_status, open_to_work, years_experience")
      .eq("profile_id", userId)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("id, status, created_at, jobs(id, title, city, state, trade)")
      .order("created_at", { ascending: false }),
  ]);

  const applications = (apps ?? []) as ApplicationRow[];

  return (
    <div className="space-y-6">
      <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-slate-500">{worker?.trade ?? "Trade not set"}</p>
          <div className="mt-2">
            <VerificationBadge status={worker?.verification_status ?? "unverified"} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {worker?.verification_status === "verified"
              ? "At least one credential has been approved."
              : "Upload a license or certification to request a verified badge."}
          </p>
        </div>
        <Link href="/dashboard/credentials" className="btn btn-primary">Upload credentials</Link>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Your applications</h2>
        {applications.length === 0 ? (
          <p className="mt-2 text-slate-600">
            No applications yet. <Link className="font-semibold text-blue-700" href="/jobs">Browse jobs</Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {applications.map((application) => {
              const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
              if (!job) return null;
              return (
                <li key={application.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="font-semibold hover:text-blue-700">{job.title}</Link>
                    <p className="text-sm text-slate-500">
                      {job.trade} · {location(job.city, job.state)}
                    </p>
                  </div>
                  <span className="text-sm font-medium capitalize">{application.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

async function EmployerHome({
  supabase,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof requireViewer>>["supabase"];
  userId: string;
}) {
  const { data } = await supabase
    .from("jobs")
    .select("id, title, status, trade, city, state, applications(id)")
    .eq("employer_id", userId)
    .order("created_at", { ascending: false });
  const jobs = (data ?? []) as EmployerJob[];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your jobs</h2>
        <Link href="/jobs/new" className="btn btn-primary">Post a job</Link>
      </div>
      {jobs.length === 0 ? <p className="text-slate-600">No jobs posted yet.</p> : null}
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold hover:text-blue-700">{job.title}</Link>
              <p className="text-sm text-slate-500">
                {job.trade} · {location(job.city, job.state)} · {job.status}
              </p>
            </div>
            <span className="text-sm text-slate-600">{job.applications?.length ?? 0} applicants</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function AdminHome({
  supabase,
}: {
  supabase: Awaited<ReturnType<typeof requireViewer>>["supabase"];
}) {
  const { count } = await supabase
    .from("credentials")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <section className="card p-5">
      <h2 className="text-xl font-semibold">Verification queue</h2>
      <p className="mt-2 text-slate-600">{count ?? 0} credential{count === 1 ? "" : "s"} waiting for review.</p>
      <Link href="/admin" className="btn btn-primary mt-4">Open queue</Link>
    </section>
  );
}
