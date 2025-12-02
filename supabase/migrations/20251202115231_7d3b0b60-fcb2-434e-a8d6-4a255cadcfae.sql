-- Create table for affirmation soundtrack questionnaire responses
CREATE TABLE public.affirmation_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_type TEXT NOT NULL,
  goals TEXT NOT NULL,
  challenges TEXT NOT NULL,
  intentions TEXT NOT NULL,
  additional_notes TEXT,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affirmation_questionnaires ENABLE ROW LEVEL SECURITY;

-- Users can view their own questionnaires
CREATE POLICY "Users can view own questionnaires"
ON public.affirmation_questionnaires
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own questionnaires
CREATE POLICY "Users can insert own questionnaires"
ON public.affirmation_questionnaires
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own questionnaires
CREATE POLICY "Users can update own questionnaires"
ON public.affirmation_questionnaires
FOR UPDATE
USING (auth.uid() = user_id);