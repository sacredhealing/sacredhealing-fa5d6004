-- 1. students table
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL,
  name text NOT NULL,
  birth_date date,
  birth_time time,
  birth_place text,
  notes text,
  avatar_url text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_practitioner ON public.students(practitioner_id, archived);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practitioners view own students" ON public.students;
CREATE POLICY "Practitioners view own students" ON public.students
  FOR SELECT USING (auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "Practitioners insert own students" ON public.students;
CREATE POLICY "Practitioners insert own students" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "Practitioners update own students" ON public.students;
CREATE POLICY "Practitioners update own students" ON public.students
  FOR UPDATE USING (auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "Practitioners delete own students" ON public.students;
CREATE POLICY "Practitioners delete own students" ON public.students
  FOR DELETE USING (auth.uid() = practitioner_id);

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Allow 'student' as a codex_type
ALTER TABLE public.codex_chapters DROP CONSTRAINT IF EXISTS codex_chapters_codex_type_check;
ALTER TABLE public.codex_chapters
  ADD CONSTRAINT codex_chapters_codex_type_check
  CHECK (codex_type IN ('akasha', 'portrait', 'student'));

ALTER TABLE public.transmission_blocks DROP CONSTRAINT IF EXISTS transmission_blocks_codex_target_check;
ALTER TABLE public.transmission_blocks
  ADD CONSTRAINT transmission_blocks_codex_target_check
  CHECK (codex_target IN ('akasha', 'portrait', 'split', 'excluded', 'student'));

-- 3. Link chapters and transmissions to a student (NULL for akasha/portrait)
ALTER TABLE public.codex_chapters
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.transmission_blocks
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chapter_student ON public.codex_chapters(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transmission_student ON public.transmission_blocks(student_id) WHERE student_id IS NOT NULL;
