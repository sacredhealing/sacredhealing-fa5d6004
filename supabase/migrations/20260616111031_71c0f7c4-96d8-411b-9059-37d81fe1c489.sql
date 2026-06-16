
CREATE TABLE public.content_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_title text NOT NULL,
  content_description text,
  tier_required text NOT NULL DEFAULT 'free',
  auto_announced boolean NOT NULL DEFAULT false,
  included_in_digest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_changelog TO authenticated;
GRANT ALL ON public.content_changelog TO service_role;
ALTER TABLE public.content_changelog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage content_changelog"
  ON public.content_changelog FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER content_changelog_set_updated_at
  BEFORE UPDATE ON public.content_changelog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient_email text,
  subject text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  metadata jsonb,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read email_logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write email_logs"
  ON public.email_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX email_logs_sent_at_idx ON public.email_logs (sent_at DESC);
