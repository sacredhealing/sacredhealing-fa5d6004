-- Add translation columns for Income Streams
-- Supporting: English (default), Swedish (sv), Spanish (es), Norwegian (no)

ALTER TABLE public.income_streams
ADD COLUMN IF NOT EXISTS title_sv text,
ADD COLUMN IF NOT EXISTS title_es text,
ADD COLUMN IF NOT EXISTS title_no text,
ADD COLUMN IF NOT EXISTS description_sv text,
ADD COLUMN IF NOT EXISTS description_es text,
ADD COLUMN IF NOT EXISTS description_no text,
ADD COLUMN IF NOT EXISTS potential_earnings_sv text,
ADD COLUMN IF NOT EXISTS potential_earnings_es text,
ADD COLUMN IF NOT EXISTS potential_earnings_no text;

-- Add comment for documentation
COMMENT ON COLUMN public.income_streams.title_sv IS 'Swedish translation of title';
COMMENT ON COLUMN public.income_streams.title_es IS 'Spanish translation of title';
COMMENT ON COLUMN public.income_streams.title_no IS 'Norwegian translation of title';
COMMENT ON COLUMN public.income_streams.description_sv IS 'Swedish translation of description';
COMMENT ON COLUMN public.income_streams.description_es IS 'Spanish translation of description';
COMMENT ON COLUMN public.income_streams.description_no IS 'Norwegian translation of description';