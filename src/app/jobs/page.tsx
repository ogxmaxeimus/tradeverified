'use client';

import { useEffect, useState } from 'react';
import { Search, MapPin, Bookmark, X } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { TRADES, US_STATES } from '@/lib/constants';
import { TRADE_LABELS } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Job } from '@/types/database';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trade, setTrade] = useState('');
  const [state, setState] = useState('');
  const [query, setQuery] = useState('');
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  useEffect(() => { loadJobs(); }, [trade, state]);

  async function loadJobs() {
    const supabase = createClient();
    let q = supabase.from('jobs').select('*, company:companies(name, logo_url)').eq('status', 'active').order('created_at', { ascending: false }).limit(30);
    if (trade) q = q.eq('trade', trade);
    if (state) q = q.eq('state', state);
    const { data } = await q;
    let results = data ?? [];
    if (query) {
      const lower = query.toLowerCase();
      results = results.filter((j: Job) => j.title.toLowerCase().includes(lower) || j.description.toLowerCase().includes(lower));
    }
    setJobs(results);
  }

  async function openApply(job: Job) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login?redirect=/jobs'; return; }
    setApplyError('');
    setCoverLetter('');
    setApplyJob(job);
  }

  async function submitApplication() {
    if (!applyJob) return;
    setSubmitting(true);
    setApplyError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: applyJob.id, cover_letter: coverLetter }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setApplyError(error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      setAppliedIds((prev) => [...prev, applyJob.id]);
      setApplyJob(null);
    } catch {
      setApplyError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  async function handleSave(jobId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login?redirect=/jobs'; return; }
    await supabase.from('saved_jobs').upsert({ user_id: user.id, job_id: jobId });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Board</h1>
            <p className="mt-2 text-gray-500">Find your next opportunity in the skilled trades.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search jobs..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadJobs()} className="pl-10" />
              </div>
              <Select value={trade} onChange={(e) => setTrade(e.target.value)} options={[{ value: '', label: 'All Trades' }, ...TRADES.map((t) => ({ value: t.value, label: t.label }))]} />
              <Select value={state} onChange={(e) => setState(e.target.value)} options={[{ value: '', label: 'All States' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
              <Button onClick={loadJobs}>Search</Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company?.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{TRADE_LABELS[job.trade]}</Badge>
                      <Badge variant="secondary">{job.job_type}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.city}, {job.state}</span>
                      {job.salary_min && <span>{formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max ?? 0)}</span>}
                      <span>Posted {formatDate(job.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" onClick={() => openApply(job)} disabled={appliedIds.includes(job.id)}>
                      {appliedIds.includes(job.id) ? 'Applied' : 'Apply'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSave(job.id)}>
                      <Bookmark className="h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {jobs.length === 0 && (
            <div className="text-center py-16 text-gray-500">No jobs found. Check back soon!</div>
          )}
        </div>
      </main>
      <Footer />

      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setApplyJob(null)} />
          <Card className="relative w-full max-w-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apply to {applyJob.title}</h2>
                  <p className="text-sm text-gray-500">{applyJob.company?.name}</p>
                </div>
                <button onClick={() => setApplyJob(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <Textarea
                  id="cover_letter"
                  label="Cover letter (optional)"
                  rows={6}
                  placeholder="Introduce yourself, highlight relevant experience, and explain why you're a great fit..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Your profile and cover letter will be sent to {applyJob.company?.name ?? 'the employer'} and saved to your applications.
              </p>

              {applyError && <p className="mt-3 text-sm text-red-500">{applyError}</p>}

              <div className="mt-5 flex gap-2">
                <Button onClick={submitApplication} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button variant="outline" onClick={() => setApplyJob(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
