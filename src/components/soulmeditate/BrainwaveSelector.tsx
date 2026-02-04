import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Brain, Volume2 } from 'lucide-react';

interface BrainwavePreset {
  id: string;
  label: string;
  freq: number;
  description: string;
  color: string;
  chakraColor: string;
}

// Chakra-aligned: Crown/Third Eye (deep) → Throat → Heart → Solar Plexus → Crown (peak)
const BRAINWAVE_PRESETS: BrainwavePreset[] = [
  { id: 'epsilon', label: 'EPSILON', freq: 0.5, description: 'Transcendental States', color: 'from-violet-600 to-purple-700', chakraColor: 'violet' },
  { id: 'delta', label: 'DELTA', freq: 2, description: 'Deep Sleep / Repair', color: 'from-indigo-600 to-violet-700', chakraColor: 'indigo' },
  { id: 'theta4', label: 'THETA', freq: 4, description: 'Meditation', color: 'from-blue-600 to-indigo-700', chakraColor: 'blue' },
  { id: 'theta6', label: 'THETA', freq: 6, description: 'Creative Visualization', color: 'from-sky-600 to-blue-700', chakraColor: 'sky' },
  { id: 'alpha', label: 'ALPHA', freq: 10, description: 'Stress Relief / Flow', color: 'from-cyan-600 to-teal-700', chakraColor: 'cyan' },
  { id: 'beta', label: 'BETA', freq: 14, description: 'Active Thinking', color: 'from-teal-600 to-emerald-700', chakraColor: 'teal' },
  { id: 'gamma', label: 'GAMMA', freq: 40, description: 'Peak Cognition', color: 'from-emerald-600 to-cyan-700', chakraColor: 'emerald' },
];

const CHAKRA_STYLES: Record<string, { border: string; icon: string; label: string; buttonShadow: string }> = {
  violet: { border: 'border-violet-500/60 shadow-lg shadow-violet-500/20', icon: 'text-violet-400', label: 'Crown', buttonShadow: 'shadow-violet-500/30' },
  indigo: { border: 'border-indigo-500/60 shadow-lg shadow-indigo-500/20', icon: 'text-indigo-400', label: 'Third Eye', buttonShadow: 'shadow-indigo-500/30' },
  blue: { border: 'border-blue-500/60 shadow-lg shadow-blue-500/20', icon: 'text-blue-400', label: 'Throat', buttonShadow: 'shadow-blue-500/30' },
  sky: { border: 'border-sky-500/60 shadow-lg shadow-sky-500/20', icon: 'text-sky-400', label: 'Throat', buttonShadow: 'shadow-sky-500/30' },
  cyan: { border: 'border-cyan-500/60 shadow-lg shadow-cyan-500/20', icon: 'text-cyan-400', label: 'Heart', buttonShadow: 'shadow-cyan-500/30' },
  teal: { border: 'border-teal-500/60 shadow-lg shadow-teal-500/20', icon: 'text-teal-400', label: 'Heart', buttonShadow: 'shadow-teal-500/30' },
  emerald: { border: 'border-emerald-500/60 shadow-lg shadow-emerald-500/20', icon: 'text-emerald-400', label: 'Crown', buttonShadow: 'shadow-emerald-500/30' },
};

interface BrainwaveSelectorProps {
  activeFrequency: number;
  volume: number;
  onSelect: (freq: number) => void;
  onVolumeChange: (volume: number) => void;
}

export default function BrainwaveSelector({ 
  activeFrequency, 
  volume,
  onSelect,
  onVolumeChange 
}: BrainwaveSelectorProps) {
  const activePreset = BRAINWAVE_PRESETS.find((p) => p.freq === activeFrequency);
  const chakraStyle = activePreset ? CHAKRA_STYLES[activePreset.chakraColor] : null;

  return (
    <Card className={`bg-black/40 backdrop-blur-xl border-2 transition-all duration-300 ${chakraStyle?.border || 'border-white/10'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-white/90 flex-wrap">
          <Brain className={`w-4 h-4 shrink-0 ${chakraStyle?.icon || 'text-purple-400'}`} />
          Neural Brainwave Target
          {activePreset && chakraStyle && (
            <span className={`text-xs font-normal opacity-90 ${chakraStyle.icon}`}>
              — {chakraStyle.label} chakra
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volume Control */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <Volume2 className={`w-4 h-4 shrink-0 ${chakraStyle?.icon || 'text-purple-400'}`} />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/60">Binaural Volume</span>
              <span className={`font-mono ${chakraStyle ? chakraStyle.icon : 'text-purple-400'}`}>{Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => onVolumeChange(v)}
              className="[&_[role=slider]]:bg-purple-500"
            />
          </div>
        </div>

        {/* Brainwave Presets */}
        <div className="space-y-2">
          {BRAINWAVE_PRESETS.map((preset) => {
            const isActive = activeFrequency === preset.freq;
            return (
              <button
                key={preset.id}
                onClick={() => onSelect(preset.freq)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${preset.color} border-transparent text-white shadow-lg ${CHAKRA_STYLES[preset.chakraColor]?.buttonShadow || 'shadow-purple-500/20'}`
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-white/70'
                }`}
              >
                <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-white/90'}`}>
                  {preset.label}
                </span>
                <span className={`text-xs ${isActive ? 'text-white/90' : 'text-white/50'}`}>
                  {preset.freq}Hz — {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
