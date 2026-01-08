-- ============================================
-- Content Roadmap Task Management System
-- ============================================
-- This system automatically tracks recording tasks for all content
-- and auto-completes when content is uploaded

-- Create content_tasks table
CREATE TABLE IF NOT EXISTS public.content_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Task identification
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('daily_ritual', 'path', 'premium_healing', 'course', 'meditation')),
  
  -- Source content reference (polymorphic)
  source_type TEXT NOT NULL CHECK (source_type IN ('path_day', 'healing_audio', 'course_lesson', 'daily_ritual', 'meditation')),
  source_id UUID, -- References the source record (path_day.id, course.id, etc.)
  
  -- Path-specific (if applicable)
  path_id UUID REFERENCES public.spiritual_paths(id) ON DELETE CASCADE,
  path_day_number INTEGER,
  
  -- Task details
  length_target_minutes INTEGER, -- e.g., 8-10 min
  access_level TEXT NOT NULL DEFAULT 'free' CHECK (access_level IN ('free', 'premium')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'not_recorded' CHECK (status IN ('not_recorded', 'recorded', 'uploaded')),
  
  -- Destination information (human-readable)
  destination_path TEXT NOT NULL, -- e.g., "Daily → Morning" or "Path → Inner Peace → Day 3"
  
  -- Recording notes (optional)
  recording_notes TEXT, -- Tone reminders, script notes, etc.
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  uploaded_to_id UUID, -- ID of the meditation/healing_audio that was uploaded
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_tasks_status ON public.content_tasks(status);
CREATE INDEX IF NOT EXISTS idx_content_tasks_category ON public.content_tasks(category);
CREATE INDEX IF NOT EXISTS idx_content_tasks_path ON public.content_tasks(path_id) WHERE path_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_tasks_source ON public.content_tasks(source_type, source_id);

-- Prevent duplicate tasks for same source (using partial unique index to handle NULLs properly)
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_tasks_unique_path_day
ON public.content_tasks(source_type, source_id, path_id, path_day_number)
WHERE source_type = 'path_day' AND source_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_tasks_unique_healing
ON public.content_tasks(source_type, source_id)
WHERE source_type = 'healing_audio' AND source_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_tasks_unique_course_lesson
ON public.content_tasks(source_type, source_id)
WHERE source_type = 'course_lesson' AND source_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.content_tasks ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage tasks
CREATE POLICY "Admins can manage content tasks" ON public.content_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_tasks_timestamp
  BEFORE UPDATE ON public.content_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_content_tasks_updated_at();

-- ============================================
-- AUTO-GENERATION FUNCTIONS
-- ============================================

-- Function to create task for a new path day
CREATE OR REPLACE FUNCTION create_path_day_task()
RETURNS TRIGGER AS $$
DECLARE
  path_title TEXT;
  path_slug TEXT;
  task_title TEXT;
  destination_path TEXT;
BEGIN
  -- Get path information
  SELECT title, slug INTO path_title, path_slug
  FROM public.spiritual_paths
  WHERE id = NEW.path_id;
  
  -- Create task title
  task_title := path_title || ' - Day ' || NEW.day_number || ': ' || COALESCE(NEW.title, 'Untitled');
  
  -- Create destination path
  destination_path := 'Path → ' || path_title || ' → Day ' || NEW.day_number;
  
  -- Create tasks for morning and evening meditations if they don't exist
  IF NEW.morning_meditation_id IS NULL THEN
    INSERT INTO public.content_tasks (
      title,
      category,
      source_type,
      source_id,
      path_id,
      path_day_number,
      length_target_minutes,
      access_level,
      destination_path
    ) VALUES (
      task_title || ' (Morning)',
      'path',
      'path_day',
      NEW.id,
      NEW.path_id,
      NEW.day_number,
      10, -- Default 10 minutes
      'free',
      destination_path || ' → Morning'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF NEW.evening_meditation_id IS NULL THEN
    INSERT INTO public.content_tasks (
      title,
      category,
      source_type,
      source_id,
      path_id,
      path_day_number,
      length_target_minutes,
      access_level,
      destination_path
    ) VALUES (
      task_title || ' (Evening)',
      'path',
      'path_day',
      NEW.id,
      NEW.path_id,
      NEW.day_number,
      10, -- Default 10 minutes
      'free',
      destination_path || ' → Evening'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create tasks when path days are created
CREATE TRIGGER auto_create_path_day_tasks
  AFTER INSERT ON public.spiritual_path_days
  FOR EACH ROW
  EXECUTE FUNCTION create_path_day_task();

-- Function to create task for new course lesson
CREATE OR REPLACE FUNCTION create_course_lesson_task()
RETURNS TRIGGER AS $$
DECLARE
  course_title TEXT;
  task_title TEXT;
  destination_path TEXT;
BEGIN
  -- Get course information
  SELECT title INTO course_title
  FROM public.courses
  WHERE id = NEW.course_id;
  
  -- Create task title
  task_title := course_title || ' - Lesson ' || NEW.order_index || ': ' || NEW.title;
  
  -- Create destination path
  destination_path := 'Course → ' || course_title || ' → Lesson ' || NEW.order_index;
  
  -- Create task if content_url is empty
  IF NEW.content_url IS NULL OR NEW.content_url = '' THEN
    INSERT INTO public.content_tasks (
      title,
      category,
      source_type,
      source_id,
      length_target_minutes,
      access_level,
      destination_path
    ) VALUES (
      task_title,
      'course',
      'course_lesson',
      NEW.id,
      NEW.duration_minutes,
      CASE WHEN EXISTS (SELECT 1 FROM public.courses WHERE id = NEW.course_id AND is_premium_only = true) THEN 'premium' ELSE 'free' END,
      destination_path
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create tasks when course lessons are created
CREATE TRIGGER auto_create_course_lesson_tasks
  AFTER INSERT ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION create_course_lesson_task();

-- Function to create task for new healing audio
CREATE OR REPLACE FUNCTION create_healing_audio_task()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
  destination_path TEXT;
BEGIN
  -- Only create task if audio_url is empty
  IF NEW.audio_url IS NULL OR NEW.audio_url = '' THEN
    task_title := NEW.title;
    destination_path := 'Healing → ' || COALESCE(NEW.category, 'General') || ' → ' || NEW.title;
    
    INSERT INTO public.content_tasks (
      title,
      category,
      source_type,
      source_id,
      length_target_minutes,
      access_level,
      destination_path
    ) VALUES (
      task_title,
      'premium_healing',
      'healing_audio',
      NEW.id,
      CEIL(NEW.duration_seconds / 60.0),
      CASE WHEN NEW.is_free THEN 'free' ELSE 'premium' END,
      destination_path
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create tasks when healing audio is created
CREATE TRIGGER auto_create_healing_audio_tasks
  AFTER INSERT ON public.healing_audio
  FOR EACH ROW
  EXECUTE FUNCTION create_healing_audio_task();

-- ============================================
-- AUTO-COMPLETION FUNCTIONS
-- ============================================

-- Function to check and complete tasks when meditations are uploaded
CREATE OR REPLACE FUNCTION check_meditation_upload_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if audio_url is being set (not empty)
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url != '' THEN
    -- Check if this meditation matches any path day tasks
    UPDATE public.content_tasks
    SET 
      status = 'uploaded',
      completed_at = now(),
      uploaded_to_id = NEW.id
    WHERE 
      status IN ('not_recorded', 'recorded')
      AND (
        -- Match by path day morning meditation
        (source_type = 'path_day' AND EXISTS (
          SELECT 1 FROM public.spiritual_path_days 
          WHERE id = content_tasks.source_id 
          AND morning_meditation_id = NEW.id
        ))
        OR
        -- Match by path day evening meditation
        (source_type = 'path_day' AND EXISTS (
          SELECT 1 FROM public.spiritual_path_days 
          WHERE id = content_tasks.source_id 
          AND evening_meditation_id = NEW.id
        ))
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete when meditation is uploaded
CREATE TRIGGER auto_complete_meditation_tasks
  AFTER UPDATE OF audio_url ON public.meditations
  FOR EACH ROW
  WHEN (NEW.audio_url IS DISTINCT FROM OLD.audio_url AND NEW.audio_url IS NOT NULL AND NEW.audio_url != '')
  EXECUTE FUNCTION check_meditation_upload_completion();

-- Function to check and complete tasks when healing audio is uploaded
CREATE OR REPLACE FUNCTION check_healing_audio_upload_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if audio_url is being set (not empty)
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url != '' THEN
    -- Complete the task for this healing audio
    UPDATE public.content_tasks
    SET 
      status = 'uploaded',
      completed_at = now(),
      uploaded_to_id = NEW.id
    WHERE 
      source_type = 'healing_audio'
      AND source_id = NEW.id
      AND status IN ('not_recorded', 'recorded');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete when healing audio is uploaded
CREATE TRIGGER auto_complete_healing_audio_tasks
  AFTER UPDATE OF audio_url ON public.healing_audio
  FOR EACH ROW
  WHEN (NEW.audio_url IS DISTINCT FROM OLD.audio_url AND NEW.audio_url IS NOT NULL AND NEW.audio_url != '')
  EXECUTE FUNCTION check_healing_audio_upload_completion();

-- Function to check and complete tasks when course lesson content is uploaded
CREATE OR REPLACE FUNCTION check_course_lesson_upload_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if content_url is being set (not empty)
  IF NEW.content_url IS NOT NULL AND NEW.content_url != '' THEN
    -- Complete the task for this lesson
    UPDATE public.content_tasks
    SET 
      status = 'uploaded',
      completed_at = now(),
      uploaded_to_id = NEW.id
    WHERE 
      source_type = 'course_lesson'
      AND source_id = NEW.id
      AND status IN ('not_recorded', 'recorded');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete when course lesson content is uploaded
CREATE TRIGGER auto_complete_course_lesson_tasks
  AFTER UPDATE OF content_url ON public.lessons
  FOR EACH ROW
  WHEN (NEW.content_url IS DISTINCT FROM OLD.content_url AND NEW.content_url IS NOT NULL AND NEW.content_url != '')
  EXECUTE FUNCTION check_course_lesson_upload_completion();

-- ============================================
-- HELPER FUNCTION: Get progress stats
-- ============================================

CREATE OR REPLACE FUNCTION get_content_roadmap_progress()
RETURNS TABLE (
  category TEXT,
  total INTEGER,
  completed INTEGER,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.category::TEXT,
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE ct.status = 'uploaded')::INTEGER as completed,
    ROUND(
      (COUNT(*) FILTER (WHERE ct.status = 'uploaded')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100,
      1
    ) as percentage
  FROM public.content_tasks ct
  GROUP BY ct.category
  ORDER BY 
    CASE ct.category
      WHEN 'daily_ritual' THEN 1
      WHEN 'path' THEN 2
      WHEN 'premium_healing' THEN 3
      WHEN 'course' THEN 4
      WHEN 'meditation' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
