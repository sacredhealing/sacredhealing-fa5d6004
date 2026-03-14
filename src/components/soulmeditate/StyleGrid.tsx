import React from 'react';
import { Slider } from '@/components/ui/slider';
import { RefreshCw, Volume2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════
//  SQI 2050 StyleGrid — Siddha-Gold palette, sacred glyphs
//  Volume slider wired to engine.atmosphereLayer volume
// ═══════════════════════════════════════════════════════

export type MeditationStyle =
  | 'indian' | 'shamanic' | 'mystic' | 'tibetan' | 'sufi'
  | 'zen' | 'nature_healing' | 'ocean' | 'sound_bath' | 'chakra'
  | 'higher_consciousness' | 'relaxing' | 'forest' | 'breath_focus' | 'kundalini';

interface StyleDef {
  id: MeditationStyle;
  label: string;
  sub: string;
  tags?: string[];
  glyph: string;          // SVG path or unicode sacred symbol
  glyphColor: string;
  glowColor: string;
}

const STYLES: StyleDef[] = [
  {
    id: 'indian',
    label: 'Indian (Vedic)',
    sub: 'Mantras, tanpura drones, temple bells',
    tags: ['tanpura', 'indian drone'],
    glyph: 'ॐ',
    glyphColor: '#D4AF37',
    glowColor: 'rgba(212,175,55,0.3)',
  },
  {
    id: 'shamanic',
    label: 'Shamanic',
    sub: 'Frame drums, rattles, tribal rhythms',
    glyph: '⬡',
    glyphColor: '#fb923c',
    glowColor: 'rgba(251,146,60,0.3)',
  },
  {
    id: 'mystic',
    label: 'Mystic',
    sub: 'Etheric pads, choirs, cosmic textures',
    glyph: '✦',
    glyphColor: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.3)',
  },
  {
    id: 'tibetan',
    label: 'Tibetan',
    sub: 'Singing bowls, long horns, overtones',
    glyph: '◎',
    glyphColor: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.3)',
  },
  {
    id: 'sufi',
    label: 'Sufi',
    sub: 'Whirling rhythms, ney flute, heart devotion',
    glyph: '☽',
    glyphColor: '#34d399',
    glowColor: 'rgba(52,211,153,0.3)',
  },
  {
    id: 'zen',
    label: 'Zen (Japanese)',
    sub: 'Minimal ambience, breath awareness',
    glyph: '⊕',
    glyphColor: '#38bdf8',
    glowColor: 'rgba(56,189,248,0.3)',
  },
  {
    id: 'nature_healing',
    label: 'Nature Healing',
    sub: 'Forest, birds, wind, water',
    glyph: '❋',
    glyphColor: '#4ade80',
    glowColor: 'rgba(74,222,128,0.3)',
  },
  {
    id: 'ocean',
    label: 'Ocean / Water',
    sub: 'Waves, flowing water, deep calming',
    glyph: '〜',
    glyphColor: '#22d3ee',
    glowColor: 'rgba(34,211,238,0.3)',
  },
  {
    id: 'sound_bath',
    label: 'Sound Bath',
    sub: 'Gongs, crystal bowls, harmonic overtones',
    glyph: '◉',
    glyphColor: '#D4AF37',
    glowColor: 'rgba(212,175,55,0.3)',
  },
  {
    id: 'chakra',
    label: 'Chakra Balancing',
    sub: 'Layered tones for each chakra',
    glyph: '⟁',
    glyphColor: '#f472b6',
    glowColor: 'rgba(244,114,182,0.3)',
  },
  {
    id: 'higher_consciousness',
    label: 'Higher Consciousness',
    sub: 'Cosmic tones, transcendence',
    glyph: '★',
    glyphColor: '#818cf8',
    glowColor: 'rgba(129,140,248,0.3)',
  },
  {
    id: 'relaxing',
    label: 'Relaxing',
    sub: 'Gentle ambient, stress relief',
    glyph: '∞',
    glyphColor: '#6ee7b7',
    glowColor: 'rgba(110,231,183,0.3)',
  },
  {
    id: 'forest',
    label: 'Forest',
    sub: 'Birdsong, rustling leaves, natural calm',
    glyph: '⵿',
    glyphColor: '#86efac',
    glowColor: 'rgba(134,239,172,0.3)',
  },
  {
    id: 'breath_focus',
    label: 'Breath Focus',
    sub: 'Breath cues, minimal ambience',
    glyph: '◈',
    glyphColor: '#7dd3fc',
    glowColor: 'rgba(125,211,252,0.3)',
  },
  {
    id: 'kundalini',
    label: 'Kundalini Energy',
    sub: 'Rising energy, drone + subtle pulses',
    glyph: '⚡',
    glyphColor: '#fde68a',
    glowColor: 'rgba(253,230,138,0.3)',
  },
];

interface StyleGridProps {
  activeStyle: MeditationStyle;
  onStyleChange: (style: MeditationStyle) => void;
  engine: any;
  onRefreshSound: (style: MeditationStyle) => void;
  isRefreshing: boolean;
  volumes: { ambient: number; binaural: number; healing: number; user: number };
  onVolumeChange: (key: string, value: number) => void;
}

export function StyleGrid({
  activeStyle,
  onStyleChange,
  engine,
  onRefreshSound,
  isRefreshing,
  volumes,
  onVolumeChange,
}: StyleGridProps) {
  const active = STYLES.find(s => s.id === activeStyle) ?? STYLES[0];

  const handleVolumeChange = (val: number) => {
    onVolumeChange('ambient', val);
    // Wire directly to engine atmosphere volume
    engine?.updateAtmosphereVolume?.(val / 100);
  };

  return (
    <div>
      {/* Header row with refresh + volume */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Active style indicator */}
          <span style={{ fontSize: 18, filter: `drop-shadow(0 0 8px ${active.glowColor})` }}>
            {active.glyph}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em]" style={{ color: active.glyphColor }}>
            {active.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Atmosphere volume — wired to engine */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 160 }}>
            <Volume2 size={12} style={{ color: 'rgba(212,175,55,0.6)', flexShrink: 0 }} />
            <div className="flex-1">
              <div className="flex justify-between text-[8px] mb-1">
                <span className="text-white/40 font-bold uppercase tracking-[0.3em]">Atmosphere</span>
                <span className="font-mono font-bold" style={{ color: '#D4AF37' }}>{volumes.ambient}%</span>
              </div>
              <Slider
                value={[volumes.ambient]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => handleVolumeChange(v)}
                className="[&_[role=slider]]:bg-[#D4AF37] [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-[0_0_8px_rgba(212,175,55,0.5)]"
              />
            </div>
          </div>
          {/* Refresh sound button */}
          <button
            onClick={() => onRefreshSound(activeStyle)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[8px] font-extrabold uppercase tracking-[0.3em] cursor-pointer transition-all"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}
          >
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            New Sound
          </button>
        </div>
      </div>

      {/* Style grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {STYLES.map(style => {
          const isActive = activeStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                padding: '14px 16px',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: isActive
                  ? `1px solid ${style.glyphColor}60`
                  : '1px solid rgba(255,255,255,0.06)',
                background: isActive
                  ? `${style.glyphColor}10`
                  : 'rgba(255,255,255,0.02)',
                boxShadow: isActive
                  ? `0 0 20px ${style.glowColor}, inset 0 0 20px ${style.glyphColor}05`
                  : 'none',
                textAlign: 'left',
              }}
            >
              {/* Sacred glyph */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                background: isActive ? `${style.glyphColor}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isActive ? style.glyphColor + '40' : 'rgba(255,255,255,0.08)'}`,
                filter: isActive ? `drop-shadow(0 0 8px ${style.glowColor})` : 'none',
                color: isActive ? style.glyphColor : 'rgba(255,255,255,0.5)',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {style.glyph}
              </div>

              {/* Text */}
              <div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  letterSpacing: '-0.01em',
                  marginBottom: 3,
                }}>
                  {style.label}
                </div>
                <div style={{
                  fontSize: 10,
                  color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
                  lineHeight: 1.4,
                }}>
                  {style.sub}
                </div>
                {/* Tags for active */}
                {isActive && style.tags && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {style.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: 8,
                        background: `${style.glyphColor}20`,
                        border: `1px solid ${style.glyphColor}40`,
                        color: style.glyphColor,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StyleGrid;
