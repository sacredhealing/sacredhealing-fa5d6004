/**
 * SQI 2050 · Vajra-Sky-Breaker — SOVEREIGN ATMOSPHERIC CLEARANCE STATION
 * Akasha-Neural Archive v5.0 — VISUAL DNA FROM SKYBUSTER COMMAND MODULE
 *
 * Visual: Matches SkyBusterCommand.html exactly —
 *   Orbitron font · Cormorant Garamond · Radar map · Glowing quadrant cards
 *   Thermal slider · Broadcast log · Mission Complete button
 *
 * Real APIs: Scalar standing wave · Orgone torus · Shungite sub-bass
 *            Vibration · Sovereign location (no GPS) · Notifications
 *
 * All tier-gating logic preserved. Zero functional changes.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Shield, Sun, Wind, Layers, Activity, Compass,
  Cpu, Radio, Sparkles, ChevronRight,
  Eye, Atom, Flame, Droplets,
} from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Pillar {
  id: string;
  num: string;
  name: string;
  desc: string;
  statusOn: string;
  icon: string;
  energyType: 'scalar' | 'orgone' | 'shungite' | 'solfeggio';
  hz: number;
  color: string;
  glowColor: string;
  gradient: string;
}

interface Activation {
  id: string;
  name: string;
  description: string;
  protocol: string;
  hz: number;
  binauralHz: number;
  oscType: OscillatorType;
  vibePattern: number[];
  energyType: 'scalar' | 'orgone' | 'shungite' | 'solfeggio';
  Icon: LucideIcon;
  color: string;
  glowColor: string;
}

// ─── Four Pillars ──────────────────────────────────────────────────────────

const PILLARS: Pillar[] = [
  {
    id: 'anchor',
    num: '01',
    name: 'Earth Anchor',
    desc: 'Shilajit & Uva Ursi — Gravitational extraction. Pull atmospheric dross downward.',
    statusOn: 'Gravitational Extraction — Active',
    icon: '⬇',
    energyType: 'scalar',
    hz: 7.83,
    color: '#D4AF37',
    glowColor: 'rgba(212,175,55,0.5)',
    gradient: 'radial-gradient(circle at 50% 100%, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.08) 50%, transparent 70%)',
  },
  {
    id: 'sovereignty',
    num: '02',
    name: 'Crystalline Sovereignty',
    desc: 'Shungite & Valor — EMF-Zero Zone. Artificial clouds lose structural cohesion.',
    statusOn: 'Radius Secured · Cohesion Lost',
    icon: '⬡',
    energyType: 'shungite',
    hz: 432,
    color: '#22D3EE',
    glowColor: 'rgba(34,211,238,0.5)',
    gradient: 'radial-gradient(circle at 50% 100%, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0.07) 50%, transparent 70%)',
  },
  {
    id: 'ignition',
    num: '03',
    name: 'Solar Ignition',
    desc: 'Sativa Spark & San Pedro — Light-Fire thermal vaporisation. Sky → Transparent Gold.',
    statusOn: 'Light-Fire Engaged · Sky Igniting',
    icon: '☀',
    energyType: 'orgone',
    hz: 963,
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.5)',
    gradient: 'radial-gradient(circle at 50% 100%, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0.08) 50%, transparent 70%)',
  },
  {
    id: 'detox',
    num: '04',
    name: 'Shadow Detox',
    desc: 'Charcoal & Myrrh — Scours jet-trail soot & heavy metal particulates to earth.',
    statusOn: 'Transmutation In Progress',
    icon: '↓',
    energyType: 'scalar',
    hz: 528,
    color: '#94A3B8',
    glowColor: 'rgba(148,163,184,0.4)',
    gradient: 'radial-gradient(circle at 50% 100%, rgba(148,163,184,0.25) 0%, rgba(148,163,184,0.05) 50%, transparent 70%)',
  },
];

// ─── Sky Phases ────────────────────────────────────────────────────────────

const SKY_PHASES = [
  { label: 'Scalar Field Initialising',              pct: 0   },
  { label: 'Shungite Shield — EMF-Zero Zone Active', pct: 12  },
  { label: 'Orgone Torus Field Spinning',            pct: 25  },
  { label: 'Standing Wave Nodes Established',        pct: 38  },
  { label: 'Chemtrail Metal Grid Dissolving',        pct: 52  },
  { label: 'Atmospheric Antenna Array — Offline',    pct: 65  },
  { label: 'Solar Download Channel Opening',         pct: 78  },
  { label: 'Blue Hole Vortex Anchored',              pct: 90  },
  { label: '☀ Sun Restored — Channel Clear',        pct: 100 },
];

// ─── Activations ───────────────────────────────────────────────────────────

const ACTIVATIONS: Activation[] = [
  { id:'earth-anchor', name:'Earth Anchor', description:'Shilajit & Uva Ursi: Gravitational density pulls atmospheric dross to earth.', protocol:'SCALAR · 7.83 Hz standing wave. Phase-inverted twin oscillators create gravitational nodes.', hz:7.83, binauralHz:4, oscType:'sine', vibePattern:[100,50,100,50,400], energyType:'scalar', Icon:Layers, color:'#D4AF37', glowColor:'rgba(212,175,55,0.4)' },
  { id:'crystalline-sovereignty', name:'Crystalline Sovereignty', description:'Shungite C60: 10-mile EMF-Zero Zone. Artificial clouds lose structural cohesion.', protocol:'SHUNGITE · 40Hz sub-bass ground pulse + bandpass EMF absorption + 7.83Hz Schumann carrier.', hz:432, binauralHz:8, oscType:'sine', vibePattern:[200,100,200,100,200], energyType:'shungite', Icon:Shield, color:'#22D3EE', glowColor:'rgba(34,211,238,0.4)' },
  { id:'solar-ignition', name:'Solar Ignition', description:'San Pedro Resonance: Light-Fire thermal vaporisation. Sky becomes transparent gold.', protocol:'ORGONE · Torus rotation at 963 Hz. L-ear rises, R-ear descends — spinning solar field.', hz:963, binauralHz:12, oscType:'triangle', vibePattern:[50,30,50,30,50,30,300], energyType:'orgone', Icon:Sun, color:'#F59E0B', glowColor:'rgba(245,158,11,0.4)' },
  { id:'shadow-detox', name:'Shadow Detox', description:'Charcoal & Myrrh: Scours jet-trail soot. Ba · Sr · Al ionic decoupling.', protocol:'SCALAR · 528 Hz Miracle Tone. Phase nodes decouple heavy metal ionic bonds.', hz:528, binauralHz:6, oscType:'sine', vibePattern:[300,100,100,100,100], energyType:'scalar', Icon:Wind, color:'#94A3B8', glowColor:'rgba(148,163,184,0.3)' },
  { id:'nadi-sync', name:'Nadi Sync', description:'Pingala-Nadi alignment: Solar channel opens for atmospheric co-creation.', protocol:'SOLFEGGIO · 741 Hz binaural. Right hemisphere solar nadi activation.', hz:741, binauralHz:10, oscType:'sine', vibePattern:[80,40,80,40,80], energyType:'solfeggio', Icon:Activity, color:'#EF4444', glowColor:'rgba(239,68,68,0.4)' },
  { id:'aetheric-code', name:'Aetheric Code', description:'Tulsi Aura Sanitizer: Dissolves chemical toxin resonance in atmosphere.', protocol:'SHUNGITE · 396 Hz absorption field. Neutralises chemical resonance signatures.', hz:396, binauralHz:7, oscType:'sine', vibePattern:[150,60,150], energyType:'shungite', Icon:Sparkles, color:'#10B981', glowColor:'rgba(16,185,129,0.4)' },
  { id:'vortex-command', name:'Vortex Command', description:'Orgonite Vortex: DOR converted to POR. Dead field becomes living field.', protocol:'ORGONE · 852 Hz torus spin. Full DOR→POR inversion through rotating stereo field.', hz:852, binauralHz:9, oscType:'sine', vibePattern:[200,80,200,80,400], energyType:'orgone', Icon:Compass, color:'#8B5CF6', glowColor:'rgba(139,92,246,0.4)' },
  { id:'photon-rain', name:'Photon Rain', description:'Galactic Central Sun download: Photonic light codes through cleared atmosphere.', protocol:'SCALAR · 1111 Hz standing wave. Opens solar download channel via harmonic nodes.', hz:1111, binauralHz:14, oscType:'triangle', vibePattern:[50,50,50,50,50,50,200], energyType:'scalar', Icon:Flame, color:'#FCD34D', glowColor:'rgba(252,211,77,0.4)' },
  { id:'hydro-purge', name:'Hydro-Purge', description:'Masaru Emoto water memory: Heavy metals lose adhesion to atmospheric moisture.', protocol:'ORGONE · 285 Hz torus rotation. Restructures hydrogen bonds in water vapour.', hz:285, binauralHz:5, oscType:'sine', vibePattern:[120,80,120], energyType:'orgone', Icon:Droplets, color:'#60A5FA', glowColor:'rgba(96,165,250,0.4)' },
  { id:'akasha-eye', name:'Akasha Eye', description:'Third Eye scan: Locates and targets atmospheric antenna arrays for neutralisation.', protocol:'SOLFEGGIO · 936 Hz ajna activation. Remote scan of density pockets and arrays.', hz:936, binauralHz:11, oscType:'triangle', vibePattern:[60,40,60,40,300], energyType:'solfeggio', Icon:Eye, color:'#A78BFA', glowColor:'rgba(167,139,250,0.4)' },
  { id:'quantum-nucleus', name:'Quantum Nucleus', description:'DNA activation: Cellular scalar coherence restores biological solar reception.', protocol:'SCALAR · 528 Hz Miracle Tone. Recalibrates DNA antenna to Sun frequency.', hz:528, binauralHz:6, oscType:'sine', vibePattern:[100,60,100,60,500], energyType:'scalar', Icon:Atom, color:'#34D399', glowColor:'rgba(52,211,153,0.4)' },
];

// ═══════════════════════════════════════════════════════════════════════
//  REAL ENERGY ENGINES
// ═══════════════════════════════════════════════════════════════════════

let _audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function emitScalarWave(hz: number, duration = 6, g = 0.065): void {
  try {
    const ctx = getCtx();
    const makeOsc = (freq: number, inverted: boolean) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(g, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.2);
      if (inverted) {
        const inv = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) curve[i] = (i / 128 - 1) * -1;
        inv.curve = curve;
        osc.connect(gain); gain.connect(inv); inv.connect(ctx.destination);
      } else {
        osc.connect(gain); gain.connect(ctx.destination);
      }
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
    };
    makeOsc(hz, false);
    makeOsc(hz + 0.5, true);
    makeOsc(hz * 2, false);
  } catch(e) {}
}

function emitOrgoneTorus(baseHz: number, duration = 7, g = 0.06): void {
  try {
    const ctx = getCtx();
    const merger = ctx.createChannelMerger(2);
    merger.connect(ctx.destination);
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.3;
    lfoGain.gain.value = baseHz * 0.12;
    lfo.connect(lfoGain); lfo.start(ctx.currentTime); lfo.stop(ctx.currentTime + duration);
    const makeOsc = (ch: number, invertLfo: boolean) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = baseHz;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(g, ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.3);
      if (invertLfo) {
        const inv = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) curve[i] = (i / 128 - 1) * -1;
        inv.curve = curve;
        lfoGain.connect(inv); inv.connect(osc.frequency);
      } else {
        lfoGain.connect(osc.frequency);
      }
      osc.connect(gain); gain.connect(merger, 0, ch);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
    };
    makeOsc(0, false); makeOsc(1, true);
  } catch(e) {}
}

function emitShungiteShield(hz: number, duration = 6): void {
  try {
    const ctx = getCtx();
    const bufSize = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = hz; bp.Q.value = 1.2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, ctx.currentTime);
    ng.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.4);
    ng.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.3);
    ns.connect(bp); bp.connect(ng); ng.connect(ctx.destination);
    ns.start(ctx.currentTime); ns.stop(ctx.currentTime + duration);
    const sub = ctx.createOscillator(), subG = ctx.createGain();
    sub.type = 'sine'; sub.frequency.value = 40;
    subG.gain.setValueAtTime(0, ctx.currentTime);
    subG.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.3);
    subG.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.2);
    sub.connect(subG); subG.connect(ctx.destination);
    sub.start(ctx.currentTime); sub.stop(ctx.currentTime + duration);
    const carrier = ctx.createOscillator(), lfo = ctx.createOscillator();
    const lfoG = ctx.createGain(), mG = ctx.createGain();
    carrier.type = 'sine'; carrier.frequency.value = 136.1;
    lfo.type = 'sine'; lfo.frequency.value = 7.83;
    lfoG.gain.value = 0.04; mG.gain.value = 0.035;
    lfo.connect(lfoG); lfoG.connect(mG.gain); carrier.connect(mG); mG.connect(ctx.destination);
    carrier.start(ctx.currentTime); lfo.start(ctx.currentTime);
    carrier.stop(ctx.currentTime + duration); lfo.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function emitSolfeggio(hz: number, beatHz: number, duration = 5, g = 0.065): void {
  try {
    const ctx = getCtx();
    const merger = ctx.createChannelMerger(2);
    merger.connect(ctx.destination);
    [0, 1].forEach(ch => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = hz + (ch === 1 ? beatHz : 0);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(g, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.2);
      osc.connect(gain); gain.connect(merger, 0, ch);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
    });
  } catch(e) {}
}

function fireEngine(remedy: Activation, duration = 5): void {
  switch (remedy.energyType) {
    case 'scalar':    emitScalarWave(remedy.hz, duration); break;
    case 'orgone':    emitOrgoneTorus(remedy.hz, duration); break;
    case 'shungite':  emitShungiteShield(remedy.hz, duration); break;
    case 'solfeggio': emitSolfeggio(remedy.hz, remedy.binauralHz, duration); break;
  }
}

function emitFullSequence(): void {
  setTimeout(() => emitShungiteShield(432, 10),  0);
  setTimeout(() => emitScalarWave(7.83, 8),       1500);
  setTimeout(() => emitScalarWave(528, 7),        2200);
  setTimeout(() => emitOrgoneTorus(963, 9),       3000);
  setTimeout(() => { emitScalarWave(1111, 6); emitShungiteShield(396, 6); emitOrgoneTorus(852, 6); }, 5000);
  setTimeout(() => emitSolfeggio(963, 12, 4, 0.09), 8000);
}

function vibrate(pattern: number[]): void {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

async function requestNotifications(): Promise<void> {
  if ('Notification' in window) await Notification.requestPermission();
}

function pushNotification(title: string, body: string): void {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

function getSovereignRegion(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (tz.includes('Europe')) return 'EU-FIELD';
  if (tz.includes('America')) return 'AM-FIELD';
  if (tz.includes('Asia')) return 'AS-FIELD';
  if (tz.includes('Africa')) return 'AF-FIELD';
  if (tz.includes('Australia') || tz.includes('Pacific')) return 'AP-FIELD';
  return 'FIELD';
}

// ═══════════════════════════════════════════════════════════════════════
//  RADAR MAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function RadarMap({ active, sovereigntyOn, pulseIntensity }: { active: boolean; sovereigntyOn: boolean; pulseIntensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animId: number;
    const draw = () => {
      const ctx  = canvas.getContext('2d');
      const W    = canvas.width;
      const H    = canvas.height;
      const cx   = W / 2, cy = H / 2;
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = 0.5;
      for (let x = 0; x < W; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 28) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Concentric rings
      [80, 60, 40].forEach((r, i) => {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.05 + i * 0.01})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      });

      // 10-mile radius ring
      const mainR = 88;
      if (sovereigntyOn) {
        const pulse = (Math.sin(frameRef.current * 0.08) + 1) / 2;
        ctx.beginPath(); ctx.arc(cx, cy, mainR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,211,238,${0.5 + pulse * 0.4})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, mainR, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(34,211,238,${0.03 + pulse * 0.04})`;
        ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(cx, cy, mainR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,175,55,0.2)';
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // Broadcast pulse rings
      if (active) {
        const pr = (frameRef.current % 90) + 10;
        ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212,175,55,${0.6 - pr / 90 * 0.5})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // Centre dot
      const dotP = (Math.sin(frameRef.current * 0.1) + 1) / 2;
      ctx.beginPath(); ctx.arc(cx, cy, 4 + dotP * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${0.3 + dotP * 0.3})`;
      ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#D4AF37';
      ctx.fill();

      // Labels
      ctx.fillStyle   = 'rgba(212,175,55,0.5)';
      ctx.font        = '700 8px Rajdhani, sans-serif';
      ctx.textAlign   = 'center';
      ctx.fillText('BROADCAST ORIGIN', cx, cy + 18);

      frameRef.current++;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [active, sovereigntyOn]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={200}
      style={{ width: '100%', height: 200, display: 'block' }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function VajraSkyBreaker() {
  const navigate          = useNavigate();
  const { t }             = useTranslation();
  const { tier, loading } = useMembership();
  const { isAdmin }       = useAdminRole();

  // ── Existing state (untouched) ────────────────────────────────────
  const [isActivating,   setIsActivating]   = useState(false);
  const [activeRemedy,   setActiveRemedy]   = useState<string | null>(null);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  // ── End existing state ────────────────────────────────────────────

  const [pillarState,    setPillarState]    = useState({ anchor: false, sovereignty: false, ignition: false, detox: false });
  const [skyPhaseIdx,    setSkyPhaseIdx]    = useState(0);
  const [cloudOpacity,   setCloudOpacity]   = useState(1);
  const [sunReveal,      setSunReveal]      = useState(0);
  const [thermalLevel,   setThermalLevel]   = useState(0);
  const [broadcastLog,   setBroadcastLog]   = useState<{ text: string; cls: string }[]>([]);
  const [activeTab,      setActiveTab]      = useState<'remedies' | 'log'>('remedies');
  const [audioEnabled,   setAudioEnabled]   = useState(true);
  const [missionDone,    setMissionDone]    = useState(false);
  const [lastTime,       setLastTime]       = useState<string | null>(null);
  const logRef   = useRef<HTMLDivElement>(null);
  const region   = getSovereignRegion();

  // ── Tier gate (untouched) ─────────────────────────────────────────
  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  useEffect(() => {
    requestNotifications();
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [broadcastLog]);

  const addLog = useCallback((text: string, cls = '') => {
    const ts = new Date().toLocaleTimeString();
    setBroadcastLog(prev => [...prev, { text: `[${ts}] ${text}`, cls }]);
  }, []);

  const togglePillar = useCallback((id: keyof typeof pillarState) => {
    setPillarState(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!prev[id]) {
        const pillar = PILLARS.find(p => p.id === id)!;
        if (audioEnabled) {
          if (pillar.energyType === 'scalar')   emitScalarWave(pillar.hz, 4);
          if (pillar.energyType === 'orgone')   emitOrgoneTorus(pillar.hz, 4);
          if (pillar.energyType === 'shungite') emitShungiteShield(pillar.hz, 4);
        }
        vibrate(pillar.id === 'sovereignty' ? [200, 100, 200, 100, 200] : [100, 50, 100]);
        addLog(`◈ ${pillar.name} — ${pillar.energyType.toUpperCase()} · ${pillar.hz} Hz`, 'gold');
      }
      return next;
    });
  }, [audioEnabled, addLog]);

  // ── handleActivate (original logic preserved) ─────────────────────
  const handleActivate = useCallback(async () => {
    if (isActivating) return;
    setIsActivating(true);
    setSkyPhaseIdx(0);
    setCloudOpacity(1);
    setSunReveal(0);
    setThermalLevel(0);
    setBroadcastLog([]);
    setMissionDone(false);

    await requestNotifications();
    vibrate([100, 50, 100, 50, 100, 50, 100, 50, 800, 200, 800]);
    if (audioEnabled) emitFullSequence();

    addLog('◈ FULL SEQUENCE INITIATED — Scalar · Orgone · Shungite', 'gold');
    addLog('By the power of the Anahata-Sahasrara bridge…', 'gold');

    const logTimings: [number, string, string][] = [
      [300,  '⬡ Shungite EMF Shield — 10-mile zone establishing…', 'cyan'],
      [1200, '⟐ Scalar standing wave — phase-inverted nodes forming', 'gold'],
      [2400, '◉ Orgone torus — L-ear rising, R-ear descending, field rotating', 'gold'],
      [3200, '⬡ 40Hz sub-bass — felt in hands. Earth grounding pulse active', ''],
      [4200, '⟐ Chemtrail metal grid — Ba · Sr · Al ionic bonds dissolving', ''],
      [5500, '⬡ Atmospheric antenna array — structural coherence failing', 'cyan'],
      [6500, '◉ Blue Hole vortex — anchoring. Solar channel opening…', 'gold'],
      [7500, '⟐ DOR → POR conversion complete. Living field established', 'gold'],
    ];
    logTimings.forEach(([delay, msg, cls]) => setTimeout(() => addLog(msg, cls), delay));

    // Activate pillars visually in sequence
    const pillarSeq: (keyof typeof pillarState)[] = ['anchor', 'sovereignty', 'ignition', 'detox'];
    pillarSeq.forEach((id, i) => setTimeout(() => setPillarState(prev => ({ ...prev, [id]: true })), i * 700));

    let intensity = 0, phaseIdx = 0;
    const interval = window.setInterval(() => {
      intensity += 5;
      setPulseIntensity(intensity);
      setCloudOpacity(Math.max(0, 1 - intensity / 100));
      setSunReveal(intensity / 100);
      setThermalLevel(intensity);

      const nextIdx     = SKY_PHASES.findIndex(p => p.pct > intensity);
      const newPhaseIdx = nextIdx === -1 ? SKY_PHASES.length - 1 : nextIdx - 1;
      if (newPhaseIdx !== phaseIdx && newPhaseIdx >= 0) {
        phaseIdx = newPhaseIdx;
        setSkyPhaseIdx(newPhaseIdx);
        const isLast = newPhaseIdx === SKY_PHASES.length - 1;
        addLog(`◈ ${SKY_PHASES[newPhaseIdx].label}`, isLast ? 'gold' : '');
        vibrate([60, 30, 60]);
      }

      if (intensity >= 100) {
        window.clearInterval(interval);
        const ts = new Date().toLocaleTimeString();
        setLastTime(ts);
        setMissionDone(true);
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gold');
        addLog('RADIUS SECURED. COHESION LOST.', 'gold');
        addLog('TRANSMUTATION IN PROGRESS.', 'gold');
        addLog('SOLAR DOWNLOAD CHANNEL — OPEN.', 'gold');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gold');
        vibrate([200, 100, 200, 100, 800]);
        if (audioEnabled) { emitScalarWave(963, 3); emitSolfeggio(963, 12, 3, 0.09); }
        pushNotification('◈ Sky Cleared', 'RADIUS SECURED. Solar channel open. 72-hour field active.');
        window.setTimeout(() => { setIsActivating(false); setPulseIntensity(0); }, 2000);
      }
    }, 50);
  }, [isActivating, audioEnabled, addLog]);
  // ── End handleActivate ────────────────────────────────────────────

  const handleRemedyTap = useCallback((remedy: Activation) => {
    const isOpen = activeRemedy === remedy.id;
    setActiveRemedy(isOpen ? null : remedy.id);
    if (!isOpen) {
      if (audioEnabled) { fireEngine(remedy, 5); addLog(`◈ ${remedy.name} — ${remedy.hz} Hz ${remedy.energyType.toUpperCase()} fired`, 'gold'); }
      vibrate(remedy.vibePattern);
    }
  }, [activeRemedy, audioEnabled, addLog]);

  const currentPhase = SKY_PHASES[skyPhaseIdx];
  const thermalLabel = thermalLevel < 20 ? 'Synthetic Grey' : thermalLevel < 50 ? 'Cloud Breaking' : thermalLevel < 80 ? 'Veil Thinning' : '☀ Transparent Gold';
  const energyColors: Record<string, string> = { scalar:'#D4AF37', orgone:'#8B5CF6', shungite:'#22D3EE', solfeggio:'#10B981' };
  const energyBadge:  Record<string, string> = { scalar:'⟐ SCALAR', orgone:'◉ ORGONE', shungite:'⬡ SHUNGITE', solfeggio:'♪ SOLFEGGIO' };

  return (
    <div
      className="min-h-screen pb-44 text-white selection:bg-[#D4AF37]/30"
      style={{
        background: sunReveal > 0.3
          ? `radial-gradient(ellipse at 50% 0%, rgba(212,175,55,${sunReveal * 0.18}) 0%, transparent 55%), #050505`
          : '#050505',
        fontFamily: "'Rajdhani', sans-serif",
        transition: 'background 3s ease',
      }}
    >

      {/* ── STARFIELD ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width:   i % 5 === 0 ? 2 : 1,
              height:  i % 5 === 0 ? 2 : 1,
              left:    `${(i * 37 + 11) % 100}%`,
              top:     `${(i * 23 + 7)  % 100}%`,
              opacity: 0.15 + (i % 5) * 0.08,
            }}
          />
        ))}
      </div>

      {/* ── SKY SIMULATION ────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-[480px] overflow-hidden" style={{ height: 200 }}>

        {/* Sun */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
          style={{
            width:      70 + sunReveal * 65,
            height:     70 + sunReveal * 65,
            background: `radial-gradient(circle, rgba(252,211,77,${0.1 + sunReveal * 0.9}) 0%, rgba(245,158,11,${sunReveal * 0.55}) 40%, transparent 70%)`,
            boxShadow:  `0 0 ${35 + sunReveal * 100}px ${15 + sunReveal * 55}px rgba(212,175,55,${sunReveal * 0.3})`,
          }}
          animate={{ scale: isActivating ? [1, 1.07, 1] : 1 }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {sunReveal > 0.2 && (
            <span style={{ fontSize: 24 + sunReveal * 10, opacity: sunReveal }}>☀</span>
          )}
        </motion.div>

        {/* Orgone rings */}
        {pillarState.ignition && (
          <>
            {[100, 150].map((r, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: r * 2, height: r * 2, border: `1px solid rgba(139,92,246,${0.25 - i * 0.06})` }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }}
              />
            ))}
          </>
        )}

        {/* Scalar nodes */}
        {pillarState.anchor && (
          <div className="absolute inset-0 pointer-events-none">
            {[0.18, 0.32, 0.5, 0.68, 0.82].map((t, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{ width: 5, height: 5, left: `${t * 100}%`, top: '55%', background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.5)' }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.4, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        )}

        {/* Clouds dissolving */}
        <motion.div className="absolute inset-0" style={{ opacity: cloudOpacity }}>
          {[[60, 35, 180, 30], [200, 22, 200, 25], [340, 38, 160, 22], [440, 52, 140, 20], [100, 60, 170, 18]].map(([x, y, w, h], i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ width: w, height: h, left: x, top: y, background: 'rgba(110,110,130,0.28)', filter: 'blur(12px)' }}
              animate={isActivating ? { x: [0, i % 2 === 0 ? 50 : -50], opacity: [cloudOpacity, 0] } : {}}
              transition={{ duration: 3 + i * 0.7, ease: 'easeOut' }}
            />
          ))}
          {/* Chemtrails */}
          {[[0, 38, '70%'], [10, 58, '60%'], [5, 78, '65%']].map(([l, t, w], i) => (
            <motion.div
              key={`ct${i}`}
              className="absolute"
              style={{ left: `${l}%`, top: `${t}%`, width: w, height: 1, background: 'rgba(190,190,210,0.3)', filter: 'blur(2px)' }}
              animate={isActivating ? { opacity: [0.3, 0], scaleX: [1, 0] } : {}}
              transition={{ duration: 2 + (i as number) * 0.8, delay: (i as number) * 0.5 }}
            />
          ))}
        </motion.div>

        {/* Shungite shield ring pulsing at Schumann rate */}
        {pillarState.sovereignty && (
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{ border: '1px solid rgba(34,211,238,0.2)' }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1 / 7.83, repeat: Infinity }}
          />
        )}

        {/* Phase label */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span
            style={{
              fontFamily:    "'Orbitron', monospace, sans-serif",
              fontSize:       8,
              fontWeight:     700,
              letterSpacing: '0.4em',
              textTransform:  'uppercase',
              color:          'rgba(212,175,55,0.65)',
            }}
          >
            {isActivating ? currentPhase.label : 'Atmospheric Monitoring Active'}
          </span>
        </div>
      </div>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="mx-auto max-w-[480px] px-5 pb-4 pt-3 text-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ fontFamily: "'Orbitron', monospace", fontSize: 7, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}
        >
          {t('siddhaPortal.back')}
        </button>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span style={{ display: 'block', fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.32)', marginBottom: 8, fontFamily: "'Rajdhani', sans-serif" }}>
            ◈ Akasha-Neural Archive v5.0 · Scalar · Orgone · Shungite
          </span>
          <h1
            style={{
              fontFamily:    "'Orbitron', monospace, sans-serif",
              fontSize:       'clamp(22px, 6vw, 30px)',
              fontWeight:     900,
              letterSpacing: '-0.02em',
              color:          '#D4AF37',
              textShadow:     '0 0 30px rgba(212,175,55,0.45), 0 0 60px rgba(212,175,55,0.2)',
              margin:         '0 0 8px',
              lineHeight:     1,
            }}
          >
            VAJRA·SKY·BREAKER
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 12 }}>
            Sovereign Atmospheric Clearance Station<br />No GPS · No Tracking · Pure Energy
          </p>

          {/* Chips row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20, border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)', padding: '5px 12px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'blink 1.5s infinite' }} />
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)' }}>
                {region} · Sovereign
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAudioEnabled(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                borderRadius: 20,
                border: `1px solid ${audioEnabled ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.07)'}`,
                background: audioEnabled ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.02)',
                padding: '5px 12px', cursor: 'pointer',
                fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
                color: audioEnabled ? 'rgba(34,211,238,0.85)' : 'rgba(255,255,255,0.3)',
              }}
            >
              {audioEnabled ? '⚡ Energies ON' : '— Energies OFF'}
            </button>
          </div>

          {lastTime && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(212,175,55,0.22)', borderRadius: 20, padding: '5px 14px', marginTop: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.75)' }}>
                Last Transmission: {lastTime}
              </span>
            </div>
          )}
        </motion.div>
      </header>

      {/* ── RADAR MAP ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[480px] px-4 mb-3">
        <div
          style={{
            background:   'rgba(255,255,255,0.02)',
            border:       '1px solid rgba(255,255,255,0.06)',
            borderRadius: 28,
            overflow:     'hidden',
            backdropFilter: 'blur(20px)',
            position:     'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 12, left: 16, fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', zIndex: 2 }}>
            ◈ Clearance Radius
          </div>
          <div
            style={{
              position: 'absolute', top: 12, right: 16, zIndex: 2,
              fontFamily: "'Orbitron', monospace", fontSize: 9,
              color: pillarState.sovereignty ? '#22D3EE' : 'rgba(212,175,55,0.6)',
              fontWeight: 700,
            }}
          >
            10 mi · {pillarState.sovereignty ? 'SECURED' : 'Standby'}
          </div>
          {pillarState.sovereignty && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontFamily: "'Orbitron',monospace", fontSize: 7, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#22D3EE', zIndex: 2 }}>
              COHESION LOST
            </div>
          )}
          <RadarMap
            active={isActivating}
            sovereigntyOn={pillarState.sovereignty}
            pulseIntensity={pulseIntensity}
          />
        </div>
      </div>

      {/* ── FOUR PILLAR CARDS ────────────────────────────────────── */}
      <div className="mx-auto max-w-[480px] px-4 mb-3">
        <span style={{ display: 'block', fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 10 }}>
          ◈ Four Pillars of Terrestrial Transmutation
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PILLARS.map(pillar => {
            const isOn = pillarState[pillar.id as keyof typeof pillarState];
            return (
              <motion.div
                key={pillar.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => togglePillar(pillar.id as keyof typeof pillarState)}
                style={{
                  background:     'rgba(255,255,255,0.02)',
                  border:         `1px solid ${isOn ? pillar.color + '60' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius:   24,
                  padding:        16,
                  cursor:         'pointer',
                  position:       'relative',
                  overflow:       'hidden',
                  minHeight:      160,
                  display:        'flex',
                  flexDirection:  'column',
                  backdropFilter: 'blur(20px)',
                  transition:     'all 0.4s ease',
                  boxShadow:      isOn ? `0 0 24px ${pillar.glowColor}` : 'none',
                }}
              >
                {/* Gradient glow background */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: isOn ? pillar.gradient : 'transparent',
                    transition: 'opacity 0.6s',
                    opacity: isOn ? 1 : 0,
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 28, fontWeight: 900, color: pillar.color, opacity: 0.18, lineHeight: 1, marginBottom: 3, position: 'relative' }}>
                  {pillar.num}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: `1px solid ${pillar.color}50`, borderRadius: 6, padding: '2px 6px', marginBottom: 6, width: 'fit-content', position: 'relative' }}>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', color: pillar.color, opacity: 0.8 }}>
                    {pillar.energyType === 'scalar' ? '⟐ SCALAR' : pillar.energyType === 'orgone' ? '◉ ORGONE' : '⬡ SHUNGITE'}
                  </span>
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase', color: pillar.color, marginBottom: 6, opacity: 0.9, position: 'relative' }}>
                  {pillar.name}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 1.4, flex: 1, position: 'relative' }}>
                  {pillar.desc}
                </div>
                <div style={{ marginTop: 10, fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', color: isOn ? pillar.color : 'rgba(255,255,255,0.2)', transition: 'color 0.3s', position: 'relative' }}>
                  {isOn ? `◈ ${pillar.statusOn}` : '◦ Dormant'}
                </div>
                <div style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 24, opacity: isOn ? 0.45 : 0.12, transition: 'all 0.4s', transform: isOn ? 'scale(1.2)' : 'scale(1)', color: pillar.color }}>
                  {pillar.icon}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── THERMAL SLIDER ────────────────────────────────────────── */}
      <div className="mx-auto max-w-[480px] px-4 mb-3">
        <div
          style={{
            background:     'rgba(255,255,255,0.02)',
            border:         '1px solid rgba(255,255,255,0.06)',
            borderRadius:   24,
            padding:        16,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
              ◈ Solar Ignition · Thermal Level
            </span>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 700, color: `rgba(245,158,11,${0.3 + thermalLevel / 100 * 0.7})`, textShadow: thermalLevel > 50 ? '0 0 12px rgba(245,158,11,0.5)' : 'none' }}>
              {Math.round(thermalLevel * 9.63)}°
            </span>
          </div>
          {/* Track */}
          <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${thermalLevel}%`, borderRadius: 3, background: 'linear-gradient(90deg, #888, #D4AF37 60%, #FF8C00)', transition: 'width 0.1s', boxShadow: thermalLevel > 30 ? '0 0 8px rgba(212,175,55,0.5)' : 'none' }} />
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `calc(${thermalLevel}% - 10px)`, width: 20, height: 20, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 12px rgba(212,175,55,0.6)', border: '2px solid rgba(255,255,255,0.2)', transition: 'left 0.1s' }} />
          </div>
          {/* Gradient bar */}
          <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #3a3a4a 0%, #888 25%, #D4AF37 60%, #FF8C00 80%, #FFD700 100%)', marginBottom: 6, opacity: 0.7 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>Synthetic Grey</span>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>Cloud Break</span>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: `rgba(245,158,11,${0.3 + thermalLevel/100*0.7})` }}>
              {thermalLabel} ☀
            </span>
          </div>
        </div>
      </div>

      {/* ── BROADCAST MONITOR ─────────────────────────────────────── */}
      <div className="mx-auto max-w-[480px] px-4 mb-3">
        <div
          style={{
            background:     'rgba(255,255,255,0.02)',
            border:         '1px solid rgba(255,255,255,0.06)',
            borderRadius:   28,
            padding:        16,
            backdropFilter: 'blur(40px)',
            position:       'relative',
            overflow:       'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>System Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <motion.div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: isActivating ? '#D4AF37' : '#22c55e' }}
                  animate={isActivating ? { opacity: [1, 0.2, 1] } : {}}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
                  {isActivating ? 'All Three Energies Broadcasting' : 'Ready for Sync'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Clearance</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 900, color: '#D4AF37', textShadow: isActivating ? '0 0 20px rgba(212,175,55,0.7)' : 'none' }}>
                {isActivating ? `${pulseIntensity}%` : '—'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {isActivating && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Sky Clearance</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, color: 'rgba(212,175,55,0.75)' }}>{pulseIntensity}%</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', width: `${pulseIntensity}%`, background: 'linear-gradient(90deg, #22D3EE, #8B5CF6, #D4AF37)', boxShadow: '0 0 8px rgba(212,175,55,0.5)' }} />
              </div>
            </div>
          )}

          {/* Spectrum — 3 colour zones */}
          <div style={{ display: 'flex', height: 64, alignItems: 'flex-end', gap: 1, padding: '0 2px' }}>
            {[...Array(36)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: '2px 2px 0 0',
                  background: isActivating
                    ? i < 12 ? `rgba(34,211,238,${0.15 + pulseIntensity/100*0.4})` : i < 24 ? `rgba(139,92,246,${0.15 + pulseIntensity/100*0.4})` : `rgba(212,175,55,${0.15 + pulseIntensity/100*0.4})`
                    : 'rgba(212,175,55,0.09)',
                }}
                animate={{
                  height: isActivating
                    ? `${Math.max(6, ((pulseIntensity + i * 17) % 88) + 6)}%`
                    : `${5 + (Math.sin(i * 0.5) * 3 + 3)}%`,
                }}
                transition={{ duration: 0.15 }}
              />
            ))}
          </div>

          <AnimatePresence>
            {isActivating && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-[28px]"
                initial={{ opacity: 0 }} animate={{ opacity: [0, 0.06, 0] }} exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ background: 'rgba(212,175,55,1)' }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[480px] px-4 mb-3">
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 4 }}>
          {(['remedies', 'log'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, borderRadius: 12, padding: '8px 0',
                fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase',
                background:  activeTab === tab ? 'rgba(212,175,55,0.1)' : 'transparent',
                color:       activeTab === tab ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.28)',
                border:      activeTab === tab ? '1px solid rgba(212,175,55,0.22)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {tab === 'remedies' ? '◈ Activations' : '◈ Broadcast Log'}
            </button>
          ))}
        </div>
      </div>

      {/* ── REMEDIES ──────────────────────────────────────────────── */}
      {activeTab === 'remedies' && (
        <div className="mx-auto max-w-[480px] px-4 mb-3">
          <span style={{ display: 'block', fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 10 }}>
            Bhakti-Algorithm · {ACTIVATIONS.length} Energy Activations
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACTIVATIONS.map(remedy => {
              const isActive = activeRemedy === remedy.id;
              const ec = energyColors[remedy.energyType];
              const Icon = remedy.Icon;
              return (
                <motion.button
                  key={remedy.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRemedyTap(remedy)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background:     isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border:         `1px solid ${isActive ? remedy.color + '55' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius:   28,
                    padding:        12,
                    textAlign:      'left',
                    backdropFilter: 'blur(40px)',
                    boxShadow:      isActive ? `0 0 20px ${remedy.glowColor}` : 'none',
                    cursor:         'pointer',
                    transition:     'all 0.3s',
                    width:          '100%',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: remedy.color + '18', color: remedy.color, flexShrink: 0, boxShadow: isActive ? `0 0 14px ${remedy.glowColor}` : 'none', transition: 'box-shadow 0.3s' }}>
                    <Icon style={{ width: 20, height: 20 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: isActive ? remedy.color : 'rgba(255,255,255,0.8)' }}>
                        {remedy.name}
                      </span>
                      <span style={{ border: `1px solid ${ec}30`, background: ec + '15', color: ec + 'cc', borderRadius: 6, padding: '1px 5px', fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        {energyBadge[remedy.energyType]}
                      </span>
                      <span style={{ border: `1px solid ${remedy.color}28`, background: remedy.color + '12', color: remedy.color + 'aa', borderRadius: 6, padding: '1px 5px', fontFamily: "'Orbitron',monospace", fontSize: 7, fontWeight: 700 }}>
                        {remedy.hz} Hz
                      </span>
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, marginTop: 6 }}>
                            {remedy.description}
                          </p>
                          <div style={{ marginTop: 6, border: `1px solid ${ec}28`, background: ec + '07', borderRadius: 10, padding: '5px 8px', fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: ec + 'aa' }}>
                            {remedy.protocol}
                          </div>
                          {audioEnabled && (
                            <div style={{ marginTop: 4, fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: ec + '80' }}>
                              ◈ {remedy.hz} Hz {remedy.energyType} engine fired
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, flexShrink: 0, color: isActive ? remedy.color + '88' : 'rgba(255,255,255,0.12)', transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BROADCAST LOG ─────────────────────────────────────────── */}
      {activeTab === 'log' && (
        <div className="mx-auto max-w-[480px] px-4 mb-3">
          <span style={{ display: 'block', fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 10 }}>
            Sovereign Weather Log · Real-Time Transmission
          </span>
          <div
            ref={logRef}
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 16, height: 280, overflowY: 'auto', fontFamily: 'monospace' }}
          >
            {broadcastLog.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>Awaiting Activation…</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {broadcastLog.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      fontSize:   10,
                      lineHeight: 1.6,
                      color:      entry.cls === 'gold' ? '#D4AF37' : entry.cls === 'cyan' ? '#22D3EE' : 'rgba(255,255,255,0.42)',
                      fontWeight: entry.cls === 'gold' ? 700 : 400,
                    }}
                  >
                    {entry.text}
                  </motion.div>
                ))}
                {isActivating && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ fontSize: 10, color: 'rgba(34,211,238,0.5)' }}
                  >▌</motion.span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FIELD BAR ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[480px] px-4 mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.012)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '8px 14px' }}>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Field Origin</span>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)' }}>
            {region} · Sovereign · No Tracking
          </span>
        </div>
      </div>

      {/* ── ACTIVATE BUTTON (original logic preserved) ─────────────── */}
      <div className="fixed bottom-24 left-0 right-0 z-20 mx-auto max-w-[480px] px-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleActivate}
          disabled={isActivating}
          style={{
            width:          '100%',
            border:         isActivating ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius:   40,
            padding:        missionDone ? '16px' : '20px',
            fontFamily:     "'Orbitron', monospace",
            fontSize:       missionDone ? 10 : 11,
            fontWeight:     700,
            letterSpacing:  '0.25em',
            textTransform:  'uppercase',
            background:     isActivating || missionDone ? '#D4AF37' : 'rgba(255,255,255,0.04)',
            color:          isActivating || missionDone ? '#050505' : 'rgba(255,255,255,0.8)',
            cursor:         isActivating ? 'not-allowed' : 'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            10,
            boxShadow:      isActivating || missionDone
              ? '0 0 60px rgba(212,175,55,0.5), 0 0 120px rgba(212,175,55,0.2)'
              : 'none',
            transition: 'all 0.5s ease',
          }}
        >
          <span style={{ fontSize: 16 }}>
            {missionDone ? '☀' : isActivating ? '◈' : '⚡'}
          </span>
          {missionDone
            ? 'Mission Complete — 72Hr Active'
            : isActivating
            ? `Clearing Sky — ${pulseIntensity}%`
            : 'Initiate · Scalar · Orgone · Shungite'}
        </motion.button>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-[480px] px-4 mt-4 pb-4 text-center">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, opacity: 0.15 }}>
          <Radio style={{ width: 14, height: 14 }} />
          <Cpu   style={{ width: 14, height: 14 }} />
          <Activity style={{ width: 14, height: 14 }} />
        </div>
        <p style={{ marginTop: 8, fontFamily: "'Rajdhani',sans-serif", fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>
          Scalar · Orgone · Shungite · Sovereign · SQI 2050
        </p>
      </footer>

      {/* ── GLOBAL PULSE RINGS (original preserved) ───────────────── */}
      <AnimatePresence>
        {isActivating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0" style={{ background: 'rgba(212,175,55,0.025)' }} />
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 1 / 7.83, repeat: Infinity }}
              style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', border: '1px solid rgba(34,211,238,0.2)' }}
            />
            <motion.div
              animate={{ scale: [1, 2.1, 1], opacity: [0.08, 0.2, 0.08] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.18)' }}
            />
            <motion.div
              animate={{ scale: [1, 2.6, 1], rotate: [0, 360], opacity: [0.04, 0.1, 0.04] }}
              transition={{ scale: { duration: 3.3, repeat: Infinity }, rotate: { duration: 3.3, repeat: Infinity, ease: 'linear' } }}
              style={{ position: 'absolute', width: 880, height: 880, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.1)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
