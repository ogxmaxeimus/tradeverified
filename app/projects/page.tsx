"use client";

import Link from "next/link";
import { Shell } from "@/components/Shell";
import { WorkArt } from "@/components/WorkArt";
import { useTitle } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ProjectsPage() {
  useTitle("Projects");
  const { state } = useStore();
  const items = state.professionals.flatMap((pro) => pro.portfolio.map((item) => ({ item, pro })));

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Project gallery</h1>
        <p className="mt-1 max-w-2xl text-muted">Work pulled from trades profiles. Open a project to see the license and the reviews behind it.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ item, pro }) => (
            <Link key={item.id} href={`/professionals/${pro.slug}`} className="rounded-2xl border border-line bg-surface p-3 hover:border-brand">
              <WorkArt title={item.title} trade={pro.trade} image={item.image} label="After" />
              <h2 className="mt-3 font-bold">{item.title}</h2>
              <p className="text-sm text-muted">{item.location} · {pro.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
