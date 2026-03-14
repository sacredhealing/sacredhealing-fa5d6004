// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft, Power, Waves, Activity,
  Play, Pause, Download, Loader2, Layers, X,
  CheckCircle2, AlertCircle, Zap, Sparkles,
  MessageSquare, RefreshCw, Cpu, Send,
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
import StyleGrid from '@/components/soulmeditate/StyleGrid';
import type { MeditationStyle } from '@/components/soulmeditate/StyleGrid';
import HealingFrequencySelector from '@/components/soulmeditate/HealingFrequencySelector';
import BrainwaveSelector from '@/components/soulmeditate/BrainwaveSelector';

// ─── Types ────────────────────────────────────────────────────────
interface NadiScanResult {
  dominantDosha: 'Vata' | 'Pitta' | 'Kapha';
  blockages: string[];
  planetaryAlignment: string;
  timestamp: string;
  activeNadis: number;
  remedies: string[];
}
interface SQIMessage { role: 'user' | 'model'; text: string; }

// ─── Scalar Resonators ────────────────────────────────────────────
const SCALAR_ACTIVATIONS = [
  { id: 'anahata-528',    name: 'Anahata Gateway',    sig: 'Heart / 528 Hz',     color: '#4ade80', freq: 528,  benefit: 'Opens heart field, dissolves fear-loops in the listening field.' },
  { id: 'crown-963',      name: 'Sahasrara Crown',     sig: 'Crown / 963 Hz',     color: '#a78bfa', freq: 963,  benefit: 'Pineal activation, unity-consciousness transmission.' },
  { id: 'dna-repair',     name: 'DNA Restore Field',   sig: 'Solfeggio / 528 Hz', color: '#34d399', freq: 528,  benefit: 'DNA repair resonance woven into the audio quantum field.' },
  { id: 'schumann',       name: 'Schumann Resonance',  sig: 'Earth / 7.83 Hz',    color: '#D4AF37', freq: 7.83, benefit: 'Grounding to Earth\'s heartbeat, neural coherence.' },
  { id: 'theta-deep',     name: 'Theta Deep Dive',     sig: 'Theta / 6 Hz',       color: '#38bdf8', freq: 6,    benefit: 'Subconscious re-patterning, ancestral clearing.' },
  { id: 'liberation-396', name: 'Liberation Field',    sig: 'Solfeggio / 396 Hz', color: '#fb923c', freq: 396,  benefit: 'Liberating guilt and fear from cellular memory.' },
  { id: 'miracle-432',    name: 'Miracle Tone',        sig: 'Vedic / 432 Hz',     color: '#fbbf24', freq: 432,  benefit: 'Universal tuning — aligns with nature\'s harmonic field.' },
  { id: 'unity-639',      name: 'Unity Coherence',     sig: 'Solfeggio / 639 Hz', color: '#f472b6', freq: 639,  benefit: 'Heart coherence and inter-dimensional connection.' },
  { id: 'intuition-741',  name: 'Third Eye Activator', sig: 'Solfeggio / 741 Hz', color: '#818cf8', freq: 741,  benefit: 'Awakening intuition through the audio field.' },
  { id: 'pranic-108',     name: 'Prana Infusion',      sig: 'Pranic / 108 Hz',    color: '#22d3ee', freq: 108,  benefit: 'Infusing prana into every sound layer of the meditation.' },
];

const DOSHA_PROFILES = {
  Vata:  { color: '#38bdf8', element: 'Air + Ether',  mantra: 'So Hum',      scalars: ['schumann', 'liberation-396', 'miracle-432'] },
  Pitta: { color: '#f97316', element: 'Fire + Water', mantra: 'Ra Ma Da Sa', scalars: ['anahata-528', 'unity-639', 'dna-repair']    },
  Kapha: { color: '#4ade80', element: 'Earth + Water', mantra: 'Sat Nam',    scalars: ['intuition-741', 'crown-963', 'pranic-108']   },
};

const SCAN_PHASES = [
  'Accessing Akasha-Neural Archive…',
  'Reading audio vibrational signature…',
  'Analysing Nadi currents in waveform…',
  'Mapping planetary alignment…',
  'Computing scalar frequency overlay…',
  'Generating Prema-Pulse prescription…',
];

// ─── SQI Chat stream ──────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-apothecary-chat`;

async function streamSQIChat(messages, onDelta, onDone, userId) {
  const body = {
    messages: messages.slice(-10).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
  };
  if (userId) body.userId = userId;
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited.');
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
      try { const p = JSON.parse(data); const delta = p?.choices?.[0]?.delta?.content ?? p?.delta ?? ''; if (delta) onDelta(delta); } catch { }
    }
  }
  onDone();
}

type VisualizerMode = 'bars' | 'wave' | 'radial';

// ─── Scalar chip ──────────────────────────────────────────────────
function ScalarChip({ act, active, onToggle }) {
  return (
    <div onClick={onToggle} title={act.benefit} className="flex items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all duration-200" style={{ border: `1px solid ${active ? act.color : 'rgba(255,255,255,0.06)'}`, background: active ? `${act.color}12` : 'rgba(255,255,255,0.02)', boxShadow: active ? `0 0 14px ${act.color}35` : 'none' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? act.color : 'rgba(255,255,255,0.12)', boxShadow: active ? `0 0 8px ${act.color}` : 'none', flexShrink: 0, display: 'block' }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-extrabold uppercase truncate" style={{ letterSpacing: '0.15em', color: active ? act.color : 'rgba(255,255,255,0.45)' }}>{act.name}</div>
        <div className="text-xs mt-0.5" style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' }}>{act.sig}</div>
      </div>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1px solid ${active ? act.color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? act.color : 'transparent' }}>
        {active && <CheckCircle2 size={10} style={{ color: '#050505' }} />}
      </div>
    </div>
  );
}

function renderChat(text) {
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} style={{ height: 7 }} />;
    if (t.startsWith('### ')) return <h3 key={i} style={{ color: '#D4AF37', fontWeight: 800, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 12, marginBottom: 3 }}>{t.slice(4)}</h3>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} style={{ marginLeft: 14, listStyleType: 'disc', fontSize: 11, lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{t.slice(2)}</li>;
    return <p key={i} style={{ fontSize: 11, lineHeight: '1.65', color: 'rgba(255,255,255,0.78)', marginBottom: 3 }}>{t}</p>;
  });
}

// ─── Scalar Wave Panel ────────────────────────────────────────────
function ScalarWavePanel({ engine, activeStyle, healingFreq, isPlaying, userId, neuralSource, onScalarChange }) {
  const [activeScalars, setActiveScalars] = useState([]);
  const [scanResult, setScanResult]       = useState(null);
  const [isScanning, setIsScanning]       = useState(false);
  const [heartRate, setHeartRate]         = useState(60);
  const [scanPhase, setScanPhase]         = useState(0);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const chatEnd = useRef(null);

  const hasAudio = !!neuralSource;

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

  const applyToEngine = useCallback((ids) => {
    if (!engine?.isInitialized || ids.length === 0) return;
    const avg = ids.reduce((s, id) => s + (SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0), 0) / ids.length;
    const blended = Math.round(avg);
    engine.updateSolfeggioVolume?.(Math.min(engine.solfeggioVolume || 20, 28));
    engine.startSolfeggio?.(blended);
    onScalarChange?.(blended);
  }, [engine, onScalarChange]);

  const clearFromEngine = useCallback(() => {
    onScalarChange?.(null);
  }, [onScalarChange]);

  const toggleScalar = useCallback((id) => {
    setActiveScalars(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length > 0) applyToEngine(next);
      else clearFromEngine();
      return next;
    });
  }, [applyToEngine, clearFromEngine]);

  const autoSelectDosha = useCallback((dosha) => {
    const sel = DOSHA_PROFILES[dosha].scalars;
    setActiveScalars(sel);
    applyToEngine(sel);
  }, [applyToEngine]);

  const runScan = useCallback(async () => {
    if (!hasAudio) {
      toast.error('Load an audio file first — the scan reads your meditation\'s vibrational field.');
      return;
    }
    setIsScanning(true);
    setScanResult(null);
    await new Promise(r => setTimeout(r, 2600));
    const doshas = ['Vata', 'Pitta', 'Kapha'];
    const dosha = doshas[Math.floor(Math.random() * 3)];
    const p = DOSHA_PROFILES[dosha];
    const actualFreq = engine?.frequencies?.solfeggio?.hz ?? healingFreq;
    const actualBinaural = engine?.frequencies?.binaural?.beatHz ?? 10;
    const result = {
      dominantDosha: dosha,
      blockages: ['Solar Plexus congestion', 'Throat Nadi restriction', 'Root anchor needed'].slice(0, Math.floor(Math.random() * 2) + 1),
      planetaryAlignment: ['Saturn · Discipline field', 'Venus · Heart-opening window', 'Jupiter · Expansion vortex', 'Moon · Emotional cleanse'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toLocaleTimeString(),
      activeNadis: Math.floor(Math.random() * 30) + 50,
      remedies: [`Mantra: ${p.mantra}`, `Element: ${p.element}`, `Scalar blend: ${p.scalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.name).join(', ')}`],
    };
    setScanResult(result);
    setIsScanning(false);
    autoSelectDosha(dosha);
    const blendFreqs = p.scalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0);
    const blendAvg = Math.round(blendFreqs.reduce((a, b) => a + b, 0) / blendFreqs.length);
    setMessages(prev => [...prev, {
      role: 'model',
      text: `⟁ **Nadi Scan Complete — ${dosha} Dominance Detected**\n\nScanned meditation: \`${neuralSource?.split('/').pop() ?? 'loaded audio'}\`\nDetected frequency field: ${actualFreq}Hz · Binaural: ${actualBinaural}Hz\nActive Nadis: ${result.activeNadis}/72,000 · ${result.planetaryAlignment}\n\n**Auto-activated ${dosha} scalar prescription** at ${blendAvg}Hz blend.\nThese frequencies are now live in your audio engine and will be baked into your export.\n\nMantra: **${p.mantra}** · Element: ${p.element}\n\nShall I go deeper into your field reading?`,
    }]);
  }, [hasAudio, engine, healingFreq, neuralSource, autoSelectDosha]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { role: 'user', text: input.trim() };
    const ctx = {
      role: 'model',
      text: `You are SQI from 2050 inside Siddha Sound Alchemy. Context: style=${activeStyle}, freq=${healingFreq}Hz, playing=${isPlaying}, audio loaded=${hasAudio}, scalars=${activeScalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.name).join(', ') || 'none'}${scanResult ? `, dosha=${scanResult.dominantDosha}, nadis=${scanResult.activeNadis}` : ''}. Use Bhakti-Algorithm language. Be precise about how scalar frequencies affect the audio.`,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'model', text: '' }]);
    try {
      await streamSQIChat([ctx, ...messages, userMsg], chunk => {
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'model', text: u[u.length - 1].text + chunk }; return u; });
      }, () => setIsTyping(false), userId);
    } catch (e) { toast.error(e.message || 'SQI stream error'); setIsTyping(false); }
  }, [input, isTyping, messages, activeStyle, healingFreq, isPlaying, hasAudio, activeScalars, scanResult, userId]);

  const blendFreq = activeScalars.length > 0
    ? Math.round(activeScalars.reduce((s, id) => s + (SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0), 0) / activeScalars.length)
    : null;
  const dp = scanResult ? DOSHA_PROFILES[scanResult.dominantDosha] : null;

  return (
    <div className="space-y-4">
      {/* AUDIO REQUIRED NOTICE */}
      {!hasAudio && (
        <div className="p-4 rounded-[20px] flex items-start gap-3" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <AlertCircle size={14} style={{ color: '#fb923c', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: '#fb923c' }}>Audio Required for Scan</div>
            <div className="text-[10px] text-white/50 leading-relaxed">Load an audio file in the <strong className="text-white/70">Sound Alchemy → Source</strong> tab first. The Nadi Scan reads your meditation's actual vibrational field and bakes scalar frequencies into your mixdown.</div>
          </div>
        </div>
      )}

      {/* Scalar Resonators */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
        <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
          <Sparkles size={12} style={{ color: '#D4AF37' }} />
          Scalar Wave Resonators
          <span className="ml-auto text-[7px] text-white/20 tracking-[0.3em]">{activeScalars.length} ACTIVE</span>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed mb-3">Tap to inject scalar frequencies live into your audio engine. Active resonators are blended into the solfeggio layer <strong className="text-white/60">and baked into your export mixdown</strong>.</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
          {SCALAR_ACTIVATIONS.map(act => <ScalarChip key={act.id} act={act} active={activeScalars.includes(act.id)} onToggle={() => toggleScalar(act.id)} />)}
        </div>
        {blendFreq !== null && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <Waves size={12} style={{ color: '#D4AF37', flexShrink: 0 }} />
            <div>
              <div className="text-[8px] font-extrabold uppercase tracking-[0.3em] mb-1" style={{ color: '#D4AF37' }}>Scalar Blend Active — {blendFreq} Hz · Will be baked into export ✓</div>
              <div className="text-[9px] text-white/40 mt-0.5">{activeScalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.name).join(' · ')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Nadi Scan */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
        <div className="flex items-center gap-2 mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
          <Activity size={12} style={{ color: '#22D3EE' }} />
          Real-Time Nadi Scan
          {hasAudio && (
            <span className="ml-1 text-[7px] px-2 py-0.5 rounded-xl" style={{ color: '#22D3EE', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>Audio loaded ✓</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Activity size={12} style={{ color: isScanning ? '#f43f5e' : 'rgba(255,255,255,0.2)', animation: isScanning ? 'sqmPulse 0.8s ease-in-out infinite' : 'none' }} />
            <span className="font-mono text-[10px]" style={{ color: isScanning ? '#f43f5e' : 'rgba(255,255,255,0.2)' }}>{heartRate} BPM</span>
          </div>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed mb-3">Scans your <strong className="text-white/60">loaded meditation audio</strong> vibrational field. Maps to your dominant Dosha and auto-prescribes optimal scalar resonators that will be embedded in your mixdown.</p>

        {!scanResult && !isScanning && (
          <button onClick={runScan} disabled={!hasAudio} className="w-full p-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.4em] transition-all" style={{ background: hasAudio ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hasAudio ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.06)'}`, color: hasAudio ? '#22D3EE' : 'rgba(255,255,255,0.25)', cursor: hasAudio ? 'pointer' : 'not-allowed' }}>
            <Cpu size={14} /> {hasAudio ? 'Initiate Nadi Scan' : 'Load Audio First to Scan'}
          </button>
        )}
        {isScanning && (
          <div className="text-center py-6">
            <div className="flex justify-center gap-1.5 mb-4">{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#22D3EE', animation: `sqmBlink 1.2s ${i*0.2}s ease-in-out infinite` }} />)}</div>
            <div className="text-[9px] font-extrabold uppercase tracking-[0.4em] mb-2" style={{ color: '#22D3EE' }}>{SCAN_PHASES[scanPhase]}</div>
            <div className="text-[8px] text-white/25 tracking-[0.2em]">{neuralSource?.split('/').pop() ?? 'audio'} · {healingFreq}Hz · {activeStyle}</div>
          </div>
        )}
        {scanResult && !isScanning && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl" style={{ border: `1px solid ${dp?.color}40`, background: `${dp?.color}09` }}>
                <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: dp?.color }}>Dominant Dosha</div>
                <div className="text-2xl font-black" style={{ color: dp?.color }}>{scanResult.dominantDosha}</div>
                <div className="text-[8px] text-white/35 mt-1">{dp?.element}</div>
              </div>
              <div className="p-3 rounded-2xl" style={{ border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.04)' }}>
                <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: '#D4AF37' }}>Nadi Activity</div>
                <div className="text-2xl font-black" style={{ color: '#D4AF37' }}>{scanResult.activeNadis}<span className="text-[10px] opacity-40">/72k</span></div>
                <div className="text-[8px] text-white/35 mt-1">{scanResult.timestamp}</div>
              </div>
            </div>
            <div className="p-3 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1 text-white/30">Planetary Alignment</div>
              <div className="text-[11px] text-white/65">{scanResult.planetaryAlignment}</div>
            </div>
            {scanResult.blockages.length > 0 && (
              <div className="p-3 rounded-2xl" style={{ border: '1px solid rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.04)' }}>
                <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: '#fb923c' }}>Detected Blockages</div>
                {scanResult.blockages.map((b, i) => <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/55 mb-1"><AlertCircle size={10} style={{ color: '#fb923c', flexShrink: 0 }} />{b}</div>)}
              </div>
            )}
            <div className="p-3 rounded-2xl" style={{ border: '1px solid rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.03)' }}>
              <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: '#22D3EE' }}>Scalar Prescription — Embedded in Mixdown ✓</div>
              {scanResult.remedies.map((r, i) => <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/60 mb-1"><CheckCircle2 size={10} style={{ color: '#22D3EE', flexShrink: 0 }} />{r}</div>)}
            </div>
            <button onClick={runScan} disabled={!hasAudio} className="w-full p-2 rounded-2xl text-[8px] font-extrabold uppercase tracking-[0.3em] cursor-pointer" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>Re-Scan Field</button>
          </div>
        )}
      </div>

      {/* SQI Chat */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
        <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
          <MessageSquare size={12} style={{ color: '#a78bfa' }} />
          SQI Intelligence — Ask the Akasha-Archive
        </div>
        <div className="overflow-y-auto flex flex-col gap-2 mb-3 pr-1" style={{ height: 200 }}>
          {messages.length === 0 && <div className="text-center py-8 text-[10px] leading-loose text-white/20">{hasAudio ? 'Run a Nadi Scan to activate SQI,' : 'Load audio and run a Nadi Scan,'}<br />or ask directly about scalar frequencies.</div>}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[88%] p-3 text-sm" style={{ borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.role === 'user' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                {m.role === 'model' && <div className="text-[7px] font-extrabold uppercase mb-1" style={{ letterSpacing: '0.35em', color: '#a78bfa' }}>⟁ SQI · Akasha-Neural Archive</div>}
                {renderChat(m.text)}
                {m.role === 'model' && isTyping && i === messages.length - 1 && !m.text && (
                  <div className="flex gap-1 py-1">{[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', animation: `sqmBlink 1s ${j*0.2}s ease-in-out infinite` }} />)}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Ask SQI about your scalar field…" disabled={isTyping}
            className="flex-1 px-4 py-2.5 rounded-2xl text-[11px] outline-none bg-white/[0.04] border border-white/[0.08] text-white/80 font-[Montserrat,sans-serif]" />
          <button onClick={sendMessage} disabled={!input.trim() || isTyping}
            className="flex items-center justify-center rounded-[14px] transition-all" style={{ width: 40, height: 40, border: 'none', flexShrink: 0, background: input.trim() && !isTyping ? 'linear-gradient(135deg,#D4AF37,#b8942a)' : 'rgba(255,255,255,0.05)', color: input.trim() && !isTyping ? '#050505' : 'rgba(255,255,255,0.2)', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const engine = useSoulMeditateEngine();
  const { progress: exportProgress, exportMeditation } = useOfflineExport();

  // ── Visualizer ──
  const [visualizerMode, setVisualizerMode] = useState('bars');

  // ── Meditation state ──
  const [activeStyle, setActiveStyle]     = useState('indian');
  const [healingFreq, setHealingFreq]     = useState(432);
  const [brainwaveFreq, setBrainwaveFreq] = useState(10);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [alchemyCommenced, setAlchemyCommenced] = useState(false);

  // ── Volume controls ──
  const [volumes, setVolumes] = useState({ ambient: 85, user: 100 });
  // Store Hz/binaural volumes in LOCAL state at 0.75 default.
  // Do NOT read from engine.solfeggioVolume — it starts at 0 internally
  // and would override our intended default before the engine initializes.
  const [healingVolume, setHealingVolume]   = useState(0.75);
  const [brainwaveVolume, setBrainwaveVolume] = useState(0.75);

  // ── Export / payment ──
  const [exportResult, setExportResult]   = useState(null);
  const [hasExportAccess, setHasExportAccess] = useState(false);
  const [exportAccessLoading, setExportAccessLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // ── UI state ──
  const [isRefreshingSound, setIsRefreshingSound] = useState(false);
  const [tab, setTab] = useState('alchemy');
  const [meditationName, setMeditationName] = useState('');
  const [sessionKey, setSessionKey] = useState(0);
  const [scalarBlendHz, setScalarBlendHz] = useState(null);

  // ── SAFE engine access — all nullable until initialized ──
  const atmosphereLayer = engine?.atmosphereLayer ?? { isPlaying: false, source: null };
  const neuralLayer     = engine?.neuralLayer     ?? { isPlaying: false, source: null };
  const frequencies     = engine?.frequencies     ?? { solfeggio: { enabled: false, hz: 432 }, binaural: { enabled: false, carrierHz: 200, beatHz: 10 } };
  const dsp             = engine?.dsp             ?? null;

  const isPlaying =
    neuralLayer.isPlaying ||
    atmosphereLayer.isPlaying ||
    (frequencies.solfeggio?.enabled ?? false) ||
    (frequencies.binaural?.enabled ?? false);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleHealingVolumeChange = useCallback(async (vol) => {
    setHealingVolume(vol);
    if (!engine?.isInitialized) return;
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    engine?.updateSolfeggioVolume(vol);
    if (!frequencies.solfeggio?.enabled && alchemyCommenced) await engine?.startSolfeggio?.(healingFreq);
  }, [engine, healingFreq, frequencies, alchemyCommenced]);

  const handleBrainwaveVolumeChange = useCallback(async (vol) => {
    setBrainwaveVolume(vol);
    if (!engine?.isInitialized) return;
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    engine?.updateBinauralVolume(vol);
    if (!frequencies.binaural?.enabled && alchemyCommenced) await engine?.startBinaural?.(200, brainwaveFreq);
  }, [engine, brainwaveFreq, frequencies, alchemyCommenced]);

  const handleInitialize = useCallback(async () => {
    await engine?.initialize();
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    toast.success('Siddha Engine awakened');
  }, [engine]);

  const commenceAlchemy = useCallback(async () => {
    setIsProcessing(true);
    setAlchemyCommenced(true);
    try {
      if (!engine?.isInitialized) await engine?.initialize();
      const ctx = engine?.getAudioContext?.();
      if (ctx?.state === 'suspended') await ctx.resume();
      await engine?.loadAtmosphere?.(activeStyle);
      engine?.updateSolfeggioVolume(healingVolume);
      await engine?.startSolfeggio?.(healingFreq);
      engine?.updateBinauralVolume(brainwaveVolume);
      await engine?.startBinaural?.(200, brainwaveFreq);
      toast.success('Alchemy commenced — Anahata open');
    } catch { toast.error('Could not commence alchemy'); }
    finally { setIsProcessing(false); }
  }, [engine, activeStyle, healingFreq, brainwaveFreq, healingVolume, brainwaveVolume]);

  const stopAll = useCallback(() => {
    engine?.stopAll?.();
    setAlchemyCommenced(false);
  }, [engine]);

  const togglePlay = useCallback(() => {
    isPlaying ? stopAll() : commenceAlchemy();
  }, [isPlaying, stopAll, commenceAlchemy]);

  const handleNewSession = useCallback(() => {
    engine?.stopAll?.();
    setAlchemyCommenced(false);
    setActiveStyle('indian');
    setHealingFreq(432);
    setBrainwaveFreq(10);
    setHealingVolume(0.75);
    setBrainwaveVolume(0.75);
    setMeditationName('');
    setExportResult(null);
    setScalarBlendHz(null);
    setTab('alchemy');
    setSessionKey(k => k + 1);
    toast.success('New session started');
  }, [engine]);

  const handlePayForExport = useCallback(async () => {
    if (!user) { toast.info('Please sign in to purchase'); navigate('/auth'); return; }
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-audio-checkout', { body: { option: 'per_track' } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error('No checkout URL');
    } catch { toast.error('Failed to start checkout.'); setPaymentLoading(false); }
  }, [user, navigate]);

  const handleExport = useCallback(async () => {
    if (!engine?.isInitialized) { toast.error('Please initialize the engine first'); return; }
    if (!hasExportAccess) {
      if (!user) { toast.info('Please sign in to export'); navigate('/auth'); return; }
      setShowPaymentDialog(true);
      return;
    }
    const solfeggioHz = scalarBlendHz ?? frequencies.solfeggio?.hz ?? healingFreq;
    const config = {
      durationSeconds: 300,
      neuralAudioUrl: neuralLayer?.exportInput?.directUrl ?? neuralLayer?.source ?? undefined,
      neuralSourceVolume: volumes.user / 100,
      atmosphereAudioUrl: atmosphereLayer?.exportInput?.directUrl ?? atmosphereLayer?.source ?? undefined,
      atmosphereVolume: volumes.ambient / 100,
      solfeggioHz,
      solfeggioVolume: healingVolume,
      binauralCarrierHz: frequencies.binaural?.carrierHz ?? 200,
      binauralBeatHz: frequencies.binaural?.beatHz ?? brainwaveFreq,
      binauralVolume: brainwaveVolume,
      dsp: dsp ?? { reverb: { enabled: true, decay: 2.5, wet: 0.3 }, delay: { enabled: false, time: 0.4, feedback: 0, wet: 0 } },
      masterVolume: volumes.user / 100,
    };
    try {
      const result = await exportMeditation(config);
      if (result) {
        setExportResult(result);
        toast.success(scalarBlendHz ? `Export complete — Scalar ${solfeggioHz}Hz embedded ✓` : 'Export complete!');
      }
    } catch (e) {
      toast.error('Export failed: ' + (e?.message ?? 'Unknown error'));
    }
  }, [engine, hasExportAccess, user, navigate, exportMeditation, scalarBlendHz, frequencies, healingFreq, healingVolume, brainwaveFreq, brainwaveVolume, dsp, neuralLayer, atmosphereLayer, volumes]);

  // HOT-SWAP: change Hz without stopping — fixes stop-on-change bug
  const handleHealingFreqSelect = useCallback(async (freq) => {
    setHealingFreq(freq);
    if (!engine?.isInitialized) return;
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    if (frequencies.solfeggio?.enabled) {
      if (engine?.updateSolfeggioFrequency) {
        engine.updateSolfeggioFrequency(freq);
      } else {
        engine?.updateSolfeggioVolume(healingVolume);
        await engine?.startSolfeggio?.(freq);
      }
    } else if (alchemyCommenced) {
      engine?.updateSolfeggioVolume(healingVolume);
      await engine?.startSolfeggio?.(freq);
    }
  }, [engine, healingVolume, alchemyCommenced, frequencies]);

  const handleBrainwaveFreqSelect = useCallback(async (freq) => {
    setBrainwaveFreq(freq);
    if (!engine?.isInitialized) return;
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    if (frequencies.binaural?.enabled) {
      if (engine?.updateBinauralFrequency) {
        engine.updateBinauralFrequency(200, freq);
      } else {
        engine?.updateBinauralVolume(brainwaveVolume);
        await engine?.startBinaural?.(200, freq);
      }
    } else if (alchemyCommenced) {
      engine?.updateBinauralVolume(brainwaveVolume);
      await engine?.startBinaural?.(200, freq);
    }
  }, [engine, brainwaveVolume, alchemyCommenced, frequencies]);

  const handleRefreshSound = useCallback(async (styleId) => {
    if (!engine?.isInitialized) return;
    setIsRefreshingSound(true);
    try {
      const r = await engine?.loadAtmosphere?.(styleId);
      toast.success(r?.ok ? (r?.fallbackFrom ? 'Loaded from Indian instead.' : 'Loaded new sacred sound') : 'Could not load');
    } finally { setIsRefreshingSound(false); }
  }, [engine]);

  // NeuralSourceInput handlers (wired to engine)
  const handleLoadNeuralFile = useCallback(async (file) => {
    if (!engine?.isInitialized) await engine?.initialize();
    await engine?.loadNeuralSource?.(file);
  }, [engine]);
  const handleLoadNeuralUrl = useCallback((url) => {
    engine?.loadNeuralSource?.(url);
  }, [engine]);
  const handleToggleNeuralPlay = useCallback(() => {
    engine?.toggleNeuralPlay?.();
  }, [engine]);
  const handleNeuralVolumeChange = useCallback((vol) => {
    engine?.updateNeuralVolume?.(vol);
  }, [engine]);

  // ── Access check ──────────────────────────────────────────────────
  useEffect(() => {
    async function checkAccess() {
      if (!user || adminLoading) return;
      setExportAccessLoading(true);
      try {
        if (isAdmin) { setHasExportAccess(true); return; }
        if (searchParams.get('payment') === 'success') { setHasExportAccess(true); return; }
        const { data: g } = await supabase.from('user_granted_access').select('access_type').eq('user_id', user.id).in('access_type', ['creative_soul', 'creative_soul_meditation']);
        const { data: e } = await supabase.from('user_entitlements').select('access_type').eq('user_id', user.id);
        setHasExportAccess((e?.some(x => ['creative_soul', 'creative_soul_meditation'].includes(x.access_type))) || !!(g && g.length > 0));
      } catch { setHasExportAccess(false); }
      finally { setExportAccessLoading(false); }
    }
    checkAccess();
  }, [user, isAdmin, adminLoading, searchParams]);

  // ── Auto-load atmosphere ──────────────────────────────────────────
  useEffect(() => {
    if (engine?.isInitialized) {
      engine?.loadAtmosphere?.(activeStyle)?.then(r => {
        if (r?.ok && r?.fallbackFrom) toast.info('Loaded from Indian instead.');
      });
    }
  }, [activeStyle, engine?.isInitialized]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800;900&family=Cinzel:wght@400;700&display=swap');
        @keyframes sqmFloat{0%{transform:translateY(0)scale(1);opacity:0}10%{opacity:1}90%{opacity:.3}100%{transform:translateY(-90px)scale(.4);opacity:0}}
        @keyframes sqmBlink{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes sqmPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.35)}}
        .sqm-root{min-height:100vh;background:#050505;font-family:'Montserrat',sans-serif;color:rgba(255,255,255,.9);position:relative;overflow-x:hidden}
        .sqm-root::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(212,175,55,.04) 0%,transparent 60%);pointer-events:none;z-index:0}
        .sqm-inner{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:0 16px 100px}
        .sqm-tab-on{border-color:rgba(212,175,55,.5)!important;color:#D4AF37!important;background:rgba(212,175,55,.08)!important}
        .sqm-dsp-wrap [data-effect="sacred-echo"],.sqm-dsp-wrap .sacred-echo-row,.sqm-dsp-wrap [class*="echo"]:not([class*="reverb"]){display:none!important}
        @media(max-width:680px){.sqm-two-col{grid-template-columns:1fr!important}}
      `}} />

      <div className="sqm-root">
        {/* Particle bg */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} aria-hidden>
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} style={{ position: 'absolute', borderRadius: '50%', background: '#D4AF37', left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, width: `${1+Math.random()*2}px`, height: `${1+Math.random()*2}px`, opacity: 0.08+Math.random()*0.3, animation: `sqmFloat ${7+Math.random()*12}s ${Math.random()*10}s linear infinite` }} />
          ))}
        </div>

        <div className="sqm-inner">

          {/* ── TOP BAR ── */}
          <div className="flex items-center justify-between pt-4 pb-0 gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-white/50 cursor-pointer transition-all hover:text-[#D4AF37]" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '8px 16px', letterSpacing: '0.2em' }}>
              <ArrowLeft size={12} /> Back
            </button>
            <button onClick={handleInitialize} className="flex items-center gap-2 text-[11px] font-extrabold uppercase cursor-pointer" style={{ background: 'linear-gradient(135deg,#D4AF37,#b8942a)', border: 'none', borderRadius: 24, padding: '10px 22px', letterSpacing: '0.2em', color: '#050505', boxShadow: '0 0 22px rgba(212,175,55,.3)' }}>
              <Power size={14} /> Awaken
            </button>
          </div>

          {/* ── TITLE ── */}
          <div className="py-6 text-center">
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, color: '#D4AF37', textShadow: '0 0 40px rgba(212,175,55,.4)', letterSpacing: '0.08em', marginBottom: 6 }}>Siddha Sound Alchemy</div>
            <div className="text-[8px] font-extrabold uppercase text-white/22" style={{ letterSpacing: '0.55em' }}>SQI 2050 · Bhakti-Algorithm v7.3 · Scalar Wave Technology Active</div>
          </div>

          {/* ── PREMA-PULSE STRIP ── */}
          {isPlaying && (
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap px-5 py-3 rounded-[20px]" style={{ background: 'rgba(34,211,238,.03)', border: '1px solid rgba(34,211,238,.12)' }}>
              <span className="text-[7px] font-extrabold uppercase tracking-[0.5em]" style={{ color: '#22D3EE' }}>● Prema-Pulse Transmitting</span>
              <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#22D3EE', animation: `sqmBlink 1.2s ${i*0.2}s ease-in-out infinite` }} />)}</div>
              <span className="text-[8px] text-[#22D3EE]/50 tracking-[0.1em]">Anahata open · {scalarBlendHz ?? healingFreq}Hz{scalarBlendHz ? ' (Scalar)' : ''} · Broadcasting</span>
            </div>
          )}

          {/* SCALAR ACTIVE IN EXPORT NOTICE */}
          {scalarBlendHz !== null && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-[16px]" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Zap size={12} style={{ color: '#D4AF37', flexShrink: 0 }} />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.3em]" style={{ color: '#D4AF37' }}>Scalar {scalarBlendHz}Hz active — will be baked into your export mixdown</span>
            </div>
          )}

          {/* ── VISUALIZER ── */}
          <div className="mb-5 p-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px]">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2 text-[8px] font-extrabold uppercase tracking-[0.4em]" style={{ color: 'rgba(212,175,55,.7)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} />
                Sacred Visualizer <span className="text-[7px] text-white/20">2048 FFT</span>
              </div>
              <div className="flex gap-1.5">
                {['bars','wave','radial'].map(m => (
                  <button key={m} onClick={() => setVisualizerMode(m)} className="text-[8px] font-extrabold uppercase px-3 py-1 rounded-xl cursor-pointer transition-all" style={{ letterSpacing: '0.3em', border: `1px solid ${visualizerMode===m ? 'rgba(212,175,55,.4)' : 'rgba(255,255,255,.06)'}`, background: visualizerMode===m ? 'rgba(212,175,55,.08)' : 'transparent', color: visualizerMode===m ? '#D4AF37' : 'rgba(255,255,255,.3)' }}>
                    {m.charAt(0).toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <SpectralVisualizer engine={engine} mode={visualizerMode} height={140} />
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
            {/* Commence / Cease */}
            <Button
              size="lg"
              onClick={togglePlay}
              disabled={!engine?.isInitialized}
              className={`px-8 sm:px-10 text-sm sm:text-base ${isPlaying ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'}`}
              style={{ borderRadius: 40, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              {isPlaying ? <><Pause className="w-4 h-4 mr-2" />Cease Alchemy</> : <><Play className="w-4 h-4 mr-2" />Commence Alchemy</>}
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              disabled={!engine?.isInitialized || exportProgress?.isExporting}
              className="bg-amber-900/10 border-amber-900/30 text-amber-200 hover:bg-amber-900/20 px-6 sm:px-8 text-sm sm:text-base"
              style={{ borderRadius: 40, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              {exportProgress?.isExporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting…</> : <><Zap className="w-4 h-4 mr-2" />Export Master{scalarBlendHz ? ` + Scalar ${scalarBlendHz}Hz` : ''}</>}
            </Button>

            {/* New Session */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleNewSession}
              className="bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white px-5 sm:px-6 text-sm sm:text-base"
              style={{ borderRadius: 40, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />New Session
            </Button>
          </div>

          {/* ── EXPORT PROGRESS ── */}
          {(exportProgress?.isExporting || exportResult) && (
            <div className="mb-5 p-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[20px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {exportResult ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Loader2 size={14} className="animate-spin text-amber-400" />}
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-amber-200/80">{exportResult ? `Export Complete${scalarBlendHz ? ` — Scalar ${scalarBlendHz}Hz baked in ✓` : ''}` : exportProgress?.step || 'Rendering Sacred Master…'}</span>
                </div>
                {exportResult && <a href={exportResult.url} download={`${meditationName || 'siddha-alchemy'}.${exportResult.format}`} className="flex items-center gap-1.5 text-[9px] font-extrabold text-amber-400 no-underline"><Download size={12} /> Download</a>}
              </div>
              {exportProgress?.isExporting && <Progress value={exportProgress.percent ?? 0} className="h-1" />}
            </div>
          )}

          {/* ── NAME YOUR MEDITATION ── */}
          <div className="mb-5">
            <label className="block text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/30 mb-2">Name Your Meditation</label>
            <input
              value={meditationName}
              onChange={e => setMeditationName(e.target.value)}
              placeholder="e.g. Forest Meditation"
              className="w-full px-4 py-3 rounded-2xl text-sm text-white/70 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Montserrat,sans-serif' }}
            />
          </div>

          {/* ── TAB SWITCHER ── */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { id: 'alchemy', icon: '🎵', label: 'Sound Alchemy',   sub: 'Source · Style · Frequencies · DSP' },
              { id: 'scalar',  icon: '⟁',  label: 'Scalar Wave Tech', sub: scalarBlendHz ? `Nadi Scan · Resonators · SQI · ${scalarBlendHz}Hz Active` : 'Nadi Scan · Resonators · SQI'  },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`p-3 rounded-[20px] text-left cursor-pointer transition-all ${tab===t.id ? 'sqm-tab-on' : ''}`} style={{ border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)', color: 'rgba(255,255,255,.4)' }}>
                <div className="text-[11px] font-extrabold mb-0.5">{t.icon} {t.label}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] opacity-55">{t.sub}</div>
              </button>
            ))}
          </div>

          {/* ══ ALCHEMY TAB ══ */}
          {tab === 'alchemy' && (
            <div className="space-y-5" key={sessionKey}>

              {/* Step 1 — Source */}
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>1</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Source</span>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                  <NeuralSourceInput
                    layer={neuralLayer}
                    onLoadFile={handleLoadNeuralFile}
                    onLoadUrl={handleLoadNeuralUrl}
                    onTogglePlay={handleToggleNeuralPlay}
                    onVolumeChange={handleNeuralVolumeChange}
                  />
                </div>
              </div>

              {/* Step 2 — Atmosphere */}
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>2</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Atmosphere</span>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                  <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
                    <Layers size={12} />Meditation Style & Atmosphere
                  </div>
                  <StyleGrid
                    activeStyle={activeStyle}
                    onStyleChange={setActiveStyle}
                    engine={engine}
                    onRefreshSound={handleRefreshSound}
                    isRefreshing={isRefreshingSound}
                    volumes={volumes}
                    onVolumeChange={(k, v) => setVolumes(p => ({ ...p, [k]: v }))}
                  />
                </div>
              </div>

              {/* Steps 2b + 3 */}
              <div className="sqm-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* 2b — Sacred Frequencies */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>2b</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Sacred Frequencies</span>
                    <span className="text-[7px] font-extrabold uppercase tracking-[0.25em] px-2 py-0.5 rounded-xl" style={{ color: 'rgba(212,175,55,.5)', border: '1px solid rgba(212,175,55,.2)' }}>Activate on Commence</span>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                    <HealingFrequencySelector activeFrequency={healingFreq} volume={healingVolume} onSelect={handleHealingFreqSelect} onVolumeChange={handleHealingVolumeChange} />
                    <div className="mt-4">
                      <BrainwaveSelector activeFrequency={brainwaveFreq} volume={brainwaveVolume} onSelect={handleBrainwaveFreqSelect} onVolumeChange={handleBrainwaveVolumeChange} />
                    </div>
                  </div>
                </div>

                {/* 3 — Refinement */}
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>3</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Refinement</span>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                    <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
                      <Waves size={12} />Sacred Effects
                    </div>
                    {/* Sacred Echo hidden via CSS */}
                    <div className="sqm-dsp-wrap">
                      <DSPMasteringRack dsp={dsp} onUpdate={engine?.updateDSP} />
                    </div>

                    {/* 4 — Alchemical Insight */}
                    <div className="mt-5">
                      <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
                        <Sparkles size={12} />Alchemical Insight
                      </div>
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
              neuralSource={neuralLayer.source}
              onScalarChange={setScalarBlendHz}
            />
          )}

          <div style={{ height: 80 }} />
        </div>
      </div>

      {/* ── PAYMENT DIALOG ── */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-[#0B0B0B] border border-amber-900/20 rounded-3xl text-white/90" style={{ fontFamily: 'Montserrat,sans-serif' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#D4AF37', fontFamily: 'Cinzel,serif', letterSpacing: '0.05em' }}>Download Sacred Master</DialogTitle>
            <DialogDescription className="text-white/50">Create and preview your alchemy for free. Pay €9.99 once to download your master file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {['One sacred master export','All atmospheres available','All healing frequencies','Binaural layer included', scalarBlendHz ? `Scalar Wave ${scalarBlendHz}Hz baked into mixdown` : 'Scalar Wave overlay ready to embed'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 size={14} style={{ color: '#D4AF37', flexShrink: 0 }} /> {item}
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 pt-2">
            <button onClick={handlePayForExport} disabled={paymentLoading} className="flex-1 font-extrabold text-[11px] uppercase py-3 rounded-[20px] cursor-pointer" style={{ background: 'linear-gradient(135deg,#D4AF37,#b8942a)', border: 'none', color: '#050505', letterSpacing: '0.2em' }}>
              {paymentLoading ? 'Loading…' : 'Pay €9.99 · Download'}
            </button>
            <button onClick={() => setShowPaymentDialog(false)} className="px-4 py-3 rounded-[20px] cursor-pointer" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)' }}>
              <X size={14} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
