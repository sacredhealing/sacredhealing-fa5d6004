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
  const generatedCtxRef = useRef<AudioContext | null>(null);
  const generatedCleanupRef = useRef<(() => void) | null>(null);
  
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

  const stopGeneratedSound = useCallback(() => {
    generatedCleanupRef.current?.();
    generatedCleanupRef.current = null;
    generatedCtxRef.current?.close().catch(() => {});
    generatedCtxRef.current = null;
  }, []);

  const playGeneratedSound = useCallback((sound: AmbientSound) => {
    stopGeneratedSound();
    const AudioCtxCtor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxCtor) return;

    const ctx = new AudioCtxCtor();
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    const nodes: AudioNode[] = [master];
    const stopFns: Array<() => void> = [];

    if (sound.slug === 'temple-rain') {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.7;
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      source.buffer = buffer;
      source.loop = true;
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      source.connect(filter).connect(master);
      source.start();
      stopFns.push(() => source.stop());
      nodes.push(filter);
    } else {
      const freqs = sound.slug === 'deep-om' ? [136.1, 272.2] : [216, 432, 864];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = index === 0 ? 0.28 : 0.1;
        osc.connect(gain).connect(master);
        osc.start();
        stopFns.push(() => osc.stop());
        nodes.push(gain);
      });
    }

    generatedCtxRef.current = ctx;
    generatedCleanupRef.current = () => stopFns.forEach((stop) => {
      try { stop(); } catch (_) { /* already stopped */ }
    });
    void ctx.resume();
    setCurrentSound(sound);
    setIsPlaying(true);
  }, [stopGeneratedSound, volume]);

  const playSound = useCallback((sound: AmbientSound) => {
    // Route R2 URLs through proxy to fix CORS
    const resolvedUrl = proxyAudioUrl(sound.audio_url);
    if (!resolvedUrl) {
      playGeneratedSound(sound);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopGeneratedSound();

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
  }, [playGeneratedSound, stopGeneratedSound, volume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopGeneratedSound();
    setCurrentSound(null);
    setIsPlaying(false);
  }, [stopGeneratedSound]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      const ctx = generatedCtxRef.current;
      if (!ctx) return;

      if (isPlaying) {
        void ctx.suspend();
        setIsPlaying(false);
      } else {
        void ctx.resume();
        setIsPlaying(true);
      }
      return;
    }
    
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
    const ctx = generatedCtxRef.current;
    if (ctx) {
      const gain = ctx.destination.numberOfInputs ? null : null;
      void gain;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopGeneratedSound();
    };
  }, [stopGeneratedSound]);

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
