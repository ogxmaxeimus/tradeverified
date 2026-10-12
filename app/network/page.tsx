"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Pager } from "@/components/Pager";
import { ProCard } from "@/components/ProCard";
import { Shell } from "@/components/Shell";
import { inputClass, useTitle } from "@/components/ui";
import { filterProfessionals, paginate, tradeCounts, type ProSort } from "@/lib/search";
import { useStore } from "@/lib/store";
import { TRADES } from "@/lib/types";

export default function NetworkPage() {
  return (
    <Suspense fallback={<Shell><p className="p-10 text-muted">Loading the network…</p></Shell>}>
      <NetworkInner />
    </Suspense>
  );
}

function NetworkInner() {
  useTitle("Find a pro");
  const router = useRouter();
  const params = useSearchParams();
  const { state } = useStore();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [trades, setTrades] = useState<string[]>(params.get("trade") ? [params.get("trade") as string] : []);
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [licensed, setLicensed] = useState(false);
  const [insured, setInsured] = useState(false);
  const [backgroundChecked, setBackgroundChecked] = useState(false);
  const [osha, setOsha] = useState(false);
  const [minYears, setMinYears] = useState(0);
  const [sort, setSort] = useState<ProSort>("rating");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const tradeParam = params.get("trade") ?? "";
  const qParam = params.get("q") ?? "";
  const locationParam = params.get("location") ?? "";

  useEffect(() => {
    setQ(qParam);
    setTrades(tradeParam ? [tradeParam] : []);
    setLocation(locationParam);
  }, [tradeParam, qParam, locationParam]);

  const results = useMemo(
    () =>
      filterProfessionals(state.professionals, {
        q,
        trades,
        location,
        licensed,
        insured,
        backgroundChecked,
        osha,
        minYears,
        sort,
      }),
    [state.professionals, q, trades, location, licensed, insured, backgroundChecked, osha, minYears, sort],
  );

  useEffect(() => {
    setPage(1);
  }, [q, trades, location, licensed, insured, backgroundChecked, osha, minYears, sort]);

  const paged = paginate(results, page, 8);
  const counts = tradeCounts(state.professionals);

  function toggleTrade(trade: string) {
    setTrades((current) => (current.includes(trade) ? current.filter((item) => item !== trade) : [...current, trade]));
  }

  function clear() {
    setQ("");
    setTrades([]);
    setLocation("");
    setLicensed(false);
    setInsured(false);
    setBackgroundChecked(false);
    setOsha(false);
    setMinYears(0);
    setSort("rating");
    router.replace("/network");
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <div className="lg:hidden">
          <button className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold" onClick={() => setFiltersOpen((value) => !value)}>
            <SlidersHorizontal className="h-4 w-4" /> {filtersOpen ? "Hide filters" : "Filters"}
          </button>
        </div>
        <aside className={`w-full shrink-0 lg:w-72 ${filtersOpen ? "block" : "hidden lg:block"}`}>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Filters</h2>
              <button className="text-sm font-semibold text-brand" onClick={clear}>Clear all</button>
            </div>
            <label className="mt-4 block text-sm font-semibold">
              Search
              <input className={`${inputClass} mt-1`} value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, skill, ticket" />
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Trade</legend>
              <div className="mt-2 space-y-1.5">
                {TRADES.map((trade) => (
                  <label key={trade} className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={trades.includes(trade)} onChange={() => toggleTrade(trade)} />
                      {trade}
                    </span>
                    <span className="text-muted">{counts.get(trade) ?? 0}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 block text-sm font-semibold">
              Location
              <input className={`${inputClass} mt-1`} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or region" />
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Credentials</legend>
              <div className="mt-2 space-y-1.5 text-sm">
                <Check label="Licensed" checked={licensed} onChange={setLicensed} count={state.professionals.filter((pro) => pro.licensed).length} />
                <Check label="Insured" checked={insured} onChange={setInsured} count={state.professionals.filter((pro) => pro.insured).length} />
                <Check label="Background checked" checked={backgroundChecked} onChange={setBackgroundChecked} count={state.professionals.filter((pro) => pro.backgroundChecked).length} />
                <Check label="OSHA" checked={osha} onChange={setOsha} count={state.professionals.filter((pro) => pro.osha).length} />
              </div>
            </fieldset>
            <label className="mt-4 block text-sm font-semibold">
              At least {minYears} years
              <input className="mt-2 w-full" type="range" min={0} max={30} value={minYears} onChange={(event) => setMinYears(Number(event.target.value))} />
            </label>
            <p className="mt-4 text-sm text-muted">{results.length} result{results.length === 1 ? "" : "s"}</p>
          </div>
        </aside>
        <section className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{results.length} verified professionals</h1>
              <p className="text-sm text-muted">{location ? `Matching ${location}` : "Across every city in the workspace"}</p>
            </div>
            <label className="text-sm">
              <span className="sr-only">Sort</span>
              <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value as ProSort)}>
                <option value="rating">Highest rated</option>
                <option value="reviews">Most reviews</option>
                <option value="experience">Most experience</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
          {paged.items.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">No one matches those filters. Clear one and try again.</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paged.items.map((pro) => <ProCard key={pro.id} pro={pro} />)}
            </div>
          )}
          <Pager page={paged.current} pages={paged.pages} onPage={setPage} />
        </section>
      </div>
    </Shell>
  );
}

function Check({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: (value: boolean) => void; count: number }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        {label}
      </span>
      <span className="text-muted">{count}</span>
    </label>
  );
}
