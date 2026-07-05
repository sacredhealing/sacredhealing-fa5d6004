-- Automatic, server-side welcome email trigger.
-- Previously send-welcome-email was only invoked from the client (Auth.tsx) right
-- after signUp(), with errors only console.error'd. If the browser tab closed early,
-- the invoke failed, or the domain wasn't verified in Resend, the email silently
-- never sent and nothing was recorded.
--
-- This moves triggering to the database: it fires on every auth.users insert
-- regardless of what the client does, and every attempt is logged to
-- public.email_send_log so failures are visible and queryable.

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
    -- Never block signup if the email dispatch fails to enqueue.
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
