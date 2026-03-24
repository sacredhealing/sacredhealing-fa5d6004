import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Brain, Heart, Leaf, RotateCcw, Moon, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { getDoshaEmoji } from '@/lib/ayurvedaTypes';

interface DoshaDashboardProps {
  profile: AyurvedaUserProfile;
  dosha: DoshaProfile;
  dailyGuidance: string;
  isLoadingGuidance: boolean;
  onRestart: () => void;
  onFetchGuidance: () => void;
  isPremium?: boolean;
}

const GOLD = '#D4AF37';
const SAFFRON = '#E8A317';
const LOTUS = '#f472b6';
const EMERALD = '#34d399';

const SANSKRIT_TICKER =
  'ॐ सर्वे भवन्तु सुखिनः · अयुर्वेदः सनातनधर्मः · त्रिदोषः समत्वम् · प्रकृतिः शान्तिः · ज्योतिः नित्यम् · धन्वन्तरि नमः · ';

/* ─── SIDDHA HERB DATA ─── */
const SIDDHA_HERBS: Record<string, { siddhaProperty: string; element: string }> = {
  ashwagandha: { siddhaProperty: 'Ojas Builder', element: '🌍 Earth' },
  brahmi: { siddhaProperty: 'Medha Rasayana', element: '💧 Water' },
  turmeric: { siddhaProperty: 'Agni Kindler', element: '🔥 Fire' },
  tulsi: { siddhaProperty: 'Sattva Amplifier', element: '🌬️ Air' },
  triphala: { siddhaProperty: 'Tridosha Balancer', element: '☯️ Ether' },
  shatavari: { siddhaProperty: 'Soma Nectar', element: '💧 Water' },
  neem: { siddhaProperty: 'Rakta Shodhana', element: '🌬️ Air' },
  ginger: { siddhaProperty: 'Deepana Fire', element: '🔥 Fire' },
  licorice: { siddhaProperty: 'Rasa Builder', element: '🌍 Earth' },
  guggulu: { siddhaProperty: 'Lekhana Catalyst', element: '🔥 Fire' },
};

const getSiddhaProperty = (herbName: string) => {
  const key = herbName.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
  return SIDDHA_HERBS[key] || { siddhaProperty: 'Sacred Essence', element: '☯️ Ether' };
};

function herbAccent(element: string): { border: string; glow: string; badge: string } {
  if (element.includes('🔥')) return { border: 'rgba(234,88,12,0.35)', glow: 'rgba(234,88,12,0.25)', badge: 'text-orange-300' };
  if (element.includes('💧')) return { border: 'rgba(14,165,233,0.35)', glow: 'rgba(14,165,233,0.2)', badge: 'text-sky-300' };
  if (element.includes('🌍')) return { border: 'rgba(180,83,9,0.35)', glow: 'rgba(180,83,9,0.22)', badge: 'text-amber-200' };
  if (element.includes('🌬️')) return { border: 'rgba(234,179,8,0.35)', glow: 'rgba(234,179,8,0.2)', badge: 'text-yellow-200' };
  return { border: 'rgba(212,175,55,0.4)', glow: 'rgba(212,175,55,0.2)', badge: 'text-[#D4AF37]' };
}

/* ─── RITUAL TIMELINE ─── */
const RITUAL_PHASES = [
  { time: '5:00 AM', label: 'Brahma Muhurta', icon: '🌅', phase: 'dawn' },
  { time: '7:00 AM', label: 'Morning Agni', icon: '☀️', phase: 'morning' },
  { time: '12:00 PM', label: 'Pitta Peak', icon: '🔥', phase: 'midday' },
  { time: '6:00 PM', label: 'Sandhya Kala', icon: '🌇', phase: 'evening' },
  { time: '9:00 PM', label: 'Kapha Rest', icon: '🌙', phase: 'night' },
];

function SanskritTicker() {
  const dup = `${SANSKRIT_TICKER}${SANSKRIT_TICKER}`;
  return (
    <div
      className="relative overflow-hidden rounded-full border py-2 mb-6"
      style={{ borderColor: `${GOLD}33`, background: 'rgba(8,5,3,0.75)' }}
    >
      <motion.div
        className="flex whitespace-nowrap text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.25em]"
        style={{ color: `${GOLD}cc` }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
      >
        <span className="px-6">{dup}</span>
        <span className="px-6" aria-hidden>{dup}</span>
      </motion.div>
    </div>
  );
}

function TempleParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 23) % 100}%`,
        size: 2 + (i % 4),
        color: [GOLD, SAFFRON, EMERALD, LOTUS, '#fcd34d'][i % 5],
        dur: 6 + (i % 5) * 1.2,
        delay: (i % 8) * 0.4,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}66`,
          }}
          animate={{
            y: [0, -18, 0],
            x: [0, 10, -6, 0],
            opacity: [0.15, 0.55, 0.2],
          }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
    </div>
  );
}

function SaffronScanSweep() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      <motion.div
        className="absolute inset-y-0 w-[40%] opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${SAFFRON}33, transparent)`,
        }}
        initial={{ left: '-40%' }}
        animate={{ left: '100%' }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
    </motion.div>
  );
}

/* ─── DOSHA ORB ─── */
const DoshaOrb = ({
  name,
  value,
  color,
  glowColor,
  delay,
}: {
  name: string;
  value: number;
  color: string;
  glowColor: string;
  delay: number;
}) => (
  <motion.div
    className="flex flex-col items-center gap-3"
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.8, type: 'spring' }}
  >
    <div className="relative">
      <motion.div
        className="absolute inset-[-12px] rounded-full"
        style={{ background: `radial-gradient(circle, ${glowColor}55, transparent 72%)` }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.4 }}
      />
      <motion.div
        className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${color}aa, ${color}55 52%, ${color}28 82%)`,
          boxShadow: `0 0 36px ${glowColor}77, inset 0 0 22px ${glowColor}44, 0 0 0 1px ${GOLD}33`,
          border: `1.5px solid ${GOLD}44`,
        }}
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{
          rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay },
        }}
      >
        <motion.div
          className="absolute w-9 h-9 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}cc, transparent)`,
            top: '14%',
            left: '18%',
            filter: 'blur(5px)',
          }}
          animate={{ opacity: [0.45, 1, 0.5], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <div className="relative z-10 text-center">
          <span className="text-2xl font-black text-white drop-shadow-lg">{value}%</span>
        </div>
      </motion.div>
    </div>
    <span className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: `${GOLD}99` }}>
      {name}
    </span>
  </motion.div>
);

function TemplePanel({
  children,
  className = '',
  delay = 0,
  showParticles = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  showParticles?: boolean;
}) {
  return (
    <motion.div
      className={`relative p-8 rounded-3xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(26,15,8,0.96), rgba(12,8,5,0.98))',
        border: `1px solid rgba(212,175,55,0.22)`,
        boxShadow: `0 0 60px rgba(212,175,55,0.06)`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {showParticles ? <TempleParticleField /> : null}
      <SaffronScanSweep />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export const DoshaDashboard: React.FC<DoshaDashboardProps> = ({
  profile,
  dosha,
  dailyGuidance,
  isLoadingGuidance,
  onRestart,
  onFetchGuidance,
  isPremium = false,
}) => {
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    onFetchGuidance();
  }, [onFetchGuidance]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  const getRitualItems = (phase: string) => {
    const allItems = [
      ...dosha.guidelines.diet.map(d => ({ text: d, type: 'diet' as const })),
      ...dosha.guidelines.lifestyle.map(l => ({ text: l, type: 'lifestyle' as const })),
    ];
    const perPhase = Math.ceil(allItems.length / RITUAL_PHASES.length);
    const idx = RITUAL_PHASES.findIndex(r => r.phase === phase);
    return allItems.slice(idx * perPhase, (idx + 1) * perPhase);
  };

  return (
    <div className="space-y-8">
      <SanskritTicker />

      {/* ─── PROFILE & DOSHA ORBS ─── */}
      <TemplePanel delay={0} showParticles>
        <div className="flex items-center gap-5 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
            style={{
              background: `linear-gradient(135deg, rgba(212,175,55,0.35), rgba(232,163,23,0.15))`,
              border: `1px solid ${GOLD}44`,
              boxShadow: `0 0 24px ${GOLD}22`,
            }}
          >
            <span style={{ color: GOLD }}>{profile.name[0]}</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{profile.name}</h2>
            <Badge
              className="mt-1 font-bold uppercase tracking-widest text-[10px] border"
              style={{
                background: 'rgba(212,175,55,0.12)',
                color: GOLD,
                borderColor: `${GOLD}44`,
              }}
            >
              {getDoshaEmoji(dosha.primary)} {dosha.primary} Prakriti
            </Badge>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="rounded-full text-xs"
              style={{ borderColor: `${GOLD}55`, color: GOLD, background: 'rgba(212,175,55,0.06)' }}
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Jyotish Sync'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-10 py-4">
          <DoshaOrb name="Vata" value={dosha.vata} color="#60a5fa" glowColor="#38bdf8" delay={0} />
          <DoshaOrb name="Pitta" value={dosha.pitta} color="#f59e0b" glowColor={SAFFRON} delay={0.2} />
          <DoshaOrb name="Kapha" value={dosha.kapha} color="#34d399" glowColor="#10b981" delay={0.4} />
        </div>

        <AnimatePresence>
          {syncing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 text-center text-xs italic"
              style={{ color: `${GOLD}aa` }}
            >
              ✦ Aligning Dosha frequencies with current planetary transits... ✦
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          onClick={onRestart}
          className="w-full mt-4 text-[10px] uppercase tracking-[0.2em] font-black"
          style={{ color: `${GOLD}88` }}
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Reset Cosmic Blueprint
        </Button>
      </TemplePanel>

      {/* ─── PERSONALITY & RISHI MIRROR ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TemplePanel delay={0.15}>
          <h3 className="text-lg font-serif mb-3 flex items-center gap-2 text-white">
            <Brain className="w-5 h-5" style={{ color: GOLD }} />
            Personality & Mind
          </h3>
          <Badge
            className="mb-3 text-[10px] border font-bold"
            style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, borderColor: `${GOLD}33` }}
          >
            {dosha.mentalConstitution}
          </Badge>
          <p className="leading-relaxed text-sm" style={{ color: 'rgba(255,248,235,0.78)' }}>
            {dosha.personalitySummary}
          </p>
        </TemplePanel>

        <TemplePanel delay={0.22}>
          <h3 className="text-lg font-serif mb-1 flex items-center gap-2 text-white">
            <Heart className="w-5 h-5" style={{ color: SAFFRON }} />
            The Rishi&apos;s Mirror
          </h3>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-4 font-bold" style={{ color: `${GOLD}99` }}>
            Your Karmic Constitution
          </p>
          <p className="leading-relaxed italic text-sm" style={{ color: 'rgba(255,245,230,0.88)' }}>
            &ldquo;{dosha.lifeSituationAdvice}&rdquo;
          </p>
        </TemplePanel>
      </div>

      {/* ─── DAILY GUIDANCE ─── */}
      <TemplePanel delay={0.12}>
        <div className="absolute top-0 right-0 p-6 opacity-15 pointer-events-none">
          <Sun className="w-16 h-16" style={{ color: GOLD }} />
        </div>
        <h3 className="font-serif text-xl mb-4 flex items-center gap-3 text-white">
          <Moon className="w-5 h-5" style={{ color: SAFFRON }} />
          Daily Guidance
        </h3>
        {isLoadingGuidance ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 rounded w-3/4" style={{ background: `${GOLD}22` }} />
            <div className="h-4 rounded" style={{ background: `${GOLD}18` }} />
            <div className="h-4 rounded w-5/6" style={{ background: `${GOLD}15` }} />
          </div>
        ) : (
          <p className="text-base leading-relaxed italic" style={{ color: 'rgba(255,240,220,0.85)' }}>
            &ldquo;{dailyGuidance}&rdquo;
          </p>
        )}
      </TemplePanel>

      {/* ─── RITUAL TIMELINE ─── */}
      <TemplePanel delay={0.28}>
        <h2 className="text-2xl font-serif text-white mb-2">Sacred Daily Ritual</h2>
        <p className="text-xs uppercase tracking-[0.15em] font-bold mb-8" style={{ color: `${GOLD}88` }}>
          Integrated Healing Timeline
        </p>

        <div className="relative">
          <div
            className="absolute left-6 top-0 bottom-0 w-px"
            style={{ background: `linear-gradient(to bottom, ${GOLD}99, ${GOLD}22)` }}
          />

          <div className="space-y-6">
            {RITUAL_PHASES.map((ritual, idx) => {
              const items = getRitualItems(ritual.phase);
              return (
                <motion.div
                  key={ritual.phase}
                  className="flex gap-5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + idx * 0.1 }}
                >
                  <div className="relative z-10 flex-shrink-0 w-12 flex items-start justify-center pt-1">
                    <motion.div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${GOLD}, #f5e6a8)`,
                        boxShadow: `0 0 14px ${GOLD}aa`,
                      }}
                      animate={{
                        boxShadow: [
                          `0 0 8px ${GOLD}66`,
                          `0 0 20px ${GOLD}cc`,
                          `0 0 8px ${GOLD}66`,
                        ],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.15 }}
                    />
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{ritual.icon}</span>
                      <div>
                        <span className="text-xs font-bold" style={{ color: SAFFRON }}>
                          {ritual.time}
                        </span>
                        <h4 className="text-white text-sm font-bold">{ritual.label}</h4>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <ul className="space-y-1.5 ml-1">
                        {items.map((item, i) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'rgba(255,245,230,0.65)' }}>
                            <span className="mt-0.5" style={{ color: GOLD }}>
                              •
                            </span>
                            {item.text}
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
      </TemplePanel>

      {/* ─── HERBARIUM ─── */}
      <TemplePanel delay={0.32}>
        <h2 className="text-2xl font-serif text-white mb-2">Sacred Herbarium</h2>
        <p className="text-xs uppercase tracking-[0.15em] font-bold mb-6" style={{ color: `${GOLD}88` }}>
          Botanical Essence Cards
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dosha.guidelines.herbs.map((herb, i) => {
            const { siddhaProperty, element } = getSiddhaProperty(herb);
            const acc = herbAccent(element);
            return (
              <motion.div
                key={i}
                className="relative p-5 rounded-2xl overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(18,12,8,0.92), rgba(10,8,5,0.95))',
                  border: `1px solid ${acc.border}`,
                }}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
              >
                <motion.div
                  className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-25 group-hover:opacity-45 transition-opacity"
                  style={{ background: `radial-gradient(circle, ${acc.glow}, transparent 70%)` }}
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.2 }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Leaf className="w-4 h-4" style={{ color: GOLD }} />
                    <span className="text-[10px] opacity-80">{element}</span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{herb}</h4>
                  <Badge
                    className="text-[10px] font-bold border"
                    style={{ background: 'rgba(0,0,0,0.35)', borderColor: acc.border }}
                  >
                    <span className={acc.badge}>{siddhaProperty}</span>
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </TemplePanel>

      {!isPremium && (
        <motion.div
          className="p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(40,22,10,0.95), rgba(14,10,6,0.98))',
            border: `1px solid ${GOLD}33`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <SaffronScanSweep />
          <div className="max-w-md relative z-10">
            <h3 className="text-2xl font-serif mb-3 text-white">Deepen Your Practice</h3>
            <p className="leading-relaxed text-sm" style={{ color: 'rgba(255,235,210,0.7)' }}>
              Unlock the Divine Physician and Live Audio Doctor for direct spoken healing sessions.
            </p>
          </div>
          <Button
            className="relative z-10 font-black px-10 py-5 h-auto rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest text-sm"
            style={{ background: GOLD, color: '#1a0f08' }}
          >
            <Zap className="w-4 h-4 mr-2" /> Upgrade
          </Button>
        </motion.div>
      )}
    </div>
  );
};
