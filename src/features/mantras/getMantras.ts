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
  category?: string | null;
  /** Fixed repetitions per practice. */
  repetitionsFixed: 108;
}

/**
 * Returns only uploaded mantras from the mantras table (no chime/silent/synthetic).
 * Filters by is_active and orders by created_at desc.
 */
export async function getMantras(): Promise<MantraItem[]> {
  const { data } = await supabase
    .from('mantras')
    .select('id, title, description, audio_url, cover_image_url, duration_seconds, shc_reward, play_count, is_active, category')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (!data) return [];
  return data.map((row) => ({
    ...row,
    repetitionsFixed: 108 as const,
  })) as MantraItem[];
}

export const MANTRA_REPETITIONS = 108;
