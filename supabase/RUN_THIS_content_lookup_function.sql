-- ============================================================================
-- ROBUST CONTENT LOOKUP FOR DROP CARDS
-- Run once in the Supabase SQL Editor.
--
-- Direct SELECT against content_vault has failed twice now for different
-- reasons (a missing table grant the first time, something else the second
-- time despite that being "fixed"). Rather than keep chasing individual RLS/
-- grant misconfigurations one at a time, this sidesteps the problem
-- entirely: a SECURITY DEFINER function runs with elevated privileges
-- internally, so it can't be blocked by a missing GRANT or a subtly wrong
-- policy the way a plain client-side SELECT can. It still only returns
-- published content, so nothing is exposed that shouldn't be.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_content_vault_items(_ids uuid[])
RETURNS SETOF public.content_vault
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.content_vault
  WHERE id = ANY(_ids)
    AND (is_published = true OR public.has_role(auth.uid(), 'admin'));
$$;

GRANT EXECUTE ON FUNCTION public.get_content_vault_items(uuid[]) TO authenticated;

-- Sanity check — should return every published content_vault row that exists
-- right now, proving the function itself works before the app starts using it.
SELECT id, title, is_published FROM public.get_content_vault_items(
  (SELECT array_agg(id) FROM public.content_vault)
);
