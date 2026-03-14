import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Radio, Volume2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  SQI 2050 — HEALING FREQUENCY SELECTOR
//  • 20 frequencies across 4 categories
//  • Default volume: 75% (was 3% — too low)
//  • -5dB applied in engine so it sits under the meditation audio
//  • Hot-swap: selecting a new Hz updates without stopping playback
//  • SQI 2050 Siddha-Gold color scheme
// ═══════════════════════════════════════════════════════════════

interface HealingFrequency {
  freq: number;
  name: string;
  description: string;
  benefit: string;
  chakraColor: string;
  category: 'foundational' | 'solfeggio' | 'vedic' | 'advanced';
}

const HEALING_FREQUENCIES: HealingFrequency[] = [
  // ── FOUNDATIONAL ──
  { freq: 111,  name: '111 Hz',    description: 'Cell Regeneration',    benefit: 'Beta endorphin release, pain relief, nerve regeneration',      chakraColor: 'red',    category: 'foundational' },
  { freq: 174,  name: '174 Hz',    description: 'Foundation & Security', benefit: 'Root chakra anchoring, pain reduction, physical grounding',   chakraColor: 'red',    category: 'foundational' },
  { freq: 285,  name: '285 Hz',    description: 'Quantum Cognition',     benefit: 'Tissue and organ repair, quantum field restructuring',        chakraColor: 'orange', category: 'foundational' },
  // ── SOLFEGGIO ──
  { freq: 396,  name: '396 Hz',    description: 'Liberation from Fear',  benefit: 'Releases guilt, fear and grief from cellular memory',         chakraColor: 'yellow', category: 'solfeggio' },
  { freq: 417,  name: '417 Hz',    description: 'Transmutation',         benefit: 'Undoing negative situations, facilitating change',            chakraColor: 'green',  category: 'solfeggio' },
  { freq: 432,  name: '432 Hz',    description: 'Cosmic Harmony',        benefit: 'Vedic tuning — aligns with nature\'s harmonic field',        chakraColor: 'emerald',category: 'solfeggio' },
  { freq: 528,  name: '528 Hz',    description: 'DNA Restore & Love',    benefit: 'DNA repair resonance, transformation, miraculous field',      chakraColor: 'cyan',   category: 'solfeggio' },
  { freq: 639,  name: '639 Hz',    description: 'Heart Connection',      benefit: 'Reconnecting relationships, heart coherence, love field',     chakraColor: 'teal',   category: 'solfeggio' },
  { freq: 741,  name: '741 Hz',    description: 'Awakening Intuition',   benefit: 'Detoxification, problem solving, third eye activation',       chakraColor: 'blue',   category: 'solfeggio' },
  { freq: 852,  name: '852 Hz',    description: 'Third Eye Activation',  benefit: 'Returning to spiritual order, pineal decalcification',        chakraColor: 'indigo', category: 'solfeggio' },
  { freq: 963,  name: '963 Hz',    description: 'Crown & Unity',         benefit: 'Pineal activation, unity consciousness, divine connection',   chakraColor: 'violet', category: 'solfeggio' },
  // ── VEDIC ──
  { freq: 108,  name: '108 Hz',    description: 'Sacred 108 — Prana',    benefit: 'Sacred Vedic number — prana infusion, mantra resonance',     chakraColor: 'gold',   category: 'vedic' },
  { freq: 136,  name: '136.1 Hz',  description: 'OM — Earth Year',       benefit: 'The cosmic OM tone — Earth orbit frequency, deep stillness', chakraColor: 'emerald',category: 'vedic' },
  { freq: 194,  name: '194.18 Hz', description: 'Earth Day Frequency',   benefit: "Earth's rotation tone — grounding, nature alignment",        chakraColor: 'green',  category: 'vedic' },
  { freq: 210,  name: '210.42 Hz', description: 'Moon Frequency',        benefit: 'Lunar resonance — emotional cleansing, feminine cycles',     chakraColor: 'sky',    category: 'vedic' },
  { freq: 256,  name: '256 Hz',    description: 'C Tone — Root',         benefit: 'Perfect C in Pythagorean tuning — grounding, stability',     chakraColor: 'red',    category: 'vedic' },
  // ── ADVANCED ──
  { freq: 333,  name: '333 Hz',    description: 'Divine Frequency',      benefit: 'Sacred number resonance — divine trinity activation',        chakraColor: 'gold',   category: 'advanced' },
  { freq: 444,  name: '444 Hz',    description: 'Angelic Activation',    benefit: 'Angelic hierarchy resonance, higher self alignment',         chakraColor: 'cyan',   category: 'advanced' },
  { freq: 888,  name: '888 Hz',    description: 'Infinite Abundance',    benefit: 'Manifestation field, infinite loop resonance, prosperity',   chakraColor: 'violet', category: 'advanced' },
  { freq: 1111, name: '1111 Hz',   description: 'Gateway / Portal',      benefit: 'Dimensional gateway tone — advanced practitioners only',     chakraColor: 'violet', category: 'advanced' },
];

// SQI 2050 color map — Siddha-Gold dominant
const COLORS: Record<string, { border: string; glow: string; text: string; bg: string; activeBg: string }> = {
  red:     { border: 'rgba(248,113,113,0.4)',  glow: 'rgba(248,113,113,0.2)',  text: '#f87171', bg: 'rgba(248,113,113,0.06)', activeBg: 'rgba(248,113,113,0.15)' },
  orange:  { border: 'rgba(251,146,60,0.4)',   glow: 'rgba(251,146,60,0.2)',   text: '#fb923c', bg: 'rgba(251,146,60,0.06)', activeBg: 'rgba(251,146,60,0.15)'  },
  yellow:  { border: 'rgba(250,204,21,0.4)',   glow: 'rgba(250,204,21,0.2)',   text: '#facc15', bg: 'rgba(250,204,21,0.06)', activeBg: 'rgba(250,204,21,0.15)'  },
  green:   { border: 'rgba(74,222,128,0.4)',   glow: 'rgba(74,222,128,0.2)',   text: '#4ade80', bg: 'rgba(74,222,128,0.06)', activeBg: 'rgba(74,222,128,0.15)'  },
  emerald: { border: 'rgba(52,211,153,0.4)',   glow: 'rgba(52,211,153,0.2)',   text: '#34d399', bg: 'rgba(52,211,153,0.06)', activeBg: 'rgba(52,211,153,0.15)' },
  cyan:    { border: 'rgba(34,211,238,0.4)',   glow: 'rgba(34,211,238,0.2)',   text: '#22d3ee', bg: 'rgba(34,211,238,0.06)', activeBg: 'rgba(34,211,238,0.15)'  },
  teal:    { border: 'rgba(45,212,191,0.4)',   glow: 'rgba(45,212,191,0.2)',   text: '#2dd4bf', bg: 'rgba(45,212,191,0.06)', activeBg: 'rgba(45,212,191,0.15)'  },
  sky:     { border: 'rgba(56,189,248,0.4)',   glow: 'rgba(56,189,248,0.2)',   text: '#38bdf8', bg: 'rgba(56,189,248,0.06)', activeBg: 'rgba(56,189,248,0.15)'  },
  blue:    { border: 'rgba(96,165,250,0.4)',   glow: 'rgba(96,165,250,0.2)',   text: '#60a5fa', bg: 'rgba(96,165,250,0.06)', activeBg: 'rgba(96,165,250,0.15)'  },
  indigo:  { border: 'rgba(129,140,248,0.4)',  glow: 'rgba(129,140,248,0.2)',  text: '#818cf8', bg: 'rgba(129,140,248,0.06)', activeBg: 'rgba(129,140,248,0.15)' },
  violet:  { border: 'rgba(167,139,250,0.4)',  glow: 'rgba(167,139,250,0.2)',  text: '#a78bfa', bg: 'rgba(167,139,250,0.06)', activeBg: 'rgba(167,139,250,0.15)' },
  gold:    { border: 'rgba(212,175,55,0.4)',   glow: 'rgba(212,175,55,0.2)',   text: '#D4AF37', bg: 'rgba(212,175,55,0.06)', activeBg: 'rgba(212,175,55,0.15)'  },
};

const CAT_LABELS: Record<string, string> = {
  foundational: '⊕ FOUNDATIONAL',
  solfeggio:    '◈ SOLFEGGIO SCALE',
  vedic:        'ॐ VEDIC · COSMIC',
  advanced:     '⟁ ADVANCED',
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
  onVolumeChange,
}: HealingFrequencySelectorProps) {
  const activeFreq = HEALING_FREQUENCIES.find(f => f.freq === activeFrequency);
  const c = activeFreq ? (COLORS[activeFreq.chakraColor] ?? COLORS.gold) : COLORS.gold;

  const categories = ['foundational', 'solfeggio', 'vedic', 'advanced'] as const;

  // Default volume to 75% on mount if it's near 0
  React.useEffect(() => {
    if (volume < 0.05) {
      onVolumeChange(0.75);
    }
  }, []);

  return (
    <Card style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(40px)',
      border: `1px solid ${c.border}`,
      borderRadius: 20,
      boxShadow: activeFreq ? `0 0 24px ${c.glow}` : 'none',
      transition: 'all 0.3s',
    }}>
      <CardHeader style={{ paddingBottom: 12 }}>
        <CardTitle style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)', flexWrap: 'wrap' }}>
          <Radio size={14} style={{ color: c.text, flexShrink: 0 }} />
          Healing Fundamental (Hz)
          {activeFreq && (
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, color: c.text }}>
              — {activeFreq.description}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Volume — default 75%, -5dB label */}
        <div>
          {volume < 0.05 && (
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 10, marginBottom: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚡ Move slider to activate frequency
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Volume2 size={14} style={{ color: c.text, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 9 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                  Frequency Volume <span style={{ opacity: 0.5 }}>· −5dB under audio</span>
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: c.text }}>{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => onVolumeChange(v)}
                style={{ '--slider-color': c.text } as React.CSSProperties}
                className={`[&_[role=slider]]:border-0`}
              />
            </div>
          </div>
        </div>

        {/* Active freq benefit */}
        {activeFreq && (
          <div style={{ padding: '10px 12px', borderRadius: 12, background: c.bg, border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: c.text, marginBottom: 4 }}>
              {activeFreq.freq} Hz · {activeFreq.description}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{activeFreq.benefit}</div>
          </div>
        )}

        {/* Frequency grid by category */}
        {categories.map(cat => {
          const freqs = HEALING_FREQUENCIES.filter(f => f.category === cat);
          return (
            <div key={cat}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 6, paddingLeft: 2 }}>
                {CAT_LABELS[cat]}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {freqs.map(f => {
                  const isActive = activeFrequency === f.freq;
                  const fc = COLORS[f.chakraColor] ?? COLORS.gold;
                  return (
                    <button
                      key={f.freq}
                      onClick={() => onSelect(f.freq)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '10px 12px',
                        borderRadius: 14,
                        border: `1px solid ${isActive ? fc.border : 'rgba(255,255,255,0.07)'}`,
                        background: isActive ? fc.activeBg : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        boxShadow: isActive ? `0 0 12px ${fc.glow}` : 'none',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                        {f.name}
                      </span>
                      <span style={{ fontSize: 9, color: isActive ? fc.text : 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.05em' }}>
                        {f.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
