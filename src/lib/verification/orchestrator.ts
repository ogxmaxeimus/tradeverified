import type { VerificationInput, VerificationResult } from './types';
import { validateSubmission } from './validators';
import { verifyTexasLicense } from './providers/texas-tdlr';
import { isTradeProofEnabled, verifyViaTradeProof } from './providers/tradeproof';

/** States with a built-in free automated lookup (no API key). */
const AUTOMATED_STATE_PROVIDERS: Record<string, (input: VerificationInput) => Promise<VerificationResult>> = {
  TX: verifyTexasLicense,
};

export async function runAutomatedVerification(input: VerificationInput): Promise<VerificationResult> {
  const formatError = validateSubmission(input);
  if (formatError) return formatError;

  const state = input.issuingState?.trim().toUpperCase() ?? null;
  const isStateLicense =
    input.defaultMethod === 'state_license_board' ||
    input.issuingBody === 'State Licensing Board';

  // 1. Official state-specific provider (free)
  if (state && isStateLicense && AUTOMATED_STATE_PROVIDERS[state]) {
    return AUTOMATED_STATE_PROVIDERS[state](input);
  }

  // 2. Third-party aggregator (optional, multi-state)
  if (isStateLicense && state && isTradeProofEnabled()) {
    const result = await verifyViaTradeProof(input);
    if (result) return result;
  }

  // 3. Issuer portal certs (EPA, NATE, AWS, ASE, OSHA) — no public APIs; queue manual review
  if (input.defaultMethod === 'issuer_portal') {
    return {
      outcome: 'manual_review',
      method: 'issuer_portal',
      sourceUrl: input.verificationUrl,
      reference: input.licenseNumber,
      notes: input.licenseNumber
        ? `Credential #${input.licenseNumber} submitted. No automated issuer API available — our team will verify against ${input.issuingBody}.`
        : `Submitted for manual verification against ${input.issuingBody}.`,
      provider: 'issuer_portal',
    };
  }

  // 4. State license without automated provider for that state
  if (isStateLicense && state) {
    const tradeProofNote = isTradeProofEnabled()
      ? ''
      : ' Add TRADEPROOF_API_KEY to enable instant multi-state checks.';
    return {
      outcome: 'manual_review',
      method: 'state_license_board',
      sourceUrl: input.verificationUrl,
      reference: input.licenseNumber,
      notes: `License #${input.licenseNumber} (${state}) queued for manual verification against the state board.${tradeProofNote}`,
      provider: 'manual_queue',
    };
  }

  // 5. Document-only fallback
  return {
    outcome: 'manual_review',
    method: 'document_review',
    sourceUrl: input.verificationUrl,
    reference: input.licenseNumber,
    notes: 'Submitted for manual document review by our verification team.',
    provider: 'document_review',
  };
}
