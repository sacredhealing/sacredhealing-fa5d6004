-- Wallet check migration (no-op for schema, just reads)
DO $$
DECLARE
  clawbot_wallet text;
  delta_wallet text;
BEGIN
  SELECT platform_wallet INTO clawbot_wallet FROM clawbot_platform_config WHERE id = 1;
  SELECT platform_wallet INTO delta_wallet FROM delta_arb_platform_config WHERE id = 1;
  RAISE NOTICE 'CLAWBOT_WALLET=%', COALESCE(clawbot_wallet, 'NOT SET');
  RAISE NOTICE 'DELTA_ARB_WALLET=%', COALESCE(delta_wallet, 'NOT SET');
END $$;
