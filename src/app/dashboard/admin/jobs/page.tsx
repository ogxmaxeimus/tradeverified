'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TRADE_LABELS } from '@/types/database';
import { formatCurrency, formatDate, getLocationString } from '@/lib/utils';
import type { Job } from '@/types/database';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('jobs').select('*, company:companies(name)').order('created_at', { ascending: false }).limit(50);
      setJobs(data ?? []);
    }
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from('jobs').update({ status }).eq('id', id);
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: status as Job['status'] } : j));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Job Postings</h1>
      <div className="space-y-3">
        {jobs.map((job) => {
          const isOpen = expandedId === job.id;
          return (
            <Card key={job.id}>
              <CardContent className="p-0">
                <button
                  onClick={() => setExpandedId(isOpen ? null : job.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-500">
                        {job.company?.name} • {TRADE_LABELS[job.trade]} • {job.applications_count} applications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>{job.status}</Badge>
                    {job.status === 'active' && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); updateStatus(job.id, 'closed'); }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Close
                      </span>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <Detail label="Job Type" value={job.job_type} />
                      <Detail label="Location" value={job.is_remote ? 'Remote' : getLocationString(job.city, job.state)} />
                      <Detail
                        label="Salary"
                        value={job.salary_min ? `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max ?? job.salary_min)}` : '—'}
                      />
                      <Detail
                        label="Hourly Rate"
                        value={job.hourly_rate_min ? `${formatCurrency(job.hourly_rate_min)} - ${formatCurrency(job.hourly_rate_max ?? job.hourly_rate_min)}/hr` : '—'}
                      />
                      <Detail label="Required Experience" value={`${job.required_experience} years`} />
                      <Detail label="Posted" value={formatDate(job.created_at)} />
                    </div>
                    {job.description && (
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-400">Description</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{job.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {job.status === 'active' ? (
                        <button onClick={() => updateStatus(job.id, 'closed')} className="text-sm text-red-600 hover:underline">Close posting</button>
                      ) : (
                        <button onClick={() => updateStatus(job.id, 'active')} className="text-sm text-green-600 hover:underline">Reactivate posting</button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {jobs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-gray-500">No job postings yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
      <p className="mt-0.5 text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  );
}
