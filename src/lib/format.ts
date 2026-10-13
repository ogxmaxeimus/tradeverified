const EMPLOYMENT: Record<string, string> = {
  full_time: "Full time",
  contract: "Contract",
  part_time: "Part time",
};

const PAY_UNIT: Record<string, string> = {
  hour: "hour",
  year: "year",
  project: "project",
};

export function location(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(", ");
}

export function money(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return null;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
}

export function payRange(
  min: number | string | null,
  max: number | string | null,
  unit: string | null,
) {
  const low = money(min);
  const high = money(max);
  const suffix = unit ? ` / ${PAY_UNIT[unit] ?? unit}` : "";
  if (low && high) return `${low}–${high}${suffix}`;
  if (low) return `${low}+${suffix}`;
  if (high) return `Up to ${high}${suffix}`;
  return "Pay not listed";
}

export function employmentLabel(value: string) {
  return EMPLOYMENT[value] ?? value;
}

export function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }
  return value;
}

export function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optional(value: string) {
  return value.length > 0 ? value : null;
}

export function dbMessage(error: { message: string; code?: string }) {
  if (error.code === "23505") return "That record already exists.";
  return error.message;
}

export function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
