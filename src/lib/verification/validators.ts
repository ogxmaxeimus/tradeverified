import type { VerificationInput, VerificationResult } from './types';

/** Reject obviously invalid submissions before any external lookup. */
export function validateSubmission(input: VerificationInput): VerificationResult | null {
  if (input.requiresLicense && !input.licenseNumber?.trim()) {
    return {
      outcome: 'rejected',
      method: null,
      sourceUrl: null,
      reference: null,
      notes: 'License or credential number is required for this certification.',
      provider: 'format_validator',
    };
  }

  if (input.expiryDate) {
    const expiry = new Date(input.expiryDate);
    if (!Number.isNaN(expiry.getTime()) && expiry < new Date()) {
      return {
        outcome: 'rejected',
        method: null,
        sourceUrl: null,
        reference: null,
        notes: 'Credential expiry date is in the past.',
        provider: 'format_validator',
      };
    }
  }

  const license = input.licenseNumber?.trim();
  if (!license) return null;

  // Basic sanity: license numbers should be alphanumeric with common separators.
  if (!/^[A-Za-z0-9][A-Za-z0-9\-./ ]{2,30}$/.test(license)) {
    return {
      outcome: 'rejected',
      method: null,
      sourceUrl: null,
      reference: null,
      notes: 'License number format is invalid. Use the number exactly as shown on your license.',
      provider: 'format_validator',
    };
  }

  return null;
}
