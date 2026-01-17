import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Waves, Zap } from 'lucide-react';
import AnalogKnob from './AnalogKnob';

interface EQBand {
  id: string;
  label: string;
  frequency: string;
  value: number;
  advice: string;
  focus: string;
}

interface VirtualChannelStripProps {
  sourceName?: string;
  autoGainDb?: number;
  lowCutEnabled?: boolean;
  onLowCutToggle?: () => void;
  onEqChange?: (bandId: string, value: number) => void;
}

const DEFAULT_BANDS: EQBand[] = [
  {
    id: 'weight',
    label: 'WEIGHT',
    frequency: '400HZ',
    value: -0.5,
    advice: 'SLIGHT CUT RECOMMENDED FOR CLARITY.',
    focus: 'Boxy',
  },
  {
    id: 'presence',
    label: 'PRESENCE',
    frequency: '4KHZ',
    value: 3,
    advice: '"BOOST HELPS THE VOICE STAND OUT IN THE MIX."',
    focus: 'Clarity',
  },
  {
    id: 'air',
    label: 'AIR',
    frequency: '10KHZ+',
    value: 1,
    advice: '"CAREFUL: TOO MUCH BOOST MAKES \'S\' SOUNDS PIERCING."',
    focus: 'Sheen/Sibilance',
  },
];

export default function VirtualChannelStrip({
  sourceName = 'AUDIO SOURCE',
  autoGainDb = 0,
  lowCutEnabled = true,
  onLowCutToggle,
  onEqChange,
}: VirtualChannelStripProps) {
  const [bands, setBands] = useState<EQBand[]>(DEFAULT_BANDS);
  const [selectedBand, setSelectedBand] = useState<string | null>('weight');

  const handleBandChange = (bandId: string, value: number) => {
    setBands(prev => prev.map(band => 
      band.id === bandId ? { ...band, value } : band
    ));
    onEqChange?.(bandId, value);
  };

  const formatDb = (value: number) => {
    if (value === 0) return '0dB';
    return value > 0 ? `+${value.toFixed(1)}dB` : `${value.toFixed(1)}dB`;
  };

  return (
    <Card className="bg-slate-950 border-slate-800/50 overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-wide uppercase">
              {sourceName}
            </h3>
            <p className="text-xs text-cyan-400 font-medium tracking-widest">
              VIRTUAL CHANNEL STRIP • NEURAL POST-CLEANING
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-Gain Badge */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                Auto-Gain (Normalization)
              </div>
              <div className="text-lg font-mono font-bold text-cyan-400">
                {autoGainDb > 0 ? '+' : ''}{autoGainDb.toFixed(1)} dB
              </div>
            </div>

            {/* Low Cut Toggle */}
            <Button
              onClick={onLowCutToggle}
              className={`h-auto py-3 px-5 font-bold text-sm uppercase tracking-wider transition-all ${
                lowCutEnabled
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              100Hz Low Cut: {lowCutEnabled ? 'Active' : 'Off'}
            </Button>
          </div>
        </div>

        {/* EQ Modules */}
        <div className="grid grid-cols-3 gap-8">
          {bands.map((band) => (
            <div 
              key={band.id}
              className="flex flex-col items-center"
              onClick={() => setSelectedBand(band.id)}
            >
              {/* Knob Container */}
              <div 
                className={`p-4 rounded-xl transition-all cursor-pointer ${
                  selectedBand === band.id 
                    ? 'bg-pink-500/10 border-2 border-pink-500/40' 
                    : 'bg-transparent border-2 border-transparent hover:border-slate-700'
                }`}
              >
                <AnalogKnob
                  value={band.value}
                  onChange={(v) => handleBandChange(band.id, v)}
                  isSelected={selectedBand === band.id}
                  size={100}
                />
              </div>

              {/* Label */}
              <div className="mt-4 text-center">
                <div className="text-sm font-bold text-white tracking-wider">
                  {band.label} <span className="text-slate-400">({band.frequency})</span>
                </div>
                <div className={`text-lg font-mono font-bold mt-1 ${
                  band.value > 0 ? 'text-green-400' : 
                  band.value < 0 ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  {formatDb(band.value)}
                </div>
              </div>

              {/* Advice Tray */}
              <div className="mt-4 w-full bg-slate-900/80 rounded-lg p-3 border border-slate-800">
                <p className="text-[11px] text-slate-400 italic text-center leading-relaxed uppercase tracking-wide">
                  {band.advice}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Waves className="w-3 h-3" />
            <span>3-Band Parametric EQ • 48kHz Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-cyan-500" />
            <span className="text-cyan-500">Neural Engine Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
