-- ============================================================================
-- PRIVACY FIX: private session recordings were visible to EVERY member
-- ============================================================================
-- Right now content_vault's SELECT policy is just "is_published = true OR
-- admin" — meaning a private 1-on-1 call recording between an admin and
-- one member is currently visible to ALL 96+ members on /videos. This
-- replaces that policy so private-session-recording items are restricted
-- to: the admin who hosted it, the specific member who was on the call,
-- or any admin. Every other content_vault item (regular uploads, Divine
-- Sangha live recordings) keeps exactly the same visibility as before —
-- this only tightens the one category that needed it.
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view published content" ON public.content_vault;

CREATE POLICY "Anyone can view published content"
ON public.content_vault FOR SELECT
USING (
  is_published = true
  AND (
    -- Not a private session recording — normal visibility, unchanged.
    (metadata->>'category') IS DISTINCT FROM 'private-session-recording'
    -- The admin who hosted the call.
    OR auth.uid() = owner_id
    -- The specific member who was actually on the call.
    OR (metadata->>'partner_user_id') = auth.uid()::text
    -- Any admin (so e.g. Laila can see Kritagya's private sessions too).
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Same restriction applied to the SECURITY DEFINER lookup function used by
-- chat drop cards — closes the gap where posting a private-session video
-- to a group chat (via the admin panel's "Post to Chat") could otherwise
-- let the drop card bypass this restriction entirely.
CREATE OR REPLACE FUNCTION public.get_content_vault_items(_ids uuid[])
RETURNS SETOF public.content_vault
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.content_vault
  WHERE id = ANY(_ids)
    AND is_published = true
    AND (
      (metadata->>'category') IS DISTINCT FROM 'private-session-recording'
      OR auth.uid() = owner_id
      OR (metadata->>'partner_user_id') = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_content_vault_items(uuid[]) TO authenticated;
