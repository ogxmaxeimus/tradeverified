"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Avatar, Empty, Field, btnGhost, btnPrimary, inputClass, statusClass, useTitle } from "@/components/ui";
import { formatDate, place, ratingOf } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/types";

const STATUSES: ApplicationStatus[] = ["New", "In Review", "Shortlisted", "Hired", "Not Selected"];

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const job = store.state.jobs.find((item) => item.id === params.id);
  const company = job ? store.state.companies.find((item) => item.id === job.companyId) : undefined;
  useTitle(job ? job.title : "Job");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!job || !company) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Empty title="That job is gone" body="It may have been removed by the shop." action={<Link className={btnPrimary} href="/jobs">See open jobs</Link>} />
        </div>
      </Shell>
    );
  }

  const apps = store.state.applications.filter((item) => item.jobId === job.id);
  const mine = store.currentProfessional
    ? apps.find((item) => item.professionalId === store.currentProfessional?.id && item.status !== "Withdrawn")
    : undefined;
  const owner = store.currentUser?.id === company.ownerId;
  const saved = store.isJobSaved(job.id);

  return (
    <Shell>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">{job.trade}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{job.title}</h1>
          <p className="mt-2 text-muted">
            <Link href={`/companies/${company.slug}`} className="font-semibold text-ink hover:text-brand">{company.name}</Link>
            {" · "}{place(job)} · {job.type} · Posted {formatDate(job.createdAt)}
          </p>
          <p className="mt-4 text-lg font-semibold">{job.pay}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{job.description}</p>
          <h2 className="mt-6 font-bold">Requirements</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {job.requirements.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className={btnGhost} onClick={() => {
              const result = store.toggleSavedJob(job.id);
              if (result) router.push(`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`);
            }}>{saved ? "Saved" : "Save job"}</button>
            {owner ? (
              <button className="rounded-full px-4 py-2 text-sm font-semibold text-rose-600" onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                store.deleteJob(job.id);
                router.push("/dashboard");
              }}>{confirmDelete ? "Confirm remove" : "Remove job"}</button>
            ) : null}
          </div>
        </article>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-bold">{owner ? "Applicants" : "Apply"}</h2>
            {owner ? (
              <div className="mt-3 space-y-3">
                {apps.length === 0 ? <p className="text-sm text-muted">No applications yet.</p> : null}
                {apps.map((application) => {
                  const pro = store.state.professionals.find((item) => item.id === application.professionalId);
                  if (!pro) return null;
                  const rating = ratingOf(pro.reviews);
                  return (
                    <div key={application.id} className="rounded-xl border border-line p-3">
                      <Link href={`/professionals/${pro.slug}`} className="flex items-center gap-2 font-semibold hover:text-brand">
                        <Avatar name={pro.name} size={32} /> {pro.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted">{pro.trade} · {pro.years} yrs · {rating.rating.toFixed(1)}</p>
                      <p className="mt-2 text-sm">{application.note}</p>
                      <label className="mt-2 block text-xs font-semibold text-muted">
                        Status
                        <select
                          className={`${inputClass} mt-1`}
                          value={application.status}
                          onChange={(event) => store.setApplicationStatus(application.id, event.target.value as ApplicationStatus)}
                        >
                          {STATUSES.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : store.currentUser?.role === "employer" ? (
              <p className="mt-3 text-sm text-muted">This hiring account posts jobs. Sign in as a tradesperson to apply.</p>
            ) : mine ? (
              <div className="mt-3">
                <p className="text-sm">You applied {formatDate(mine.createdAt)}.</p>
                <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(mine.status)}`}>{mine.status}</p>
                <p className="mt-3 text-sm text-muted">{mine.note}</p>
                <button className={`${btnGhost} mt-4`} onClick={() => store.withdrawApplication(mine.id)}>Withdraw</button>
              </div>
            ) : (
              <form className="mt-3 grid gap-3" onSubmit={(event) => {
                event.preventDefault();
                const result = store.applyToJob(job.id, note);
                if (result) {
                  setError(result);
                  if (result.startsWith("Sign in")) router.push(`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`);
                } else setError(null);
              }}>
                <Field label="Note to the shop">
                  <textarea className={inputClass} rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ticket, city, and when you can start." />
                </Field>
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                <button className={btnPrimary}>Apply</button>
                <p className="text-xs text-muted">Employer accounts hire. Tradespeople apply.</p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
