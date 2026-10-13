# Verification

A verified badge means a TradeVerified reviewer approved at least one license or certification on that worker. It does not mean a state board API returned a live record. The concept site describes automated checks; the pilot does the manual version of that same loop.

## What the worker submits

- Kind: license or certification
- Name, issuing authority, and optional number
- Optional state and issue / expiration dates
- A PDF or image of the document, stored in the private `credentials` bucket under that worker's user id

New rows are always `pending`. Workers cannot insert or update a row as `approved`. The database enforces that with a column grant and an insert policy.

## What the reviewer does

1. Sign in with an account whose `profiles.role` is `admin`.
2. Open `/admin`.
3. Read the issuing authority, number, dates, and the uploaded file (a short-lived signed URL).
4. Approve or reject, with a note about what was checked.

Approving one credential sets `worker_profiles.verification_status` to `verified` and stamps `verified_at`. If every approved credential is later removed and a pending one remains, the badge returns to `pending`. If only rejections remain, it becomes `rejected`. With no credentials left, it is `unverified`. A trigger does this; the app does not trust the client to set the badge.

Public profiles list approved credentials only: name, authority, number, state, dates, and the review date. Pending files stay private to the worker and admins.

## What v1 does not verify

- That the document is genuine, beyond a human looking at it
- Government ID, insurance, or background checks
- Customer reviews
- That a license is still active on the day someone is hired

## Later checks

When a board or issuer has a usable lookup, store the source, the reference number, the date checked, and whether the check was automatic or manual. Keep the manual queue for issuers that have no API. Do not hide a failed automatic check behind a verified badge.
