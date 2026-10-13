# Roadmap

TradeVerified is a hiring network for skilled trades. The static `index.html` page is the concept site. The Next.js app is the pilot product.

## Now: pilot MVP

The pilot is enough to put in front of a few local contractors and tradespeople.

- Email and password accounts for workers and employers
- Worker profile: trade, location, experience, rate, bio, portfolio photos
- License and certification upload into a private bucket
- Verification badge driven by manual admin review
- Employer job posts
- Worker search by trade, certification name, city, and state
- Applications, with employers able to mark them reviewed, accepted, or declined
- Seeded Texas demo data
- Row Level Security on every public table

Signup cannot create an admin. Set `profiles.role` to `admin` in the SQL editor for the person who reviews documents.

## Before a production launch

- Turn on email confirmation, password reset, and a real SMTP provider
- Remove the demo seed accounts and the shared pilot password
- Stripe billing for the prices in `MONETIZATION.md`, including the free-plan portfolio cap
- Proof-backed reviews: a review only after a completed job, with a document the reviewer attaches
- Automated checks against state license boards and issuing bodies, recorded next to the manual decision
- Saved candidates and a simple message thread
- Audit log of who approved or rejected each credential
- Captcha and rate limits on signup
- Backups, error tracking, and an admin invite that does not depend on raw SQL
- Terms of use and a privacy notice
- Remove the app-wide `noindex` tag

## If the product is licensed or sold

- Documented deployment (this repo's Vercel + Supabase path)
- A staging project that is separate from customer data
- Export of a worker's own profile, credentials metadata, and applications
- No customer secrets in the repository
- A short security note covering RLS, private credential files, and the rule that `user_metadata` is not used for authorization
