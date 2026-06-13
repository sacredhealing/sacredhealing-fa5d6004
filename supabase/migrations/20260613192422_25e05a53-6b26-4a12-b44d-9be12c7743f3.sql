
-- Fix 1: Remove overly permissive bot_trades policies
DROP POLICY IF EXISTS "anon_read_all_bot_trades" ON public.bot_trades;
DROP POLICY IF EXISTS "bot_insert_all" ON public.bot_trades;

-- Ensure owner-scoped policies exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bot_trades' AND policyname='bot_trades_select_own') THEN
    CREATE POLICY "bot_trades_select_own" ON public.bot_trades
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bot_trades' AND policyname='bot_trades_insert_own') THEN
    CREATE POLICY "bot_trades_insert_own" ON public.bot_trades
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Fix 2: Lock down realtime.messages channel subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_own_channels" ON realtime.messages;
CREATE POLICY "authenticated_can_receive_own_channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow subscribing only to channels containing the user's own id
    realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );

DROP POLICY IF EXISTS "authenticated_can_send_own_channels" ON realtime.messages;
CREATE POLICY "authenticated_can_send_own_channels"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );
