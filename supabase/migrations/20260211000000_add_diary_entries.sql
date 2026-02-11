-- Add diary-specific columns to community_posts
DO $$ 
BEGIN
  -- Add diary_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts' 
    AND column_name = 'diary_type'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD COLUMN diary_type TEXT CHECK (diary_type IN ('daily', 'weekly', 'monthly', 'yearly'));
  END IF;

  -- Add diary_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts' 
    AND column_name = 'diary_title'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD COLUMN diary_title TEXT;
  END IF;
END $$;

-- Create index for diary entries (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'community_posts' 
    AND indexname = 'idx_community_posts_diary_type'
  ) THEN
    CREATE INDEX idx_community_posts_diary_type 
    ON public.community_posts(diary_type, created_at DESC) 
    WHERE post_type = 'diary';
  END IF;
END $$;
