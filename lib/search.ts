import { ratingOf } from "./format";
import type { Job, Professional, Trade } from "./types";

export type ProSort = "rating" | "reviews" | "experience" | "name";

export type ProQuery = {
  q?: string;
  trades?: string[];
  location?: string;
  licensed?: boolean;
  insured?: boolean;
  backgroundChecked?: boolean;
  osha?: boolean;
  minYears?: number;
  maxYears?: number;
  sort?: ProSort;
};

export type JobQuery = {
  q?: string;
  trade?: string;
  location?: string;
  type?: string;
};

function haystack(pro: Professional) {
  return [
    pro.name,
    pro.trade,
    pro.title,
    pro.city,
    pro.region,
    pro.about,
    pro.rate,
    ...pro.skills,
    ...pro.credentials.map((item) => `${item.name} ${item.issuer}`),
  ]
    .join(" ")
    .toLowerCase();
}

export function filterProfessionals(pros: Professional[], query: ProQuery) {
  const q = query.q?.trim().toLowerCase() ?? "";
  const min = query.minYears ?? 0;
  const max = query.maxYears ?? 40;
  const trades = (query.trades ?? []).filter(Boolean);
  const location = query.location?.trim().toLowerCase() ?? "";

  const list = pros.filter((pro) => {
    if (pro.years < min || pro.years > max) return false;
    if (trades.length && !trades.includes(pro.trade)) return false;
    if (location && !`${pro.city} ${pro.region}`.toLowerCase().includes(location)) return false;
    if (query.licensed && !pro.licensed) return false;
    if (query.insured && !pro.insured) return false;
    if (query.backgroundChecked && !pro.backgroundChecked) return false;
    if (query.osha && !pro.osha) return false;
    if (q && !haystack(pro).includes(q)) return false;
    return true;
  });

  return [...list].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (query.sort === "name") return a.name.localeCompare(b.name);
    if (query.sort === "experience") return b.years - a.years || a.name.localeCompare(b.name);
    if (query.sort === "reviews") {
      return ratingOf(b.reviews).count - ratingOf(a.reviews).count || a.name.localeCompare(b.name);
    }
    const left = ratingOf(a.reviews);
    const right = ratingOf(b.reviews);
    return right.rating - left.rating || right.count - left.count || a.name.localeCompare(b.name);
  });
}

export function filterJobs(jobs: Job[], query: JobQuery) {
  const q = query.q?.trim().toLowerCase() ?? "";
  const location = query.location?.trim().toLowerCase() ?? "";
  return jobs
    .filter((job) => {
      if (query.trade && job.trade !== query.trade) return false;
      if (query.type && job.type !== query.type) return false;
      if (location && !`${job.city} ${job.region}`.toLowerCase().includes(location)) return false;
      if (q) {
        const blob = `${job.title} ${job.trade} ${job.city} ${job.region} ${job.description} ${job.requirements.join(" ")}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function paginate<T>(items: T[], page: number, perPage = 8) {
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * perPage;
  return { items: items.slice(start, start + perPage), pages, current, total: items.length };
}

export function tradeCounts(pros: Professional[]) {
  const counts = new Map<Trade, number>();
  for (const pro of pros) counts.set(pro.trade, (counts.get(pro.trade) ?? 0) + 1);
  return counts;
}
