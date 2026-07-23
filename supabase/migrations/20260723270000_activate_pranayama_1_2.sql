-- Activated per explicit instruction to proceed with what was sent
-- (names only — breath mechanic still unconfirmed). Keeping the
-- conservative gating (advanced/forceful/health-screened) rather than
-- loosening it: "go with what I sent" supplies the names, not the
-- breath mechanic, which is still unknown. If either of these turns
-- out to be gentle, tell me and I'll downgrade the gating — it's a
-- one-line UPDATE, easy to relax, much harder to walk back after the
-- fact if it turns out the other way.

UPDATE public.breathing_patterns
SET
  name = 'Pranayama I',
  description = 'A recorded pranayama practice. Breath mechanic pending full confirmation — practiced cautiously as a forceful technique in the meantime.',
  is_active = true
WHERE name = 'Pranayama 1 (unclassified)';

UPDATE public.breathing_patterns
SET
  name = 'Pranayama II',
  description = 'A recorded pranayama practice. Breath mechanic pending full confirmation — practiced cautiously as a forceful technique in the meantime.',
  is_active = true
WHERE name = 'Pranayama 2 (unclassified)';
