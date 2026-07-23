-- Content Vault: paid content drops with per-item pricing, purchase tracking, and gated Storage access.
-- Bucket `content-vault` is created separately (private).

-- ==========================================================
-- 1. content_vault (catalog)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.content_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'file' CHECK (content_type IN ('file','audio','video','image','pdf','archive')),
  storage_path text NOT NULL,           -- path inside `content-vault` bucket
  mime_type text,
  file_size_bytes bigint,
  duration_seconds integer,
  thumbnail_url text,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'eur' CHECK (char_length(currency) = 3),
  is_published boolean NOT NULL DEFAULT true,
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free','prana-flow','siddha-quantum','akasha-infinity')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.content_vault TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_vault TO authenticated;
GRANT ALL ON public.content_vault TO service_role;

ALTER TABLE public.content_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_vault_select_published" ON public.content_vault;
CREATE POLICY "content_vault_select_published"
  ON public.content_vault FOR SELECT
  USING (is_published = true OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "content_vault_admin_write" ON public.content_vault;
CREATE POLICY "content_vault_admin_write"
  ON public.content_vault FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_content_vault_owner ON public.content_vault(owner_id);
CREATE INDEX IF NOT EXISTS idx_content_vault_published ON public.content_vault(is_published, created_at DESC);

DROP TRIGGER IF EXISTS trg_content_vault_updated_at ON public.content_vault;
CREATE TRIGGER trg_content_vault_updated_at
  BEFORE UPDATE ON public.content_vault
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================================
-- 2. content_vault_purchases (ledger)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.content_vault_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content_vault(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','failed')),
  purchased_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

GRANT SELECT ON public.content_vault_purchases TO authenticated;
GRANT ALL ON public.content_vault_purchases TO service_role;

ALTER TABLE public.content_vault_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cvp_select_own" ON public.content_vault_purchases;
CREATE POLICY "cvp_select_own"
  ON public.content_vault_purchases FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- No client-side INSERT/UPDATE: only edge functions (service_role) may write.

CREATE INDEX IF NOT EXISTS idx_cvp_user ON public.content_vault_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_cvp_content ON public.content_vault_purchases(content_id);

DROP TRIGGER IF EXISTS trg_cvp_updated_at ON public.content_vault_purchases;
CREATE TRIGGER trg_cvp_updated_at
  BEFORE UPDATE ON public.content_vault_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================================
-- 3. Access helper: get_content_access(content_id)
--    Returns whether the caller may unlock a given item.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.get_content_access(p_content_id uuid)
RETURNS TABLE (
  has_access boolean,
  reason text,
  price_cents integer,
  currency text,
  title text,
  storage_path text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.content_vault%ROWTYPE;
  v_uid uuid := auth.uid();
  v_tier_level int;
  v_required_level int;
  v_paid boolean;
BEGIN
  SELECT * INTO v_item FROM public.content_vault WHERE id = p_content_id;
  IF NOT FOUND OR v_item.is_published = false THEN
    RETURN QUERY SELECT false, 'not_found', 0, 'eur'::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- Owner / admin bypass
  IF v_uid IS NOT NULL AND (v_item.owner_id = v_uid OR public.has_role(v_uid, 'admin'::app_role)) THEN
    RETURN QUERY SELECT true, 'owner_or_admin', v_item.price_cents, v_item.currency, v_item.title, v_item.storage_path;
    RETURN;
  END IF;

  -- Tier gating
  v_required_level := public.tier_name_to_level(v_item.tier_required);
  v_tier_level := COALESCE(public.current_user_tier_level(), 0);

  IF v_required_level > v_tier_level THEN
    RETURN QUERY SELECT false, 'tier_required', v_item.price_cents, v_item.currency, v_item.title, NULL::text;
    RETURN;
  END IF;

  -- Free item after tier check
  IF v_item.price_cents = 0 THEN
    RETURN QUERY SELECT true, 'free', 0, v_item.currency, v_item.title, v_item.storage_path;
    RETURN;
  END IF;

  -- Paid check
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'auth_required', v_item.price_cents, v_item.currency, v_item.title, NULL::text;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.content_vault_purchases
    WHERE user_id = v_uid AND content_id = p_content_id AND status = 'paid'
  ) INTO v_paid;

  IF v_paid THEN
    RETURN QUERY SELECT true, 'purchased', v_item.price_cents, v_item.currency, v_item.title, v_item.storage_path;
  ELSE
    RETURN QUERY SELECT false, 'payment_required', v_item.price_cents, v_item.currency, v_item.title, NULL::text;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_access(uuid) TO anon, authenticated;

-- ==========================================================
-- 4. Library helper: get_my_library()
-- ==========================================================
CREATE OR REPLACE FUNCTION public.get_my_library()
RETURNS TABLE (
  content_id uuid,
  title text,
  description text,
  content_type text,
  thumbnail_url text,
  mime_type text,
  duration_seconds integer,
  purchased_at timestamptz,
  amount_cents integer,
  currency text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cv.id, cv.title, cv.description, cv.content_type, cv.thumbnail_url,
    cv.mime_type, cv.duration_seconds,
    p.purchased_at, p.amount_cents, p.currency
  FROM public.content_vault_purchases p
  JOIN public.content_vault cv ON cv.id = p.content_id
  WHERE p.user_id = auth.uid() AND p.status = 'paid'
  ORDER BY p.purchased_at DESC NULLS LAST, p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_library() TO authenticated;

-- ==========================================================
-- 5. Storage RLS on content-vault bucket
--    Reads go only through edge function (service_role). Admins may upload directly.
-- ==========================================================
DROP POLICY IF EXISTS "content_vault_admin_upload" ON storage.objects;
CREATE POLICY "content_vault_admin_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-vault' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "content_vault_admin_update" ON storage.objects;
CREATE POLICY "content_vault_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'content-vault' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "content_vault_admin_delete" ON storage.objects;
CREATE POLICY "content_vault_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-vault' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "content_vault_admin_read" ON storage.objects;
CREATE POLICY "content_vault_admin_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'content-vault' AND public.has_role(auth.uid(), 'admin'::app_role));
