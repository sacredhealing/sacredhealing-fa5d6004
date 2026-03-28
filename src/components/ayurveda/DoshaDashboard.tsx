/**
 * ████████████████████████████████████████████████████████████████
 *  SQI 2050 — DoshaDashboard.tsx
 *  "Living Indian Siddha Temple" — Maximum vitality redesign
 *
 *  VISUAL INTENTION:
 *  • You feel like you've stepped into a sacred Indian Ayurvedic
 *    chamber — marigold saffron, lotus pink, deep temple indigo,
 *    brass gold, and sacred fire embers
 *  • Alive: pulsing orbs, breathing halos, floating particles,
 *    animated scan lines, scrolling Sanskrit ticker
 *  • Rich color system: Siddha-Gold + Saffron + Lotus + Emerald
 *
 *  FUNCTIONAL LOGIC: 100% PRESERVED (props, hooks, callbacks)
 * ████████████████████████████████████████████████████████████████
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Brain, Heart, Leaf, RotateCcw, Moon, Zap, RefreshCw } from 'lucide-react';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { getDoshaEmoji } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';

// ── SIDDHA COLOR SYSTEM ────────────────────────────────────────
const C = {
  gold:    '#D4AF37', gold2: '#F2D060', gold3: '#B8960C',
  saffron: '#FF8C00', saffronL: '#FFB347',
  lotus:   '#E8527A', lotusL: '#F4799A',
  indigo:  '#3D1A78', indigoL: '#6B46C1',
  emerald: '#10B981', emeraldL: '#34D399',
  vata:    '#93C5FD', pitta:   '#FBBF24', kapha: '#34D399',
  bg:      '#050505',
  g:  (c: string, o = 0.15) => `rgba(${hexToRgb(c)},${o})`,
};
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const SIDDHA_HERBS: Record<string, { siddhaProperty: string; element: string; color: string }> = {
  ashwagandha: { siddhaProperty: 'Ojas Builder',       element: 'Earth 🌍', color: '#86EFAC' },
  brahmi:      { siddhaProperty: 'Medha Rasayana',     element: 'Water 💧', color: '#93C5FD' },
  turmeric:    { siddhaProperty: 'Agni Kindler',        element: 'Fire 🔥',  color: '#FBBF24' },
  tulsi:       { siddhaProperty: 'Sattva Amplifier',   element: 'Air 🌬️',   color: '#86EFAC' },
  triphala:    { siddhaProperty: 'Tridosha Balancer',  element: 'Ether ☯️', color: '#C4B5FD' },
  shatavari:   { siddhaProperty: 'Soma Nectar',        element: 'Water 💧', color: '#93C5FD' },
  neem:        { siddhaProperty: 'Rakta Shodhana',     element: 'Air 🌬️',   color: '#4ADE80'  },
  ginger:      { siddhaProperty: 'Deepana Fire',        element: 'Fire 🔥',  color: '#FB923C' },
  licorice:    { siddhaProperty: 'Rasa Builder',        element: 'Earth 🌍', color: '#FCD34D' },
  guggulu:     { siddhaProperty: 'Lekhana Catalyst',   element: 'Fire 🔥',  color: '#F87171' },
};
const getSiddha = (herb: string) => {
  const key = herb.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
  return SIDDHA_HERBS[key] || { siddhaProperty: 'Sacred Essence', element: 'Ether ☯️', color: '#C4B5FD' };
};

const RITUAL_META = [
  { time: '5:00 AM', icon: '🌅', phase: 'dawn', labelKey: 'ritualBrahma' as const },
  { time: '7:00 AM', icon: '☀️', phase: 'morning', labelKey: 'ritualMorning' as const },
  { time: '12:00 PM', icon: '🔥', phase: 'midday', labelKey: 'ritualMidday' as const },
  { time: '6:00 PM', icon: '🌇', phase: 'evening', labelKey: 'ritualEvening' as const },
  { time: '9:00 PM', icon: '🌙', phase: 'night', labelKey: 'ritualNight' as const },
];

type AyurvedaDashT = (key: string, fallback?: string) => string;

function getHerbDisplay(herb: string, t: AyurvedaDashT) {
  const key = herb.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
  const fb = getSiddha(herb);
  const propK = `ayurvedaDash.herb_${key}_prop`;
  const elK = `ayurvedaDash.herb_${key}_el`;
  return {
    siddhaProperty: t(propK, fb.siddhaProperty),
    element: t(elK, fb.element),
    color: fb.color,
  };
}

function doshaLabel(primary: string | undefined, t: AyurvedaDashT): string {
  const k = (primary || '').toLowerCase();
  if (k === 'vata') return t('ayurvedaDash.dosha_vata', 'Vata');
  if (k === 'pitta') return t('ayurvedaDash.dosha_pitta', 'Pitta');
  if (k === 'kapha') return t('ayurvedaDash.dosha_kapha', 'Kapha');
  return primary || '';
}

const SANSKRIT_TICKER = '✦ OM NAMAH SHIVAYA ✦ SARVE BHAVANTU SUKHINAH ✦ AROGYA PARAM BHAGYAM ✦ OM SHANTI SHANTI SHANTI ✦ DHANVANTARI NAMOSTUTE ✦ AYUR AROGYA SAUKHYAM ✦ ';

// ── PARTICLE FIELD ─────────────────────────────────────────────
const ParticleField = React.memo(() => {
  const particles = React.useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.8,
      dur: 3 + Math.random() * 4, delay: Math.random() * 5,
      color: [C.gold, C.saffron, C.lotus, C.emerald][Math.floor(Math.random() * 4)],
    })), []);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: p.color }}
          animate={{ opacity: [0.06, 0.5, 0.06], scale: [1, 1.8, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <motion.div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${C.g(C.saffron, 0.05)}, transparent 68%)` }} animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div style={{ position: 'absolute', bottom: '-20%', left: '-12%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${C.g(C.gold, 0.06)}, transparent 68%)` }} animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 8, delay: 2, repeat: Infinity }} />
      <motion.div style={{ position: 'absolute', top: '40%', left: '50%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${C.g(C.lotus, 0.04)}, transparent 68%)` }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 5, delay: 1, repeat: Infinity }} />
    </div>
  );
});

// ── SANSKRIT TICKER ────────────────────────────────────────────
const SanskritTicker = () => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)', padding: '8px 0', marginBottom: 24 }}>
      <motion.div ref={ref}
        style={{ display: 'flex', whiteSpace: 'nowrap', color: 'rgba(212,175,55,0.45)', fontSize: 10, fontWeight: 800, letterSpacing: '0.3em' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      >
        {SANSKRIT_TICKER.repeat(6)}
      </motion.div>
    </div>
  );
};

// ── DOSHA ORB ──────────────────────────────────────────────────
const DoshaOrb = ({ name, value, orbColor, glowHex, delay }: { name: string; value: number; orbColor: string; glowHex: string; delay: number }) => (
  <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
    initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.9, type: 'spring', stiffness: 200 }}
  >
    <div style={{ position: 'relative' }}>
      <motion.div style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: `radial-gradient(circle, ${glowHex}44, transparent 70%)` }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
      />
      <motion.div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${glowHex}44` }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: delay + 0.5 }}
      />
      <motion.div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: `radial-gradient(circle at 32% 32%, ${orbColor}cc, ${orbColor}66 50%, ${orbColor}22)`,
        boxShadow: `0 0 40px ${glowHex}55, inset 0 0 24px ${glowHex}22, 0 0 0 1.5px ${glowHex}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        <motion.div style={{ position: 'absolute', width: 36, height: 36, borderRadius: '50%', background: `radial-gradient(circle,${orbColor}88,transparent)`, top: '12%', left: '18%', filter: 'blur(5px)' }}
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.2, repeat: Infinity, delay }}
        />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.6)', letterSpacing: '-0.04em' }}>{value}%</span>
        </div>
      </motion.div>
    </div>
    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>{name}</span>
  </motion.div>
);

// ── SAFFRON SCAN LINE ──────────────────────────────────────────
const ScanLine = () => (
  <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${C.saffron},${C.gold},transparent)`, opacity: 0.7 }}
    animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 0.7, 0.5, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.8, 1] }}
  />
);

// ── MAIN COMPONENT ─────────────────────────────────────────────
interface DoshaDashboardProps {
  profile: AyurvedaUserProfile;
  dosha: DoshaProfile;
  dailyGuidance: string;
  isLoadingGuidance: boolean;
  onRestart: () => void;
  onFetchGuidance: () => void;
  isPremium?: boolean;
}

export const DoshaDashboard: React.FC<DoshaDashboardProps> = ({
  profile, dosha, dailyGuidance, isLoadingGuidance,
  onRestart, onFetchGuidance, isPremium = false,
}) => {
  const { t } = useTranslation();
  const ritualPhases = useMemo(
    () =>
      RITUAL_META.map((r) => ({
        ...r,
        label: t(`ayurvedaDash.${r.labelKey}`, ''),
      })),
    [t]
  );
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { onFetchGuidance(); }, [onFetchGuidance]);
  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); };
  const getRitualItems = (phase: string) => {
    const all = [...dosha.guidelines.diet.map(d => ({ text: d, type: 'diet' })), ...dosha.guidelines.lifestyle.map(l => ({ text: l, type: 'lifestyle' }))];
    const per = Math.ceil(all.length / ritualPhases.length);
    const idx = ritualPhases.findIndex(r => r.phase === phase);
    return all.slice(idx * per, (idx + 1) * per);
  };

  const card = (children: React.ReactNode, _accent = C.gold, delay = 0, extra: React.CSSProperties = {}) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 40, padding: '28px 28px',
        position: 'relative', overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        ...extra,
      }}
    >
      {children}
    </motion.div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <ParticleField />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SanskritTicker />

        {card(
          <>
            <ScanLine />
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg,transparent,${C.saffron}55,${C.gold}88,${C.saffron}55,transparent)` }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <motion.div
                style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: `linear-gradient(135deg, ${C.g(C.saffron, 0.25)}, ${C.g(C.gold, 0.1)})`,
                  border: `1.5px solid ${C.g(C.gold, 0.5)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: C.gold,
                  boxShadow: `0 0 20px ${C.g(C.gold, 0.2)}`,
                }}
                animate={{ boxShadow: [`0 0 20px ${C.g(C.gold, 0.2)}`, `0 0 35px ${C.g(C.saffron, 0.4)}`, `0 0 20px ${C.g(C.gold, 0.2)}`] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {profile.name[0]}
              </motion.div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.92)', marginBottom: 6 }}>{profile.name}</h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 999, background: `${C.g(C.saffron, 0.1)}`, border: `1px solid ${C.g(C.saffron, 0.3)}`, fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: C.saffron }}>
                  {getDoshaEmoji(dosha.primary)} {doshaLabel(dosha.primary, t)}
                  {t('ayurvedaDash.prakritiSuffix', ' Prakriti')}
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleSync}
                disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 20, background: syncing ? `${C.g(C.gold, 0.12)}` : 'rgba(255,255,255,0.03)', border: `1px solid ${C.g(C.gold, 0.25)}`, color: syncing ? C.gold : 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: syncing ? `0 0 20px ${C.g(C.gold, 0.25)}` : 'none' }}
              >
                <RefreshCw style={{ width: 12, height: 12, animation: syncing ? 'spin 1s linear infinite' : undefined }} />
                {syncing ? t('ayurvedaDash.jyotishSyncing', 'Syncing…') : t('ayurvedaDash.jyotishSync', 'Jyotish Sync')}
              </motion.button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, padding: '20px 0 24px', flexWrap: 'wrap' }}>
              <DoshaOrb name={t('ayurvedaDash.dosha_vata', 'Vata')} value={dosha.vata} orbColor={C.vata} glowHex="#60A5FA" delay={0} />
              <DoshaOrb name={t('ayurvedaDash.dosha_pitta', 'Pitta')} value={dosha.pitta} orbColor={C.pitta} glowHex="#F59E0B" delay={0.18} />
              <DoshaOrb name={t('ayurvedaDash.dosha_kapha', 'Kapha')} value={dosha.kapha} orbColor={C.kapha} glowHex="#10B981" delay={0.36} />
            </div>

            <AnimatePresence>
              {syncing && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ textAlign: 'center', color: `${C.saffron}99`, fontSize: 11, fontStyle: 'italic', letterSpacing: '0.15em', marginTop: 4 }}>
                  {t('ayurvedaDash.syncBanner', '✦ Aligning Dosha frequencies with current planetary transits… ✦')}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="button" onClick={onRestart} style={{ width: '100%', marginTop: 18, padding: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(212,175,55,0.7)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'}
            >
              <RotateCcw style={{ width: 11, height: 11 }} /> {t('ayurvedaDash.resetBlueprint', 'Reset Cosmic Blueprint')}
            </button>
          </>, C.gold, 0,
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', border: `1px solid ${C.g(C.indigo, 0.4)}`, borderRadius: 40, padding: '28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.g(C.indigoL, 0.6)},transparent)` }} />
            <h3 style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Brain style={{ width: 16, height: 16, color: C.indigoL }} />{' '}
              {t('ayurvedaDash.personalityMind', 'Personality & Mind')}
            </h3>
            <div style={{ display: 'inline-block', padding: '2px 12px', borderRadius: 999, background: `${C.g(C.indigoL, 0.12)}`, border: `1px solid ${C.g(C.indigoL, 0.3)}`, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.indigoL, marginBottom: 14 }}>
              {dosha.mentalConstitution}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.58)' }}>{dosha.personalitySummary}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: `linear-gradient(135deg, ${C.g(C.lotus, 0.08)}, ${C.g(C.gold, 0.04)})`, backdropFilter: 'blur(40px)', border: `1px solid ${C.g(C.lotus, 0.4)}`, borderRadius: 40, padding: '28px', position: 'relative', overflow: 'hidden', boxShadow: `0 0 40px ${C.g(C.lotus, 0.08)}` }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(232,82,122,0.4) 9px,rgba(232,82,122,0.4) 10px)' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.g(C.lotus, 0.7)},transparent)` }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: C.saffron, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Heart style={{ width: 16, height: 16, color: C.lotus }} /> {t('ayurvedaDash.rishisMirror', "The Rishi's Mirror")}
              </h3>
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: `${C.lotus}80`, marginBottom: 14 }}>
                {t('ayurvedaDash.karmicConstitution', 'YOUR KARMIC CONSTITUTION')}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>&ldquo;{dosha.lifeSituationAdvice}&rdquo;</p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', border: `1px solid ${C.g(C.gold, 0.2)}`, borderRadius: 40, padding: '28px 32px', position: 'relative', overflow: 'hidden', boxShadow: `0 0 50px ${C.g(C.gold, 0.06)}` }}>
          <ScanLine />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.saffron}44,${C.gold}88,${C.saffron}44,transparent)` }} />
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', opacity: 0.06 }}>
            <Sun style={{ width: 100, height: 100, color: C.saffron }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <motion.span animate={{ rotate: [0, 20, 0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }}><Moon style={{ width: 17, height: 17, color: C.saffron }} /></motion.span>
            {t('ayurvedaDash.dailyGuidance', 'Daily Guidance')}
            <motion.span animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}><Sun style={{ width: 15, height: 15, color: C.gold, opacity: 0.5 }} /></motion.span>
          </h3>
          {isLoadingGuidance ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0.75, 1, 0.85].map((w, i) => (
                <motion.div key={i} style={{ height: 14, borderRadius: 7, background: `${C.g(C.gold, 0.08)}`, width: `${w * 100}%` }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.72)', fontStyle: 'italic' }}>&ldquo;{dailyGuidance}&rdquo;</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 40, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.g(C.gold, 0.4)},transparent)` }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>
            {t('ayurvedaDash.sacredRitual', 'Sacred Daily Ritual')}
          </h2>
          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: `${C.gold}99`, marginBottom: 28 }}>
            {t('ayurvedaDash.ritualTimeline', 'Integrated Healing Timeline')}
          </p>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 20, top: 8, bottom: 0, width: 1, background: `linear-gradient(to bottom, ${C.gold}99, ${C.gold}11)` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {ritualPhases.map((r, i) => {
                const items = getRitualItems(r.phase);
                return (
                  <motion.div key={r.phase} style={{ display: 'flex', gap: 20 }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                    <div style={{ flexShrink: 0, width: 40, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                      <motion.div style={{ width: 11, height: 11, borderRadius: '50%', background: `linear-gradient(135deg,${C.saffron},${C.gold})`, boxShadow: `0 0 12px ${C.gold}88`, position: 'relative', zIndex: 1 }}
                        animate={{ boxShadow: [`0 0 8px ${C.gold}66`, `0 0 18px ${C.saffron}aa`, `0 0 8px ${C.gold}66`] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                      />
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{r.icon}</span>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.saffron }}>{r.time}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>{r.label}</div>
                        </div>
                      </div>
                      {items.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {items.map((it, j) => (
                            <li key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.52)', lineHeight: 1.55 }}>
                              <span style={{ color: `${C.gold}66`, flexShrink: 0 }}>◦</span>{it.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 40, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.g(C.emerald, 0.5)},transparent)` }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>
            {t('ayurvedaDash.herbariumTitle', 'Sacred Herbarium')}
          </h2>
          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: `${C.emerald}99`, marginBottom: 24 }}>
            {t('ayurvedaDash.herbariumSub', 'Botanical Essence Cards')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {dosha.guidelines.herbs.map((herb, i) => {
              const { siddhaProperty, element, color } = getHerbDisplay(herb, t);
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.07 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  style={{ padding: '18px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.g(color, 0.2)}`, position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'box-shadow 0.2s' }}
                >
                  <motion.div style={{ position: 'absolute', top: -12, right: -12, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${C.g(color, 0.3)},transparent 70%)` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <Leaf style={{ width: 16, height: 16, color }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: `${color}88`, letterSpacing: '0.2em' }}>{element}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4, marginBottom: 10 }}>{herb}</div>
                    <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: `${C.g(color, 0.1)}`, border: `1px solid ${C.g(color, 0.25)}`, color }}>
                      {siddhaProperty}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '36px 32px', background: `linear-gradient(135deg,${C.g(C.lotus, 0.08)},${C.g(C.gold, 0.04)})`, backdropFilter: 'blur(40px)', border: `1px solid ${C.g(C.lotus, 0.3)}`, borderRadius: 40, textAlign: 'center', boxShadow: `0 0 50px ${C.g(C.lotus, 0.07)}` }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: C.lotus, marginBottom: 12, opacity: 0.75 }}>
                {t('ayurvedaDash.deepenPractice', '✦ Deepen Your Practice ✦')}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.9)', marginBottom: 10 }}>
                {t('ayurvedaDash.unlockTitle', 'Unlock the Full Siddha Experience')}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: 460 }}>
                {t(
                  'ayurvedaDash.unlockDesc',
                  'Upgrade to Prana Flow for the Divine Physician AI chat, or to Lifetime for live audio healing sessions with Dhanvantari.'
                )}
              </p>
            </div>
            <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} style={{ padding: '15px 40px', borderRadius: 999, background: `linear-gradient(135deg,${C.gold},${C.gold3})`, color: C.bg, fontFamily: 'inherit', fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em', border: 'none', cursor: 'pointer', boxShadow: `0 0 30px ${C.g(C.gold, 0.35)}, 0 4px 20px rgba(0,0,0,0.4)`, display: 'flex', alignItems: 'center', gap: 9 }}>
              <Zap style={{ width: 16, height: 16 }} /> {t('ayurvedaDash.upgradeCta', 'Upgrade to Prana Flow')}
            </motion.button>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
