import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trade = searchParams.get('trade');
  const state = searchParams.get('state');
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') ?? '30');

  const supabase = await createClient();
  let q = supabase
    .from('jobs')
    .select('*, company:companies(name, logo_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (trade) q = q.eq('trade', trade);
  if (state) q = q.eq('state', state);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let results = data ?? [];
  if (query) {
    const lower = query.toLowerCase();
    results = results.filter((j) =>
      j.title.toLowerCase().includes(lower) || j.description.toLowerCase().includes(lower)
    );
  }

  return NextResponse.json(results);
}
