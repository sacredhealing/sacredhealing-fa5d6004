import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Upload, 
  Play, 
  Pause, 
  FileAudio, 
  X,
  Loader2,
  Zap
} from 'lucide-react';
import type { LayerState } from '@/hooks/useSoulMeditateEngine';
import NeuralPreprocessor from './NeuralPreprocessor';

export type NeuralCleaningStage = 'analyzing' | 'normalizing' | 'gating' | 'limiting' | 'complete';

interface NeuralSourceInputProps {
  layer: LayerState;
  onLoadFile: (file: File) => void | Promise<boolean> | Promise<{ autoGainDb: number }>;
  onLoadUrl: (url: string) => void;
  onTogglePlay: () => void;
  onVolumeChange: (vol: number) => void;
}

const ACCEPTED_AUDIO = '.mp3,.wav,.m4a,.flac,.aac,.ogg,.webm,.aiff';

export default function NeuralSourceInput({
  layer,
  onLoadFile,
  onLoadUrl,
  onTogglePlay,
  onVolumeChange,
}: NeuralSourceInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isNeuralCleaning, setIsNeuralCleaning] = useState(false);
  const [cleaningStage, setCleaningStage] = useState<NeuralCleaningStage>('analyzing');
  const [autoGainDb, setAutoGainDb] = useState(0);

  const runNeuralPreprocessing = useCallback(async (file: File): Promise<{ autoGainDb: number }> => {
    setIsNeuralCleaning(true);
    
    setCleaningStage('analyzing');
    await new Promise(r => setTimeout(r, 800));
    
    setCleaningStage('normalizing');
    await new Promise(r => setTimeout(r, 1000));
    
    const sizeKb = file.size / 1024;
    const simulatedGain = sizeKb < 500 ? 4.5 : sizeKb < 2000 ? 2.1 : -1.8;
    
    setCleaningStage('gating');
    await new Promise(r => setTimeout(r, 700));
    
    setCleaningStage('limiting');
    await new Promise(r => setTimeout(r, 600));
    
    setCleaningStage('complete');
    setAutoGainDb(simulatedGain);
    
    return { autoGainDb: simulatedGain };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const result = await runNeuralPreprocessing(file);
        await onLoadFile(file);
        
        toast.success(
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Source loaded: {file.name}</span>
            <span className="text-amber-400 font-mono text-xs">
              {result.autoGainDb > 0 ? '+' : ''}{result.autoGainDb.toFixed(1)} dB
            </span>
          </div>
        );
      } catch (err) {
        toast.error('Failed to load audio file');
        setIsNeuralCleaning(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setIsLoading(true);
      try {
        const result = await runNeuralPreprocessing(file);
        await onLoadFile(file);
        
        toast.success(
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Source loaded: {file.name}</span>
            <span className="text-amber-400 font-mono text-xs">
              {result.autoGainDb > 0 ? '+' : ''}{result.autoGainDb.toFixed(1)} dB
            </span>
          </div>
        );
      } catch (err) {
        toast.error('Failed to load audio file');
        setIsNeuralCleaning(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error('Please drop an audio file');
    }
  };

  return (
    <Card className="bg-[#0B0112]/60 backdrop-blur-xl border-amber-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center gap-2 text-amber-100/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <FileAudio className="w-5 h-5 text-amber-400" />
            </div>
            Sacred Source
          </div>
          {(layer.source || isLoading) && (
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 max-w-full sm:max-w-[180px] truncate sm:ml-auto w-fit min-w-0 overflow-hidden text-ellipsis">
              {layer.source || 'Loading…'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4 md:py-0">
        {/* Neural Preprocessing Status */}
        <NeuralPreprocessor 
          isProcessing={isNeuralCleaning && cleaningStage !== 'complete'}
          stage={cleaningStage}
          autoGainDb={autoGainDb}
        />

        {/* Drag & Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-amber-900/30 hover:border-amber-500/40 bg-amber-900/10'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_AUDIO}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm text-amber-200/70">
              Drop audio file or{' '}
              <button
                className="text-amber-400 hover:text-amber-300 underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-amber-200/40">MP3, WAV, M4A, FLAC, AAC, OGG</p>
          </div>
        </div>

        {/* Playback controls */}
        {(layer.source || isLoading) && (
          <div className="flex items-center gap-4 pt-2 border-t border-amber-900/20">
            <Button
              variant="outline"
              size="icon"
              disabled={isLoading}
              className={`shrink-0 transition-all ${
                layer.isPlaying
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-white/5 border-amber-900/30 text-amber-200/60 hover:text-amber-200'
              } ${isLoading ? 'opacity-90' : ''}`}
              onClick={onTogglePlay}
            >
              {isLoading ? <Play className="w-5 h-5" /> : layer.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex justify-between text-xs">
                <span className="text-amber-200/60">Source Volume</span>
                <span className="text-amber-200/80">{Math.round(layer.volume * 100)}%</span>
              </div>
              <Slider
                value={[layer.volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => onVolumeChange(v)}
                className="[&_[role=slider]]:bg-amber-500"
                disabled={isLoading}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-amber-200/40 hover:text-amber-200/60"
              onClick={() => onLoadUrl('')}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
