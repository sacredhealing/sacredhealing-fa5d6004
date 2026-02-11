-- Add diary-specific columns to community_posts
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS diary_type TEXT CHECK (diary_type IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS diary_title TEXT;

-- Create index for diary entries
CREATE INDEX IF NOT EXISTS idx_community_posts_diary_type ON public.community_posts(diary_type, created_at DESC) WHERE post_type = 'diary';
