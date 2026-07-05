-- Update welcome-email trigger to also pass user_id, so the edge function can
-- look up the profile (membership tier, created_at) and generate a magic login
-- link, instead of only sending name/email/language.

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
        'user_id', NEW.id,
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
