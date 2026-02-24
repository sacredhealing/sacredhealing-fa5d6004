import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Waves, Zap, Sparkles } from 'lucide-react';

interface VirtualChannelStripProps {
  sourceName?: string;
  autoGainDb?: number;
  lowCutEnabled?: boolean;
  onLowCutToggle?: () => void;
  onEqChange?: (bandId: string, value: number) => void;
  eqValues?: {
    weight: number;
    presence: number;
    air: number;
  };
  noiseGate?: {
    threshold: number;
    attack: number;
    release: number;
    range: number;
    enabled: boolean;
  };
  onNoiseGateChange?: (params: { threshold?: number; attack?: number; release?: number; range?: number; enabled?: boolean }) => void;
}

// Tonal Balance presets replace the 3-band parametric EQ
const TONAL_PRESETS = [
  { id: 'warm', label: 'Warm', icon: '🔥', weight: 2, presence: -1, air: -2, description: 'Rich, full-bodied tone' },
  { id: 'bright', label: 'Bright', icon: '✨', weight: -1, presence: 3, air: 2, description: 'Clear, present, airy' },
  { id: 'grounded', label: 'Grounded', icon: '🌍', weight: 3, presence: 0, air: -3, description: 'Deep, earthy resonance' },
  { id: 'ethereal', label: 'Ethereal', icon: '🌙', weight: -2, presence: 1, air: 4, description: 'Shimmering, celestial sheen' },
];

export default function VirtualChannelStrip({
  sourceName = 'AUDIO SOURCE',
  autoGainDb = 0,
  lowCutEnabled = true,
  onLowCutToggle,
  onEqChange,
  eqValues,
  noiseGate,
  onNoiseGateChange,
}: VirtualChannelStripProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Convert noise gate 4 params to single "Purity" value (0-100)
  // Purity 0% = gate off, Purity 100% = max gating with natural 50ms release
  const purityValue = noiseGate?.enabled 
    ? Math.round(Math.abs((noiseGate.threshold + 80) / 70) * 100)
    : 0;

  const handlePurityChange = (value: number) => {
    if (!onNoiseGateChange) return;
    if (value === 0) {
      onNoiseGateChange({ enabled: false });
    } else {
      // Map 0-100 to threshold -80 to -10
      const threshold = -80 + (value / 100) * 70;
      onNoiseGateChange({
        enabled: true,
        threshold,
        attack: 10,       // Fixed natural attack
        release: 50,      // Fixed 50ms release to prevent clipping words
        range: -60,       // Fixed gentle range
      });
    }
  };

  const handlePresetSelect = (preset: typeof TONAL_PRESETS[0]) => {
    setActivePreset(preset.id);
    onEqChange?.('weight', preset.weight);
    onEqChange?.('presence', preset.presence);
    onEqChange?.('air', preset.air);
  };

  return (
    <Card className="bg-[#0B0112]/60 backdrop-blur-xl border-amber-900/30 overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-amber-100 tracking-wide uppercase">
              {sourceName}
            </h3>
            <p className="text-xs text-amber-400/80 font-medium tracking-widest">
              SACRED REFINEMENT • TONAL ALCHEMY
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-Gain Badge */}
            <div className="bg-[#0B0112]/80 border border-amber-900/30 rounded-lg px-3 py-1.5">
              <div className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-0.5">
                Auto-Gain
              </div>
              <div className="text-sm font-mono font-bold text-amber-400">
                {autoGainDb > 0 ? '+' : ''}{autoGainDb.toFixed(1)} dB
              </div>
            </div>

            {/* Low Cut Toggle */}
            <Button
              onClick={onLowCutToggle}
              size="sm"
              className={`text-xs uppercase tracking-wider transition-all ${
                lowCutEnabled
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-amber-900/20 hover:bg-amber-900/30 text-amber-400/60 border border-amber-900/30'
              }`}
            >
              100Hz Cut: {lowCutEnabled ? 'On' : 'Off'}
            </Button>
          </div>
        </div>

        {/* Tonal Balance Presets */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-200/70 uppercase tracking-widest font-bold">Tonal Balance</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONAL_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    isActive
                      ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-amber-900/10 border-amber-900/20 hover:border-amber-500/30'
                  }`}
                >
                  <div className="text-xl mb-1">{preset.icon}</div>
                  <div className={`text-sm font-bold ${isActive ? 'text-amber-200' : 'text-amber-200/70'}`}>
                    {preset.label}
                  </div>
                  <p className="text-[10px] text-amber-200/40 mt-0.5">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Purity Slider (Simplified Noise Gate) */}
        {onNoiseGateChange && noiseGate && (
          <div className="pt-4 border-t border-amber-900/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-amber-400/70" />
                <span className="text-amber-200/70 uppercase tracking-wider text-xs font-bold">Purity</span>
              </div>
              <span className="text-xs text-amber-400 font-mono">{purityValue}%</span>
            </div>
            <Slider
              value={[purityValue]}
              onValueChange={([v]) => handlePurityChange(v)}
              min={0}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-amber-500"
            />
            <p className="text-[10px] text-amber-200/40 italic">
              Gently removes background noise • 0% = Off, 100% = Maximum purity
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-amber-900/20 flex items-center justify-between text-xs text-amber-200/40">
          <div className="flex items-center gap-2">
            <Waves className="w-3 h-3" />
            <span>Tonal Alchemy • 48kHz</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-amber-500">Engine Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
