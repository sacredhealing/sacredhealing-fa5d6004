
-- 1. referral_signups: only allow self-attribution
DROP POLICY IF EXISTS "Users can insert referral signups" ON public.referral_signups;
CREATE POLICY "Users can insert their own referral attribution"
ON public.referral_signups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = referred_user_id);

-- 2. Remove client-side inserts for paid enrollments / purchases
DROP POLICY IF EXISTS "Users can enroll themselves" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.transformation_enrollments;
DROP POLICY IF EXISTS "Users can insert their own healing purchases" ON public.healing_purchases;

-- 3. Remove client-side inserts/updates for paid memberships
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can insert their own meditation membership" ON public.meditation_memberships;
DROP POLICY IF EXISTS "Users can update their own meditation membership" ON public.meditation_memberships;
DROP POLICY IF EXISTS "Users can insert their own music membership" ON public.music_memberships;
DROP POLICY IF EXISTS "Users can update their own music membership" ON public.music_memberships;

-- 4. chat_messages: only room members can read
DROP POLICY IF EXISTS "Anyone can view messages" ON public.chat_messages;
CREATE POLICY "Room members can view messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (public.is_room_member(room_id));

-- 5. creative_soul_jobs: remove the duplicate policy that leaks null-owner rows
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.creative_soul_jobs;

-- 6. email_sequence_steps: admins only
DROP POLICY IF EXISTS "Anyone can read steps" ON public.email_sequence_steps;
CREATE POLICY "Admins can read email sequence steps"
ON public.email_sequence_steps FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. courses: hide unpublished from non-admins
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "Anyone can view published courses"
ON public.courses FOR SELECT TO anon, authenticated
USING (is_published = true);
-- admins still have full access via existing "Admins write courses" ALL policy

-- 8. challenge_participants & live_event_rsvps: remove public exposure of user_ids
DROP POLICY IF EXISTS "Anyone can view participant counts" ON public.challenge_participants;
DROP POLICY IF EXISTS "Anyone can view RSVP counts" ON public.live_event_rsvps;

-- 9. affiliate_events: RLS enabled but no policy — restrict to admins/service role
CREATE POLICY "Admins can view affiliate events"
ON public.affiliate_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
