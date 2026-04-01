/**
 * Admin-only Quantum Apothecary 2045 lab (Gemini SQI + demo Nadi scan).
 * Linked from Siddha Portal when the user has the admin role.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Zap, Activity, Plus, Trash2, Send, Cpu, Globe, Info, Wind } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import type { Activation, ActivationType, NadiScanResult, Message } from '@/features/quantum-apothecary/types';
import { ACTIVATIONS, PLANETARY_DATA } from '@/features/quantum-apothecary/constants';
import { chatWithAlchemist } from '@/features/admin-quantum-apothecary-2045/geminiAlchemistChat';

const ACCENT = '#ff4e00';
const BG = '#0a0502';

type LibraryFilter = ActivationType | 'All';

const FILTER_ORDER: LibraryFilter[] = [
  'All',
  'Sacred Plant',
  'Siddha Soma',
  'Essential Oil',
  'Ayurvedic Herb',
];

export default function AdminQuantumApothecary2045() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  const [scanResult, setScanResult] = useState<NadiScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>(() => {
    try {
      const saved = localStorage.getItem('admin_qa2045_resonators');
      if (saved) return JSON.parse(saved) as Activation[];
    } catch { /* ignore */ }
    return [];
  });
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'model', text: t('adminQuantumApothecary2045.welcomeModel') },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<LibraryFilter>('All');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [heartRate, setHeartRate] = useState(60);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const geminiKeyPresent = Boolean((import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim());

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('admin_qa2045_resonators', JSON.stringify(activeTransmissions));
    } catch { /* ignore */ }
  }, [activeTransmissions]);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setHeartRate((prev) => Math.min(prev + Math.floor(Math.random() * 5) + 2, 130));
      }, 500);
      return () => clearInterval(interval);
    }
    const interval = setInterval(() => {
      setHeartRate((prev) => Math.max(prev - 2, 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [isScanning]);

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/50" style={{ background: BG }}>
        <span className="text-[10px] uppercase tracking-[0.5em]">{t('adminQuantumApothecary2045.initializing')}</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/siddha-portal" replace />;

  const runNadiScan = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      /* camera optional for demo path */
    }

    window.setTimeout(() => {
      const now = new Date();
      const day = now.getDay();
      const doshas: NadiScanResult['dominantDosha'][] = ['Vata', 'Pitta', 'Kapha'];
      const nadis = [
        t('adminQuantumApothecary2045.blockageThroat'),
        t('adminQuantumApothecary2045.blockageRoot'),
        t('adminQuantumApothecary2045.blockageHeart'),
        t('adminQuantumApothecary2045.blockageThirdEye'),
        t('adminQuantumApothecary2045.blockageSolar'),
      ];
      const shuffled = [...ACTIVATIONS].sort(() => 0.5 - Math.random());
      const selectedRemedies = shuffled.slice(0, 5).map((a) => a.name);

      const result: NadiScanResult = {
        dominantDosha: doshas[Math.floor(Math.random() * doshas.length)],
        blockages: [nadis[Math.floor(Math.random() * nadis.length)]!],
        planetaryAlignment: PLANETARY_DATA[day].planet,
        herbOfToday: PLANETARY_DATA[day].herb,
        timestamp: now.toISOString(),
        activeNadis: Math.floor(Math.random() * 10000) + 60000,
        totalNadis: 72000,
        remedies: selectedRemedies,
      };

      setScanResult(result);
      setIsScanning(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const scanMsg = t('adminQuantumApothecary2045.scanCompleteModel', {
        active: result.activeNadis,
        total: result.totalNadis,
        dosha: result.dominantDosha,
        blockage: result.blockages[0],
        alignment: result.planetaryAlignment,
        remedies: result.remedies.join(', '),
      });
      setMessages((prev) => [...prev, { role: 'model', text: scanMsg }]);
    }, 5000);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!geminiKeyPresent) return;

    const userMsg: Message = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithAlchemist([...messages, userMsg]);
      setMessages((prev) => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      const fallback =
        code === 'GEMINI_KEY_MISSING'
          ? t('adminQuantumApothecary2045.errorNoKey')
          : t('adminQuantumApothecary2045.transmissionError');
      setMessages((prev) => [...prev, { role: 'model', text: fallback }]);
    } finally {
      setIsTyping(false);
    }
  };

  const addActivation = (act: Activation) => {
    if (selectedActivations.length >= 5) return;
    if (selectedActivations.find((a) => a.id === act.id)) return;
    setSelectedActivations([...selectedActivations, act]);
  };

  const removeActivation = (id: string) => {
    setSelectedActivations(selectedActivations.filter((a) => a.id !== id));
  };

  const transmitCocktail = () => {
    if (selectedActivations.length === 0) return;
    const newTransmissions = [...activeTransmissions];
    selectedActivations.forEach((act) => {
      if (!newTransmissions.find((tr) => tr.id === act.id)) newTransmissions.push(act);
    });
    setActiveTransmissions(newTransmissions);
    const names = selectedActivations.map((a) => a.name).join(', ');
    setMessages((prev) => [...prev, { role: 'model', text: t('adminQuantumApothecary2045.transmitModel', { names }) }]);
    setSelectedActivations([]);
  };

  const stopTransmission = (id: string) => {
    setActiveTransmissions(activeTransmissions.filter((tr) => tr.id !== id));
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      window.setTimeout(() => {
        setIsListening(false);
        setInput(t('adminQuantumApothecary2045.voiceSimulatedInput'));
      }, 2000);
    }
  };

  const applyRemedies = () => {
    if (!scanResult) return;
    const remediesToApply = ACTIVATIONS.filter((a) => scanResult.remedies.includes(a.name));
    const newTransmissions = [...activeTransmissions];
    remediesToApply.forEach((act) => {
      if (!newTransmissions.find((tr) => tr.id === act.id)) newTransmissions.push(act);
    });
    setActiveTransmissions(newTransmissions);
    setMessages((prev) => [
      ...prev,
      { role: 'model', text: t('adminQuantumApothecary2045.applyRemediesModel', { remedies: scanResult.remedies.join(', ') }) },
    ]);
  };

  const filterLabel = (id: LibraryFilter) =>
    id === 'All' ? t('adminQuantumApothecary2045.catAll') : id;

  const filteredActs =
    activeCategory === 'All'
      ? ACTIVATIONS
      : ACTIVATIONS.filter((a) => a.type === activeCategory);

  return (
    <div className="min-h-screen font-sans text-white/90" style={{ background: BG }}>
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="goo-qa2045">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, #3a1510 0%, transparent 60%), radial-gradient(circle at 10% 80%, #ff4e00 0%, transparent 50%), radial-gradient(circle at 90% 20%, #818cf8 0%, transparent 40%)',
          filter: 'blur(80px)',
          animation: `pulse-bg ${600 / Math.max(heartRate, 60)}s ease-in-out infinite`,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-10"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
        }}
      />

      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-[#0a0502]/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/siddha-portal')}
          className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 hover:text-white/70"
        >
          {t('adminQuantumApothecary2045.back')}
        </button>
        <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-400">
          {t('siddhaPortal.adminApothecary2045Badge')}
        </span>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12 lg:gap-8 lg:px-6">
        <div className="flex flex-col gap-6 lg:col-span-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg border p-2 shadow-[0_0_20px_rgba(255,78,0,0.2)]" style={{ borderColor: `${ACCENT}4d`, background: `${ACCENT}1a` }}>
              <Cpu className="h-6 w-6" style={{ color: ACCENT }} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-light uppercase tracking-tighter text-white" style={{ textShadow: `0 0 20px ${ACCENT}33` }}>
                {t('adminQuantumApothecary2045.title')}
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{t('adminQuantumApothecary2045.subtitle')}</p>
            </div>
            <button type="button" onClick={() => setShowKnowledge(true)} className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10">
              <Info className="h-5 w-5 text-white/60" aria-hidden />
              <span className="sr-only">{t('adminQuantumApothecary2045.knowledgeAria')}</span>
            </button>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-6 flex justify-between">
              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider">{t('adminQuantumApothecary2045.digitalNadiScan')}</h2>
                <p className="text-xs text-white/60">{t('adminQuantumApothecary2045.channelsMonitoring')}</p>
              </div>
              <Activity className={`h-5 w-5 ${isScanning ? 'animate-pulse text-green-400' : ''}`} style={{ color: isScanning ? undefined : ACCENT }} />
            </div>

            {scanResult ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
                  <div className="relative flex h-full w-full items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute h-full w-full rounded-full border border-amber-500/10" />
                    <div className="relative z-10 text-center">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/40">{t('adminQuantumApothecary2045.activeNadisLabel')}</p>
                      <p className="text-4xl font-light tracking-tighter text-amber-500">{scanResult.activeNadis}</p>
                      <p className="text-[10px] text-white/30">/ {scanResult.totalNadis.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                    <p className="mb-1 text-[10px] uppercase text-white/40">{t('adminQuantumApothecary2045.dosha')}</p>
                    <p className="text-lg font-medium">{scanResult.dominantDosha}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                    <p className="mb-1 text-[10px] uppercase text-white/40">{t('adminQuantumApothecary2045.alignment')}</p>
                    <p className="text-sm font-medium leading-tight">{scanResult.planetaryAlignment}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border p-4" style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}0d` }}>
                    <p className="mb-1 text-[10px] font-bold uppercase" style={{ color: ACCENT }}>{t('adminQuantumApothecary2045.siddhaRemedies')}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {scanResult.remedies.map((r, i) => (
                        <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px]">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase text-emerald-400">{t('adminQuantumApothecary2045.herbToday')}</p>
                    <p className="text-sm">{scanResult.herbOfToday}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={applyRemedies} className="liquid-btn flex-1 rounded-[20px] border border-emerald-500/30 bg-emerald-500/20 py-3 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/30">
                    {t('adminQuantumApothecary2045.applyRemedies')}
                  </button>
                  <button type="button" onClick={runNadiScan} className="liquid-btn rounded-[20px] bg-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/20">
                    {t('adminQuantumApothecary2045.rescan')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  {isScanning ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover opacity-60 grayscale" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-px w-full animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#ff4e00]" style={{ background: ACCENT }} />
                      </div>
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">{t('adminQuantumApothecary2045.liveBioFeed')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                      <Zap className="mb-2 h-8 w-8" />
                      <p className="text-[10px] uppercase tracking-widest">{t('adminQuantumApothecary2045.awaitingHandshake')}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={runNadiScan}
                  disabled={isScanning}
                  className="rounded-[30px] px-8 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-lg transition-all disabled:opacity-50"
                  style={{ background: ACCENT, boxShadow: `0 10px 40px ${ACCENT}33` }}
                >
                  {isScanning ? t('adminQuantumApothecary2045.scanningHr', { hr: heartRate }) : t('adminQuantumApothecary2045.initiateScan')}
                </button>
              </div>
            )}
          </section>

          <section className="flex min-h-[280px] flex-none flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:min-h-0 lg:flex-1">
            <div className="mb-6 flex justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider">{t('adminQuantumApothecary2045.aethericMixer')}</h2>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/60">{t('adminQuantumApothecary2045.slots', { n: selectedActivations.length })}</span>
            </div>
            <div className="mb-6 flex-1 space-y-3">
              {selectedActivations.length === 0 ? (
                <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 p-8 text-center opacity-30">
                  <Plus className="mb-2 h-8 w-8" />
                  <p className="text-xs">{t('adminQuantumApothecary2045.mixerEmpty')}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {selectedActivations.map((act) => (
                    <motion.div
                      key={act.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: act.color }} />
                        <div>
                          <p className="text-xs font-medium">{act.name}</p>
                          <p className="text-[10px] italic text-white/50">{act.vibrationalSignature}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeActivation(act.id)} className="p-2 text-white/30 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100" aria-label={t('adminQuantumApothecary2045.removeActivation')}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            <button type="button" onClick={transmitCocktail} disabled={selectedActivations.length === 0} className="liquid-btn w-full rounded-[30px] bg-white py-4 text-xs font-black uppercase tracking-[0.3em] text-black hover:bg-[#e0d8d0] disabled:opacity-30">
              {t('adminQuantumApothecary2045.transmitCode')}
            </button>
          </section>

          <section className="flex min-h-[200px] flex-none flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:min-h-0 lg:flex-1">
            <div className="mb-6 flex justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 animate-pulse text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em]">{t('adminQuantumApothecary2045.activeTransmissions')}</h2>
              </div>
              <span className="animate-pulse rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">{t('adminQuantumApothecary2045.live247')}</span>
            </div>
            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto">
              {activeTransmissions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/5 p-4 text-center opacity-20">
                  <Zap className="mb-2 h-8 w-8" />
                  <p className="text-[10px] uppercase tracking-widest">{t('adminQuantumApothecary2045.noActiveFrequencies')}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {activeTransmissions.map((act) => (
                    <motion.div
                      key={act.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: act.color }} />
                          <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full opacity-50" style={{ backgroundColor: act.color }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-400/90">{act.name}</p>
                          <p className="text-[9px] uppercase tracking-tighter text-white/50">{t('adminQuantumApothecary2045.resonating')}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => stopTransmission(act.id)} className="p-2 text-white/30 hover:text-red-400" title={t('adminQuantumApothecary2045.stopTransmissionTitle')} aria-label={t('adminQuantumApothecary2045.stopTransmissionTitle')}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-8 lg:max-h-[calc(100vh-8rem)] lg:grid lg:grid-rows-2 lg:overflow-hidden">
          <section className="flex min-h-[360px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8 lg:min-h-0">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="mb-1 text-xl font-light uppercase tracking-widest text-white" style={{ textShadow: `0 0 12px ${ACCENT}22` }}>{t('adminQuantumApothecary2045.frequencyLibrary')}</h2>
                <p className="text-xs text-white/50">{t('adminQuantumApothecary2045.selectEssences')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_ORDER.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveCategory(type)}
                    className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-[9px] uppercase tracking-tighter transition-all ${
                      activeCategory === type ? 'text-white shadow-[0_0_15px_rgba(255,78,0,0.3)]' : 'border-white/10 bg-white/5 text-white/60 hover:opacity-100'
                    }`}
                    style={activeCategory === type ? { background: ACCENT, borderColor: ACCENT } : undefined}
                  >
                    {filterLabel(type)}
                  </button>
                ))}
              </div>
            </div>
            <div className="custom-scrollbar grid flex-1 grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {filteredActs.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => addActivation(act)}
                  disabled={selectedActivations.some((a) => a.id === act.id)}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-3 text-left transition-all hover:border-[#ff4e00]/40 hover:bg-[#ff4e00]/5 disabled:opacity-40 sm:p-4"
                >
                  <div className="absolute left-0 top-0 h-full w-1 opacity-40 transition-opacity group-hover:opacity-100" style={{ backgroundColor: act.color }} />
                  <h3 className="mb-1 text-xs font-bold transition-colors group-hover:text-[#ff4e00]">{act.name}</h3>
                  <p className="line-clamp-2 text-[10px] leading-tight text-white/40">{act.benefit}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="relative flex min-h-[380px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl lg:min-h-0">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff4e00] to-[#78350f] shadow-lg shadow-[#ff4e00]/20">
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('adminQuantumApothecary2045.sqiOnline')}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[9px] uppercase tracking-tighter text-white/50">{t('adminQuantumApothecary2045.neuralSync')}</span>
                  </div>
                </div>
              </div>
              <Info className="h-4 w-4 cursor-help text-white/30" aria-hidden />
            </div>
            {!geminiKeyPresent && (
              <div
                className="border-b border-amber-500/25 bg-amber-950/50 px-4 py-2.5 text-center text-[10px] leading-snug text-amber-200/95 sm:px-6"
                role="status"
              >
                {t('adminQuantumApothecary2045.bannerNoGeminiKey')}
              </div>
            )}
            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-3xl p-4 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'rounded-tr-none text-white' : 'rounded-tl-none border border-white/10 bg-white/5 text-[#e0d8d0]/90'
                    }`}
                    style={msg.role === 'user' ? { background: ACCENT } : undefined}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-3xl rounded-tl-none border border-white/10 bg-white/5 p-4">
                    {[0, 0.2, 0.4].map((d) => (
                      <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-white/10 bg-white/5 p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`rounded-2xl border p-4 transition-all ${isListening ? 'animate-pulse border-red-500 bg-red-500/20 text-red-500' : 'border-white/10 bg-white/5 text-white/60 hover:text-white'}`}
                  title={t('adminQuantumApothecary2045.talkToAether')}
                  aria-label={t('adminQuantumApothecary2045.talkToAether')}
                >
                  <Wind className="h-5 w-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('adminQuantumApothecary2045.chatPlaceholder')}
                    disabled={!geminiKeyPresent}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-6 pr-16 text-sm text-white placeholder:text-white/25 focus:border-[#ff4e00]/50 focus:outline-none disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={!input.trim() || isTyping || !geminiKeyPresent}
                    className="absolute bottom-2 right-2 top-2 rounded-xl px-4 text-white transition-all disabled:opacity-30"
                    style={{ background: ACCENT }}
                    aria-label={t('adminQuantumApothecary2045.send')}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {showKnowledge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="qa2045-knowledge-title">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="custom-scrollbar max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-[40px] border border-white/10 bg-[#1a1614] p-8 sm:p-12">
              <div className="mb-8 flex justify-between">
                <h2 id="qa2045-knowledge-title" className="text-2xl font-light uppercase tracking-tighter text-white">{t('adminQuantumApothecary2045.knowledgeTitle')}</h2>
                <button type="button" onClick={() => setShowKnowledge(false)} className="rounded-full p-2 hover:bg-white/5" aria-label={t('adminQuantumApothecary2045.closeKnowledge')}>
                  <Trash2 className="h-6 w-6 text-white/40" />
                </button>
              </div>
              <div className="space-y-8 text-sm leading-relaxed text-white/80">
                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('adminQuantumApothecary2045.kWhatTitle')}</h3>
                  <p>{t('adminQuantumApothecary2045.kWhatBody')}</p>
                </section>
                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('adminQuantumApothecary2045.kNadiTitle')}</h3>
                  <p>{t('adminQuantumApothecary2045.kNadiBody')}</p>
                </section>
                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('adminQuantumApothecary2045.k247Title')}</h3>
                  <p>{t('adminQuantumApothecary2045.k247Body')}</p>
                </section>
                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('adminQuantumApothecary2045.kWisdomTitle')}</h3>
                  <p>{t('adminQuantumApothecary2045.kWisdomBody')}</p>
                </section>
              </div>
              <button type="button" onClick={() => setShowKnowledge(false)} className="mt-12 w-full rounded-2xl py-4 text-sm font-bold uppercase tracking-widest text-white" style={{ background: ACCENT }}>
                {t('adminQuantumApothecary2045.returnAether')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scan { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(100px); } }
        @keyframes pulse-bg { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.05); opacity: 0.45; } }
        .liquid-btn { filter: url(#goo-qa2045); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
      `}</style>
    </div>
  );
}
