'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TRADES, US_STATES } from '@/lib/constants';
import { getFullName, getLocationString } from '@/lib/utils';
import { TRADE_LABELS } from '@/types/database';
import { searchWorkers, type WorkerSearchHit } from '@/lib/worker-search';

export default function WorkerSearchPage() {
  const [workers, setWorkers] = useState<WorkerSearchHit[]>([]);
  const [trade, setTrade] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [certification, setCertification] = useState('');
  const [query, setQuery] = useState('');

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

  async function saveCandidate(tradespersonId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('saved_candidates').upsert({ employer_id: user.id, tradesperson_id: tradespersonId });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Workers</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or headline..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={trade} onChange={(e) => setTrade(e.target.value)} options={[{ value: '', label: 'All Trades' }, ...TRADES.map((t) => ({ value: t.value, label: t.label }))]} />
        <Input placeholder="Certification" value={certification} onChange={(e) => setCertification(e.target.value)} />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select value={state} onChange={(e) => setState(e.target.value)} options={[{ value: '', label: 'All States' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {workers.map((worker) => (
          <Card key={worker.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar src={worker.avatar_url} firstName={worker.first_name} lastName={worker.last_name} size="lg" />
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${worker.user_id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600">
                    {getFullName(worker.first_name, worker.last_name)}
                  </Link>
                  <p className="text-sm text-gray-500">{worker.headline}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{TRADE_LABELS[worker.trade]}</Badge>
                    {worker.is_verified && <Badge variant="verified">Verified</Badge>}
                    {worker.approved_certifications?.slice(0, 2).map((name) => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{getLocationString(worker.city, worker.state)}</span>
                    <span>{worker.years_experience} yrs exp</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => saveCandidate(worker.id)}>Save</Button>
                <Link href={`/profile/${worker.user_id}`}><Button size="sm">View Profile</Button></Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
