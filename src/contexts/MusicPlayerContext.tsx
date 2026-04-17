import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSHC } from '@/contexts/SHCContext';
import { navigateTo } from '@/utils/navigation';
import { getDayPhase, getSessionDepth } from '@/utils/postSessionContext';

const SH_LAST_SESSION_KEY = 'sh_last_session';
const SH_LAST_SESSION_UPDATED = 'sh_last_session_updated';

function writeLastSessionAndNotify(ts: number, durationSec: number, type: string): void {
  try {
    localStorage.setItem(
      SH_LAST_SESSION_KEY,
      JSON.stringify({ v: 1, ts, duration: durationSec, type })
    );
    window.dispatchEvent(new Event(SH_LAST_SESSION_UPDATED));
  } catch (_) {}
}

// Audio content type enum
export type AudioContentType = 'music' | 'meditation' | 'healing';

export interface Track {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  genre: string;
  duration_seconds: number;
  preview_url: string;
  full_audio_url: string;
  cover_image_url: string | null;
  price_usd: number;
  shc_reward: number;
  play_count: number;
  bpm: number | null;
  release_date: string | null;
  created_at: string;
  // Spiritual metadata fields
  mood: string | null;
  spiritual_path: string | null;
  intended_use: string | null;
  affirmation: string | null;
  creator_notes: string | null;
  // Audio analysis fields
  energy_level: string | null;
  rhythm_type: string | null;
  vocal_type: string | null;
  frequency_band: string | null;
  best_time_of_day: string | null;
  spiritual_description: string | null;
  auto_generated_description: string | null;
  auto_generated_affirmation: string | null;
  analysis_status: string | null;
}

// Universal audio item that works for music, meditation, and healing
export interface UniversalAudioItem {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  preview_url?: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  shc_reward: number;
  contentType: AudioContentType;
  // Original data reference
  originalData?: any;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  currentAudio: UniversalAudioItem | null;
  audioContentType: AudioContentType | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isLoop: boolean;
  queue: Track[];
  purchasedIds: string[];
  likedIds: string[];
  isSubscribed: boolean;
  
  playTrack: (track: Track, queue?: Track[]) => void;
  playUniversalAudio: (audio: UniversalAudioItem) => void;
  togglePlay: () => void;
  seekTo: (percent: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleLike: (trackId: string) => void;
  hasAccess: (track: Track) => boolean;
  formatTime: (seconds: number) => string;
  refreshPurchases: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  stopTrack: () => void;
  /** True while showing Gita verse overlay (meditation session transition) */
  showGitaTransition: boolean;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return context;
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { addOptimisticBalance } = useSHC();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentAudio, setCurrentAudio] = useState<UniversalAudioItem | null>(null);
  const [audioContentType, setAudioContentType] = useState<AudioContentType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [purchasedAlbumTrackIds, setPurchasedAlbumTrackIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [showGitaTransition, setShowGitaTransition] = useState(false);
  const gitaTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const completedThresholdForIdRef = useRef<string | null>(null);
  const devForceEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PREVIEW_LIMIT = 30;

  const hasAccess = useCallback((track: Track) => {
    return isSubscribed || purchasedIds.includes(track.id) || purchasedAlbumTrackIds.includes(track.id);
  }, [isSubscribed, purchasedIds, purchasedAlbumTrackIds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const refreshPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Fetch individual track purchases
    const { data: trackPurchases } = await supabase.from('music_purchases').select('track_id').eq('user_id', user.id);
    if (trackPurchases) setPurchasedIds(trackPurchases.map(p => p.track_id));
    
    // Fetch album purchases and their tracks
    const { data: albumPurchases } = await supabase.from('album_purchases').select('album_id').eq('user_id', user.id);
    if (albumPurchases && albumPurchases.length > 0) {
      const albumIds = albumPurchases.map(p => p.album_id);
      const { data: albumTracks } = await supabase.from('album_tracks').select('track_id').in('album_id', albumIds);
      if (albumTracks) setPurchasedAlbumTrackIds(albumTracks.map(t => t.track_id));
    } else {
      setPurchasedAlbumTrackIds([]);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsSubscribed(false); return; }

      const { data: isAdminData } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });
      if (isAdminData === true) { setIsSubscribed(true); return; }

      // ◈ SQI 2050 — Music access via unified membership tiers (join slug from membership_tiers)
      const { data: rows } = await supabase
        .from('user_memberships')
        .select('membership_tiers(slug)')
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      const paidTiers = [
        'prana-monthly', 'prana-flow',
        'premium-monthly', 'premium-annual',
        'siddha-quantum', 'siddha-quantum-monthly',
        'lifetime', 'akasha-infinity',
        'music-monthly', 'music-yearly',
        'meditation-monthly', 'meditation-yearly',
      ];

      const slugs = (rows ?? [])
        .map((row: { membership_tiers?: { slug?: string } | { slug?: string }[] | null }) => {
          const mt = row.membership_tiers;
          const s = Array.isArray(mt) ? mt[0]?.slug : mt?.slug;
          return s?.toLowerCase() ?? '';
        })
        .filter(Boolean);

      setIsSubscribed(slugs.some((s) => paidTiers.includes(s)));
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  };

  const loadLikedTracks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Using local storage for likes since no dedicated table
    const likes = JSON.parse(localStorage.getItem(`music_likes_${user.id}`) || '[]');
    setLikedIds(likes);
  };

  useEffect(() => {
    refreshPurchases();
    checkSubscription();
    loadLikedTracks();
  }, []);

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    const canPlayFull = isSubscribed || purchasedIds.includes(track.id) || purchasedAlbumTrackIds.includes(track.id);
    
    if (currentTrack?.id === track.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const audioUrl = canPlayFull ? track.full_audio_url : track.preview_url;
    audioRef.current = new Audio(audioUrl);
    audioRef.current.volume = volume;
    
    audioRef.current.onloadedmetadata = () => {
      if (audioRef.current) setDuration(audioRef.current.duration);
    };
    
    audioRef.current.ontimeupdate = () => {
      if (!audioRef.current) return;
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      setProgress((time / audioRef.current.duration) * 100);
      
      if (!canPlayFull && time >= PREVIEW_LIMIT) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        toast({ title: "Preview ended", description: "Subscribe or purchase for full track." });
      }
    };
    
    // Track start time for duration validation
    const playStartTime = Date.now();
    
    audioRef.current.onended = async () => {
      if (isLoop && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        return;
      }
      
      setIsPlaying(false);
      
      // Validate and award SHC only for full track plays with anti-farming
      if (canPlayFull) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const durationListened = Math.floor((Date.now() - playStartTime) / 1000);
          const minDuration = Math.floor(track.duration_seconds * 0.8); // 80% minimum
          
          // Check if user completed this track in the last 24 hours
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: recentCompletion } = await supabase
            .from('music_completions')
            .select('id')
            .eq('user_id', user.id)
            .eq('track_id', track.id)
            .gte('completed_at', twentyFourHoursAgo)
            .limit(1);
          
          if (recentCompletion && recentCompletion.length > 0) {
            toast({ title: "Already completed today", description: "Earn rewards again after 24 hours." });
          } else if (durationListened >= minDuration) {
            // Record completion
            await supabase.from('music_completions').insert({
              user_id: user.id,
              track_id: track.id,
              duration_listened: durationListened,
              shc_earned: track.shc_reward
            });
            
            // Update balance
            const { data: balanceData } = await supabase
              .from('user_balances')
              .select('balance, total_earned')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (balanceData) {
              await supabase.from('user_balances').update({
                balance: balanceData.balance + track.shc_reward,
                total_earned: balanceData.total_earned + track.shc_reward
              }).eq('user_id', user.id);
            }
            
            // Record transaction
            await supabase.from('shc_transactions').insert({
              user_id: user.id,
              type: 'earned',
              amount: track.shc_reward,
              description: `Music completed: ${track.title}`,
              status: 'completed'
            });
            
            addOptimisticBalance(track.shc_reward);
            toast({ title: `+${track.shc_reward} SHC earned!`, description: `Completed "${track.title}"` });
          } else {
            toast({ title: "Listen longer", description: "Listen to at least 80% to earn rewards." });
          }
        }
      }
      
      // Auto-play next
      if (queue.length > 0 && currentQueueIndex < queue.length - 1) {
        const nextIndex = isShuffle ? Math.floor(Math.random() * queue.length) : currentQueueIndex + 1;
        setCurrentQueueIndex(nextIndex);
        playTrack(queue[nextIndex]);
      }
    };
    
    audioRef.current.play();
    setCurrentTrack(track);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
    
    if (newQueue) {
      setQueue(newQueue);
      setCurrentQueueIndex(newQueue.findIndex(t => t.id === track.id) || 0);
    }
    
    // Update play history and increment global play count
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('music_play_history').upsert({
        user_id: user.id,
        track_id: track.id,
        play_count: 1,
        last_played_at: new Date().toISOString()
      }, { onConflict: 'user_id,track_id' });
    }
    
    // Increment global play count
    await supabase.from('music_tracks').update({
      play_count: track.play_count + 1
    }).eq('id', track.id);
  }, [currentTrack, isPlaying, volume, isSubscribed, purchasedIds, purchasedAlbumTrackIds, isLoop, isShuffle, queue, currentQueueIndex, addOptimisticBalance, toast]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    // Music uses currentTrack; meditations/healing from Nadi & library use currentAudio only
    if (!currentTrack && !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack, currentAudio]);

  const seekTo = useCallback((percent: number) => {
    if (!audioRef.current) return;
    if (!currentTrack && !currentAudio) return;
    const seekTime = (percent / 100) * audioRef.current.duration;
    
    if (currentTrack && !hasAccess(currentTrack) && seekTime > PREVIEW_LIMIT) {
      toast({ title: "Preview limit", description: "Subscribe to seek past 30 seconds." });
      return;
    }
    
    audioRef.current.currentTime = seekTime;
    setProgress(percent);
    setCurrentTime(seekTime);
  }, [currentTrack, currentAudio, hasAccess, toast]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const toggleShuffle = useCallback(() => setIsShuffle(prev => !prev), []);
  const toggleLoop = useCallback(() => setIsLoop(prev => !prev), []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = isShuffle 
      ? Math.floor(Math.random() * queue.length)
      : (currentQueueIndex + 1) % queue.length;
    setCurrentQueueIndex(nextIndex);
    playTrack(queue[nextIndex]);
  }, [queue, currentQueueIndex, isShuffle, playTrack]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = currentQueueIndex === 0 ? queue.length - 1 : currentQueueIndex - 1;
    setCurrentQueueIndex(prevIndex);
    playTrack(queue[prevIndex]);
  }, [queue, currentQueueIndex, playTrack]);

  const toggleLike = useCallback(async (trackId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to like tracks." });
      return;
    }
    
    const key = `music_likes_${user.id}`;
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const isLiked = current.includes(trackId);
    
    const updated = isLiked 
      ? current.filter((id: string) => id !== trackId)
      : [...current, trackId];
    
    localStorage.setItem(key, JSON.stringify(updated));
    setLikedIds(updated);
    toast({ title: isLiked ? "Removed from likes" : "Added to likes" });
  }, [toast]);

  const stopTrack = useCallback(() => {
    if (gitaTransitionTimeoutRef.current) {
      clearTimeout(gitaTransitionTimeoutRef.current);
      gitaTransitionTimeoutRef.current = null;
    }
    setShowGitaTransition(false);
    if (devForceEndTimeoutRef.current) {
      clearTimeout(devForceEndTimeoutRef.current);
      devForceEndTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTrack(null);
    setCurrentAudio(null);
    setAudioContentType(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Universal audio player for meditation and healing
  const playUniversalAudio = useCallback(async (audio: UniversalAudioItem) => {
    // If same audio is playing, toggle play/pause
    if (currentAudio?.id === audio.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (devForceEndTimeoutRef.current) {
      clearTimeout(devForceEndTimeoutRef.current);
      devForceEndTimeoutRef.current = null;
    }
    completedThresholdForIdRef.current = null;

    // Reset music track when playing meditation/healing
    setCurrentTrack(null);

    // Meditations should start immediately (no pre-play overlay gating).

    const audioUrl = audio.audio_url;
    const el = new Audio();
    // Mobile resilience — keep playback alive when tab backgrounded / device locks
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.src = audioUrl;
    el.volume = volume;
    audioRef.current = el;
    playStartTimeRef.current = Date.now();

    audioRef.current.onloadedmetadata = () => {
      if (audioRef.current) setDuration(audioRef.current.duration);
    };

    // Sync UI when the OS / browser pauses or resumes the stream
    audioRef.current.onpause = () => {
      // Do not flip to paused if the audio actually finished (onended will run)
      if (audioRef.current && !audioRef.current.ended) {
        setIsPlaying(false);
      }
    };
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onplaying = () => setIsPlaying(true);

    // Recover from transient stalls / network interruptions on long meditations
    audioRef.current.onstalled = () => {
      console.warn('[meditation audio] stalled — attempting to resume');
      void audioRef.current?.play().catch(() => {});
    };
    audioRef.current.onwaiting = () => {
      // Buffering — keep state as playing, do not flip
    };
    audioRef.current.onerror = () => {
      const err = audioRef.current?.error;
      console.error('[meditation audio] error', err);
      // One automatic retry from the last known position
      const resumeAt = audioRef.current?.currentTime ?? 0;
      try {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.currentTime = resumeAt;
          void audioRef.current.play().catch(() => {
            setIsPlaying(false);
            toast({
              title: 'Playback interrupted',
              description: 'Tap play to resume your meditation.',
            });
          });
        }
      } catch {
        setIsPlaying(false);
      }
    };

    audioRef.current.ontimeupdate = () => {
      if (!audioRef.current) return;
      const time = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(time);
      setProgress(dur > 0 && isFinite(dur) ? (time / dur) * 100 : 0);
      // Completion threshold backup (mobile sometimes doesn't fire onended)
      if (isFinite(dur) && dur > 0 && time >= dur - 0.25 && completedThresholdForIdRef.current !== audio.id) {
        completedThresholdForIdRef.current = audio.id;
        const durationListenedSec = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
        writeLastSessionAndNotify(Date.now(), durationListenedSec, audio.contentType);
      }
    };
    
    audioRef.current.onended = async () => {
      setIsPlaying(false);
      const durationListenedSec = Math.floor((Date.now() - playStartTimeRef.current) / 1000);

      writeLastSessionAndNotify(Date.now(), durationListenedSec, audio.contentType);

      // Award SHC for meditation/healing completion (unchanged)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && audio.shc_reward > 0) {
        const minDuration = Math.floor(audio.duration_seconds * 0.8);
        
        if (durationListenedSec >= minDuration) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          let hasRecentCompletion = false;
          
          if (audio.contentType === 'meditation') {
            const { data: recentCompletion } = await supabase
              .from('meditation_completions')
              .select('id')
              .eq('user_id', user.id)
              .eq('meditation_id', audio.id)
              .gte('created_at', twentyFourHoursAgo)
              .limit(1);
            hasRecentCompletion = (recentCompletion && recentCompletion.length > 0);
          } else {
            const { data: recentCompletion } = await supabase
              .from('content_analytics')
              .select('id')
              .eq('user_id', user.id)
              .eq('content_id', audio.id)
              .gte('created_at', twentyFourHoursAgo)
              .limit(1);
            hasRecentCompletion = (recentCompletion && recentCompletion.length > 0);
          }
          
          if (!hasRecentCompletion) {
            const { data: balanceData } = await supabase
              .from('user_balances')
              .select('balance, total_earned')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (balanceData) {
              await supabase.from('user_balances').update({
                balance: balanceData.balance + audio.shc_reward,
                total_earned: balanceData.total_earned + audio.shc_reward
              }).eq('user_id', user.id);
            }
            
            await supabase.from('shc_transactions').insert({
              user_id: user.id,
              type: 'earned',
              amount: audio.shc_reward,
              description: `${audio.contentType} completed: ${audio.title}`,
              status: 'completed'
            });
            
            addOptimisticBalance(audio.shc_reward);
            toast({ title: `+${audio.shc_reward} SHC earned!`, description: `Completed "${audio.title}"` });
          } else {
            toast({ title: "Already completed today", description: "Earn rewards again after 24 hours." });
          }
        }
      }
      
      // Post-session redirect to integration layer
      const ctx = {
        dayPhase: getDayPhase(),
        userState: 'engaged',
        streakDays: 0,
        depth: getSessionDepth(durationListenedSec),
        durationSec: durationListenedSec,
        completed: true,
        item: { id: audio.id, title: audio.title, contentType: audio.contentType },
      };
      await new Promise((r) => setTimeout(r, 1200));
      (navigateTo as any)('/integrate', { state: ctx });
    };
    
    void audioRef.current.play().catch((err) => {
      console.error('[meditation audio] initial play() failed', err);
      setIsPlaying(false);
    });
    setCurrentAudio(audio);
    setAudioContentType(audio.contentType);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);

    // MediaSession — keeps audio alive when the screen locks / tab is backgrounded
    // and exposes lock-screen controls so iOS/Android won't suspend the stream.
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: audio.title,
          artist: audio.artist || 'Sacred Healing',
          artwork: audio.cover_image_url
            ? [{ src: audio.cover_image_url, sizes: '512x512', type: 'image/png' }]
            : [],
        });
        navigator.mediaSession.setActionHandler('play', () => {
          void audioRef.current?.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          audioRef.current?.pause();
        });
      } catch {
        // Non-fatal — older browsers
      }
    }

    // DEV-only: ?devForceEnd=1 simulates session end after 4s for testing Library flip
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      if (params.get('devForceEnd') === '1') {
        devForceEndTimeoutRef.current = setTimeout(() => {
          writeLastSessionAndNotify(Date.now(), 240, audio.contentType);
          devForceEndTimeoutRef.current = null;
        }, 4000);
      }
    }
  }, [currentAudio, isPlaying, volume, addOptimisticBalance, toast]);

  return (
    <MusicPlayerContext.Provider value={{
      currentTrack,
      currentAudio,
      audioContentType,
      isPlaying,
      progress,
      currentTime,
      duration,
      volume,
      isShuffle,
      isLoop,
      queue,
      purchasedIds,
      likedIds,
      isSubscribed,
      playTrack,
      playUniversalAudio,
      togglePlay,
      seekTo,
      setVolume,
      toggleShuffle,
      toggleLoop,
      nextTrack,
      prevTrack,
      toggleLike,
      hasAccess,
      formatTime,
      refreshPurchases,
      checkSubscription,
      stopTrack,
      showGitaTransition,
    }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
