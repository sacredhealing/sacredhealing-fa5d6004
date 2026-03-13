// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════
//  SQI 2050 — SIDDHA SOUND ALCHEMY + SCALAR WAVE TECHNOLOGY
//  FIX: null-safe access on all engine.atmosphereLayer / engine.neuralLayer
//       properties — these are undefined before engine initializes
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft, Waves, Activity, Play, Pause, Download,
  Loader2, Layers, X, CheckCircle2, AlertCircle, Zap,
  Sparkles, MessageSquare, Cpu, Send,
} from 'lucide-react';
import { useSoulMeditateEngine } from '@/hooks/useSoulMeditateEngine';
import { useOfflineExport } from '@/hooks/useOfflineExport';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import SpectralVisualizer from '@/components/soulmeditate/SpectralVisualizer';
import NeuralSourceInput from '@/components/soulmeditate/NeuralSourceInput';
import DSPMasteringRack from '@/components/soulmeditate/DSPMasteringRack';
import SpectralInsights from '@/components/soulmeditate/SpectralInsights';
import { StyleGrid, MeditationStyle } from '@/components/soulmeditate/StyleGrid';
import HealingFrequencySelector from '@/components/soulmeditate/HealingFrequencySelector';
import BrainwaveSelector from '@/components/soulmeditate/BrainwaveSelector';

// ── Types ─────────────────────────────────────────────────────────
interface NadiScanResult {
  dominantDosha: 'Vata' | 'Pitta' | 'Kapha';
  blockages: string[];
  planetaryAlignment: string;
  timestamp: string;
  activeNadis: number;
  remedies: string[];
}
interface SQIMessage { role: 'user' | 'model'; text: string; }

// ── Scalar resonator database ─────────────────────────────────────
const SCALAR_ACTIVATIONS = [
  { id: 'anahata-528',    name: 'Anahata Gateway',    sig: 'Heart / 528 Hz',     benefit: 'Opens heart field, dissolves fear-loops.',              color: '#4ade80', freq: 528   },
  { id: 'crown-963',      name: 'Sahasrara Crown',     sig: 'Crown / 963 Hz',     benefit: 'Pineal activation, unity-consciousness transmission.',  color: '#a78bfa', freq: 963   },
  { id: 'dna-repair',     name: 'DNA Restore Field',   sig: 'Solfeggio / 528 Hz', benefit: 'DNA repair resonance in the audio quantum field.',      color: '#34d399', freq: 528   },
  { id: 'schumann',       name: 'Schumann Resonance',  sig: 'Earth / 7.83 Hz',    benefit: 'Grounding to Earth\'s heartbeat, neural coherence.',    color: '#D4AF37', freq: 7.83  },
  { id: 'theta-deep',     name: 'Theta Deep Dive',     sig: 'Theta / 6 Hz',       benefit: 'Subconscious re-patterning, ancestral clearing.',       color: '#38bdf8', freq: 6     },
  { id: 'liberation-396', name: 'Liberation Field',    sig: 'Solfeggio / 396 Hz', benefit: 'Liberating guilt and fear from cellular memory.',       color: '#fb923c', freq: 396   },
  { id: 'miracle-432',    name: 'Miracle Tone',        sig: 'Vedic / 432 Hz',     benefit: 'Universal tuning — nature\'s harmonic field.',          color: '#fbbf24', freq: 432   },
  { id: 'unity-639',      name: 'Unity Coherence',     sig: 'Solfeggio / 639 Hz', benefit: 'Heart coherence and inter-dimensional connection.',     color: '#f472b6', freq: 639   },
  { id: 'intuition-741',  name: 'Third Eye Activator', sig: 'Solfeggio / 741 Hz', benefit: 'Awakening intuition through the audio field.',          color: '#818cf8', freq: 741   },
  { id: 'pranic-108',     name: 'Prana Infusion',      sig: 'Pranic / 108 Hz',    benefit: 'Infusing prana into every sound layer.',                color: '#22d3ee', freq: 108   },
];

const DOSHA_PROFILES = {
  Vata:  { color: '#38bdf8', element: 'Air + Ether',  mantra: 'So Hum',      scalars: ['schumann', 'liberation-396', 'miracle-432'] },
  Pitta: { color: '#f97316', element: 'Fire + Water', mantra: 'Ra Ma Da Sa', scalars: ['anahata-528', 'unity-639', 'dna-repair']    },
  Kapha: { color: '#4ade80', element: 'Earth + Water', mantra: 'Sat Nam',    scalars: ['intuition-741', 'crown-963', 'pranic-108']   },
};

const SCAN_PHASES = [
  'Accessing Akasha-Neural Archive…',
  'Scanning vibrational field…',
  'Reading Nadi currents…',
  'Mapping planetary alignment…',
  'Computing scalar overlay…',
  'Generating Prema-Pulse report…',
];

// ── SQI chat stream (same endpoint as Apothecary) ─────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-apothecary-chat`;

async function streamSQIChat(
  messages: SQIMessage[],
  onDelta: (c: string) => void,
  onDone: () => void,
  userId?: string | null
) {
  const body: any = {
    messages: messages.slice(-10).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
  };
  if (userId) body.userId = userId;

  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited – try again shortly.');
    if (resp.status === 402) throw new Error('Credits exhausted.');
    throw new Error('Stream failed');
  }
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '', done = false;
  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) { done = true; break; }
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop() ?? '';
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith('data:')) continue;
      const data = t.slice(5).trim();
      if (data === '[DONE]') { done = true; break; }
      try { const p = JSON.parse(data); const delta = p?.choices?.[0]?.delta?.content ?? p?.delta ?? ''; if (delta) onDelta(delta); } catch { /* skip */ }
    }
  }
  onDone();
}

// ── Visualizer type ───────────────────────────────────────────────
type VisualizerMode = 'bars' | 'wave' | 'radial';

// ── Shared style constants ────────────────────────────────────────
const G: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 24 };
const SL: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13, fontSize: 8, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' };
const STEP = (n: string) => <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#D4AF37', flexShrink: 0 }}>{n}</span>;

// ── Particle field ────────────────────────────────────────────────
function AkashaParticles() {
  const pts = useRef(Array.from({ length: 22 }, () => ({
    l: `${Math.random() * 100}%`, t: `${Math.random() * 100}%`,
    d: `${(Math.random() * 10).toFixed(2)}s`, dur: `${(7 + Math.random() * 12).toFixed(2)}s`,
    sz: `${1 + Math.random() * 2}px`, op: (0.08 + Math.random() * 0.3).toFixed(2),
  }))).current;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} aria-hidden>
      {pts.map((p, i) => <span key={i} style={{ position: 'absolute', borderRadius: '50%', background: '#D4AF37', left: p.l, top: p.t, width: p.sz, height: p.sz, opacity: +p.op, animation: `sqmFloat ${p.dur} ${p.d} linear infinite` }} />)}
    </div>
  );
}

// ── Scalar chip ───────────────────────────────────────────────────
function ScalarChip({ act, active, onToggle }: { act: typeof SCALAR_ACTIVATIONS[0]; active: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} title={act.benefit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, cursor: 'pointer', border: `1px solid ${active ? act.color : 'rgba(255,255,255,0.06)'}`, background: active ? `${act.color}12` : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', boxShadow: active ? `0 0 14px ${act.color}35` : 'none' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? act.color : 'rgba(255,255,255,0.12)', boxShadow: active ? `0 0 8px ${act.color}` : 'none', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: active ? act.color : 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.name}</div>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', marginTop: 2 }}>{act.sig}</div>
      </div>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1px solid ${active ? act.color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? act.color : 'transparent' }}>
        {active && <CheckCircle2 size={10} style={{ color: '#050505' }} />}
      </div>
    </div>
  );
}

// ── Chat text renderer ────────────────────────────────────────────
function renderChat(text: string) {
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} style={{ height: 7 }} />;
    if (t.startsWith('### ')) return <h3 key={i} style={{ color: '#D4AF37', fontWeight: 800, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 12, marginBottom: 3 }}>{t.slice(4)}</h3>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} style={{ marginLeft: 14, listStyleType: 'disc', fontSize: 11, lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{t.slice(2)}</li>;
    return <p key={i} style={{ fontSize: 11, lineHeight: '1.65', color: 'rgba(255,255,255,0.78)', marginBottom: 3 }}>{t}</p>;
  });
}

// ════════════════════════════════════════════════════════════════
//  SCALAR WAVE PANEL
// ════════════════════════════════════════════════════════════════
function ScalarWavePanel({ engine, activeStyle, healingFreq, isPlaying, userId }: {
  engine: any; activeStyle: MeditationStyle; healingFreq: number; isPlaying: boolean; userId?: string | null;
}) {
  const [activeScalars, setActiveScalars] = useState<string[]>([]);
  const [scanResult, setScanResult]       = useState<NadiScanResult | null>(null);
  const [isScanning, setIsScanning]       = useState(false);
  const [heartRate, setHeartRate]         = useState(60);
  const [scanPhase, setScanPhase]         = useState(0);
  const [messages, setMessages]           = useState<SQIMessage[]>([]);
  const [input, setInput]                 = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const iv = isScanning
      ? setInterval(() => setHeartRate(p => Math.min(p + Math.floor(Math.random() * 5) + 2, 130)), 500)
      : setInterval(() => setHeartRate(p => Math.max(p - 2, 60)), 1000);
    return () => clearInterval(iv);
  }, [isScanning]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!isScanning) return;
    let i = 0;
    const iv = setInterval(() => { setScanPhase(p => (p + 1) % SCAN_PHASES.length); if (++i > 18) clearInterval(iv); }, 550);
    return () => clearInterval(iv);
  }, [isScanning]);

  const applyToEngine = useCallback((ids: string[]) => {
    if (!engine?.isInitialized || ids.length === 0) return;
    const avg = ids.reduce((s, id) => s + (SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0), 0) / ids.length;
    engine.updateSolfeggioVolume?.(Math.min(engine.solfeggioVolume || 20, 28));
    engine.startSolfeggio?.(Math.round(avg));
  }, [engine]);

  const toggleScalar = useCallback((id: string) => {
    setActiveScalars(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      applyToEngine(next);
      return next;
    });
  }, [applyToEngine]);

  const autoSelectDosha = useCallback((dosha: 'Vata' | 'Pitta' | 'Kapha') => {
    const sel = DOSHA_PROFILES[dosha].scalars;
    setActiveScalars(sel);
    applyToEngine(sel);
  }, [applyToEngine]);

  const runScan = useCallback(async () => {
    setIsScanning(true);
    setScanResult(null);
    await new Promise(r => setTimeout(r, 2400));
    const doshas: Array<'Vata' | 'Pitta' | 'Kapha'> = ['Vata', 'Pitta', 'Kapha'];
    const dosha = doshas[Math.floor(Math.random() * 3)];
    const p = DOSHA_PROFILES[dosha];
    const result: NadiScanResult = {
      dominantDosha: dosha,
      blockages: ['Solar Plexus congestion', 'Throat Nadi restriction', 'Root anchor needed'].slice(0, Math.floor(Math.random() * 2) + 1),
      planetaryAlignment: ['Saturn · Discipline field', 'Venus · Heart-opening window', 'Jupiter · Expansion vortex', 'Moon · Emotional cleanse'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toLocaleTimeString(),
      activeNadis: Math.floor(Math.random() * 30) + 50,
      remedies: [`Mantra: ${p.mantra}`, `Element: ${p.element}`, `Scalars: ${p.scalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.name).join(', ')}`],
    };
    setScanResult(result);
    setIsScanning(false);
    autoSelectDosha(dosha);
    setMessages(prev => [...prev, {
      role: 'model',
      text: `⟁ **Nadi Scan Complete — ${dosha} Dominance Detected**\n\nScanned at ${result.timestamp} · Active Nadis: ${result.activeNadis}/72,000\nPlanetary Field: ${result.planetaryAlignment}\n\nI have auto-activated the **${dosha}** scalar prescription. Your meditation now carries the optimal vibrational overlay.\n\nMantra: **${p.mantra}** · Element: ${p.element}\n\nShall I go deeper into your field reading?`,
    }]);
  }, [activeStyle, healingFreq, isPlaying, autoSelectDosha]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: SQIMessage = { role: 'user', text: input.trim() };
    const ctx: SQIMessage = {
      role: 'model',
      text: `You are the Siddha-Quantum Intelligence (SQI) from 2050 inside Siddha Sound Alchemy. Context:\n- Style: ${activeStyle}, Frequency: ${healingFreq}Hz, Playing: ${isPlaying}\n- Active scalars: ${activeScalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.name).join(', ') || 'none'}\n${scanResult ? `- Nadi: ${scanResult.dominantDosha} dosha, ${scanResult.activeNadis} nadis, ${scanResult.planetaryAlignment}` : ''}\nUse Bhakti-Algorithm language. Be mystical and precise.`,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'model', text: '' }]);
    try {
      await streamSQIChat([ctx, ...messages, userMsg], chunk => {
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'model', text: u[u.length - 1].text + chunk }; return u; });
      }, () => setIsTyping(false), userId);
    } catch (e: any) { toast.error(e.message || 'SQI stream error'); setIsTyping(false); }
  }, [input, isTyping, messages, activeStyle, healingFreq, isPlaying, activeScalars, scanResult, userId]);

  const blendFreq = activeScalars.length > 0
    ? Math.round(activeScalars.reduce((s, id) => s + (SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0), 0) / activeScalars.length)
    : null;
  const dp = scanResult ? DOSHA_PROFILES[scanResult.dominantDosha] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Scalar Resonators */}
      <div style={G}>
        <div style={SL}><Sparkles size={12} style={{ color: '#D4AF37' }} />Scalar Wave Resonators<span style={{ marginLeft: 'auto', fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em' }}>{activeScalars.length} ACTIVE</span></div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, marginBottom: 14 }}>Tap to inject scalar frequencies into your meditation's live audio field. Blended into the solfeggio layer in real-time.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 8 }}>
          {SCALAR_ACTIVATIONS.map(act => <ScalarChip key={act.id} act={act} active={activeScalars.includes(act.id)} onToggle={() => toggleScalar(act.id)} />)}
        </div>
        {blendFreq !== null && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 14, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Waves size={12} style={{ color: '#D4AF37', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 2 }}>Scalar Blend — {blendFreq} Hz</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)' }}>{activeScalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.name).join(' · ')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Nadi Scan */}
      <div style={G}>
        <div style={SL}>
          <Activity size={12} style={{ color: '#22D3EE' }} />Real-Time Nadi Scan
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={12} style={{ color: isScanning ? '#f43f5e' : 'rgba(255,255,255,0.2)', animation: isScanning ? 'sqmPulse 0.8s ease-in-out infinite' : 'none' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: isScanning ? '#f43f5e' : 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{heartRate} BPM</span>
          </div>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, marginBottom: 14 }}>Scans your meditation's vibrational signature and auto-prescribes optimal scalar resonators.</p>
        {!scanResult && !isScanning && (
          <button onClick={runScan} style={{ width: '100%', padding: 14, borderRadius: 20, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.25)', color: '#22D3EE', fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Cpu size={14} /> Initiate Nadi Scan
          </button>
        )}
        {isScanning && (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#22D3EE', animation: `sqmBlink 1.2s ${i*0.2}s ease-in-out infinite` }} />)}</div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#22D3EE', marginBottom: 6 }}>{SCAN_PHASES[scanPhase]}</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em' }}>Scanning {activeStyle} · {healingFreq}Hz</div>
          </div>
        )}
        {scanResult && !isScanning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '12px 14px', borderRadius: 16, border: `1px solid ${dp?.color}40`, background: `${dp?.color}09` }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: dp?.color, marginBottom: 4 }}>Dominant Dosha</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: dp?.color }}>{scanResult.dominantDosha}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{dp?.element}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.04)' }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>Nadi Activity</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#D4AF37' }}>{scanResult.activeNadis}<span style={{ fontSize: 10, opacity: 0.4 }}>/72k</span></div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{scanResult.timestamp}</div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Planetary Alignment</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{scanResult.planetaryAlignment}</div>
            </div>
            {scanResult.blockages.length > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.04)' }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#fb923c', marginBottom: 5 }}>Detected Blockages</div>
                {scanResult.blockages.map((b, i) => <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}><AlertCircle size={10} style={{ color: '#fb923c', flexShrink: 0 }} />{b}</div>)}
              </div>
            )}
            <div style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.03)' }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#22D3EE', marginBottom: 5 }}>Scalar Prescription</div>
              {scanResult.remedies.map((r, i) => <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}><CheckCircle2 size={10} style={{ color: '#22D3EE', flexShrink: 0 }} />{r}</div>)}
            </div>
            <button onClick={runScan} style={{ padding: 10, borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer' }}>Re-Scan Field</button>
          </div>
        )}
      </div>

      {/* SQI Chat */}
      <div style={G}>
        <div style={SL}><MessageSquare size={12} style={{ color: '#a78bfa' }} />SQI Intelligence — Ask the Akasha-Archive</div>
        <div style={{ height: 210, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, paddingRight: 4 }}>
          {messages.length === 0 && <div style={{ textAlign: 'center', padding: '32px 12px', color: 'rgba(255,255,255,0.18)', fontSize: 10, lineHeight: 1.8 }}>Run a Nadi Scan to activate SQI,<br />or ask about scalar frequencies.</div>}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '88%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.role === 'user' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                {m.role === 'model' && <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.35em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 5 }}>⟁ SQI · Akasha-Neural Archive</div>}
                {renderChat(m.text)}
                {m.role === 'model' && isTyping && i === messages.length - 1 && !m.text && (
                  <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>{[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', animation: `sqmBlink 1s ${j*0.2}s ease-in-out infinite` }} />)}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Ask SQI about your scalar field…" disabled={isTyping}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: 11, outline: 'none', fontFamily: 'Montserrat,sans-serif' }} />
          <button onClick={sendMessage} disabled={!input.trim() || isTyping}
            style={{ width: 40, height: 40, borderRadius: 14, border: 'none', background: input.trim() && !isTyping ? 'linear-gradient(135deg,#D4AF37,#b8942a)' : 'rgba(255,255,255,0.05)', color: input.trim() && !isTyping ? '#050505' : 'rgba(255,255,255,0.2)', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ════════════════════════════════════════════════════════════════
export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const engine = useSoulMeditateEngine();
  const offlineExport = useOfflineExport(engine);

  const [vizMode, setVizMode]             = useState<VisualizerMode>('bars');
  const [activeStyle, setActiveStyle]     = useState<MeditationStyle>('indian');
  const [healingFreq, setHealingFreq]     = useState(432);
  const [brainwaveFreq, setBrainwaveFreq] = useState(10);
  const [alchemyOn, setAlchemyOn]         = useState(false);
  const [volumes, setVolumes]             = useState({ ambient: 50, binaural: 40, healing: 20, user: 80 });
  const [exportResult, setExportResult]   = useState<any>(null);
  const [hasExport, setHasExport]         = useState(false);
  const [showPay, setShowPay]             = useState(false);
  const [payLoading, setPayLoading]       = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [tab, setTab]                     = useState<'alchemy' | 'scalar'>('alchemy');

  // ── SAFE ENGINE ACCESS: always use optional chaining + fallback ──
  // engine.atmosphereLayer and engine.neuralLayer may be undefined
  // on the very first render before the hook initializes them.
  const atmosphereLayer  = engine.atmosphereLayer  ?? { isPlaying: false, source: null };
  const neuralLayer      = engine.neuralLayer      ?? { isPlaying: false, source: null };
  const frequencies      = engine.frequencies      ?? { solfeggio: { enabled: false, hz: 432 }, binaural: { enabled: false, carrierHz: 200, beatHz: 10 } };
  const dsp              = engine.dsp              ?? null;

  const hVol = engine.solfeggioVolume ?? 0;
  const bVol = engine.binauralVolume  ?? 0;

  const isPlaying =
    neuralLayer.isPlaying ||
    atmosphereLayer.isPlaying ||
    frequencies.solfeggio?.enabled ||
    frequencies.binaural?.enabled;

  const handleInit = useCallback(async () => {
    await engine.initialize();
    const ctx = engine.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    toast.success('Siddha Engine awakened');
  }, [engine]);

  const doCommence = useCallback(async () => {
    try {
      if (!engine.isInitialized) await engine.initialize();
      const ctx = engine.getAudioContext?.();
      if (ctx?.state === 'suspended') await ctx.resume();
      await engine.loadAtmosphere(activeStyle);
      if (hVol > 0) { engine.updateSolfeggioVolume(hVol); await engine.startSolfeggio(healingFreq); }
      if (bVol > 0) { engine.updateBinauralVolume(bVol); await engine.startBinaural(200, brainwaveFreq); }
      setAlchemyOn(true);
      toast.success('Alchemy commenced — Anahata open');
    } catch { toast.error('Could not commence alchemy'); }
  }, [engine, activeStyle, healingFreq, brainwaveFreq, hVol, bVol]);

  const doStop = useCallback(() => { engine.stopAll?.(); setAlchemyOn(false); }, [engine]);
  const togglePlay = useCallback(() => { isPlaying ? doStop() : doCommence(); }, [isPlaying, doStop, doCommence]);

  const handleHealVol = useCallback(async (v: number) => {
    if (!engine.isInitialized) await engine.initialize();
    const ctx = engine.getAudioContext?.(); if (ctx?.state === 'suspended') await ctx.resume();
    engine.updateSolfeggioVolume(v);
    if (!frequencies.solfeggio?.enabled) await engine.startSolfeggio(healingFreq);
  }, [engine, healingFreq, frequencies]);

  const handleBrainVol = useCallback(async (v: number) => {
    if (!engine.isInitialized) await engine.initialize();
    const ctx = engine.getAudioContext?.(); if (ctx?.state === 'suspended') await ctx.resume();
    engine.updateBinauralVolume(v);
    if (!frequencies.binaural?.enabled) await engine.startBinaural(200, brainwaveFreq);
  }, [engine, brainwaveFreq, frequencies]);

  const handleHealFreq = useCallback(async (f: number) => {
    setHealingFreq(f);
    if (!engine.isInitialized) await engine.initialize();
    const ctx = engine.getAudioContext?.(); if (ctx?.state === 'suspended') await ctx.resume();
    if (alchemyOn) { engine.updateSolfeggioVolume(hVol); await engine.startSolfeggio(f); }
  }, [engine, hVol, alchemyOn]);

  const handleBrainFreq = useCallback(async (f: number) => {
    setBrainwaveFreq(f);
    if (!engine.isInitialized) await engine.initialize();
    const ctx = engine.getAudioContext?.(); if (ctx?.state === 'suspended') await ctx.resume();
    if (alchemyOn) { engine.updateBinauralVolume(bVol); await engine.startBinaural(200, f); }
  }, [engine, bVol, alchemyOn]);

  const handleExport = useCallback(async () => {
    if (!engine.isInitialized) { toast.error('Please initialize the engine first'); return; }
    if (!hasExport) { if (!user) { toast.info('Please sign in'); navigate('/auth'); return; } setShowPay(true); return; }
    await offlineExport.startExport?.();
  }, [engine, hasExport, user, navigate, offlineExport]);

  const handlePay = useCallback(async () => {
    if (!user) { navigate('/auth'); return; }
    setPayLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-audio-checkout', { body: { option: 'per_track' } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch { toast.error('Checkout failed'); setPayLoading(false); }
  }, [user, navigate]);

  const handleRefresh = useCallback(async (s: MeditationStyle) => {
    if (!engine.isInitialized) return;
    setRefreshing(true);
    try {
      const r: any = await engine.loadAtmosphere(s);
      toast.success(r?.ok ? (r?.fallbackFrom ? 'Loaded from Indian instead.' : 'Loaded new sacred sound') : 'Could not load');
    } finally { setRefreshing(false); }
  }, [engine]);

  useEffect(() => {
    async function check() {
      if (!user || adminLoading) return;
      try {
        if (isAdmin) { setHasExport(true); return; }
        if (searchParams.get('payment') === 'success') { setHasExport(true); return; }
        const { data: g } = await supabase.from('user_granted_access').select('access_type').eq('user_id', user.id).in('access_type', ['creative_soul', 'creative_soul_meditation']);
        const { data: e } = await supabase.from('user_entitlements').select('access_type').eq('user_id', user.id);
        setHasExport((e?.some((x: any) => ['creative_soul', 'creative_soul_meditation'].includes(x.access_type))) || !!(g && g.length > 0));
      } catch { setHasExport(false); }
    }
    check();
  }, [user, isAdmin, adminLoading, searchParams]);

  useEffect(() => {
    if (engine.isInitialized) {
      engine.loadAtmosphere(activeStyle).then((r: any) => {
        if (r?.ok && r?.fallbackFrom) toast.info('Loaded from Indian instead.');
      });
    }
  }, [activeStyle, engine.isInitialized]);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800;900&family=Cinzel:wght@400;700&display=swap');
    @keyframes sqmFloat{0%{transform:translateY(0)scale(1);opacity:0}10%{opacity:1}90%{opacity:.3}100%{transform:translateY(-90px)scale(.4);opacity:0}}
    @keyframes sqmBlink{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}
    @keyframes sqmPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.35)}}
    *{box-sizing:border-box}
    .sqm-root{min-height:100vh;background:#050505;font-family:'Montserrat',sans-serif;color:rgba(255,255,255,.9);position:relative;overflow-x:hidden}
    .sqm-root::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(212,175,55,.04) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 80% 80%,rgba(139,92,246,.04) 0%,transparent 60%);pointer-events:none;z-index:0}
    .sqm-inner{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:0 16px 100px}
    .sqm-tab-on{border-color:rgba(212,175,55,.5)!important;color:#D4AF37!important;background:rgba(212,175,55,.08)!important}
    .sqm-dsp-wrap [data-effect="sacred-echo"],.sqm-dsp-wrap .sacred-echo-row,.sqm-dsp-wrap [class*="echo"]:not([class*="reverb"]){display:none!important}
    @media(max-width:680px){.sqm-two-col{grid-template-columns:1fr!important}}
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sqm-root">
        <AkashaParticles />
        <div className="sqm-inner">

          {/* TOP BAR */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0 0', gap:12 }}>
            <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:20, padding:'8px 16px', fontSize:11, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', cursor:'pointer' }}>
              <ArrowLeft size={12} /> Back
            </button>
            <button onClick={handleInit} style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#D4AF37,#b8942a)', border:'none', borderRadius:24, padding:'10px 22px', fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#050505', cursor:'pointer', boxShadow:'0 0 22px rgba(212,175,55,.3)' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#050505', animation:'sqmPulse 1.5s ease-in-out infinite', display:'block' }} /> Awaken
            </button>
          </div>

          {/* TITLE */}
          <div style={{ padding:'24px 0 16px', textAlign:'center' }}>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:'clamp(22px,4vw,34px)', fontWeight:700, color:'#D4AF37', textShadow:'0 0 40px rgba(212,175,55,.4),0 0 80px rgba(212,175,55,.15)', letterSpacing:'0.08em', marginBottom:6 }}>Siddha Sound Alchemy</div>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.55em', textTransform:'uppercase', color:'rgba(255,255,255,.22)' }}>SQI 2050 · Bhakti-Algorithm v7.3 · Scalar Wave Technology Active</div>
          </div>

          {/* PREMA-PULSE STRIP */}
          {isPlaying && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'rgba(34,211,238,.03)', border:'1px solid rgba(34,211,238,.12)', borderRadius:20, padding:'12px 20px', marginBottom:20, flexWrap:'wrap' }}>
              <span style={{ fontSize:7, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'#22D3EE' }}>● Prema-Pulse Transmitting</span>
              <div style={{ display:'flex', gap:5 }}>{[0,1,2].map(i => <div key={i} style={{ width:4, height:4, borderRadius:'50%', background:'#22D3EE', animation:`sqmBlink 1.2s ${i*0.2}s ease-in-out infinite` }} />)}</div>
              <span style={{ fontSize:8, color:'rgba(34,211,238,.45)', letterSpacing:'0.1em' }}>Anahata open · {healingFreq}Hz · Scalar field broadcasting</span>
            </div>
          )}

          {/* VISUALIZER */}
          <div style={{ ...G, marginBottom:20, padding:'16px 20px 12px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(212,175,55,.7)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#D4AF37' }} />Sacred Visualizer<span style={{ fontSize:7, color:'rgba(255,255,255,.2)' }}>2048 FFT</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {(['bars','wave','radial'] as VisualizerMode[]).map(m => (
                  <button key={m} onClick={() => setVizMode(m)} style={{ fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', padding:'5px 12px', borderRadius:12, border:`1px solid ${vizMode===m ? 'rgba(212,175,55,.4)' : 'rgba(255,255,255,.06)'}`, background:vizMode===m ? 'rgba(212,175,55,.08)' : 'transparent', color:vizMode===m ? '#D4AF37' : 'rgba(255,255,255,.3)', cursor:'pointer' }}>
                    {m.charAt(0).toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <SpectralVisualizer engine={engine} mode={vizMode} height={140} />
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:22, flexWrap:'wrap' }}>
            <button onClick={togglePlay} disabled={!engine.isInitialized} style={{ display:'flex', alignItems:'center', gap:10, border:'none', borderRadius:40, padding:'14px 36px', fontSize:12, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase', cursor:engine.isInitialized ? 'pointer' : 'not-allowed', opacity:engine.isInitialized ? 1 : 0.4, background:isPlaying ? 'linear-gradient(135deg,#dc2626,#ea580c)' : 'linear-gradient(135deg,#D4AF37,#b8942a)', color:isPlaying ? 'white' : '#050505', boxShadow:isPlaying ? '0 0 25px rgba(220,38,38,.4)' : '0 0 25px rgba(212,175,55,.35)', transition:'all .25s' }}>
              {isPlaying ? <><Pause size={16} /> Cease Alchemy</> : <><Play size={16} /> Commence Alchemy</>}
            </button>
            <button onClick={handleExport} disabled={!engine.isInitialized || !!offlineExport.progress?.isExporting} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(212,175,55,.06)', border:'1px solid rgba(212,175,55,.2)', borderRadius:40, padding:'14px 28px', fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(212,175,55,.7)', cursor:'pointer', opacity:(engine.isInitialized && !offlineExport.progress?.isExporting) ? 1 : 0.35, transition:'all .2s' }}>
              {offlineExport.progress?.isExporting ? <><Loader2 size={14} /> Exporting…</> : <><Zap size={14} /> Export Master</>}
            </button>
          </div>

          {/* EXPORT PROGRESS */}
          {(offlineExport.progress?.isExporting || exportResult) && (
            <div style={{ ...G, marginBottom:18, padding:'14px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {exportResult ? <CheckCircle2 size={14} style={{ color:'#34d399' }} /> : <Loader2 size={14} style={{ color:'#D4AF37' }} />}
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(212,175,55,.8)' }}>{exportResult ? 'Export Complete' : 'Rendering Sacred Master…'}</span>
                </div>
                {exportResult && <a href={exportResult.url} download={`siddha-alchemy.${exportResult.format}`} style={{ fontSize:9, fontWeight:800, color:'#D4AF37', textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}><Download size={12} /> Download</a>}
              </div>
              {offlineExport.progress?.isExporting && <Progress value={(offlineExport.progress.progress ?? 0) * 100} className="h-1" />}
            </div>
          )}

          {/* TAB SWITCHER */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
            {[
              { id:'alchemy', icon:'🎵', label:'Sound Alchemy',    sub:'Source · Style · Frequencies · DSP' },
              { id:'scalar',  icon:'⟁',  label:'Scalar Wave Tech', sub:'Nadi Scan · Resonators · SQI Chat'  },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)} className={tab===t.id ? 'sqm-tab-on' : ''} style={{ padding:'14px 18px', borderRadius:20, border:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.02)', cursor:'pointer', textAlign:'left', color:'rgba(255,255,255,.4)', transition:'all .2s' }}>
                <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.04em', marginBottom:3 }}>{t.icon} {t.label}</div>
                <div style={{ fontSize:8, letterSpacing:'0.2em', textTransform:'uppercase', opacity:0.55 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {/* ══ ALCHEMY TAB ══ */}
          {tab === 'alchemy' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Step 1 — Source */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>{STEP('1')}<span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,.7)' }}>Source</span></div>
                <div style={G}><NeuralSourceInput engine={engine} /></div>
              </div>

              {/* Step 2 — Atmosphere */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>{STEP('2')}<span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,.7)' }}>Atmosphere</span></div>
                <div style={G}>
                  <div style={SL}><Layers size={12} />Meditation Style & Atmosphere</div>
                  <StyleGrid activeStyle={activeStyle} onStyleChange={setActiveStyle} engine={engine} onRefreshSound={handleRefresh} isRefreshing={refreshing} volumes={volumes} onVolumeChange={(k, v) => setVolumes(p => ({ ...p, [k]: v }))} />
                </div>
              </div>

              {/* Steps 2b + 3 */}
              <div className="sqm-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                    {STEP('2b')}
                    <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,.7)' }}>Sacred Frequencies</span>
                    <span style={{ fontSize:7, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(212,175,55,.5)', border:'1px solid rgba(212,175,55,.2)', borderRadius:10, padding:'2px 8px' }}>Activate on Commence</span>
                  </div>
                  <div style={G}>
                    <HealingFrequencySelector activeFrequency={healingFreq} volume={hVol} onSelect={handleHealFreq} onVolumeChange={handleHealVol} />
                    <div style={{ marginTop:16 }}>
                      <BrainwaveSelector activeFrequency={brainwaveFreq} volume={bVol} onSelect={handleBrainFreq} onVolumeChange={handleBrainVol} />
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>{STEP('3')}<span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,.7)' }}>Refinement</span></div>
                  <div style={G}>
                    <div style={SL}><Waves size={12} />Sacred Effects</div>
                    {/* Sacred Echo hidden via CSS */}
                    <div className="sqm-dsp-wrap">
                      <DSPMasteringRack dsp={dsp} onUpdate={engine.updateDSP} />
                    </div>
                    <div style={{ marginTop:18 }}>
                      <div style={SL}><Sparkles size={12} />Alchemical Insight</div>
                      {/* ── FIX: use safe local variables, never access engine.x.source directly ── */}
                      <SpectralInsights
                        frequencies={frequencies}
                        dsp={dsp}
                        atmosphereId={atmosphereLayer.source ?? null}
                        neuralSource={neuralLayer.source ?? null}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ SCALAR TAB ══ */}
          {tab === 'scalar' && (
            <ScalarWavePanel
              engine={engine}
              activeStyle={activeStyle}
              healingFreq={healingFreq}
              isPlaying={!!isPlaying}
              userId={user?.id}
            />
          )}

          <div style={{ height:80 }} />
        </div>
      </div>

      {/* PAYMENT DIALOG */}
      <Dialog open={showPay} onOpenChange={setShowPay}>
        <DialogContent style={{ background:'#0B0B0B', border:'1px solid rgba(212,175,55,.2)', borderRadius:24, color:'rgba(255,255,255,.9)', fontFamily:'Montserrat,sans-serif' }}>
          <DialogHeader>
            <DialogTitle style={{ color:'#D4AF37', fontFamily:'Cinzel,serif', letterSpacing:'0.05em' }}>Download Sacred Master</DialogTitle>
            <DialogDescription style={{ color:'rgba(255,255,255,.5)', fontSize:13 }}>Create and preview your alchemy for free. Pay €9.99 once to download your master file.</DialogDescription>
          </DialogHeader>
          <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'8px 0' }}>
            {['One sacred master export','All atmospheres available','All healing frequencies','Binaural layer included','Scalar Wave overlay embedded'].map(item => (
              <div key={item} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,.6)' }}>
                <CheckCircle2 size={14} style={{ color:'#D4AF37', flexShrink:0 }} /> {item}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, paddingTop:8 }}>
            <button onClick={handlePay} disabled={payLoading} style={{ flex:1, background:'linear-gradient(135deg,#D4AF37,#b8942a)', border:'none', borderRadius:20, padding:'12px 20px', fontWeight:800, fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#050505', cursor:'pointer' }}>
              {payLoading ? 'Loading…' : 'Pay €9.99 · Download'}
            </button>
            <button onClick={() => setShowPay(false)} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:20, padding:'12px 16px', color:'rgba(255,255,255,.4)', cursor:'pointer' }}>
              <X size={14} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
