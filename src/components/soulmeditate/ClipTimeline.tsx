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

// Neon color palette for waveforms
const NEON_CYAN = '#22d3ee';    // cyan-400
const NEON_MAGENTA = '#ec4899'; // magenta-500 (pink-500)

/**
 * Spectral Slicing: Get visible waveform portion based on trim values
 * This ensures the waveform matches the audio exactly after a scissor cut
 */
function getVisibleWaveform(
  waveformData: number[],
  trimStart: number,
  trimEnd: number,
  totalDuration: number
): number[] {
  if (!waveformData.length || totalDuration <= 0) return waveformData;
  
  // Calculate trim percentages
  const trimStartPercent = trimStart / totalDuration;
  const trimEndPercent = trimEnd / totalDuration;
  
  // Calculate slice indices
  const totalPeaks = waveformData.length;
  const startIndex = Math.floor(trimStartPercent * totalPeaks);
  const endIndex = Math.ceil((1 - trimEndPercent) * totalPeaks);
  
  // Return the visible slice
  return waveformData.slice(
    Math.max(0, startIndex),
    Math.min(totalPeaks, endIndex)
  );
}

// Canvas-based waveform component with neon glow rendering
interface WaveformCanvasProps {
  waveformData: number[];
  isSelected: boolean;
  width: number;
  height: number;
  trimStart: number;
  trimEnd: number;
  totalDuration: number;
}

function WaveformCanvas({ 
  waveformData, 
  isSelected, 
  width, 
  height,
  trimStart,
  trimEnd,
  totalDuration
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Select neon color based on selection state
  const neonColor = isSelected ? NEON_CYAN : NEON_MAGENTA;
  
  // Apply spectral slicing to get visible portion
  const visibleWaveform = useMemo(() => 
    getVisibleWaveform(waveformData, trimStart, trimEnd, totalDuration),
    [waveformData, trimStart, trimEnd, totalDuration]
  );
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visibleWaveform.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size (account for device pixel ratio for crisp rendering)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw dark background
    ctx.fillStyle = 'rgba(2, 6, 14, 1)';
    ctx.fillRect(0, 0, width, height);
    
    // Center line with neon glow
    const centerY = height / 2;
    ctx.strokeStyle = neonColor + '60';
    ctx.lineWidth = 1;
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Calculate bar width based on data length and canvas width
    const barWidth = Math.max(2, width / visibleWaveform.length);
    // 95% of half-height for maximum visibility
    const maxHeight = (height / 2) * 0.95;
    
    // Apply strong glow effect for all bars - opacity 100%
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 12;
    
    // Draw waveform - mirrored neon style with sqrt scaling for visual energy
    visibleWaveform.forEach((peak, i) => {
      const x = i * barWidth;
      // Non-linear sqrt scaling for better visual energy on quieter parts
      const scaledPeak = Math.sqrt(peak);
      // Minimum 2px height, scale to 95% of available space
      const barHeight = Math.max(2, scaledPeak * maxHeight);
      
      // Top waveform (positive) with full opacity gradient
      const topGradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY);
      topGradient.addColorStop(0, neonColor); // 100% at peak
      topGradient.addColorStop(0.4, neonColor + 'F0'); // 94% 
      topGradient.addColorStop(1, neonColor + 'CC'); // 80% at center
      ctx.fillStyle = topGradient;
      ctx.fillRect(x, centerY - barHeight, Math.max(1.5, barWidth - 0.5), barHeight);
      
      // Bottom waveform (mirrored/negative) with full opacity gradient
      const bottomGradient = ctx.createLinearGradient(x, centerY, x, centerY + barHeight);
      bottomGradient.addColorStop(0, neonColor + 'CC'); // 80% at center
      bottomGradient.addColorStop(0.6, neonColor + 'F0'); // 94%
      bottomGradient.addColorStop(1, neonColor); // 100% at peak
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(x, centerY, Math.max(1.5, barWidth - 0.5), barHeight);
    });
    
    // Reset shadow for edges
    ctx.shadowBlur = 0;
    
    // Add intense neon edge glow overlay
    const edgeGlow = ctx.createLinearGradient(0, 0, 0, height);
    edgeGlow.addColorStop(0, neonColor + '30');
    edgeGlow.addColorStop(0.5, 'transparent');
    edgeGlow.addColorStop(1, neonColor + '30');
    ctx.fillStyle = edgeGlow;
    ctx.fillRect(0, 0, width, height);
    
  }, [visibleWaveform, neonColor, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        filter: `drop-shadow(0 0 8px ${neonColor}CC)`
      }}
      className="absolute inset-0 opacity-100"
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

                  {/* Waveform Visualization - Neon Style with Spectral Slicing */}
                  <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: '#020610' }}>
                    {clip.waveformData && clip.waveformData.length > 0 ? (
                      <WaveformCanvas 
                        waveformData={clip.waveformData} 
                        isSelected={isSelected}
                        width={clipWidth}
                        height={100}
                        trimStart={clip.trimStart}
                        trimEnd={clip.trimEnd}
                        totalDuration={clip.duration}
                      />
                    ) : (
                      // Loading placeholder with intense neon pulse
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ 
                          background: 'linear-gradient(90deg, rgba(34,211,238,0.15) 0%, transparent 50%, rgba(236,72,153,0.15) 100%)'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Waves 
                            className="w-6 h-6 text-cyan-400 animate-pulse" 
                            style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))' }} 
                          />
                          <span 
                            className="text-sm text-cyan-300 font-mono animate-pulse font-semibold"
                            style={{ textShadow: '0 0 8px rgba(34,211,238,0.8)' }}
                          >
                            Analyzing waveform...
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
