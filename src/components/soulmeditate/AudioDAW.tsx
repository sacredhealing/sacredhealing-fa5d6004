import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Scissors, 
  Copy, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause,
  SkipBack,
  Volume2,
  Move,
  GripVertical
} from 'lucide-react';

export interface AudioRegion {
  id: string;
  startTime: number;      // Where it starts on the timeline
  duration: number;       // How long the region is
  sourceStart: number;    // Where in the original audio this region starts
  sourceDuration: number; // Original duration of the source segment
  color: string;
  label?: string;
  selected?: boolean;
}

interface AudioDAWProps {
  audioBuffer: AudioBuffer | null;
  regions: AudioRegion[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onRegionsChange: (regions: AudioRegion[]) => void;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
}

const COLORS = [
  'hsl(280, 70%, 50%)', // Purple
  'hsl(200, 80%, 50%)', // Cyan
  'hsl(340, 70%, 50%)', // Pink
  'hsl(160, 70%, 45%)', // Teal
  'hsl(45, 90%, 55%)',  // Gold
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export default function AudioDAW({
  audioBuffer,
  regions,
  currentTime,
  duration,
  isPlaying,
  onRegionsChange,
  onSeek,
  onPlayPause,
  onStop
}: AudioDAWProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  
  const [zoom, setZoom] = useState(1); // pixels per second
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-start' | 'resize-end' | 'split' | null;
    regionId: string | null;
    startX: number;
    originalValue: number;
  }>({ type: null, regionId: null, startX: 0, originalValue: 0 });
  
  const pixelsPerSecond = 50 * zoom;
  const totalWidth = duration * pixelsPerSecond;
  
  // Draw waveform
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || !audioBuffer) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear
    ctx.fillStyle = 'hsl(240, 10%, 8%)';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Draw waveform
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / rect.width);
    const centerY = rect.height / 2;
    
    ctx.strokeStyle = 'hsla(280, 70%, 60%, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = 0; x < rect.width; x++) {
      const startSample = x * samplesPerPixel;
      let min = 0, max = 0;
      
      for (let i = 0; i < samplesPerPixel; i++) {
        const sample = channelData[startSample + i] || 0;
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      const y1 = centerY + min * centerY * 0.9;
      const y2 = centerY + max * centerY * 0.9;
      
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    
    ctx.stroke();
    
    // Draw center line
    ctx.strokeStyle = 'hsla(280, 70%, 60%, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(rect.width, centerY);
    ctx.stroke();
    
  }, [audioBuffer]);
  
  // Get time from mouse position
  const getTimeFromX = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollLeft;
    return Math.max(0, Math.min(duration, x / pixelsPerSecond));
  }, [scrollLeft, pixelsPerSecond, duration]);
  
  // Handle region selection
  const handleRegionClick = useCallback((e: React.MouseEvent, regionId: string) => {
    e.stopPropagation();
    setSelectedRegionId(regionId);
  }, []);
  
  // Handle region drag start
  const handleRegionMouseDown = useCallback((
    e: React.MouseEvent, 
    regionId: string, 
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    
    setSelectedRegionId(regionId);
    setDragState({
      type,
      regionId,
      startX: e.clientX,
      originalValue: type === 'move' ? region.startTime : 
                     type === 'resize-start' ? region.startTime : 
                     region.startTime + region.duration
    });
  }, [regions]);
  
  // Handle mouse move for dragging
  useEffect(() => {
    if (!dragState.type || !dragState.regionId) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / pixelsPerSecond;
      
      const newRegions = regions.map(region => {
        if (region.id !== dragState.regionId) return region;
        
        if (dragState.type === 'move') {
          const newStart = Math.max(0, dragState.originalValue + deltaTime);
          return { ...region, startTime: newStart };
        } else if (dragState.type === 'resize-start') {
          const newStart = Math.max(0, dragState.originalValue + deltaTime);
          const endTime = region.startTime + region.duration;
          const newDuration = Math.max(0.1, endTime - newStart);
          return { 
            ...region, 
            startTime: newStart, 
            duration: newDuration,
            sourceStart: region.sourceStart + (newStart - region.startTime)
          };
        } else if (dragState.type === 'resize-end') {
          const newEnd = Math.max(region.startTime + 0.1, dragState.originalValue + deltaTime);
          return { ...region, duration: newEnd - region.startTime };
        }
        return region;
      });
      
      onRegionsChange(newRegions);
    };
    
    const handleMouseUp = () => {
      setDragState({ type: null, regionId: null, startX: 0, originalValue: 0 });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, regions, pixelsPerSecond, onRegionsChange]);
  
  // Split region at playhead
  const handleSplit = useCallback(() => {
    if (!selectedRegionId) return;
    
    const region = regions.find(r => r.id === selectedRegionId);
    if (!region) return;
    
    const splitPoint = currentTime;
    if (splitPoint <= region.startTime || splitPoint >= region.startTime + region.duration) {
      return; // Playhead not within region
    }
    
    const firstDuration = splitPoint - region.startTime;
    const secondDuration = region.duration - firstDuration;
    
    const newRegions = regions.flatMap(r => {
      if (r.id !== selectedRegionId) return [r];
      
      return [
        {
          ...r,
          duration: firstDuration,
          sourceDuration: firstDuration
        },
        {
          id: `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          startTime: splitPoint,
          duration: secondDuration,
          sourceStart: r.sourceStart + firstDuration,
          sourceDuration: secondDuration,
          color: r.color,
          label: r.label ? `${r.label} (2)` : undefined
        }
      ];
    });
    
    onRegionsChange(newRegions);
    setSelectedRegionId(null);
  }, [selectedRegionId, regions, currentTime, onRegionsChange]);
  
  // Duplicate selected region
  const handleDuplicate = useCallback(() => {
    if (!selectedRegionId) return;
    
    const region = regions.find(r => r.id === selectedRegionId);
    if (!region) return;
    
    const newRegion: AudioRegion = {
      id: `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: region.startTime + region.duration + 0.5, // Place after original
      duration: region.duration,
      sourceStart: region.sourceStart,
      sourceDuration: region.sourceDuration,
      color: COLORS[(COLORS.indexOf(region.color) + 1) % COLORS.length],
      label: region.label ? `${region.label} (copy)` : 'Copy'
    };
    
    onRegionsChange([...regions, newRegion]);
  }, [selectedRegionId, regions, onRegionsChange]);
  
  // Delete selected region
  const handleDelete = useCallback(() => {
    if (!selectedRegionId) return;
    onRegionsChange(regions.filter(r => r.id !== selectedRegionId));
    setSelectedRegionId(null);
  }, [selectedRegionId, regions, onRegionsChange]);
  
  // Click on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const time = getTimeFromX(e.clientX);
    onSeek(time);
  }, [getTimeFromX, onSeek]);
  
  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(4, z * 1.5));
  const handleZoomOut = () => setZoom(z => Math.max(0.25, z / 1.5));
  
  const selectedRegion = regions.find(r => r.id === selectedRegionId);
  
  return (
    <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white"
              onClick={onStop}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isPlaying ? 'text-cyan-400' : 'text-white/60'} hover:text-white`}
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="h-6 w-px bg-white/10" />
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-cyan-400 disabled:opacity-30"
              onClick={handleSplit}
              disabled={!selectedRegionId}
              title="Split at playhead (S)"
            >
              <Scissors className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-emerald-400 disabled:opacity-30"
              onClick={handleDuplicate}
              disabled={!selectedRegionId}
              title="Duplicate (Cmd+D)"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-red-400 disabled:opacity-30"
              onClick={handleDelete}
              disabled={!selectedRegionId}
              title="Delete (Backspace)"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="h-6 w-px bg-white/10" />
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white"
              onClick={handleZoomOut}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-white/40 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white"
              onClick={handleZoomIn}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-cyan-400">
            {formatTime(currentTime)}
          </span>
          <span className="text-white/30">/</span>
          <span className="text-sm font-mono text-white/60">
            {formatTime(duration)}
          </span>
        </div>
      </div>
      
      {/* Timeline Ruler */}
      <div className="h-6 bg-black/40 border-b border-white/10 relative overflow-hidden">
        <div 
          className="absolute inset-y-0 flex"
          style={{ width: totalWidth, transform: `translateX(-${scrollLeft}px)` }}
        >
          {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 border-l border-white/10 text-[10px] text-white/40 pl-1"
              style={{ width: pixelsPerSecond }}
            >
              {i}s
            </div>
          ))}
        </div>
        
        {/* Playhead on ruler */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10"
          style={{ left: (currentTime * pixelsPerSecond) - scrollLeft }}
        />
      </div>
      
      {/* Track Area */}
      <div 
        ref={timelineRef}
        className="relative h-32 bg-gradient-to-b from-slate-900/50 to-slate-950/50 cursor-pointer overflow-hidden"
        onClick={handleTimelineClick}
        onScroll={(e) => setScrollLeft((e.target as HTMLDivElement).scrollLeft)}
      >
        {/* Waveform background */}
        <canvas 
          ref={waveformRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
        />
        
        {/* Regions container */}
        <div 
          className="absolute inset-y-0 flex items-center"
          style={{ width: totalWidth, transform: `translateX(-${scrollLeft}px)` }}
        >
          {regions.map((region) => (
            <div
              key={region.id}
              className={`absolute top-2 bottom-2 rounded-lg cursor-move transition-all ${
                region.id === selectedRegionId 
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' 
                  : 'hover:brightness-110'
              }`}
              style={{
                left: region.startTime * pixelsPerSecond,
                width: region.duration * pixelsPerSecond,
                backgroundColor: region.color,
                opacity: region.id === selectedRegionId ? 1 : 0.85
              }}
              onClick={(e) => handleRegionClick(e, region.id)}
              onMouseDown={(e) => handleRegionMouseDown(e, region.id, 'move')}
            >
              {/* Left resize handle */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-lg"
                onMouseDown={(e) => handleRegionMouseDown(e, region.id, 'resize-start')}
              />
              
              {/* Right resize handle */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-lg"
                onMouseDown={(e) => handleRegionMouseDown(e, region.id, 'resize-end')}
              />
              
              {/* Region label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-medium text-white/90 truncate px-2">
                  {region.label || formatTime(region.duration)}
                </span>
              </div>
              
              {/* Drag handle */}
              <GripVertical className="absolute left-1/2 top-1 -translate-x-1/2 w-3 h-3 text-white/40" />
            </div>
          ))}
        </div>
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
          style={{ left: (currentTime * pixelsPerSecond) - scrollLeft }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full" />
        </div>
        
        {/* Grid lines */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ width: totalWidth, transform: `translateX(-${scrollLeft}px)` }}
        >
          {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
            <div 
              key={i}
              className="absolute top-0 bottom-0 border-l border-white/5"
              style={{ left: i * pixelsPerSecond }}
            />
          ))}
        </div>
      </div>
      
      {/* Region Info Footer */}
      <div className="px-4 py-2 border-t border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs border-white/20 text-white/60">
            {regions.length} region{regions.length !== 1 ? 's' : ''}
          </Badge>
          
          {selectedRegion && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-xs text-white/60">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: selectedRegion.color }}
                />
                <span>
                  {formatTime(selectedRegion.startTime)} → {formatTime(selectedRegion.startTime + selectedRegion.duration)}
                </span>
                <span className="text-white/40">
                  ({formatTime(selectedRegion.duration)})
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="text-[10px] text-white/30">
          Click region to select • Drag to move • Edges to resize • Split at playhead
        </div>
      </div>
    </div>
  );
}
