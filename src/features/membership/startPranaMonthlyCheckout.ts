import { supabase } from '@/integrations/supabase/client';

function resolveCheckoutUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const u = d.url ?? d.checkoutUrl;
  return typeof u === 'string' && u.length > 0 ? u : null;
}

/**
 * Stripe subscription checkout for Prana–Flow monthly (`prana-monthly`).
 * Same flow as /prana-flow — used from Meditations lock / upgrade CTAs.
 */
export async function startPranaMonthlyCheckout(opts?: {
  successPath?: string;
  sourcePage?: string;
}): Promise<void> {
  const successPath = opts?.successPath ?? '/prana-flow';
  const sourcePage = opts?.sourcePage ?? 'prana-flow';

  const affiliateRef =
    (() => {
      try {
        return sessionStorage.getItem('affiliate_ref');
      } catch {
        return null;
      }
    })() ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('sqi_affiliate_id') : null) ||
    'direct';

  const { data: tierData, error: tierError } = await supabase
    .from('membership_tiers')
    .select('stripe_price_id, slug')
    .eq('slug', 'prana-monthly')
    .single();

  if (tierError || !tierData?.stripe_price_id) {
    throw new Error('Prana Flow monthly is not available — contact support');
  }

  const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
    body: {
      priceId: tierData.stripe_price_id,
      tierSlug: 'prana-monthly',
      affiliate_id: affiliateRef,
      successPath,
      metadata: {
        tier_name: 'Prana–Flow',
        source_page: sourcePage,
      },
    },
  });

  if (error) throw new Error(error.message || 'Checkout failed');
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    throw new Error(String((data as { error: string }).error));
  }
  const url = resolveCheckoutUrl(data);
  if (!url) throw new Error('No checkout URL returned');
  window.location.assign(url);
}
