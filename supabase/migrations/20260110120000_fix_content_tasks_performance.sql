-- ============================================
-- Performance Optimization for content_tasks
-- ============================================
-- Fixes loading issues by adding missing indexes and optimizing triggers

-- Check if table exists before adding indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_tasks'
  ) THEN
    -- Add composite indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_content_tasks_status_category 
      ON public.content_tasks(status, category);

    CREATE INDEX IF NOT EXISTS idx_content_tasks_status_source_type 
      ON public.content_tasks(status, source_type);

    CREATE INDEX IF NOT EXISTS idx_content_tasks_category_status 
      ON public.content_tasks(category, status);

    -- Add index on created_at for ordering queries
    CREATE INDEX IF NOT EXISTS idx_content_tasks_created_at 
      ON public.content_tasks(created_at DESC);

    -- Add index on uploaded_to_id for foreign key lookups
    CREATE INDEX IF NOT EXISTS idx_content_tasks_uploaded_to_id 
      ON public.content_tasks(uploaded_to_id) 
      WHERE uploaded_to_id IS NOT NULL;

    -- Add composite index for status filtering with source_id
    CREATE INDEX IF NOT EXISTS idx_content_tasks_status_source_id 
      ON public.content_tasks(status, source_type, source_id) 
      WHERE source_id IS NOT NULL;

    -- Add index on path_day_number for path queries
    CREATE INDEX IF NOT EXISTS idx_content_tasks_path_day_number 
      ON public.content_tasks(path_id, path_day_number) 
      WHERE path_id IS NOT NULL AND path_day_number IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- Optimize trigger functions
-- ============================================

-- Optimize check_meditation_upload_completion to use more efficient joins
CREATE OR REPLACE FUNCTION check_meditation_upload_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if audio_url is being set (not empty)
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url != '' THEN
    -- Use a single UPDATE with JOIN instead of EXISTS subqueries for better performance
    UPDATE public.content_tasks ct
    SET 
      status = 'uploaded',
      completed_at = now(),
      updated_at = now(),
      uploaded_to_id = NEW.id
    FROM public.spiritual_path_days pd
    WHERE 
      ct.status IN ('not_recorded', 'recorded')
      AND ct.source_type = 'path_day'
      AND ct.source_id = pd.id
      AND (pd.morning_meditation_id = NEW.id OR pd.evening_meditation_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimize create_path_day_task to batch operations
CREATE OR REPLACE FUNCTION create_path_day_task()
RETURNS TRIGGER AS $$
DECLARE
  path_info RECORD;
  task_title TEXT;
  destination_path TEXT;
BEGIN
  -- Get path information once
  SELECT title, slug INTO path_info
  FROM public.spiritual_paths
  WHERE id = NEW.path_id
  LIMIT 1;
  
  -- Only proceed if path exists
  IF path_info.title IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create task title and destination path once
  task_title := path_info.title || ' - Day ' || NEW.day_number || ': ' || COALESCE(NEW.title, 'Untitled');
  destination_path := 'Path → ' || path_info.title || ' → Day ' || NEW.day_number;
  
  -- Batch insert for both morning and evening tasks if needed
  IF NEW.morning_meditation_id IS NULL THEN
    BEGIN
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
        10,
        'free',
        destination_path || ' → Morning'
      );
    EXCEPTION WHEN unique_violation THEN
      -- Task already exists, ignore
      NULL;
    END;
  END IF;
  
  IF NEW.evening_meditation_id IS NULL THEN
    BEGIN
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
        10,
        'free',
        destination_path || ' → Evening'
      );
    EXCEPTION WHEN unique_violation THEN
      -- Task already exists, ignore
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimize create_course_lesson_task
CREATE OR REPLACE FUNCTION create_course_lesson_task()
RETURNS TRIGGER AS $$
DECLARE
  course_info RECORD;
  task_title TEXT;
  destination_path TEXT;
BEGIN
  -- Only create task if content_url is empty
  IF NEW.content_url IS NULL OR NEW.content_url = '' THEN
    -- Get course information once
    SELECT title, is_premium_only INTO course_info
    FROM public.courses
    WHERE id = NEW.course_id
    LIMIT 1;
    
    -- Only proceed if course exists
    IF course_info.title IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Create task title and destination path
    task_title := course_info.title || ' - Lesson ' || NEW.order_index || ': ' || NEW.title;
    destination_path := 'Course → ' || course_info.title || ' → Lesson ' || NEW.order_index;
    
    BEGIN
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
        CASE WHEN course_info.is_premium_only THEN 'premium' ELSE 'free' END,
        destination_path
      );
    EXCEPTION WHEN unique_violation THEN
      -- Task already exists, ignore
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add index on spiritual_path_days for faster joins in triggers
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'spiritual_path_days'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_spiritual_path_days_meditation_ids 
      ON public.spiritual_path_days(morning_meditation_id, evening_meditation_id) 
      WHERE morning_meditation_id IS NOT NULL OR evening_meditation_id IS NOT NULL;
  END IF;
END $$;

-- Analyze tables to update statistics for query planner
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_tasks'
  ) THEN
    ANALYZE public.content_tasks;
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'spiritual_path_days'
  ) THEN
    ANALYZE public.spiritual_path_days;
  END IF;
END $$;

