import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Scissors,
  Volume2,
  VolumeX,
  Copy,
  MoreHorizontal,
  GripVertical,
  X,
  Lock,
  Unlock,
  Waves
} from 'lucide-react';

export interface AudioClip {
  id: string;
  name: string;
  startTime: number;      // Position on timeline (seconds)
  duration: number;       // Total duration of source
  trimStart: number;      // Trim from beginning (seconds)
  trimEnd: number;        // Trim from end (seconds)
  volume: number;         // 0-1
  isMuted: boolean;
  isLocked: boolean;
  color: string;
  waveformData?: number[]; // Optional waveform visualization data
}

interface ClipTimelineProps {
  clips: AudioClip[];
  currentTime: number;
  duration: number;
  zoom: number;
  isScissorMode: boolean;
  selectedClipId: string | null;
  onClipSelect: (clipId: string | null) => void;
  onClipDelete: (clipId: string) => void;
  onClipCut: (clipId: string, cutTime: number) => void;
  onClipMove: (clipId: string, newStartTime: number) => void;
  onClipTrim: (clipId: string, trimStart: number, trimEnd: number) => void;
  onClipMute: (clipId: string) => void;
  onClipLock: (clipId: string) => void;
  onClipDuplicate: (clipId: string) => void;
  onSeek: (time: number) => void;
}

// Canvas-based waveform component for Logic Pro style rendering
interface WaveformCanvasProps {
  waveformData: number[];
  color: string;
  width: number;
  height: number;
}

function WaveformCanvas({ waveformData, color, width, height }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size (account for device pixel ratio for crisp rendering)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(30, 41, 59, 0.5)');
    bgGradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.8)');
    bgGradient.addColorStop(1, 'rgba(30, 41, 59, 0.5)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Center line
    const centerY = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Calculate bar width based on data length and canvas width
    const barWidth = Math.max(1, width / waveformData.length);
    const maxHeight = (height / 2) - 4; // Leave some padding
    
    // Draw waveform - mirrored style like Logic Pro
    waveformData.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = peak * maxHeight;
      
      // Top waveform (positive)
      const topGradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY);
      topGradient.addColorStop(0, color);
      topGradient.addColorStop(1, color + '80');
      ctx.fillStyle = topGradient;
      ctx.fillRect(x, centerY - barHeight, Math.max(1, barWidth - 0.5), barHeight);
      
      // Bottom waveform (mirrored/negative)
      const bottomGradient = ctx.createLinearGradient(x, centerY, x, centerY + barHeight);
      bottomGradient.addColorStop(0, color + '80');
      bottomGradient.addColorStop(1, color + '40');
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(x, centerY, Math.max(1, barWidth - 0.5), barHeight);
    });
    
    // Add subtle glow effect at edges
    const edgeGlow = ctx.createLinearGradient(0, 0, 0, height);
    edgeGlow.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    edgeGlow.addColorStop(0.5, 'transparent');
    edgeGlow.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = edgeGlow;
    ctx.fillRect(0, 0, width, height);
    
  }, [waveformData, color, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="absolute inset-0"
    />
  );
}

function formatTimeShort(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function ClipTimeline({
  clips,
  currentTime,
  duration,
  zoom,
  isScissorMode,
  selectedClipId,
  onClipSelect,
  onClipDelete,
  onClipCut,
  onClipMove,
  onClipTrim,
  onClipMute,
  onClipLock,
  onClipDuplicate,
  onSeek
}: ClipTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [scissorHoverTime, setScissorHoverTime] = useState<number | null>(null);

  // Calculate timeline dimensions
  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = Math.max(duration * pixelsPerSecond, 800);
  const playheadPosition = currentTime * pixelsPerSecond;

  // Convert pixel position to time
  const pixelToTime = useCallback((px: number): number => {
    return px / pixelsPerSecond;
  }, [pixelsPerSecond]);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number): number => {
    return time * pixelsPerSecond;
  }, [pixelsPerSecond]);

  // Handle timeline click for seeking
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const time = pixelToTime(clickX);
    onSeek(Math.max(0, Math.min(duration, time)));
  }, [isDragging, pixelToTime, duration, onSeek]);

  // Handle clip click
  const handleClipClick = useCallback((e: React.MouseEvent, clip: AudioClip) => {
    e.stopPropagation();
    
    if (isScissorMode && !clip.isLocked) {
      // Calculate cut point relative to clip
      const clipElement = e.currentTarget as HTMLElement;
      const rect = clipElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clipDuration = clip.duration - clip.trimStart - clip.trimEnd;
      const cutOffset = (clickX / rect.width) * clipDuration;
      const absoluteCutTime = clip.startTime + cutOffset;
      
      onClipCut(clip.id, absoluteCutTime);
    } else {
      onClipSelect(clip.id);
    }
  }, [isScissorMode, onClipCut, onClipSelect]);

  // Handle clip drag start
  const handleClipDragStart = useCallback((e: React.PointerEvent, clip: AudioClip) => {
    if (clip.isLocked || isScissorMode) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragClipId(clip.id);
    setDragStartX(e.clientX);
    setDragStartTime(clip.startTime);
  }, [isScissorMode]);

  // Handle clip drag move
  const handleClipDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragClipId) return;
    const deltaX = e.clientX - dragStartX;
    const deltaTime = pixelToTime(deltaX);
    const newStartTime = Math.max(0, dragStartTime + deltaTime);
    onClipMove(dragClipId, newStartTime);
  }, [isDragging, dragClipId, dragStartX, dragStartTime, pixelToTime, onClipMove]);

  // Handle clip drag end
  const handleClipDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragClipId(null);
  }, []);

  // Handle scissor hover on clip
  const handleScissorHover = useCallback((e: React.MouseEvent, clip: AudioClip) => {
    if (!isScissorMode || clip.isLocked) {
      setScissorHoverTime(null);
      return;
    }
    const clipElement = e.currentTarget as HTMLElement;
    const rect = clipElement.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const clipDuration = clip.duration - clip.trimStart - clip.trimEnd;
    const cutOffset = (hoverX / rect.width) * clipDuration;
    setScissorHoverTime(clip.startTime + cutOffset);
  }, [isScissorMode]);

  // Generate time markers
  const timeMarkers = [];
  const markerInterval = zoom < 1 ? 10 : zoom < 2 ? 5 : 1;
  for (let t = 0; t <= duration; t += markerInterval) {
    timeMarkers.push(t);
  }

  const selectedClip = clips.find(c => c.id === selectedClipId);

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-lg overflow-hidden">
      {/* Contextual Clip Toolbar */}
      {selectedClip && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Badge 
              className="border-0 font-medium"
              style={{ backgroundColor: selectedClip.color + '40', color: selectedClip.color }}
            >
              {selectedClip.name}
            </Badge>
            <span className="text-xs text-white/50">
              {formatTimeShort(selectedClip.startTime)} – 
              {formatTimeShort(selectedClip.startTime + selectedClip.duration - selectedClip.trimStart - selectedClip.trimEnd)}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Mute */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClipMute(selectedClip.id)}
              className={`h-8 w-8 ${
                selectedClip.isMuted 
                  ? 'text-amber-400 bg-amber-500/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {selectedClip.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            {/* Lock */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClipLock(selectedClip.id)}
              className={`h-8 w-8 ${
                selectedClip.isLocked 
                  ? 'text-cyan-400 bg-cyan-500/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {selectedClip.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>

            {/* Duplicate */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClipDuplicate(selectedClip.id)}
              disabled={selectedClip.isLocked}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <Copy className="w-4 h-4" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClipDelete(selectedClip.id)}
              disabled={selectedClip.isLocked}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            {/* Deselect */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClipSelect(null)}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Timeline Container */}
      <div 
        ref={timelineRef}
        className="overflow-x-auto overflow-y-hidden"
        style={{ maxHeight: '200px' }}
      >
        <div 
          className="relative"
          style={{ width: `${timelineWidth}px`, minHeight: '160px' }}
          onClick={handleTimelineClick}
        >
          {/* Time Ruler */}
          <div className="h-6 bg-slate-800/50 border-b border-white/10 relative">
            {timeMarkers.map(t => (
              <div
                key={t}
                className="absolute top-0 h-full flex flex-col items-center"
                style={{ left: `${timeToPixel(t)}px` }}
              >
                <div className="w-px h-2 bg-white/30" />
                <span className="text-[10px] text-white/40 font-mono mt-0.5">
                  {formatTimeShort(t)}
                </span>
              </div>
            ))}
          </div>

          {/* Track Lane */}
          <div className="relative h-32 bg-slate-950/50">
            {/* Grid lines */}
            {timeMarkers.map(t => (
              <div
                key={t}
                className="absolute top-0 h-full w-px bg-white/5"
                style={{ left: `${timeToPixel(t)}px` }}
              />
            ))}

            {/* Audio Clips */}
            {clips.map(clip => {
              const clipDuration = clip.duration - clip.trimStart - clip.trimEnd;
              const clipWidth = timeToPixel(clipDuration);
              const clipLeft = timeToPixel(clip.startTime);
              const isSelected = clip.id === selectedClipId;
              const isHovered = clip.id === hoveredClipId;

              return (
                <div
                  key={clip.id}
                  className={`absolute top-2 h-28 rounded-lg overflow-hidden transition-all ${
                    clip.isLocked ? 'cursor-not-allowed' : isScissorMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                  } ${isSelected ? 'ring-2 ring-white shadow-lg shadow-white/20' : ''} ${
                    clip.isMuted ? 'opacity-50' : ''
                  }`}
                  style={{
                    left: `${clipLeft}px`,
                    width: `${clipWidth}px`,
                    backgroundColor: clip.color + '30',
                    borderLeft: `3px solid ${clip.color}`,
                  }}
                  onClick={(e) => handleClipClick(e, clip)}
                  onPointerDown={(e) => handleClipDragStart(e, clip)}
                  onPointerMove={handleClipDragMove}
                  onPointerUp={handleClipDragEnd}
                  onMouseMove={(e) => handleScissorHover(e, clip)}
                  onMouseLeave={() => setScissorHoverTime(null)}
                  onMouseEnter={() => setHoveredClipId(clip.id)}
                >
                  {/* Clip Header */}
                  <div 
                    className="flex items-center justify-between px-2 py-1 text-xs text-white font-medium"
                    style={{ backgroundColor: clip.color + '60' }}
                  >
                    <div className="flex items-center gap-1 truncate">
                      {!clip.isLocked && <GripVertical className="w-3 h-3 opacity-50" />}
                      {clip.isLocked && <Lock className="w-3 h-3" />}
                      <span className="truncate">{clip.name}</span>
                    </div>
                    {clip.isMuted && <VolumeX className="w-3 h-3" />}
                  </div>

                  {/* Waveform Visualization - Logic Pro Style with Canvas */}
                  <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: '#1a2332' }}>
                    {clip.waveformData && clip.waveformData.length > 0 ? (
                      <WaveformCanvas 
                        waveformData={clip.waveformData} 
                        color={clip.color}
                        width={clipWidth}
                        height={90}
                      />
                    ) : (
                      // Loading placeholder
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-1">
                          <Waves className="w-4 h-4 text-white/30 animate-pulse" />
                          <span className="text-[10px] text-white/30 font-mono">
                            Analyzing audio...
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Playhead position indicator within clip */}
                    {currentTime >= clip.startTime && currentTime <= clip.startTime + clipDuration && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-5"
                        style={{
                          left: `${((currentTime - clip.startTime) / clipDuration) * 100}%`,
                          boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)'
                        }}
                      />
                    )}
                  </div>

                  {/* Scissor Cut Line Preview */}
                  {isScissorMode && isHovered && scissorHoverTime !== null && !clip.isLocked && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-pink-500 pointer-events-none z-10"
                      style={{
                        left: `${((scissorHoverTime - clip.startTime) / clipDuration) * 100}%`
                      }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                        <Scissors className="w-4 h-4 text-pink-500 rotate-90" />
                      </div>
                    </div>
                  )}

                  {/* Delete Shard Button (on hover) */}
                  {isSelected && !clip.isLocked && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipDelete(clip.id);
                      }}
                      className="absolute top-1 right-1 h-6 px-2 bg-red-500/80 hover:bg-red-600 text-white text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ left: `${playheadPosition}px` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/30 border-t border-white/10">
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>{clips.length} clip{clips.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>Duration: {formatTimeShort(duration)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Waves className="w-3 h-3" />
          <span>Quantum Scissor Editor</span>
        </div>
      </div>
    </div>
  );
}
