'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { createClient } from '@/lib/supabase/client';
import { TRADES, US_STATES } from '@/lib/constants';
import { getFullName, getLocationString } from '@/lib/utils';
import { TRADE_LABELS } from '@/types/database';
import type { TradespersonProfile } from '@/types/database';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [workers, setWorkers] = useState<TradespersonProfile[]>([]);
  const [trade, setTrade] = useState(searchParams.get('trade') ?? '');
  const [state, setState] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    searchWorkers();
  }, [trade, state]);

  async function searchWorkers() {
    const supabase = createClient();
    let q = supabase
      .from('tradesperson_profiles')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(24);

    if (trade) q = q.eq('trade', trade);

    const { data } = await q;
    let results = (data ?? []) as TradespersonProfile[];

    if (state) {
      results = results.filter((w) => w.profile?.state === state);
    }
    if (query) {
      const lower = query.toLowerCase();
      results = results.filter((w) => {
        const name = getFullName(w.profile?.first_name, w.profile?.last_name).toLowerCase();
        return name.includes(lower) || w.headline?.toLowerCase().includes(lower);
      });
    }

    setWorkers(results);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Find Skilled Workers</h1>
            <p className="mt-2 text-gray-500">Search verified trades professionals by trade, location, and certifications.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchWorkers()} className="pl-10" />
              </div>
              <Select value={trade} onChange={(e) => setTrade(e.target.value)} options={[{ value: '', label: 'All Trades' }, ...TRADES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))]} />
              <Select value={state} onChange={(e) => setState(e.target.value)} options={[{ value: '', label: 'All States' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
              <Button onClick={searchWorkers}>Search</Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => (
              <Link key={worker.id} href={`/profile/${worker.user_id}`}>
                <Card className="hover:shadow-md hover:border-blue-300 transition-all h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar src={worker.profile?.avatar_url} firstName={worker.profile?.first_name} lastName={worker.profile?.last_name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {getFullName(worker.profile?.first_name, worker.profile?.last_name)}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{worker.headline}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge>{TRADE_LABELS[worker.trade]}</Badge>
                          {worker.profile?.is_verified && <Badge variant="verified">Verified</Badge>}
                          {worker.profile?.is_featured && <Badge variant="warning">Featured</Badge>}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {getLocationString(worker.profile?.city, worker.profile?.state)}
                          <span>• {worker.years_experience} yrs</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {workers.length === 0 && (
            <div className="text-center py-16 text-gray-500">No workers found. Try adjusting your filters.</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
