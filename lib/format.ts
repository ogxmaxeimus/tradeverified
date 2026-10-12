import type { Professional, Review } from "./types";

export function place(p: { city: string; region: string }) {
  return `${p.city}, ${p.region}`;
}

export function ratingOf(reviews: Review[]) {
  if (!reviews.length) return { rating: 0, count: 0 };
  const raw = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return { rating: Math.round(raw * 10) / 10, count: reviews.length };
}

export function parseDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  return new Date(iso);
}

export function formatDate(iso: string) {
  return parseDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(iso: string, now = Date.now()) {
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export function withinDays(iso: string, days: number, now = Date.now()) {
  return now - new Date(iso).getTime() <= days * 86400000;
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "profile";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function hue(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export function credentialTone(expires: string, status: "pending" | "verified", now = Date.now()) {
  if (status === "pending") return "pending" as const;
  if (parseDate(expires).getTime() < now) return "expired" as const;
  return "verified" as const;
}

export function averageRating(pros: Professional[]) {
  const reviews = pros.flatMap((pro) => pro.reviews);
  return ratingOf(reviews);
}

export function satisfaction(pros: Professional[]) {
  const reviews = pros.flatMap((pro) => pro.reviews);
  if (!reviews.length) return 0;
  const happy = reviews.filter((review) => review.rating >= 4).length;
  return Math.round((happy / reviews.length) * 100);
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
