# Monetization

The pilot does not charge anyone. Workers can apply, and employers can post jobs and search, so a local trial is not blocked by billing. Prices below match the concept site and are the plan for a paid launch, not a current paywall.

| Plan | Price | Who | What they pay for |
| --- | --- | --- | --- |
| Free | $0 | Tradespeople | Profile, applications, a small portfolio |
| Pro | $19/month | Tradespeople who want visibility | Larger portfolio, search priority, profile stats |
| Employer | $99/month | Companies that hire | Job posts, candidate search, application management |
| Enterprise | Custom | Multi-location crews | Integrations, a named contact, branding |

Workers should not have to pay to be found or to apply. Pro is optional visibility. Employer tools are the main subscription.

## When billing is added

- Stripe Checkout and the customer portal
- Webhooks that set a plan on the profile; do not trust a price id coming from the browser
- Enforce the free portfolio limit in the database, not only in the UI
- Keep verification review available on the free worker plan. A badge should not be a paid add-on that hides an unreviewed license.

Until Stripe exists, ignore the prices in the product UI. The concept page can keep showing them as the intended model.
