import Link from "next/link";
import { VerificationBadge } from "@/components/ui";
import { employmentLabel, location, payRange } from "@/lib/format";

export function WorkerCard({
  worker,
}: {
  worker: {
    id: string;
    full_name: string;
    city: string | null;
    state: string | null;
    headline: string | null;
    trade: string;
    years_experience: number;
    verification_status: string;
    approved_credentials: string[] | null;
    open_to_work: boolean;
  };
}) {
  const creds = worker.approved_credentials ?? [];
  return (
    <Link href={`/workers/${worker.id}`} className="card block p-5 hover:border-blue-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{worker.full_name}</h2>
          <p className="text-sm text-slate-500">
            {worker.trade} · {location(worker.city, worker.state) || "Location not set"}
          </p>
        </div>
        <VerificationBadge status={worker.verification_status} />
      </div>
      {worker.headline ? <p className="mt-3 text-sm text-slate-700">{worker.headline}</p> : null}
      <p className="mt-3 text-sm text-slate-500">
        {worker.years_experience} years
        {worker.open_to_work ? " · Open to work" : " · Not looking right now"}
      </p>
      {creds.length > 0 ? (
        <p className="mt-2 text-sm text-slate-600">{creds.join(" · ")}</p>
      ) : null}
    </Link>
  );
}

export function JobCard({
  job,
}: {
  job: {
    id: string;
    title: string;
    trade: string;
    city: string;
    state: string;
    employment_type: string;
    pay_min: number | string | null;
    pay_max: number | string | null;
    pay_unit: string | null;
    required_certification: string | null;
    company_name: string;
  };
}) {
  return (
    <Link href={`/jobs/${job.id}`} className="card block p-5 hover:border-blue-300">
      <p className="text-sm font-medium text-blue-700">{job.company_name}</p>
      <h2 className="mt-1 text-lg font-semibold">{job.title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {job.trade} · {location(job.city, job.state)} · {employmentLabel(job.employment_type)}
      </p>
      <p className="mt-2 text-sm text-slate-700">
        {payRange(job.pay_min, job.pay_max, job.pay_unit)}
      </p>
      {job.required_certification ? (
        <p className="mt-2 text-sm text-slate-600">Requires {job.required_certification}</p>
      ) : null}
    </Link>
  );
}
