'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [profileViews, setProfileViews] = useState(0);
  const [recentViews, setRecentViews] = useState<{ created_at: string }[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('profile_views').eq('id', user.id).single();
      setProfileViews(profile?.profile_views ?? 0);

      const { data: views } = await supabase
        .from('profile_views')
        .select('created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setRecentViews(views ?? []);
    }
    load();
  }, []);

  const last7Days = recentViews.filter((v) => {
    const d = new Date(v.created_at);
    const week = new Date();
    week.setDate(week.getDate() - 7);
    return d >= week;
  }).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profileViews}</p>
              <p className="text-sm text-gray-500">Total Profile Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{last7Days}</p>
              <p className="text-sm text-gray-500">Views Last 7 Days</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentViews.length === 0 ? (
            <p className="text-gray-500 text-sm">No profile views yet. Complete your profile to start getting noticed.</p>
          ) : (
            <div className="space-y-2">
              {recentViews.slice(0, 10).map((view, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-gray-600 dark:text-gray-400">Profile viewed</span>
                  <span className="text-gray-400">{new Date(view.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
