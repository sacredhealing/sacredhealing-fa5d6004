-- Optional PDF / audio URLs for academy modules (content_url remains primary media link)
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS audio_url text;
