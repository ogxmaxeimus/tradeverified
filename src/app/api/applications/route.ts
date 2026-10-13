import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, jobApplicationEmail } from '@/lib/email';
import { TRADE_LABELS } from '@/types/database';
import { getFullName } from '@/lib/utils';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { job_id, cover_letter } = await request.json();

  const { data: tp } = await supabase
    .from('tradesperson_profiles')
    .select('id, trade, profile:profiles(first_name, last_name, email)')
    .eq('user_id', user.id)
    .single();

  if (!tp) {
    return NextResponse.json({ error: 'Tradesperson profile required' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_id', job_id)
    .eq('tradesperson_id', tp.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already applied to this job.' }, { status: 409 });
  }

  const { data, error } = await supabase.from('job_applications').insert({
    job_id,
    tradesperson_id: tp.id,
    cover_letter,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.rpc('increment_applications_count', { job_id });

  // Notify the company by email (best-effort; won't fail the request).
  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('title, company:companies(name, email)')
      .eq('id', job_id)
      .single();

    const company = job?.company as { name?: string; email?: string } | null;
    if (job && company?.email) {
      const profile = tp.profile as { first_name?: string; last_name?: string; email?: string } | null;
      const applicantName = getFullName(profile?.first_name, profile?.last_name);
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

      const { subject, html } = jobApplicationEmail({
        companyName: company.name ?? 'there',
        jobTitle: job.title,
        applicantName,
        applicantEmail: profile?.email ?? user.email ?? '',
        applicantTrade: tp.trade ? TRADE_LABELS[tp.trade as keyof typeof TRADE_LABELS] : undefined,
        coverLetter: cover_letter,
        profileUrl: `${origin}/profile/${user.id}`,
      });

      await sendEmail({
        to: company.email,
        subject,
        html,
        replyTo: profile?.email ?? user.email ?? undefined,
      });
    }
  } catch (e) {
    console.error('Application email notification failed:', e);
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status, notes } = await request.json();

  const { data, error } = await supabase
    .from('job_applications')
    .update({ status, notes })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
