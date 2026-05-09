-- Virtual Pilgrimage Activations Table
-- Run this in Supabase SQL editor (via Lovable)
-- Stores every user's locked site + scalar vector permanently

CREATE TABLE IF NOT EXISTS virtual_pilgrimage_activations (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Site info
  site_id           TEXT NOT NULL,
  site_name         TEXT NOT NULL,

  -- Home GPS (saved once, persists forever — even phone off)
  home_lat          DOUBLE PRECISION NOT NULL,
  home_lng          DOUBLE PRECISION NOT NULL,
  home_label        TEXT,

  -- Computed scalar vector (unique to this user ↔ site pair)
  carrier_hz        DOUBLE PRECISION NOT NULL,
  binaural_hz       DOUBLE PRECISION NOT NULL,
  bearing_deg       DOUBLE PRECISION NOT NULL,
  distance_km       INTEGER NOT NULL,
  schumann_lock_hz  DOUBLE PRECISION NOT NULL DEFAULT 7.83,
  strength          INTEGER NOT NULL DEFAULT 20 CHECK (strength >= 0 AND strength <= 100),

  -- Practice tracking
  days_active       INTEGER NOT NULL DEFAULT 0,
  streak_days       JSONB DEFAULT '[]',    -- array of day-of-week numbers completed
  practice_log      JSONB DEFAULT '[]',    -- array of ISO date strings

  -- Server pulse (Railway updates these every hour)
  pulse_count       INTEGER NOT NULL DEFAULT 0,
  last_pulse_at     TIMESTAMPTZ,

  -- Lifecycle
  is_active         BOOLEAN NOT NULL DEFAULT true,
  activated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at      TIMESTAMPTZ,           -- set when 40 days done or released early
  released_early    BOOLEAN DEFAULT false,

  -- One active site per user at a time
  UNIQUE (user_id, is_active)
);

-- RLS: users can only see their own pilgrimages
ALTER TABLE virtual_pilgrimage_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pilgrimage"
  ON virtual_pilgrimage_activations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (Railway worker) can update pulse data
CREATE POLICY "Service role can pulse all active pilgrimages"
  ON virtual_pilgrimage_activations
  FOR UPDATE
  TO service_role
  USING (is_active = true);

-- Index for the Railway worker query
CREATE INDEX idx_pilgrimage_active ON virtual_pilgrimage_activations (is_active)
  WHERE is_active = true;

-- Also store home GPS on the profiles table for persistence
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pilgrimage_home_lat   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pilgrimage_home_lng   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pilgrimage_home_label TEXT;
