-- Create announcements table for admin messages
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, promotion
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can view active announcements
CREATE POLICY "Anyone can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));

-- Track which users have dismissed which announcements
CREATE TABLE public.announcement_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Users can view their own dismissals
CREATE POLICY "Users can view own dismissals"
ON public.announcement_dismissals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can dismiss announcements
CREATE POLICY "Users can dismiss announcements"
ON public.announcement_dismissals
FOR INSERT
WITH CHECK (auth.uid() = user_id);