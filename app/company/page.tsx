"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountFrame } from "@/components/SideNav";
import { Shell } from "@/components/Shell";
import { Field, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function CompanyEditPage() {
  useTitle("Company");
  const router = useRouter();
  const store = useStore();

  useEffect(() => {
    if (!store.currentUser) router.replace("/login?next=/company");
    else if (store.currentUser.role === "worker") router.replace("/profile");
  }, [router, store.currentUser]);

  if (!store.currentCompany) return <Shell><p className="p-10 text-muted">Opening your company…</p></Shell>;

  return (
    <Shell>
      <AccountFrame>
        <CompanyForm />
      </AccountFrame>
    </Shell>
  );
}

function CompanyForm() {
  const store = useStore();
  const company = store.currentCompany!;
  const [form, setForm] = useState({
    name: company.name,
    location: company.location,
    focus: company.focus,
    website: company.website,
    about: company.about,
  });
  const [error, setError] = useState<string | null>(null);
  const jobs = store.state.jobs.filter((job) => job.companyId === company.id);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Company</h1>
      <p className="mt-1 text-sm text-muted">Public page: <Link className="font-semibold text-brand" href={`/companies/${company.slug}`}>{company.name}</Link></p>
      <form
        className="mt-6 grid gap-3 rounded-2xl border border-line bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(store.updateCompany(form));
        }}
      >
        <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Location"><input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Field>
          <Field label="Focus trade"><input className={inputClass} value={form.focus} onChange={(event) => setForm({ ...form, focus: event.target.value })} /></Field>
        </div>
        <Field label="Website"><input className={inputClass} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://" /></Field>
        <Field label="About the shop"><textarea className={inputClass} rows={5} value={form.about} onChange={(event) => setForm({ ...form, about: event.target.value })} /></Field>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className={`${btnPrimary} w-max`}>Save company</button>
      </form>
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Open jobs</h2>
          <Link href="/post-job" className="text-sm font-semibold text-brand">Post a job</Link>
        </div>
        <ul className="mt-3 space-y-2">
          {jobs.map((job) => (
            <li key={job.id}><Link href={`/jobs/${job.id}`} className="font-medium hover:text-brand">{job.title}</Link> <span className="text-sm text-muted">· {job.city}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
