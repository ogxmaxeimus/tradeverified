import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trade = searchParams.get('trade');
  const state = searchParams.get('state');
  const city = searchParams.get('city');
  const certification = searchParams.get('certification');
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const supabase = await createClient();
  let q = supabase
    .from('tradesperson_profiles')
    .select('*, profile:profiles(*), skills:tradesperson_skills(*, skill:skills(*)), certifications:tradesperson_certifications(*, certification:certifications(*))')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (trade) q = q.eq('trade', trade);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let results = data ?? [];

  if (state) {
    results = results.filter((w) => w.profile?.state === state);
  }
  if (city) {
    results = results.filter((w) => w.profile?.city?.toLowerCase().includes(city.toLowerCase()));
  }
  if (certification) {
    results = results.filter((w) =>
      w.certifications?.some((c: { certification?: { name: string }; status: string }) =>
        c.certification?.name.toLowerCase().includes(certification.toLowerCase()) && c.status === 'verified'
      )
    );
  }
  if (query) {
    const lower = query.toLowerCase();
    results = results.filter((w) => {
      const name = `${w.profile?.first_name ?? ''} ${w.profile?.last_name ?? ''}`.toLowerCase();
      return name.includes(lower) || w.headline?.toLowerCase().includes(lower);
    });
  }

  results.sort((a, b) => {
    if (a.profile?.is_featured && !b.profile?.is_featured) return -1;
    if (!a.profile?.is_featured && b.profile?.is_featured) return 1;
    return 0;
  });

  return NextResponse.json(results);
}
