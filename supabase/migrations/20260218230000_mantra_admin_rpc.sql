-- Bypass PostgREST schema cache: insert/update mantras via RPC so category, planet_type, is_premium work
-- even when the API schema cache is stale.

CREATE OR REPLACE FUNCTION public.insert_mantra_admin(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  new_row jsonb;
BEGIN
  INSERT INTO public.mantras (
    title,
    description,
    audio_url,
    cover_image_url,
    duration_seconds,
    shc_reward,
    is_active,
    is_premium,
    category,
    planet_type
  ) VALUES (
    (data->>'title'),
    NULLIF(TRIM(data->>'description'), ''),
    (data->>'audio_url'),
    NULLIF(TRIM(data->>'cover_image_url'), ''),
    COALESCE((data->>'duration_seconds')::integer, 180),
    COALESCE((data->>'shc_reward')::integer, 111),
    COALESCE((data->>'is_active')::boolean, true),
    COALESCE((data->>'is_premium')::boolean, false),
    COALESCE(NULLIF(TRIM(data->>'category'), ''), 'general'),
    NULLIF(TRIM(data->>'planet_type'), '')
  )
  RETURNING id INTO new_id;

  SELECT to_jsonb(m.*) INTO new_row FROM public.mantras m WHERE m.id = new_id;
  RETURN jsonb_build_object('success', true, 'row', new_row, 'id', new_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_mantra_admin(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  updated_row jsonb;
BEGIN
  target_id := (data->>'id')::uuid;
  IF target_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing id');
  END IF;

  UPDATE public.mantras
  SET
    title = COALESCE(data->>'title', title),
    description = CASE WHEN data ? 'description' THEN NULLIF(TRIM(data->>'description'), '') ELSE description END,
    audio_url = COALESCE(data->>'audio_url', audio_url),
    cover_image_url = CASE WHEN data ? 'cover_image_url' THEN NULLIF(TRIM(data->>'cover_image_url'), '') ELSE cover_image_url END,
    duration_seconds = COALESCE((data->>'duration_seconds')::integer, duration_seconds),
    shc_reward = COALESCE((data->>'shc_reward')::integer, shc_reward),
    is_active = COALESCE((data->>'is_active')::boolean, is_active),
    is_premium = COALESCE((data->>'is_premium')::boolean, is_premium),
    category = COALESCE(NULLIF(TRIM(data->>'category'), ''), 'general'),
    planet_type = CASE WHEN data ? 'planet_type' THEN NULLIF(TRIM(data->>'planet_type'), '') ELSE planet_type END
  WHERE id = target_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mantra not found');
  END IF;

  SELECT to_jsonb(m.*) INTO updated_row FROM public.mantras m WHERE m.id = target_id;
  RETURN jsonb_build_object('success', true, 'row', updated_row);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_mantra_admin(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_mantra_admin(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_mantra_admin(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mantra_admin(jsonb) TO service_role;
