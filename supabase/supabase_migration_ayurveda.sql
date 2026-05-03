-- ============================================================================
-- Agastyar Academy — supplemental SQL (Supabase SQL Editor paste-friendly)
-- ============================================================================
-- Apply AFTER base tables exist:
--   supabase/migrations/20260503201000_agastyar_academy_courses.sql
--
-- Safe to run multiple times (IF NOT EXISTS).
-- ============================================================================

ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS audio_url text;
