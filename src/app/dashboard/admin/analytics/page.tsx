'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Star, Award } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({ users: 0, jobs: 0, reviews: 0, certs: 0 });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [users, jobs, reviews, certs] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('tradesperson_certifications').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        users: users.count ?? 0,
        jobs: jobs.count ?? 0,
        reviews: reviews.count ?? 0,
        certs: certs.count ?? 0,
      });
    }
    load();
  }, []);

  const items = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600' },
    { label: 'Total Jobs', value: stats.jobs, icon: Briefcase, color: 'text-green-600' },
    { label: 'Total Reviews', value: stats.reviews, icon: Star, color: 'text-yellow-600' },
    { label: 'Certifications', value: stats.certs, icon: Award, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
