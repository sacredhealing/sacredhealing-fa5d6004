import { supabase } from '@/integrations/supabase/client';

export interface MantraItem {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  shc_reward: number;
  play_count: number;
  is_active: boolean;
  /** Fixed repetitions per practice. */
  repetitionsFixed: 108;
  category?: string;
  planet_type?: string | null;
  is_premium?: boolean;
  explanation?: string | null;
  recommended_duration?: string | null;
  vedic_period_id?: string | null;
}

export interface VedicPeriodItem {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  year: number;
}

/**
 * Returns only uploaded mantras from the mantras table (no chime/silent/synthetic).
 * Filters by is_active and orders by created_at desc.
 */
export async function getMantras(): Promise<MantraItem[]> {
  const { data } = await supabase
    .from('mantras')
    .select('id, title, description, audio_url, cover_image_url, duration_seconds, shc_reward, play_count, is_active, category, planet_type, is_premium, explanation, recommended_duration, vedic_period_id')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (!data) return [];
  return data.map((row) => ({
    ...row,
    repetitionsFixed: 108 as const,
  })) as MantraItem[];
}

export const MANTRA_REPETITIONS = 108;

/**
 * Fetch the current Vedic period for the given year where today falls within start_date and end_date.
 */
export async function getCurrentVedicPeriod(year?: number): Promise<VedicPeriodItem | null> {
  const targetYear = year ?? new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from('vedic_periods')
    .select('id, title, description, start_date, end_date, year')
    .eq('year', targetYear)
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1)
    .maybeSingle();

  return data as VedicPeriodItem | null;
}

/**
 * Fetch mantras linked to a specific vedic period.
 */
export async function getMantrasByPeriod(vedicPeriodId: string): Promise<MantraItem[]> {
  const { data } = await supabase
    .from('mantras')
    .select('id, title, description, audio_url, cover_image_url, duration_seconds, shc_reward, play_count, is_active, category, planet_type, is_premium, explanation, recommended_duration, vedic_period_id')
    .eq('is_active', true)
    .eq('vedic_period_id', vedicPeriodId)
    .order('created_at', { ascending: false });

  if (!data) return [];
  return data.map((row) => ({
    ...row,
    repetitionsFixed: 108 as const,
  })) as MantraItem[];
}
