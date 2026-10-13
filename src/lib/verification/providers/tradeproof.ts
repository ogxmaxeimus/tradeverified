import type { VerificationInput, VerificationResult } from '../types';

/**
 * TradeProof aggregator — optional paid provider for multi-state license checks.
 * Set TRADEPROOF_API_KEY in env to enable FL, CA, and other states without building
 * per-state integrations. Falls back to manual review if key is missing.
 */
const TRADEPROOF_BASE = 'https://tradeproof.net/v1/licenses';

interface TradeProofResponse {
  valid?: boolean;
  status?: string;
  license_number?: string;
  name?: string;
  business_name?: string;
  expiration_date?: string;
  source_url?: string;
  message?: string;
}

export function isTradeProofEnabled(): boolean {
  return !!process.env.TRADEPROOF_API_KEY;
}

export async function verifyViaTradeProof(input: VerificationInput): Promise<VerificationResult | null> {
  const apiKey = process.env.TRADEPROOF_API_KEY;
  const state = input.issuingState?.trim().toUpperCase();
  const licenseNumber = input.licenseNumber?.trim();

  if (!apiKey || !state || !licenseNumber) return null;

  const url = `${TRADEPROOF_BASE}/${state}/${encodeURIComponent(licenseNumber)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-API-Key': apiKey,
      },
      next: { revalidate: 0 },
    });

    if (res.status === 404) {
      return {
        outcome: 'rejected',
        method: 'third_party',
        sourceUrl: url,
        reference: licenseNumber,
        notes: `License ${licenseNumber} not found in ${state} records (TradeProof).`,
        provider: 'tradeproof',
      };
    }

    if (!res.ok) {
      return {
        outcome: 'manual_review',
        method: 'third_party',
        sourceUrl: url,
        reference: licenseNumber,
        notes: `TradeProof lookup unavailable (HTTP ${res.status}). Queued for manual review.`,
        provider: 'tradeproof',
      };
    }

    const data: TradeProofResponse = await res.json();

    if (data.valid === false) {
      return {
        outcome: 'rejected',
        method: 'third_party',
        sourceUrl: data.source_url ?? url,
        reference: licenseNumber,
        notes: data.message ?? `License not valid in ${state}.`,
        provider: 'tradeproof',
      };
    }

    if (data.valid === true) {
      const holder = data.business_name || data.name || 'License holder';
      const expiry = data.expiration_date ? ` Expires ${data.expiration_date}.` : '';
      return {
        outcome: 'verified',
        method: 'third_party',
        sourceUrl: data.source_url ?? url,
        reference: licenseNumber,
        notes: `Auto-verified via TradeProof. Holder: ${holder}. Status: ${data.status ?? 'active'}.${expiry}`,
        provider: 'tradeproof',
      };
    }

    return {
      outcome: 'manual_review',
      method: 'third_party',
      sourceUrl: url,
      reference: licenseNumber,
      notes: 'TradeProof returned inconclusive result. Queued for manual review.',
      provider: 'tradeproof',
    };
  } catch {
    return {
      outcome: 'manual_review',
      method: 'third_party',
      sourceUrl: url,
      reference: licenseNumber,
      notes: 'TradeProof lookup failed. Queued for manual review.',
      provider: 'tradeproof',
    };
  }
}
