export const TRADES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Welding",
  "Carpentry",
  "Mechanics",
  "Construction",
] as const;

export type Trade = (typeof TRADES)[number];

export const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const;

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "contract", label: "Contract" },
  { value: "part_time", label: "Part time" },
] as const;

export const PAY_UNITS = [
  { value: "hour", label: "per hour" },
  { value: "year", label: "per year" },
  { value: "project", label: "per project" },
] as const;

export const APPLICATION_STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
] as const;

export const DEMO_PASSWORD = "pilot-demo-2026";

export const DEMO_ACCOUNTS = [
  { role: "Worker", email: "jordan.ellis@tradeverified.dev", note: "HVAC, verified" },
  { role: "Employer", email: "marcus.hale@tradeverified.dev", note: "Heartland Mechanical" },
  { role: "Admin", email: "avery.quinn@tradeverified.dev", note: "Verification queue" },
] as const;

export function isTrade(value: string): value is Trade {
  return (TRADES as readonly string[]).includes(value);
}
