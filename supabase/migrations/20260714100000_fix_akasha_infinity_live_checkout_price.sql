-- CRITICAL FIX: the real "Activate Akasha-Infinity" checkout button on
-- AkashaInfinity.tsx (handleCheckout) does NOT use any hardcoded price ID —
-- it queries membership_tiers.stripe_price_id at checkout time. Traced the
-- full migration history: this row was renamed from the old "Lifetime"
-- tier (€449, price_1SlsuKAPsnbrivP0f5gHTBnR) straight to "akasha-infinity"
-- in May 2026 with the comment "same Stripe price" — meaning it was NEVER
-- updated to either the €1111 price or the new €2997 price. This is
-- separate from and in addition to the earlier code-level price fix
-- (tierCheckout.ts, stripe-config.ts, stripe-webhook, create-tier-checkout),
-- none of which affect this specific button.

UPDATE public.membership_tiers
SET stripe_price_id = 'price_1TsTQbAPsnbrivP0X0Obb5YN',
    stripe_product_id = 'prod_UsDseB50XU6Ob6',
    price_eur = 2997
WHERE slug = 'akasha-infinity';

-- Sanity check: confirm the update actually matched a row. If this returns
-- 0, the slug doesn't exist under this exact name and needs investigation
-- before trusting the checkout button at all.
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.membership_tiers WHERE slug = 'akasha-infinity' AND stripe_price_id = 'price_1TsTQbAPsnbrivP0X0Obb5YN';
  IF v_count = 0 THEN
    RAISE WARNING 'akasha-infinity row not found or update did not apply — checkout button price is still unverified';
  END IF;
END $$;
