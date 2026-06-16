-- weekly_email_content: stores AI-generated email copy each week
CREATE TABLE IF NOT EXISTS weekly_email_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      DATE NOT NULL,
  email_type      TEXT NOT NULL CHECK (email_type IN ('monday', 'friday')),
  subject         TEXT,
  personal_opening TEXT,
  content_intro   TEXT,
  closing         TEXT,
  laila_opening   TEXT,
  laila_body      TEXT,
  laila_closing   TEXT,
  kritagya_addition TEXT,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_start, email_type)
);

ALTER TABLE weekly_email_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON weekly_email_content;
CREATE POLICY "Service role full access" ON weekly_email_content
  FOR ALL USING (auth.role() = 'service_role');
