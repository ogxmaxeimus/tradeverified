import type { SupabaseClient } from "@supabase/supabase-js";
import type { TradeType } from "@/types/database";

export interface WorkerSearchHit {
  id: string;
  user_id: string;
  trade: TradeType;
  years_experience: number;
  hourly_rate: number | null;
  availability: string;
  headline: string | null;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_featured: boolean;
  bio: string | null;
  approved_certifications: string[] | null;
}

export async function searchWorkers(
  supabase: SupabaseClient,
  filters: {
    trade?: string;
    certification?: string;
    city?: string;
    state?: string;
    query?: string;
  },
) {
  const { data, error } = await supabase.rpc("search_workers", {
    trade_filter: filters.trade || null,
    certification_filter: filters.certification || null,
    city_filter: filters.city || null,
    state_filter: filters.state || null,
  });

  if (error) {
    return { workers: [] as WorkerSearchHit[], error: error.message };
  }

  let workers = (data ?? []) as WorkerSearchHit[];
  if (filters.query) {
    const lower = filters.query.toLowerCase();
    workers = workers.filter((worker) => {
      const name = `${worker.first_name ?? ""} ${worker.last_name ?? ""}`.toLowerCase();
      return name.includes(lower) || (worker.headline ?? "").toLowerCase().includes(lower);
    });
  }

  return { workers, error: null };
}
