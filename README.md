# TradeVerified

Verified profiles and job posts for skilled trades workers and the contractors who hire them.

This repository has two parts:

- `index.html` is the concept and design preview (the page behind the GitHub Pages demo).
- The Next.js app in `src/` is the pilot product: accounts, profiles, license uploads, search, jobs, and applications, backed by Supabase.

Product notes live in `docs/ROADMAP.md`, `docs/VERIFICATION.md`, `docs/MONETIZATION.md`, and `docs/COMPETITIVE_ANALYSIS.md`.

## Pilot screenshots

![Home](screenshots/app-home.png)
![Worker search](screenshots/app-search.png)
![Verified profile](screenshots/app-profile.png)
![Job detail](screenshots/app-job.png)
![Worker dashboard](screenshots/app-dashboard.png)
![Employer applicants](screenshots/app-applicants.png)
![Admin review queue](screenshots/app-admin.png)

The original concept mockups are still in `screenshots/tv-landing.png`, `screenshots/tv-marketplace.png`, `screenshots/tv-profile.png`, and `screenshots/tv-dashboard.png`.

## Pilot scope

Workers and employers sign up with email and password. A worker adds a trade, uploads licenses or certifications, and adds portfolio photos. An admin reviews each document. Approving one credential turns the profile badge to verified. Employers post jobs and search workers by trade, certification, and location. Workers apply. Billing, reviews, and automated license-board lookups are not in this build. See the production list at the bottom.

## Run it locally

You need Node.js 22+ and Docker.

```bash
npm install
supabase start
```

`supabase start` prints the API URL and the publishable (anon) key. Copy them into `.env.local`:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon or publishable key from supabase status>
```

Do not put the service role or secret key in a `NEXT_PUBLIC_` variable. The app does not read it.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`supabase start` applies `supabase/migrations` and `supabase/seed.sql`. To wipe local data and load the demo again:

```bash
supabase db reset
```

Check the database for security and performance advice after schema changes:

```bash
supabase db advisors
```

`npm run verify` signs in as the demo accounts and walks search, credential review, job posting, and apply against the local API. It restores the rows it creates, except for one throwaway signup used to prove that requesting the admin role does not grant it.

## Demo accounts

Every seeded account uses the password `pilot-demo-2026`.

| Role | Email |
| --- | --- |
| Admin | avery.quinn@tradeverified.dev |
| Employer | marcus.hale@tradeverified.dev |
| Employer | priya.shah@tradeverified.dev |
| Worker | jordan.ellis@tradeverified.dev |
| Worker | sam.rivera@tradeverified.dev |
| Worker | alex.nguyen@tradeverified.dev |
| Worker | riley.brooks@tradeverified.dev |
| Worker | casey.morgan@tradeverified.dev |
| Worker | drew.patel@tradeverified.dev |

Alex's plumber license is pending, so the review queue is not empty. Riley has no credential yet. Do not run `supabase/seed.sql` on a production database. It creates known passwords.

To make another reviewer, sign up a normal account and then, in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = '<user uuid>';
```

Signup metadata cannot set `admin`. The role lives on `profiles`, not in editable user metadata.

## Deploy on Vercel and Supabase

1. Create a Supabase project.
2. Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), then from this repo:

   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   That applies the migration, including the private `credentials` bucket and the public `portfolio` bucket. Skip `seed.sql` on production.
3. In Authentication settings, set the site URL to the Vercel domain and add `https://<your-app>.vercel.app/auth/callback` to the redirect URLs. Turn on email confirmations once SMTP is configured. The local config leaves confirmations off so a pilot signup works without mail.
4. Create a Vercel project from this repository. Set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

5. Deploy. Create the first admin with the SQL above.
6. The concept page (`index.html`) can stay on GitHub Pages. The Vercel app is the product.

## Before a production launch

- Confirm email and password reset with a real SMTP provider
- Delete the demo users and rotate anything seeded into a shared project
- Stripe plans from `docs/MONETIZATION.md`, with the free portfolio cap enforced in the database
- Proof-backed reviews and saved candidates
- Automated license lookups beside the manual queue (`docs/VERIFICATION.md`)
- An audit log of approve and reject decisions
- Captcha and rate limits on signup
- Backups, error tracking, terms, and a privacy notice
- Remove `robots: noindex` in `src/app/layout.tsx` when the app should be indexed
- Invite admins without handing someone the SQL editor
