import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safePlay, proxyAudioUrl } from '@/utils/safeAudioPlay';

export interface AmbientSound {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  audio_url: string | null;
  icon_name: string;
  is_active: boolean;
  order_index: number;
}

interface AmbientAudioContextType {
  sounds: AmbientSound[];
  currentSound: AmbientSound | null;
  isPlaying: boolean;
  volume: number;
  isLoading: boolean;
  playSound: (sound: AmbientSound) => void;
  stopSound: () => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  fetchSounds: () => Promise<void>;
}

const AmbientAudioContext = createContext<AmbientAudioContextType | undefined>(undefined);

const DEFAULT_VOLUME = 0.3;

export const AmbientAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [sounds, setSounds] = useState<AmbientSound[]>([]);
  const [currentSound, setCurrentSound] = useState<AmbientSound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSounds = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ambient_sounds')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSounds((data as AmbientSound[]) || []);
    } catch (error) {
      console.error('Error fetching ambient sounds:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  useEffect(() => {
    const savedVolume = localStorage.getItem('ambient-audio-volume');
    if (savedVolume) {
      setVolumeState(parseFloat(savedVolume));
    }
  }, []);

  const playSound = useCallback((sound: AmbientSound) => {
    // Route R2 URLs through proxy to fix CORS
    const resolvedUrl = proxyAudioUrl(sound.audio_url);
    if (!resolvedUrl) {
      console.warn('[SQI] No audio URL for ambient sound:', sound.name);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(resolvedUrl);
    audio.loop = true;
    audio.volume = volume;
    // Preload so mobile doesn't silently fail
    audio.preload = 'auto';
    audioRef.current = audio;
    
    void (async () => {
      const el = audioRef.current;
      if (!el) return;
      const ok = await safePlay(el, (err) => {
        console.error('[SQI] Ambient audio failed:', sound.name, err.message);
      });
      if (ok) {
        setCurrentSound(sound);
        setIsPlaying(true);
      } else {
        console.warn('[SQI] Could not play ambient sound — browser blocked autoplay:', sound.name);
      }
    })();
  }, [volume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentSound(null);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void (async () => {
        const el = audioRef.current;
        if (!el) return;
        const ok = await safePlay(el);
        setIsPlaying(ok);
      })();
    }
  }, [isPlaying]);

  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);
    localStorage.setItem('ambient-audio-volume', clampedVol.toString());
    if (audioRef.current) {
      audioRef.current.volume = clampedVol;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <AmbientAudioContext.Provider
      value={{
        sounds,
        currentSound,
        isPlaying,
        volume,
        isLoading,
        playSound,
        stopSound,
        togglePlay,
        setVolume,
        fetchSounds,
      }}
    >
      {children}
    </AmbientAudioContext.Provider>
  );
};

export const useAmbientAudio = () => {
  const context = useContext(AmbientAudioContext);
  if (context === undefined) {
    throw new Error('useAmbientAudio must be used within an AmbientAudioProvider');
  }
  return context;
};
