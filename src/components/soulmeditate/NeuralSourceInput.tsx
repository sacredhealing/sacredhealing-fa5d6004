import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Upload, 
  Play, 
  Pause, 
  Brain, 
  Link2, 
  FileAudio, 
  X,
  Loader2,
  Youtube,
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
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isNeuralCleaning, setIsNeuralCleaning] = useState(false);
  const [cleaningStage, setCleaningStage] = useState<NeuralCleaningStage>('analyzing');
  const [autoGainDb, setAutoGainDb] = useState(0);

  // Simulate neural preprocessing stages
  const runNeuralPreprocessing = useCallback(async (file: File): Promise<{ autoGainDb: number }> => {
    setIsNeuralCleaning(true);
    
    // Stage 1: Analyzing
    setCleaningStage('analyzing');
    await new Promise(r => setTimeout(r, 800));
    
    // Stage 2: Normalizing
    setCleaningStage('normalizing');
    await new Promise(r => setTimeout(r, 1000));
    
    // Calculate auto-gain (simulated based on file size heuristic)
    const sizeKb = file.size / 1024;
    const simulatedGain = sizeKb < 500 ? 4.5 : sizeKb < 2000 ? 2.1 : -1.8;
    
    // Stage 3: Noise Gate
    setCleaningStage('gating');
    await new Promise(r => setTimeout(r, 700));
    
    // Stage 4: Limiter
    setCleaningStage('limiting');
    await new Promise(r => setTimeout(r, 600));
    
    // Complete
    setCleaningStage('complete');
    setAutoGainDb(simulatedGain);
    
    return { autoGainDb: simulatedGain };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        // Run neural preprocessing
        const result = await runNeuralPreprocessing(file);
        await onLoadFile(file);
        
        toast.success(
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Neural source loaded: {file.name}</span>
            <span className="text-cyan-400 font-mono text-xs">
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

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    try {
      // Check if it's a YouTube URL
      const isYoutube = urlInput.includes('youtube.com') || urlInput.includes('youtu.be');
      
      if (isYoutube) {
        toast.info('YouTube extraction requires backend processing. Using URL directly for demo.');
      }
      
      await onLoadUrl(urlInput.trim());
      toast.success('Neural source connected');
      setUrlInput('');
    } catch (err) {
      toast.error('Failed to load URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setIsLoading(true);
      try {
        // Run neural preprocessing
        const result = await runNeuralPreprocessing(file);
        await onLoadFile(file);
        
        toast.success(
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Neural source loaded: {file.name}</span>
            <span className="text-cyan-400 font-mono text-xs">
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
    <Card className="bg-black/40 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white/90">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20">
            <Brain className="w-5 h-5 text-pink-400" />
          </div>
          Neural Source
          {layer.source && (
            <Badge variant="outline" className="ml-auto text-xs border-pink-500/30 text-pink-400 max-w-[150px] truncate">
              {layer.source}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              ? 'border-pink-500 bg-pink-500/10'
              : 'border-white/20 hover:border-white/40 bg-white/5'
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-pink-400" />
            </div>
            <p className="text-sm text-white/70">
              Drop audio file or{' '}
              <button
                className="text-pink-400 hover:text-pink-300 underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-white/40">MP3, WAV, M4A, FLAC, AAC, OGG</p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Link2 className="w-3 h-3" />
            <span>Or paste audio URL</span>
            <Youtube className="w-3 h-3 ml-2" />
            <span className="text-yellow-400/60">YouTube supported</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/audio.mp3 or YouTube URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleUrlSubmit}
              disabled={isLoading || !urlInput.trim()}
              className="shrink-0 bg-white/5 border-white/10 hover:bg-white/10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Playback controls */}
        {layer.source && (
          <div className="flex items-center gap-4 pt-2 border-t border-white/10">
            <Button
              variant="outline"
              size="icon"
              className={`shrink-0 transition-all ${
                layer.isPlaying
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
              onClick={onTogglePlay}
            >
              {layer.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Source Volume</span>
                <span className="text-white/80">{Math.round(layer.volume * 100)}%</span>
              </div>
              <Slider
                value={[layer.volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => onVolumeChange(v)}
                className="[&_[role=slider]]:bg-pink-500"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-white/40 hover:text-white/60"
              onClick={() => onLoadUrl('')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
