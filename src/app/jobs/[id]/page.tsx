import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { applyToJob, withdrawApplication } from "@/app/actions/jobs";
import { Flash } from "@/components/ui";
import { employmentLabel, formatDate, location, payRange, unwrap } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

type JobDetail = {
  id: string;
  title: string;
  trade: string;
  description: string;
  city: string;
  state: string;
  employment_type: string;
  pay_min: number | string | null;
  pay_max: number | string | null;
  pay_unit: string | null;
  required_certification: string | null;
  status: string;
  created_at: string;
  employer_id: string;
  employer_profiles: {
    company_name: string;
    website: string | null;
    profiles: { full_name: string } | { full_name: string }[] | null;
  } | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("jobs").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Job" };
}

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const supabase = await createClient();
  const viewer = await getViewer();
  const { data } = await supabase
    .from("jobs")
    .select(
      `id, title, trade, description, city, state, employment_type, pay_min, pay_max, pay_unit,
       required_certification, status, created_at, employer_id,
       employer_profiles(company_name, website, profiles(full_name))`,
    )
    .eq("id", id)
    .maybeSingle();

  const job = data as JobDetail | null;
  const employer = unwrap(job?.employer_profiles ?? null);
  if (!job || !employer) notFound();
  const contact = unwrap(employer.profiles);

  let application: { id: string; status: string; cover_note: string | null } | null = null;
  if (viewer?.role === "worker") {
    const { data: existing } = await supabase
      .from("applications")
      .select("id, status, cover_note")
      .eq("job_id", id)
      .eq("worker_id", viewer.id)
      .maybeSingle();
    application = existing;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <article className="card p-6">
        <p className="text-sm font-semibold text-blue-700">{employer.company_name}</p>
        <h1 className="mt-1 text-3xl font-bold">{job.title}</h1>
        <p className="mt-2 text-slate-500">
          {job.trade} · {location(job.city, job.state)} · {employmentLabel(job.employment_type)} · {job.status}
        </p>
        <p className="mt-3 font-medium">{payRange(job.pay_min, job.pay_max, job.pay_unit)}</p>
        {job.required_certification ? (
          <p className="mt-2 text-sm text-slate-700">Requires {job.required_certification}</p>
        ) : null}
        <p className="mt-5 whitespace-pre-wrap text-slate-800">{job.description}</p>
        <p className="mt-6 text-sm text-slate-500">
          Posted {formatDate(job.created_at.slice(0, 10))}
          {contact ? ` by ${contact.full_name}` : ""}
          {employer.website ? ` · ${employer.website}` : ""}
        </p>
      </article>

      <aside className="card h-fit space-y-4 p-6">
        <h2 className="text-lg font-semibold">Apply</h2>
        <Flash error={flash.error} notice={flash.notice} />
        {viewer?.role === "employer" && viewer.id === job.employer_id ? (
          <Link className="btn btn-primary" href={`/dashboard/jobs/${job.id}`}>Review applicants</Link>
        ) : null}
        {viewer?.role === "worker" && application ? (
          <div className="space-y-3 text-sm">
            <p>You applied. Status: <span className="font-semibold">{application.status}</span></p>
            {application.cover_note ? <p className="text-slate-600">{application.cover_note}</p> : null}
            {application.status === "submitted" ? (
              <form action={withdrawApplication}>
                <input type="hidden" name="id" value={application.id} />
                <input type="hidden" name="job_id" value={job.id} />
                <button className="btn btn-ghost" type="submit">Withdraw</button>
              </form>
            ) : null}
          </div>
        ) : null}
        {viewer?.role === "worker" && !application && job.status === "open" ? (
          <form action={applyToJob} className="space-y-3">
            <input type="hidden" name="job_id" value={job.id} />
            <label className="label">
              Note to the employer
              <textarea className="input min-h-28" name="cover_note" placeholder="Licenses, start date, travel range" />
            </label>
            <button className="btn btn-primary w-full" type="submit">Submit application</button>
          </form>
        ) : null}
        {!viewer ? (
          <Link className="btn btn-primary" href={`/login?next=/jobs/${job.id}`}>Sign in to apply</Link>
        ) : null}
        {viewer?.role === "employer" && viewer.id !== job.employer_id ? (
          <p className="text-sm text-slate-600">Employer accounts cannot apply. Use a worker account.</p>
        ) : null}
        {viewer?.role === "admin" ? (
          <p className="text-sm text-slate-600">Review accounts do not apply to jobs.</p>
        ) : null}
        {job.status !== "open" && viewer?.role === "worker" && !application ? (
          <p className="text-sm text-slate-600">This job is closed.</p>
        ) : null}
      </aside>
    </div>
  );
}
