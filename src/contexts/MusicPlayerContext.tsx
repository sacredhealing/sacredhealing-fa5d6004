import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSHC } from '@/contexts/SHCContext';
import { navigateTo } from '@/utils/navigation';
import { getDayPhase, getSessionDepth } from '@/utils/postSessionContext';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useUpgradeModal } from '@/components/UpgradeModal';
import { getMusicTrackRequiredRank, getUserMusicAccessRank } from '@/lib/tierAccess';
import { safePlay } from '@/utils/safeAudioPlay';
import { AudioErrorBoundary } from '@/components/AudioErrorBoundary';

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
  auto_analysis_data?: Record<string, unknown> | null;
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

/** Persisted row shape for `active_transmissions` (cross-device resume). */
export interface ActiveTransmissionRowInput {
  transmission_id: string;
  transmission_title: string;
  transmission_url: string;
  transmission_type: string;
  is_playing: boolean;
  playback_position: number;
  metadata: Record<string, unknown>;
}

interface ActiveTransmissionDbRow {
  transmission_id: string | null;
  transmission_title: string | null;
  transmission_url: string | null;
  transmission_type: string | null;
  playback_position: number | null;
  metadata: Record<string, unknown> | null;
}

function trackFromActiveTransmissionRow(data: ActiveTransmissionDbRow): Track {
  const meta = (data.metadata || {}) as Partial<Track> & Record<string, unknown>;
  const url = data.transmission_url || '';
  return {
    id: data.transmission_id || '',
    title: data.transmission_title || 'Transmission',
    artist: typeof meta.artist === 'string' ? meta.artist : '',
    description: null,
    genre: typeof meta.genre === 'string' ? meta.genre : 'General',
    duration_seconds: typeof meta.duration_seconds === 'number' ? meta.duration_seconds : 0,
    preview_url: url,
    full_audio_url: url,
    cover_image_url: typeof meta.cover_image_url === 'string' ? meta.cover_image_url : null,
    price_usd: 0,
    shc_reward: typeof meta.shc_reward === 'number' ? meta.shc_reward : 0,
    play_count: 0,
    bpm: null,
    release_date: null,
    created_at: new Date().toISOString(),
    mood: null,
    spiritual_path: null,
    intended_use: null,
    affirmation: null,
    creator_notes: null,
    energy_level: null,
    rhythm_type: null,
    vocal_type: null,
    frequency_band: null,
    best_time_of_day: null,
    spiritual_description: null,
    auto_generated_description: null,
    auto_generated_affirmation: null,
    analysis_status: null,
  };
}

function universalFromActiveTransmissionRow(data: ActiveTransmissionDbRow): UniversalAudioItem {
  const meta = (data.metadata || {}) as Record<string, unknown>;
  const url = data.transmission_url || '';
  const ct =
    (meta.contentType as AudioContentType | undefined) ||
    (data.transmission_type === 'healing' ? 'healing' : 'meditation');
  return {
    id: data.transmission_id || '',
    title: data.transmission_title || '',
    artist: typeof meta.artist === 'string' ? meta.artist : '',
    audio_url: url,
    preview_url: typeof meta.preview_url === 'string' ? meta.preview_url : null,
    cover_image_url: typeof meta.cover_image_url === 'string' ? meta.cover_image_url : null,
    duration_seconds: typeof meta.duration_seconds === 'number' ? meta.duration_seconds : 0,
    shc_reward: typeof meta.shc_reward === 'number' ? meta.shc_reward : 0,
    contentType: ct,
  };
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
  
  playTrack: (
    track: Track,
    queue?: Track[],
    opts?: { resumePositionSec?: number; autoPlay?: boolean }
  ) => void | Promise<void>;
  playUniversalAudio: (
    audio: UniversalAudioItem,
    opts?: { resumePositionSec?: number; autoPlay?: boolean }
  ) => void | Promise<void>;
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
  const { user } = useAuth();
  const { isAdmin, adminGranted, isPremium, tier: membershipTier } = useMembership();
  const { triggerUpgradeModal, UpgradeModalComponent } = useUpgradeModal();
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
  const pendingMeditationMountRef = useRef(false);
  const pendingMeditationShouldPlayRef = useRef(true);
  const pendingMeditationResumeSecRef = useRef(0);
  const persistTxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipPersistTxRef = useRef(false);
  const transmissionRestoreDoneForUserRef = useRef<string | null>(null);
  const currentAudioRef = useRef<UniversalAudioItem | null>(null);

  const PREVIEW_LIMIT = 30;

  const userMusicRank = useMemo(
    () => getUserMusicAccessRank({ user, isAdmin, adminGranted, isPremium, membershipTier }),
    [user, isAdmin, adminGranted, isPremium, membershipTier]
  );

  const trackHasFullPlayAccess = useCallback(
    (track: Track) =>
      purchasedIds.includes(track.id) ||
      purchasedAlbumTrackIds.includes(track.id) ||
      userMusicRank >= getMusicTrackRequiredRank(track),
    [purchasedIds, purchasedAlbumTrackIds, userMusicRank]
  );

  const persistActiveTransmissionRow = useCallback(
    async (row: ActiveTransmissionRowInput | null) => {
      const uid = user?.id;
      if (!uid) return;
      if (!row) {
        await supabase.from('active_transmissions').delete().eq('user_id', uid);
        return;
      }
      await supabase.from('active_transmissions').upsert(
        {
          user_id: uid,
          transmission_id: row.transmission_id,
          transmission_title: row.transmission_title,
          transmission_url: row.transmission_url,
          transmission_type: row.transmission_type,
          is_playing: row.is_playing,
          playback_position: row.playback_position,
          metadata: row.metadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    },
    [user?.id]
  );

  const schedulePersistTransmission = useCallback(
    (row: ActiveTransmissionRowInput | null) => {
      if (skipPersistTxRef.current || !user?.id) return;
      if (!row) return;
      if (persistTxTimerRef.current) clearTimeout(persistTxTimerRef.current);
      persistTxTimerRef.current = setTimeout(() => {
        persistTxTimerRef.current = null;
        void persistActiveTransmissionRow(row);
      }, 1500);
    },
    [persistActiveTransmissionRow, user?.id]
  );

  useEffect(() => () => {
    if (persistTxTimerRef.current) clearTimeout(persistTxTimerRef.current);
  }, []);

  const meditationSrc = useMemo(() => {
    if (!currentAudio?.audio_url) return null;
    if (audioContentType !== 'meditation' && audioContentType !== 'healing') return null;
    return currentAudio.audio_url;
  }, [currentAudio, audioContentType]);

  const meditationMeta = useMemo(() => {
    if (!currentAudio || (audioContentType !== 'meditation' && audioContentType !== 'healing')) return undefined;
    return {
      title: currentAudio.title,
      artist: currentAudio.artist?.trim() ? currentAudio.artist : 'Kritagya Das',
      artwork: currentAudio.cover_image_url || undefined,
    };
  }, [currentAudio, audioContentType]);

  useEffect(() => {
    currentAudioRef.current = currentAudio;
  }, [currentAudio]);

  const handleMeditationEnded = useCallback(async () => {
    const audio = currentAudioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    const durationListenedSec = Math.floor((Date.now() - playStartTimeRef.current) / 1000);

    writeLastSessionAndNotify(Date.now(), durationListenedSec, audio.contentType);

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
          hasRecentCompletion = !!(recentCompletion && recentCompletion.length > 0);
        } else {
          const { data: recentCompletion } = await supabase
            .from('content_analytics')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_id', audio.id)
            .gte('created_at', twentyFourHoursAgo)
            .limit(1);
          hasRecentCompletion = !!(recentCompletion && recentCompletion.length > 0);
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
              total_earned: balanceData.total_earned + audio.shc_reward,
            }).eq('user_id', user.id);
          }

          await supabase.from('shc_transactions').insert({
            user_id: user.id,
            type: 'earned',
            amount: audio.shc_reward,
            description: `${audio.contentType} completed: ${audio.title}`,
            status: 'completed',
          });

          addOptimisticBalance(audio.shc_reward);
          toast({ title: `+${audio.shc_reward} SHC earned!`, description: `Completed "${audio.title}"` });
        } else {
          toast({ title: 'Already completed today', description: 'Earn rewards again after 24 hours.' });
        }
      }
    }

    const ctx = {
      dayPhase: getDayPhase(),
      userState: 'engaged',
      streakDays: 0,
      depth: getSessionDepth(durationListenedSec),
      durationSec: durationListenedSec,
      completed: true,
      item: { id: audio.id, title: audio.title, contentType: audio.contentType },
    };

    triggerUpgradeModal(audio.contentType === 'meditation' ? 'meditation' : 'audio');

    await new Promise((r) => setTimeout(r, 1200));
    (navigateTo as (path: string, opts?: unknown) => void)('/integrate', { state: ctx });
  }, [addOptimisticBalance, toast, triggerUpgradeModal]);

  const medPlayer = useAudioPlayer(meditationSrc, meditationMeta, handleMeditationEnded);

  const medPlayerRef = useRef(medPlayer);
  medPlayerRef.current = medPlayer;

  useEffect(() => {
    if (!pendingMeditationMountRef.current || !meditationSrc) return;
    pendingMeditationMountRef.current = false;
    const shouldPlay = pendingMeditationShouldPlayRef.current;
    const resumeSec = pendingMeditationResumeSecRef.current;
    pendingMeditationResumeSecRef.current = 0;

    const run = async () => {
      const m = medPlayerRef.current;
      if (resumeSec > 0) {
        let tries = 0;
        while (tries < 50) {
          const d = m.duration;
          if (d > 0 && isFinite(d)) {
            m.seek(Math.min(resumeSec, Math.max(0, d - 0.25)));
            break;
          }
          await new Promise((r) => setTimeout(r, 50));
          tries += 1;
        }
      }
      if (shouldPlay) {
        await m.play().catch(() => setIsPlaying(false));
      } else {
        m.pause();
        setIsPlaying(false);
      }
    };

    void run();
  }, [meditationSrc]);

  useEffect(() => {
    if (audioContentType !== 'meditation' && audioContentType !== 'healing') return;
    setIsPlaying(medPlayer.isPlaying);
    setCurrentTime(medPlayer.currentTime);
    const dur = medPlayer.duration;
    setDuration(dur);
    setProgress(dur > 0 && isFinite(dur) ? (medPlayer.currentTime / dur) * 100 : 0);
  }, [audioContentType, medPlayer.isPlaying, medPlayer.currentTime, medPlayer.duration]);

  useEffect(() => {
    if (audioContentType !== 'meditation' && audioContentType !== 'healing') return;
    const audio = currentAudio;
    if (!audio?.id) return;
    const dur = medPlayer.duration;
    const time = medPlayer.currentTime;
    if (isFinite(dur) && dur > 0 && time >= dur - 0.25 && completedThresholdForIdRef.current !== audio.id) {
      completedThresholdForIdRef.current = audio.id;
      const durationListenedSec = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
      writeLastSessionAndNotify(Date.now(), durationListenedSec, audio.contentType);
    }
  }, [audioContentType, currentAudio?.id, medPlayer.currentTime, medPlayer.duration]);

  useEffect(() => {
    if (!meditationSrc) return;
    if (audioContentType !== 'meditation' && audioContentType !== 'healing') return;
    medPlayerRef.current.setVolume(volume);
  }, [meditationSrc, volume, audioContentType]);

  const hasAccess = useCallback(
    (track: Track) => trackHasFullPlayAccess(track),
    [trackHasFullPlayAccess]
  );

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
        'prana-flow',
        'siddha-quantum',
        'akasha-infinity',
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

  const playTrack = useCallback(async (
    track: Track,
    newQueue?: Track[],
    opts?: { resumePositionSec?: number; autoPlay?: boolean }
  ) => {
    const resumePositionSec = opts?.resumePositionSec ?? 0;
    const autoPlay = opts?.autoPlay !== false;
    const skipCounts = resumePositionSec > 0;
    const restoringSameTrack = resumePositionSec > 0;

    const canPlayFull = trackHasFullPlayAccess(track);

    if (currentTrack?.id === track.id && audioRef.current && !restoringSameTrack) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        void (async () => {
          const ok = await safePlay(audioRef.current!);
          setIsPlaying(ok);
        })();
      }
      return;
    }

    if (currentAudio) {
      setCurrentAudio(null);
      setAudioContentType(null);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioUrl = canPlayFull ? track.full_audio_url : track.preview_url;
    const audio = new Audio(audioUrl);
    audio.volume = volume;

    audio.ontimeupdate = () => {
      if (!audioRef.current) return;
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      const dur = audioRef.current.duration;
      if (dur > 0 && isFinite(dur)) {
        setProgress((time / dur) * 100);
      }

      if (!canPlayFull && time >= PREVIEW_LIMIT) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        toast({ title: "Preview ended", description: "Subscribe or purchase for full track." });
      }
    };

    const playStartTime = Date.now();

    audio.onended = async () => {
      if (isLoop && audioRef.current) {
        audioRef.current.currentTime = 0;
        await safePlay(audioRef.current);
        return;
      }

      setIsPlaying(false);

      if (canPlayFull) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const durationListened = Math.floor((Date.now() - playStartTime) / 1000);
          const minDuration = Math.floor(track.duration_seconds * 0.8);

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
            await supabase.from('music_completions').insert({
              user_id: user.id,
              track_id: track.id,
              duration_listened: durationListened,
              shc_earned: track.shc_reward
            });

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

      if (queue.length > 0 && currentQueueIndex < queue.length - 1) {
        const nextIndex = isShuffle ? Math.floor(Math.random() * queue.length) : currentQueueIndex + 1;
        setCurrentQueueIndex(nextIndex);
        playTrack(queue[nextIndex]);
      }
    };

    audioRef.current = audio;

    await new Promise<void>((resolve) => {
      const el = audioRef.current;
      if (!el) {
        resolve();
        return;
      }
      const applyMeta = () => {
        const a = audioRef.current;
        if (!a) return;
        const dur = a.duration;
        setDuration(dur);
        if (!isFinite(dur) || dur <= 0) return;
        const maxSeek = canPlayFull ? dur : Math.min(dur, PREVIEW_LIMIT);
        if (resumePositionSec > 0) {
          const seekTo = Math.min(resumePositionSec, Math.max(0, maxSeek - 0.05));
          a.currentTime = seekTo;
          setCurrentTime(seekTo);
          setProgress((seekTo / dur) * 100);
        }
      };
      if (el.readyState >= 1) {
        applyMeta();
        resolve();
      } else {
        el.addEventListener(
          'loadedmetadata',
          () => {
            applyMeta();
            resolve();
          },
          { once: true }
        );
      }
    });

    setCurrentTrack(track);
    if (!(resumePositionSec > 0)) {
      setProgress(0);
      setCurrentTime(0);
    }

    const started = autoPlay ? await safePlay(audio) : false;
    if (!autoPlay) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(started);
    }

    if (autoPlay && !started) {
      return;
    }

    if (newQueue) {
      setQueue(newQueue);
      setCurrentQueueIndex(newQueue.findIndex(t => t.id === track.id) || 0);
    }

    if (!skipCounts) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('music_play_history').upsert({
          user_id: user.id,
          track_id: track.id,
          play_count: 1,
          last_played_at: new Date().toISOString()
        }, { onConflict: 'user_id,track_id' });
      }

      await supabase.from('music_tracks').update({
        play_count: track.play_count + 1
      }).eq('id', track.id);
    }
  }, [currentTrack, isPlaying, volume, trackHasFullPlayAccess, isLoop, isShuffle, queue, currentQueueIndex, addOptimisticBalance, toast, currentAudio]);

  const togglePlay = useCallback(() => {
    if (currentAudio && (audioContentType === 'meditation' || audioContentType === 'healing')) {
      const m = medPlayerRef.current;
      if (m.isPlaying) m.pause();
      else void m.play().catch(() => setIsPlaying(false));
      return;
    }
    if (!audioRef.current) return;
    if (!currentTrack && !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void (async () => {
        const ok = await safePlay(audioRef.current!);
        setIsPlaying(ok);
      })();
    }
  }, [isPlaying, currentTrack, currentAudio, audioContentType]);

  const seekTo = useCallback((percent: number) => {
    if (currentAudio && (audioContentType === 'meditation' || audioContentType === 'healing')) {
      const m = medPlayerRef.current;
      const dur = m.duration;
      if (dur > 0 && isFinite(dur)) {
        m.seek((percent / 100) * dur);
      }
      return;
    }
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
  }, [currentTrack, currentAudio, hasAccess, toast, audioContentType]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (currentAudio && (audioContentType === 'meditation' || audioContentType === 'healing')) {
      medPlayerRef.current.setVolume(vol);
      return;
    }
    if (audioRef.current) audioRef.current.volume = vol;
  }, [currentAudio, audioContentType]);

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
    if (persistTxTimerRef.current) {
      clearTimeout(persistTxTimerRef.current);
      persistTxTimerRef.current = null;
    }
    void persistActiveTransmissionRow(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    medPlayerRef.current.pause();
    setCurrentTrack(null);
    setCurrentAudio(null);
    setAudioContentType(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [persistActiveTransmissionRow]);

  // Universal audio player for meditation and healing (useAudioPlayer: MediaSession + heartbeat + WakeLock)
  const playUniversalAudio = useCallback(async (
    audio: UniversalAudioItem,
    opts?: { resumePositionSec?: number; autoPlay?: boolean }
  ) => {
    if (audio.contentType !== 'meditation' && audio.contentType !== 'healing') {
      return;
    }

    const resumeSec = opts?.resumePositionSec ?? 0;
    const autoPlay = opts?.autoPlay !== false;
    const resumeSame = resumeSec > 0;

    if (currentAudio?.id === audio.id && !resumeSame) {
      const m = medPlayerRef.current;
      if (m.isPlaying) m.pause();
      else void m.play().catch(() => setIsPlaying(false));
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (devForceEndTimeoutRef.current) {
      clearTimeout(devForceEndTimeoutRef.current);
      devForceEndTimeoutRef.current = null;
    }
    completedThresholdForIdRef.current = null;

    setCurrentTrack(null);

    pendingMeditationMountRef.current = true;
    pendingMeditationShouldPlayRef.current = autoPlay;
    pendingMeditationResumeSecRef.current = resumeSec;
    playStartTimeRef.current = Date.now();
    setCurrentAudio(audio);
    setAudioContentType(audio.contentType);
    setProgress(0);
    setCurrentTime(0);

    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      if (params.get('devForceEnd') === '1') {
        devForceEndTimeoutRef.current = setTimeout(() => {
          writeLastSessionAndNotify(Date.now(), 240, audio.contentType);
          devForceEndTimeoutRef.current = null;
        }, 4000);
      }
    }
  }, [currentAudio]);

  useEffect(() => {
    if (!user?.id) {
      transmissionRestoreDoneForUserRef.current = null;
      return;
    }
    if (transmissionRestoreDoneForUserRef.current === user.id) return;

    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from('active_transmissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!data?.transmission_url || !data.transmission_id) {
        transmissionRestoreDoneForUserRef.current = user.id;
        return;
      }

      if (cancelled) return;

      const meta = (data.metadata || {}) as Record<string, unknown>;
      const mode = meta.mode as string | undefined;
      const txRow = data as ActiveTransmissionDbRow;
      const resume = Number(data.playback_position) || 0;
      const isUniversal =
        mode === 'universal' ||
        data.transmission_type === 'meditation' ||
        data.transmission_type === 'healing';

      skipPersistTxRef.current = true;
      try {
        if (cancelled) return;
        if (isUniversal) {
          await playUniversalAudio(universalFromActiveTransmissionRow(txRow), {
            resumePositionSec: resume,
            autoPlay: false,
          });
        } else {
          await playTrack(trackFromActiveTransmissionRow(txRow), undefined, {
            resumePositionSec: resume,
            autoPlay: false,
          });
        }
        if (!cancelled) transmissionRestoreDoneForUserRef.current = user.id;
      } finally {
        queueMicrotask(() => {
          skipPersistTxRef.current = false;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, playTrack, playUniversalAudio]);

  useEffect(() => {
    if (skipPersistTxRef.current) return;
    if (!user?.id) return;

    let row: ActiveTransmissionRowInput | null = null;

    if (currentTrack) {
      const url = trackHasFullPlayAccess(currentTrack)
        ? currentTrack.full_audio_url
        : currentTrack.preview_url;
      row = {
        transmission_id: currentTrack.id,
        transmission_title: currentTrack.title,
        transmission_url: url,
        transmission_type: 'music',
        is_playing: isPlaying,
        playback_position: currentTime,
        metadata: {
          mode: 'music',
          artist: currentTrack.artist,
          cover_image_url: currentTrack.cover_image_url,
          duration_seconds: currentTrack.duration_seconds,
          shc_reward: currentTrack.shc_reward,
          genre: currentTrack.genre,
        },
      };
    } else if (
      currentAudio &&
      (audioContentType === 'meditation' || audioContentType === 'healing')
    ) {
      row = {
        transmission_id: currentAudio.id,
        transmission_title: currentAudio.title,
        transmission_url: currentAudio.audio_url,
        transmission_type: audioContentType,
        is_playing: isPlaying,
        playback_position: currentTime,
        metadata: {
          mode: 'universal',
          contentType: audioContentType,
          artist: currentAudio.artist,
          cover_image_url: currentAudio.cover_image_url,
          duration_seconds: currentAudio.duration_seconds,
          shc_reward: currentAudio.shc_reward,
          preview_url: currentAudio.preview_url,
        },
      };
    }

    if (!row) return;
    schedulePersistTransmission(row);
  }, [
    user?.id,
    currentTrack,
    currentAudio,
    audioContentType,
    isPlaying,
    currentTime,
    schedulePersistTransmission,
    trackHasFullPlayAccess,
  ]);

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
      <AudioErrorBoundary>
        {children}
      </AudioErrorBoundary>
      <UpgradeModalComponent />
    </MusicPlayerContext.Provider>
  );
};
