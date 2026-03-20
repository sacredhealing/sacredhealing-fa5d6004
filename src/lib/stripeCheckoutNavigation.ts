/**
 * Stripe Checkout cannot run inside third-party iframes (X-Frame-Options).
 * Preview hosts (e.g. Lovable) embed the app in an iframe; location.assign only
 * replaces the inner frame → blank white screen. Break out via top when allowed,
 * otherwise open a new tab (still a user gesture from the click handler).
 */

export type StripeNavigateResult = 'navigated' | 'opened_new_tab' | 'invalid_url' | 'popup_blocked';

export function resolveStripeCheckoutUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const nested = d.data;
  const nestedObj = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : null;
  const candidates = [d.url, d.checkoutUrl, d.sessionUrl, nestedObj?.url, nestedObj?.checkoutUrl];
  for (const u of candidates) {
    if (typeof u === 'string' && u.trim().length > 0) return u.trim();
  }
  return null;
}

function isStripeHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('stripe.com');
  } catch {
    return false;
  }
}

export function navigateToStripeCheckout(url: string): StripeNavigateResult {
  const trimmed = (url || '').trim();
  if (!isStripeHttpsUrl(trimmed)) {
    console.error('[stripe checkout] Invalid or non-Stripe URL:', trimmed.slice(0, 120));
    return 'invalid_url';
  }

  try {
    if (window.top !== window.self) {
      window.top.location.assign(trimmed);
      return 'navigated';
    }
  } catch {
    // Cross-origin parent: cannot assign top.location from here
  }

  if (window.self !== window.top) {
    const opened = window.open(trimmed, '_blank', 'noopener,noreferrer');
    if (opened == null) {
      return 'popup_blocked';
    }
    return 'opened_new_tab';
  }

  window.location.assign(trimmed);
  return 'navigated';
}
