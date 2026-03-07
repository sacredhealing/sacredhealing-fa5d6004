/* SQI 2050: FINAL COMMERCE CONFIG */
export const paymentLogic = {
  PRANA_FLOW: {
    price: 19,
    interval: 'month' as const, // Recurring every 30 days
    stripePriceId: 'price_19_monthly_id', // Replace with your actual Stripe Price ID
    commission: 30,
  },
  SIDDHA_QUANTUM: {
    price: 45,
    interval: 'month' as const, // Recurring every 30 days
    stripePriceId: 'price_45_monthly_id', // Replace with your actual Stripe Price ID
    commission: 30,
  },
  AKASHA_INFINITY: {
    price: 1111,
    interval: 'one-time' as const, // No recurring charge
    stripePriceId: 'price_1111_lifetime_id', // Replace with your actual Stripe Price ID
    commission: 30,
  },
} as const;

export type StripeTierKey = keyof typeof paymentLogic;

/** Derive Stripe mode from interval: month = subscription, one-time = payment */
export const getStripeMode = (interval: (typeof paymentLogic)[StripeTierKey]['interval']): 'subscription' | 'payment' =>
  interval === 'month' ? 'subscription' : 'payment';
