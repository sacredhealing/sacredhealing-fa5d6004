import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioClip } from '@/components/soulmeditate/ClipTimeline';

// Generate unique ID
function generateId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate random clip color
const CLIP_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#a855f7', // purple
];

function getRandomColor(): string {
  return CLIP_COLORS[Math.floor(Math.random() * CLIP_COLORS.length)];
}

export interface TimelineState {
  clips: AudioClip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLooping: boolean;
  zoom: number;
  isScissorMode: boolean;
  selectedClipId: string | null;
  undoStack: AudioClip[][];
}

export function useTimelineEditor(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // Default 5 minutes
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isScissorMode, setIsScissorMode] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<AudioClip[][]>([]);
  
  const playIntervalRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Save state for undo
  const saveForUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-10), [...clips]]);
  }, [clips]);

  // Undo last action
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setClips(lastState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  }, [undoStack]);

  // Create clip from audio source
  const createClipFromSource = useCallback((name: string, audioDuration: number): AudioClip => {
    return {
      id: generateId(),
      name: name || 'Audio Clip',
      startTime: 0,
      duration: audioDuration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      isMuted: false,
      isLocked: false,
      color: getRandomColor(),
    };
  }, []);

  // Add clip to timeline
  const addClip = useCallback((name: string, clipDuration: number) => {
    saveForUndo();
    const newClip = createClipFromSource(name, clipDuration);
    setClips(prev => [...prev, newClip]);
    setDuration(prev => Math.max(prev, clipDuration + 30)); // Add padding
    return newClip;
  }, [createClipFromSource, saveForUndo]);

  // Select clip
  const selectClip = useCallback((clipId: string | null) => {
    setSelectedClipId(clipId);
  }, []);

  // Delete clip
  const deleteClip = useCallback((clipId: string) => {
    saveForUndo();
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  }, [selectedClipId, saveForUndo]);

  // Cut clip at specific time
  const cutClip = useCallback((clipId: string, cutTime: number) => {
    saveForUndo();
    setClips(prev => {
      const clipIndex = prev.findIndex(c => c.id === clipId);
      if (clipIndex === -1) return prev;
      
      const clip = prev[clipIndex];
      const clipStart = clip.startTime;
      const clipEnd = clip.startTime + clip.duration - clip.trimStart - clip.trimEnd;
      
      // Ensure cut is within clip bounds
      if (cutTime <= clipStart || cutTime >= clipEnd) return prev;
      
      const cutOffset = cutTime - clipStart;
      
      // Create two new clips from the cut
      const leftClip: AudioClip = {
        ...clip,
        id: generateId(),
        name: `${clip.name} (L)`,
        trimEnd: clip.trimEnd + (clip.duration - clip.trimStart - clip.trimEnd - cutOffset),
      };
      
      const rightClip: AudioClip = {
        ...clip,
        id: generateId(),
        name: `${clip.name} (R)`,
        startTime: cutTime,
        trimStart: clip.trimStart + cutOffset,
        color: getRandomColor(),
      };
      
      // Replace original with two new clips
      const newClips = [...prev];
      newClips.splice(clipIndex, 1, leftClip, rightClip);
      return newClips;
    });
    
    setSelectedClipId(null);
  }, [saveForUndo]);

  // Move clip to new position
  const moveClip = useCallback((clipId: string, newStartTime: number) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, startTime: Math.max(0, newStartTime) } : c
    ));
  }, []);

  // Trim clip
  const trimClip = useCallback((clipId: string, trimStart: number, trimEnd: number) => {
    saveForUndo();
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, trimStart, trimEnd } : c
    ));
  }, [saveForUndo]);

  // Toggle clip mute
  const muteClip = useCallback((clipId: string) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, isMuted: !c.isMuted } : c
    ));
  }, []);

  // Toggle clip lock
  const lockClip = useCallback((clipId: string) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, isLocked: !c.isLocked } : c
    ));
  }, []);

  // Duplicate clip
  const duplicateClip = useCallback((clipId: string) => {
    saveForUndo();
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const newClip: AudioClip = {
      ...clip,
      id: generateId(),
      name: `${clip.name} (copy)`,
      startTime: clip.startTime + (clip.duration - clip.trimStart - clip.trimEnd) + 0.5,
      isLocked: false,
    };
    
    setClips(prev => [...prev, newClip]);
  }, [clips, saveForUndo]);

  // Transport controls
  const play = useCallback(() => {
    setIsPlaying(true);
    lastUpdateRef.current = Date.now();
    
    // Also play the audio element if available
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(() => {});
    }
  }, [audioRef, currentTime]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [audioRef]);

  const playPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioRef]);

  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(clampedTime);
    if (audioRef.current) {
      audioRef.current.currentTime = clampedTime;
    }
  }, [audioRef, duration]);

  const rewind = useCallback(() => {
    seek(currentTime - 5);
  }, [currentTime, seek]);

  const forward = useCallback(() => {
    seek(currentTime + 5);
  }, [currentTime, seek]);

  const skipStart = useCallback(() => {
    seek(0);
  }, [seek]);

  const skipEnd = useCallback(() => {
    seek(duration);
  }, [duration, seek]);

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  }, [audioRef, isLooping]);

  const toggleScissorMode = useCallback(() => {
    setIsScissorMode(prev => !prev);
    if (isScissorMode) {
      setSelectedClipId(null);
    }
  }, [isScissorMode]);

  // Playhead update loop
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;
        
        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= duration) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return duration;
            }
          }
          return next;
        });
      }, 30); // ~33fps for smooth playhead
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, isLooping, duration]);

  // Sync with audio element time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isPlaying) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(prev => Math.max(prev, audio.duration));
      }
    };

    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, isLooping, isPlaying]);

  return {
    // State
    clips,
    currentTime,
    duration,
    isPlaying,
    isLooping,
    zoom,
    isScissorMode,
    selectedClipId,
    hasUnsavedChanges: undoStack.length > 0,

    // Clip actions
    addClip,
    selectClip,
    deleteClip,
    cutClip,
    moveClip,
    trimClip,
    muteClip,
    lockClip,
    duplicateClip,

    // Transport actions
    play,
    pause,
    playPause,
    stop,
    seek,
    rewind,
    forward,
    skipStart,
    skipEnd,
    toggleLoop,
    setZoom,
    toggleScissorMode,
    undo,

    // Setters
    setDuration,
  };
}
