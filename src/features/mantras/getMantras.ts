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
  repetitionsFixed: 108;
}

/** userRank: 0=free, 1=prana, 2=siddha, 3=akasha. Admin sees all. Free sees only is_premium=false. */
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

    let rows = data;
    const isAdmin = options?.isAdmin ?? false;
    const userRank = options?.userRank ?? 0;
    if (!isAdmin && userRank < 1) {
      rows = rows.filter((r: any) => !r.is_premium);
    }

    return rows.map((row) => {
      // Fix duration — safely calculate minutes from seconds
      const rawMinutes = (row as any).duration_minutes;
      const rawSeconds = (row as any).duration_seconds;
      const duration_minutes = rawMinutes
        ? Number(rawMinutes)
        : rawSeconds
        ? Math.max(1, Math.ceil(Number(rawSeconds) / 60))
        : 3;

      return {
        ...row,
        category: (row as any).category || 'general',
        planet_type: (row as any).planet_type || null,
        is_premium: (row as any).is_premium || false,
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
