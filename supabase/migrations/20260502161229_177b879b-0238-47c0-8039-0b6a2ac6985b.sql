-- Strip "Gross Nadis: X / Y — Sushumna full" style biofield noise from stored content
CREATE OR REPLACE FUNCTION public.strip_biofield_noise(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          coalesce(t, ''),
          '[[:space:].;,—-]*(Gross |Sub[- ]?)?Nadis?\s*:?\s*[0-9,]+\s*/\s*[0-9,]+[^.\n]*\.?',
          '', 'gi'
        ),
        '[[:space:].;,—-]*(Sushumna|Pingala|Ida)\s+[^.\n]*\b(full|balanced|burning|flammar|brinner|aktiv|active)\b\.?',
        '', 'gi'
      ),
      '[[:space:].;,—-]*(HRV|Prana[- ]?index|Blockage)\s*[:=]?\s*[0-9.,]+[^.\n]*\.?',
      '', 'gi'
    ),
    '\s{2,}', ' ', 'g'
  )
$$;

UPDATE public.transmission_blocks
SET raw_content = public.strip_biofield_noise(raw_content)
WHERE raw_content ~* '(Gross |Sub[- ]?)?Nadis?\s*:?\s*[0-9,]+\s*/\s*[0-9,]+'
   OR raw_content ~* '(Sushumna|Pingala|Ida)\s+[^.\n]*\b(full|balanced|burning)\b';

UPDATE public.codex_chapters
SET prose_woven = public.strip_biofield_noise(prose_woven)
WHERE prose_woven ~* '(Gross |Sub[- ]?)?Nadis?\s*:?\s*[0-9,]+\s*/\s*[0-9,]+'
   OR prose_woven ~* '(Sushumna|Pingala|Ida)\s+[^.\n]*\b(full|balanced|burning)\b';

UPDATE public.codex_chapters
SET opening_hook = public.strip_biofield_noise(opening_hook),
    closing_reflection = public.strip_biofield_noise(closing_reflection)
WHERE opening_hook ~* 'Nadis?\s*:?\s*[0-9,]+\s*/\s*[0-9,]+'
   OR closing_reflection ~* 'Nadis?\s*:?\s*[0-9,]+\s*/\s*[0-9,]+';