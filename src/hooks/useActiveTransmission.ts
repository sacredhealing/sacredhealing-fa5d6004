import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Transmission {
  id: string;
  title: string;
  url: string;
  type?: string;
  /** Extra fields for rich restore (optional). */
  metadata?: Record<string, unknown>;
}

export function useActiveTransmission() {
  const { user } = useAuth();
  const [active, setActive] = useState<Transmission | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('active_transmissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.transmission_id && data.transmission_url) {
        const meta = (data.metadata && typeof data.metadata === 'object')
          ? (data.metadata as Record<string, unknown>)
          : {};
        setActive({
          id: data.transmission_id,
          title: data.transmission_title ?? '',
          url: data.transmission_url,
          type: data.transmission_type ?? 'audio',
          metadata: meta,
        });
        setIsPlaying(false);
        setPosition(Number(data.playback_position) || 0);
      }
    }
    load();
  }, [user?.id]);

  const persist = useCallback(
    async (transmission: Transmission | null, playing: boolean, pos: number) => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      if (!transmission?.id) {
        await supabase.from('active_transmissions').delete().eq('user_id', u.id);
        return;
      }
      await supabase.from('active_transmissions').upsert(
        {
          user_id: u.id,
          transmission_id: transmission.id,
          transmission_title: transmission.title,
          transmission_url: transmission.url,
          transmission_type: transmission.type ?? 'audio',
          is_playing: playing,
          playback_position: pos,
          metadata: transmission.metadata ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    },
    []
  );

  const debouncedPersist = useCallback(
    (transmission: Transmission | null, playing: boolean, pos: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(transmission, playing, pos), 1500);
    },
    [persist]
  );

  const setTransmission = useCallback(
    (transmission: Transmission) => {
      setActive(transmission);
      setIsPlaying(true);
      setPosition(0);
      debouncedPersist(transmission, true, 0);
    },
    [debouncedPersist]
  );

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      debouncedPersist(active, !prev, position);
      return !prev;
    });
  }, [active, position, debouncedPersist]);

  const updatePosition = useCallback(
    (pos: number) => {
      setPosition(pos);
      debouncedPersist(active, isPlaying, pos);
    },
    [active, isPlaying, debouncedPersist]
  );

  const clearTransmission = useCallback(async () => {
    setActive(null);
    setIsPlaying(false);
    setPosition(0);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    await supabase.from('active_transmissions').delete().eq('user_id', u.id);
  }, []);

  return {
    active,
    isPlaying,
    position,
    setTransmission,
    togglePlay,
    updatePosition,
    clearTransmission,
  };
}
