# TradeVerified

The professional network for skilled trades. HVAC technicians, plumbers, electricians, welders, carpenters, mechanics, and pipefitters keep a profile a shop can actually read. Employers search by trade and ticket, post jobs, and move applicants from new to hired.

This repository is the working product: marketing site, marketplace, profiles, jobs, messages, groups, and hiring dashboard.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Try the workspace

Accounts and marketplace data are saved in this browser. Two sample logins are on the sign-in page:

| Who | Email | Password |
| --- | --- | --- |
| Marcus Rivera, HVAC tech | marcus.rivera@tradeverified.app | demo1234 |
| Ethan Reynolds, Bluewater Plumbing | ethan.reynolds@bluewater.co | demo1234 |

Reset the sample marketplace any time from the account menu.

## What you can do

- Search tradespeople by name, trade, city, license, insurance, background check, OSHA, and years.
- Open a profile and read each credential’s source, reference, and expiration. Expired tickets stay visible.
- Save people and jobs, message from a profile, and leave a review that requires a proof reference.
- Apply to a job as a tradesperson and track the status.
- As an employer, post a job, shortlist applicants, and update the company page.
- Add portfolio photos and credentials to your own profile. A workspace check confirms the reference shape and expiration date, and the badge says that is what was checked. It does not call a state licensing board.
- Join a trade group, read the hiring guides, and turn on Free, Pro, or Employer for the account in this browser.

Plans update the account locally. Card billing is not connected.

## Stack

- Next.js, React, TypeScript
- Tailwind CSS
- Browser storage for accounts, messages, applications, and uploads

The design references in `screenshots/` are the earlier product studies. The app is the thing to use.
