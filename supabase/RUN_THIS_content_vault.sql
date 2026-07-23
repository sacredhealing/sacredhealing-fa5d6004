-- ============================================================================
-- CONTENT VAULT — paid content drops (video/audio/meditation/song/beat)
-- Run this once in the Supabase SQL Editor, same as the other RUN_THIS_ files.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_type text NOT NULL CHECK (media_type IN ('audio', 'video', 'meditation', 'song', 'beat')),
  media_path text NOT NULL,          -- path inside the private 'content-vault' storage bucket
  thumbnail_url text,                -- ok to be public (cover art, not the paid content itself)
  duration_seconds integer,
  price_cents integer NOT NULL DEFAULT 0,   -- one-time price; 0 = tier-only, never sold standalone
  currency text NOT NULL DEFAULT 'eur',
  included_min_tier_rank integer,    -- 0/1/2/3 — members at/above this rank get it free; null = never free
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE SET NULL,  -- where it was dropped, if anywhere
  drop_message_id uuid,              -- chat_messages.id of the announcement, once posted
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_vault_published ON public.content_vault(is_published);

ALTER TABLE public.content_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published content" ON public.content_vault;
CREATE POLICY "Anyone can view published content"
ON public.content_vault FOR SELECT
USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage content vault" ON public.content_vault;
CREATE POLICY "Admins can manage content vault"
ON public.content_vault FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));


CREATE TABLE IF NOT EXISTS public.content_vault_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content_vault(id) ON DELETE CASCADE,
  stripe_session_id text,
  amount_cents integer NOT NULL DEFAULT 0,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

ALTER TABLE public.content_vault_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchases" ON public.content_vault_purchases;
CREATE POLICY "Users can view their own purchases"
ON public.content_vault_purchases FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- No client INSERT policy on purpose — only the stripe-webhook (service-role key,
-- bypasses RLS entirely) is allowed to write a purchase row. This is the same
-- fix already applied for music/healing-audio/divine-transmission purchases:
-- confirm-on-webhook, never record-on-checkout-create.


-- True if the user can play this content right now (owns it, or their tier includes it, or admin).
CREATE OR REPLACE FUNCTION public.get_content_access(_user_id uuid, _content_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owns boolean;
  v_is_admin boolean;
  v_min_rank integer;
  v_user_tier text;
BEGIN
  v_is_admin := public.has_role(_user_id, 'admin');
  IF v_is_admin THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.content_vault_purchases
    WHERE user_id = _user_id AND content_id = _content_id
  ) INTO v_owns;

  IF v_owns THEN
    RETURN true;
  END IF;

  SELECT included_min_tier_rank INTO v_min_rank
  FROM public.content_vault WHERE id = _content_id;

  IF v_min_rank IS NULL THEN
    RETURN false;
  END IF;

  SELECT subscription_tier INTO v_user_tier
  FROM public.profiles WHERE user_id = _user_id;

  RETURN CASE
    WHEN v_user_tier IN ('akasha-infinity', 'lifetime') THEN 3 >= v_min_rank
    WHEN v_user_tier IN ('siddha-quantum', 'siddha-quantum-monthly') THEN 2 >= v_min_rank
    WHEN v_user_tier IN ('prana-flow', 'prana-monthly') THEN 1 >= v_min_rank
    ELSE 0 >= v_min_rank
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_access(uuid, uuid) TO authenticated;

-- Everything in the library a user actually has access to right now.
CREATE OR REPLACE FUNCTION public.get_my_library(_user_id uuid)
RETURNS SETOF public.content_vault
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cv.* FROM public.content_vault cv
  WHERE cv.is_published = true
    AND public.get_content_access(_user_id, cv.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_library(uuid) TO authenticated;


-- Let a group chat message carry an optional reference to a vault item
-- (renders as a drop card instead of a text bubble).
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS content_id uuid REFERENCES public.content_vault(id) ON DELETE SET NULL;


-- ── PRIVATE storage bucket — NOT public. Media is only ever served via a
-- short-lived signed URL from the get-content-signed-url edge function,
-- after get_content_access() has been checked server-side.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-vault',
  'content-vault',
  false,
  524288000,  -- 500MB, generous for video
  ARRAY['audio/mpeg','audio/mp4','audio/ogg','audio/wav','video/mp4','video/webm']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Admins can upload content vault media'
  ) THEN
    CREATE POLICY "Admins can upload content vault media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'content-vault' AND public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Admins can delete content vault media'
  ) THEN
    CREATE POLICY "Admins can delete content vault media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'content-vault' AND public.has_role(auth.uid(), 'admin'));
  END IF;

  -- Deliberately NO SELECT policy for regular users — reads only ever happen
  -- through the service-role key inside get-content-signed-url, never direct.
END $$;
