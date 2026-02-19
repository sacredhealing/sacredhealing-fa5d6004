
-- Add missing columns to mantras table
ALTER TABLE public.mantras
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS planet_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Add updated_at (non-generated)
ALTER TABLE public.mantras
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_mantra_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS mantras_updated_at ON public.mantras;
CREATE TRIGGER mantras_updated_at
  BEFORE UPDATE ON public.mantras
  FOR EACH ROW EXECUTE FUNCTION public.set_mantra_updated_at();

-- RPC: insert_mantra_admin (security definer, admin only)
CREATE OR REPLACE FUNCTION public.insert_mantra_admin(data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  INSERT INTO public.mantras (title, description, audio_url, cover_image_url,
    duration_seconds, shc_reward, is_active, category, planet_type, is_premium)
  VALUES (
    data->>'title', data->>'description', data->>'audio_url', data->>'cover_image_url',
    (data->>'duration_seconds')::int, (data->>'shc_reward')::int,
    COALESCE((data->>'is_active')::boolean, true),
    COALESCE(data->>'category', 'general'),
    NULLIF(data->>'planet_type', ''),
    COALESCE((data->>'is_premium')::boolean, false)
  );
  RETURN jsonb_build_object('success', true);
END; $$;

-- RPC: update_mantra_admin (security definer, admin only)
CREATE OR REPLACE FUNCTION public.update_mantra_admin(data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  UPDATE public.mantras SET
    title = COALESCE(data->>'title', title),
    description = COALESCE(data->>'description', description),
    audio_url = COALESCE(data->>'audio_url', audio_url),
    cover_image_url = COALESCE(data->>'cover_image_url', cover_image_url),
    duration_seconds = COALESCE((data->>'duration_seconds')::int, duration_seconds),
    shc_reward = COALESCE((data->>'shc_reward')::int, shc_reward),
    is_active = COALESCE((data->>'is_active')::boolean, is_active),
    category = COALESCE(data->>'category', category),
    planet_type = NULLIF(data->>'planet_type', ''),
    is_premium = COALESCE((data->>'is_premium')::boolean, is_premium)
  WHERE id = (data->>'id')::uuid;
  RETURN jsonb_build_object('success', true);
END; $$;
