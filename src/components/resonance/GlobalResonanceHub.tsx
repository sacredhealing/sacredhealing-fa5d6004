import React, { useState, useEffect, useRef, createContext, useContext, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SiteCategory = 'Supreme' | 'Temporal' | 'LostCiv' | 'Galactic' | 'Earth';

interface SacredSite {
  id: string;
  name: string;
  subtitle: string;
  category: SiteCategory;
  color: string;
  glow: string;
  bgFrom: string;
  frequency: number;
  emoji: string;
  multiplier?: string;
  effect: string;
}

interface ResonanceState {
  activeSiteId: string;
  isLocked: boolean;
  intensity: number;
  userEmail: string | null;
}

interface ResonanceCtx {
  state: ResonanceState;
  site: SacredSite;
  activate: (id: string) => void;
  setIntensity: (v: number) => void;
  toggleLock: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 23 SACRED SITES
// ─────────────────────────────────────────────────────────────────────────────

const SITES: SacredSite[] = [
  { id:'KAILASH',      name:'Mount Kailash',   subtitle:'13X Supreme Axis',              category:'Supreme',  color:'#7B61FF', glow:'rgba(123,97,255,0.4)',   bgFrom:'#1a0d4e', frequency:7.83,  emoji:'🕉️',  multiplier:'13X', effect:'kailash_shimmer' },
  { id:'GLASTONBURY',  name:'Glastonbury',      subtitle:'Avalon Tor',                    category:'Supreme',  color:'#00FF7F', glow:'rgba(0,255,127,0.3)',    bgFrom:'#001a0d', frequency:60,    emoji:'🌿',               effect:'avalon_mist' },
  { id:'SEDONA',       name:'Sedona',           subtitle:'Red Rock Vortex',               category:'Supreme',  color:'#FF4500', glow:'rgba(255,69,0,0.3)',     bgFrom:'#3d0e00', frequency:40,    emoji:'🔴',               effect:'red_vortex' },
  { id:'TITICACA',     name:'Lake Titicaca',    subtitle:'Solar Portal',                  category:'Supreme',  color:'#FFD700', glow:'rgba(255,215,0,0.3)',    bgFrom:'#2a2000', frequency:432,   emoji:'☀️',               effect:'solar_ripples' },
  { id:'VRINDAVAN',    name:'Vrindavan',        subtitle:'Krishna Era · Peacock Blue',    category:'Temporal', color:'#1E90FF', glow:'rgba(30,144,255,0.3)',   bgFrom:'#001a3d', frequency:528,   emoji:'🪷',               effect:'lotus_petals' },
  { id:'AYODHYA',      name:'Ayodhya',          subtitle:'Rama / Hanuman · Saffron Shield',category:'Temporal',color:'#FF9933', glow:'rgba(255,153,51,0.4)',   bgFrom:'#2a1500', frequency:396,   emoji:'🏹',               effect:'saffron_shield' },
  { id:'ATLANTIS',     name:'Atlantis',         subtitle:'Crystal Technology',            category:'LostCiv',  color:'#0050FF', glow:'rgba(0,100,200,0.3)',    bgFrom:'#000820', frequency:741,   emoji:'🔷',               effect:'liquid_geometry' },
  { id:'LEMURIA',      name:'Lemuria',          subtitle:'Mother Mu · Tropical Aqua',     category:'LostCiv',  color:'#40E0D0', glow:'rgba(64,224,208,0.3)',   bgFrom:'#001a1a', frequency:285,   emoji:'🌊',               effect:'tropical_aqua' },
  { id:'PLEIADES',     name:'Pleiades',         subtitle:'Star Cluster · Diamond Light',  category:'Galactic', color:'#E0FFFF', glow:'rgba(224,255,255,0.3)',  bgFrom:'#0a1020', frequency:963,   emoji:'✨',               effect:'diamond_sparkle' },
  { id:'SIRIUS',       name:'Sirius',           subtitle:'Blue Lodge · Double Sun',       category:'Galactic', color:'#4169E1', glow:'rgba(65,105,225,0.3)',   bgFrom:'#050a20', frequency:852,   emoji:'⭐',               effect:'double_sun' },
  { id:'ARCTURUS',     name:'Arcturus',         subtitle:'Violet Grid · 10Hz Alpha',      category:'Galactic', color:'#9932CC', glow:'rgba(153,50,204,0.3)',   bgFrom:'#1a0030', frequency:10,    emoji:'💜',               effect:'violet_grid' },
  { id:'LYRA',         name:'Lyra',             subtitle:'White Fire · Sound of Creation',category:'Galactic', color:'#FFFFFF', glow:'rgba(255,255,255,0.2)', bgFrom:'#0f0f1a', frequency:174,   emoji:'🎵',               effect:'white_fire' },
  { id:'GIZA',         name:'Giza',             subtitle:'Torsion Power · Flower of Life',category:'Earth',    color:'#B8860B', glow:'rgba(184,134,11,0.3)',   bgFrom:'#1a1000', frequency:40,    emoji:'🔺',               effect:'torsion_field' },
  { id:'LUXOR',        name:'Luxor',            subtitle:'Molten Gold · Living Light',    category:'Earth',    color:'#D4AF37', glow:'rgba(212,175,55,0.4)',   bgFrom:'#1a1400', frequency:417,   emoji:'⚜️',               effect:'ka_gold' },
  { id:'MACHU_PICCHU', name:'Machu Picchu',     subtitle:'Sun Gate · Solar Hitch',        category:'Earth',    color:'#228B22', glow:'rgba(34,139,34,0.3)',    bgFrom:'#0a1500', frequency:639,   emoji:'🏔️',               effect:'solar_sync' },
  { id:'MT_SHASTA',    name:'Mt. Shasta',       subtitle:'Lenticular Flow · White Pings', category:'Earth',    color:'#F0FFFF', glow:'rgba(240,255,255,0.2)', bgFrom:'#0a1520', frequency:528,   emoji:'🗻',               effect:'crystal_lake' },
  { id:'ARUNACHALA',   name:'Arunachala',       subtitle:'The Stillness · Zero Motion',   category:'Earth',    color:'#FF8C00', glow:'rgba(255,140,0,0.3)',    bgFrom:'#2a1000', frequency:0,     emoji:'🔶',               effect:'zero_point' },
  { id:'ULURU',        name:'Uluru',            subtitle:'Red Ochre · Earth Heartbeat',   category:'Earth',    color:'#8B0000', glow:'rgba(139,0,0,0.3)',      bgFrom:'#1a0000', frequency:7.83,  emoji:'🟤',               effect:'red_ochre' },
  { id:'LOURDES',      name:'Lourdes',          subtitle:'Healing Spring · Blue Waters',  category:'Earth',    color:'#ADD8E6', glow:'rgba(173,216,230,0.3)', bgFrom:'#001525', frequency:285,   emoji:'💧',               effect:'water_flow' },
  { id:'MANSAROVAR',   name:'Mansarovar',       subtitle:'Mirror Lake · Perfect Reflection',category:'Earth',  color:'#AFEEEE', glow:'rgba(175,238,238,0.25)',bgFrom:'#001a1a', frequency:432,   emoji:'🪞',               effect:'mirror_lake' },
  { id:'SAMADHI',      name:'Samadhi',          subtitle:'Etheric Trails · Pure Awareness',category:'Earth',   color:'#E6E6FA', glow:'rgba(230,230,250,0.2)', bgFrom:'#0a0a1a', frequency:963,   emoji:'🌌',               effect:'etheric_trails' },
  { id:'ZIMBABWE',     name:'Zimbabwe',         subtitle:'Granite Wall · Ancient Code',   category:'Earth',    color:'#696969', glow:'rgba(105,105,105,0.3)', bgFrom:'#0f0f0f', frequency:174,   emoji:'🗿',               effect:'granite_wall' },
  { id:'BABAJI_CAVE',  name:'Babaji Cave',      subtitle:'Crystal Frost · Drift Mode',    category:'Earth',    color:'#F8F8FF', glow:'rgba(248,248,255,0.2)', bgFrom:'#0a0a15', frequency:741,   emoji:'❄️',               effect:'crystal_frost' },
];

const SITE_MAP = Object.fromEntries(SITES.map(s => [s.id, s]));

const CAT_COLOR: Record<SiteCategory, string> = {
  Supreme: '#D4AF37', Temporal: '#FF9933', LostCiv: '#40E0D0', Galactic: '#9932CC', Earth: '#4caf50',
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS EFFECT MAP — all 23 effects
// ─────────────────────────────────────────────────────────────────────────────

function buildCSS(site: SacredSite): string {
  const c = site.color;
  const g = site.glow;

  const base = `
    :root { --rc: ${c}; --rg: ${g}; }
    .resonance-border { border-color: ${c}40 !important; }
  `;

  const fx: Record<string, string> = {
    kailash_shimmer: `
      @keyframes km { 0%,100%{transform:translate(0,0)} 25%{transform:translate(.5px,0)} 50%{transform:translate(0,-.5px)} 75%{transform:translate(-.5px,0)} }
      @keyframes kaur { 0%,100%{opacity:.15} 50%{opacity:.4} }
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 0%,${c}22 0%,transparent 60%);animation:kaur 4s ease-in-out infinite}
      #root{animation:km .128s linear infinite}`,
    saffron_shield: `
      @keyframes sp{0%,100%{opacity:.12}50%{opacity:.28}}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;box-shadow:inset 0 0 120px ${c}55;background:radial-gradient(ellipse at 50% 50%,transparent 40%,${c}22 100%);border:3px solid ${c}40;animation:sp 3s ease-in-out infinite}`,
    lotus_petals: `
      @keyframes lf{0%{transform:translateY(-10vh) rotate(0deg);opacity:0}10%{opacity:.8}90%{opacity:.6}100%{transform:translateY(110vh) translateX(30px) rotate(360deg);opacity:0}}
      .lotus-petal{position:fixed;font-size:20px;pointer-events:none;z-index:1;animation:lf linear infinite}`,
    red_vortex: `
      @keyframes vs{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:conic-gradient(from 0deg,transparent,${c}11,transparent,${c}08,transparent);animation:vs 8s linear infinite}`,
    solar_ripples: `
      @keyframes sr{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.5);opacity:0}}
      body::after{content:'';position:fixed;bottom:10%;right:10%;width:200px;height:200px;border-radius:50%;border:2px solid ${c}60;pointer-events:none;z-index:0;animation:sr 3s ease-out infinite}`,
    avalon_mist: `
      @keyframes am{0%,100%{transform:translateX(-5px);opacity:.3}50%{transform:translateX(5px);opacity:.5}}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 30% 60%,${c}15 0%,transparent 50%),radial-gradient(ellipse at 70% 30%,${c}10 0%,transparent 40%);animation:am 6s ease-in-out infinite}`,
    diamond_sparkle: `
      @keyframes ds{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(${c}80 1px,transparent 1px);background-size:60px 60px;animation:ds 4s ease-in-out infinite}`,
    liquid_geometry: `
      @keyframes lg{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
      body::before{content:'';position:fixed;top:50%;left:50%;width:min(80vw,500px);height:min(80vw,500px);pointer-events:none;z-index:0;opacity:.07;background:repeating-conic-gradient(from 0deg,${c}40 0deg 1deg,transparent 1deg 60deg);animation:lg 30s linear infinite;border-radius:50%}`,
    tropical_aqua: `
      @keyframes ta{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:linear-gradient(135deg,${c}08,#FF69B408,${c}05);background-size:400% 400%;animation:ta 8s ease infinite}`,
    violet_grid: `
      @keyframes vg{0%,100%{opacity:.07}50%{opacity:.18}}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(${c}20 1px,transparent 1px),linear-gradient(90deg,${c}20 1px,transparent 1px);background-size:40px 40px;animation:vg .1s ease-in-out infinite}`,
    white_fire: `
      @keyframes wf{0%,100%{clip-path:polygon(0 100%,5% 70%,0 40%,8% 0,12% 40%,8% 70%,15% 100%)}50%{clip-path:polygon(0 100%,3% 60%,7% 30%,12% 0,18% 35%,12% 65%,15% 100%)}}
      body::before{content:'';position:fixed;left:0;top:0;bottom:0;width:30px;pointer-events:none;z-index:0;background:linear-gradient(to top,${c}00,${c}30,${c}10);animation:wf 2s ease-in-out infinite}
      body::after{content:'';position:fixed;right:0;top:0;bottom:0;width:30px;pointer-events:none;z-index:0;background:linear-gradient(to top,${c}00,${c}30,${c}10);animation:wf 2.3s ease-in-out infinite}`,
    torsion_field: `
      @keyframes tf{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
      body::before{content:'';position:fixed;top:50%;left:50%;width:min(90vw,600px);height:min(90vw,600px);pointer-events:none;z-index:0;opacity:.06;background:repeating-conic-gradient(${c}30 0deg 30deg,transparent 30deg 60deg);animation:tf 20s linear infinite;border-radius:50%}`,
    ka_gold: `
      @keyframes kg{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
      body{animation:kg 3s ease-in-out infinite}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 100%,${c}20 0%,transparent 60%)}`,
    double_sun: `
      @keyframes lf2{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.35;transform:scale(1.1)}}
      body::before{content:'';position:fixed;top:15%;right:15%;width:100px;height:100px;border-radius:50%;background:radial-gradient(circle,${c}60 0%,${c}00 70%);pointer-events:none;z-index:0;animation:lf2 4s ease-in-out infinite}
      body::after{content:'';position:fixed;top:18%;right:25%;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,${c}40 0%,${c}00 70%);pointer-events:none;z-index:0;animation:lf2 4s ease-in-out infinite .5s}`,
    water_flow: `
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:linear-gradient(180deg,${c}06 0%,transparent 40%);background-image:repeating-linear-gradient(0deg,${c}08 0px,transparent 2px,transparent 30px)}`,
    mirror_lake: `
      body::after{content:'';position:fixed;bottom:0;left:0;right:0;height:40%;pointer-events:none;z-index:0;background:linear-gradient(to bottom,transparent,${c}08);opacity:.3}`,
    etheric_trails: `
      *{transition:all .15s ease !important}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 50%,${c}05 0%,transparent 70%)}`,
    granite_wall: `
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:repeating-linear-gradient(0deg,${c}08 0px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,${c}05 0px,transparent 1px,transparent 30px)}`,
    solar_sync: `
      @keyframes ss{0%{top:10%;right:10%}50%{top:30%;right:20%}100%{top:10%;right:10%}}
      body::before{content:'';position:fixed;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,${c}50 0%,transparent 70%);pointer-events:none;z-index:0;animation:ss 10s ease-in-out infinite}`,
    crystal_lake: `
      @keyframes ping2{0%{transform:scale(1);opacity:.8}100%{transform:scale(3);opacity:0}}
      body::before{content:'';position:fixed;top:20%;left:50%;width:20px;height:20px;border-radius:50%;background:${c};pointer-events:none;z-index:0;animation:ping2 2s ease-out infinite;transform:translate(-50%,-50%)}`,
    zero_point: `
      body *{animation:none !important;transition:none !important}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 50%,${c}10 0%,transparent 70%)}`,
    red_ochre: `
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 80%,${c}15 0%,transparent 60%)}
      button,[role=button]{transition:transform .4s cubic-bezier(.68,-.55,.27,1.55) !important}`,
    crystal_frost: `
      @keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      body{animation:drift 6s ease-in-out infinite}
      body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 50%,${c}08 0%,transparent 70%)}`,
  };

  return base + (fx[site.effect] || '');
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO INJECTOR
// ─────────────────────────────────────────────────────────────────────────────

class FreqInjector {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  start(hz: number, pct: number) {
    if (hz === 0) { this.stop(); return; }
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.stop();
      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();
      this.osc.type = 'sine';
      this.osc.frequency.value = hz;
      this.gain.gain.value = (pct / 100) * 0.025; // ultra-subtle carrier
      this.osc.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.osc.start();
    } catch {}
  }

  stop() {
    try { this.osc?.stop(); this.osc?.disconnect(); this.gain?.disconnect(); this.osc = null; this.gain = null; } catch {}
  }

  setGain(pct: number) { if (this.gain) this.gain.gain.value = (pct / 100) * 0.025; }
}

const freq = new FreqInjector();

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL RESONANCE CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const ResonanceContext = createContext<ResonanceCtx | null>(null);
export const useResonance = () => {
  const c = useContext(ResonanceContext);
  if (!c) throw new Error('Must be inside GlobalResonanceProvider');
  return c;
};

const SK = 'shc_resonance_v5';
const load = (): ResonanceState => {
  try { const r = localStorage.getItem(SK); if (r) return JSON.parse(r); } catch {}
  return { activeSiteId: 'KAILASH', isLocked: false, intensity: 95, userEmail: null };
};
const save = (s: ResonanceState) => { try { localStorage.setItem(SK, JSON.stringify(s)); } catch {} };

export function GlobalResonanceProvider({ children, userEmail }: { children: ReactNode; userEmail?: string | null }) {
  const [state, setState] = useState<ResonanceState>(() => ({ ...load(), userEmail: userEmail ?? null }));
  const site = SITE_MAP[state.activeSiteId] ?? SITES[0];

  // CSS injection
  useEffect(() => {
    let el = document.getElementById('shc-res-css') as HTMLStyleElement;
    if (!el) { el = document.createElement('style'); el.id = 'shc-res-css'; document.head.appendChild(el); }
    el.textContent = buildCSS(site);
    return () => { if (el) el.textContent = ''; };
  }, [site]);

  // Audio injection
  useEffect(() => {
    if (state.isLocked) freq.start(site.frequency, state.intensity);
    else freq.stop();
    return () => freq.stop();
  }, [state.isLocked, site.frequency, state.intensity]);

  // Supabase cloud-anchor (24/7 persistence)
  useEffect(() => {
    if (!state.userEmail) return;
    const upsert = async () => {
      try {
        await (supabase as any).from('user_resonance_state').upsert({
          email: state.userEmail,
          active_site_id: state.activeSiteId,
          intensity: state.intensity,
          is_locked: state.isLocked,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      } catch {}
    };
    upsert();
  }, [state.activeSiteId, state.isLocked, state.intensity, state.userEmail]);

  // Load from cloud on mount
  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      try {
        const { data } = await (supabase as any).from('user_resonance_state').select('*').eq('email', userEmail).single();
        if (data) setState(p => ({ ...p, activeSiteId: data.active_site_id ?? p.activeSiteId, intensity: data.intensity ?? p.intensity, isLocked: data.is_locked ?? false }));
      } catch {}
    })();
  }, [userEmail]);

  const activate = useCallback((id: string) => setState(p => { const n = { ...p, activeSiteId: id }; save(n); return n; }), []);
  const setIntensity = useCallback((v: number) => { freq.setGain(v); setState(p => { const n = { ...p, intensity: v }; save(n); return n; }); }, []);
  const toggleLock = useCallback(() => setState(p => { const n = { ...p, isLocked: !p.isLocked }; save(n); return n; }), []);

  return (
    <ResonanceContext.Provider value={{ state, site, activate, setIntensity, toggleLock }}>
      <ParticleLayer site={site} active={state.isLocked} />
      {children}
    </ResonanceContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE LAYER (lotus petals / sparkles / mist)
// ─────────────────────────────────────────────────────────────────────────────

function ParticleLayer({ site, active }: { site: SacredSite; active: boolean }) {
  const needsParticles = active && ['lotus_petals', 'diamond_sparkle', 'avalon_mist'].includes(site.effect);
  if (!needsParticles) return null;
  const emoji = site.effect === 'lotus_petals' ? '🪷' : site.effect === 'diamond_sparkle' ? '✨' : '🌿';
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="lotus-petal"
          style={{ left: `${5 + i * 10}%`, animationDelay: `${i * 1.1}s`, animationDuration: `${6 + i * 0.7}s` }}>
          {emoji}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE SITE BADGE (floats on all pages while locked)
// ─────────────────────────────────────────────────────────────────────────────

export function ActiveSiteBadge() {
  const { state, site } = useResonance();
  if (!state.isLocked) return null;
  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border"
      style={{ background: 'rgba(0,0,0,0.8)', borderColor: site.color + '60', color: site.color, boxShadow: `0 0 16px ${site.glow}` }}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: site.color }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: site.color }} />
      </span>
      {site.emoji} {site.name}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI GLOBE
// ─────────────────────────────────────────────────────────────────────────────

function Globe({ site }: { site: SacredSite }) {
  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center mb-6"
      style={{ background: `radial-gradient(circle, ${site.color}12 0%, #050505 70%)` }}>
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${site.color}40 1px,transparent 1px),linear-gradient(90deg,${site.color}40 1px,transparent 1px)`, backgroundSize: '28px 28px' }} />
      {/* Rings */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute w-44 h-44 rounded-full border border-dashed" style={{ borderColor: site.color + '30' }} />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        className="absolute w-28 h-28 rounded-full border" style={{ borderColor: site.color + '25' }} />
      {/* Portal */}
      <motion.div animate={{ scale: [1, 1.07, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 3, repeat: Infinity }}
        className="z-10 w-20 h-20 rounded-full border-2 flex items-center justify-center bg-black/60 backdrop-blur-md"
        style={{ borderColor: site.color, boxShadow: `0 0 28px ${site.glow}` }}>
        <span className="text-3xl">{site.emoji}</span>
      </motion.div>
      {/* Frequency label */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] uppercase tracking-widest" style={{ color: site.color + '99' }}>
        {site.category} · {site.frequency > 0 ? `${site.frequency}Hz` : 'Zero Point'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SANCTUARY HUB COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const CATS: Array<SiteCategory | 'All'> = ['All', 'Supreme', 'Temporal', 'LostCiv', 'Galactic', 'Earth'];

export function SanctuaryHub() {
  const { state, site, activate, setIntensity, toggleLock } = useResonance();
  const [filter, setFilter] = useState<SiteCategory | 'All'>('All');

  const visible = filter === 'All' ? SITES : SITES.filter(s => s.category === filter);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 select-none" style={{ fontFamily: 'Georgia, serif' }}>

      {/* ── HEADER ── */}
      <div className="flex justify-between items-center px-5 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>
            Sanctuary Dashboard
          </h1>
          <p className="text-[10px] opacity-35 tracking-widest uppercase mt-0.5">23 Sacred Sites · Global Resonance</p>
        </div>
        <div className="px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold transition-all duration-500"
          style={{
            borderColor: state.isLocked ? '#D4AF37' : 'rgba(255,255,255,0.15)',
            color: state.isLocked ? '#D4AF37' : 'rgba(255,255,255,0.3)',
            boxShadow: state.isLocked ? '0 0 12px rgba(212,175,55,0.3)' : 'none',
          }}>
          {state.isLocked ? '⚡ Cloud-Anchor Active' : '○ Device Standby'}
        </div>
      </div>

      {/* ── GLOBE ── */}
      <div className="px-4">
        <Globe site={site} />
      </div>

      {/* ── ACTIVE SITE CARD ── */}
      <div className="px-4 mb-5">
        <div className="rounded-2xl p-4 border transition-all duration-500"
          style={{ background: `${site.color}0a`, borderColor: `${site.color}30`, boxShadow: `0 0 20px ${site.glow}` }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{site.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold tracking-wide truncate" style={{ color: site.color }}>
                {site.name}
                {site.multiplier && <span className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{site.multiplier}</span>}
              </div>
              <div className="text-[11px] opacity-45 mt-0.5 truncate">{site.subtitle}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] font-bold" style={{ color: CAT_COLOR[site.category] }}>{site.category}</div>
              <div className="text-[10px] opacity-35">{site.frequency > 0 ? `${site.frequency}Hz` : 'Stillness'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATS.map(cat => {
            const isActive = filter === cat;
            const col = cat === 'All' ? '#D4AF37' : CAT_COLOR[cat as SiteCategory];
            return (
              <button key={cat} onClick={() => setFilter(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all"
                style={{
                  borderColor: isActive ? col : 'rgba(255,255,255,0.1)',
                  background: isActive ? `${col}18` : 'transparent',
                  color: isActive ? col : 'rgba(255,255,255,0.35)',
                }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SITE GRID ── */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {visible.map(s => {
              const isActive = state.activeSiteId === s.id;
              return (
                <motion.button key={s.id} layout
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => activate(s.id)}
                  className="relative rounded-xl p-3 text-left border transition-all duration-300"
                  style={{
                    background: isActive ? `${s.color}14` : 'rgba(255,255,255,0.025)',
                    borderColor: isActive ? `${s.color}55` : 'rgba(255,255,255,0.07)',
                    boxShadow: isActive ? `0 0 18px ${s.glow}` : 'none',
                  }}>
                  {isActive && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />}
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className="text-xs font-bold leading-tight" style={{ color: isActive ? s.color : 'rgba(255,255,255,0.75)' }}>{s.name}</div>
                  <div className="text-[9px] opacity-35 mt-0.5 leading-tight line-clamp-1">{s.subtitle}</div>
                  {s.multiplier && <div className="mt-1 text-[9px] font-black" style={{ color: s.color }}>{s.multiplier}</div>}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── CONTROLS ── */}
      <div className="px-4 space-y-3">
        {/* Intensity */}
        <div className="rounded-2xl p-4 border border-white/[0.07] bg-white/[0.025]">
          <div className="flex justify-between mb-3 text-[10px] uppercase tracking-widest">
            <span className="opacity-35">Vibrational Intensity</span>
            <span className="font-bold" style={{ color: site.color }}>{state.intensity}% Activation</span>
          </div>
          <input type="range" min={0} max={100} value={state.intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full" style={{ accentColor: site.color }} />
          <div className="flex justify-between text-[9px] opacity-20 mt-1">
            <span>Dormant</span><span>Full Activation</span>
          </div>
        </div>

        {/* Temple Lock */}
        <motion.button onClick={toggleLock} whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-xl border-2 font-bold uppercase tracking-[0.2em] text-sm transition-all duration-500"
          style={state.isLocked ? {
            background: site.color, borderColor: site.color, color: '#000',
            boxShadow: `0 0 30px ${site.glow}, 0 0 60px ${site.glow}`,
          } : {
            background: 'transparent', borderColor: `${site.color}40`, color: site.color,
          }}>
          {state.isLocked ? `🔒 Temple Locked 24/7 — ${site.name}` : `⚡ Activate 24/7 Home Anchor`}
        </motion.button>

        <AnimatePresence>
          {state.isLocked && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center text-[10px] opacity-40 uppercase tracking-widest">
              {site.frequency > 0 ? `${site.frequency}Hz` : 'Zero Point'} · Coating all audio · Persisted 24/7
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[9px] text-center text-gray-700 mt-8 uppercase tracking-widest px-4">
        Temple Home License · 23 Sites · Admin Access · sacredhealingvibe@gmail.com
      </p>
    </div>
  );
}

export default SanctuaryHub;
