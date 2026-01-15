import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export type MeditationStyle = 
  | 'indian'
  | 'shamanic'
  | 'mystic'
  | 'tibetan'
  | 'sufi'
  | 'zen'
  | 'nature'
  | 'ocean'
  | 'sound_bath'
  | 'chakra'
  | 'higher_consciousness'
  | 'relaxing'
  | 'forest'
  | 'breath_focus'
  | 'kundalini';

interface StyleConfig {
  id: MeditationStyle;
  label: string;
  description: string;
  icon: string;
  tags?: string[];
  color: string;
}

const STYLE_CONFIGS: StyleConfig[] = [
  { id: 'indian', label: 'Indian (Vedic)', description: 'Mantras, tanpura drones, temple bells', icon: '🕉️', tags: ['tanpura', 'indian drone'], color: 'from-purple-500/20 to-violet-500/20 border-purple-500/50' },
  { id: 'shamanic', label: 'Shamanic', description: 'Frame drums, rattles, tribal rhythms', icon: '🪘', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30' },
  { id: 'mystic', label: 'Mystic', description: 'Etheric pads, choirs, cosmic textures', icon: '✨', color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30' },
  { id: 'tibetan', label: 'Tibetan', description: 'Singing bowls, long horns, overtone chanting', icon: '🔔', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30' },
  { id: 'sufi', label: 'Sufi', description: 'Whirling rhythms, ney flute, heart devotion', icon: '💫', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
  { id: 'zen', label: 'Zen (Japanese)', description: 'Minimal ambience, breath awareness', icon: '🎋', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
  { id: 'nature', label: 'Nature Healing', description: 'Forest, birds, wind, water', icon: '🌿', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
  { id: 'ocean', label: 'Ocean / Water', description: 'Waves, flowing water, deep calming', icon: '🌊', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30' },
  { id: 'sound_bath', label: 'Sound Bath', description: 'Gongs, crystal bowls, harmonic overtones', icon: '🎵', color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30' },
  { id: 'chakra', label: 'Chakra Balancing', description: 'Layered tones for each chakra', icon: '🔮', color: 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/50' },
  { id: 'higher_consciousness', label: 'Higher Consciousness', description: 'Cosmic tones, transcendence', icon: '🌌', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30' },
  { id: 'relaxing', label: 'Relaxing', description: 'Gentle ambient, stress relief', icon: '😌', color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30' },
  { id: 'forest', label: 'Forest', description: 'Birdsong, rustling leaves, natural calm', icon: '🌲', color: 'from-green-500/20 to-lime-500/20 border-green-500/30' },
  { id: 'breath_focus', label: 'Breath Focus', description: 'Breath cues, minimal ambience', icon: '🌬️', color: 'from-slate-500/20 to-gray-500/20 border-slate-500/30' },
  { id: 'kundalini', label: 'Kundalini Energy', description: 'Rising energy, drone + subtle pulses', icon: '🐍', color: 'from-lime-500/20 to-green-500/20 border-lime-500/30' },
];

interface StyleGridProps {
  activeStyle: MeditationStyle;
  onStyleSelect: (style: MeditationStyle) => void;
}

export default function StyleGrid({ activeStyle, onStyleSelect }: StyleGridProps) {
  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white/90">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          Meditation Style
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {STYLE_CONFIGS.map((style) => {
            const isActive = activeStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => onStyleSelect(style.id)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  isActive
                    ? `bg-gradient-to-br ${style.color}`
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-2xl mb-2">{style.icon}</div>
                <div className={`text-sm font-medium mb-1 ${isActive ? 'text-white' : 'text-white/80'}`}>
                  {style.label}
                </div>
                <p className="text-xs text-white/50 line-clamp-2">{style.description}</p>
                {style.tags && isActive && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {style.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-[9px] px-1.5 py-0 border-cyan-500/50 text-cyan-400"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
