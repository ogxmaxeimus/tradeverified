-- Migration 003: Automated verification metadata
ALTER TABLE tradesperson_certifications
  ADD COLUMN IF NOT EXISTS auto_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_check_notes TEXT;
