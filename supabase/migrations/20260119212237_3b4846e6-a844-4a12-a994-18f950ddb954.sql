-- Create table to store user dosha profiles (Prakriti)
CREATE TABLE public.ayurveda_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_profile JSONB NOT NULL,
  dosha_profile JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ayurveda_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own ayurveda profile"
ON public.ayurveda_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own ayurveda profile"
ON public.ayurveda_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own ayurveda profile"
ON public.ayurveda_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own profile (for reset)
CREATE POLICY "Users can delete their own ayurveda profile"
ON public.ayurveda_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ayurveda_profiles_updated_at
BEFORE UPDATE ON public.ayurveda_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();