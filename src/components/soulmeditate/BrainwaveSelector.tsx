import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

interface BrainwavePreset {
  id: string;
  label: string;
  freq: number;
  description: string;
  color: string;
}

const BRAINWAVE_PRESETS: BrainwavePreset[] = [
  { id: 'epsilon', label: 'EPSILON', freq: 0.5, description: 'Transcendental States', color: 'from-purple-600 to-violet-700' },
  { id: 'delta', label: 'DELTA', freq: 2, description: 'Deep Sleep / Repair', color: 'from-indigo-600 to-purple-700' },
  { id: 'theta', label: 'THETA', freq: 6, description: 'Creative Visualization', color: 'from-blue-600 to-indigo-700' },
  { id: 'alpha', label: 'ALPHA', freq: 10, description: 'Stress Relief / Flow', color: 'from-cyan-600 to-blue-700' },
  { id: 'beta', label: 'BETA', freq: 20, description: 'Active Focus', color: 'from-teal-600 to-cyan-700' },
  { id: 'gamma', label: 'GAMMA', freq: 40, description: 'Peak Cognition', color: 'from-emerald-600 to-teal-700' },
];

interface BrainwaveSelectorProps {
  activeFrequency: number;
  onSelect: (freq: number) => void;
}

export default function BrainwaveSelector({ activeFrequency, onSelect }: BrainwaveSelectorProps) {
  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-white/90">
          <Brain className="w-4 h-4 text-purple-400" />
          Neural Brainwave Target
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {BRAINWAVE_PRESETS.map((preset) => {
          const isActive = activeFrequency === preset.freq;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.freq)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                isActive
                  ? `bg-gradient-to-r ${preset.color} border-transparent text-white shadow-lg shadow-purple-500/20`
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
      </CardContent>
    </Card>
  );
}
