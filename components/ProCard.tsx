"use client";

import Link from "next/link";
import { BadgeCheck, Heart, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { place, ratingOf } from "@/lib/format";
import type { Professional } from "@/lib/types";
import { useStore } from "@/lib/store";
import { credentialTone } from "@/lib/format";
import { Avatar, Stars, cx } from "./ui";

export function ProCard({ pro }: { pro: Professional }) {
  const router = useRouter();
  const { isProSaved, toggleSavedPro, currentUser } = useStore();
  const rating = ratingOf(pro.reviews);
  const verified = pro.credentials.some((item) => credentialTone(item.expires, item.status) === "verified");
  const saved = isProSaved(pro.id);

  return (
    <article className="relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.8)]">
      <button
        className={cx("absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-line", saved && "border-rose-200 bg-rose-50 text-rose-600")}
        aria-label={saved ? `Unsave ${pro.name}` : `Save ${pro.name}`}
        onClick={() => {
          const error = toggleSavedPro(pro.id);
          if (error) router.push(`/login?next=/professionals/${pro.slug}`);
        }}
      >
        <Heart className={cx("h-4 w-4", saved && "fill-current")} />
      </button>
      <Link href={`/professionals/${pro.slug}`} className="flex flex-col items-center text-center">
        <span className="relative">
          <Avatar name={pro.name} size={84} />
          {verified ? (
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
              <BadgeCheck className="h-4 w-4" />
            </span>
          ) : null}
        </span>
        {pro.featured ? <span className="mt-3 text-[11px] font-bold uppercase tracking-wide text-brand">Featured</span> : <span className="mt-3 h-4" />}
        <h3 className="text-lg font-bold">{pro.name}</h3>
        <p className="text-sm text-muted">{pro.title}</p>
        <div className="mt-2"><Stars value={rating.rating} count={rating.count} /></div>
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5" /> {place(pro)}
        </p>
        <p className="mt-1 text-sm text-muted">{pro.years} years · {pro.availability}</p>
      </Link>
      <Link href={`/professionals/${pro.slug}`} className="mt-4 rounded-full border border-line py-2 text-center text-sm font-semibold hover:border-brand hover:text-brand">
        View profile
      </Link>
      {currentUser?.id === pro.userId ? <p className="mt-2 text-center text-xs text-muted">This is your profile</p> : null}
    </article>
  );
}
