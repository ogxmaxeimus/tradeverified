"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, MapPin, MessageSquare } from "lucide-react";
import { Shell } from "@/components/Shell";
import { WorkArt } from "@/components/WorkArt";
import { Avatar, CredentialBadge, Empty, Field, Stars, btnGhost, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { credentialTone, formatDate, place, ratingOf, timeAgo } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const store = useStore();
  const pro = store.state.professionals.find((item) => item.slug === params.slug);
  useTitle(pro ? pro.name : "Profile");
  const [note, setNote] = useState({ rating: 5, body: "", proof: "", tags: "" });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (pro) store.recordProView(pro.id);
    // Record once per profile view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pro?.id]);

  if (!pro) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Empty title="No profile with that name" body="They may have been cleared when the workspace was reset." action={<Link href="/network" className={btnPrimary}>Back to the network</Link>} />
        </div>
      </Shell>
    );
  }

  const rating = ratingOf(pro.reviews);
  const saved = store.isProSaved(pro.id);
  const mine = store.currentUser?.id === pro.userId;
  const verified = pro.credentials.some((item) => credentialTone(item.expires, item.status) === "verified");

  return (
    <Shell>
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center">
          <Avatar name={pro.name} size={108} className="ring-4 ring-white/20" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{pro.name}</h1>
            <p className="mt-1 text-lg text-blue-100">{pro.title}</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-blue-100">
              <MapPin className="h-4 w-4" /> {place(pro)}
              <Stars value={rating.rating} count={rating.count} />
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {verified ? <span className="rounded-full bg-emerald-500 px-2 py-1">Verified professional</span> : <span className="rounded-full bg-white/10 px-2 py-1">Credentials in progress</span>}
              {pro.featured ? <span className="rounded-full bg-white/10 px-2 py-1">Featured</span> : null}
              <span className="rounded-full bg-white/10 px-2 py-1">{pro.availability}</span>
              {pro.rate ? <span className="rounded-full bg-white/10 px-2 py-1">{pro.rate}</span> : null}
            </div>
            <p className="mt-3 text-sm text-blue-100">
              {[pro.licensed && "License on file", pro.insured && "Insurance on file", pro.backgroundChecked && "Background checked", pro.osha && "OSHA on file"].filter(Boolean).join(" · ") || "No trust flags marked yet"}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {mine ? (
              <Link href="/profile" className={btnPrimary}>Edit profile</Link>
            ) : (
              <button
                className={btnPrimary}
                onClick={() => {
                  const next = `/messages?with=${pro.userId}`;
                  if (!store.currentUser) router.push(`/login?next=${encodeURIComponent(next)}`);
                  else router.push(next);
                }}
              >
                <MessageSquare className="h-4 w-4" /> Contact {pro.name.split(" ")[0]}
              </button>
            )}
            <button
              className={btnGhost}
              onClick={() => {
                const result = store.toggleSavedPro(pro.id);
                if (result) router.push(`/login?next=${encodeURIComponent(`/professionals/${pro.slug}`)}`);
              }}
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-current text-rose-600" : ""}`} /> {saved ? "Saved" : "Save"}
            </button>
            <button
              className="text-sm text-blue-100"
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
              }}
            >
              {copied ? "Link copied" : "Copy profile link"}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">About</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{pro.about || "This profile has not added a bio yet."}</p>
          {pro.skills.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {pro.skills.map((skill) => <span key={skill} className="rounded-full bg-soft px-3 py-1 text-xs font-semibold">{skill}</span>)}
            </div>
          ) : null}
          <p className="mt-4 text-sm text-muted">{pro.years} years in the trade · {pro.views.toLocaleString()} profile views</p>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Verified credentials</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {pro.credentials.length === 0 ? <p className="text-sm text-muted">No credentials yet.</p> : null}
            {pro.credentials.map((item) => (
              <article key={item.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted">{item.detail}</p>
                  </div>
                  <CredentialBadge credential={item} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-muted">Issued</dt><dd>{formatDate(item.issued)}</dd></div>
                  <div><dt className="text-muted">Expires</dt><dd>{formatDate(item.expires)}</dd></div>
                </dl>
                <p className="mt-2 text-xs text-muted">{item.source}</p>
                <p className="text-xs text-muted">Ref {item.reference} · {item.issuer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Portfolio</h2>
          {pro.portfolio.length === 0 ? <p className="mt-3 text-sm text-muted">No projects yet.</p> : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {pro.portfolio.map((item) => (
                <article key={item.id}>
                  <div className="grid grid-cols-2 gap-2">
                    <WorkArt title={item.title} trade={pro.trade} image={item.image} label="Before" />
                    <WorkArt title={item.title} trade={pro.trade} image={item.image} label="After" />
                  </div>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="text-xs text-muted">{item.location}</p>
                  <p className="mt-1 text-sm text-muted">{item.summary}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Reviews ({rating.count})</h2>
          <div className="mt-4 space-y-4">
            {pro.reviews.map((review) => (
              <article key={review.id} className="border-b border-line pb-4 last:border-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar name={review.author} size={40} />
                  <div>
                    <p className="font-semibold">{review.author}</p>
                    <p className="text-xs text-muted">{review.location}</p>
                  </div>
                  <Stars value={review.rating} />
                  <span className="text-xs text-muted">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm">{review.body}</p>
                <p className="mt-2 text-xs text-muted">Proof: {review.proof}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {review.tags.map((tag) => <span key={tag} className="rounded-full bg-soft px-2 py-0.5 text-xs">{tag}</span>)}
                </div>
              </article>
            ))}
          </div>
          {mine ? null : (
            <form
              className="mt-6 grid gap-3 border-t border-line pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                const result = store.addReview({
                  professionalId: pro.id,
                  rating: note.rating,
                  body: note.body,
                  proof: note.proof,
                  tags: note.tags.split(","),
                });
                if (result) {
                  setError(result);
                  if (result.startsWith("Sign in")) router.push(`/login?next=${encodeURIComponent(`/professionals/${pro.slug}`)}`);
                } else {
                  setError(null);
                  setNote({ rating: 5, body: "", proof: "", tags: "" });
                }
              }}
            >
              <h3 className="font-semibold">Leave a proof-backed review</h3>
              <Field label="Rating">
                <select className={inputClass} value={note.rating} onChange={(event) => setNote({ ...note, rating: Number(event.target.value) })}>
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}
                </select>
              </Field>
              <Field label="What happened">
                <textarea className={inputClass} rows={3} value={note.body} onChange={(event) => setNote({ ...note, body: event.target.value })} placeholder="The job, the result, and whether you would call them again." />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Proof reference"><input className={inputClass} value={note.proof} onChange={(event) => setNote({ ...note, proof: event.target.value })} placeholder="Invoice, permit, or job number" /></Field>
                <Field label="Tags"><input className={inputClass} value={note.tags} onChange={(event) => setNote({ ...note, tags: event.target.value })} placeholder="Install, On time" /></Field>
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button className={btnPrimary}>Post review</button>
            </form>
          )}
        </section>
      </div>
    </Shell>
  );
}
