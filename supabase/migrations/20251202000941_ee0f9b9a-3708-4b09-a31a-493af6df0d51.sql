-- Support Requests table for questions, video suggestions, healing blessings
CREATE TABLE public.support_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('question', 'video_suggestion', 'healing_blessing')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  recipient_name TEXT, -- For healing blessings, the name of the person needing healing
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  support_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support/Prayer tracking
CREATE TABLE public.request_supports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.support_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_supports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_requests
CREATE POLICY "Anyone can view requests" ON public.support_requests FOR SELECT USING (true);
CREATE POLICY "Users can create requests" ON public.support_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own requests" ON public.support_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own requests" ON public.support_requests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for request_supports
CREATE POLICY "Anyone can view supports" ON public.request_supports FOR SELECT USING (true);
CREATE POLICY "Users can support requests" ON public.request_supports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove support" ON public.request_supports FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_requests_category ON public.support_requests(category);
CREATE INDEX idx_requests_created_at ON public.support_requests(created_at DESC);