"use client";

import { useEffect, type ReactNode } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { hue, initials } from "@/lib/format";
import type { ApplicationStatus, Credential } from "@/lib/types";
import { credentialTone } from "@/lib/format";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand/20 placeholder:text-muted focus:border-brand focus:ring-2";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const btnAccent =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === "TradeVerified" ? title : `${title} · TradeVerified`;
  }, [title]);
}

export function Avatar({ name, size = 48, className }: { name: string; size?: number; className?: string }) {
  const tone = hue(name);
  return (
    <span
      className={cx("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: size < 40 ? 11 : size < 72 ? 14 : 22,
        background: `linear-gradient(145deg, hsl(${tone} 62% 42%), hsl(${(tone + 40) % 360} 45% 22%))`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cx("h-3.5 w-3.5", star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300")}
          />
        ))}
      </span>
      <span className="text-sm font-semibold">{value.toFixed(1)}</span>
      {typeof count === "number" ? <span className="text-sm opacity-80">({count})</span> : null}
    </span>
  );
}

export function VerifiedPill({ children = "Verified" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      <BadgeCheck className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export function statusClass(status: ApplicationStatus) {
  if (status === "New") return "bg-blue-50 text-blue-700";
  if (status === "Shortlisted" || status === "Hired") return "bg-emerald-50 text-emerald-700";
  if (status === "In Review") return "bg-amber-50 text-amber-800";
  return "bg-soft text-muted";
}

export function CredentialBadge({ credential }: { credential: Credential }) {
  const tone = credentialTone(credential.expires, credential.status);
  const label = tone === "verified" ? "Verified" : tone === "expired" ? "Expired" : "Pending";
  const cls =
    tone === "verified"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "expired"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-800";
  return <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>{label}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
