import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMeditationGenerator, MeditationStyleType } from '@/hooks/useMeditationGenerator';
import { toast } from 'sonner';
import { 
  Play, 
  Square, 
  Volume2, 
  Headphones,
  Waves,
  Circle,
  Download,
  Timer
} from 'lucide-react';

interface BrowserMeditationPlayerProps {
  selectedStyle: MeditationStyleType;
  selectedFrequency: number;
  binauralEnabled: boolean;
  binauralBeatHz: number;
  binauralCarrierHz: number;
}

const TIMER_PRESETS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 0, label: 'Infinite' },
];

const BINAURAL_MAP: Record<number, string> = {
  4: 'delta',
  6: 'theta',
  8: 'alpha',
  10: 'beta',
  20: 'beta',
  40: 'gamma',
};

export default function BrowserMeditationPlayer({
  selectedStyle,
  selectedFrequency,
  binauralEnabled,
  binauralBeatHz,
  binauralCarrierHz,
}: BrowserMeditationPlayerProps) {
  const {
    isPlaying,
    isRecording,
    recordingDuration,
    startPlaying,
    stopPlaying,
    updateVolume,
    startRecording,
    stopRecording,
  } = useMeditationGenerator();

  const [ambientVolume, setAmbientVolume] = useState(70);
  const [binauralVolume, setBinauralVolume] = useState(50);
  const [frequencyVolume, setFrequencyVolume] = useState(30);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [frequencyEnabled, setFrequencyEnabled] = useState(true);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        // Auto-stop if timer is set and reached
        if (timerMinutes > 0 && next >= timerMinutes * 60) {
          stopPlaying();
          toast.success('Meditation session complete 🙏');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timerMinutes, stopPlaying]);

  // Handle play/stop
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlaying();
    } else {
      // Map binaural Hz to type
      let binauralType: string | null = null;
      if (binauralEnabled) {
        binauralType = BINAURAL_MAP[binauralBeatHz] || 'theta';
      }

      startPlaying({
        style: selectedStyle,
        healingFrequency: frequencyEnabled ? selectedFrequency : null,
        binauralType,
        binauralCarrier: binauralCarrierHz,
        ambientVolume,
        binauralVolume,
        frequencyVolume,
      });
      toast.success('🎧 Use headphones for the best experience!');
    }
  }, [
    isPlaying,
    selectedStyle,
    selectedFrequency,
    frequencyEnabled,
    binauralEnabled,
    binauralBeatHz,
    binauralCarrierHz,
    ambientVolume,
    binauralVolume,
    frequencyVolume,
    startPlaying,
    stopPlaying,
  ]);

  // Handle recording
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meditation-${selectedStyle}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Recording saved!');
      }
    } else {
      if (!isPlaying) {
        toast.error('Start playing first to record');
        return;
      }
      startRecording();
      toast.success('Recording started');
    }
  }, [isRecording, isPlaying, selectedStyle, startRecording, stopRecording]);

  // Update volumes in real-time
  const handleAmbientVolume = useCallback((value: number[]) => {
    setAmbientVolume(value[0]);
    updateVolume('ambient', value[0]);
  }, [updateVolume]);

  const handleBinauralVolume = useCallback((value: number[]) => {
    setBinauralVolume(value[0]);
    updateVolume('binaural', value[0]);
  }, [updateVolume]);

  const handleFrequencyVolume = useCallback((value: number[]) => {
    setFrequencyVolume(value[0]);
    updateVolume('frequency', value[0]);
  }, [updateVolume]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card/50 to-purple-500/5 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
            <span>Real-Time Meditation Player</span>
          </div>
          {isPlaying && (
            <Badge variant="secondary" className="font-mono">
              <Timer className="w-3 h-3 mr-1" />
              {formatTime(elapsedSeconds)}
              {timerMinutes > 0 && ` / ${timerMinutes}:00`}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Headphones reminder */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Headphones className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground">Headphones required</strong> for binaural beats effect
          </span>
        </div>

        {/* Timer Selection */}
        <div className="space-y-2">
          <Label className="text-sm">Session Timer</Label>
          <div className="flex flex-wrap gap-2">
            {TIMER_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                size="sm"
                variant={timerMinutes === preset.value ? 'default' : 'outline'}
                onClick={() => setTimerMinutes(preset.value)}
                className="min-w-[70px]"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Healing Frequency Toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="freq-enabled"
            checked={frequencyEnabled}
            onCheckedChange={(c) => setFrequencyEnabled(c === true)}
          />
          <Label htmlFor="freq-enabled" className="text-sm">
            Include {selectedFrequency} Hz healing frequency
          </Label>
        </div>

        {/* Volume Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-green-400" />
                Ambient Sounds
              </Label>
              <span className="text-xs text-muted-foreground">{ambientVolume}%</span>
            </div>
            <Slider
              value={[ambientVolume]}
              onValueChange={handleAmbientVolume}
              min={0}
              max={100}
              step={1}
              className="[&>span:first-child]:bg-green-500/20 [&_[role=slider]]:bg-green-500"
            />
          </div>

          {binauralEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-blue-400" />
                  Binaural Beats ({binauralBeatHz} Hz)
                </Label>
                <span className="text-xs text-muted-foreground">{binauralVolume}%</span>
              </div>
              <Slider
                value={[binauralVolume]}
                onValueChange={handleBinauralVolume}
                min={0}
                max={100}
                step={1}
                className="[&>span:first-child]:bg-blue-500/20 [&_[role=slider]]:bg-blue-500"
              />
            </div>
          )}

          {frequencyEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Waves className="w-4 h-4 text-purple-400" />
                  Healing Frequency ({selectedFrequency} Hz)
                </Label>
                <span className="text-xs text-muted-foreground">{frequencyVolume}%</span>
              </div>
              <Slider
                value={[frequencyVolume]}
                onValueChange={handleFrequencyVolume}
                min={0}
                max={100}
                step={1}
                className="[&>span:first-child]:bg-purple-500/20 [&_[role=slider]]:bg-purple-500"
              />
            </div>
          )}
        </div>

        {/* Play/Record Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            size="lg"
            onClick={handleTogglePlay}
            className={`flex-1 ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-5 h-5 mr-2 fill-current" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2 fill-current" />
                Play Now
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleToggleRecording}
            disabled={!isPlaying && !isRecording}
            className={isRecording ? 'border-red-500 text-red-500' : ''}
          >
            {isRecording ? (
              <>
                <Circle className="w-4 h-4 mr-2 fill-red-500 text-red-500 animate-pulse" />
                Recording {formatTime(recordingDuration)}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Record & Download
              </>
            )}
          </Button>
        </div>

        {/* Active layers indicator */}
        {isPlaying && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Volume2 className="w-3 h-3 mr-1" />
              {selectedStyle.replace('_', ' ')}
            </Badge>
            {binauralEnabled && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                <Headphones className="w-3 h-3 mr-1" />
                {binauralBeatHz} Hz binaural
              </Badge>
            )}
            {frequencyEnabled && (
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                <Waves className="w-3 h-3 mr-1" />
                {selectedFrequency} Hz
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
