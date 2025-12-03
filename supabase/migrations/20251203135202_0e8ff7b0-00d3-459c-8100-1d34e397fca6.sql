-- Create meditation_memberships table to track user subscriptions
CREATE TABLE public.meditation_memberships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_type TEXT NOT NULL,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meditation_memberships ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own meditation membership"
ON public.meditation_memberships
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meditation membership"
ON public.meditation_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meditation membership"
ON public.meditation_memberships
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_meditation_memberships_updated_at
BEFORE UPDATE ON public.meditation_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();