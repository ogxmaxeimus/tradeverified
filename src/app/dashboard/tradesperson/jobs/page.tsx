'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TRADE_LABELS } from '@/types/database';
import type { JobApplication } from '@/types/database';
import { formatDate } from '@/lib/utils';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: tp } = await supabase.from('tradesperson_profiles').select('id').eq('user_id', user.id).single();
      if (!tp) return;

      const { data } = await supabase
        .from('job_applications')
        .select('*, job:jobs(*, company:companies(name))')
        .eq('tradesperson_id', tp.id)
        .order('created_at', { ascending: false });
      setApplications(data ?? []);
    }
    load();
  }, []);

  const statusColors: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
    pending: 'warning',
    reviewed: 'default',
    interviewing: 'default',
    offered: 'success',
    accepted: 'success',
    rejected: 'destructive',
    withdrawn: 'secondary',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-gray-500">
            No applications yet. <a href="/jobs" className="text-blue-600 hover:underline">Browse jobs</a> to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{app.job?.title}</h3>
                  <p className="text-sm text-gray-500">
                    {app.job?.company?.name} • {TRADE_LABELS[app.job?.trade as keyof typeof TRADE_LABELS]} • Applied {formatDate(app.created_at)}
                  </p>
                </div>
                <Badge variant={statusColors[app.status] ?? 'secondary'}>{app.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
