import { supabase } from '@/integrations/supabase/client';

export interface MantraItem {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  /** Canonical duration for UI/analytics */
  duration_minutes: number;
  /** Backward compatibility (some rows/clients still rely on seconds). */
  duration_seconds?: number | null;
  shc_reward: number;
  play_count: number;
  is_active: boolean;
  category?: string | null;
  planet_type?: string | null;
  is_premium?: boolean;
  /** Fixed repetitions per practice. */
  repetitionsFixed: 108;
}

/**
 * Returns only uploaded mantras from the unified view (single source of truth).
 * Uses mantras_unified view if available, falls back to mantras table.
 * Filters by is_active and orders by created_at desc.
 */
export async function getMantras(): Promise<MantraItem[]> {
  // Try unified view first (handles minutes/seconds conversion globally)
  let query = supabase.from('mantras_unified');
  let { data, error } = await query
    .select('id, title, description, audio_url, cover_image_url, duration_minutes, duration_seconds, shc_reward, play_count, is_active, category, planet_type, is_premium')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Fallback to mantras table if view doesn't exist
  if (error && error.message?.includes('does not exist')) {
    const fallbackQuery = supabase.from('mantras');
    const fallbackResult = await fallbackQuery
      .select('id, title, description, audio_url, cover_image_url, duration_minutes, duration_seconds, shc_reward, play_count, is_active, category, planet_type, is_premium')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    console.warn('Error fetching mantras:', error);
    return [];
  }

  if (!data) return [];
  return data.map((row) => ({
    ...row,
    // Unified view already handles conversion, but ensure duration_minutes always exists
    duration_minutes:
      (row as any).duration_minutes ??
      (row as any).duration_seconds
        ? Math.max(1, Math.ceil(Number((row as any).duration_seconds) / 60))
        : 3,
    repetitionsFixed: 108 as const,
  })) as MantraItem[];
}

export const MANTRA_REPETITIONS = 108;
