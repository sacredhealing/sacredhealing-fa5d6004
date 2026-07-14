-- Fix: two triggers were firing on signup, sending two different welcome emails
-- (on_auth_user_created_welcome_email -> send-welcome-email, AND
--  trigger_welcome_on_signup -> welcome-email). Keep only the canonical,
-- localized, better-logged path: auth.users insert -> send-welcome-email.

DROP TRIGGER IF EXISTS trigger_welcome_on_signup ON public.profiles;
DROP FUNCTION IF EXISTS public.trigger_welcome_email() CASCADE;

-- Re-create the function under a distinct name is not needed since the
-- auth.users version (public.trigger_welcome_email defined in
-- 20260705120000_auto_welcome_email_trigger.sql) was overwritten by the
-- profiles version above (same function name, different body). Restore it.
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_name text;
  v_request_id bigint;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '');

  BEGIN
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'name', v_name,
        'language', COALESCE(NEW.raw_user_meta_data->>'language', 'en')
      )
    ) INTO v_request_id;

    INSERT INTO public.email_send_log (template_name, recipient_email, status, metadata)
    VALUES ('welcome-email', NEW.email, 'pending', jsonb_build_object('request_id', v_request_id, 'trigger', 'db'));
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.email_send_log (template_name, recipient_email, status, error_message, metadata)
    VALUES ('welcome-email', NEW.email, 'failed', SQLERRM, jsonb_build_object('trigger', 'db'));
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_welcome_email ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();
