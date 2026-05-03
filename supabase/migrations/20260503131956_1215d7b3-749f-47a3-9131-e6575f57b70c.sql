
-- Migrate any existing user_memberships off legacy tiers to the canonical equivalents
UPDATE public.user_memberships um
SET tier_id = (SELECT id FROM public.membership_tiers WHERE slug = 'prana-monthly')
WHERE tier_id IN (SELECT id FROM public.membership_tiers WHERE slug IN ('premium-monthly','premium-annual'));

-- Rename Lifetime → Akasha-Infinity (same Stripe price)
UPDATE public.membership_tiers
SET slug = 'akasha-infinity',
    name = 'Akasha-Infinity',
    description = 'Lifetime sovereignty — full access forever'
WHERE slug = 'lifetime';

-- Delete legacy tiers
DELETE FROM public.membership_tiers WHERE slug IN ('premium-monthly','premium-annual');

-- Migrate admin-granted access tier values to canonical slugs
UPDATE public.admin_granted_access
SET tier = 'akasha-infinity'
WHERE access_type = 'membership' AND tier IN ('lifetime','akasha_infinity','akasha_infinity_lifetime');

UPDATE public.admin_granted_access
SET tier = 'siddha-quantum'
WHERE access_type = 'membership' AND tier IN ('siddha_quantum');

UPDATE public.admin_granted_access
SET tier = 'prana-flow'
WHERE access_type = 'membership' AND tier IN ('premium_monthly','premium_annual','prana_flow_monthly','prana_flow_annual','prana_monthly');
