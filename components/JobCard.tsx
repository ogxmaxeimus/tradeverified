"use client";

import Link from "next/link";
import { Bookmark, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { place, timeAgo } from "@/lib/format";
import type { Job } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cx } from "./ui";

export function JobCard({ job }: { job: Job }) {
  const router = useRouter();
  const { state, isJobSaved, toggleSavedJob } = useStore();
  const company = state.companies.find((item) => item.id === job.companyId);
  const count = state.applications.filter((item) => item.jobId === job.id && item.status !== "Withdrawn").length;
  const saved = isJobSaved(job.id);

  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">{job.trade}</p>
          <h3 className="mt-1 text-lg font-bold">
            <Link href={`/jobs/${job.id}`} className="hover:text-brand">{job.title}</Link>
          </h3>
          <p className="text-sm text-muted">
            {company ? <Link href={`/companies/${company.slug}`} className="font-medium text-ink hover:text-brand">{company.name}</Link> : "Company"}
            {" · "}{job.type}
          </p>
        </div>
        <button
          className={cx("grid h-9 w-9 place-items-center rounded-full border border-line", saved && "border-brand bg-blue-50 text-brand")}
          aria-label={saved ? "Unsave job" : "Save job"}
          onClick={() => {
            const error = toggleSavedJob(job.id);
            if (error) router.push(`/login?next=/jobs/${job.id}`);
          }}
        >
          <Bookmark className={cx("h-4 w-4", saved && "fill-current")} />
        </button>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{job.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {place(job)}</span>
        <span className="font-semibold text-ink">{job.pay}</span>
        <span>{count} applicant{count === 1 ? "" : "s"}</span>
        <span>{timeAgo(job.createdAt)}</span>
      </div>
    </article>
  );
}
