import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Volume2, AudioWaveform, Gauge, Activity } from 'lucide-react';

interface ConsoleStripProps {
  autoGainDb: number;
  inputLevel: number;
  outputLevel: number;
  noiseFloorDb: number;
  isActive: boolean;
  onInputGainChange?: (gain: number) => void;
}

export default function ConsoleStrip({
  autoGainDb,
  inputLevel,
  outputLevel,
  noiseFloorDb,
  isActive,
  onInputGainChange,
}: ConsoleStripProps) {
  const formatDb = (value: number) => {
    if (value === 0) return '0.0';
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  };

  const getMeterColor = (level: number) => {
    if (level > -6) return 'bg-red-500';
    if (level > -12) return 'bg-amber-500';
    if (level > -24) return 'bg-green-500';
    return 'bg-cyan-500';
  };

  const levelToPercent = (db: number) => {
    // Map -60dB to 0dB -> 0% to 100%
    return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  };

  return (
    <Card className="bg-black/60 backdrop-blur-xl border-cyan-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-cyan-300">
          <div className="p-1.5 rounded bg-cyan-500/20">
            <AudioWaveform className="w-4 h-4 text-cyan-400" />
          </div>
          Console Strip
          {isActive && (
            <Badge variant="outline" className="ml-auto text-[10px] border-cyan-500/30 text-cyan-400">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meters Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Input Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">INPUT</span>
              <span className="font-mono text-cyan-400">{formatDb(inputLevel)} dB</span>
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-75 ${getMeterColor(inputLevel)}`}
                style={{ width: `${levelToPercent(inputLevel)}%` }}
              />
            </div>
          </div>

          {/* Output Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">OUTPUT</span>
              <span className="font-mono text-green-400">{formatDb(outputLevel)} dB</span>
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-75 ${getMeterColor(outputLevel)}`}
                style={{ width: `${levelToPercent(outputLevel)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Auto-Gain & Noise Floor */}
        <div className="grid grid-cols-2 gap-3">
          {/* Auto-Gain Readout */}
          <div className="bg-black/40 rounded-lg p-3 border border-cyan-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Auto-Gain</span>
            </div>
            <div className={`text-lg font-mono font-bold ${
              autoGainDb > 0 ? 'text-green-400' : autoGainDb < 0 ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {formatDb(autoGainDb)} dB
            </div>
            <div className="text-[9px] text-white/40 mt-1">Normalization offset</div>
          </div>

          {/* Noise Floor */}
          <div className="bg-black/40 rounded-lg p-3 border border-cyan-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-400/70 uppercase tracking-wider">Noise Floor</span>
            </div>
            <div className="text-lg font-mono font-bold text-purple-400">
              {formatDb(noiseFloorDb)} dB
            </div>
            <div className="text-[9px] text-white/40 mt-1">Gate threshold: -45 dB</div>
          </div>
        </div>

        {/* Gain Reduction Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Gain Reduction
            </span>
            <span className="font-mono text-amber-400">
              {Math.abs(autoGainDb) > 0 ? `-${Math.min(12, Math.abs(autoGainDb)).toFixed(1)}` : '0.0'} dB
            </span>
          </div>
          <div className="h-1.5 bg-black/50 rounded-full overflow-hidden flex justify-end">
            <div 
              className="h-full bg-gradient-to-l from-amber-500 to-amber-600 transition-all duration-150"
              style={{ width: `${Math.min(100, (Math.abs(autoGainDb) / 12) * 100)}%` }}
            />
          </div>
        </div>

        {/* Limiter Status */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-950/50 to-purple-950/50 border border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-xs text-white/60">Soft-Knee Limiter</span>
          </div>
          <span className="text-[10px] font-mono text-white/40">
            Target: -14 LUFS
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
