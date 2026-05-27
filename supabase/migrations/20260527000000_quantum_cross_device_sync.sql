-- ════════════════════════════════════════════════════════════════════
-- SQI Cross-Device Quantum Apothecary Sync Table
-- Persists scan state, library unlock, Top 33, palm scan, remedies
-- so any login on any device sees the exact same Apothecary state.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_quantum_sync (
  user_id          uuid       PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  library_unlocked boolean    NOT NULL DEFAULT false,
  last_scan_at     timestamptz,
  scan_snapshot    jsonb,
  top33_matches    jsonb,
  top33_matches_ts timestamptz,
  palm_scan        jsonb,
  daily_remedies   jsonb      NOT NULL DEFAULT '[]'::jsonb,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_quantum_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their quantum sync" ON public.user_quantum_sync;
CREATE POLICY "Users own their quantum sync"
  ON public.user_quantum_sync FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Supabase Realtime on both tables so all devices stay live
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_quantum_sync;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_active_transmissions;
  EXCEPTION WHEN others THEN NULL;
  END;
END$$;
