import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Radio, Volume2 } from 'lucide-react';

interface HealingFrequency {
  freq: number;
  name: string;
  description: string;
  color: string;
  chakraColor: string;  // border/glow color for card
}

// Chakra-aligned: Root→Sacral→Solar Plexus→Heart→Throat→Third Eye→Crown
const HEALING_FREQUENCIES: HealingFrequency[] = [
  { freq: 174, name: '174 Hz', description: 'Foundation & Security', color: 'from-red-500 to-rose-600', chakraColor: 'red' },
  { freq: 285, name: '285 Hz', description: 'Quantum Cognition', color: 'from-orange-500 to-amber-600', chakraColor: 'orange' },
  { freq: 396, name: '396 Hz', description: 'Liberation from Fear', color: 'from-yellow-500 to-amber-500', chakraColor: 'yellow' },
  { freq: 417, name: '417 Hz', description: 'Transmutation', color: 'from-lime-500 to-green-500', chakraColor: 'green' },
  { freq: 432, name: '432 Hz', description: 'Cosmic Harmony', color: 'from-emerald-500 to-teal-500', chakraColor: 'emerald' },
  { freq: 528, name: '528 Hz', description: 'DNA Restore & Love', color: 'from-cyan-500 to-blue-500', chakraColor: 'cyan' },
  { freq: 639, name: '639 Hz', description: 'Heart Connection', color: 'from-teal-500 to-sky-500', chakraColor: 'teal' },
  { freq: 741, name: '741 Hz', description: 'Awakening Intuition', color: 'from-blue-500 to-indigo-500', chakraColor: 'blue' },
  { freq: 852, name: '852 Hz', description: 'Third Eye Activation', color: 'from-indigo-500 to-violet-500', chakraColor: 'indigo' },
  { freq: 963, name: '963 Hz', description: 'Crown & Unity', color: 'from-violet-500 to-fuchsia-500', chakraColor: 'violet' },
];

const CHAKRA_STYLES: Record<string, { border: string; icon: string; label: string; buttonShadow: string; buttonBg: string }> = {
  red: { border: 'border-red-500/60 shadow-lg shadow-red-500/20', icon: 'text-red-400', label: 'Root', buttonShadow: 'shadow-red-500/30', buttonBg: 'bg-red-500' },
  orange: { border: 'border-orange-500/60 shadow-lg shadow-orange-500/20', icon: 'text-orange-400', label: 'Sacral', buttonShadow: 'shadow-orange-500/30', buttonBg: 'bg-orange-500' },
  yellow: { border: 'border-amber-500/60 shadow-lg shadow-amber-500/20', icon: 'text-amber-400', label: 'Solar Plexus', buttonShadow: 'shadow-amber-500/30', buttonBg: 'bg-amber-500' },
  green: { border: 'border-green-500/60 shadow-lg shadow-green-500/20', icon: 'text-green-400', label: 'Heart', buttonShadow: 'shadow-green-500/30', buttonBg: 'bg-green-500' },
  emerald: { border: 'border-emerald-500/60 shadow-lg shadow-emerald-500/20', icon: 'text-emerald-400', label: 'Heart', buttonShadow: 'shadow-emerald-500/30', buttonBg: 'bg-emerald-500' },
  cyan: { border: 'border-cyan-500/60 shadow-lg shadow-cyan-500/20', icon: 'text-cyan-400', label: 'Throat', buttonShadow: 'shadow-cyan-500/30', buttonBg: 'bg-cyan-500' },
  teal: { border: 'border-teal-500/60 shadow-lg shadow-teal-500/20', icon: 'text-teal-400', label: 'Heart', buttonShadow: 'shadow-teal-500/30', buttonBg: 'bg-teal-500' },
  blue: { border: 'border-blue-500/60 shadow-lg shadow-blue-500/20', icon: 'text-blue-400', label: 'Throat', buttonShadow: 'shadow-blue-500/30', buttonBg: 'bg-blue-500' },
  indigo: { border: 'border-indigo-500/60 shadow-lg shadow-indigo-500/20', icon: 'text-indigo-400', label: 'Third Eye', buttonShadow: 'shadow-indigo-500/30', buttonBg: 'bg-indigo-500' },
  violet: { border: 'border-violet-500/60 shadow-lg shadow-violet-500/20', icon: 'text-violet-400', label: 'Crown', buttonShadow: 'shadow-violet-500/30', buttonBg: 'bg-violet-500' },
};

interface HealingFrequencySelectorProps {
  activeFrequency: number;
  volume: number;
  onSelect: (freq: number) => void;
  onVolumeChange: (volume: number) => void;
}

export default function HealingFrequencySelector({ 
  activeFrequency, 
  volume,
  onSelect,
  onVolumeChange 
}: HealingFrequencySelectorProps) {
  const activeFreq = HEALING_FREQUENCIES.find((f) => f.freq === activeFrequency);
  const chakraStyle = activeFreq ? CHAKRA_STYLES[activeFreq.chakraColor] : null;

  return (
    <Card className={`bg-black/40 backdrop-blur-xl border-2 transition-all duration-300 ${chakraStyle?.border || 'border-white/10'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-white/90 flex-wrap">
          <Radio className={`w-4 h-4 shrink-0 ${chakraStyle?.icon || 'text-cyan-400'}`} />
          Healing Fundamental (Hz)
          {activeFreq && chakraStyle && (
            <span className={`text-xs font-normal opacity-90 ${chakraStyle.icon}`}>
              — {chakraStyle.label} chakra
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volume Control */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <Volume2 className={`w-4 h-4 shrink-0 ${chakraStyle?.icon || 'text-cyan-400'}`} />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/60">Frequency Volume</span>
              <span className={`font-mono ${chakraStyle?.icon || 'text-cyan-400'}`}>{Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => onVolumeChange(v)}
              className="[&_[role=slider]]:bg-cyan-500"
            />
          </div>
        </div>

        {/* Frequency Grid */}
        <div className="grid grid-cols-2 gap-2">
          {HEALING_FREQUENCIES.map((freq) => {
            const isActive = activeFrequency === freq.freq;
            return (
              <button
                key={freq.freq}
                onClick={() => onSelect(freq.freq)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  isActive
                    ? `${CHAKRA_STYLES[freq.chakraColor]?.buttonBg || 'bg-cyan-500'} border-transparent text-white shadow-lg ${CHAKRA_STYLES[freq.chakraColor]?.buttonShadow || ''}`
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-white/70'
                }`}
              >
                <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/90'}`}>
                  {freq.name}
                </div>
                <div className={`text-xs ${isActive ? 'text-white/90' : 'text-white/50'}`}>
                  {freq.description}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
