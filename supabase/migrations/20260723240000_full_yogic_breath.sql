-- Full Yogic Breath / Dirgha Pranayama (three-part breath) — Laila's video.
-- Classical foundation practice: belly, ribs, chest, in sequence. No
-- retention, no forcing. Genuinely gentle — safe as a free/beginner entry
-- point, and importantly gives free users a non-screened option again.

INSERT INTO public.breathing_patterns
  (name, sanskrit_name, description, inhale, hold, exhale, hold_out, cycles, order_index, level, tier_required, technique_type, requires_health_screen, youtube_url, steps, benefits, cautions, contraindications, is_active)
VALUES
  (
    'Full Yogic Breath', 'Dirgha Pranayama',
    'The classical three-part breath — belly, ribs, then chest. The foundation every other pranayama practice builds on.',
    6, 0, 6, 0, 8, 5, 'beginner', 'free', 'gentle', false,
    'https://youtu.be/xpWRo0Z806o',
    ARRAY[
      'Sit or lie down comfortably, spine long.',
      'Inhale into the belly first, letting it rise.',
      'Continue the same inhale into the ribs, feeling them expand sideways.',
      'Complete the inhale into the upper chest.',
      'Exhale slowly in reverse — chest, then ribs, then belly — fully emptying.',
      'Keep the whole breath smooth and unforced, like a wave.'
    ],
    ARRAY['Full use of lung capacity', 'Calms the nervous system', 'The foundation for every other pranayama practice'],
    ARRAY['Keep it slow and smooth — this is a foundation practice, not a race.'],
    '{}',
    true
  )
ON CONFLICT DO NOTHING;
