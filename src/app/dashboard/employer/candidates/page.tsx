'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getFullName } from '@/lib/utils';
import { TRADE_LABELS } from '@/types/database';
import type { SavedCandidate } from '@/types/database';

export default function SavedCandidatesPage() {
  const [candidates, setCandidates] = useState<SavedCandidate[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('saved_candidates')
        .select('*, tradesperson:tradesperson_profiles(*, profile:profiles(*))')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });
      setCandidates(data ?? []);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Candidates</h1>
      {candidates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-gray-500">
            No saved candidates. <Link href="/dashboard/employer/search" className="text-blue-600 hover:underline">Search workers</Link> to find talent.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Avatar src={c.tradesperson?.profile?.avatar_url} firstName={c.tradesperson?.profile?.first_name} lastName={c.tradesperson?.profile?.last_name} />
                  <div>
                    <Link href={`/profile/${c.tradesperson?.user_id}`} className="font-semibold hover:text-blue-600">
                      {getFullName(c.tradesperson?.profile?.first_name, c.tradesperson?.profile?.last_name)}
                    </Link>
                    <p className="text-sm text-gray-500">{c.tradesperson?.headline}</p>
                    <Badge className="mt-1">{TRADE_LABELS[c.tradesperson?.trade as keyof typeof TRADE_LABELS]}</Badge>
                  </div>
                </div>
                {c.notes && <p className="text-sm text-gray-400 max-w-xs">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
