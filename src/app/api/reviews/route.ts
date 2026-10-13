import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const tradespersonId = formData.get('tradesperson_id') as string;
  const rating = parseInt(formData.get('rating') as string);
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const serviceDate = formData.get('service_date') as string;
  const proofFile = formData.get('proof') as File | null;

  let proofUrl = null;
  if (proofFile && proofFile.size > 0) {
    const path = `${user.id}/${Date.now()}-proof.${proofFile.name.split('.').pop()}`;
    const buffer = Buffer.from(await proofFile.arrayBuffer());
    await supabase.storage.from('review-proofs').upload(path, buffer);
    proofUrl = supabase.storage.from('review-proofs').getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase.from('reviews').insert({
    tradesperson_id: tradespersonId,
    reviewer_id: user.id,
    rating,
    title,
    content,
    service_date: serviceDate || null,
    proof_of_service_url: proofUrl,
    status: 'pending',
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tradespersonId = searchParams.get('tradesperson_id');

  const supabase = await createClient();
  let query = supabase
    .from('reviews')
    .select('*, reviewer:profiles(first_name, last_name, avatar_url)')
    .eq('status', 'approved')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (tradespersonId) {
    query = query.eq('tradesperson_id', tradespersonId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
