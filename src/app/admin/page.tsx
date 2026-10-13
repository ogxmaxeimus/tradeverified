import type { Metadata } from "next";
import Link from "next/link";
import { reviewCredential } from "@/app/actions/admin";
import { Flash, VerificationBadge } from "@/components/ui";
import { formatDate, location, unwrap } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Review queue" };

type QueueItem = {
  id: string;
  kind: string;
  name: string;
  issuing_authority: string;
  license_number: string | null;
  state: string | null;
  issued_on: string | null;
  expires_on: string | null;
  document_path: string | null;
  status: string;
  created_at: string;
  worker_id: string;
  worker_profiles: {
    trade: string;
    verification_status: string;
    profiles: { full_name: string; city: string | null; state: string | null } | { full_name: string; city: string | null; state: string | null }[] | null;
  } | null;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { supabase } = await requireRole("admin");
  const { data } = await supabase
    .from("credentials")
    .select(
      `id, kind, name, issuing_authority, license_number, state, issued_on, expires_on,
       document_path, status, created_at, worker_id,
       worker_profiles(trade, verification_status, profiles(full_name, city, state))`,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const queue = (data ?? []) as unknown as QueueItem[];

  const links = await Promise.all(
    queue.map(async (item) => {
      if (!item.document_path) return { id: item.id, url: null as string | null };
      const signed = await supabase.storage.from("credentials").createSignedUrl(item.document_path, 180);
      return { id: item.id, url: signed.data?.signedUrl ?? null };
    }),
  );
  const urlById = new Map(links.map((item) => [item.id, item.url]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verification queue</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Approve a credential after you check the document against the issuing authority.
          The worker badge turns verified when they have at least one approved credential.
        </p>
      </div>
      <Flash error={flash.error} notice={flash.notice} />
      {queue.length === 0 ? <p className="text-slate-600">Nothing is waiting for review.</p> : null}
      <ul className="space-y-4">
        {queue.map((item) => {
          const worker = unwrap(item.worker_profiles);
          const profile = unwrap(worker?.profiles ?? null);
          const documentUrl = urlById.get(item.id);
          return (
            <li key={item.id} className="card space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/workers/${item.worker_id}`} className="text-lg font-semibold hover:text-blue-700">
                    {profile?.full_name ?? "Worker"}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {worker?.trade} · {location(profile?.city ?? null, profile?.state ?? null)}
                  </p>
                </div>
                {worker ? <VerificationBadge status={worker.verification_status} /> : null}
              </div>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-600">
                  {item.kind} · {item.issuing_authority}
                  {item.license_number ? ` · #${item.license_number}` : ""}
                  {item.state ? ` · ${item.state}` : ""}
                </p>
                <p className="text-sm text-slate-500">
                  {[
                    item.issued_on ? `Issued ${formatDate(item.issued_on)}` : null,
                    item.expires_on ? `Expires ${formatDate(item.expires_on)}` : null,
                    `Submitted ${formatDate(item.created_at.slice(0, 10))}`,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              {documentUrl ? (
                <a className="btn btn-ghost" href={documentUrl} target="_blank" rel="noreferrer">Open document</a>
              ) : (
                <p className="text-sm text-slate-500">No file was stored with this submission. Review the details on record.</p>
              )}
              <form action={reviewCredential} className="space-y-3">
                <input type="hidden" name="id" value={item.id} />
                <label className="label">
                  Review note
                  <textarea className="input min-h-20" name="note" placeholder="What you checked, or why it was rejected" />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-primary" name="decision" value="approved" type="submit">Approve</button>
                  <button className="btn btn-ghost" name="decision" value="rejected" type="submit">Reject</button>
                </div>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
