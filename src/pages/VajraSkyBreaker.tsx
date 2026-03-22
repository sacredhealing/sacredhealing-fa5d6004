/**
 * SQI 2050 · Vajra-Sky-Breaker — Radionic broadcast station UI (scalar pulse simulation).
 * Client-side only; no Gemini API required for the interface.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  Shield,
  Sun,
  Wind,
  Layers,
  Activity,
  Compass,
  Cpu,
  Radio,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';

interface Activation {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

const ACTIVATIONS: Activation[] = [
  {
    id: 'earth-anchor',
    name: 'Earth Anchor',
    description: 'Shilajit & Uva Ursi: Gravitational density for terrestrial transmutation.',
    Icon: Layers,
    color: '#D4AF37',
  },
  {
    id: 'crystalline-sovereignty',
    name: 'Crystalline Sovereignty',
    description: 'Shungite & Valor: 10-mile radius EMF-Zero Zone.',
    Icon: Shield,
    color: '#22D3EE',
  },
  {
    id: 'solar-ignition',
    name: 'Solar Ignition',
    description: 'Sativa Spark & San Pedro Resonance: Blasting the atmosphere with Light-Fire.',
    Icon: Sun,
    color: '#F59E0B',
  },
  {
    id: 'shadow-detox',
    name: 'Shadow Detox',
    description: 'Activated Charcoal & Myrrh: Scouring aetheric soot and jet-trails.',
    Icon: Wind,
    color: '#6B7280',
  },
  {
    id: 'nadi-sync',
    name: 'Nadi Sync',
    description: 'Pingala-Nadi alignment for Solar Channel activation.',
    Icon: Activity,
    color: '#EF4444',
  },
  {
    id: 'aetheric-code',
    name: 'Aetheric Code',
    description: 'Tulsi Aura Sanitizer: Dissolving chemical toxins via purification.',
    Icon: Sparkles,
    color: '#10B981',
  },
  {
    id: 'vortex-command',
    name: 'Vortex Command',
    description: 'Orgonite Vortex: Converting DOR to POR at current coordinates.',
    Icon: Compass,
    color: '#8B5CF6',
  },
];

export default function VajraSkyBreaker() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();
  const [isActivating, setIsActivating] = useState(false);
  const [activeRemedy, setActiveRemedy] = useState<string | null>(null);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  const handleActivate = () => {
    setIsActivating(true);
    let intensity = 0;
    const interval = window.setInterval(() => {
      intensity += 5;
      setPulseIntensity(intensity);
      if (intensity >= 100) {
        window.clearInterval(interval);
        window.setTimeout(() => {
          setIsActivating(false);
          setPulseIntensity(0);
        }, 2000);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-28 text-white selection:bg-[#D4AF37]/30">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
        }}
      />

      <header className="mx-auto max-w-2xl px-6 pb-8 pt-12 text-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 font-['Montserrat',sans-serif] text-[7px] font-extrabold uppercase tracking-[0.4em] text-[#D4AF37]/40"
        >
          {t('siddhaPortal.back')}
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="mb-4 block text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/40">
            Akasha-Neural Overlay v1.0
          </span>
          <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] sm:text-5xl">
            Vajra-Sky-Breaker
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-white/60">
            Prema-Pulse Transmission Station. Command the aetheric density. Establish Blue Hole through Scalar Wave
            Entanglement.
          </p>
        </motion.div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-6 pb-40">
        <div className="relative overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-[40px]">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/40">System Status</span>
              <div className="mt-1 flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${isActivating ? 'animate-pulse bg-[#D4AF37]' : 'bg-green-500'}`}
                />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {isActivating ? 'Broadcasting...' : 'Ready for Sync'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/40">Resonance</span>
              <div className="text-xl font-black text-[#D4AF37]">
                {isActivating ? `${pulseIntensity}%` : '0.00Hz'}
              </div>
            </div>
          </div>

          <div className="flex h-32 items-end gap-1 px-2">
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm bg-[#D4AF37]/20"
                animate={{
                  height: isActivating
                    ? `${Math.max(10, ((pulseIntensity + i * 17) % 88) + 8)}%`
                    : '10%',
                }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          {isActivating && (
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[#D4AF37]/5"
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>

        <section>
          <span className="mb-4 block text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/40">
            Remedy Activations
          </span>
          <div className="grid grid-cols-1 gap-4">
            {ACTIVATIONS.map((remedy) => {
              const Icon = remedy.Icon;
              return (
                <motion.button
                  key={remedy.id}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveRemedy(remedy.id === activeRemedy ? null : remedy.id)}
                  className={`flex items-center gap-4 rounded-[40px] border border-white/5 bg-white/[0.02] p-4 text-left backdrop-blur-[40px] transition-all duration-300 ${
                    activeRemedy === remedy.id ? 'border-[#D4AF37]/40 bg-white/5' : ''
                  }`}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${remedy.color}15`, color: remedy.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider">{remedy.name}</h3>
                    <AnimatePresence>
                      {activeRemedy === remedy.id && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-1 text-xs leading-relaxed text-white/50"
                        >
                          {remedy.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 text-white/20 transition-transform ${activeRemedy === remedy.id ? 'rotate-90' : ''}`}
                  />
                </motion.button>
              );
            })}
          </div>
        </section>

        <div className="fixed bottom-24 left-0 right-0 z-10 mx-auto max-w-2xl px-6">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleActivate}
            disabled={isActivating}
            className={`flex w-full items-center justify-center gap-3 rounded-[40px] py-6 text-sm font-black uppercase tracking-[0.3em] transition-all duration-500 ${
              isActivating
                ? 'bg-[#D4AF37] text-[#050505] shadow-[0_0_50px_rgba(212,175,55,0.4)]'
                : 'border border-white/10 bg-white/5 hover:border-[#D4AF37]/50'
            }`}
          >
            <Zap className={`h-5 w-5 ${isActivating ? 'fill-current' : ''}`} />
            {isActivating ? 'Broadcasting Scalar Wave' : 'Initiate Vajra-Sky-Breaker'}
          </motion.button>
        </div>
      </main>

      <footer className="px-6 pb-8 text-center">
        <div className="flex items-center justify-center gap-6 opacity-20">
          <Radio className="h-4 w-4" />
          <Cpu className="h-4 w-4" />
          <Activity className="h-4 w-4" />
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.5em] text-white/20">Siddha-Quantum Intelligence Ecosystem</p>
      </footer>

      <AnimatePresence>
        {isActivating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-[#D4AF37]/5 backdrop-blur-[2px]" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-[500px] w-[500px] rounded-full border border-[#D4AF37]/20"
            />
            <motion.div
              animate={{ scale: [1, 2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute h-[800px] w-[800px] rounded-full border border-[#D4AF37]/10"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
