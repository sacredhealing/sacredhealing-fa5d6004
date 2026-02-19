import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Frequency Toggle: Acoustic Levitation Harmonics
 * Implements 432Hz and 528Hz frequencies for enhanced meditation states
 * Based on Pyramid/Acoustic Levitation principles
 */
interface FrequencyToggleProps {
  audioElement: HTMLAudioElement | null;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

export const FrequencyToggle: React.FC<FrequencyToggleProps> = ({
  audioElement,
  enabled: externalEnabled,
  onToggle
}) => {
  const [enabled, setEnabled] = useState(externalEnabled ?? false);
  const [frequency, setFrequency] = useState<'432' | '528'>('432');
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (externalEnabled !== undefined) {
      setEnabled(externalEnabled);
    }
  }, [externalEnabled]);

  useEffect(() => {
    if (!enabled || !audioElement) {
      // Cleanup
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    // Initialize AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Set frequency (432Hz or 528Hz)
    oscillator.frequency.value = frequency === '432' ? 432 : 528;
    oscillator.type = 'sine'; // Pure sine wave for meditation

    // Very subtle gain (5% of original audio) - harmonic enhancement, not replacement
    gainNode.gain.value = 0.05;

    // Connect: oscillator -> gain -> destination
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
    };
  }, [enabled, frequency, audioElement]);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onToggle?.(newEnabled);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-cyan-900/20 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Acoustic Levitation Harmonics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="frequency-toggle" className="text-sm">
            Enable Frequency Enhancement
          </Label>
          <Switch
            id="frequency-toggle"
            checked={enabled}
            onCheckedChange={handleToggle}
          />
        </div>
        {enabled && (
          <div className="space-y-2 pt-2 border-t border-purple-500/20">
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <div className="flex gap-2">
              <Button
                variant={frequency === '432' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFrequency('432')}
                className="flex-1"
              >
                432 Hz
                <span className="text-xs ml-1 opacity-70">(Earth)</span>
              </Button>
              <Button
                variant={frequency === '528' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFrequency('528')}
                className="flex-1"
              >
                528 Hz
                <span className="text-xs ml-1 opacity-70">(Love)</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Subtle harmonic enhancement based on ancient acoustic levitation principles.
              Enhances meditation state without overpowering the audio.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
