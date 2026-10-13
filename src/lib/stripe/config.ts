import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? '',
  employer: process.env.STRIPE_EMPLOYER_PRICE_ID ?? '',
} as const;

export const TIER_FROM_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID ?? '']: 'pro',
  [process.env.STRIPE_EMPLOYER_PRICE_ID ?? '']: 'employer',
};
