// Meta Pixel conversion event helpers.
// The base pixel snippet (PageView) is already installed in index.html —
// this file only adds the standard conversion events that were completely
// missing: CompleteRegistration, InitiateCheckout, Purchase. Safe no-op if
// fbq isn't loaded for any reason (ad blocker, etc.) — never throws.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function safeFbq(...args: unknown[]) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq(...args);
    }
  } catch {
    /* never let analytics break the app */
  }
}

/** Fire when someone completes signup (new account created). */
export function trackSignup(method: 'free-chart' | 'standard' = 'standard') {
  safeFbq('track', 'CompleteRegistration', { content_name: method });
}

/** Fire right before redirecting to Stripe checkout. */
export function trackInitiateCheckout(tierSlug: string, value: number, currency = 'EUR') {
  safeFbq('track', 'InitiateCheckout', {
    content_name: tierSlug,
    value,
    currency,
  });
}

/** Fire on the post-checkout success redirect. Call exactly once per purchase. */
export function trackPurchase(tierSlug: string, value: number, currency = 'EUR') {
  safeFbq('track', 'Purchase', {
    content_name: tierSlug,
    value,
    currency,
  });
}
