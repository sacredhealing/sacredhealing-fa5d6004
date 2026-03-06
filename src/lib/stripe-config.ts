/* SQI 2050: STRIPE PRICE MAPPING */
export const STRIPE_TIERS = {
  PRANA_FLOW: {
    priceId: 'price_prana_19_monthly', // Replace with your actual Stripe Price ID
    mode: 'subscription' as const,
    commission: 5,
  },
  SIDDHA_QUANTUM: {
    priceId: 'price_siddha_45_monthly', // Replace with your actual Stripe Price ID
    mode: 'subscription' as const,
    commission: 15,
  },
  AKASHA_INFINITY: {
    priceId: 'price_akasha_1111_lifetime', // Replace with your actual Stripe Price ID
    mode: 'payment' as const, // One-time payment
    commission: 250,
  },
} as const;

export type StripeTierKey = keyof typeof STRIPE_TIERS;
