-- Add missing video URLs to Supercharger course lessons
-- Course: ⚡ Supercharger: The 8-Video Energy Recharging System 🇸🇪
-- 
-- INSTRUCTIONS:
-- 1. Replace the placeholder URLs below with actual YouTube/video URLs
-- 2. Run this migration: supabase db execute --file supabase/migrations/20260212135626_add_missing_supercharger_videos.sql
-- 3. Or update via admin interface at /admin/courses
--
-- Missing videos identified from screenshots:
-- - Lesson 4: Kriya Meditation (shows "Content Coming Soon")
-- - One other lesson (to be identified)

DO $$
DECLARE
  course_id_var UUID;
  lesson_4_id UUID;
  lesson_other_id UUID;
  lesson_4_title TEXT := 'Kriya Meditation';
  -- TODO: Replace these with actual video URLs
  lesson_4_video_url TEXT := 'REPLACE_WITH_KRIYA_MEDITATION_VIDEO_URL'; -- e.g., 'https://www.youtube.com/watch?v=...'
  lesson_other_video_url TEXT := 'REPLACE_WITH_SECOND_MISSING_VIDEO_URL'; -- e.g., 'https://www.youtube.com/watch?v=...'
BEGIN
  -- Find the Supercharger course
  SELECT id INTO course_id_var
  FROM public.courses
  WHERE title ILIKE '%Supercharger%' OR title ILIKE '%supercharger%'
  LIMIT 1;

  IF course_id_var IS NULL THEN
    RAISE EXCEPTION 'Course "Supercharger" not found';
  END IF;

  -- Find Lesson 4: Kriya Meditation (missing video)
  SELECT id INTO lesson_4_id
  FROM public.lessons
  WHERE course_id = course_id_var
    AND title = lesson_4_title
    AND (content_url IS NULL OR content_url = '' OR content_url = 'Content Coming Soon')
  LIMIT 1;

  -- Update Lesson 4 with video URL
  IF lesson_4_id IS NOT NULL AND lesson_4_video_url NOT LIKE 'REPLACE_WITH%' THEN
    UPDATE public.lessons
    SET content_url = lesson_4_video_url
    WHERE id = lesson_4_id;
    
    RAISE NOTICE 'Updated Kriya Meditation (Lesson 4) with video URL';
  ELSIF lesson_4_id IS NULL THEN
    RAISE NOTICE 'Kriya Meditation lesson not found or already has content_url';
  ELSE
    RAISE NOTICE 'Skipping Kriya Meditation - video URL not provided (still contains REPLACE_WITH)';
  END IF;

  -- Find other lessons missing content_url
  SELECT id INTO lesson_other_id
  FROM public.lessons
  WHERE course_id = course_id_var
    AND id != COALESCE(lesson_4_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND (content_url IS NULL OR content_url = '' OR content_url = 'Content Coming Soon')
    AND content_type = 'video'
  ORDER BY order_index
  LIMIT 1;

  -- Update the other missing lesson
  IF lesson_other_id IS NOT NULL AND lesson_other_video_url NOT LIKE 'REPLACE_WITH%' THEN
    UPDATE public.lessons
    SET content_url = lesson_other_video_url
    WHERE id = lesson_other_id;
    
    RAISE NOTICE 'Updated second missing lesson with video URL';
  ELSIF lesson_other_id IS NULL THEN
    RAISE NOTICE 'No other lessons found missing content_url';
  ELSE
    RAISE NOTICE 'Skipping second lesson - video URL not provided (still contains REPLACE_WITH)';
  END IF;

END $$;
