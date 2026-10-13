import Link from 'next/link';
import { Eye, Briefcase, Star, Award, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export async function TradespersonDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: tradesperson } = await supabase
    .from('tradesperson_profiles')
    .select('*, profile:profiles(*)')
    .eq('user_id', userId)
    .single();

  const { count: applicationCount } = await supabase
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('tradesperson_id', tradesperson?.id ?? '');

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('tradesperson_id', tradesperson?.id ?? '')
    .eq('status', 'approved');

  const { count: certCount } = await supabase
    .from('tradesperson_certifications')
    .select('*', { count: 'exact', head: true })
    .eq('tradesperson_id', tradesperson?.id ?? '');

  const profile = tradesperson?.profile;
  const profileIncomplete = !profile?.first_name || !tradesperson?.trade;

  const stats = [
    { label: 'Profile Views', value: profile?.profile_views ?? 0, icon: Eye, color: 'text-blue-600' },
    { label: 'Applications', value: applicationCount ?? 0, icon: Briefcase, color: 'text-green-600' },
    { label: 'Reviews', value: reviewCount ?? 0, icon: Star, color: 'text-yellow-600' },
    { label: 'Certifications', value: certCount ?? 0, icon: Award, color: 'text-purple-600' },
  ];

  const completionSteps = [
    { label: 'Complete profile', done: !!(profile?.first_name && profile?.bio), href: '/dashboard/tradesperson/profile' },
    { label: 'Add work history', done: false, href: '/dashboard/tradesperson/profile' },
    { label: 'Upload certifications', done: (certCount ?? 0) > 0, href: '/dashboard/tradesperson/certifications' },
    { label: 'Add portfolio photos', done: false, href: '/dashboard/tradesperson/portfolio' },
    { label: 'Apply for jobs', done: (applicationCount ?? 0) > 0, href: '/jobs' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Here&apos;s an overview of your profile activity.</p>
      </div>

      {profileIncomplete && (
        <Card className="border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create your tradesperson profile</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add your trade, location, and bio so employers can find you.
              </p>
            </div>
            <Link href="/dashboard/tradesperson/profile">
              <Button size="lg" className="w-full sm:w-auto">Set up profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completionSteps.map((step) => (
              <Link key={step.label} href={step.href} className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${step.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {step.done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upgrade to Pro</CardTitle>
            <Badge variant="verified">$19/mo</Badge>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <li>✓ Unlimited portfolio uploads</li>
              <li>✓ Featured profile placement</li>
              <li>✓ Verification badge</li>
              <li>✓ Profile analytics</li>
            </ul>
            <Link href="/pricing">
              <Button className="w-full">Upgrade Now</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
