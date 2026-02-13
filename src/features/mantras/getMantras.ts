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
  planet_type?: string | null;
  /** Fixed repetitions per practice. */
  repetitionsFixed: 108;
}

/**
 * Returns only uploaded mantras from the mantras table (no chime/silent/synthetic).
 * Filters by is_active and orders by created_at desc.
 * Uses select('*') for resilience if category/planet_type columns are missing.
 */
export async function getMantras(): Promise<MantraItem[]> {
  const { data, error } = await supabase
    .from('mantras')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMantras error:', error);
    return [];
  }
  if (!data) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    audio_url: row.audio_url,
    cover_image_url: row.cover_image_url ?? null,
    duration_seconds: Number(row.duration_seconds) || 180,
    shc_reward: Number(row.shc_reward) || 111,
    play_count: Number(row.play_count) || 0,
    is_active: Boolean(row.is_active),
    category: (row.category as string) ?? null,
    planet_type: (row.planet_type as string) ?? null,
    repetitionsFixed: 108 as const,
  })) as MantraItem[];
}

export const MANTRA_REPETITIONS = 108;
