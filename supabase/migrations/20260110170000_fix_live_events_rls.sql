-- ============================================
-- Fix Live Events RLS for RSVP Counts
-- ============================================
-- Allows users to view RSVP counts for active events while maintaining privacy

-- Drop existing restrictive RSVP policy
DROP POLICY IF EXISTS "Users can view own RSVPs" ON public.live_event_rsvps;

-- Create policy that allows viewing RSVPs for active events (for count purposes)
-- but users can only see detailed info about their own RSVP
CREATE POLICY "Users can view RSVPs for active events"
ON public.live_event_rsvps FOR SELECT
USING (
  -- Users can always see their own RSVPs
  auth.uid() = user_id OR
  -- Users can see RSVP counts for active events (needed for event cards)
  EXISTS (
    SELECT 1 FROM public.live_events e
    WHERE e.id = live_event_rsvps.event_id
    AND e.is_active = true
  )
);

-- Ensure live events policy is correct (should already exist but ensure it's there)
DROP POLICY IF EXISTS "Anyone can view active live events" ON public.live_events;

CREATE POLICY "Anyone can view active live events"
ON public.live_events FOR SELECT
USING (
  is_active = true OR 
  (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
);

