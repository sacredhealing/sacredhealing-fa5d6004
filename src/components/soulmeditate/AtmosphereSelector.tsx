import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause } from 'lucide-react';
import type { LayerState } from '@/hooks/useSoulMeditateEngine';

interface AtmosphereSelectorProps {
  layer: LayerState;
  atmosphereLibrary: Array<{ id: string; label: string; icon: string; description: string }>;
  onSelect: (id: string) => void;
  onTogglePlay: () => void;
  onVolumeChange: (vol: number) => void;
}

export default function AtmosphereSelector({
  layer,
  atmosphereLibrary,
  onSelect,
  onTogglePlay,
  onVolumeChange,
}: AtmosphereSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className={`shrink-0 transition-all ${
            layer.isPlaying
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
          }`}
          onClick={onTogglePlay}
          disabled={!layer.source}
        >
          {layer.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-white/60">Volume</span>
            <span className="text-white/80">{Math.round(layer.volume * 100)}%</span>
          </div>
          <Slider
            value={[layer.volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => onVolumeChange(v)}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>
        
        {layer.source && (
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
            {atmosphereLibrary.find(a => a.id === layer.source)?.label}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {atmosphereLibrary.map((atm) => {
          const isActive = layer.source === atm.id;
          return (
            <button
              key={atm.id}
              className={`p-3 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
              onClick={() => onSelect(atm.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{atm.icon}</span>
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
                  {atm.label}
                </span>
              </div>
              <p className="text-xs text-white/50 line-clamp-1">{atm.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
