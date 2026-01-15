import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Radio, Volume2 } from 'lucide-react';

interface HealingFrequency {
  freq: number;
  name: string;
  description: string;
  color: string;
}

const HEALING_FREQUENCIES: HealingFrequency[] = [
  { freq: 174, name: '174 Hz', description: 'Foundation & Security', color: 'from-red-500 to-rose-600' },
  { freq: 285, name: '285 Hz', description: 'Quantum Cognition', color: 'from-orange-500 to-amber-600' },
  { freq: 396, name: '396 Hz', description: 'Liberation from Fear', color: 'from-yellow-500 to-orange-500' },
  { freq: 417, name: '417 Hz', description: 'Transmutation', color: 'from-lime-500 to-green-500' },
  { freq: 432, name: '432 Hz', description: 'Cosmic Harmony', color: 'from-emerald-500 to-teal-500' },
  { freq: 528, name: '528 Hz', description: 'DNA Repair & Love', color: 'from-cyan-500 to-blue-500' },
  { freq: 639, name: '639 Hz', description: 'Heart Connection', color: 'from-blue-500 to-indigo-500' },
  { freq: 741, name: '741 Hz', description: 'Awakening Intuition', color: 'from-indigo-500 to-violet-500' },
  { freq: 852, name: '852 Hz', description: 'Third Eye Activation', color: 'from-violet-500 to-purple-500' },
  { freq: 963, name: '963 Hz', description: 'Crown & Unity', color: 'from-purple-500 to-fuchsia-500' },
];

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
  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-white/90">
          <Radio className="w-4 h-4 text-cyan-400" />
          Healing Fundamental (Hz)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volume Control */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/60">Frequency Volume</span>
              <span className="text-cyan-400 font-mono">{Math.round(volume * 100)}%</span>
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
                    ? `bg-gradient-to-r ${freq.color} border-transparent text-white shadow-lg`
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
