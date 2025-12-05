-- Add language column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

-- Add comment for documentation
COMMENT ON COLUMN public.courses.language IS 'Language code: en (English), sv (Swedish), es (Spanish), no (Norwegian)';