ALTER TABLE codex_chapters ADD COLUMN IF NOT EXISTS subject_key text;
CREATE INDEX IF NOT EXISTS idx_chapters_subject_key
  ON codex_chapters(user_id, codex_type, subject_key);