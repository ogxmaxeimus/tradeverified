import type { VerificationMethod } from '@/types/database';

export type VerificationOutcome = 'verified' | 'rejected' | 'manual_review';

export interface VerificationInput {
  certificationName: string;
  issuingBody: string;
  licenseNumber: string | null;
  issuingState: string | null;
  expiryDate: string | null;
  defaultMethod: VerificationMethod | null;
  verificationUrl: string | null;
  requiresLicense: boolean;
  trade: string | null;
}

export interface VerificationResult {
  outcome: VerificationOutcome;
  method: VerificationMethod | null;
  sourceUrl: string | null;
  reference: string | null;
  notes: string;
  /** Raw provider response for audit trail (stored in event notes, truncated). */
  provider: string;
}
