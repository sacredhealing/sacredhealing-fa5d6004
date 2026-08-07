DELETE FROM public.user_memberships a
USING public.user_memberships b
WHERE a.user_id = b.user_id
  AND a.ctid < b.ctid;

ALTER TABLE public.user_memberships
  ADD CONSTRAINT user_memberships_user_id_key UNIQUE (user_id);