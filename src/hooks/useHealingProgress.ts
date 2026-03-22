import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type MeditationCatalogLang = 'en' | 'sv';

const MEDITATION_PICK_COLUMNS =
  'id, title, title_sv, description, duration_minutes, shc_reward, category, language' as const;

function catalogLangFromAppLanguage(appLanguage: string): MeditationCatalogLang {
  return appLanguage.split('-')[0].toLowerCase() === 'sv' ? 'sv' : 'en';
}

/** Match Meditations page: Swedish UI prefers `title_sv` when present; otherwise primary `title` (English). */
function pickMeditationDisplayTitle(
  row: { title: string; title_sv?: string | null },
  appLanguage: string
): string {
  const base = appLanguage.split('-')[0].toLowerCase();
  if (base === 'sv' && row.title_sv) return row.title_sv;
  return row.title;
}

function completedMeditationNotInFilter(completedIds: string[]) {
  return completedIds.length > 0
    ? `(${completedIds.join(',')})`
    : '(00000000-0000-0000-0000-000000000000)';
}

interface HealingProgress {
  totalMeditations: number;
  totalMantras: number;
  totalMusicSessions: number;
  totalHealingAudio: number;
  daysActive: number;
  currentStreak: number;
  totalSHCEarned: number;
  lastSessionDate: string | null;
  recentMeditations: { id: string; title: string; completed_at: string }[];
  recentMantras: { id: string; title: string; completed_at: string }[];
}

interface NextRecommendation {
  type: 'meditation' | 'mantra' | 'music' | 'healing';
  id: string;
  title: string;
  description?: string;
  duration?: number;
  reward?: number;
  category?: string;
}

export const useHealingProgress = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [progress, setProgress] = useState<HealingProgress | null>(null);
  const [nextRecommendation, setNextRecommendation] = useState<NextRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setNextRecommendation(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all completion counts and profile data in parallel
      const [
        meditationResult,
        mantraResult,
        musicResult,
        healingAudioResult,
        profileResult,
        balanceResult,
        recentMeditationsResult,
        recentMantrasResult
      ] = await Promise.all([
        supabase
          .from('meditation_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('mantra_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('music_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('healing_audio_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('profiles')
          .select('streak_days, last_login_date, created_at')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_balances')
          .select('total_earned')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('meditation_completions')
          .select('meditation_id, completed_at, meditations(title)')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase
          .from('mantra_completions')
          .select('mantra_id, completed_at, mantras(title)')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5)
      ]);

      // Calculate days active (days since account creation)
      const createdAt = profileResult.data?.created_at;
      const daysActive = createdAt 
        ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1;

      // Find the most recent session date
      const allDates = [
        profileResult.data?.last_login_date,
        recentMeditationsResult.data?.[0]?.completed_at,
        recentMantrasResult.data?.[0]?.completed_at
      ].filter(Boolean).map(d => new Date(d!));
      
      const lastSessionDate = allDates.length > 0 
        ? new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString()
        : null;

      setProgress({
        totalMeditations: meditationResult.count || 0,
        totalMantras: mantraResult.count || 0,
        totalMusicSessions: musicResult.count || 0,
        totalHealingAudio: healingAudioResult.count || 0,
        daysActive,
        currentStreak: profileResult.data?.streak_days || 0,
        totalSHCEarned: Number(balanceResult.data?.total_earned || 0),
        lastSessionDate,
        recentMeditations: recentMeditationsResult.data?.map(m => ({
          id: m.meditation_id,
          title: (m.meditations as any)?.title || 'Meditation',
          completed_at: m.completed_at
        })) || [],
        recentMantras: recentMantrasResult.data?.map(m => ({
          id: m.mantra_id || '',
          title: (m.mantras as any)?.title || 'Mantra',
          completed_at: m.completed_at
        })) || []
      });

      // Fetch next recommendation (catalog language + display title follow app UI language)
      await fetchNextRecommendation(user.id, i18n.language);
    } catch (error) {
      console.error('Error fetching healing progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, i18n.language]);

  const fetchNextRecommendation = async (userId: string, appLanguage: string) => {
    try {
      const catalogLang = catalogLangFromAppLanguage(appLanguage);

      // Get IDs of completed meditations
      const { data: completedMeditations } = await supabase
        .from('meditation_completions')
        .select('meditation_id')
        .eq('user_id', userId);

      const completedIds = completedMeditations?.map(c => c.meditation_id) || [];
      const notIn = completedMeditationNotInFilter(completedIds);

      // Prefer an uncompleted meditation in the user's catalog language (en / sv), then any language
      let { data: meditation } = await supabase
        .from('meditations')
        .select(MEDITATION_PICK_COLUMNS)
        .not('id', 'in', notIn)
        .eq('language', catalogLang)
        .order('play_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!meditation) {
        ({ data: meditation } = await supabase
          .from('meditations')
          .select(MEDITATION_PICK_COLUMNS)
          .not('id', 'in', notIn)
          .order('play_count', { ascending: false })
          .limit(1)
          .maybeSingle());
      }

      if (meditation) {
        setNextRecommendation({
          type: 'meditation',
          id: meditation.id,
          title: pickMeditationDisplayTitle(meditation, appLanguage),
          description: meditation.description || undefined,
          duration: meditation.duration_minutes ?? undefined,
          reward: meditation.shc_reward ?? undefined,
          category: meditation.category ?? undefined
        });
        return;
      }

      // If all meditations completed, suggest a popular one (same language preference)
      let { data: popularMeditation } = await supabase
        .from('meditations')
        .select(MEDITATION_PICK_COLUMNS)
        .eq('language', catalogLang)
        .order('play_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!popularMeditation) {
        ({ data: popularMeditation } = await supabase
          .from('meditations')
          .select(MEDITATION_PICK_COLUMNS)
          .order('play_count', { ascending: false })
          .limit(1)
          .maybeSingle());
      }

      if (popularMeditation) {
        setNextRecommendation({
          type: 'meditation',
          id: popularMeditation.id,
          title: pickMeditationDisplayTitle(popularMeditation, appLanguage),
          description: popularMeditation.description || undefined,
          duration: popularMeditation.duration_minutes ?? undefined,
          reward: popularMeditation.shc_reward ?? undefined,
          category: popularMeditation.category ?? undefined
        });
        return;
      }

      // Fallback to mantra
      const { data: mantra } = await supabase
        .from('mantras')
        .select('id, title, description, duration_seconds, shc_reward')
        .eq('is_active', true)
        .order('play_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mantra) {
        setNextRecommendation({
          type: 'mantra',
          id: mantra.id,
          title: mantra.title,
          description: mantra.description || undefined,
          duration: Math.floor(mantra.duration_seconds / 60),
          reward: mantra.shc_reward
        });
      }
    } catch (error) {
      console.error('Error fetching next recommendation:', error);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    nextRecommendation,
    isLoading,
    refetch: fetchProgress
  };
};
