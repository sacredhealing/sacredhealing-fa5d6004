import React, { useEffect, useState } from 'react';
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
  Calendar,
} from 'lucide-react';
import { useCyclePhase } from '@/hooks/useCyclePhase';

export default function SovereignHormonalAlchemy() {
  const navigate = useNavigate();
  const {
    phase,
    cycleDay,
    daysUntilNextPhase,
    isConfigured,
    settings,
    isLoading,
    updateCycleSettings,
    isSaving,
  } = useCyclePhase();

  const [isWiseWomanMode, setIsWiseWomanMode] = useState(false);
  const [pittaSurges, setPittaSurges] = useState(0);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionProgress, setTransmissionProgress] = useState(0);

  // Setup form state
  const [showSetup, setShowSetup] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formCycleLen, setFormCycleLen] = useState(28);
  const [formBleedDays, setFormBleedDays] = useState(5);

  // Show setup if not configured
  useEffect(() => {
    if (!isLoading && !isConfigured) setShowSetup(true);
  }, [isLoading, isConfigured]);

  // Populate form from existing settings
  useEffect(() => {
    if (settings) {
      if (settings.lastPeriodDate) setFormDate(settings.lastPeriodDate);
      setFormCycleLen(settings.cycleLength);
      setFormBleedDays(settings.bleedDays);
    }
  }, [settings]);

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

  const handleSaveSettings = () => {
    if (!formDate) return;
    updateCycleSettings(formDate, formCycleLen, formBleedDays);
    setShowSetup(false);
  };

  const doshaIcon =
    phase.dosha === 'Vata' ? <Wind className="w-4 h-4" /> :
    phase.dosha === 'Kapha' ? <Droplets className="w-4 h-4" /> :
    <Flame className="w-4 h-4" />;

  const doshaAccent =
    phase.dosha === 'Pitta'
      ? { boxShadow: '0 0 30px rgba(212,175,55,0.4)' }
      : phase.dosha === 'Vata'
        ? { filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.65))' }
        : undefined;

  return (
    <div className="min-h-screen" style={{ background: '#050505', color: '#D4AF37', paddingBottom: 104 }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-12">
        {/* HEADER */}
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
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.25em]"
              style={{ borderColor: 'rgba(212,175,55,0.18)', color: 'rgba(212,175,55,0.65)', background: 'rgba(255,255,255,0.02)' }}
            >
              <Calendar className="w-3 h-3 inline mr-1" />
              Cycle
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(212,175,55,0.45)' }}>
                Wise Woman
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

        {/* SETUP MODAL */}
        <AnimatePresence>
          {showSetup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
              onClick={() => isConfigured && setShowSetup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl border p-8 space-y-6"
                style={{ background: '#0a0a0a', borderColor: 'rgba(212,175,55,0.20)' }}
              >
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-center" style={{ color: 'rgba(212,175,55,0.92)' }}>
                  Cycle Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
                      Last Period Start Date
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full rounded-xl border px-4 py-3 text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(212,175,55,0.15)',
                        color: '#D4AF37',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
                        Cycle Length
                      </label>
                      <input
                        type="number"
                        min={21}
                        max={40}
                        value={formCycleLen}
                        onChange={(e) => setFormCycleLen(Number(e.target.value))}
                        className="w-full rounded-xl border px-4 py-3 text-sm text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
                        Bleed Days
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={formBleedDays}
                        onChange={(e) => setFormBleedDays(Number(e.target.value))}
                        className="w-full rounded-xl border px-4 py-3 text-sm text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={!formDate || isSaving}
                  className="w-full py-3 rounded-full border text-xs font-black uppercase tracking-[0.35em] transition-all"
                  style={{
                    borderColor: 'rgba(212,175,55,0.55)',
                    background: formDate ? 'rgba(212,175,55,0.85)' : 'transparent',
                    color: formDate ? '#050505' : 'rgba(212,175,55,0.4)',
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save & Align'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN GRID */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-8">
            <section
              className="rounded-[32px] p-7 border relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.10)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-12 h-12" />
              </div>

              <h2 className="text-xs uppercase tracking-[0.2em] mb-6 opacity-70 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Cycle Phase
              </h2>

              <div className="space-y-6">
                {/* Phase name + day */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Current Phase</p>
                  <p className="text-xl font-semibold italic" style={{ color: phase.colorAccent }}>
                    {phase.name}
                  </p>
                </div>

                {/* Cycle day display */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Cycle Day</p>
                    <div className="w-full h-1 rounded-full" style={{ background: 'rgba(212,175,55,0.10)' }}>
                      <div
                        className="h-1 rounded-full transition-all duration-700"
                        style={{
                          width: `${(cycleDay / (settings?.cycleLength ?? 28)) * 100}%`,
                          background: phase.colorAccent,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-3xl font-black" style={{ color: 'rgba(212,175,55,0.9)' }}>
                    {cycleDay}
                  </span>
                </div>

                {/* Days until next phase */}
                <p className="text-[10px] uppercase tracking-widest opacity-40">
                  {daysUntilNextPhase} day{daysUntilNextPhase !== 1 ? 's' : ''} until next phase
                </p>

                {/* Dosha card */}
                <div className="p-4 rounded-2xl border transition-all duration-700" style={{ borderColor: 'rgba(212,175,55,0.12)', ...doshaAccent }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(212,175,55,0.85)' }}>
                      {phase.dosha}
                    </span>
                    {doshaIcon}
                  </div>
                  <p className="text-2xl font-semibold italic" style={{ color: 'rgba(212,175,55,0.92)' }}>
                    {phase.label}
                  </p>
                </div>

                {!isConfigured && (
                  <button
                    type="button"
                    onClick={() => setShowSetup(true)}
                    className="w-full py-2 rounded-full border text-[10px] font-bold uppercase tracking-[0.3em]"
                    style={{ borderColor: 'rgba(212,175,55,0.25)', color: 'rgba(212,175,55,0.7)' }}
                  >
                    Set Your Cycle Date
                  </button>
                )}
              </div>
            </section>

            {/* WISE WOMAN MODE */}
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
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-2">{phase.mudra} Light-Code</p>
                      <div className="p-4 rounded-xl text-[11px] leading-relaxed italic opacity-80" style={{ background: 'rgba(212,175,55,0.06)' }}>
                        {phase.mudraInstruction}
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* TRANSMISSION */}
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
              <p className="text-[10px] uppercase tracking-[0.45em] opacity-60 mb-8">{phase.frequency}</p>

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
                  Harmonizing Anahata-field with {phase.dosha}-specific {phase.frequencyHz}Hz scalar waves...
                </motion.p>
              )}
            </section>

            {/* MANTRA + GUIDANCE CARDS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-[32px] p-7 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.10)', backdropFilter: 'blur(12px)' }}>
                <h2 className="text-xs uppercase tracking-[0.2em] mb-6 opacity-70 flex items-center gap-2">
                  <Sun className="w-3 h-3" /> Daily Mantra
                </h2>
                <p className="text-xl font-semibold italic leading-relaxed" style={{ color: 'rgba(212,175,55,0.92)' }}>
                  &ldquo;{phase.mantra}&rdquo;
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
                    { label: 'Nutrition', value: phase.nutrition },
                    { label: 'Movement', value: phase.movement },
                    { label: 'Ritual', value: phase.ritual },
                  ].map((item, i) => (
                    <li key={i} className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'rgba(212,175,55,0.06)' }}>
                      <span className="text-[10px] uppercase tracking-widest opacity-60">{item.label}</span>
                      <span className="text-xs italic text-right max-w-[60%]" style={{ color: 'rgba(212,175,55,0.88)' }}>
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
            <span>Phase: {phase.name}</span>
            <span>Day {cycleDay}</span>
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
