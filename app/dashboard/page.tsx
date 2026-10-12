"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccountFrame } from "@/components/SideNav";
import { Shell } from "@/components/Shell";
import { Avatar, statusClass, useTitle } from "@/components/ui";
import { credentialTone, formatDate, place, ratingOf, withinDays } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/types";

const STATUSES: ApplicationStatus[] = ["New", "In Review", "Shortlisted", "Hired", "Not Selected"];

export default function DashboardPage() {
  useTitle("Dashboard");
  const router = useRouter();
  const store = useStore();

  useEffect(() => {
    if (!store.currentUser) router.replace("/login?next=/dashboard");
  }, [router, store.currentUser]);

  if (!store.currentUser) return <Shell><p className="p-10 text-muted">Redirecting to sign in…</p></Shell>;

  return (
    <Shell>
      <AccountFrame>
        {store.currentUser.role === "employer" && store.currentCompany ? <EmployerHome /> : <WorkerHome />}
      </AccountFrame>
    </Shell>
  );
}

function EmployerHome() {
  const store = useStore();
  const company = store.currentCompany!;
  const user = store.currentUser!;
  const jobs = store.state.jobs.filter((job) => job.companyId === company.id);
  const apps = store.state.applications.filter((application) => jobs.some((job) => job.id === application.jobId) && application.status !== "Withdrawn");
  const saved = store.state.savedPros[user.id]?.length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted">Welcome back, {user.name.split(" ")[0]}. Here is what is moving at {company.name}.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${company.slug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold">View company</Link>
          <Link href="/post-job" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">Post a job</Link>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active jobs" value={String(jobs.length)} detail={`${jobs.filter((job) => withinDays(job.createdAt, 7)).length} posted this week`} />
        <Stat label="Applications" value={String(apps.length)} detail={`${apps.filter((item) => withinDays(item.createdAt, 7)).length} new this week`} />
        <Stat label="Saved candidates" value={String(saved)} detail="People you marked to revisit" />
        <Stat label="Company views" value={company.views.toLocaleString()} detail="Visits to your company page" />
      </div>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your job postings</h2>
          <Link href="/jobs" className="text-sm font-semibold text-brand">View all jobs</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {jobs.length === 0 ? <p className="text-sm text-muted">No open roles. Post the one you are actually trying to fill.</p> : null}
          {jobs.map((job) => {
            const count = apps.filter((item) => item.jobId === job.id).length;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-brand">
                <p className="font-semibold">{job.title}</p>
                <p className="text-sm text-muted">{place(job)}</p>
                <p className="mt-2 text-sm font-medium text-brand">{count} application{count === 1 ? "" : "s"}</p>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-bold">Recent applications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2 font-semibold">Candidate</th>
                <th className="px-4 py-2 font-semibold">Trade</th>
                <th className="px-4 py-2 font-semibold">Experience</th>
                <th className="px-4 py-2 font-semibold">Verified</th>
                <th className="px-4 py-2 font-semibold">Applied</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 ? <tr><td className="px-4 py-6 text-muted" colSpan={6}>Applications will land here.</td></tr> : null}
              {apps.map((application) => {
                const pro = store.state.professionals.find((item) => item.id === application.professionalId);
                if (!pro) return null;
                const verified = pro.credentials.some((item) => credentialTone(item.expires, item.status) === "verified");
                return (
                  <tr key={application.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/professionals/${pro.slug}`} className="flex items-center gap-2 font-semibold hover:text-brand">
                        <Avatar name={pro.name} size={32} />
                        <span>
                          {pro.name}
                          <span className="block text-xs font-normal text-muted">{ratingOf(pro.reviews).rating.toFixed(1)} · {application.note.slice(0, 42)}{application.note.length > 42 ? "…" : ""}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{pro.trade}</td>
                    <td className="px-4 py-3">{pro.years} years</td>
                    <td className="px-4 py-3">{verified ? "Verified" : "Pending"}</td>
                    <td className="px-4 py-3">{formatDate(application.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(application.status)}`}
                        value={application.status}
                        onChange={(event) => store.setApplicationStatus(application.id, event.target.value as ApplicationStatus)}
                      >
                        {STATUSES.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function WorkerHome() {
  const store = useStore();
  const pro = store.currentProfessional;
  const user = store.currentUser!;
  if (!pro) return <p>Your profile is missing. Reset the sample data from the account menu.</p>;
  const rating = ratingOf(pro.reviews);
  const apps = store.state.applications.filter((item) => item.professionalId === pro.id);
  const recommended = store.state.jobs.filter((job) => job.trade === pro.trade).slice(0, 3);
  const checks = [
    { ok: pro.about.trim().length > 80, label: "Write a bio that names the work you actually do", href: "/profile" },
    { ok: pro.credentials.length > 0, label: "Add a license or certification", href: "/profile#credentials" },
    { ok: pro.credentials.some((item) => credentialTone(item.expires, item.status) === "verified"), label: "Run a check so the badge shows its source", href: "/profile#credentials" },
    { ok: pro.portfolio.length > 0, label: "Add a project with a before and after story", href: "/profile#portfolio" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Good to see you, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-muted">{pro.title} · {place(pro)} · {user.plan === "pro" ? "Pro" : "Free"} plan</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Profile views" value={pro.views.toLocaleString()} detail="People who opened your profile" />
        <Stat label="Rating" value={rating.count ? rating.rating.toFixed(1) : "—"} detail={`${rating.count} review${rating.count === 1 ? "" : "s"}`} />
        <Stat label="Applications" value={String(apps.filter((item) => item.status !== "Withdrawn").length)} detail="Roles you have put your name on" />
        <Stat label="Projects" value={String(pro.portfolio.length)} detail={user.plan === "free" ? `${Math.max(0, 3 - pro.portfolio.length)} free slots left` : "Unlimited on Pro"} />
      </div>
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-bold">Get the profile hire-ready</h2>
        <ul className="mt-3 space-y-2">
          {checks.map((check) => (
            <li key={check.label}>
              <Link href={check.href} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-soft">
                <span className="text-sm">{check.ok ? "✓" : "○"} {check.label}</span>
                <span className="text-xs font-semibold text-brand">{check.ok ? "Done" : "Fix"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-bold">Your applications</h2>
          <div className="mt-3 space-y-3">
            {apps.length === 0 ? <p className="text-sm text-muted">You have not applied yet. Start with a job in your trade.</p> : null}
            {apps.map((application) => {
              const job = store.state.jobs.find((item) => item.id === application.jobId);
              if (!job) return null;
              return (
                <Link key={application.id} href={`/jobs/${job.id}`} className="block rounded-xl border border-line p-3 hover:border-brand">
                  <span className="font-semibold">{job.title}</span>
                  <span className="mt-1 flex items-center justify-between text-sm text-muted">
                    {place(job)}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(application.status)}`}>{application.status}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-bold">Jobs in {pro.trade}</h2>
          <div className="mt-3 space-y-3">
            {recommended.length === 0 ? <p className="text-sm text-muted">No open roles in your trade right now.</p> : null}
            {recommended.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-xl border border-line p-3 hover:border-brand">
                <span className="font-semibold">{job.title}</span>
                <span className="mt-1 block text-sm text-muted">{place(job)} · {job.pay}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </article>
  );
}
