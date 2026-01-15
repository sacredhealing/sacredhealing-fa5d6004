import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Headphones, Zap, Activity } from 'lucide-react';
import type { FrequencyState } from '@/hooks/useSoulMeditateEngine';

interface FrequencyPanelProps {
  frequencies: FrequencyState;
  volume: number;
  solfeggioList: Array<{ hz: number; label: string; color: string }>;
  binauralList: Array<{ beatHz: number; label: string }>;
  onStartSolfeggio: (hz: number) => void;
  onStopSolfeggio: () => void;
  onStartBinaural: (carrierHz: number, beatHz: number) => void;
  onStopBinaural: () => void;
  onVolumeChange: (vol: number) => void;
}

export default function FrequencyPanel({
  frequencies,
  volume,
  solfeggioList,
  binauralList,
  onStartSolfeggio,
  onStopSolfeggio,
  onStartBinaural,
  onStopBinaural,
  onVolumeChange,
}: FrequencyPanelProps) {
  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white/90">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
            <Zap className="w-5 h-5 text-violet-400" />
          </div>
          Quantum Frequencies
          <Badge variant="outline" className="ml-auto text-xs border-white/20">
            {Math.round(volume * 100)}% Vol
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volume control */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-white/60">Frequency Layer Volume</span>
            <span className="text-white/80">{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            value={[volume]}
            min={0}
            max={0.5}
            step={0.01}
            onValueChange={([v]) => onVolumeChange(v)}
            className="[&_[role=slider]]:bg-violet-500"
          />
        </div>

        {/* Solfeggio Frequencies */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-white/80 font-medium">Solfeggio Healing Tones</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {solfeggioList.map((freq) => {
              const isActive = frequencies.solfeggio.enabled && frequencies.solfeggio.hz === freq.hz;
              return (
                <Button
                  key={freq.hz}
                  variant="outline"
                  size="sm"
                  className={`h-auto py-2 px-3 justify-start text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 border-violet-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    if (isActive) {
                      onStopSolfeggio();
                    } else {
                      onStartSolfeggio(freq.hz);
                    }
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-2 shrink-0"
                    style={{ backgroundColor: freq.color }}
                  />
                  <span className="text-xs truncate">{freq.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Binaural Beats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/80 font-medium">Binaural Brainwave Entrainment</span>
            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
              Use Headphones
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {binauralList.map((preset) => {
              const isActive = frequencies.binaural.enabled && frequencies.binaural.beatHz === preset.beatHz;
              return (
                <Button
                  key={preset.beatHz}
                  variant="outline"
                  size="sm"
                  className={`h-auto py-2 px-3 justify-start text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/30 to-teal-500/30 border-cyan-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    if (isActive) {
                      onStopBinaural();
                    } else {
                      onStartBinaural(200, preset.beatHz);
                    }
                  }}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 shrink-0 ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-600'}`} />
                  <span className="text-xs">{preset.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Active frequencies display */}
        {(frequencies.solfeggio.enabled || frequencies.binaural.enabled) && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-white/10">
            <div className="text-xs text-white/60 mb-2">Active Frequencies</div>
            <div className="flex flex-wrap gap-2">
              {frequencies.solfeggio.enabled && (
                <Badge className="bg-violet-500/30 text-violet-300 border-violet-500/50">
                  {frequencies.solfeggio.hz} Hz Solfeggio
                </Badge>
              )}
              {frequencies.binaural.enabled && (
                <Badge className="bg-cyan-500/30 text-cyan-300 border-cyan-500/50">
                  {frequencies.binaural.beatHz} Hz Binaural
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
