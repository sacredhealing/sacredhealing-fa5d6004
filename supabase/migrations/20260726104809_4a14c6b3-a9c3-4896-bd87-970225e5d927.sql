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