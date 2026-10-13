# Automated Credential Verification

How TradeVerified checks licenses and certifications automatically — and what you need to configure.

## How it works

When a tradesperson submits a credential:

1. **Format validation** — rejects missing license numbers, expired dates, or invalid formats instantly.
2. **Automated lookup** — queries official or third-party sources based on state and cert type.
3. **Outcome:**
   - **Verified** — license found and active; badge applied immediately with provenance.
   - **Rejected** — license not found or inactive on the official source.
   - **Manual review** — no automated source available; queued for admin with notes.

Every step is logged in `certification_verification_events`.

## What's automated today

| Source | Coverage | Cost | Env var |
|---|---|---|---|
| **Texas Open Data (TDLR)** | TX electricians, HVAC, etc. | Free | `TEXAS_OPEN_DATA_TOKEN` (optional) |
| **TradeProof** | FL, CA, TX, and more | Paid API key | `TRADEPROOF_API_KEY` |
| **Manual review** | EPA 608, NATE, AWS, ASE, OSHA, other states | — | — |

EPA 608 and most issuer certs have **no public API** — those always go to manual review against the issuing body's portal.

## Setup

1. Run migrations `002_certification_verification.sql` and `003_auto_verification.sql` in Supabase.
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (required for auto-verify to write results).
3. Optional: add `TRADEPROOF_API_KEY` for instant multi-state checks beyond Texas.
4. Optional: add `TEXAS_OPEN_DATA_TOKEN` from [data.texas.gov](https://data.texas.gov/profile/app_tokens) for higher rate limits.

## API

`POST /api/certifications/verify`

```json
{ "certification_id": "uuid" }
```

Called automatically on submission; admins can also trigger via **Run auto-verify** in the admin panel.

## Pilot without API keys

Manual review is the working path for the local pilot. A tradesperson uploads a document to the private `certifications` bucket and the row stays `pending` until an admin records a method, source, and notes in `/dashboard/admin/certifications`. Approving it sets `profiles.is_verified`. Texas TDLR and TradeProof run only when their env vars and `SUPABASE_SERVICE_ROLE_KEY` are present; otherwise the credential stays in the queue.

`supabase db reset` applies `001` through `004`. Migration `004_security_and_search.sql` keeps this schema and adds the signup role lock, private helpers, and the rule that a tradesperson cannot change verification fields.
