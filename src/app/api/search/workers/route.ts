import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchWorkers } from '@/lib/worker-search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();
  const { workers, error } = await searchWorkers(supabase, {
    trade: searchParams.get('trade') ?? '',
    state: searchParams.get('state') ?? '',
    city: searchParams.get('city') ?? '',
    certification: searchParams.get('certification') ?? '',
    query: searchParams.get('q') ?? '',
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  return NextResponse.json(workers.slice(0, Number.isFinite(limit) ? limit : 20));
}
