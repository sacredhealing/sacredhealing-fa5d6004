-- Fix generate_referral_code function to set search_path
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT COUNT(*) INTO exists_count FROM public.profiles WHERE referral_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$function$;