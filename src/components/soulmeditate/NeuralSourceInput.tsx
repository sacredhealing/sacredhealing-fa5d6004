import React, { useState, useCallback, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Upload, Play, Pause, X, Volume2, Music } from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
//  SQI 2050 — NeuralSourceInput
//  Source volume default: 1.0 (100%) — was 0.7 (70%)
//  All engine wiring unchanged.
// ═══════════════════════════════════════════════════════════════

const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/aac', 'audio/ogg'];
const ACCEPTED_EXT = ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'];

interface NeuralSourceInputProps {
  engine: any;
  /** Called with decoded duration in seconds when neural audio finishes loading. */
  onDurationKnown?: (seconds: number) => void;
}

export default function NeuralSourceInput({ engine, onDurationKnown }: NeuralSourceInputProps) {
  const [isDragging, setIsDragging]     = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  // ── DEFAULT SOURCE VOLUME = 1.0 (100%) ──────────────────────
  const [sourceVolume, setSourceVolume] = useState(1.0);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED.includes(file.type) && !ACCEPTED_EXT.includes(ext)) {
      toast.error(`Unsupported format. Use: ${ACCEPTED_EXT.join(', ').toUpperCase()}`);
      return;
    }
    setIsLoading(true);
    try {
      if (!engine?.isInitialized) await engine?.initialize();
      const ctx = engine?.getAudioContext?.();
      if (ctx?.state === 'suspended') await ctx.resume();
      const ok = await engine?.loadNeuralSource?.(file);
      if (ok) {
        // Apply the current source volume immediately after load
        engine?.updateNeuralVolume?.(sourceVolume);
        const reportDuration = () => {
          const d = engine?.audioBuffer?.duration ?? engine?.getDawDuration?.();
          if (typeof d === 'number' && d > 0 && !Number.isNaN(d)) {
            onDurationKnown?.(d);
          }
        };
        reportDuration();
        queueMicrotask(reportDuration);
        setTimeout(reportDuration, 50);
        toast.success(`Loaded: ${file.name}`);
      } else {
        toast.error('Failed to load audio file');
      }
    } catch (e: unknown) {
      toast.error('Failed to load audio file');
    } finally {
      setIsLoading(false);
    }
  }, [engine, sourceVolume, onDurationKnown]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleVolumeChange = useCallback((vol: number) => {
    setSourceVolume(vol);
    engine?.updateNeuralVolume?.(vol);
  }, [engine]);

  const isLoaded  = !!engine?.neuralLayer?.source;
  const isPlaying = engine?.neuralLayer?.isPlaying ?? false;
  const fileName  = engine?.neuralLayer?.source?.split('/')?.pop() ?? null;

  const togglePlay = useCallback(async () => {
    if (!isLoaded) return;
    if (!engine?.isInitialized) await engine?.initialize();
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    engine?.toggleNeuralPlay?.();
  }, [engine, isLoaded]);

  const handleRemove = useCallback(() => {
    engine?.stopAll?.();
    if (fileRef.current) fileRef.current.value = '';
  }, [engine]);

  return (
    <div>
      {/* Drop zone */}
      {!isLoaded && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            padding: '32px 24px',
            borderRadius: 20,
            border: `2px dashed ${isDragging ? '#D4AF37' : 'rgba(212,175,55,0.25)'}`,
            background: isDragging ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: isDragging ? '0 0 24px rgba(212,175,55,0.2)' : 'none',
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: isDragging ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isLoading
              ? <div style={{ width: 20, height: 20, border: '2px solid rgba(212,175,55,0.3)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              : <Upload size={20} style={{ color: '#D4AF37' }} />
            }
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              {isLoading ? 'Loading sacred audio…' : 'Drop audio file or '}
              {!isLoading && <span style={{ color: '#D4AF37', textDecoration: 'underline', cursor: 'pointer' }}>browse</span>}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
              {ACCEPTED_EXT.map(e => e.toUpperCase()).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Loaded state */}
      {isLoaded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '14px 16px',
          borderRadius: 20,
          background: 'rgba(212,175,55,0.04)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}>
          {/* File row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Play/pause */}
            <button
              onClick={togglePlay}
              style={{
                width: 36, height: 36,
                borderRadius: 12,
                border: 'none',
                background: isPlaying ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {isPlaying
                ? <Pause size={14} style={{ color: '#D4AF37' }} />
                : <Play  size={14} style={{ color: '#D4AF37' }} />
              }
            </button>

            {/* Filename */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Music size={10} style={{ color: '#D4AF37', marginRight: 5, display: 'inline' }} />
                {fileName ?? 'Audio loaded'}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                {isPlaying ? 'Playing…' : 'Ready'}
              </div>
            </div>

            {/* Remove */}
            <button
              onClick={handleRemove}
              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>

          {/* Source Volume — default 100% */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Volume2 size={13} style={{ color: 'rgba(212,175,55,0.6)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Source Volume</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#D4AF37' }}>{Math.round(sourceVolume * 100)}%</span>
              </div>
              <Slider
                value={[sourceVolume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => handleVolumeChange(v)}
                className="[&_[role=slider]]:bg-[#D4AF37] [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-[0_0_8px_rgba(212,175,55,0.4)]"
              />
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
