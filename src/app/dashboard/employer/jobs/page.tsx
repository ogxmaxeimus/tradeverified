'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TRADES, JOB_TYPES, US_STATES } from '@/lib/constants';
import { TRADE_LABELS } from '@/types/database';
import type { Job } from '@/types/database';

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).single();
      if (!company) return;
      setCompanyId(company.id);
      const { data } = await supabase.from('jobs').select('*').eq('posted_by', user.id).order('created_at', { ascending: false });
      setJobs(data ?? []);
    }
    load();
  }, []);

  async function handlePost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('jobs').insert({
      company_id: companyId,
      posted_by: user.id,
      title: form.get('title') as string,
      description: form.get('description') as string,
      trade: form.get('trade') as string,
      job_type: form.get('job_type') as string,
      salary_min: parseFloat(form.get('salary_min') as string) || null,
      salary_max: parseFloat(form.get('salary_max') as string) || null,
      city: form.get('city') as string,
      state: form.get('state') as string,
      required_experience: parseInt(form.get('required_experience') as string) || 0,
      status: 'active',
    }).select().single();

    if (data) setJobs((prev) => [data, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Postings</h1>
        <Button onClick={() => setShowForm(!showForm)} disabled={!companyId}>
          <Plus className="h-4 w-4" /> Post Job
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Post a New Job</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePost} className="space-y-4">
              <Input id="title" name="title" label="Job Title" required />
              <Textarea id="description" name="description" label="Description" rows={5} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select id="trade" name="trade" label="Trade" required options={[{ value: '', label: 'Select' }, ...TRADES.map((t) => ({ value: t.value, label: t.label }))]} />
                <Select id="job_type" name="job_type" label="Job Type" options={JOB_TYPES.map((t) => ({ value: t, label: t }))} />
                <Input id="salary_min" name="salary_min" label="Salary Min ($)" type="number" />
                <Input id="salary_max" name="salary_max" label="Salary Max ($)" type="number" />
                <Input id="city" name="city" label="City" />
                <Select id="state" name="state" label="State" options={[{ value: '', label: 'Select' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
                <Input id="required_experience" name="required_experience" label="Required Experience (years)" type="number" />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Publish Job</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                <p className="text-sm text-gray-500">
                  {TRADE_LABELS[job.trade]} • {job.city}, {job.state} • {job.applications_count} applications
                </p>
              </div>
              <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>{job.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {jobs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-gray-500">No jobs posted yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
