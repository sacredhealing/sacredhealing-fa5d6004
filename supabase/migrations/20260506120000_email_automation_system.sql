-- SQI email automation: content_changelog, email_logs, announcement hook, welcome trigger
-- Requires pg_net for welcome trigger HTTP call

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS content_changelog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT NOT NULL CHECK (content_type IN (
                    'meditation','beat','song','course','mantra',
                    'feature','announcement','tool'
                  )),
  content_id      TEXT,
  content_title   TEXT NOT NULL,
  content_description TEXT,
  content_cover_url   TEXT,
  tier_required   TEXT DEFAULT 'free',
  auto_announced  BOOLEAN DEFAULT false,
  included_in_digest BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type      TEXT NOT NULL,
  recipient_email TEXT,
  recipient_id    UUID,
  subject         TEXT,
  status          TEXT DEFAULT 'sent',
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  sent_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access content_changelog" ON content_changelog;
CREATE POLICY "Admin full access content_changelog" ON content_changelog
  FOR ALL USING (public.is_admin_v3());

DROP POLICY IF EXISTS "Admin full access email_logs" ON email_logs;
CREATE POLICY "Admin full access email_logs" ON email_logs
  FOR ALL USING (public.is_admin_v3());

CREATE OR REPLACE FUNCTION auto_create_announcement()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO announcements (title, content, type, is_active, created_at)
    VALUES (
      '✨ New ' || INITCAP(REPLACE(NEW.content_type, '_', ' ')) || ': ' || NEW.content_title,
      COALESCE(NEW.content_description,
        'A new ' || NEW.content_type || ' has been transmitted into the Nexus. Enter the app to experience it.'),
      NEW.content_type,
      true,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_auto_announce ON content_changelog;
CREATE TRIGGER trigger_auto_announce
  AFTER INSERT ON content_changelog
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_announcement();

CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  fn_url TEXT;
  user_email TEXT;
  fn_first TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id LIMIT 1;
  IF user_email IS NULL OR user_email = '' THEN
    RETURN NEW;
  END IF;

  fn_url := current_setting('app.supabase_functions_url', true) || '/welcome-email';

  fn_first := COALESCE(
    NEW.first_name,
    split_part(COALESCE(NEW.full_name, ''), ' ', 1)
  );

  PERFORM net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := jsonb_build_object(
      'user_id',    NEW.user_id::text,
      'email',      user_email,
      'first_name', NULLIF(trim(fn_first), '')
    )::text
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_welcome_on_signup ON profiles;
CREATE TRIGGER trigger_welcome_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();

COMMENT ON FUNCTION trigger_welcome_email() IS 'Requires ALTER DATABASE settings app.supabase_functions_url and app.service_role_key. Coordinate with client send-welcome-email to avoid duplicate welcomes.';
