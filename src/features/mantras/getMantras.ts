import { supabase } from '@/integrations/supabase/client';

export interface MantraItem {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_minutes: number;
  duration_seconds?: number | null;
  shc_reward: number;
  play_count: number;
  is_active: boolean;
  category?: string | null;
  planet_type?: string | null;
  is_premium?: boolean;
  /** 0=Free, 1=Prana-Flow, 2=Siddha-Quantum, 3=Akasha-Infinity */
  required_tier?: number;
  repetitionsFixed: 108;
}

/**
 * Fetch all active mantras.
 * Premium mantras are always returned — the UI shows them as locked teasers
 * for free users (upgrade prompt on tap) rather than hiding them entirely.
 * userRank: 0=free, 1=prana, 2=siddha, 3=akasha. Admin sees all.
 */
export async function getMantras(options?: { userRank?: number; isAdmin?: boolean }): Promise<MantraItem[]> {
  try {
    const { data, error } = await supabase
      .from('mantras')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Mantras] Error fetching mantras:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Return ALL mantras — UI handles lock/unlock display based on is_premium + userRank
    const rows = data;

    return rows.map((row) => {
      // Fix duration — safely calculate minutes from seconds
      const rawMinutes = (row as any).duration_minutes;
      const rawSeconds = (row as any).duration_seconds;
      const duration_minutes = rawMinutes
        ? Number(rawMinutes)
        : rawSeconds
        ? Math.max(1, Math.ceil(Number(rawSeconds) / 60))
        : 3;

      const requiredTier = Number((row as any).required_tier ?? ((row as any).is_premium ? 1 : 0));
      return {
        ...row,
        category: (row as any).category || 'general',
        planet_type: (row as any).planet_type || null,
        is_premium: (row as any).is_premium || false,
        required_tier: Number.isFinite(requiredTier) ? requiredTier : 0,
        duration_minutes,
        repetitionsFixed: 108 as const,
      };
    }) as MantraItem[];
  } catch (err) {
    console.error('[Mantras] Unexpected error:', err);
    return [];
  }
}

export const MANTRA_REPETITIONS = 108;
