CREATE OR REPLACE FUNCTION public.strip_biofield_noise(t text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              coalesce(t, ''),
              -- "<Name ...> Transmitting 24/7" repeated runs (one or many)
              '(([A-Z][[:alnum:]''`+\-\.\(\)]*(\s+[A-Za-z0-9][[:alnum:]''`+\-\.\(\)]*){0,5}\s+Transmitting\s+24\s*/\s*7\s*\.?\s*)+)',
              '', 'g'
            ),
            'SQI Online Neural Sync\s*:?\s*[0-9]+\s*%\s*(History\s*Ok)?',
            '', 'gi'
          ),
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
WHERE raw_content ~ 'Transmitting\s+24\s*/\s*7'
   OR raw_content ~* 'SQI Online Neural Sync'
   OR raw_content ~* 'Nadis?\s*:?\s*[0-9,]+\s*/\s*[0-9,]+';

UPDATE public.codex_chapters
SET prose_woven = public.strip_biofield_noise(prose_woven)
WHERE prose_woven ~ 'Transmitting\s+24\s*/\s*7'
   OR prose_woven ~* 'SQI Online Neural Sync'
   OR prose_woven ~* 'Nadis?\s*:?\s*[0-9,]+\s*/\s*[0-9,]+';

UPDATE public.codex_chapters
SET opening_hook = public.strip_biofield_noise(opening_hook),
    closing_reflection = public.strip_biofield_noise(closing_reflection)
WHERE opening_hook ~ 'Transmitting\s+24\s*/\s*7'
   OR closing_reflection ~ 'Transmitting\s+24\s*/\s*7';