"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowRight, BadgeCheck, Briefcase, Search, ShieldCheck, Star, Users } from "lucide-react";
import { Shell } from "@/components/Shell";
import { PricingTable } from "@/components/PricingTable";
import { Avatar, Stars, useTitle } from "@/components/ui";
import { averageRating, place, ratingOf, satisfaction } from "@/lib/format";
import { useStore } from "@/lib/store";
import { TRADES } from "@/lib/types";

const TRADE_BLURB: Record<string, string> = {
  HVAC: "Heat pumps, rooftops, and the install photos that prove them.",
  Plumbing: "Licensed plumbers with the ticket and the leak story.",
  Electrical: "Journeymen and masters, panels through punch lists.",
  Welding: "Current tickets, coupons, and the work that passed visual.",
  Carpentry: "Finish, framing, and the houses they actually built.",
  Mechanics: "Diesel, fleet, and the fault code written next to the fix.",
  Pipefitting: "Mechanical rooms and shutdown windows that do not move.",
  Construction: "Crews a GC can put on a job without guessing.",
};

export default function HomePage() {
  useTitle("TradeVerified");
  const router = useRouter();
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const stats = averageRating(state.professionals);
  const featured = [...state.professionals].sort((a, b) => ratingOf(b.reviews).rating - ratingOf(a.reviews).rating)[0];

  return (
    <Shell>
      <section className="hero-grid bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <ShieldCheck className="h-4 w-4" /> Licenses, work, and reviews in one profile
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              The verified network for <span className="text-blue-200">skilled trades</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-blue-100">
              Build a profile a shop can trust. Search crews by ticket and city. Hire from the work, not from a resume that hides a lapsed license.
            </p>
            <form
              className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                router.push(query.trim() ? `/network?q=${encodeURIComponent(query.trim())}` : "/network");
              }}
            >
              <label className="relative flex-1">
                <span className="sr-only">Search</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try HVAC in Austin, or welder"
                  className="w-full rounded-xl bg-white py-3 pl-10 pr-3 text-slate-900 outline-none"
                />
              </label>
              <button className="rounded-xl bg-brand px-5 py-3 font-semibold">Search</button>
            </form>
            <div className="mt-6 flex items-center gap-3 text-sm text-blue-100">
              <span className="flex -space-x-2">
                {state.professionals.slice(0, 4).map((pro) => (
                  <Avatar key={pro.id} name={pro.name} size={32} className="ring-2 ring-navy" />
                ))}
              </span>
              {state.professionals.length} verified profiles in this workspace
            </div>
          </div>
          {featured ? (
            <Link href={`/professionals/${featured.slug}`} className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl">
              <div className="flex items-center gap-4">
                <Avatar name={featured.name} size={72} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">Featured profile</p>
                  <p className="text-xl font-bold">{featured.name}</p>
                  <p className="text-sm text-slate-500">{featured.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{place(featured)}</p>
                </div>
              </div>
              <div className="mt-4"><Stars value={ratingOf(featured.reviews).rating} count={ratingOf(featured.reviews).count} /></div>
              <div className="mt-4 grid gap-2">
                {featured.credentials.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span>
                      <span className="block font-semibold">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.source}</span>
                    </span>
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold text-brand">Open profile <ArrowRight className="inline h-4 w-4" /></p>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          <Stat value={String(state.professionals.length)} label="Trades profiles" />
          <Stat value={String(state.jobs.length)} label="Open jobs" />
          <Stat value={stats.rating.toFixed(1)} label="Average rating" />
          <Stat value={`${satisfaction(state.professionals)}%`} label="Reviews at 4 stars or better" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Every trade, one network</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted">Start with the craft. Filter down to the license, the city, and the years on the tools.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRADES.map((trade) => (
            <Link key={trade} href={`/network?trade=${encodeURIComponent(trade)}`} className="rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand">
              <p className="font-bold">{trade}</p>
              <p className="mt-1 text-sm text-muted">{TRADE_BLURB[trade]}</p>
              <p className="mt-3 text-sm font-semibold text-brand">Explore {trade} <ArrowRight className="inline h-3.5 w-3.5" /></p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">For tradespeople</p>
          <h2 className="mt-2 text-2xl font-extrabold">Your license and your work, where a shop can see both</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Free to join, apply, and be found.</li>
            <li>Credentials show the source, the reference, and the expiration.</li>
            <li>Portfolio projects and reviews tied to a job number.</li>
          </ul>
          <Link href="/signup?role=worker" className="mt-6 inline-flex rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white">Create a free profile</Link>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">For employers</p>
          <h2 className="mt-2 text-2xl font-extrabold">Hire the person who can stand on the job tomorrow</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Search by trade, city, ticket, and years.</li>
            <li>Post a role and move applicants from new to hired.</li>
            <li>Message from the profile instead of a spreadsheet.</li>
          </ul>
          <Link href="/signup?role=employer" className="mt-6 inline-flex rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white">Start hiring</Link>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-2">
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Verification you can read" body="Every badge names how it was checked. Expired tickets stay visible. A number typed into a form is not the same as a record." />
          <Feature icon={<Star className="h-5 w-5" />} title="Reviews with a receipt" body="A review asks for a proof reference. Invoice, permit, or job number. Stars without a job behind them do not make the profile." />
          <Feature icon={<Briefcase className="h-5 w-5" />} title="Jobs with a status the worker can see" body="Apply with a note. The shop marks new, in review, shortlisted, hired, or not selected. You are not left guessing." />
          <Feature icon={<Users className="h-5 w-5" />} title="A network that knows the trades" body="Groups for HVAC, electrical, plumbing, and welding. Resources on portfolios, licenses, and how to read a candidate." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16" id="pricing">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Simple, worker-first pricing</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted">Finding work stays free. Pro is for visibility. Employers pay to hire.</p>
        <div className="mt-8"><PricingTable /></div>
      </section>

      <section className="bg-brand py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Put the proof on the profile</h2>
          <p className="mt-3 text-blue-100">Open the sample shop or the sample HVAC tech, or make your own account. Everything you do is saved in this browser.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand">Try a sample account</Link>
            <Link href="/network" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold">Browse the network</Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-extrabold text-brand">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-brand">{icon}</span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
    </article>
  );
}
