/**
 * Helper function to auto-complete roadmap tasks when content is uploaded
 * This can be called after uploading meditations, healing audio, etc.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AutoCompleteOptions {
  targetLocation?: string;
  title?: string;
  category?: string;
  contentType?: 'meditation' | 'healing' | 'path' | 'course';
}

/**
 * Auto-complete roadmap tasks that match the target location
 * If targetLocation is not provided, it will try to infer it from title/category
 */
export async function autoCompleteRoadmapTask(options: AutoCompleteOptions): Promise<void> {
  const { targetLocation, title, category, contentType = 'meditation' } = options;

  try {
    // If targetLocation is provided, use it directly
    if (targetLocation) {
      const { error } = await (supabase as any).rpc('auto_complete_roadmap_task', {
        p_target_location: targetLocation,
        p_content_type: contentType,
      });

      if (error) {
        console.error('Error auto-completing roadmap task:', error);
      }
      return;
    }

    // Otherwise, try to infer target location from title/category
    if (title) {
      const { data: inferredLocation, error: inferError } = await (supabase as any).rpc(
        'get_target_location_for_content',
        {
          p_title: title,
          p_category: category || '',
          p_content_type: contentType,
        }
      );

      if (inferError) {
        console.error('Error inferring target location:', inferError);
        return;
      }

      if (inferredLocation) {
        const { error } = await (supabase as any).rpc('auto_complete_roadmap_task', {
          p_target_location: inferredLocation,
          p_content_type: contentType,
        });

        if (error) {
          console.error('Error auto-completing roadmap task:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in autoCompleteRoadmapTask:', error);
  }
}

/**
 * Helper to determine target location from content metadata
 * This is a client-side fallback if the database function doesn't work
 */
export function inferTargetLocation(
  title: string,
  category?: string,
  contentType: 'meditation' | 'healing' | 'path' | 'course' = 'meditation'
): string | null {
  const lowerTitle = title.toLowerCase();

  if (contentType === 'meditation') {
    // Morning meditations
    if (
      lowerTitle.includes('morning') ||
      lowerTitle.includes('grounding') ||
      lowerTitle.includes('gratitude') ||
      lowerTitle.includes('intention') ||
      lowerTitle.includes('energy boost')
    ) {
      return 'Daily > Morning';
    }

    // Midday meditations
    if (
      lowerTitle.includes('midday') ||
      lowerTitle.includes('reset') ||
      lowerTitle.includes('recharge') ||
      lowerTitle.includes('balance')
    ) {
      return 'Daily > Midday';
    }

    // Evening/Sleep meditations
    if (
      lowerTitle.includes('evening') ||
      lowerTitle.includes('sleep') ||
      lowerTitle.includes('wind down') ||
      lowerTitle.includes('sanctuary') ||
      lowerTitle.includes('dream')
    ) {
      return 'Daily > Evening';
    }

    // Inner Peace Path
    if (lowerTitle.includes('inner peace')) {
      const dayMatch = title.match(/day\s*(\d+)/i);
      const day = dayMatch ? dayMatch[1] : '1';
      return `Paths > Inner Peace > Day ${day}`;
    }

    // Sleep Sanctuary
    if (lowerTitle.includes('sleep sanctuary')) {
      const dayMatch = title.match(/day\s*(\d+)/i);
      const day = dayMatch ? dayMatch[1] : '1';
      return `Sleep Sanctuary > Day ${day}`;
    }

    // Deep Healing
    if (lowerTitle.includes('deep healing')) {
      const sessionMatch = title.match(/session\s*(\d+)/i);
      const session = sessionMatch ? sessionMatch[1] : '1';
      return `Healing > Deep Healing > Session ${session}`;
    }

    // Yoga Nidra
    if (lowerTitle.includes('yoga nidra') || lowerTitle.includes('nidra')) {
      const coreMatch = title.match(/core\s*(\d+)/i);
      const core = coreMatch ? coreMatch[1] : '1';
      return `Yoga Nidra > Core ${core}`;
    }

    // Breathwork
    if (lowerTitle.includes('breath') || lowerTitle.includes('breathing')) {
      if (
        lowerTitle.includes('advanced') ||
        lowerTitle.includes('wim hof') ||
        lowerTitle.includes('pranayama') ||
        lowerTitle.includes('holotropic')
      ) {
        return 'Breathing > Advanced';
      }
      return 'Breathing > Basic';
    }
  } else if (contentType === 'healing') {
    if (category?.toLowerCase().includes('deep healing')) {
      const sessionMatch = title.match(/session\s*(\d+)/i);
      const session = sessionMatch ? sessionMatch[1] : '1';
      return `Healing > Deep Healing > Session ${session}`;
    }
    return category ? `Healing > ${category}` : 'Healing > General';
  }

  return null;
}

