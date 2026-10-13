import { Users, Star, Briefcase, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';

export async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: pendingReviews },
    { count: activeJobs },
    { count: pendingCerts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('tradesperson_certifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const stats = [
    { label: 'Total Users', value: userCount ?? 0, icon: Users, color: 'text-blue-600' },
    { label: 'Pending Reviews', value: pendingReviews ?? 0, icon: Star, color: 'text-yellow-600' },
    { label: 'Active Jobs', value: activeJobs ?? 0, icon: Briefcase, color: 'text-green-600' },
    { label: 'Pending Certifications', value: pendingCerts ?? 0, icon: Award, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Platform overview and moderation queue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
