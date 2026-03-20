import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '@/lib/audioEngine';

/** Thin wrapper around the global mantra audio singleton (see `audioEngine`). */
export const useMantraPlayer = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((id: string, src: string, onNaturalEnd?: () => void) => {
    audioEngine.play(
      src,
      () => {
        setPlayingId(null);
        setIsPlaying(false);
        onNaturalEnd?.();
      },
      { endedEveryRepeat: false },
    );
    setPlayingId(id);
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    audioEngine.stop();
    setPlayingId(null);
    setIsPlaying(false);
  }, []);

  const pause = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    void audioEngine.resume();
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    return () => audioEngine.stop();
  }, []);

  return { play, stop, pause, resume, playingId, isPlaying, setPlayingId, setIsPlaying };
};
