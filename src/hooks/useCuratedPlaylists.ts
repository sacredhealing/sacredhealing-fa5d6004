import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CuratedPlaylist {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  category: string;
  content_type: string;
  mood: string | null;
  theme: string | null;
  duration_range: string | null;
  order_index: number;
  track_count: number;
  total_duration: number;
  total_plays: number;
}

export interface PlaylistItem {
  id: string;
  track_id: string | null;
  meditation_id: string | null;
  order_index: number;
}

export const useCuratedPlaylists = (contentType: 'music' | 'meditation') => {
  const [playlists, setPlaylists] = useState<CuratedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, [contentType]);

  const fetchPlaylists = async () => {
    setLoading(true);
    
    // First fetch playlists
    const { data: playlistsData, error: playlistsError } = await supabase
      .from('curated_playlists')
      .select('*')
      .eq('content_type', contentType)
      .eq('is_active', true)
      .order('order_index');

    if (playlistsError || !playlistsData) {
      setLoading(false);
      return;
    }

    // Fetch items for each playlist with aggregated data
    const playlistsWithStats = await Promise.all(
      playlistsData.map(async (playlist) => {
        if (contentType === 'music') {
          // Get music tracks for this playlist
          const { data: items } = await supabase
            .from('curated_playlist_items')
            .select(`
              id,
              track_id,
              music_tracks!curated_playlist_items_track_id_fkey (
                duration_seconds,
                play_count
              )
            `)
            .eq('playlist_id', playlist.id);

          const trackCount = items?.length || 0;
          const totalDuration = items?.reduce((sum, item) => {
            const track = item.music_tracks as any;
            return sum + (track?.duration_seconds || 0);
          }, 0) || 0;
          const totalPlays = items?.reduce((sum, item) => {
            const track = item.music_tracks as any;
            return sum + (track?.play_count || 0);
          }, 0) || 0;

          return {
            ...playlist,
            track_count: trackCount,
            total_duration: totalDuration,
            total_plays: totalPlays,
          };
        } else {
          // Get meditations for this playlist
          const { data: items } = await supabase
            .from('curated_playlist_items')
            .select(`
              id,
              meditation_id,
              meditations!curated_playlist_items_meditation_id_fkey (
                duration_minutes,
                play_count
              )
            `)
            .eq('playlist_id', playlist.id);

          const trackCount = items?.length || 0;
          const totalDuration = items?.reduce((sum, item) => {
            const meditation = item.meditations as any;
            return sum + ((meditation?.duration_minutes || 0) * 60);
          }, 0) || 0;
          const totalPlays = items?.reduce((sum, item) => {
            const meditation = item.meditations as any;
            return sum + (meditation?.play_count || 0);
          }, 0) || 0;

          return {
            ...playlist,
            track_count: trackCount,
            total_duration: totalDuration,
            total_plays: totalPlays,
          };
        }
      })
    );

    setPlaylists(playlistsWithStats);
    setLoading(false);
  };

  const getPlaylistItems = async (playlistId: string) => {
    if (contentType === 'music') {
      const { data } = await supabase
        .from('curated_playlist_items')
        .select(`
          id,
          track_id,
          order_index,
          music_tracks!curated_playlist_items_track_id_fkey (*)
        `)
        .eq('playlist_id', playlistId)
        .order('order_index');

      return data?.map(item => (item as any).music_tracks).filter(Boolean) || [];
    } else {
      const { data } = await supabase
        .from('curated_playlist_items')
        .select(`
          id,
          meditation_id,
          order_index,
          meditations!curated_playlist_items_meditation_id_fkey (*)
        `)
        .eq('playlist_id', playlistId)
        .order('order_index');

      return data?.map(item => (item as any).meditations).filter(Boolean) || [];
    }
  };

  return {
    playlists,
    loading,
    refetch: fetchPlaylists,
    getPlaylistItems,
  };
};
