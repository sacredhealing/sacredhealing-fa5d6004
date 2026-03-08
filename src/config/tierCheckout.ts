/* SQI 2050: STRIPE & AFFILIATE SYNC */

export const TIER_CONFIG = {
  ATMA_SEED: { id: "price_atma_free", price: 0, commission: 0 },
  PRANA_FLOW: { id: "price_1T8o3YAPsnbrivP056UJqOP7", price: 19, commission: 5.70 },
  SIDDHA_QUANTUM: { id: "price_1T8o3jAPsnbrivP0uZKR33EY", price: 45, commission: 13.50 },
  AKASHA_INFINITY: { id: "price_1T8o3kAPsnbrivP0m8bOzl3M", price: 1111, commission: 333.30 },
} as const;

export type TierName = keyof typeof TIER_CONFIG;

/**
 * Starts Stripe checkout for a tier. Calls the create-tier-checkout edge function
 * which creates the session with affiliate metadata and returns the checkout URL.
 */
export async function createCheckoutSession(
  tierName: TierName,
  affiliateId?: string
): Promise<string> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.functions.invoke("create-tier-checkout", {
    body: { tierName, affiliateId: affiliateId || "direct" },
  });
  if (error) throw new Error(error.message || "Checkout failed");
  if (!data?.url) throw new Error("No checkout URL returned");
  return data.url;
}
