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
import { createClient } from '@/lib/supabase/client';
import { TRADES, US_STATES } from '@/lib/constants';
import { getFullName, getLocationString } from '@/lib/utils';
import { TRADE_LABELS } from '@/types/database';
import { searchWorkers, type WorkerSearchHit } from '@/lib/worker-search';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [workers, setWorkers] = useState<WorkerSearchHit[]>([]);
  const [trade, setTrade] = useState(searchParams.get('trade') ?? '');
  const [state, setState] = useState(searchParams.get('state') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [certification, setCertification] = useState(searchParams.get('certification') ?? '');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = createClient();
      const { workers: results } = await searchWorkers(supabase, {
        trade,
        state,
        city,
        certification,
        query,
      });
      if (!cancelled) setWorkers(results);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [trade, state, city, certification, query]);

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
                <Input placeholder="Search by name..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={trade} onChange={(e) => setTrade(e.target.value)} options={[{ value: '', label: 'All Trades' }, ...TRADES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))]} />
              <Input placeholder="Certification" value={certification} onChange={(e) => setCertification(e.target.value)} />
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Select value={state} onChange={(e) => setState(e.target.value)} options={[{ value: '', label: 'All States' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
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
                      <Avatar src={worker.avatar_url} firstName={worker.first_name} lastName={worker.last_name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {getFullName(worker.first_name, worker.last_name)}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{worker.headline}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge>{TRADE_LABELS[worker.trade]}</Badge>
                          {worker.is_verified && <Badge variant="verified">Verified</Badge>}
                          {worker.is_featured && <Badge variant="warning">Featured</Badge>}
                          {worker.approved_certifications?.slice(0, 2).map((name) => (
                            <Badge key={name} variant="secondary">{name}</Badge>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {getLocationString(worker.city, worker.state)}
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
