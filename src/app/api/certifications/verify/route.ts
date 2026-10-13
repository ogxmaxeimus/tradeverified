import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAutomatedVerification } from '@/lib/verification/orchestrator';
import { applyVerificationResult } from '@/lib/verification/apply-result';
import type { VerificationInput } from '@/lib/verification/types';
import type { Certification, TradespersonCertification } from '@/types/database';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Automated verification requires SUPABASE_SERVICE_ROLE_KEY on the server.' },
      { status: 503 }
    );
  }

  const { certification_id: certId } = await request.json();
  if (!certId) {
    return NextResponse.json({ error: 'certification_id is required' }, { status: 400 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: cert } = await supabase
    .from('tradesperson_certifications')
    .select('*, certification:certifications(*), tradesperson:tradesperson_profiles(user_id)')
    .eq('id', certId)
    .single();

  if (!cert) {
    return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
  }

  const ownerId = (cert.tradesperson as { user_id: string } | null)?.user_id;
  if (!isAdmin && ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (cert.status !== 'pending' && !isAdmin) {
    return NextResponse.json({ error: 'Only pending certifications can be auto-verified' }, { status: 400 });
  }

  const certification = cert.certification as Certification;
  const input: VerificationInput = {
    certificationName: certification.name,
    issuingBody: certification.issuing_body,
    licenseNumber: cert.license_number ?? cert.credential_id,
    issuingState: cert.issuing_state,
    expiryDate: cert.expiry_date,
    defaultMethod: certification.default_method ?? null,
    verificationUrl: certification.verification_url ?? null,
    requiresLicense: !!certification.requires_license,
    trade: certification.trade,
  };

  const result = await runAutomatedVerification(input);
  await applyVerificationResult({
    certId,
    result,
    actorId: isAdmin ? user.id : null,
  });

  const { data: updated } = await supabase
    .from('tradesperson_certifications')
    .select('*, certification:certifications(*)')
    .eq('id', certId)
    .single();

  return NextResponse.json({
    outcome: result.outcome,
    provider: result.provider,
    notes: result.notes,
    certification: updated as TradespersonCertification & { certification: Certification },
  });
}
