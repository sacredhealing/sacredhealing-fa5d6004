import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Track } from '@/contexts/MusicPlayerContext';

export const useMusicRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get all tracks
      const { data: allTracks } = await supabase
        .from('music_tracks')
        .select('*')
        .order('play_count', { ascending: false });

      if (!allTracks || allTracks.length === 0) {
        setRecommendations([]);
        return;
      }

      if (!user) {
        // Return popular tracks for non-authenticated users
        setRecommendations((allTracks.slice(0, 10)) as Track[]);
        return;
      }

      // Get user's play history
      const { data: historyData } = await supabase
        .from('music_play_history')
        .select('track_id')
        .eq('user_id', user.id)
        .order('play_count', { ascending: false })
        .limit(10);

      // Get user's high-rated tracks
      const { data: ratingsData } = await supabase
        .from('track_ratings')
        .select('track_id')
        .eq('user_id', user.id)
        .gte('rating', 4);

      const historyIds = historyData?.map(h => h.track_id) || [];
      const ratedIds = ratingsData?.map(r => r.track_id) || [];
      const userTrackIds = [...new Set([...historyIds, ...ratedIds])];

      if (userTrackIds.length === 0) {
        // No user data, return popular tracks
        setRecommendations((allTracks.slice(0, 10)) as Track[]);
        return;
      }

      // Analyze preferences from user's tracks
      const userTracks = allTracks.filter(t => userTrackIds.includes(t.id));
      
      const moodCounts: Record<string, number> = {};
      const pathCounts: Record<string, number> = {};
      const genreCounts: Record<string, number> = {};

      userTracks.forEach(t => {
        if (t.mood) moodCounts[t.mood] = (moodCounts[t.mood] || 0) + 1;
        if (t.spiritual_path) pathCounts[t.spiritual_path] = (pathCounts[t.spiritual_path] || 0) + 1;
        if (t.genre) genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1;
      });

      // Get top preferences
      const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
      const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
      const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);

      // Score tracks based on matching preferences, excluding already interacted
      const otherTracks = allTracks.filter(t => !userTrackIds.includes(t.id));
      
      const scored = otherTracks.map(track => {
        let score = 0;
        if (track.mood && topMoods.includes(track.mood)) score += 3;
        if (track.spiritual_path && topPaths.includes(track.spiritual_path)) score += 2;
        if (track.genre && topGenres.includes(track.genre)) score += 1;
        score += Math.log10(track.play_count + 1);
        return { track, score };
      });

      scored.sort((a, b) => b.score - a.score);
      setRecommendations(scored.slice(0, 10).map(s => s.track) as Track[]);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    refetch: fetchRecommendations
  };
};
