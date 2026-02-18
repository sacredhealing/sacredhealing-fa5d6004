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

export async function getMantras(): Promise<MantraItem[]> {
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

    return data.map((row) => {
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
