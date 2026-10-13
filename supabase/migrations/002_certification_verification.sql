-- =====================================================================
-- Migration 002: Certification verification & anti-fraud provenance
-- ---------------------------------------------------------------------
-- Goal: prove a credential is real instead of trusting self-entered data.
-- Every verified credential records HOW it was checked (method + source +
-- reference + reviewer + timestamp) so the badge is auditable, not assumed.
-- Safe to run multiple times.
-- =====================================================================

-- 1. How a credential was verified
DO $$ BEGIN
  CREATE TYPE verification_method AS ENUM (
    'state_license_board',  -- checked against an official state licensing board
    'issuer_portal',        -- checked against the issuing body's own lookup (NATE, AWS, ASE, EPA)
    'third_party',          -- verified via a background/credential-check provider
    'document_review'       -- manual review of an uploaded official document
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Provenance fields on each tradesperson credential
ALTER TABLE tradesperson_certifications
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS issuing_state TEXT,
  ADD COLUMN IF NOT EXISTS document_path TEXT,                 -- storage path (private), used to mint signed URLs
  ADD COLUMN IF NOT EXISTS verification_method verification_method,
  ADD COLUMN IF NOT EXISTS verification_source_url TEXT,       -- link to the official lookup result
  ADD COLUMN IF NOT EXISTS verification_reference TEXT,        -- reference/confirmation captured during the check
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,            -- reviewer notes
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;              -- why a submission was rejected

-- 3. Catalog: where/how each certification type can be verified
ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS verification_url TEXT,              -- official lookup page for this credential
  ADD COLUMN IF NOT EXISTS requires_license BOOLEAN DEFAULT FALSE,  -- needs a license number to verify
  ADD COLUMN IF NOT EXISTS default_method verification_method;      -- suggested verification method

-- 4. Immutable audit log of every verification action (anti-fraud trail)
CREATE TABLE IF NOT EXISTS certification_verification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradesperson_certification_id UUID NOT NULL
    REFERENCES tradesperson_certifications(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,                 -- 'submitted' | 'verified' | 'rejected' | 'expired' | 'revoked'
  method verification_method,
  source_url TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_verif_events_cert
  ON certification_verification_events(tradesperson_certification_id);

-- 5. RLS
ALTER TABLE certification_verification_events ENABLE ROW LEVEL SECURITY;

-- Anyone can read the trail for a credential (public proof of provenance)
DROP POLICY IF EXISTS "Verification events viewable" ON certification_verification_events;
CREATE POLICY "Verification events viewable" ON certification_verification_events
  FOR SELECT USING (true);

-- Only admins can write to the trail
DROP POLICY IF EXISTS "Admins write verification events" ON certification_verification_events;
CREATE POLICY "Admins write verification events" ON certification_verification_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins must be able to read & update credential records to verify them
DROP POLICY IF EXISTS "Admins manage all certs" ON tradesperson_certifications;
CREATE POLICY "Admins manage all certs" ON tradesperson_certifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Storage: admins can read private certification documents to review them
DROP POLICY IF EXISTS "Cert admin read" ON storage.objects;
CREATE POLICY "Cert admin read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'certifications'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Auto-expire credentials whose expiry date has passed
CREATE OR REPLACE FUNCTION expire_certifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tradesperson_certifications
  SET status = 'expired'
  WHERE expiry_date IS NOT NULL
    AND expiry_date < CURRENT_DATE
    AND status <> 'expired';
END;
$$;

-- 8. Seed official verification sources for the known certifications
UPDATE certifications SET verification_url = 'https://www.epa.gov/section608', default_method = 'issuer_portal', requires_license = TRUE
  WHERE name = 'EPA 608 Certification';
UPDATE certifications SET verification_url = 'https://www.natex.org/verify', default_method = 'issuer_portal', requires_license = TRUE
  WHERE name = 'NATE Certification';
UPDATE certifications SET verification_url = 'https://www.osha.gov/training/outreach/verification', default_method = 'issuer_portal'
  WHERE name IN ('OSHA 10', 'OSHA 30');
UPDATE certifications SET verification_url = 'https://www.aws.org/certification/page/verify-credentials', default_method = 'issuer_portal', requires_license = TRUE
  WHERE name = 'AWS Certified Welder';
UPDATE certifications SET verification_url = 'https://www.ase.com/verify', default_method = 'issuer_portal', requires_license = TRUE
  WHERE name = 'ASE Certification';
UPDATE certifications SET default_method = 'state_license_board', requires_license = TRUE
  WHERE issuing_body = 'State Licensing Board';
UPDATE certifications SET default_method = 'state_license_board', requires_license = TRUE
  WHERE name = 'CDL Class A';
