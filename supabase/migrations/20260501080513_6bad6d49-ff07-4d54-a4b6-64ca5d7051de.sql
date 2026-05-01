
-- Add required_tier column for 4-tier access (0=Free, 1=Prana-Flow, 2=Siddha-Quantum, 3=Akasha-Infinity)
ALTER TABLE public.mantras
  ADD COLUMN IF NOT EXISTS required_tier integer NOT NULL DEFAULT 0;

-- Backfill from existing is_premium boolean: premium → Prana-Flow (rank 1), free → 0
UPDATE public.mantras
  SET required_tier = CASE WHEN is_premium = true THEN 1 ELSE 0 END;

-- Update insert RPC to accept required_tier
CREATE OR REPLACE FUNCTION public.insert_mantra_admin(data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  INSERT INTO public.mantras (title, description, audio_url, cover_image_url,
    duration_seconds, shc_reward, is_active, category, planet_type, is_premium, required_tier)
  VALUES (
    data->>'title', data->>'description', data->>'audio_url', data->>'cover_image_url',
    (data->>'duration_seconds')::int, (data->>'shc_reward')::int,
    COALESCE((data->>'is_active')::boolean, true),
    COALESCE(data->>'category', 'general'),
    NULLIF(data->>'planet_type', ''),
    COALESCE((data->>'required_tier')::int, 0) > 0,
    COALESCE((data->>'required_tier')::int, 0)
  );
  RETURN jsonb_build_object('success', true);
END; $function$;

-- Update update RPC to accept required_tier
CREATE OR REPLACE FUNCTION public.update_mantra_admin(data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_tier int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  new_tier := NULLIF(data->>'required_tier','')::int;
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
    required_tier = COALESCE(new_tier, required_tier),
    is_premium = COALESCE(
      CASE WHEN new_tier IS NOT NULL THEN (new_tier > 0) ELSE NULL END,
      (data->>'is_premium')::boolean,
      is_premium
    )
  WHERE id = (data->>'id')::uuid;
  RETURN jsonb_build_object('success', true);
END; $function$;
