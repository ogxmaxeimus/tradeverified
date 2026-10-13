import type { VerificationInput, VerificationResult } from '../types';

/**
 * Texas TDLR license lookup via the official Texas Open Data Portal (Socrata).
 * Free, public JSON — no API key required (app token optional for higher limits).
 * Covers electricians, HVAC/ACR, and other TDLR-licensed trades.
 * Note: TX plumbers are under TSBPE, not TDLR.
 */
const TEXAS_DATASET = 'https://data.texas.gov/resource/7358-krk7.json';

interface TexasLicenseRow {
  license_number?: string;
  license_type?: string;
  license_status?: string;
  expiration_date?: string;
  business_name?: string;
  name?: string;
}

function normalizeStatus(status: string | undefined): 'active' | 'inactive' | 'unknown' {
  if (!status) return 'unknown';
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('current') || s.includes('valid')) return 'active';
  if (s.includes('expir') || s.includes('cancel') || s.includes('revok') || s.includes('suspend') || s.includes('inactive')) {
    return 'inactive';
  }
  return 'unknown';
}

export async function verifyTexasLicense(input: VerificationInput): Promise<VerificationResult> {
  const licenseNumber = input.licenseNumber?.trim();
  if (!licenseNumber) {
    return {
      outcome: 'manual_review',
      method: 'state_license_board',
      sourceUrl: 'https://www.tdlr.texas.gov/LicenseSearch/',
      reference: null,
      notes: 'No license number provided for Texas lookup.',
      provider: 'texas_open_data',
    };
  }

  const params = new URLSearchParams({
    license_number: licenseNumber,
    $limit: '5',
  });

  const headers: HeadersInit = { Accept: 'application/json' };
  const token = process.env.TEXAS_OPEN_DATA_TOKEN;
  if (token) headers['X-App-Token'] = token;

  const url = `${TEXAS_DATASET}?${params}`;
  let rows: TexasLicenseRow[];

  try {
    const res = await fetch(url, { headers, next: { revalidate: 0 } });
    if (!res.ok) {
      return {
        outcome: 'manual_review',
        method: 'state_license_board',
        sourceUrl: 'https://www.tdlr.texas.gov/LicenseSearch/',
        reference: licenseNumber,
        notes: `Texas Open Data lookup unavailable (HTTP ${res.status}). Queued for manual review.`,
        provider: 'texas_open_data',
      };
    }
    rows = await res.json();
  } catch {
    return {
      outcome: 'manual_review',
      method: 'state_license_board',
      sourceUrl: 'https://www.tdlr.texas.gov/LicenseSearch/',
      reference: licenseNumber,
      notes: 'Texas Open Data lookup failed. Queued for manual review.',
      provider: 'texas_open_data',
    };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      outcome: 'rejected',
      method: 'state_license_board',
      sourceUrl: url,
      reference: licenseNumber,
      notes: `License ${licenseNumber} not found in Texas TDLR records.`,
      provider: 'texas_open_data',
    };
  }

  const match = rows.find(
    (r) => r.license_number?.replace(/\s/g, '').toLowerCase() === licenseNumber.replace(/\s/g, '').toLowerCase()
  ) ?? rows[0];

  const status = normalizeStatus(match.license_status);
  const holder = match.business_name || match.name || 'License holder';

  if (status === 'inactive') {
    return {
      outcome: 'rejected',
      method: 'state_license_board',
      sourceUrl: url,
      reference: licenseNumber,
      notes: `Texas license ${licenseNumber} found but status is "${match.license_status}" (${holder}).`,
      provider: 'texas_open_data',
    };
  }

  const expiryNote = match.expiration_date ? ` Expires ${match.expiration_date}.` : '';
  return {
    outcome: 'verified',
    method: 'state_license_board',
    sourceUrl: url,
    reference: licenseNumber,
    notes: `Auto-verified via Texas Open Data (TDLR). Holder: ${holder}. Status: ${match.license_status ?? 'active'}.${expiryNote}`,
    provider: 'texas_open_data',
  };
}
