import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSHC } from '@/contexts/SHCContext';

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
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  const PREVIEW_LIMIT = 30;
  const MUSIC_REWARD = 100;

  const hasAccess = useCallback((track: Track) => {
    return isSubscribed || purchasedIds.includes(track.id);
  }, [isSubscribed, purchasedIds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const refreshPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('music_purchases').select('track_id').eq('user_id', user.id);
    if (data) setPurchasedIds(data.map(p => p.track_id));
  };

  const checkSubscription = async () => {
    try {
      const { data } = await supabase.functions.invoke('check-music-membership');
      setIsSubscribed(data?.hasAccess || false);
    } catch (error) {
      console.error('Error checking subscription:', error);
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
    const canPlayFull = isSubscribed || purchasedIds.includes(track.id);
    
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
    
    audioRef.current.onended = async () => {
      if (isLoop && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        return;
      }
      
      setIsPlaying(false);
      if (canPlayFull) {
        addOptimisticBalance(MUSIC_REWARD);
        toast({ title: `+${MUSIC_REWARD} SHC earned!`, description: `Completed "${track.title}"` });
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
    
    // Update play history
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('music_play_history').upsert({
        user_id: user.id,
        track_id: track.id,
        play_count: 1,
        last_played_at: new Date().toISOString()
      }, { onConflict: 'user_id,track_id' });
    }
  }, [currentTrack, isPlaying, volume, isSubscribed, purchasedIds, isLoop, isShuffle, queue, currentQueueIndex, addOptimisticBalance, toast]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  const seekTo = useCallback((percent: number) => {
    if (!audioRef.current || !currentTrack) return;
    const seekTime = (percent / 100) * audioRef.current.duration;
    
    if (!hasAccess(currentTrack) && seekTime > PREVIEW_LIMIT) {
      toast({ title: "Preview limit", description: "Subscribe to seek past 30 seconds." });
      return;
    }
    
    audioRef.current.currentTime = seekTime;
    setProgress(percent);
    setCurrentTime(seekTime);
  }, [currentTrack, hasAccess, toast]);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <MusicPlayerContext.Provider value={{
      currentTrack,
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
    }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
