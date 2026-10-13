'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import type { ApplicationStatus, Job } from '@/types/database';

interface Applicant {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  tradesperson: {
    user_id: string;
    profile: { first_name: string | null; last_name: string | null } | null;
  } | null;
}

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'pending', 'reviewed', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn',
];

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
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
      const nextJobs = data ?? [];
      setJobs(nextJobs);
      if (nextJobs.length === 0) {
        setApplicants([]);
        return;
      }
      const { data: apps } = await supabase
        .from('job_applications')
        .select('id, job_id, status, cover_letter, tradesperson:tradesperson_profiles(user_id, profile:profiles(first_name, last_name))')
        .in('job_id', nextJobs.map((job) => job.id));
      setApplicants((apps ?? []) as unknown as Applicant[]);
    }
    load();
  }, []);

  async function updateApplication(id: string, status: ApplicationStatus) {
    const supabase = createClient();
    const { error } = await supabase.from('job_applications').update({ status }).eq('id', id);
    if (!error) {
      setApplicants((prev) => prev.map((applicant) => applicant.id === id ? { ...applicant, status } : applicant));
    }
  }

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
        {jobs.map((job) => {
          const jobApplicants = applicants.filter((applicant) => applicant.job_id === job.id);
          return (
          <Card key={job.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                  <p className="text-sm text-gray-500">
                    {TRADE_LABELS[job.trade]} • {job.city}, {job.state} • {jobApplicants.length} applications
                  </p>
                </div>
                <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>{job.status}</Badge>
              </div>
              {jobApplicants.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  {jobApplicants.map((applicant) => (
                    <div key={applicant.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link href={`/profile/${applicant.tradesperson?.user_id}`} className="font-medium text-blue-600 hover:underline">
                          {applicant.tradesperson?.profile?.first_name} {applicant.tradesperson?.profile?.last_name}
                        </Link>
                        {applicant.cover_letter && <p className="text-sm text-gray-500">{applicant.cover_letter}</p>}
                      </div>
                      <Select
                        value={applicant.status}
                        onChange={(e) => updateApplication(applicant.id, e.target.value as ApplicationStatus)}
                        options={APPLICATION_STATUSES.map((status) => ({ value: status, label: status }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
        {jobs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-gray-500">No jobs posted yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
