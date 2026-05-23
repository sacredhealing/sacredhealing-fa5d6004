-- Step 1: Add link columns to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_user_email text;

-- Step 2: Search function (using jyotish_profiles, not jyotish_charts)
CREATE OR REPLACE FUNCTION public.search_app_users(search_term text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  has_jyotish boolean,
  has_ayurveda boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.full_name,
    u.email::text,
    EXISTS(SELECT 1 FROM public.jyotish_profiles j WHERE j.user_id = p.user_id) AS has_jyotish,
    EXISTS(SELECT 1 FROM public.ayurveda_profiles a WHERE a.user_id = p.user_id) AS has_ayurveda
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE
    (p.full_name ILIKE '%' || search_term || '%' OR u.email ILIKE '%' || search_term || '%')
    AND public.has_role(auth.uid(), 'admin'::app_role)
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.search_app_users(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_app_users(text) TO authenticated;