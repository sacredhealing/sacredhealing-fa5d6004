ALTER TABLE public.affiliate_profiles ADD COLUMN IF NOT EXISTS link_label text;
ALTER TABLE public.affiliate_profiles ADD COLUMN IF NOT EXISTS payout_bank_details jsonb;
COMMENT ON COLUMN public.affiliate_profiles.link_label IS 'Optional custom display name the affiliate sets for their referral link (shown on the /affiliate/r/:code landing page instead of their account name).';
COMMENT ON COLUMN public.affiliate_profiles.payout_bank_details IS 'Manual payout details (Wise / IBAN / Other) captured for affiliates who cannot use Stripe Connect.';