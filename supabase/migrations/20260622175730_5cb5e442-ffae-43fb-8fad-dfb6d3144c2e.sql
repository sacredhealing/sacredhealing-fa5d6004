
CREATE OR REPLACE FUNCTION public.verify_shreem_cron_secret(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE v text;
BEGIN
  SELECT decrypted_secret INTO v FROM vault.decrypted_secrets WHERE name = 'SHREEM_CRON_SECRET' LIMIT 1;
  RETURN v IS NOT NULL AND _token = v;
END;
$$;
REVOKE ALL ON FUNCTION public.verify_shreem_cron_secret(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_shreem_cron_secret(text) TO service_role;
