import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PathTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration_seconds: number;
  cover_image_url: string | null;
  preview_url: string;
  full_audio_url: string;
  mood: string | null;
  spiritual_path: string | null;
  intended_use: string | null;
  affirmation: string | null;
  best_time_of_day: string | null;
  energy_level: string | null;
  analysis_status: string | null;
}

const SPIRITUAL_PATH_MAP: Record<string, string[]> = {
  'inner_peace': ['inner_peace', 'Inner Peace'],
  'deep_healing': ['deep_healing', 'Deep Healing', 'Deep Healing from Within'],
  'sleep_sanctuary': ['sleep_sanctuary', 'Sleep Sanctuary'],
  'focus_mastery': ['focus_mastery', 'Focus Mastery'],
  'awakening': ['awakening', 'Awaken Your Inner Sight', 'Awakening'],
};

export const usePathTracks = (pathSlug?: string) => {
  return useQuery({
    queryKey: ['path-tracks', pathSlug],
    queryFn: async () => {
      let query = supabase
        .from('music_tracks')
        .select('id, title, artist, genre, duration_seconds, cover_image_url, preview_url, full_audio_url, mood, spiritual_path, intended_use, affirmation, best_time_of_day, energy_level, analysis_status')
        .in('analysis_status', ['completed', 'approved']);

      if (pathSlug && SPIRITUAL_PATH_MAP[pathSlug]) {
        query = query.in('spiritual_path', SPIRITUAL_PATH_MAP[pathSlug]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as PathTrack[];
    },
    enabled: true,
  });
};

export const useTimeOfDayTracks = (timeOfDay: 'morning' | 'midday' | 'evening' | 'sleep') => {
  const timeMapping: Record<string, string[]> = {
    'morning': ['morning', 'anytime'],
    'midday': ['midday', 'anytime'],
    'evening': ['evening', 'anytime'],
    'sleep': ['sleep', 'evening'],
  };

  return useQuery({
    queryKey: ['time-of-day-tracks', timeOfDay],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('id, title, artist, genre, duration_seconds, cover_image_url, preview_url, full_audio_url, mood, spiritual_path, intended_use, affirmation, best_time_of_day, energy_level, analysis_status')
        .in('analysis_status', ['completed', 'approved'])
        .in('best_time_of_day', timeMapping[timeOfDay])
        .order('play_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as PathTrack[];
    },
  });
};

export const useMoodTracks = (mood: string) => {
  return useQuery({
    queryKey: ['mood-tracks', mood],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('id, title, artist, genre, duration_seconds, cover_image_url, preview_url, full_audio_url, mood, spiritual_path, intended_use, affirmation, best_time_of_day, energy_level, analysis_status')
        .in('analysis_status', ['completed', 'approved'])
        .eq('mood', mood)
        .order('play_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as PathTrack[];
    },
  });
};

export const useIntendedUseTracks = (intendedUse: string) => {
  return useQuery({
    queryKey: ['intended-use-tracks', intendedUse],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('id, title, artist, genre, duration_seconds, cover_image_url, preview_url, full_audio_url, mood, spiritual_path, intended_use, affirmation, best_time_of_day, energy_level, analysis_status')
        .in('analysis_status', ['completed', 'approved'])
        .eq('intended_use', intendedUse)
        .order('play_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as PathTrack[];
    },
  });
};

export const useDailyNudgeTracks = () => {
  const hour = new Date().getHours();
  let timeOfDay: 'morning' | 'midday' | 'evening' | 'sleep';
  
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'midday';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'sleep';
  }

  return useTimeOfDayTracks(timeOfDay);
};
