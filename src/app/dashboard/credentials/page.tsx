import type { Metadata } from "next";
import { addCredential, deleteCredential } from "@/app/actions/credentials";
import { DashboardNav, Flash, VerificationBadge } from "@/components/ui";
import { STATES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Licenses" };

type CredentialRow = {
  id: string;
  kind: string;
  name: string;
  issuing_authority: string;
  license_number: string | null;
  state: string | null;
  status: string;
  review_note: string | null;
  document_path: string | null;
  created_at: string;
};

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { supabase, viewer } = await requireRole("worker");
  const { data: worker } = await supabase
    .from("worker_profiles")
    .select("verification_status")
    .eq("profile_id", viewer.id)
    .maybeSingle();
  const { data } = await supabase
    .from("credentials")
    .select("id, kind, name, issuing_authority, license_number, state, status, review_note, document_path, created_at")
    .eq("worker_id", viewer.id)
    .order("created_at", { ascending: false });
  const credentials = (data ?? []) as CredentialRow[];

  const links = await Promise.all(
    credentials.map(async (item) => {
      if (!item.document_path) return { id: item.id, url: null as string | null };
      const signed = await supabase.storage.from("credentials").createSignedUrl(item.document_path, 120);
      return { id: item.id, url: signed.data?.signedUrl ?? null };
    }),
  );
  const urlById = new Map(links.map((item) => [item.id, item.url]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Licenses and certifications</h1>
        <VerificationBadge status={worker?.verification_status ?? "unverified"} />
      </div>
      <DashboardNav role={viewer.role} />
      <p className="max-w-2xl text-sm text-slate-600">
        Uploads start as pending. An admin approves or rejects them. One approved credential sets your profile badge to verified.
      </p>
      <Flash error={flash.error} notice={flash.notice} />
      <form action={addCredential} className="card max-w-2xl space-y-4 p-6">
        <h2 className="text-lg font-semibold">Submit a credential</h2>
        <label className="label">
          Type
          <select className="input" name="kind" defaultValue="license">
            <option value="license">License</option>
            <option value="certification">Certification</option>
          </select>
        </label>
        <label className="label">
          Name
          <input className="input" name="name" required placeholder="Journeyman Electrician" />
        </label>
        <label className="label">
          Issuing authority
          <input className="input" name="issuing_authority" required placeholder="Texas Department of Licensing and Regulation" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">
            Number
            <input className="input" name="license_number" />
          </label>
          <label className="label">
            State
            <select className="input" name="state" defaultValue="">
              <option value="">Not state-specific</option>
              {STATES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">
            Issued
            <input className="input" name="issued_on" type="date" />
          </label>
          <label className="label">
            Expires
            <input className="input" name="expires_on" type="date" />
          </label>
        </div>
        <label className="label">
          Document
          <input className="input" name="document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
        </label>
        <button className="btn btn-primary" type="submit">Submit for review</button>
      </form>
      <ul className="max-w-2xl space-y-3">
        {credentials.map((item) => (
          <li key={item.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.issuing_authority}
                  {item.license_number ? ` · #${item.license_number}` : ""}
                  {item.state ? ` · ${item.state}` : ""}
                </p>
                <p className="text-sm text-slate-500">Submitted {formatDate(item.created_at.slice(0, 10))}</p>
                {item.review_note ? <p className="mt-1 text-sm text-slate-700">{item.review_note}</p> : null}
              </div>
              <VerificationBadge status={item.status === "approved" ? "verified" : item.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {urlById.get(item.id) ? (
                <a className="btn btn-ghost" href={urlById.get(item.id) ?? "#"} target="_blank" rel="noreferrer">
                  View document
                </a>
              ) : (
                <span className="text-sm text-slate-500">No file stored with this record.</span>
              )}
              {item.status === "pending" ? (
                <form action={deleteCredential}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="btn btn-ghost" type="submit">Withdraw</button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
