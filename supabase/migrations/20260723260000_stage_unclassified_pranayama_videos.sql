-- Two more Spirit of Fire links whose breath mechanic is not yet known
-- (confirmed unknown by Kritagya). Staged inactive so the video links
-- aren't lost, but NOT shown to any user and NOT classified with a
-- guessed technique_type — guessing here is exactly the mistake that
-- had to be corrected for Crown Pump Pranayama. Update level/
-- technique_type/requires_health_screen/guidance content and flip
-- is_active to true once someone has actually confirmed what's taught.

INSERT INTO public.breathing_patterns
  (name, description, inhale, hold, exhale, hold_out, cycles, order_index, level, tier_required, technique_type, requires_health_screen, youtube_url, is_active)
VALUES
  (
    'Pranayama 1 (unclassified)', 'Pending classification — breath mechanic not yet confirmed. Do not activate until reviewed.',
    4, 0, 4, 0, 4, 90, 'advanced', 'siddha-quantum', 'forceful', true,
    'https://youtu.be/aB869byeosg', false
  ),
  (
    'Pranayama 2 (unclassified)', 'Pending classification — breath mechanic not yet confirmed. Do not activate until reviewed.',
    4, 0, 4, 0, 4, 91, 'advanced', 'siddha-quantum', 'forceful', true,
    'https://youtu.be/4eXBigDD1OM', false
  )
ON CONFLICT DO NOTHING;
