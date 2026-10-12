"use client";

import Link from "next/link";
import { Shell } from "@/components/Shell";
import { useTitle } from "@/components/ui";
import { ARTICLES } from "@/lib/content";

export default function ResourcesPage() {
  useTitle("Resources");
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Resources</h1>
        <p className="mt-1 text-muted">Short guides for the people doing the work and the people hiring them.</p>
        <div className="mt-6 grid gap-3">
          {ARTICLES.map((article) => (
            <Link key={article.slug} href={`/resources/${article.slug}`} className="rounded-2xl border border-line bg-surface p-5 hover:border-brand">
              <h2 className="text-xl font-bold">{article.title}</h2>
              <p className="mt-1 text-sm text-muted">{article.summary}</p>
              <p className="mt-2 text-xs font-semibold text-brand">{article.minutes} min read</p>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
