-- Airdrop Farming Tracker — per-user weekly log, synced across devices.

CREATE TABLE IF NOT EXISTS airdrop_farming_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  protocol_id text NOT NULL,
  week_key    text NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, protocol_id, week_key)
);

CREATE TABLE IF NOT EXISTS airdrop_farming_hygiene (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_key    text NOT NULL,
  item        text NOT NULL,
  checked     boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_key, item)
);

ALTER TABLE airdrop_farming_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_farming_hygiene ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='airdrop_farming_entries' AND policyname='Users own airdrop_farming_entries') THEN
    CREATE POLICY "Users own airdrop_farming_entries" ON airdrop_farming_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='airdrop_farming_hygiene' AND policyname='Users own airdrop_farming_hygiene') THEN
    CREATE POLICY "Users own airdrop_farming_hygiene" ON airdrop_farming_hygiene FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON airdrop_farming_entries TO authenticated;
GRANT ALL ON airdrop_farming_hygiene TO authenticated;
