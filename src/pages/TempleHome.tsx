import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Sparkles, Home, Activity, Zap, Info, X,
  BookOpen, ChevronRight, ArrowLeft, Lock, Shield, Flame,
  Droplets, Moon, Music, Star, Clock,
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import TempleGateIcon from '@/components/icons/TempleGateIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { templeHomeSiteSignatures } from '@/i18n/locales/templeHome';

// ─── Site Registry V3.0 — 26 Portals (names/focus via i18n) ──────────────────
const SACRED_SITE_LIST = [
  { id: 'giza', reach: 50, color: '#FFD700' },
  { id: 'arunachala', reach: 45, color: '#F5DEB3' },
  { id: 'samadhi', reach: 25, color: '#E6E6FA' },
  { id: 'babaji', reach: 20, color: '#FFFFFF' },
  { id: 'machu_picchu', reach: 35, color: '#FFA500' },
  { id: 'lourdes', reach: 20, color: '#ADD8E6' },
  { id: 'mansarovar', reach: 30, color: '#00CED1' },
  { id: 'zimbabwe', reach: 40, color: '#8B4513' },
  { id: 'shasta', reach: 20, color: '#DA70D6' },
  { id: 'luxor', reach: 30, color: '#FFCC00' },
  { id: 'uluru', reach: 40, color: '#B22222' },
  { id: 'kailash_13x', reach: 100, color: '#7B61FF' },
  { id: 'glastonbury', reach: 40, color: '#00FF7F' },
  { id: 'sedona', reach: 35, color: '#FF4500' },
  { id: 'titicaca', reach: 45, color: '#FFD700' },
  { id: 'amritsar', reach: 80, color: '#FFD700' },
  { id: 'mauritius', reach: 90, color: '#F0E68C' },
  { id: 'shirdi', reach: 85, color: '#FF6B35' },
  { id: 'vrindavan_krsna', reach: 75, color: '#1E90FF' },
  { id: 'ayodhya_rama', reach: 75, color: '#FFA500' },
  { id: 'lemuria', reach: 60, color: '#40E0D0' },
  { id: 'atlantis', reach: 60, color: '#6080DD' },
  { id: 'pleiades', reach: 100, color: '#E0FFFF' },
  { id: 'sirius', reach: 100, color: '#4169E1' },
  { id: 'arcturus', reach: 100, color: '#9932CC' },
  { id: 'lyra', reach: 100, color: '#FFFFFF' },
] as const;

const SITE_BG: Record<string, { gradient: string; overlay?: string }> = {
  kailash_13x: {
    gradient: 'radial-gradient(ellipse 120% 80% at 50% 100%, #1a0533 0%, #2d0d5c 35%, #0d0520 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(123,97,255,0.12) 0%, rgba(212,175,55,0.06) 60%, transparent 100%)',
  },
  amritsar: {
    gradient: 'radial-gradient(ellipse 120% 60% at 50% 100%, #1a1000 0%, #2d1f00 30%, #0d0a00 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, transparent 40%, rgba(212,175,55,0.18) 80%, rgba(212,175,55,0.28) 100%)',
  },
  ayodhya_rama: {
    gradient: 'radial-gradient(ellipse 100% 70% at 50% 80%, #2d1000 0%, #4a1e00 35%, #1a0800 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,140,0,0.06) 0%, rgba(205,90,0,0.14) 60%, transparent 100%)',
  },
  vrindavan_krsna: {
    gradient: 'radial-gradient(ellipse 110% 70% at 50% 60%, #001428 0%, #001e3d 35%, #00091a 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(30,144,255,0.08) 0%, rgba(0,80,40,0.10) 60%, transparent 100%)',
  },
  glastonbury: {
    gradient: 'radial-gradient(ellipse 110% 70% at 50% 70%, #001a0a 0%, #003318 35%, #000f07 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(0,255,127,0.04) 0%, rgba(0,180,80,0.10) 60%, transparent 100%)',
  },
  giza: {
    gradient: 'radial-gradient(ellipse 120% 80% at 50% 100%, #0d0900 0%, #1a1200 35%, #0a0700 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(0,0,20,0.7) 0%, rgba(20,15,0,0.3) 70%, rgba(212,175,55,0.05) 100%)',
  },
  sedona: {
    gradient: 'radial-gradient(ellipse 110% 70% at 50% 80%, #2a0800 0%, #4a1200 35%, #1a0500 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,69,0,0.07) 0%, rgba(180,40,0,0.16) 60%, transparent 100%)',
  },
  pleiades: {
    gradient: 'radial-gradient(ellipse 120% 90% at 50% 40%, #00101e 0%, #001828 35%, #000a14 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(224,255,255,0.04) 0%, rgba(65,105,225,0.07) 60%, transparent 100%)',
  },
  sirius: {
    gradient: 'radial-gradient(ellipse 120% 80% at 50% 40%, #000820 0%, #000d30 35%, #000510 60%, #050505 100%)',
  },
  arcturus: {
    gradient: 'radial-gradient(ellipse 110% 80% at 50% 40%, #0d0020 0%, #1a0035 35%, #08001a 60%, #050505 100%)',
  },
  mauritius: {
    gradient: 'radial-gradient(ellipse 110% 70% at 50% 40%, #0a0a00 0%, #141400 35%, #070700 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, rgba(240,230,140,0.05) 0%, rgba(200,190,80,0.03) 60%, transparent 100%)',
  },
  shirdi: {
    gradient: 'radial-gradient(ellipse 100% 80% at 50% 100%, #1a0800 0%, #2a1200 35%, #0f0600 60%, #050505 100%)',
    overlay: 'linear-gradient(180deg, transparent 55%, rgba(255,107,53,0.10) 80%, rgba(255,107,53,0.18) 100%)',
  },
};

type SiteCategoryKey = 'MIRACLE-CLASS' | 'GALACTIC' | 'TEMPORAL' | 'ANCIENT' | 'SUPREME' | 'EARTH';
const SITE_CATEGORY_ORDER: SiteCategoryKey[] = ['MIRACLE-CLASS','GALACTIC','TEMPORAL','ANCIENT','SUPREME','EARTH'];

const MODE_DEFS = [
  { id: 'ADMIN', intensity: 1.0 },
  { id: 'INTEGRATION', intensity: 0.25 },
  { id: 'TEMPLE_LOCK', intensity: 0.6 },
] as const;

const RESIDUAL_PRESET_DEFS = [
  { id: 'studio', icon: 'music' as const, site: 'pleiades', intensity: 80, mode: 'INTEGRATION', color: '#22D3EE' },
  { id: 'sleep', icon: 'moon' as const, site: 'babaji', intensity: 30, mode: 'INTEGRATION', color: '#E6E6FA' },
  { id: 'sleep_stress', icon: 'moon' as const, site: 'shirdi', intensity: 25, mode: 'INTEGRATION', color: '#FF6B35' },
  { id: 'protection', icon: 'shield' as const, site: 'ayodhya_rama', intensity: 70, mode: 'TEMPLE_LOCK', color: '#FFA500' },
  { id: 'healing', icon: 'star' as const, site: 'lourdes', intensity: 60, mode: 'INTEGRATION', color: '#ADD8E6' },
  { id: 'abundance', icon: 'sparkle' as const, site: 'amritsar', intensity: 65, mode: 'INTEGRATION', color: '#FFD700' },
];

const HEALING_RX_DEFS = [
  { id: 'anxiety', icon: '🌿', color: '#FF6B35', primary: 'shirdi', primaryIntensity: 45, backup: 'babaji', backupIntensity: 30, hydration: false },
  { id: 'creative_block', icon: '✦', color: '#22D3EE', primary: 'pleiades', primaryIntensity: 80, backup: 'sedona', backupIntensity: 65, hydration: false },
  { id: 'physical_healing', icon: '💙', color: '#ADD8E6', primary: 'lourdes', primaryIntensity: 60, backup: 'arcturus', backupIntensity: 55, hydration: true },
  { id: 'relationship', icon: '💚', color: '#00FF7F', primary: 'glastonbury', primaryIntensity: 55, backup: 'vrindavan_krsna', backupIntensity: 60, hydration: false },
  { id: 'mantra_power', icon: '🔮', color: '#7B61FF', primary: 'kailash_13x', primaryIntensity: 70, backup: 'sirius', backupIntensity: 65, hydration: true },
  { id: 'karmic_clearing', icon: '♾', color: '#7B61FF', primary: 'kailash_13x', primaryIntensity: 85, backup: 'arunachala', backupIntensity: 70, hydration: true },
  { id: 'miracle', icon: '✦', color: '#F0E68C', primary: 'mauritius', primaryIntensity: 60, backup: 'amritsar', backupIntensity: 70, hydration: true },
  { id: 'abundance_seva', icon: '🌊', color: '#FFD700', primary: 'amritsar', primaryIntensity: 65, backup: 'machu_picchu', backupIntensity: 70, hydration: false },
] as const;

const SITE_DB_BIO_IDS = new Set<string>([
  'kailash_13x','glastonbury','sedona','titicaca','amritsar','mauritius','shirdi','vrindavan_krsna','ayodhya_rama','lemuria','atlantis','pleiades','sirius','arcturus','lyra',
]);

function getSiteCategory(id: string): { key: SiteCategoryKey; color: string } {
  if (['pleiades','sirius','arcturus','lyra'].includes(id)) return { key: 'GALACTIC', color: '#22D3EE' };
  if (['vrindavan_krsna','ayodhya_rama'].includes(id)) return { key: 'TEMPORAL', color: '#F59E0B' };
  if (['lemuria','atlantis'].includes(id)) return { key: 'ANCIENT', color: '#A78BFA' };
  if (['kailash_13x','glastonbury','sedona','titicaca'].includes(id)) return { key: 'SUPREME', color: '#D4AF37' };
  if (['amritsar','mauritius','shirdi'].includes(id)) return { key: 'MIRACLE-CLASS', color: '#FF9FD2' };
  return { key: 'EARTH', color: '#4ADE80' };
}
// ─── Persistence ──────────────────────────────────────────────────────────────
const ANCHOR_KEY = 'sh:temple_home_anchor';
interface AnchorState { siteId: string; intensity: number; mode: string; anchored: boolean; ts: number; }
function loadAnchor(): AnchorState | null {
  try { const r = localStorage.getItem(ANCHOR_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveAnchor(s: AnchorState) { try { localStorage.setItem(ANCHOR_KEY, JSON.stringify(s)); } catch {} }

const CRYSTAL_KEY = 'sh:crystal_setup_done';
function loadCrystalDone(): boolean {
  try {
    return localStorage.getItem(CRYSTAL_KEY) === '1';
  } catch {
    return false;
  }
}
function saveCrystalDone(): void {
  try {
    localStorage.setItem(CRYSTAL_KEY, '1');
  } catch {
    /* noop */
  }
}

// ─── Divine Sparks (Mauritius) ────────────────────────────────────────────────
function DivineSparks() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const sparks: { x: number; y: number; a: number; r: number }[] = [];
    let id: number;
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      if (Math.random() < 0.4) sparks.push({ x: Math.random() * c.width, y: Math.random() * c.height, a: 1, r: Math.random() * 2.5 + 0.5 });
      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].a -= 0.035;
        ctx.beginPath(); ctx.arc(sparks[i].x, sparks[i].y, sparks[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,230,${sparks[i].a})`; ctx.fill();
        if (sparks[i].a <= 0) sparks.splice(i, 1);
      }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[1]" style={{ mixBlendMode: 'screen' }} />;
}

// ─── Cinematic site backgrounds ───────────────────────────────────────────────
function CinematicBackground({ siteId, siteColor, intensity }: {
  siteId: string;
  siteColor: string;
  intensity: number;
}) {
  const bg = SITE_BG[siteId];
  const opHex = Math.min(255, Math.round(intensity * 0.18)).toString(16).padStart(2, '0');
  const gradient = bg?.gradient
    ?? `radial-gradient(ellipse 80% 60% at 50% 30%, ${siteColor}18 0%, #050505 70%)`;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: gradient, transition: 'all 2.5s ease' }}
      />
      {bg?.overlay && (
        <div
          className="absolute inset-0"
          style={{ background: bg.overlay, transition: 'all 2.5s ease' }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 30% at 50% 15%, ${siteColor}${opHex} 0%, transparent 65%)`,
          transition: 'all 1.5s ease',
        }}
      />
      {siteId === 'amritsar' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{
            background: 'linear-gradient(to top, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 60%, transparent 100%)',
            animation: 'amrit-ripple 4s ease-in-out infinite',
          }}
        />
      )}
      {siteId === 'shirdi' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-64"
          style={{
            background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,107,53,0.15) 0%, transparent 70%)',
            animation: 'dhuni-flicker 3s ease-in-out infinite',
          }}
        />
      )}
      {siteId === 'kailash_13x' && (
        <div
          className="absolute top-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(180deg, rgba(123,97,255,0.12) 0%, transparent 100%)',
            animation: 'schumann-pulse 7.83s ease-in-out infinite',
          }}
        />
      )}
      {siteId === 'pleiades' && (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.06,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      )}
      {siteId === 'glastonbury' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2"
          style={{
            background: 'radial-gradient(ellipse 100% 50% at 50% 100%, rgba(0,180,80,0.1) 0%, transparent 70%)',
          }}
        />
      )}
      {siteId === 'sedona' && (
        <div
          className="absolute top-0 right-0 w-64 h-64"
          style={{
            opacity: 0.08,
            background: 'radial-gradient(circle at 80% 20%, rgba(255,69,0,0.6) 0%, transparent 60%)',
            animation: 'sedona-spiral 14s linear infinite',
          }}
        />
      )}
      {siteId === 'vrindavan_krsna' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 60%, rgba(30,144,255,0.07) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
}

// ─── Sigil Ring ───────────────────────────────────────────────────────────────
function SigilRing({ color, intensity, anchored, miracle }: { color: string; intensity: number; anchored: boolean; miracle: boolean }) {
  return (
    <div className="relative flex items-center justify-center h-36 w-36 mx-auto my-2">
      <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${color}40`, boxShadow: anchored ? `0 0 ${miracle ? 60 : 30}px ${color}40` : `0 0 10px ${color}15`, animation: anchored ? 'spin 12s linear infinite' : undefined }} />
      <div className="absolute inset-3 rounded-full border" style={{ borderColor: `${color}60`, animation: anchored ? 'spin-reverse 8s linear infinite' : undefined }} />
      {miracle && <div className="absolute inset-1 rounded-full border border-dashed" style={{ borderColor: `${color}25`, animation: 'spin 20s linear infinite' }} />}
      <div className="absolute inset-6 rounded-full" style={{ background: `radial-gradient(circle,${color}25 0%,transparent 70%)`, boxShadow: `0 0 ${miracle ? 40 : 20}px ${color}20` }} />
      <div className="relative z-10 text-center">
        <div className="text-2xl font-black" style={{ color, textShadow: `0 0 20px ${color}60` }}>{intensity}</div>
        <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-white/30">%</div>
      </div>
    </div>
  );
}

function GlassCard({ children, className = '', glow = false, style = {} }: { children: React.ReactNode; className?: string; glow?: boolean; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-[28px] border transition-all duration-300 ${className}`} style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: glow ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(255,255,255,0.05)', boxShadow: glow ? '0 0 40px rgba(212,175,55,0.05),inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.03)', ...style }}>{children}</div>
  );
}

// ─── Motion-based Nadi Scanner (no GPS) ───────────────────────────────────────
function motionZoneColor(sat: number): string {
  if (sat > 90) return '#D4AF37';
  if (sat > 70) return '#22D3EE';
  if (sat > 45) return '#A78BFA';
  return 'rgba(255,255,255,0.35)';
}
function calcMotionSat(variance: number, intensity: number): number {
  const stillness = Math.max(0, 1 - variance / 10);
  return Math.round(intensity * (0.3 + 0.7 * stillness));
}

function MotionNadiScanner({ intensity }: { intensity: number }) {
  const { t } = useTranslation();
  const zoneFromSat = useCallback((sat: number) => {
    if (sat > 90) return t('templeHome.motion.zone_core');
    if (sat > 70) return t('templeHome.motion.zone_high');
    if (sat > 45) return t('templeHome.motion.zone_integration');
    return t('templeHome.motion.zone_peripheral');
  }, [t]);
  const [motionState, setMotionState] = useState<'idle' | 'active' | 'unavailable'>('idle');
  const [variance, setVariance] = useState(0);
  const [saturation, setSaturation] = useState<number | null>(null);
  const [zone, setZone] = useState('');
  const samplesRef = useRef<number[]>([]);
  const handlerRef = useRef<((e: Event) => void) | null>(null);
  const intensityRef = useRef(intensity);

  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  useEffect(() => {
    if (motionState === 'active') {
      const sat = calcMotionSat(variance, intensity);
      setSaturation(sat);
      setZone(zoneFromSat(sat));
    }
  }, [intensity, motionState, variance, zoneFromSat]);

  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener('devicemotion', handlerRef.current);
      }
    };
  }, []);

  const startScan = useCallback(async () => {
    const win = window as unknown as Record<string, unknown>;
    if (!('DeviceMotionEvent' in win)) {
      setMotionState('unavailable');
      return;
    }
    const DME = win['DeviceMotionEvent'] as { requestPermission?: () => Promise<string> };
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        if (result !== 'granted') { setMotionState('unavailable'); return; }
      } catch {
        setMotionState('unavailable');
        return;
      }
    }
    setMotionState('active');
    samplesRef.current = [];

    const handler = (e: Event) => {
      const me = e as Event & {
        accelerationIncludingGravity?: { x: number | null; y: number | null; z: number | null };
      };
      const acc = me.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      samplesRef.current.push(mag);
      if (samplesRef.current.length > 20) samplesRef.current.shift();
      const mean = samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length;
      const vr = Math.min(
        samplesRef.current.reduce((a, b) => a + (b - mean) ** 2, 0) / samplesRef.current.length,
        10
      );
      setVariance(vr);
      const sat = calcMotionSat(vr, intensityRef.current);
      setSaturation(sat);
      setZone(zoneFromSat(sat));
    };
    handlerRef.current = handler;
    window.addEventListener('devicemotion', handler);
  }, [zoneFromSat]);

  const zoneColor = saturation !== null ? motionZoneColor(saturation) : '#D4AF37';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              motionState === 'active'
                ? 'bg-emerald-400 animate-pulse'
                : motionState === 'unavailable'
                ? 'bg-red-400'
                : 'bg-white/20'
            }`}
          />
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">
            {motionState === 'active'
              ? t('templeHome.motion.scannerActive')
              : motionState === 'unavailable'
              ? t('templeHome.motion.unavailable')
              : t('templeHome.motion.idleLabel')}
          </span>
        </div>
        {motionState === 'active' && (
          <span className="text-[9px] font-mono text-white/20">σ²={variance.toFixed(2)}</span>
        )}
      </div>

      {motionState === 'active' && saturation !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.12)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/25 mb-1">{t('templeHome.motion.fieldSaturation')}</div>
              <div className="text-3xl font-black tabular-nums" style={{ color: zoneColor, textShadow: `0 0 20px ${zoneColor}50` }}>
                {saturation}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/25 mb-1">{t('templeHome.motion.zone')}</div>
              <div className="text-[11px] font-extrabold" style={{ color: zoneColor }}>
                {zone.split('—')[0].trim()}
              </div>
            </div>
          </div>
          <div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${saturation}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ background: `linear-gradient(90deg, ${zoneColor}50, ${zoneColor})` }}
              />
            </div>
            {zone.includes('—') && (
              <p className="text-[9px] text-white/30 mt-1 italic">{zone.split('—')[1]?.trim()}</p>
            )}
          </div>
          <div className="pt-1 border-t border-white/[0.04]">
            <p className="text-[10px] text-white/30 leading-relaxed">
              {variance < 1
                ? t('templeHome.motion.stillHint')
                : variance < 3
                ? t('templeHome.motion.slightHint')
                : t('templeHome.motion.movingHint')}
            </p>
          </div>
        </motion.div>
      )}

      {motionState === 'active' && (
        <div className="space-y-1.5">
          {[
            { label: t('templeHome.motion.legend_core_label'), range: t('templeHome.motion.legend_core_range'), color: '#D4AF37', active: variance < 1 },
            { label: t('templeHome.motion.legend_high_label'), range: t('templeHome.motion.legend_high_range'), color: '#22D3EE', active: variance >= 1 && variance < 3 },
            { label: t('templeHome.motion.legend_int_label'), range: t('templeHome.motion.legend_int_range'), color: '#A78BFA', active: variance >= 3 && variance < 6 },
            { label: t('templeHome.motion.legend_per_label'), range: t('templeHome.motion.legend_per_range'), color: 'rgba(255,255,255,0.3)', active: variance >= 6 },
          ].map(z => (
            <div
              key={z.label}
              className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{
                background: z.active ? `${z.color}10` : 'rgba(255,255,255,0.01)',
                border: z.active ? `1px solid ${z.color}30` : '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: z.active ? z.color : 'rgba(255,255,255,0.12)' }} />
                <span className="text-[10px] font-medium" style={{ color: z.active ? z.color : 'rgba(255,255,255,0.28)' }}>
                  {z.label}
                </span>
              </div>
              <span className="text-[8px] font-mono" style={{ color: z.active ? z.color : 'rgba(255,255,255,0.18)' }}>
                {z.range}
              </span>
            </div>
          ))}
        </div>
      )}

      {motionState === 'idle' && (
        <button
          type="button"
          onClick={() => { void startScan(); }}
          className="w-full py-3 rounded-2xl text-[10px] font-extrabold tracking-[0.25em] uppercase transition-all"
          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', color: '#22D3EE' }}
        >
          {t('templeHome.motion.activate')}
        </button>
      )}

      {motionState === 'unavailable' && (
        <div
          className="py-3 px-4 rounded-2xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[11px] text-white/35">{t('templeHome.motion.unavailableBody')}</p>
          <p className="text-[10px] text-white/20 mt-1">{t('templeHome.motion.unavailableSub')}</p>
        </div>
      )}
    </div>
  );
}

const CRYSTAL_STEP_KEYS = ['NW', 'NE', 'SE', 'SW'] as const;

function CrystalSetupFlow({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const allDone = confirmed.size === CRYSTAL_STEP_KEYS.length;

  const confirmStep = (idx: number) => {
    setConfirmed((prev) => {
      const n = new Set(prev);
      n.add(idx);
      return n;
    });
    if (idx < CRYSTAL_STEP_KEYS.length - 1) {
      setTimeout(() => setStep(idx + 1), 500);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 mb-2">{t('templeHome.crystal.sectionTitle')}</div>
        <p className="text-[11px] text-white/35 leading-relaxed max-w-xs mx-auto">
          {t('templeHome.crystal.intro')}
        </p>
      </div>

      <div className="flex justify-center gap-3 py-1">
        {CRYSTAL_STEP_KEYS.map((ck, i) => (
          <div key={ck} className="flex flex-col items-center gap-1">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-500"
              style={{
                background: confirmed.has(i) ? 'rgba(74,222,128,0.15)' : step === i ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                border: confirmed.has(i) ? '1px solid rgba(74,222,128,0.4)' : step === i ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {confirmed.has(i) ? (
                <span className="text-emerald-400 text-sm">✓</span>
              ) : (
                <span className="text-[10px] font-black" style={{ color: step === i ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}>
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className="text-[7px] tracking-widest uppercase"
              style={{ color: confirmed.has(i) ? 'rgba(74,222,128,0.6)' : step === i ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)' }}
            >
              {ck}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-[24px] p-5 space-y-3"
          style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-[14px] flex items-center justify-center text-lg"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}
            >
              💎
            </div>
            <div>
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/50">{t('templeHome.crystal.stepOf', { n: step + 1 })}</div>
              <div className="text-sm font-black text-white/80">{t(`templeHome.crystal.CRYSTAL_${step}_label`)}</div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-[#D4AF37]/40">
                {t(`templeHome.crystal.corner_${CRYSTAL_STEP_KEYS[step]}`)}{t('templeHome.crystal.cornerSuffix')}
              </div>
            </div>
          </div>
          <p className="text-[12px] text-white/50 leading-relaxed">{t(`templeHome.crystal.CRYSTAL_${step}_instruction`)}</p>
          {!confirmed.has(step) ? (
            <button
              type="button"
              onClick={() => confirmStep(step)}
              className="w-full py-3 rounded-2xl text-[10px] font-extrabold tracking-[0.3em] uppercase transition-all hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.08))',
                border: '1px solid rgba(212,175,55,0.35)',
                color: '#D4AF37',
              }}
            >
              {t('templeHome.crystal.confirm')}
            </button>
          ) : (
            <div
              className="w-full py-3 rounded-2xl text-[10px] font-extrabold tracking-[0.3em] uppercase text-center"
              style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ADE80' }}
            >
              {t('templeHome.crystal.anchored')}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[24px] p-5 text-center space-y-3"
            style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)' }}
          >
            <div className="text-2xl">🔮</div>
            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-emerald-400/70">{t('templeHome.crystal.sealedTitle')}</div>
            <p className="text-[11px] text-white/45 leading-relaxed">
              {t('templeHome.crystal.sealedBody')}
            </p>
            <button
              type="button"
              onClick={() => {
                saveCrystalDone();
                onComplete();
              }}
              className="w-full py-3.5 rounded-2xl text-[11px] font-extrabold tracking-[0.3em] uppercase text-black transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg,#4ADE80,#22C55E)', boxShadow: '0 0 20px rgba(74,222,128,0.3)' }}
            >
              {t('templeHome.crystal.sealCTA')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          saveCrystalDone();
          onComplete();
        }}
        className="w-full text-center text-[9px] text-white/20 hover:text-white/40 tracking-[0.3em] uppercase transition-colors py-1"
      >
        {t('templeHome.crystal.skip')}
      </button>
    </div>
  );
}

// ─── TempleHomeInner ──────────────────────────────────────────────────────────
function TempleHomeInner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { isLoading: authLoading } = useAuth();
  const saved = loadAnchor();

  const [selectedSite, setSelectedSite] = useState(saved?.siteId || 'giza');
  const [auraIntensity, setAuraIntensity] = useState(saved?.intensity ?? 100);
  const [currentMode, setCurrentMode] = useState(saved?.mode || 'INTEGRATION');
  const [isAnchored, setIsAnchored] = useState(saved?.anchored || false);
  const [showSpatialMap, setShowSpatialMap] = useState(false);
  const [infoSiteId, setInfoSiteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [anchorFlash, setAnchorFlash] = useState(false);
  const [activeTab, setActiveTab] = useState<'PORTAL' | 'HEALING' | 'PRESCRIPTIONS'>('PORTAL');
  const [presetFlash, setPresetFlash] = useState<string | null>(null);
  const [showHydrationAlert, setShowHydrationAlert] = useState(false);
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [crystalDone, setCrystalDone] = useState(() => loadCrystalDone());
  const [showCrystalSetup, setShowCrystalSetup] = useState(false);

  const siteTitle = (id: string) => t(`templeHome.sites.${id}.name`);
  const siteFocusLine = (id: string) => t(`templeHome.sites.${id}.focus`);

  const currentSite = SACRED_SITE_LIST.find(s => s.id === selectedSite)!;
  const activeMode = MODE_DEFS.find(m => m.id === currentMode)!;
  const activeModeName = t(`templeHome.modes.${currentMode}_name`);
  const activeModeDesc = t(`templeHome.modes.${currentMode}_desc`);
  const cat = getSiteCategory(selectedSite);
  const catLabel = t(`templeHome.siteCategories.${cat.key}`);
  const isMiracle = ['amritsar','mauritius','shirdi'].includes(selectedSite);
  const intensityLabel = selectedSite === 'shirdi'
    ? t('templeHome.siteDb.shirdi.intensityLabel')
    : t('templeHome.intensity.defaultLabel');
  const siteBgScene = SITE_BG[selectedSite]
    ? t(`templeHome.siteBg.${selectedSite}.scene`)
    : null;
  const dbBio = SITE_DB_BIO_IDS.has(selectedSite) ? t(`templeHome.siteDb.${selectedSite}.bio`) : '';
  const dbInstruction = t(`templeHome.siteDb.${selectedSite}.instruction`);
  const signatureCode = templeHomeSiteSignatures[selectedSite] ?? '—';

  useEffect(() => { saveAnchor({ siteId: selectedSite, intensity: auraIntensity, mode: currentMode, anchored: isAnchored, ts: Date.now() }); }, [selectedSite, auraIntensity, currentMode, isAnchored]);
  useEffect(() => { setIsSyncing(true); const t = setTimeout(() => setIsSyncing(false), 800); return () => clearTimeout(t); }, [selectedSite, auraIntensity]);

  // Auto-trigger hydration alert for high-voltage sites above threshold
  const HIGH_VOLTAGE_SITES = ['mauritius', 'kailash_13x'];
  useEffect(() => {
    if (HIGH_VOLTAGE_SITES.includes(selectedSite) && auraIntensity >= 60) {
      const timer = setTimeout(() => setShowHydrationAlert(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setShowHydrationAlert(false);
    }
  }, [selectedSite, auraIntensity]);

  const applyPreset = (preset: typeof RESIDUAL_PRESET_DEFS[number]) => {
    setSelectedSite(preset.site);
    setAuraIntensity(preset.intensity);
    setCurrentMode(preset.mode);
    setPresetFlash(preset.id);
    setTimeout(() => setPresetFlash(null), 2500);
  };

  if (authLoading || adminLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
        <p className="text-[8px] tracking-[0.5em] uppercase text-[#D4AF37]/40">{t('templeHome.loading')}</p>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <CinematicBackground siteId="giza" siteColor="#D4AF37" intensity={30} />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="h-16 w-16 rounded-full border border-[#D4AF37]/20 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.05)', boxShadow: '0 0 40px rgba(212,175,55,0.1)' }}>
          <Lock className="h-7 w-7 text-[#D4AF37]/60" />
        </div>
        <div className="space-y-2">
          <p className="text-[8px] tracking-[0.5em] uppercase text-[#D4AF37]/40">{t('templeHome.gate.kicker')}</p>
          <h2 className="text-xl font-black tracking-tight text-[#D4AF37]" style={{ textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>{t('templeHome.gate.title')}</h2>
          <p className="text-xs text-white/40 leading-relaxed">{t('templeHome.gate.body')}</p>
        </div>
        <GlassCard className="w-full p-4" glow>
          <div className="text-[8px] tracking-[0.4em] uppercase text-[#D4AF37]/40 mb-1">{t('templeHome.gate.permanent')}</div>
          <div className="text-2xl font-black text-[#D4AF37]" style={{ textShadow: '0 0 15px rgba(212,175,55,0.3)' }}>€499</div>
          <div className="text-[10px] text-white/30 mt-1">{t('templeHome.gate.priceNote')}</div>
        </GlassCard>
        <button onClick={() => navigate('/shop')} className="w-full py-4 rounded-[20px] text-[11px] font-extrabold tracking-[0.3em] uppercase text-black transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg,#D4AF37,#F0C040,#D4AF37)', boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}>{t('templeHome.gate.unlock')}</button>
        <button onClick={() => navigate('/akasha-infinity')} className="text-[10px] text-white/25 hover:text-[#D4AF37]/60 tracking-[0.2em] uppercase transition-colors">{t('templeHome.gate.exploreAkasha')}</button>
        <button onClick={() => navigate('/explore')} className="text-[10px] text-[#D4AF37]/40 hover:text-[#D4AF37]/70 tracking-[0.2em] uppercase transition-colors">{t('templeHome.gate.returnLibrary')}</button>
      </div>
    </div>
  );

  // Original healing activations (unchanged)
  const bliss = auraIntensity > 90 ? { message: t('templeHome.healingStates.bliss_message'), instruction: t('templeHome.healingStates.bliss_instruction') } : null;
  const deepSync = selectedSite === 'babaji' && auraIntensity > 70 ? { sensations: [t('templeHome.healingStates.deepSync_s1'), t('templeHome.healingStates.deepSync_s2'), t('templeHome.healingStates.deepSync_s3')], guidance: t('templeHome.healingStates.deepSync_guidance') } : null;
  const heartExpansion = selectedSite === 'babaji' && auraIntensity > 85 ? { advice: t('templeHome.healingStates.heart_advice'), quote: t('templeHome.healingStates.heart_quote') } : null;
  const luxorHealer = selectedSite === 'luxor' && auraIntensity > 70 ? { instruction: t('templeHome.healingStates.luxor_instruction') } : null;
  // Miracle activations
  const amritsarSeva = selectedSite === 'amritsar' && auraIntensity > 40;
  const mauritiusSpark = selectedSite === 'mauritius' && auraIntensity > 50;
  const shirdiDhuni = selectedSite === 'shirdi' && auraIntensity > 30;

  const handleAnchor = () => {
    if (!crystalDone) {
      setShowCrystalSetup(true);
      return;
    }
    setIsAnchored(true);
    setAnchorFlash(true);
    setTimeout(() => setAnchorFlash(false), 3000);
  };
  const handleModeChange = (id: string) => { setCurrentMode(id); const m = MODE_DEFS.find(x => x.id === id); if (m) setAuraIntensity(m.intensity * 100); };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <CinematicBackground siteId={selectedSite} siteColor={currentSite.color} intensity={auraIntensity} />
      {selectedSite === 'mauritius' && <DivineSparks />}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes spin-reverse{to{transform:rotate(-360deg)}}
        @keyframes amrit-ripple{0%,100%{opacity:.7;transform:scaleX(1)}50%{opacity:1;transform:scaleX(1.03)}}
        @keyframes dhuni-flicker{0%,100%{opacity:.6}33%{opacity:1}66%{opacity:.75}}
        @keyframes schumann-pulse{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes sedona-spiral{to{transform:rotate(360deg) scale(1.1)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .gold-shimmer{background:linear-gradient(90deg,#CFB53B,#FFF8DC,#FFD700,#FFF8DC,#CFB53B);background-size:200% auto;animation:shimmer 4s linear infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .site-select option{background:#0a0602;color:#fff}
        .intensity-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#D4AF37,#F0C040);box-shadow:0 0 10px rgba(212,175,55,.5);cursor:pointer;border:2px solid rgba(212,175,55,.3)}
        .intensity-slider::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:rgba(212,175,55,.15)}
      `}</style>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/[0.04]" style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/explore')} className="p-2 rounded-xl hover:bg-white/5 transition-all" style={{ border: '1px solid rgba(255,255,255,0.05)' }}><ArrowLeft size={18} className="text-[#D4AF37]/60" /></button>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}><TempleGateIcon className="text-[#D4AF37] h-4 w-4" /></div>
        <div className="flex-1">
          <h1 className={`text-base font-black tracking-[-0.04em] ${selectedSite === 'amritsar' ? 'gold-shimmer' : 'text-[#D4AF37]'}`} style={selectedSite !== 'amritsar' ? { textShadow: '0 0 15px rgba(212,175,55,0.3)' } : {}}>{t('templeHome.header.title')}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : isAnchored ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <p className="text-[8px] tracking-[0.4em] uppercase text-white/30">{isSyncing ? t('templeHome.header.syncing') : isAnchored ? t('templeHome.header.phaseLock') : t('templeHome.header.resonanceReady')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCrystalSetup(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
            style={
              crystalDone
                ? { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            <span style={{ fontSize: 10 }}>💎</span>
            <span
              className="text-[7px] font-extrabold tracking-widest uppercase"
              style={{ color: crystalDone ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.25)' }}
            >
              {crystalDone ? t('templeHome.header.crystalSealed') : t('templeHome.header.crystalSetup')}
            </span>
          </button>
          {isAnchored && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Shield size={11} className="text-emerald-400 animate-pulse" />
              <span className="text-[8px] tracking-[0.3em] uppercase text-emerald-400/80">{t('templeHome.header.locked')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex border-b border-white/[0.04]" style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(20px)' }}>
        {[{id:'PORTAL' as const,Icon:Compass,key:'portal'},{id:'HEALING' as const,Icon:Activity,key:'healing'},{id:'PRESCRIPTIONS' as const,Icon:Star,key:'rx'}].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 flex items-center justify-center gap-1.5 py-3 relative transition-all">
            <tab.Icon size={12} className={activeTab === tab.id ? 'text-[#D4AF37]' : 'text-white/25'} />
            <span className={`text-[9px] font-extrabold tracking-[0.35em] uppercase ${activeTab === tab.id ? 'text-[#D4AF37]' : 'text-white/25'}`}>{t(`templeHome.tabs.${tab.key}`)}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg,transparent,#D4AF37,transparent)' }} />}
          </button>
        ))}
      </div>

      <div className="relative z-10 p-4 pb-36 space-y-4">

        {/* Hero card */}
        <GlassCard className="p-5" glow style={selectedSite === 'amritsar' ? { border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 -20px 50px rgba(212,175,55,0.06)' } : {}}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase mb-1" style={{ color: cat.color }}>{catLabel} · {t('templeHome.hero.siteEnergyActive')}</div>
              <h2 className={`text-lg font-black tracking-[-0.03em] leading-tight ${selectedSite === 'amritsar' ? 'gold-shimmer' : 'text-white/90'}`}>{siteTitle(selectedSite)}</h2>
              {siteBgScene && (
                <div
                  className="mb-2 mt-1.5 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
                  style={{
                    background: `${currentSite.color}0a`,
                    border: `1px solid ${currentSite.color}20`,
                  }}
                >
                  <span
                    className="text-[8px] font-mono tracking-widest"
                    style={{ color: `${currentSite.color}80` }}
                  >
                    {siteBgScene}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-white/40 mt-0.5">{siteFocusLine(selectedSite)}</p>
            </div>
            <button onClick={() => setInfoSiteId(selectedSite)} className="p-2 rounded-xl hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.05)' }}><Info size={14} className="text-[#D4AF37]/50" /></button>
          </div>

          {isMiracle && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mb-2 px-4 py-2 rounded-2xl flex items-center gap-2 w-fit"
              style={{ background: selectedSite === 'amritsar' ? 'rgba(212,175,55,0.08)' : selectedSite === 'mauritius' ? 'rgba(240,230,140,0.06)' : 'rgba(255,107,53,0.08)', border: `1px solid ${currentSite.color}30` }}>
              <span>{selectedSite === 'amritsar' ? '🌊' : selectedSite === 'mauritius' ? '✦' : '🔥'}</span>
              <div>
                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ color: currentSite.color }}>{selectedSite === 'amritsar' ? t('templeHome.hero.miracleAmritsarTag') : selectedSite === 'mauritius' ? t('templeHome.hero.miracleMauritiusTag') : t('templeHome.hero.miracleShirdiTag')}</div>
                <div className="text-[9px] text-white/30">{selectedSite === 'amritsar' ? t('templeHome.hero.miracleAmritsarSub') : selectedSite === 'mauritius' ? t('templeHome.hero.miracleMauritiusSub') : t('templeHome.hero.miracleShirdiSub')}</div>
              </div>
            </motion.div>
          )}

          <SigilRing color={currentSite.color} intensity={auraIntensity} anchored={isAnchored} miracle={isMiracle} />

          <div className="flex items-center justify-center gap-4 mt-2">
            {[{l:t('templeHome.stats.reach'),v:`${currentSite.reach}km`},{l:t('templeHome.stats.mode'),v:activeModeName}].map((item,i) => (
              <React.Fragment key={i}>{i>0&&<div className="h-6 w-[1px] bg-white/10"/>}<div className="text-center"><div className="text-[8px] tracking-[0.4em] uppercase text-white/25">{item.l}</div><div className="text-[11px] font-bold text-white/60">{item.v}</div></div></React.Fragment>
            ))}
            <div className="h-6 w-[1px] bg-white/10"/>
            <div className="text-center"><div className="text-[8px] tracking-[0.4em] uppercase text-white/25">{t('templeHome.stats.sig')}</div><div className="text-[9px] font-mono text-white/40">{signatureCode}</div></div>
          </div>
        </GlassCard>

        {activeTab === 'PORTAL' && (<>
          {!crystalDone && (
            <button
              type="button"
              onClick={() => setShowCrystalSetup(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.22)' }}
            >
              <span className="text-xl">💎</span>
              <div className="flex-1 text-left">
                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/60 mb-0.5">{t('templeHome.crystalBanner.kicker')}</div>
                <div className="text-sm font-bold text-white/70">{t('templeHome.crystalBanner.title')}</div>
                <div className="text-[10px] text-white/30">{t('templeHome.crystalBanner.body')}</div>
              </div>
              <ChevronRight size={16} className="text-[#D4AF37]/40" />
            </button>
          )}

          {/* Mode */}
          <GlassCard className="p-4">
            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-3"><Zap size={9}/>{t('templeHome.modes.sectionTitle')}</div>
            <div className="grid grid-cols-3 gap-2">
              {MODE_DEFS.map(m => (<button key={m.id} onClick={() => handleModeChange(m.id)} className="py-2.5 px-2 rounded-2xl text-[9px] font-extrabold tracking-[0.15em] uppercase transition-all" style={currentMode===m.id?{background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))',border:'1px solid rgba(212,175,55,0.4)',color:'#D4AF37'}:{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.3)'}}>{t(`templeHome.modes.${m.id}_name`)}</button>))}
            </div>
            <p className="text-[10px] text-white/25 mt-2">{activeModeDesc}</p>
          </GlassCard>

          {/* Site Selector */}
          <GlassCard className="p-4">
            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-3"><Compass size={9}/>{t('templeHome.siteRegistry.title')}</div>
            <div className="relative">
              <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} className="site-select w-full rounded-2xl py-3 pl-4 pr-10 text-sm text-white/80 appearance-none focus:outline-none" style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.15)' }}>
                {SITE_CATEGORY_ORDER.map(c => (<optgroup key={c} label={t('templeHome.siteRegistry.optgroup', { category: t(`templeHome.siteCategories.${c}`) })}>{SACRED_SITE_LIST.filter(s => getSiteCategory(s.id).key === c).map(s => (<option key={s.id} value={s.id}>{siteTitle(s.id)} — {siteFocusLine(s.id)}</option>))}</optgroup>))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight size={14} className="text-[#D4AF37]/40 rotate-90"/></div>
            </div>
          </GlassCard>

          {/* Intensity */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5"><Sparkles size={9}/>{intensityLabel}</div>
              <div className="flex items-center gap-1"><span className="text-xl font-black text-[#D4AF37]" style={{ textShadow: '0 0 15px rgba(212,175,55,0.4)' }}>{auraIntensity}</span><span className="text-[10px] text-[#D4AF37]/40">%</span></div>
            </div>
            <input type="range" min={0} max={100} value={auraIntensity} onChange={e => setAuraIntensity(parseInt(e.target.value))} className="intensity-slider w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: selectedSite === 'shirdi' ? '#FF6B35' : '#D4AF37' }}/>
            <div className="flex justify-between mt-2">
              <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">{selectedSite==='shirdi'?t('templeHome.intensity.shirdiMin'):t('templeHome.intensity.defaultMin')}</span>
              <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">{selectedSite==='shirdi'?t('templeHome.intensity.shirdiMax'):t('templeHome.intensity.defaultMax')}</span>
            </div>
          </GlassCard>

          {/* Field Strength Scanner — motion-based, no GPS */}
          <div
            className="rounded-[28px] overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <button
              type="button"
              onClick={() => setShowSpatialMap(!showSpatialMap)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#22D3EE]/60">
                  {t('templeHome.spatial.title')}
                </div>
              </div>
              <span className="text-[9px] text-[#22D3EE]/40 tracking-[0.2em]">
                {showSpatialMap ? t('templeHome.spatial.close') : t('templeHome.spatial.scan')}
              </span>
            </button>
            <AnimatePresence>
              {showSpatialMap && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                    <p className="text-[9px] text-white/25 leading-relaxed mb-3">
                      {t('templeHome.spatial.hint')}
                    </p>
                    <MotionNadiScanner intensity={auraIntensity} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Akasha Infinity link */}
          <button onClick={() => navigate('/akasha-infinity')} className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all hover:scale-[1.01]" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div>
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-purple-400/60 mb-0.5">{t('templeHome.akashaLink.kicker')}</div>
              <div className="text-sm font-bold text-white/60">{t('templeHome.akashaLink.title')}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-400/50">{t('templeHome.akashaLink.price')}</span>
              <ChevronRight size={14} className="text-purple-400/40"/>
            </div>
          </button>

          {/* ── Residual Presets ── */}
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.04]">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5">
                <Clock size={9}/>{t('templeHome.presets.title')}
              </div>
              <p className="text-[10px] text-white/25 mt-1 leading-relaxed">{t('templeHome.presets.subtitle')}</p>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {RESIDUAL_PRESET_DEFS.map(preset => {
                const IconEl = preset.icon === 'music' ? Music : preset.icon === 'moon' ? Moon : preset.icon === 'shield' ? Shield : preset.icon === 'star' ? Star : Sparkles;
                const isActive = presetFlash === preset.id;
                return (
                  <motion.button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    whileTap={{ scale: 0.97 }}
                    className="p-3 rounded-2xl text-left transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: isActive ? `${preset.color}18` : 'rgba(255,255,255,0.02)',
                      border: isActive ? `1px solid ${preset.color}50` : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isActive ? `0 0 15px ${preset.color}15` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: `${preset.color}15`, border: `1px solid ${preset.color}30` }}>
                        <IconEl size={13} style={{ color: preset.color }} />
                      </div>
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </div>
                    <div className="text-[9px] font-extrabold tracking-[0.1em] leading-tight" style={{ color: isActive ? preset.color : 'rgba(255,255,255,0.65)' }}>{t(`templeHome.presets.${preset.id}_label`)}</div>
                    <div className="text-[8px] text-white/25 mt-0.5 font-mono">{siteTitle(preset.site).split(' ')[0]} · {preset.intensity}%</div>
                    <div className="text-[9px] text-white/20 mt-1 leading-relaxed">{t(`templeHome.presets.${preset.id}_why`)}</div>
                    {isActive && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: `${preset.color}10` }}>
                        <div className="text-[8px] font-extrabold tracking-[0.3em] uppercase" style={{ color: preset.color }}>{t('templeHome.presets.applied')}</div>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>
        </>)}

        {/* ── PRESCRIPTIONS TAB ── */}
        {activeTab === 'PRESCRIPTIONS' && (
          <div className="space-y-3">
            <GlassCard className="p-4">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-2">
                <Star size={9}/>{t('templeHome.rxTab.title')}
              </div>
              <p className="text-[10px] text-white/25 leading-relaxed">
                {t('templeHome.rxTab.subtitle')}
              </p>
            </GlassCard>

            {HEALING_RX_DEFS.map(rx => {
              const isOpen = selectedRxId === rx.id;
              return (
                <motion.div key={rx.id} layout>
                  <button
                    onClick={() => setSelectedRxId(isOpen ? null : rx.id)}
                    className="w-full p-4 rounded-[24px] text-left transition-all"
                    style={{
                      background: isOpen ? `${rx.color}08` : 'rgba(255,255,255,0.02)',
                      border: isOpen ? `1px solid ${rx.color}30` : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isOpen ? `0 0 20px ${rx.color}10` : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{rx.icon}</div>
                        <div>
                          <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase mb-0.5" style={{ color: isOpen ? rx.color : 'rgba(255,255,255,0.35)' }}>{t('templeHome.rx.prescription')}</div>
                          <div className="text-sm font-black tracking-[-0.02em]" style={{ color: isOpen ? rx.color : 'rgba(255,255,255,0.75)' }}>{t(`templeHome.rx.${rx.id}_label`)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rx.hydration && <Droplets size={12} className="text-blue-400/60" />}
                        <ChevronRight size={14} className="transition-transform duration-200" style={{ color: 'rgba(255,255,255,0.25)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                      </div>
                    </div>

                    {/* Preview pills when closed */}
                    {!isOpen && (
                      <div className="flex gap-2 mt-2">
                        <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${rx.color}12`, color: `${rx.color}`, border: `1px solid ${rx.color}25` }}>{t(`templeHome.rx.${rx.id}_primaryName`)}</span>
                        <span className="text-[8px] px-2 py-0.5 rounded-full font-bold text-white/25" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>{rx.primaryIntensity}%</span>
                        {rx.hydration && <span className="text-[8px] px-2 py-0.5 rounded-full font-bold text-blue-300/60" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>{t('templeHome.rx.waterBadge')}</span>}
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                        style={{ marginTop: -8 }}
                      >
                        <div className="p-4 rounded-b-[24px] space-y-3" style={{ background: `${rx.color}05`, border: `1px solid ${rx.color}20`, borderTop: 'none' }}>

                          {/* Rx instruction */}
                          <div className="p-3 rounded-2xl" style={{ background: `${rx.color}10`, border: `1px solid ${rx.color}20` }}>
                            <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase mb-2" style={{ color: rx.color }}>{t('templeHome.rx.sacredProtocol')}</div>
                            <p className="text-[12px] text-white/65 leading-relaxed">{t(`templeHome.rx.${rx.id}_rx`)}</p>
                          </div>

                          {/* Physical experience */}
                          <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-white/30 mb-2">{t('templeHome.rx.whatYouFeel')}</div>
                            <p className="text-[11px] text-white/45 leading-relaxed italic">↳ {t(`templeHome.rx.${rx.id}_physical`)}</p>
                          </div>

                          {/* Hydration warning */}
                          {rx.hydration && (
                            <div className="p-3 rounded-2xl flex items-start gap-2.5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                              <Droplets size={14} className="text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-blue-400/70 mb-1">{t('templeHome.rx.hydrationAlert')}</div>
                                <p className="text-[11px] text-blue-300/60 leading-relaxed">{t(`templeHome.rx.${rx.id}_hydrationNote`)}</p>
                              </div>
                            </div>
                          )}

                          {/* Two activate buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => { setSelectedSite(rx.primary); setAuraIntensity(rx.primaryIntensity); setActiveTab('PORTAL'); setSelectedRxId(null); }}
                              className="py-3 rounded-2xl text-[9px] font-extrabold tracking-[0.2em] uppercase transition-all hover:scale-[1.02]"
                              style={{ background: `${rx.color}18`, border: `1px solid ${rx.color}40`, color: rx.color }}
                            >
                              {rx.icon} {t(`templeHome.rx.${rx.id}_primaryName`)}
                              <div className="text-[8px] opacity-60 mt-0.5">{rx.primaryIntensity}% · {t('templeHome.rx.primary')}</div>
                            </button>
                            <button
                              onClick={() => { const s = SACRED_SITE_LIST.find(x => x.id === rx.backup); if (s) { setSelectedSite(rx.backup); setAuraIntensity(rx.backupIntensity); setActiveTab('PORTAL'); setSelectedRxId(null); } }}
                              className="py-3 rounded-2xl text-[9px] font-extrabold tracking-[0.2em] uppercase transition-all hover:scale-[1.02]"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}
                            >
                              {t('templeHome.rx.alt', { name: t(`templeHome.rx.${rx.id}_backupShort`) })}
                              <div className="text-[8px] opacity-60 mt-0.5">{rx.backupIntensity}% · {t('templeHome.rx.backup')}</div>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'HEALING' && (
          <div className="space-y-3">
            <GlassCard className="p-4">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-2"><Activity size={9}/>{t('templeHome.healingTab.protocolsTitle')}</div>
              <p className="text-[10px] text-white/25 leading-relaxed">{t('templeHome.healingTab.protocolsSubtitle')}</p>
            </GlassCard>

            {bliss && <GlassCard className="p-4" style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><Sparkles size={13} className="text-amber-400"/><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-amber-400/70">{t('templeHome.healingTab.highCoherenceTitle')}</span></div>
              <p className="text-xs text-white/60">{bliss.message}</p><p className="text-xs text-amber-300/60 italic mt-2">↳ {bliss.instruction}</p>
            </GlassCard>}
            {deepSync && <GlassCard className="p-4" style={{ border: '1px solid rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.03)' }}>
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#22D3EE]/60 mb-2">{t('templeHome.healingTab.deltaThetaTitle')}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">{deepSync.sensations.map(s => <span key={s} className="text-[9px] px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(34,211,238,0.8)' }}>{s}</span>)}</div>
              <p className="text-[11px] text-white/40 italic">↳ {deepSync.guidance}</p>
            </GlassCard>}
            {heartExpansion && <GlassCard className="p-4" style={{ border: '1px solid rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.03)' }}>
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-rose-400/60 mb-2">{t('templeHome.healingTab.anahataTitle')}</div>
              <p className="text-xs text-white/55">{heartExpansion.advice}</p><p className="text-[11px] text-rose-300/40 italic mt-2">"{heartExpansion.quote}"</p>
            </GlassCard>}
            {luxorHealer && <GlassCard className="p-4" style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><Zap size={12} className="text-[#D4AF37]"/><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/60">{t('templeHome.healingTab.luxorTitle')}</span></div>
              <p className="text-[11px] text-white/40 italic">↳ {luxorHealer.instruction}</p>
            </GlassCard>}
            {amritsarSeva && <GlassCard className="p-4" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.05)' }}>
              <div className="flex items-center gap-2 mb-2"><span>🌊</span><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#FFD700]/70">{t('templeHome.healingTab.amritsarTitle')}</span></div>
              <p className="text-xs text-white/60 leading-relaxed">{t('templeHome.healingTab.amritsarBody')}</p>
              <p className="text-xs text-[#FFD700]/50 italic mt-2">↳ {t('templeHome.healingTab.amritsarFoot')}</p>
            </GlassCard>}
            {mauritiusSpark && <GlassCard className="p-4" style={{ border: '1px solid rgba(240,230,140,0.25)', background: 'rgba(240,230,140,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><span>✦</span><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-yellow-200/70">{t('templeHome.healingTab.mauritiusTitle')}</span></div>
              <p className="text-xs text-white/60 leading-relaxed">{t('templeHome.healingTab.mauritiusBody')}</p>
              <p className="text-xs text-yellow-100/40 italic mt-2">↳ {t('templeHome.healingTab.mauritiusFoot')}</p>
            </GlassCard>}
            {shirdiDhuni && <GlassCard className="p-4" style={{ border: '1px solid rgba(255,107,53,0.25)', background: 'rgba(255,107,53,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><Flame size={13} className="text-orange-400"/><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-orange-400/70">{auraIntensity >= 70 ? t('templeHome.healingTab.shirdiTitleAlive') : t('templeHome.healingTab.shirdiTitleBuilding')}</span></div>
              <p className="text-xs text-white/60 leading-relaxed">{t('templeHome.healingTab.shirdiBody', { pct: auraIntensity })}</p>
              <p className="text-xs text-orange-300/50 italic mt-2">↳ {t('templeHome.healingTab.shirdiFoot')}</p>
            </GlassCard>}

            {dbBio && !bliss && !deepSync && !heartExpansion && !luxorHealer && !amritsarSeva && !mauritiusSpark && !shirdiDhuni && (
              <GlassCard className="p-4" style={{ border: `1px solid ${currentSite.color}20`, background: `${currentSite.color}05` }}>
                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase mb-2" style={{ color: cat.color }}>{t('templeHome.healingTab.siteIntelTitle', { site: siteTitle(selectedSite) })}</div>
                <p className="text-xs text-white/55 leading-relaxed">{dbBio}</p>
                <p className="text-[11px] text-white/30 italic mt-2 leading-relaxed">↳ {dbInstruction}</p>
              </GlassCard>
            )}

            {!bliss && !deepSync && !heartExpansion && !luxorHealer && !amritsarSeva && !mauritiusSpark && !shirdiDhuni && !dbBio && (
              <GlassCard className="p-8 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}><Activity className="h-5 w-5 text-white/15"/></div>
                <p className="text-sm font-bold text-white/20">{t('templeHome.healingTab.emptyTitle')}</p>
                <p className="text-[11px] text-white/15 leading-relaxed max-w-[220px]">{t('templeHome.healingTab.emptyBody')}</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* Anchor */}
        <button
          type="button"
          onClick={handleAnchor}
          className="w-full py-4 rounded-[24px] font-black text-[11px] tracking-[0.3em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
          style={{
            background: isAnchored
              ? 'linear-gradient(135deg,#4ADE80,#22C55E)'
              : crystalDone
                ? 'linear-gradient(135deg,#D4AF37,#F0C040,#D4AF37)'
                : 'rgba(212,175,55,0.25)',
            boxShadow: isAnchored
              ? '0 0 30px rgba(74,222,128,0.3)'
              : crystalDone
                ? '0 0 30px rgba(212,175,55,0.3)'
                : 'none',
            color: crystalDone ? '#000' : 'rgba(255,255,255,0.4)',
          }}
        >
          {isAnchored ? <Shield size={15} /> : crystalDone ? <Home size={15} /> : <span style={{ fontSize: 14 }}>💎</span>}
          {isAnchored
            ? t('templeHome.anchor.locked')
            : crystalDone
              ? t('templeHome.anchor.anchor')
              : t('templeHome.anchor.needCrystals')}
        </button>
      </div>

      {/* Anchor flash */}
      <AnimatePresence>
        {anchorFlash && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="fixed bottom-28 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl px-5 py-3.5 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.08)', backdropFilter: 'blur(40px)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <Shield size={16} className="text-emerald-400 shrink-0"/>
            <div><p className="text-[11px] font-black tracking-[0.2em] uppercase text-emerald-300">{t('templeHome.anchorFlash.title')}</p><p className="text-[9px] text-emerald-400/50 mt-0.5">{t('templeHome.anchorFlash.subtitle')}</p></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hydration Alert ── */}
      <AnimatePresence>
        {showHydrationAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-sm"
          >
            <div className="rounded-2xl px-4 py-3.5 flex items-start gap-3" style={{ background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 4px 30px rgba(59,130,246,0.15)' }}>
              <Droplets size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[9px] font-extrabold tracking-[0.4em] uppercase text-blue-400/80 mb-1">
                  {t('templeHome.hydrationBanner.title')}
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  {t('templeHome.hydrationBanner.body', { site: siteTitle(selectedSite), pct: auraIntensity })}
                </p>
                <p className="text-[10px] text-blue-300/50 italic mt-1">{t('templeHome.hydrationBanner.foot')}</p>
              </div>
              <button onClick={() => setShowHydrationAlert(false)} className="p-1 hover:bg-white/5 rounded-lg">
                <X size={13} className="text-white/30" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoSiteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center p-4">
            <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: 'blur(10px)' }} onClick={() => setInfoSiteId(null)} />
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-md rounded-[32px] p-6 space-y-4 max-h-[80vh] overflow-y-auto" style={{ background: 'rgba(8,4,2,0.95)', backdropFilter: 'blur(60px)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <div className="w-8 h-1 rounded-full bg-white/10 mx-auto -mt-2 mb-1" />
              <button onClick={() => setInfoSiteId(null)} className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-white/5"><X size={16} className="text-white/30"/></button>
              <div>
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/40 mb-1">{t('templeHome.infoModal.kicker', { category: t(`templeHome.siteCategories.${getSiteCategory(infoSiteId).key}`) })}</div>
                <h3 className={`text-xl font-black tracking-[-0.03em] ${infoSiteId==='amritsar'?'gold-shimmer':'text-[#D4AF37]'}`} style={infoSiteId!=='amritsar'?{textShadow:'0 0 20px rgba(212,175,55,0.3)'}:{}}>{t(`templeHome.siteDb.${infoSiteId}.title`)}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-3"><div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mb-1">{t('templeHome.infoModal.primaryBenefit')}</div><div className="text-[11px] text-white/70 font-medium leading-snug">{t(`templeHome.siteDb.${infoSiteId}.primaryBenefit`)}</div></GlassCard>
                <GlassCard className="p-3"><div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mb-1">{t('templeHome.infoModal.experience')}</div><div className="text-[11px] text-white/70 font-medium leading-snug">{t(`templeHome.siteDb.${infoSiteId}.experience`)}</div></GlassCard>
              </div>
              {SITE_DB_BIO_IDS.has(infoSiteId) && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,159,210,0.04)', border: '1px solid rgba(255,159,210,0.12)' }}>
                  <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#FF9FD2]/50 mb-2">{t('templeHome.infoModal.bioSection')}</div>
                  <p className="text-[12px] text-white/55 leading-relaxed">{t(`templeHome.siteDb.${infoSiteId}.bio`)}</p>
                </div>
              )}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-2"><BookOpen size={10} className="text-[#D4AF37]/50"/><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/40">{t('templeHome.infoModal.sacredInstruction')}</span></div>
                <p className="text-[12px] text-white/55 leading-relaxed">{t(`templeHome.siteDb.${infoSiteId}.instruction`)}</p>
              </div>
              <div className="rounded-2xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-[8px] tracking-[0.3em] uppercase text-white/20 mb-1">{t('templeHome.infoModal.signature')}</div>
                <div className="text-[11px] font-mono text-[#D4AF37]/50 tracking-wider">{templeHomeSiteSignatures[infoSiteId] ?? '—'}</div>
              </div>
              <button onClick={() => setInfoSiteId(null)} className="w-full py-3.5 rounded-2xl text-[10px] font-extrabold tracking-[0.3em] uppercase transition-all hover:scale-[1.01]" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>{t('templeHome.infoModal.close')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCrystalSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center p-4"
          >
            <div
              role="presentation"
              className="absolute inset-0 bg-black/75"
              style={{ backdropFilter: 'blur(12px)' }}
              onClick={() => {
                if (crystalDone) setShowCrystalSetup(false);
              }}
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md rounded-[32px] p-6 max-h-[85vh] overflow-y-auto"
              style={{
                background: 'rgba(6,4,2,0.96)',
                backdropFilter: 'blur(60px)',
                border: '1px solid rgba(212,175,55,0.15)',
              }}
            >
              <div className="w-8 h-1 rounded-full bg-white/10 mx-auto -mt-2 mb-4" />
              {crystalDone && (
                <button
                  type="button"
                  onClick={() => setShowCrystalSetup(false)}
                  className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-white/5"
                >
                  <X size={16} className="text-white/30" />
                </button>
              )}
              <CrystalSetupFlow
                onComplete={() => {
                  setCrystalDone(true);
                  setShowCrystalSetup(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TempleHome() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();
  if (authLoading || membershipLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505]" aria-busy="true" aria-label={t('common.loading')}>
      <div className="h-8 w-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37]/80 animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.virtualPilgrimage)) return <Navigate to="/akasha-infinity" replace />;
  return <TempleHomeInner />;
}
