import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Flame,
  Heart,
  Info,
  Moon,
  Droplets,
  Shield,
  Sparkles,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';

type Dosha = 'Vata' | 'Kapha' | 'Pitta';
type Phase = 'Release' | 'Nourish' | 'Transform';

interface CycleData {
  day: number;
  dosha: Dosha;
  phase: Phase;
  mantra: string;
  frequency: string;
}

export default function SovereignHormonalAlchemy() {
  const navigate = useNavigate();
  const [cycleDay, setCycleDay] = useState<number>(1);
  const [isWiseWomanMode, setIsWiseWomanMode] = useState<boolean>(false);
  const [pittaSurges, setPittaSurges] = useState<number>(0);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionProgress, setTransmissionProgress] = useState<number>(0);

  const cycleInfo = useMemo((): CycleData => {
    if (cycleDay <= 5) {
      return {
        day: cycleDay,
        dosha: 'Vata',
        phase: 'Release',
        mantra: 'Om Somaye Namaha — I release into the cosmic void.',
        frequency: '396Hz (Grounding)',
      };
    }
    if (cycleDay <= 14) {
      return {
        day: cycleDay,
        dosha: 'Kapha',
        phase: 'Nourish',
        mantra: 'Om Shrim Namaha — I nourish the temple of creation.',
        frequency: '417Hz (Stimulating)',
      };
    }
    return {
      day: cycleDay,
      dosha: 'Pitta',
      phase: 'Transform',
      mantra: 'Om Dum Durgaye Namaha — I transform fire into wisdom.',
      frequency: '528Hz (Cooling)',
    };
  }, [cycleDay]);

  useEffect(() => {
    let interval: number | undefined;
    if (isTransmitting) {
      interval = window.setInterval(() => {
        setTransmissionProgress((prev) => {
          if (prev >= 100) {
            setIsTransmitting(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 100);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isTransmitting]);

  const toggleTransmission = () => {
    setIsTransmitting((v) => !v);
    setTransmissionProgress(0);
  };

  const doshaAccent =
    cycleInfo.dosha === 'Pitta'
      ? { boxShadow: '0 0 30px rgba(212,175,55,0.4)' }
      : cycleInfo.dosha === 'Vata'
        ? { filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.65))' }
        : undefined;

  return (
    <div className="min-h-screen" style={{ background: '#050505', color: '#D4AF37', paddingBottom: 104 }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-12">
        <header className="flex items-center justify-between gap-4 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mr-1 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.35em]"
              style={{ borderColor: 'rgba(212,175,55,0.18)', color: 'rgba(212,175,55,0.65)', background: 'rgba(255,255,255,0.02)' }}
            >
              Back
            </button>
            <div
              className="w-12 h-12 rounded-full border flex items-center justify-center"
              style={{ borderColor: 'rgba(212,175,55,0.30)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}
            >
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-[0.3em] uppercase" style={{ color: 'rgba(212,175,55,0.92)' }}>
                Sovereign
              </h1>
              <p className="text-[10px] tracking-[0.3em] opacity-60 uppercase" style={{ color: 'rgba(212,175,55,0.55)' }}>
                Hormonal Alchemy
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(212,175,55,0.45)' }}>
                Wise Woman Mode
              </span>
              <button
                type="button"
                onClick={() => setIsWiseWomanMode((v) => !v)}
                className="w-12 h-6 rounded-full border relative transition-colors duration-500"
                style={{
                  borderColor: 'rgba(212,175,55,0.25)',
                  background: isWiseWomanMode ? 'rgba(212,175,55,0.16)' : 'transparent',
                }}
              >
                <motion.div
                  animate={{ x: isWiseWomanMode ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 rounded-full"
                  style={{ background: '#D4AF37', boxShadow: '0 0 10px rgba(212,175,55,0.5)' }}
                />
              </button>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <section
              className="rounded-[32px] p-7 border relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.10)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-12 h-12" />
              </div>

              <h2 className="text-xs uppercase tracking-[0.2em] mb-6 opacity-70 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Jyotish Sync
              </h2>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Current Nakshatra</p>
                  <p className="text-xl font-semibold italic" style={{ color: 'rgba(212,175,55,0.92)' }}>
                    Rohini
                  </p>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Cycle Day</p>
                    <input
                      type="range"
                      min={1}
                      max={32}
                      value={cycleDay}
                      onChange={(e) => setCycleDay(Number(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#D4AF37', background: 'rgba(212,175,55,0.10)' }}
                    />
                  </div>
                  <span className="text-3xl font-black" style={{ color: 'rgba(212,175,55,0.9)' }}>
                    {cycleDay}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border transition-all duration-700" style={{ borderColor: 'rgba(212,175,55,0.12)', ...doshaAccent }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(212,175,55,0.85)' }}>
                      {cycleInfo.dosha}
                    </span>
                    {cycleInfo.dosha === 'Vata' && <Wind className="w-4 h-4" />}
                    {cycleInfo.dosha === 'Kapha' && <Droplets className="w-4 h-4" />}
                    {cycleInfo.dosha === 'Pitta' && <Flame className="w-4 h-4" />}
                  </div>
                  <p className="text-2xl font-semibold italic" style={{ color: 'rgba(212,175,55,0.92)' }}>
                    {cycleInfo.phase}
                  </p>
                </div>
              </div>
            </section>

            <AnimatePresence mode="wait">
              {isWiseWomanMode && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-[32px] p-7 border"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(34,211,238,0.22)',
                    boxShadow: '0 0 28px rgba(34,211,238,0.08)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <h2 className="text-xs uppercase tracking-[0.2em] mb-6 opacity-70 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Wise Woman Mode
                  </h2>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Pitta Surges</p>
                        <p className="text-xl font-black" style={{ color: 'rgba(212,175,55,0.9)' }}>
                          {pittaSurges} <span className="text-xs opacity-60 font-semibold">Today</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPittaSurges((s) => s + 1)}
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
                        style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(255,255,255,0.01)' }}
                      >
                        <Flame className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-4 border-t" style={{ borderColor: 'rgba(212,175,55,0.10)' }}>
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Prithvi Mudra Light-Code</p>
                      <div className="p-4 rounded-xl text-[11px] leading-relaxed italic opacity-80" style={{ background: 'rgba(212,175,55,0.06)' }}>
                        Touch the tip of the ring finger to the tip of the thumb. Visualize golden roots extending from your spine into the crystalline core of Gaia.
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <section
              className="rounded-[40px] p-10 md:p-12 border relative overflow-hidden min-h-[380px] flex flex-col items-center justify-center text-center"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.12)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, rgba(212,175,55,0.05) 0%, transparent 70%)' }} />

              <motion.div
                animate={{
                  scale: isTransmitting ? [1, 1.05, 1] : 1,
                  rotate: isTransmitting ? 360 : 0,
                }}
                transition={{ duration: 4, repeat: isTransmitting ? Infinity : 0, ease: 'linear' }}
                className="w-48 h-48 rounded-full border flex items-center justify-center mb-8 relative"
                style={{ borderColor: 'rgba(212,175,55,0.20)' }}
              >
                <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(212,175,55,0.06)' }} />
                <div className="w-40 h-40 rounded-full border flex items-center justify-center"
                  style={{ borderColor: 'rgba(212,175,55,0.40)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <Zap className="w-12 h-12" style={{ color: isTransmitting ? '#D4AF37' : 'rgba(212,175,55,0.25)' }} />
                </div>
              </motion.div>

              <h2 className="text-2xl font-black tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(212,175,55,0.92)' }}>
                Scalar Transmission
              </h2>
              <p className="text-[10px] uppercase tracking-[0.45em] opacity-60 mb-8">{cycleInfo.frequency}</p>

              <button
                type="button"
                onClick={toggleTransmission}
                className="px-10 py-4 rounded-full border text-xs font-black uppercase tracking-[0.35em] transition-all duration-500 relative overflow-hidden"
                style={{
                  borderColor: 'rgba(212,175,55,0.55)',
                  background: isTransmitting ? 'rgba(212,175,55,0.85)' : 'transparent',
                  color: isTransmitting ? '#050505' : 'rgba(212,175,55,0.95)',
                }}
              >
                {isTransmitting ? 'Deactivate Field' : 'Activate Transmission'}
                {isTransmitting && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1"
                    style={{ background: 'rgba(5,5,5,0.25)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${transmissionProgress}%` }}
                  />
                )}
              </button>

              {isTransmitting && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-[11px] italic opacity-70 max-w-sm">
                  Harmonizing Anahata-field with {cycleInfo.dosha} specific scalar waves...
                </motion.p>
              )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-[32px] p-7 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.10)', backdropFilter: 'blur(12px)' }}>
                <h2 className="text-xs uppercase tracking-[0.2em] mb-6 opacity-70 flex items-center gap-2">
                  <Sun className="w-3 h-3" /> Daily Mantra
                </h2>
                <p className="text-xl font-semibold italic leading-relaxed" style={{ color: 'rgba(212,175,55,0.92)' }}>
                  “{cycleInfo.mantra}”
                </p>
                <div className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-60">
                  <span>Anahata-Opening Frequency</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(212,175,55,0.18)' }} />
                </div>
              </div>

              <div className="rounded-[32px] p-7 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.10)', backdropFilter: 'blur(12px)' }}>
                <h2 className="text-xs uppercase tracking-[0.2em] mb-6 opacity-70 flex items-center gap-2">
                  <Heart className="w-3 h-3" /> Avataric Guidance
                </h2>
                <ul className="space-y-4">
                  {[
                    {
                      label: 'Nutrition',
                      value:
                        cycleInfo.dosha === 'Vata'
                          ? 'Warm, grounding soups'
                          : cycleInfo.dosha === 'Kapha'
                            ? 'Spicy, light greens'
                            : 'Cooling coconut water',
                    },
                    {
                      label: 'Movement',
                      value: cycleInfo.dosha === 'Vata' ? 'Yin Yoga' : cycleInfo.dosha === 'Kapha' ? 'Sun Salutations' : 'Moonlight walks',
                    },
                    { label: 'Ritual', value: 'Rose water anointing' },
                  ].map((item, i) => (
                    <li key={i} className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'rgba(212,175,55,0.06)' }}>
                      <span className="text-[10px] uppercase tracking-widest opacity-60">{item.label}</span>
                      <span className="text-xs italic" style={{ color: 'rgba(212,175,55,0.88)' }}>
                        {item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 opacity-60 text-[10px] uppercase tracking-widest"
          style={{ borderColor: 'rgba(212,175,55,0.10)' }}
        >
          <div className="flex items-center gap-4">
            <span>AffiliateID: SQI_2050_ELITE</span>
            <span>Stripe Gateway: Active</span>
          </div>
          <div className="flex items-center gap-2 text-center">
            <Info className="w-3 h-3" />
            <span>Transmission Status: Scalar healing activated for all users within the Anahata-field.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

