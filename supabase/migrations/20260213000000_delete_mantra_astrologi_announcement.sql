-- Delete the stuck "Mantra & Astrologi" announcement
-- This migration directly deletes the announcement and related dismissals

-- First delete related dismissals
DELETE FROM public.announcement_dismissals
WHERE announcement_id = 'ef6eaf82-978c-473a-9650-6a6daacd77e8';

-- Then delete the announcement
DELETE FROM public.announcements
WHERE id = 'ef6eaf82-978c-473a-9650-6a6daacd77e8';

-- Also delete any announcements with similar titles/messages as a safety measure
DELETE FROM public.announcement_dismissals
WHERE announcement_id IN (
  SELECT id FROM public.announcements
  WHERE title ILIKE '%Mantra & Astrologi%'
     OR title ILIKE '%mantra & astrologi%'
     OR message ILIKE '%vediska astrologi%'
     OR message ILIKE '%Vediska astrologi%'
);

DELETE FROM public.announcements
WHERE title ILIKE '%Mantra & Astrologi%'
   OR title ILIKE '%mantra & astrologi%'
   OR message ILIKE '%vediska astrologi%'
   OR message ILIKE '%Vediska astrologi%';
