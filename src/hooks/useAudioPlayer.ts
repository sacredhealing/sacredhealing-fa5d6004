// SQI 2050 — Android/Samsung-Proof Audio Engine
//
// ROOT CAUSE on Samsung A55 (One UI):
//   Samsung's battery optimizer + Doze mode suspends AudioContext
//   even while the app is in the foreground during long sessions.
//   Standard WakeLock alone doesn't stop this on One UI.
//
// THE FIX — three layers:
//   1. MediaSession API  → registers app as a real "media player" with Android OS.
//   2. Silent heartbeat  → every 20s, plays a 1-frame silent buffer through AudioContext.
//   3. visibilitychange  → resumes AudioContext immediately when user returns to tab.

import { useRef, useState, useEffect, useCallback } from 'react';

export interface AudioTrackMeta {
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  volume: number;
}

interface UseAudioPlayerReturn extends AudioPlayerState {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
}

export function useAudioPlayer(
  src: string | null | undefined,
  meta?: AudioTrackMeta,
  onEnded?: () => void | Promise<void>
): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isPlayingRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
    volume: 1,
  });

  const registerMediaSession = useCallback(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta?.title ?? 'Sacred Healing Meditation',
      artist: meta?.artist ?? 'Sacred Healing',
      album: meta?.album ?? 'Siddha-Quantum Intelligence',
      artwork: meta?.artwork
        ? [{ src: meta.artwork, sizes: '512x512', type: 'image/jpeg' }]
        : [{ src: '/favicon.ico', sizes: '96x96', type: 'image/png' }],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().catch(() => {});
      setState((prev) => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(
          audioRef.current.currentTime + (details.seekOffset ?? 10),
          audioRef.current.duration
        );
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(
          audioRef.current.currentTime - (details.seekOffset ?? 10),
          0
        );
      }
    });
  }, [meta?.title, meta?.artist, meta?.album, meta?.artwork]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      try {
        const silence = ctx.createBuffer(1, 1, ctx.sampleRate);
        const bufSrc = ctx.createBufferSource();
        bufSrc.buffer = silence;
        bufSrc.connect(ctx.destination);
        bufSrc.start();
        bufSrc.stop(ctx.currentTime + 0.001);
      } catch {
        // non-critical
      }
    }, 20_000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (
        navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } }
      ).wakeLock.request('screen');
    } catch {
      /* optional */
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;

      const ctx = audioCtxRef.current;
      if (ctx?.state === 'suspended') await ctx.resume().catch(() => {});

      if (isPlayingRef.current) await requestWakeLock();

      const audio = audioRef.current;
      if (audio && isPlayingRef.current && audio.paused && !audio.ended) {
        audio.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [requestWakeLock]);

  useEffect(() => {
    if (!src) {
      stopHeartbeat();
      releaseWakeLock();
      if (audioRef.current) {
        const a = audioRef.current;
        a.pause();
        a.src = '';
        audioRef.current = null;
      }
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      isPlayingRef.current = false;
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isLoading: false,
        error: null,
      }));
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    audioCtxRef.current?.close().catch(() => {});
    stopHeartbeat();
    releaseWakeLock();

    const AudioCtxCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    Object.defineProperty(audio, 'playsInline', { value: true });
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.setAttribute('x-webkit-airplay', 'allow');

    audio.src = src;
    audio.load();
    audioRef.current = audio;

    if (AudioCtxCtor) {
      try {
        const ctx = new AudioCtxCtor();
        const source = ctx.createMediaElementSource(audio);
        source.connect(ctx.destination);
        audioCtxRef.current = ctx;
      } catch {
        /* plain <audio> fallback */
      }
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null, currentTime: 0, duration: 0 }));

    const onMeta = () => setState((prev) => ({ ...prev, duration: audio.duration, isLoading: false }));
    const onTime = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
      if ('mediaSession' in navigator && audio.duration) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {
          /* unsupported */
        }
      }
    };
    const onEnded = () => {
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
      stopHeartbeat();
      releaseWakeLock();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      void onEndedRef.current?.();
    };
    const onError = () => {
      const err = audio.error?.message || 'Audio failed to load';
      setState((prev) => ({ ...prev, isPlaying: false, isLoading: false, error: err }));
      isPlayingRef.current = false;
    };
    const onWaiting = () => setState((prev) => ({ ...prev, isLoading: true }));
    const onCanPlay = () => setState((prev) => ({ ...prev, isLoading: false }));

    const onStalled = () => {
      const ctx = audioCtxRef.current;
      if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
      if (isPlayingRef.current && audio.paused) {
        setTimeout(() => {
          if (isPlayingRef.current && audio.paused) {
            audio.play().catch(() => {});
          }
        }, 800);
      }
    };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('suspend', onStalled);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('suspend', onStalled);
      audioCtxRef.current?.close().catch(() => {});
      stopHeartbeat();
      releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = audioCtxRef.current;
    if (ctx?.state === 'suspended') await ctx.resume().catch(() => {});

    try {
      await audio.play();
      isPlayingRef.current = true;
      setState((prev) => ({ ...prev, isPlaying: true, error: null }));

      registerMediaSession();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';

      await requestWakeLock();
      startHeartbeat();
    } catch {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        error: 'Tap play to start audio.',
      }));
    }
  }, [registerMediaSession, requestWakeLock, startHeartbeat]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    isPlayingRef.current = false;
    setState((prev) => ({ ...prev, isPlaying: false }));
    stopHeartbeat();
    releaseWakeLock();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }, [stopHeartbeat, releaseWakeLock]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setState((prev) => ({ ...prev, volume: vol }));
    }
  }, []);

  return { ...state, play, pause, seek, setVolume };
}
