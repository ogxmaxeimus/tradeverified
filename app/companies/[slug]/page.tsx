"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { JobCard } from "@/components/JobCard";
import { Shell } from "@/components/Shell";
import { Empty, btnPrimary, useTitle } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function CompanyPage() {
  const params = useParams<{ slug: string }>();
  const store = useStore();
  const company = store.state.companies.find((item) => item.slug === params.slug);
  useTitle(company ? company.name : "Company");

  useEffect(() => {
    if (company) store.recordCompanyView(company.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  if (!company) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Empty title="Company not found" body="That shop is not in this workspace." action={<Link href="/jobs" className={btnPrimary}>Browse jobs</Link>} />
        </div>
      </Shell>
    );
  }

  const jobs = store.state.jobs.filter((job) => job.companyId === company.id);
  const owner = store.state.users.find((user) => user.id === company.ownerId);

  return (
    <Shell>
      <div className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-200">{company.focus}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{company.name}</h1>
          <p className="mt-2 text-blue-100">{company.location}{owner ? ` · ${owner.name}` : ""}</p>
          {company.website ? <p className="mt-2 text-sm text-blue-100">{company.website}</p> : null}
        </div>
      </div>
      <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-bold">About</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{company.about || "This shop has not written an introduction yet."}</p>
          <p className="mt-3 text-xs text-muted">{company.views.toLocaleString()} company views</p>
        </section>
        <section>
          <h2 className="font-bold">Open roles</h2>
          <div className="mt-3 grid gap-3">
            {jobs.length === 0 ? <p className="text-sm text-muted">No open roles.</p> : null}
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </section>
      </div>
    </Shell>
  );
}
