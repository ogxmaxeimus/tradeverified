import type { TradeType } from '@/types/database';

export const SITE_NAME = 'TradeVerified';
export const SITE_DESCRIPTION = 'The professional network for skilled trades workers';

export const TRADES: { value: TradeType; label: string; icon: string }[] = [
  { value: 'hvac', label: 'HVAC', icon: '❄️' },
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'welding', label: 'Welding', icon: '🔥' },
  { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
  { value: 'mechanics', label: 'Mechanics', icon: '🔩' },
  { value: 'construction', label: 'Construction', icon: '🏗️' },
];

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export const PRICING = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month' as const,
    features: [
      'Basic profile',
      'Up to 3 portfolio uploads',
      'Job applications',
      'Receive reviews',
    ],
  },
  pro: {
    name: 'Pro Tradesperson',
    price: 19,
    interval: 'month' as const,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      'Everything in Free',
      'Unlimited portfolio uploads',
      'Featured profile placement',
      'Verification badge',
      'Profile analytics',
      'Priority in search results',
    ],
  },
  employer: {
    name: 'Employer',
    price: 99,
    interval: 'month' as const,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_EMPLOYER_PRICE_ID,
    features: [
      'Unlimited job posts',
      'Candidate search & filters',
      'Save candidates',
      'Contact workers directly',
      'View portfolios',
      'Application management',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    interval: 'month' as const,
    features: [
      'Everything in Employer',
      'Custom integrations',
      'Dedicated account manager',
      'Bulk hiring tools',
      'API access',
      'Custom branding',
    ],
  },
};

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'temporary', 'apprenticeship'];
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
export const AVAILABILITY_OPTIONS = ['available', 'busy', 'not-looking'];
