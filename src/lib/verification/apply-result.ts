import { createServiceClient } from '@/lib/supabase/server';
import type { VerificationResult } from './types';

interface ApplyResultOptions {
  certId: string;
  result: VerificationResult;
  actorId?: string | null;
}

/** Persist automated verification outcome to the database. */
export async function applyVerificationResult({ certId, result, actorId = null }: ApplyResultOptions) {
  const supabase = await createServiceClient();
  const now = new Date().toISOString();

  const eventAction =
    result.outcome === 'verified'
      ? 'auto_verified'
      : result.outcome === 'rejected'
        ? 'auto_rejected'
        : 'auto_check';

  if (result.outcome === 'verified') {
    await supabase.from('tradesperson_certifications').update({
      status: 'verified',
      verified_by: actorId,
      verified_at: now,
      verification_method: result.method,
      verification_source_url: result.sourceUrl,
      verification_reference: result.reference,
      verification_notes: result.notes,
      rejection_reason: null,
      auto_checked_at: now,
      auto_check_notes: `[${result.provider}] ${result.notes}`,
    }).eq('id', certId);
  } else if (result.outcome === 'rejected') {
    await supabase.from('tradesperson_certifications').update({
      status: 'rejected',
      verified_by: actorId,
      verified_at: now,
      rejection_reason: result.notes,
      auto_checked_at: now,
      auto_check_notes: `[${result.provider}] ${result.notes}`,
    }).eq('id', certId);
  } else {
    // manual_review — stay pending, record auto-check attempt
    await supabase.from('tradesperson_certifications').update({
      auto_checked_at: now,
      auto_check_notes: `[${result.provider}] ${result.notes}`,
    }).eq('id', certId);
  }

  await supabase.from('certification_verification_events').insert({
    tradesperson_certification_id: certId,
    actor_id: actorId,
    action: eventAction,
    method: result.method,
    source_url: result.sourceUrl,
    reference: result.reference,
    notes: `[${result.provider}] ${result.notes}`,
  });

  return result;
}
