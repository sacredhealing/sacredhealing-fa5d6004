-- ============================================
-- Grant Full Admin Access to Everything
-- ============================================
-- Ensures admins can access, modify, and manage all data in the app
-- Uses DROP IF EXISTS + CREATE to ensure policies are properly set

-- ============================================
-- USER DATA & PROFILES
-- ============================================

-- Profiles - Admins can manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User balances - Admins can manage all balances
DROP POLICY IF EXISTS "Admins can manage all balances" ON public.user_balances;
CREATE POLICY "Admins can manage all balances"
ON public.user_balances FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User memberships - Admins can manage all memberships
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.user_memberships;
CREATE POLICY "Admins can manage all memberships"
ON public.user_memberships FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CREATIVE TOOLS & VEDIC ASTROLOGY
-- ============================================

-- Creative tools access - Admins can view all
DROP POLICY IF EXISTS "Admins can view all tool access" ON public.user_creative_tools;
CREATE POLICY "Admins can view all tool access"
ON public.user_creative_tools FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User Vedic astrology access - Admins can manage all
DROP POLICY IF EXISTS "Admins can manage vedic access" ON public.user_vedic_astrology_access;
CREATE POLICY "Admins can manage vedic access"
ON public.user_vedic_astrology_access FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MEDITATIONS & CONTENT
-- ============================================

-- Meditations - Admins can manage all
DROP POLICY IF EXISTS "Admins can manage all meditations" ON public.meditations;
CREATE POLICY "Admins can manage all meditations"
ON public.meditations FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Meditation completions - Admins can view all
DROP POLICY IF EXISTS "Admins can view all completions" ON public.meditation_completions;
CREATE POLICY "Admins can view all completions"
ON public.meditation_completions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Content tasks - Admins can manage all
DROP POLICY IF EXISTS "Admins can manage all content tasks" ON public.content_tasks;
CREATE POLICY "Admins can manage all content tasks"
ON public.content_tasks FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- COURSES & PATHS
-- ============================================

-- Course enrollments - Admins can view all
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can view all enrollments"
ON public.course_enrollments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Path enrollments - Admins can view all
DROP POLICY IF EXISTS "Admins can view all path enrollments" ON public.spiritual_path_enrollments;
CREATE POLICY "Admins can view all path enrollments"
ON public.spiritual_path_enrollments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- GAMIFICATION & COMMUNITY
-- ============================================

-- User achievements - Admins can view all
DROP POLICY IF EXISTS "Admins can view all achievements" ON public.user_achievements;
CREATE POLICY "Admins can view all achievements"
ON public.user_achievements FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Challenge participants - Admins can view all
DROP POLICY IF EXISTS "Admins can view all participants" ON public.challenge_participants;
CREATE POLICY "Admins can view all participants"
ON public.challenge_participants FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Community posts - Admins can update all
DROP POLICY IF EXISTS "Admins can update all posts" ON public.community_posts;
CREATE POLICY "Admins can update all posts"
ON public.community_posts FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- AFFILIATE & REVENUE
-- ============================================

-- Affiliates - Admins can manage all
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON public.affiliates;
CREATE POLICY "Admins can manage all affiliates"
ON public.affiliates FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Affiliate earnings - Admins can view all
DROP POLICY IF EXISTS "Admins can view all earnings" ON public.affiliate_earnings;
CREATE POLICY "Admins can view all earnings"
ON public.affiliate_earnings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Stripe revenue - Admins can view all
DROP POLICY IF EXISTS "Admins can view all revenue" ON public.stripe_revenue;
CREATE POLICY "Admins can view all revenue"
ON public.stripe_revenue FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SHOP & ORDERS
-- ============================================

-- Shop orders - Admins can manage all
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.shop_orders;
CREATE POLICY "Admins can manage all orders"
ON public.shop_orders FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- JOURNAL & TRACKING
-- ============================================

-- Journal entries - Admins can view all
DROP POLICY IF EXISTS "Admins can view all journal entries" ON public.journal_entries;
CREATE POLICY "Admins can view all journal entries"
ON public.journal_entries FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User spiritual goals - Admins can view all
DROP POLICY IF EXISTS "Admins can view all spiritual goals" ON public.user_spiritual_goals;
CREATE POLICY "Admins can view all spiritual goals"
ON public.user_spiritual_goals FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User path progress - Admins can view all
DROP POLICY IF EXISTS "Admins can view all path progress" ON public.user_path_progress;
CREATE POLICY "Admins can view all path progress"
ON public.user_path_progress FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User daily activities - Admins can view all
DROP POLICY IF EXISTS "Admins can view all daily activities" ON public.user_daily_activities;
CREATE POLICY "Admins can view all daily activities"
ON public.user_daily_activities FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- LIVE EVENTS
-- ============================================

-- Live event RSVPs - Admins can view all (already updated in previous migration, but ensure it exists)
DROP POLICY IF EXISTS "Admins can view all RSVPs" ON public.live_event_rsvps;
CREATE POLICY "Admins can view all RSVPs"
ON public.live_event_rsvps FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRANSFORMATION PROGRAMS
-- ============================================

-- Transformation enrollments - Admins can view all
DROP POLICY IF EXISTS "Admins can view all program enrollments" ON public.transformation_enrollments;
CREATE POLICY "Admins can view all program enrollments"
ON public.transformation_enrollments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FREE TRIALS
-- ============================================

-- Free trials - Admins can manage all
DROP POLICY IF EXISTS "Admins can manage all trials" ON public.free_trials;
CREATE POLICY "Admins can manage all trials"
ON public.free_trials FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MUSIC & HEALING
-- ============================================

-- Healing audio - Admins can manage all
DROP POLICY IF EXISTS "Admins can manage all healing audio" ON public.healing_audio;
CREATE POLICY "Admins can manage all healing audio"
ON public.healing_audio FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Track ratings - Admins can view all
DROP POLICY IF EXISTS "Admins can view all track ratings" ON public.track_ratings;
CREATE POLICY "Admins can view all track ratings"
ON public.track_ratings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MQL TRADING BOT
-- ============================================

-- User bot connections - Admins can view all
DROP POLICY IF EXISTS "Admins can view all bot connections" ON public.user_bot_connections;
CREATE POLICY "Admins can view all bot connections"
ON public.user_bot_connections FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User strategy subscriptions - Admins can view all
DROP POLICY IF EXISTS "Admins can view all strategy subscriptions" ON public.user_strategy_subscriptions;
CREATE POLICY "Admins can view all strategy subscriptions"
ON public.user_strategy_subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- MQL trades - Admins can view all
DROP POLICY IF EXISTS "Admins can view all MQL trades" ON public.mql_trades;
CREATE POLICY "Admins can view all MQL trades"
ON public.mql_trades FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- USER COHORTS & ANALYTICS
-- ============================================

-- User cohorts - Admins can view all
DROP POLICY IF EXISTS "Admins can view all user cohorts" ON public.user_cohorts;
CREATE POLICY "Admins can view all user cohorts"
ON public.user_cohorts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User goals - Admins can view all
DROP POLICY IF EXISTS "Admins can view all user goals" ON public.user_goals;
CREATE POLICY "Admins can view all user goals"
ON public.user_goals FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User milestones - Admins can view all
DROP POLICY IF EXISTS "Admins can view all user milestones" ON public.user_milestones;
CREATE POLICY "Admins can view all user milestones"
ON public.user_milestones FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EMAIL QUEUE
-- ============================================

-- User email queue - Admins can view all
DROP POLICY IF EXISTS "Admins can view all email queue" ON public.user_email_queue;
CREATE POLICY "Admins can view all email queue"
ON public.user_email_queue FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CHAT & COMMUNICATION
-- ============================================

-- Chat members - Admins can view all
DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;
CREATE POLICY "Admins can view all chat members"
ON public.chat_members FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- WEBHOOK LOGS
-- ============================================

-- Stripe webhook logs - Admins can view all
DROP POLICY IF EXISTS "Admins can view all webhook logs" ON public.stripe_webhook_logs;
CREATE POLICY "Admins can view all webhook logs"
ON public.stripe_webhook_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ADMIN GRANTED ACCESS
-- ============================================
-- Already has admin policies, but ensure it's correct

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permission on has_role function to authenticated users (should already exist)
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Note: All admin policies use the has_role function which is SECURITY DEFINER
-- This allows admins to bypass RLS restrictions and access all data

