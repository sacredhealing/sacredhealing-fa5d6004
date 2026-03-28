import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, X, ChevronUp, Music, Sparkles, Leaf } from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useTranslation } from '@/hooks/useTranslation';

const COLLAPSED_HEIGHT = 80;
const EXPANDED_HEIGHT = 280;
const DRAG_THRESHOLD = 60;

export const NowPlayingBar: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentTrack,
    currentAudio,
    audioContentType,
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
    stopTrack,
  } = useMusicPlayer();

  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const dragStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if we have any audio playing (music track or universal audio)
  const hasActiveAudio = currentTrack || currentAudio;
  
  if (!hasActiveAudio || isClosing) return null;

  // Determine display info based on content type
  const displayTitle = currentTrack?.title || currentAudio?.title || '';
  const displayArtist = currentTrack?.artist || currentAudio?.artist || '';
  const displayCover = currentTrack?.cover_image_url || currentAudio?.cover_image_url;
  const isLiked = currentTrack ? likedIds.includes(currentTrack.id) : false;
  const canPlayFull = currentTrack ? hasAccess(currentTrack) : true;
  const displayDuration = currentTrack && !canPlayFull ? Math.min(duration, 30) : duration;
  
  // Show queue controls only for music
  const showQueueControls = audioContentType === null || audioContentType === 'music';
  
  // Content type badge
  const getContentTypeBadge = () => {
    if (!audioContentType || audioContentType === 'music') return null;
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${
        audioContentType === 'meditation' 
          ? 'bg-violet-500/20 text-violet-400' 
          : 'bg-emerald-500/20 text-emerald-400'
      }`}>
        {audioContentType === 'meditation'
          ? t('music.nowPlaying.badgeMeditation', 'Meditation')
          : t('music.nowPlaying.badgeHealing', 'Healing')}
      </span>
    );
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(percent);
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - dragStartY.current;
    // Only allow dragging down or slightly up
    setDragY(Math.max(-20, delta));
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragY > DRAG_THRESHOLD) {
      // Swipe down to close
      setIsClosing(true);
      setTimeout(() => {
        stopTrack?.();
        setIsClosing(false);
        setDragY(0);
      }, 200);
    } else if (dragY < -30) {
      // Swipe up to expand
      setExpanded(true);
      setDragY(0);
    } else {
      setDragY(0);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      stopTrack?.();
      setIsClosing(false);
    }, 200);
  };

  const toggleExpand = () => {
    if (!isDragging) {
      setExpanded(!expanded);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ease-out ${
        isClosing ? 'translate-y-full opacity-0' : ''
      }`}
      style={{ 
        bottom: 64, // Above bottom nav
        transform: `translateY(${dragY}px)`,
        height: expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      }}
    >
      <div className="mx-2 h-full bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Drag handle area */}
        <div 
          className="flex items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onClick={toggleExpand}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          <button 
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="absolute right-4 top-2 p-1 rounded-full hover:bg-muted/50 text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Collapsed View */}
        <div className={`px-3 pb-2 ${expanded ? 'hidden' : 'block'}`}>
          <div className="flex items-center gap-3">
            {/* Cover Art */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 shadow-md">
              {displayCover ? (
                <img src={displayCover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl">
                  {audioContentType === 'meditation' ? <Sparkles size={20} /> : audioContentType === 'healing' ? <Leaf size={20} /> : '♪'}
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-foreground">{displayTitle}</p>
              <p className="text-xs text-muted-foreground truncate">{displayArtist}</p>
            </div>

            {!canPlayFull && currentTrack && (
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0 font-medium">
                {t('music.nowPlaying.preview', 'Preview')}
              </span>
            )}
            
            {getContentTypeBadge()}

            {/* Mini Controls - reduced for space */}
            <div className="flex items-center gap-0.5">
              {showQueueControls && (
                <button onClick={prevTrack} className="p-1.5 rounded-full hover:bg-muted/50 text-foreground">
                  <SkipBack size={16} />
                </button>
              )}
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              {showQueueControls && (
                <button onClick={nextTrack} className="p-1.5 rounded-full hover:bg-muted/50 text-foreground">
                  <SkipForward size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar + Time */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-muted rounded-full cursor-pointer" onClick={handleSeek}>
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Expanded View */}
        <div className={`flex-1 flex flex-col px-6 pb-4 ${expanded ? 'block' : 'hidden'}`}>
          {/* Large Cover Art */}
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-muted shadow-xl">
              {displayCover ? (
                <img src={displayCover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
                  {audioContentType === 'meditation' ? <Sparkles size={40} /> : audioContentType === 'healing' ? <Leaf size={40} /> : '♪'}
                </div>
              )}
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-4">
            <p className="font-bold text-lg text-foreground truncate">{displayTitle}</p>
            <p className="text-sm text-muted-foreground">{displayArtist}</p>
            {!canPlayFull && currentTrack && (
              <span className="inline-block mt-1 text-xs bg-primary/20 text-primary px-3 py-0.5 rounded-full font-medium">
                {t('music.nowPlaying.previewOnly', 'Preview Only')}
              </span>
            )}
            {getContentTypeBadge() && (
              <div className="mt-1">{getContentTypeBadge()}</div>
            )}
          </div>

          {/* Seek Bar */}
          <div className="mb-4">
            <div className="h-2 bg-muted rounded-full cursor-pointer" onClick={handleSeek}>
              <div className="h-full bg-primary rounded-full transition-all relative" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow" />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
              <span className="text-xs text-muted-foreground">{formatTime(displayDuration)}</span>
            </div>
          </div>

          {/* Full Controls */}
          <div className="flex items-center justify-center gap-4">
            {showQueueControls && (
              <button onClick={toggleShuffle} className={`p-3 rounded-full hover:bg-muted/50 ${isShuffle ? 'text-primary' : 'text-muted-foreground'}`}>
                <Shuffle size={20} />
              </button>
            )}
            {showQueueControls && (
              <button onClick={prevTrack} className="p-3 rounded-full hover:bg-muted/50 text-foreground">
                <SkipBack size={24} />
              </button>
            )}
            <button 
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            {showQueueControls && (
              <button onClick={nextTrack} className="p-3 rounded-full hover:bg-muted/50 text-foreground">
                <SkipForward size={24} />
              </button>
            )}
            {showQueueControls && (
              <button onClick={toggleLoop} className={`p-3 rounded-full hover:bg-muted/50 ${isLoop ? 'text-primary' : 'text-muted-foreground'}`}>
                <Repeat size={20} />
              </button>
            )}
          </div>

          {/* Like Button - only for music */}
          {currentTrack && (
            <div className="flex justify-center mt-2">
              <button 
                onClick={() => toggleLike(currentTrack.id)}
                className={`p-2 rounded-full hover:bg-muted/50 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
