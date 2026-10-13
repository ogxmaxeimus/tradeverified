import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerificationBadge } from "@/components/ui";
import { formatDate, location, money, unwrap } from "@/lib/format";
import { publicAssetUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type Credential = {
  id: string;
  kind: string;
  name: string;
  issuing_authority: string;
  license_number: string | null;
  state: string | null;
  issued_on: string | null;
  expires_on: string | null;
  status: string;
  reviewed_at: string | null;
};

type Portfolio = {
  id: string;
  title: string;
  description: string | null;
  image_path: string;
  completed_on: string | null;
};

type ProfileRow = {
  trade: string;
  years_experience: number;
  hourly_rate: number | string | null;
  open_to_work: boolean;
  verification_status: string;
  verified_at: string | null;
  profiles: {
    id: string;
    full_name: string;
    city: string | null;
    state: string | null;
    headline: string | null;
    bio: string | null;
  } | {
    id: string;
    full_name: string;
    city: string | null;
    state: string | null;
    headline: string | null;
    bio: string | null;
  }[] | null;
  credentials: Credential[] | null;
  portfolio_items: Portfolio[] | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name").eq("id", id).maybeSingle();
  return { title: data?.full_name ?? "Worker" };
}

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("worker_profiles")
    .select(
      `trade, years_experience, hourly_rate, open_to_work, verification_status, verified_at,
       profiles(id, full_name, city, state, headline, bio),
       credentials(id, kind, name, issuing_authority, license_number, state, issued_on, expires_on, status, reviewed_at),
       portfolio_items(id, title, description, image_path, completed_on)`,
    )
    .eq("profile_id", id)
    .maybeSingle();

  const worker = data as ProfileRow | null;
  const profile = unwrap(worker?.profiles ?? null);
  if (!worker || !profile) notFound();

  const credentials = (worker.credentials ?? []).filter((item) => item.status === "approved");
  const portfolio = [...(worker.portfolio_items ?? [])].sort((a, b) =>
    (b.completed_on ?? "").localeCompare(a.completed_on ?? ""),
  );
  const rate = money(worker.hourly_rate);

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-700">{worker.trade}</p>
            <h1 className="mt-1 text-3xl font-bold">{profile.full_name}</h1>
            <p className="mt-1 text-slate-500">{location(profile.city, profile.state) || "Location not set"}</p>
          </div>
          <VerificationBadge status={worker.verification_status} />
        </div>
        {profile.headline ? <p className="mt-4 text-lg text-slate-800">{profile.headline}</p> : null}
        {profile.bio ? <p className="mt-3 max-w-3xl whitespace-pre-wrap text-slate-700">{profile.bio}</p> : null}
        <dl className="mt-5 flex flex-wrap gap-6 text-sm">
          <div>
            <dt className="text-slate-500">Experience</dt>
            <dd className="font-semibold">{worker.years_experience} years</dd>
          </div>
          <div>
            <dt className="text-slate-500">Rate</dt>
            <dd className="font-semibold">{rate ? `${rate} / hour` : "Not listed"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Availability</dt>
            <dd className="font-semibold">{worker.open_to_work ? "Open to work" : "Not looking"}</dd>
          </div>
          {worker.verified_at ? (
            <div>
              <dt className="text-slate-500">Verified</dt>
              <dd className="font-semibold">{formatDate(worker.verified_at.slice(0, 10))}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Licenses and certifications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Approved records show the issuing authority, number, and review date. This pilot review is manual.
        </p>
        {credentials.length === 0 ? (
          <p className="mt-4 text-slate-600">No approved credentials yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {credentials.map((item) => (
              <li key={item.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-green-700">
                    {item.kind === "license" ? "License" : "Certification"} · {item.issuing_authority}
                  </p>
                  <p className="text-sm text-slate-500">
                    {[
                      item.license_number ? `#${item.license_number}` : null,
                      item.state,
                      item.issued_on ? `Issued ${formatDate(item.issued_on)}` : null,
                      item.expires_on ? `Expires ${formatDate(item.expires_on)}` : null,
                      item.reviewed_at ? `Reviewed ${formatDate(item.reviewed_at.slice(0, 10))}` : null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <VerificationBadge status="verified" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold">Portfolio</h2>
        {portfolio.length === 0 ? (
          <p className="mt-4 text-slate-600">No portfolio photos yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {portfolio.map((item) => (
              <li key={item.id} className="card overflow-hidden">
                <Image
                  src={publicAssetUrl(item.image_path)}
                  alt={item.title}
                  width={640}
                  height={360}
                  className="h-48 w-full object-cover"
                  unoptimized={item.image_path.endsWith(".svg") || !item.image_path.startsWith("/")}
                />
                <div className="p-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.completed_on ? (
                    <p className="text-sm text-slate-500">{formatDate(item.completed_on)}</p>
                  ) : null}
                  {item.description ? <p className="mt-2 text-sm text-slate-700">{item.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-slate-500">
        Hiring? <Link className="font-semibold text-blue-700" href="/jobs">See open jobs</Link> or search more{" "}
        <Link className="font-semibold text-blue-700" href={`/workers?trade=${encodeURIComponent(worker.trade)}`}>
          {worker.trade} workers
        </Link>.
      </p>
    </div>
  );
}
