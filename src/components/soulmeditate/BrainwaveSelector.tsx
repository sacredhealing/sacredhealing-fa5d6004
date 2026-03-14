// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Brain, Volume2, Headphones } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  SQI 2050 — BRAINWAVE SELECTOR
//  • 15 neural states across 5 categories
//  • Default volume: 75% (was 5% — too low)
//  • -5dB applied so it sits under the meditation audio
//  • Hot-swap: selecting a new state updates without stopping
//  • Left/Right ear display for true binaural effect
//  • SQI 2050 Siddha-Gold color scheme
// ═══════════════════════════════════════════════════════════════

interface BrainwavePreset {
  id: string;
  label: string;
  freq: number;           // beat Hz — the perceived difference
  carrierHz: number;      // base carrier to left ear
  description: string;
  benefit: string;
  color: string;
  category: 'deep' | 'meditative' | 'flow' | 'active' | 'advanced';
}

const BRAINWAVE_PRESETS: BrainwavePreset[] = [
  // ── DEEP ──
  { id: 'epsilon',  label: 'EPSILON',        freq: 0.5,  carrierHz: 200, description: 'Transcendental States',    benefit: 'Deepest meditation, out-of-body, samadhi access',                  color: '#a78bfa', category: 'deep'      },
  { id: 'delta08',  label: 'DELTA · 0.8 Hz', freq: 0.8,  carrierHz: 200, description: 'Deep Cellular Repair',    benefit: 'Cell regeneration, growth hormone release, deep healing',          color: '#818cf8', category: 'deep'      },
  { id: 'delta',    label: 'DELTA · 2 Hz',   freq: 2,    carrierHz: 200, description: 'Deep Sleep / Restore',    benefit: 'Immune boost, trauma integration, physical restoration',           color: '#60a5fa', category: 'deep'      },
  { id: 'delta35',  label: 'DELTA · 3.5 Hz', freq: 3.5,  carrierHz: 200, description: 'Deep Theta Threshold',   benefit: 'Astral projection gateway, subconscious access',                   color: '#38bdf8', category: 'deep'      },
  // ── MEDITATIVE ──
  { id: 'theta4',   label: 'THETA · 4 Hz',   freq: 4,    carrierHz: 200, description: 'Meditation / REM',       benefit: 'Intuition, insight, creativity, deep meditation',                  color: '#34d399', category: 'meditative'},
  { id: 'theta5',   label: 'THETA · 5 Hz',   freq: 5,    carrierHz: 200, description: 'Shamanic / Hypnotic',    benefit: 'Shamanic journey state, past life access, hypnosis',               color: '#4ade80', category: 'meditative'},
  { id: 'theta6',   label: 'THETA · 6 Hz',   freq: 6,    carrierHz: 200, description: 'Creative Visualisation', benefit: 'Manifestation, lucid dreaming, creative downloads',                color: '#a3e635', category: 'meditative'},
  { id: 'schumann', label: 'SCHUMANN 7.83',  freq: 7.83, carrierHz: 200, description: "Earth's Heartbeat",      benefit: "Earth's resonance — grounding, harmony with nature, neural coherence", color: '#D4AF37', category: 'meditative'},
  // ── FLOW ──
  { id: 'alpha8',   label: 'ALPHA · 8 Hz',   freq: 8,    carrierHz: 200, description: 'Relaxed Awareness',      benefit: 'Stress relief, meditation onset, calm presence',                   color: '#fbbf24', category: 'flow'      },
  { id: 'alpha',    label: 'ALPHA · 10 Hz',  freq: 10,   carrierHz: 200, description: 'Stress Relief / Flow',   benefit: 'Peak flow state, mind-body coherence, anxiety reduction',          color: '#fb923c', category: 'flow'      },
  { id: 'alpha12',  label: 'ALPHA · 12 Hz',  freq: 12,   carrierHz: 200, description: 'Bridge to Beta',         benefit: 'Focused relaxation, learning readiness, presence',                 color: '#f97316', category: 'flow'      },
  // ── ACTIVE ──
  { id: 'beta',     label: 'BETA · 14 Hz',   freq: 14,   carrierHz: 200, description: 'Active Thinking',        benefit: 'Problem solving, alertness, cognitive sharpness',                  color: '#f43f5e', category: 'active'    },
  { id: 'beta18',   label: 'BETA · 18 Hz',   freq: 18,   carrierHz: 200, description: 'Deep Focus',             benefit: 'Deep focus, analytical thinking, study state',                     color: '#fb7185', category: 'active'    },
  { id: 'gamma',    label: 'GAMMA · 40 Hz',  freq: 40,   carrierHz: 200, description: 'Peak Cognition',         benefit: 'Binding consciousness, peak performance, unity perception',         color: '#22d3ee', category: 'active'    },
  // ── ADVANCED ──
  { id: 'gamma80',  label: 'GAMMA · 80 Hz',  freq: 80,   carrierHz: 200, description: 'Hyper-Gamma',            benefit: 'Advanced meditators only — expanded perception, siddhis',          color: '#D4AF37', category: 'advanced'  },
];

const CAT_LABELS: Record<string, string> = {
  deep:       '⬛ DEEP STATES',
  meditative: '◈ MEDITATIVE',
  flow:       '◉ FLOW',
  active:     '▲ ACTIVE',
  advanced:   '⟁ ADVANCED',
};

interface BrainwaveSelectorProps {
  activeFrequency: number;
  volume: number;
  onSelect: (freq: number) => void;
  onVolumeChange: (volume: number) => void;
}

export default function BrainwaveSelector({
  activeFrequency,
  volume,
  onSelect,
  onVolumeChange,
}: BrainwaveSelectorProps) {
  const activePreset = BRAINWAVE_PRESETS.find(p => p.freq === activeFrequency);

  // Volume state is owned by parent (initialized at 0.75).
  // No useEffect needed here.

  const categories = ['deep', 'meditative', 'flow', 'active', 'advanced'] as const;

  return (
    <Card style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(40px)',
      border: `1px solid ${activePreset ? activePreset.color + '50' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 20,
      boxShadow: activePreset ? `0 0 24px ${activePreset.color}20` : 'none',
      transition: 'all 0.3s',
    }}>
      <CardHeader style={{ paddingBottom: 12 }}>
        <CardTitle style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)', flexWrap: 'wrap' }}>
          <Brain size={14} style={{ color: activePreset?.color ?? '#a78bfa', flexShrink: 0 }} />
          Neural Brainwave Target
          {activePreset && (
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, color: activePreset.color }}>
              — {activePreset.description}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Volume — default 75% */}
        <div>
          {/* No warning needed — volume starts at 75% */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Volume2 size={14} style={{ color: activePreset?.color ?? '#a78bfa', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 9 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                  Binaural Volume <span style={{ opacity: 0.5 }}>· −5dB under audio</span>
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: activePreset?.color ?? '#a78bfa' }}>{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => onVolumeChange(v)}
                className="[&_[role=slider]]:border-0"
              />
            </div>
          </div>
        </div>

        {/* Left / Right ear info panel */}
        {activePreset && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Headphones size={13} style={{ color: activePreset.color, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: activePreset.color, marginBottom: 8 }}>
                True Binaural · Headphones Required
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(165,180,252,0.6)', marginBottom: 3 }}>Left Ear</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#a5b4fc', fontFamily: 'monospace' }}>{activePreset.carrierHz} Hz</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>carrier tone</div>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(103,232,249,0.6)', marginBottom: 3 }}>Right Ear</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#67e8f9', fontFamily: 'monospace' }}>{activePreset.carrierHz + activePreset.freq} Hz</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>carrier + beat</div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Brain perceives <span style={{ color: activePreset.color, fontWeight: 700 }}>{activePreset.freq} Hz</span> difference → {activePreset.description}
              </div>
            </div>
          </div>
        )}

        {/* Active preset benefit */}
        {activePreset && (
          <div style={{ padding: '10px 12px', borderRadius: 12, background: `${activePreset.color}10`, border: `1px solid ${activePreset.color}40` }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: activePreset.color, marginBottom: 3 }}>
              {activePreset.label}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{activePreset.benefit}</div>
          </div>
        )}

        {/* Presets by category */}
        {categories.map(cat => {
          const presets = BRAINWAVE_PRESETS.filter(p => p.category === cat);
          return (
            <div key={cat}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 6, paddingLeft: 2 }}>
                {CAT_LABELS[cat]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {presets.map(p => {
                  const isActive = activeFrequency === p.freq;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p.freq)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 14,
                        border: `1px solid ${isActive ? p.color + '50' : 'rgba(255,255,255,0.07)'}`,
                        background: isActive ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isActive ? `0 0 12px ${p.color}25` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                          {p.label}
                        </span>
                        <span style={{ fontSize: 9, color: isActive ? p.color : 'rgba(255,255,255,0.35)' }}>
                          {p.description}
                        </span>
                      </div>
                      {isActive && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 7, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', color: '#a5b4fc', letterSpacing: '0.1em' }}>
                            L {p.carrierHz}
                          </span>
                          <span style={{ fontSize: 7, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', color: '#67e8f9', letterSpacing: '0.1em' }}>
                            R {p.carrierHz + p.freq}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Headphones reminder */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 14, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)' }}>
          <Headphones size={11} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>
            Binaural beats <strong style={{ color: 'rgba(167,139,250,0.7)' }}>require stereo headphones</strong>. Speakers merge both channels eliminating the beat. Left ear hears the carrier, right ear hears carrier + beat — your brain perceives the difference.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
