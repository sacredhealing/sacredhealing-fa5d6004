-- Create live_streams table
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'live',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live_stream_messages table for real-time chat
CREATE TABLE public.live_stream_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_streams
CREATE POLICY "Anyone can view live streams" 
ON public.live_streams 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create live streams" 
ON public.live_streams 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update their own streams" 
ON public.live_streams 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete their own streams" 
ON public.live_streams 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for live_stream_messages
CREATE POLICY "Anyone can view stream messages" 
ON public.live_stream_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.live_stream_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live stream messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_messages;