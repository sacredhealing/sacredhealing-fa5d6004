import React, { useRef, useState } from 'react';
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
  Youtube
} from 'lucide-react';
import type { LayerState } from '@/hooks/useSoulMeditateEngine';

interface NeuralSourceInputProps {
  layer: LayerState;
  onLoadFile: (file: File) => void;
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        await onLoadFile(file);
        toast.success(`Neural source loaded: ${file.name}`);
      } catch (err) {
        toast.error('Failed to load audio file');
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
        await onLoadFile(file);
        toast.success(`Neural source loaded: ${file.name}`);
      } catch (err) {
        toast.error('Failed to load audio file');
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
