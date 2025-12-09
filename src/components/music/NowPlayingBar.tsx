import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Volume2 } from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export const NowPlayingBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    isShuffle,
    isLoop,
    likedIds,
    togglePlay,
    seekTo,
    toggleShuffle,
    toggleLoop,
    nextTrack,
    prevTrack,
    toggleLike,
    hasAccess,
    formatTime,
  } = useMusicPlayer();

  if (!currentTrack) return null;

  const isLiked = likedIds.includes(currentTrack.id);
  const canPlayFull = hasAccess(currentTrack);
  const displayDuration = canPlayFull ? duration : Math.min(duration, 30);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(percent);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-2 pb-2">
      <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-lg">
        {/* Progress bar at top */}
        <div 
          className="h-1 bg-muted rounded-t-xl cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-primary rounded-t-xl transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Track info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                {currentTrack.cover_image_url ? (
                  <img src={currentTrack.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">♪</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
              {!canPlayFull && (
                <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded shrink-0">Preview</span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleLike(currentTrack.id)}
                className={`p-2 rounded-full hover:bg-muted/50 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              
              <button 
                onClick={toggleShuffle}
                className={`p-2 rounded-full hover:bg-muted/50 ${isShuffle ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Shuffle size={16} />
              </button>
              
              <button onClick={prevTrack} className="p-2 rounded-full hover:bg-muted/50 text-foreground">
                <SkipBack size={18} />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              
              <button onClick={nextTrack} className="p-2 rounded-full hover:bg-muted/50 text-foreground">
                <SkipForward size={18} />
              </button>
              
              <button 
                onClick={toggleLoop}
                className={`p-2 rounded-full hover:bg-muted/50 ${isLoop ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Repeat size={16} />
              </button>
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between mt-1 px-1">
            <span className="text-[10px] text-muted-foreground">{formatTime(currentTime)}</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(displayDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
