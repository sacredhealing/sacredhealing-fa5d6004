import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Square,
  Circle,
  Scissors,
  ZoomIn,
  ZoomOut,
  Repeat,
  RotateCcw
} from 'lucide-react';

interface DAWTransportBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onRewind: () => void;
  onForward: () => void;
  onSkipStart: () => void;
  onSkipEnd: () => void;
  isLooping: boolean;
  onLoopToggle: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isScissorMode: boolean;
  onScissorToggle: () => void;
  hasUnsavedChanges?: boolean;
  onUndo?: () => void;
}

function formatTimecode(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export default function DAWTransportBar({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onStop,
  onSeek,
  onRewind,
  onForward,
  onSkipStart,
  onSkipEnd,
  isLooping,
  onLoopToggle,
  zoom,
  onZoomChange,
  isScissorMode,
  onScissorToggle,
  hasUnsavedChanges = false,
  onUndo
}: DAWTransportBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle scrubbing on the progress bar
  const handleProgressInteraction = useCallback((clientX: number) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(percent * duration);
  }, [duration, onSeek]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleProgressInteraction(e.clientX);
  }, [handleProgressInteraction]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      handleProgressInteraction(e.clientX);
    }
  }, [isDragging, handleProgressInteraction]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-lg p-3">
      {/* Transport Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 font-mono text-xs">
            TRANSPORT
          </Badge>
          {isScissorMode && (
            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50 animate-pulse">
              <Scissors className="w-3 h-3 mr-1" />
              SCISSOR MODE
            </Badge>
          )}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-400">
              Unsaved
            </Badge>
          )}
        </div>

        {/* Timecode Display */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-lg text-white tracking-wider bg-black/40 px-3 py-1 rounded border border-white/10">
            {formatTimecode(currentTime)}
          </div>
          <span className="text-white/40">/</span>
          <div className="font-mono text-sm text-white/60 tracking-wider">
            {formatTimecode(duration)}
          </div>
        </div>
      </div>

      {/* Progress/Scrub Bar */}
      <div
        ref={progressRef}
        className="relative h-6 bg-slate-800/80 rounded cursor-pointer mb-3 overflow-hidden group"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Time markers */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-px bg-white/20"
              style={{ left: `${i * 10}%` }}
            />
          ))}
        </div>

        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/60 to-purple-500/60 transition-all"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 shadow-lg" />
        </div>

        {/* Hover indicator */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center gap-1">
          {/* Undo */}
          {onUndo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!hasUnsavedChanges}
              className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}

          {/* Loop Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoopToggle}
            className={`h-9 w-9 ${
              isLooping
                ? 'text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Center - Main Transport */}
        <div className="flex items-center gap-1">
          {/* Skip to Start */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipStart}
            className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          {/* Rewind 5s */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRewind}
            className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
          >
            <Rewind className="w-4 h-4" />
          </Button>

          {/* Stop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
          >
            <Square className="w-4 h-4" />
          </Button>

          {/* Play/Pause - Main Button */}
          <Button
            size="lg"
            onClick={onPlayPause}
            className={`h-11 w-11 rounded-full ${
              isPlaying
                ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {/* Record (visual only) */}
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="text-red-400/50 h-9 w-9"
          >
            <Circle className="w-4 h-4" />
          </Button>

          {/* Forward 5s */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onForward}
            className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
          >
            <FastForward className="w-4 h-4" />
          </Button>

          {/* Skip to End */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipEnd}
            className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Right Controls - Scissor & Zoom */}
        <div className="flex items-center gap-2">
          {/* Scissor Tool Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onScissorToggle}
            className={`h-9 px-3 gap-1 ${
              isScissorMode
                ? 'text-pink-400 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Cut</span>
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1 border border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
              className="text-white/60 hover:text-white h-7 w-7 p-0"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-white/60 w-10 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(Math.min(4, zoom + 0.25))}
              className="text-white/60 hover:text-white h-7 w-7 p-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
