import Link from 'next/link';
import { Briefcase, Users, Eye, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export async function EmployerDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', userId)
    .single();

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('posted_by', userId);

  const { count: activeJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('posted_by', userId)
    .eq('status', 'active');

  const { count: savedCount } = await supabase
    .from('saved_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', userId);

  const stats = [
    { label: 'Total Jobs', value: jobCount ?? 0, icon: Briefcase, color: 'text-blue-600' },
    { label: 'Active Jobs', value: activeJobs ?? 0, icon: FileText, color: 'text-green-600' },
    { label: 'Saved Candidates', value: savedCount ?? 0, icon: Users, color: 'text-purple-600' },
    { label: 'Total Views', value: 0, icon: Eye, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {company?.name ? `${company.name} Dashboard` : 'Employer Dashboard'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your job postings and find qualified workers.</p>
        </div>
        <Link href="/dashboard/employer/jobs">
          <Button>Post a Job</Button>
        </Link>
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

      {!company && (
        <Card className="border-dashed border-2 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Set up your company profile</h3>
            <p className="mt-2 text-sm text-gray-500">Add your company details to start posting jobs and finding workers.</p>
            <Link href="/dashboard/employer/company" className="mt-4">
              <Button>Create Company Profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
