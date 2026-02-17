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
  // URGENT: Force schema refresh first (Lovable Workaround)
  try {
    await supabase.rpc('refresh_postgrest_schema');
  } catch (schemaError) {
    console.warn('Schema refresh RPC not available:', schemaError);
  }

  // Check table structure for debugging
  try {
    const { data: structure } = await supabase.rpc('check_mantras_structure');
    if (structure) {
      console.log('[Mantras] Table structure:', structure);
      if (!structure.has_category || !structure.has_planet_type) {
        console.warn('[Mantras] Missing columns detected. Columns:', structure.columns);
      }
    }
  } catch (structureError) {
    console.warn('Structure check RPC not available:', structureError);
  }

  // TORVALDS STABILITY: Strict query with explicit column selection
  // Use is_active as status = 'active' equivalent
  let query = supabase.from('mantras');
  let { data, error } = await query
    .select('*, category, planet_type') // Explicit wildcard + specific columns
    .eq('is_active', true) // Using is_active as status filter
    .order('created_at', { ascending: false });

  // Handle case where category/planet_type columns might not exist
  if (error && (error.message?.includes('column') || error.message?.includes('PGRST204'))) {
    console.warn('[Mantras] Column error detected, trying without explicit columns:', error.message);
    
    // Try with wildcard only
    const fallbackQuery = supabase.from('mantras');
    const fallbackResult = await fallbackQuery
      .select('*') // Just wildcard
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    data = fallbackResult.data;
    error = fallbackResult.error;
    
    if (error) {
      console.error('[Mantras] Failed to fetch mantras:', error);
      return [];
    }
  }

  if (error) {
    console.warn('Error fetching mantras:', error);
    return [];
  }

  if (!data) return [];
  return data.map((row) => ({
    ...row,
    // Ensure category defaults to 'general' if missing (schema fix)
    category: (row as any).category || 'general',
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
