/**
 * Admin-only Quantum Apothecary 2045 lab (Gemini SQI + demo Nadi scan).
 * Linked from Siddha Portal when the user has the admin role.
 */
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Zap, Activity, Plus, Trash2, Send, Cpu, Globe, Info, Wind } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import type { Activation, NadiScanResult, Message } from '@/features/quantum-apothecary/types';
import { matchActivationsToScan } from '@/features/quantum-apothecary/bioenergetic-library';
import { ACTIVATIONS, PLANETARY_DATA, mapBioLibraryToActivation, ALL_ACTIVATIONS } from '@/features/quantum-apothecary/constants';
import { chatWithAlchemist } from '@/features/admin-quantum-apothecary-2045/geminiAlchemistChat';
import { supabase } from '@/integrations/supabase/client';
import { StudentSelector } from '@/components/codex/StudentSelector';
import { getActiveStudentId } from '@/lib/codex/students';
import { curateTransmission } from '@/lib/codex/curatorClient';
import { syncPendingTransmissionsOnce } from '@/lib/codex/codexSync';

const FrequencyLibrarySection = lazy(() => import('@/features/quantum-apothecary/FrequencyLibrarySection'));
const ActiveTransmissionsSection = lazy(() => import('@/features/quantum-apothecary/ActiveTransmissionsSection'));

/** SQI 2050 — Siddha-Gold primary, Vayu-Cyan Nadi pulse (UI tokens only) */
const GOLD = '#D4AF37';
const GOLD_RGB = '212, 175, 55';
const BG = '#050505';
const VAYU = '#22D3EE';

/** Glass shell — matches sovereign Profile / SQI standard */
const glassSection =
  'rounded-[40px] border border-white/[0.05] bg-white/[0.02] backdrop-blur-[40px] [-webkit-backdrop-filter:blur(40px)] shadow-[0_0_48px_rgba(212,175,55,0.05)]';

const microLabel = 'text-[8px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]/55';

const SESSION_GEMINI_STORAGE = 'admin_qa2045_gemini_session_key';

export default function AdminQuantumApothecary2045() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  // Sweep any unsynced SQI replies (from any surface) on mount.
  useEffect(() => {
    if (user?.id) void syncPendingTransmissionsOnce(user.id);
  }, [user?.id]);


  const [scanResult, setScanResult] = useState<NadiScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>([]);
  const [transmissionsLoaded, setTransmissionsLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'model', text: t('adminQuantumApothecary2045.welcomeModel') },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [heartRate, setHeartRate] = useState(60);
  const [sessionGeminiKey, setSessionGeminiKey] = useState(() => {
    try {
      return (sessionStorage.getItem(SESSION_GEMINI_STORAGE) ?? '').trim();
    } catch {
      return '';
    }
  });
  const [sessionKeyDraft, setSessionKeyDraft] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const envGeminiKey = ((import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '').trim();
  const effectiveGeminiKey = envGeminiKey || sessionGeminiKey;
  const geminiKeyPresent = Boolean(effectiveGeminiKey);
  const hasBuildTimeKey = Boolean(envGeminiKey);

  const applySessionGeminiKey = () => {
    const k = sessionKeyDraft.trim();
    if (!k) return;
    try {
      sessionStorage.setItem(SESSION_GEMINI_STORAGE, k);
    } catch {
      /* quota / private mode */
    }
    setSessionGeminiKey(k);
    setSessionKeyDraft('');
  };

  const clearSessionGeminiKey = () => {
    try {
      sessionStorage.removeItem(SESSION_GEMINI_STORAGE);
    } catch {
      /* ignore */
    }
    setSessionGeminiKey('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load active transmissions from Supabase on mount — migrate legacy localStorage once
  useEffect(() => {
    if (!user?.id || transmissionsLoaded) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('user_active_transmissions')
          .select('activations')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.activations && Array.isArray(data.activations) && data.activations.length > 0) {
          setActiveTransmissions(data.activations as Activation[]);
        } else {
          try {
            const saved = localStorage.getItem('admin_qa2045_resonators');
            if (saved) {
              const parsed = JSON.parse(saved) as Activation[];
              if (parsed.length > 0) {
                setActiveTransmissions(parsed);
                await supabase.from('user_active_transmissions').upsert(
                  {
                    user_id: user.id,
                    activations: parsed as unknown as Record<string, unknown>[],
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id' },
                );
              }
            }
          } catch {
            /* ignore corrupt localStorage */
          }
        }
      } catch (e) {
        console.error('[Transmissions] Load error:', e);
      }
      setTransmissionsLoaded(true);
    };
    void load();
  }, [user?.id, transmissionsLoaded]);

  // Sync to Supabase + localStorage cache whenever stack changes (after initial load)
  useEffect(() => {
    if (!user?.id || !transmissionsLoaded) return;
    const sync = async () => {
      try {
        await supabase.from('user_active_transmissions').upsert(
          {
            user_id: user.id,
            activations: activeTransmissions as unknown as Record<string, unknown>[],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        try {
          localStorage.setItem('admin_qa2045_resonators', JSON.stringify(activeTransmissions));
        } catch {
          /* quota / private mode */
        }
      } catch (e) {
        console.error('[Transmissions] Sync error:', e);
      }
    };
    void sync();
  }, [activeTransmissions, user?.id, transmissionsLoaded]);

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
        <span className={microLabel}>{t('adminQuantumApothecary2045.initializing')}</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/siddha-portal" replace />;

  const runNadiScan = async () => {
    if (!transmissionsLoaded) return;
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

      // Map day-of-week to Ayurvedic Dosha dominance (deterministic, not random)
      const DAY_DOSHA: NadiScanResult['dominantDosha'][] = [
        'Pitta', 'Kapha', 'Pitta', 'Vata', 'Kapha', 'Vata', 'Vata',
      ];
      const dominantDosha = DAY_DOSHA[day] ?? 'Vata';

      const DOSHA_NADI: Record<string, string> = {
        Vata: 'Sushumna',
        Pitta: 'Pingala',
        Kapha: 'Ida',
      };
      const primaryNadi = DOSHA_NADI[dominantDosha] ?? 'Sushumna';

      const DOSHA_CHAKRA: Record<string, string> = {
        Vata: 'Muladhara',
        Pitta: 'Manipura',
        Kapha: 'Anahata',
      };
      const priorityChakra = DOSHA_CHAKRA[dominantDosha];

      const herbToday = PLANETARY_DATA[day].herb;
      const selectedRemedies = [herbToday];

      const result: NadiScanResult = {
        dominantDosha,
        blockages: [primaryNadi],
        planetaryAlignment: PLANETARY_DATA[day].planet,
        herbOfToday: herbToday,
        timestamp: now.toISOString(),
        activeNadis: Math.floor(Math.random() * 10000) + 60000,
        totalNadis: 72000,
        remedies: selectedRemedies,
      };

      setScanResult(result);
      setIsScanning(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const matchedBio = matchActivationsToScan(
        {
          dominantDosha: result.dominantDosha,
          activatedNadi: result.blockages?.[0] ?? 'Sushumna',
          priorityChakra,
          lowCoherenceItems: result.remedies ?? [],
        },
        8,
      );
      const matched = matchedBio.map(mapBioLibraryToActivation);
      if (matched.length > 0) {
        setActiveTransmissions((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newOnes = matched
            .filter((m) => !existingIds.has(m.id))
            .map((m) => ({
              ...m,
              activatedAt: new Date().toISOString(),
              source: 'nadi_scan' as const,
              expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            }));
          return [...prev, ...newOnes];
        });
      }

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
    if (!effectiveGeminiKey) return;

    const userMsg: Message = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithAlchemist([...messages, userMsg], {
        apiKey: effectiveGeminiKey,
      });
      setMessages((prev) => [...prev, { role: 'model', text: response }]);

      if (response) {
        const lower = response.toLowerCase();
        // Match on full name (≥5 chars), vibrationalSignature, and benefit prefix — SQI prose still hits
        const chatMatched = ALL_ACTIVATIONS.filter((act) => {
          if (!act.name) return false;
          const nameLower = act.name.toLowerCase();
          if (nameLower.length < 5) return false;
          if (lower.includes(nameLower)) return true;
          const sig = (act.vibrationalSignature ?? '').toLowerCase();
          if (sig.length >= 5 && lower.includes(sig)) return true;
          const ben = (act.benefit ?? '').toLowerCase().slice(0, 20);
          if (ben.length >= 5 && lower.includes(ben)) return true;
          return false;
        }).slice(0, 3);

        if (chatMatched.length > 0) {
          setActiveTransmissions((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newOnes = chatMatched
              .filter((m) => !existingIds.has(m.id))
              .map((m) => ({
                ...m,
                activatedAt: new Date().toISOString(),
                source: 'apothecary_chat' as const,
                expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
              }));
            return [...prev, ...newOnes];
          });
        }
      }

      // Weave this transmission into the right Codex with a visible toast so the
      // user always knows where it landed (Akasha / Portrait / Student / excluded / failed).
      if (user?.id && response?.trim()) {
        const activeStudentId = getActiveStudentId();
        void curateTransmission({
          source_type: 'apothecary',
          raw_content: response,
          user_prompt: userMsg.text,
          ...(activeStudentId ? { student_id: activeStudentId } : {}),
        });
      }
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

  const archiveFallback = (
    <div className="flex min-h-[160px] items-center justify-center py-10">
      <span className={`${microLabel} !text-white/40`}>{t('common.loading')}</span>
    </div>
  );

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
        className="pointer-events-none fixed inset-0 -z-10 opacity-50"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 20%, rgba(${GOLD_RGB},0.12) 0%, transparent 55%),
            radial-gradient(circle at 15% 75%, rgba(34,211,238,0.06) 0%, transparent 45%),
            radial-gradient(circle at 85% 30%, rgba(${GOLD_RGB},0.08) 0%, transparent 50%)`,
          filter: 'blur(72px)',
          animation: `pulse-bg ${600 / Math.max(heartRate, 60)}s ease-in-out infinite`,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
        }}
      />

      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.05] bg-[#050505]/92 px-4 py-3 backdrop-blur-[40px]">
        <button
          type="button"
          onClick={() => navigate('/siddha-portal')}
          className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45 hover:text-[#D4AF37]/90"
        >
          {t('adminQuantumApothecary2045.back')}
        </button>
        <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.35em] text-[#D4AF37] [text-shadow:0_0_12px_rgba(212,175,55,0.25)]">
          {t('siddhaPortal.adminApothecary2045Badge')}
        </span>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12 lg:gap-8 lg:px-6">
        <div className="flex flex-col gap-6 lg:col-span-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
          <div className="mb-2 flex items-center gap-3">
            <div
              className="rounded-2xl border p-2.5 shadow-[0_0_28px_rgba(212,175,55,0.18)]"
              style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)' }}
            >
              <Cpu className="h-6 w-6 text-[#D4AF37]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className="text-xl font-black uppercase tracking-[-0.05em] text-white"
                style={{ textShadow: '0 0 24px rgba(212,175,55,0.25)' }}
              >
                {t('adminQuantumApothecary2045.title')}
              </h1>
              <p className={`${microLabel} mt-1 !tracking-[0.28em] text-[#D4AF37]/45`}>{t('adminQuantumApothecary2045.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowKnowledge(true)}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2.5 transition-colors hover:border-[#D4AF37]/25 hover:bg-[#D4AF37]/[0.06]"
            >
              <Info className="h-5 w-5 text-[#D4AF37]/70" aria-hidden />
              <span className="sr-only">{t('adminQuantumApothecary2045.knowledgeAria')}</span>
            </button>
          </div>

          <section className={`relative overflow-hidden p-6 sm:p-7 ${glassSection}`}>
            <div className="mb-6 flex justify-between gap-3">
              <div>
                <p className={microLabel}>{t('adminQuantumApothecary2045.digitalNadiScan')}</p>
                <p className="mt-2 text-xs leading-[1.6] text-white/60">{t('adminQuantumApothecary2045.channelsMonitoring')}</p>
              </div>
              <Activity
                className={`h-5 w-5 shrink-0 ${isScanning ? 'animate-pulse' : ''}`}
                style={{ color: isScanning ? VAYU : GOLD }}
              />
            </div>

            {scanResult ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[32px] border border-white/[0.06] bg-black/50 p-4 shadow-[inset_0_0_40px_rgba(212,175,55,0.06)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_65%)] opacity-40" />
                  <div className="relative flex h-full w-full items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute h-full w-full rounded-full border border-[#D4AF37]/15"
                    />
                    <div className="relative z-10 text-center">
                      <p className={`${microLabel} mb-2 !text-white/40`}>{t('adminQuantumApothecary2045.activeNadisLabel')}</p>
                      <p className="text-4xl font-light tracking-tighter text-[#D4AF37] [text-shadow:0_0_20px_rgba(212,175,55,0.35)]">
                        {scanResult.activeNadis}
                      </p>
                      <p className="text-[10px] text-white/35">/ {scanResult.totalNadis.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className={`${microLabel} mb-2 !text-white/40`}>{t('adminQuantumApothecary2045.dosha')}</p>
                    <p className="text-lg font-medium text-white/90">{scanResult.dominantDosha}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className={`${microLabel} mb-2 !text-white/40`}>{t('adminQuantumApothecary2045.alignment')}</p>
                    <p className="text-sm font-medium leading-tight text-white/75">{scanResult.planetaryAlignment}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div
                    className="rounded-2xl border p-4"
                    style={{ borderColor: 'rgba(212,175,55,0.22)', background: 'rgba(212,175,55,0.06)' }}
                  >
                    <p className={`${microLabel} mb-2 !text-[#D4AF37]`}>{t('adminQuantumApothecary2045.siddhaRemedies')}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {scanResult.remedies.map((r, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[9px] leading-[1.6] text-white/60"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/[0.06] p-4">
                    <p className={`${microLabel} mb-2 !text-[#22D3EE]`}>{t('adminQuantumApothecary2045.herbToday')}</p>
                    <p className="text-sm leading-[1.6] text-white/65">{scanResult.herbOfToday}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyRemedies}
                    className="liquid-btn flex-1 rounded-[28px] border border-[#D4AF37]/35 bg-[#D4AF37]/15 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37] transition-all hover:bg-[#D4AF37]/25"
                  >
                    {t('adminQuantumApothecary2045.applyRemedies')}
                  </button>
                  <button
                    type="button"
                    onClick={runNadiScan}
                    disabled={isScanning || !transmissionsLoaded}
                    className="liquid-btn rounded-[28px] border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 transition-all hover:border-[#D4AF37]/25 hover:text-[#D4AF37] disabled:opacity-40"
                  >
                    {t('adminQuantumApothecary2045.rescan')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-black/45">
                  {isScanning ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover opacity-55 grayscale" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="h-px w-full animate-[scan_2s_ease-in-out_infinite]"
                          style={{
                            background: VAYU,
                            boxShadow: `0 0 18px ${VAYU}, 0 0 32px rgba(34,211,238,0.35)`,
                          }}
                        />
                      </div>
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-[#22D3EE]" />
                        <span className="text-[8px] font-extrabold uppercase tracking-[0.35em] text-[#22D3EE]/90">
                          {t('adminQuantumApothecary2045.liveBioFeed')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/35">
                      <Zap className="mb-2 h-8 w-8 text-[#D4AF37]/50" aria-hidden />
                      <p className="text-[8px] font-extrabold uppercase tracking-[0.4em]">{t('adminQuantumApothecary2045.awaitingHandshake')}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={runNadiScan}
                  disabled={isScanning || !transmissionsLoaded}
                  className="rounded-[40px] border border-[#D4AF37]/40 bg-gradient-to-b from-[#F5E17A] via-[#D4AF37] to-[#A07C10] px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-[#050505] shadow-[0_12px_40px_rgba(212,175,55,0.35)] transition-all hover:shadow-[0_16px_48px_rgba(212,175,55,0.45)] disabled:opacity-50"
                >
                  {isScanning ? t('adminQuantumApothecary2045.scanningHr', { hr: heartRate }) : t('adminQuantumApothecary2045.initiateScan')}
                </button>
              </div>
            )}
          </section>

          <section className={`flex min-h-[280px] flex-none flex-col p-6 sm:p-7 lg:min-h-0 lg:flex-1 ${glassSection}`}>
            <div className="mb-6 flex justify-between">
              <div>
                <p className={microLabel}>{t('adminQuantumApothecary2045.aethericMixer')}</p>
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white/55">
                {t('adminQuantumApothecary2045.slots', { n: selectedActivations.length })}
              </span>
            </div>
            <div className="mb-6 flex-1 space-y-3">
              {selectedActivations.length === 0 ? (
                <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center">
                  <Plus className="mb-2 h-8 w-8 text-[#D4AF37]/35" aria-hidden />
                  <p className="text-xs leading-[1.6] text-white/45">{t('adminQuantumApothecary2045.mixerEmpty')}</p>
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
                      className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: act.color }} />
                        <div>
                          <p className="text-xs font-semibold text-white/90">{act.name}</p>
                          <p className="text-[10px] italic leading-[1.6] text-white/50">{act.vibrationalSignature}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeActivation(act.id)}
                        className="p-2 text-white/30 opacity-0 transition-all hover:text-red-400/90 group-hover:opacity-100"
                        aria-label={t('adminQuantumApothecary2045.removeActivation')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            <button
              type="button"
              onClick={transmitCocktail}
              disabled={selectedActivations.length === 0}
              className="liquid-btn w-full rounded-[40px] border border-[#D4AF37]/45 bg-gradient-to-b from-[#F5E17A] to-[#B8960C] py-4 text-xs font-black uppercase tracking-[0.28em] text-[#050505] shadow-[0_8px_32px_rgba(212,175,55,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(212,175,55,0.4)] disabled:opacity-30"
            >
              {t('adminQuantumApothecary2045.transmitCode')}
            </button>
          </section>

          <section className="flex min-h-[200px] flex-none flex-col overflow-hidden lg:min-h-0 lg:flex-1">
            <Suspense fallback={archiveFallback}>
              <ActiveTransmissionsSection
                activeTransmissions={activeTransmissions}
                setActiveTransmissions={setActiveTransmissions}
              />
            </Suspense>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-8 lg:max-h-[calc(100vh-8rem)] lg:grid lg:grid-rows-2 lg:overflow-hidden">
          <section className="flex min-h-[360px] flex-col overflow-hidden lg:min-h-0">
            <Suspense fallback={archiveFallback}>
              <FrequencyLibrarySection
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                selectedActivations={selectedActivations}
                addActivation={addActivation}
                maxSlots={5}
              />
            </Suspense>
          </section>

          <section className={`relative flex min-h-[380px] flex-col overflow-hidden lg:min-h-0 ${glassSection}`}>
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/25 to-[#050505] shadow-[0_0_24px_rgba(212,175,55,0.2)]">
                  <Globe className="h-4 w-4 text-[#D4AF37]" aria-hidden />
                </div>
                <div>
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37] [text-shadow:0_0_12px_rgba(212,175,55,0.25)]">
                    {t('adminQuantumApothecary2045.sqiOnline')}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                    <span className="text-[9px] uppercase tracking-tighter text-white/45">{t('adminQuantumApothecary2045.neuralSync')}</span>
                  </div>
                </div>
              </div>
              <Info className="h-4 w-4 cursor-help text-[#D4AF37]/40" aria-hidden />
            </div>
            {geminiKeyPresent && !hasBuildTimeKey && (
              <div
                className="flex flex-col gap-2 border-b border-[#22D3EE]/25 bg-[#22D3EE]/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                role="status"
              >
                <p className="text-[10px] leading-[1.6] text-white/70">{t('adminQuantumApothecary2045.sessionKeyActive')}</p>
                <button
                  type="button"
                  onClick={clearSessionGeminiKey}
                  className="shrink-0 rounded-full border border-white/[0.12] bg-white/[0.05] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37] hover:border-[#D4AF37]/35"
                >
                  {t('adminQuantumApothecary2045.sessionKeyClear')}
                </button>
              </div>
            )}
            {!geminiKeyPresent && (
              <div
                className="space-y-3 border-b border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] px-4 py-3 sm:px-6"
                role="status"
              >
                <p className="text-center text-[10px] leading-[1.6] text-[#D4AF37]/90">{t('adminQuantumApothecary2045.bannerNoGeminiKey')}</p>
                <p className="text-center text-[10px] leading-[1.6] text-white/50">{t('adminQuantumApothecary2045.sessionKeyHelp')}</p>
                <p className="text-center text-[9px] leading-[1.5] text-white/35">{t('adminQuantumApothecary2045.sessionKeyPwaHint')}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    type="password"
                    autoComplete="off"
                    value={sessionKeyDraft}
                    onChange={(e) => setSessionKeyDraft(e.target.value)}
                    placeholder={t('adminQuantumApothecary2045.sessionKeyPlaceholder')}
                    className="min-w-0 flex-1 rounded-[20px] border border-white/[0.1] bg-[#050505]/80 py-3 pl-4 pr-4 text-xs text-white placeholder:text-white/25 focus:border-[#D4AF37]/35 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applySessionGeminiKey}
                    disabled={!sessionKeyDraft.trim()}
                    className="rounded-[20px] border border-[#D4AF37]/40 bg-gradient-to-b from-[#F5E17A] to-[#B8960C] px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-[#050505] shadow-[0_0_16px_rgba(212,175,55,0.2)] disabled:opacity-40 sm:shrink-0"
                  >
                    {t('adminQuantumApothecary2045.sessionKeyApply')}
                  </button>
                </div>
              </div>
            )}
            <div className="px-3 pt-3 sm:px-5 sm:pt-4">
              <StudentSelector />
            </div>
            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex w-full min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`min-w-0 rounded-[28px] p-3 text-sm leading-[1.65] sm:p-4 [overflow-wrap:anywhere] ${
                      msg.role === 'user'
                        ? 'ml-auto w-full max-w-[min(100%,36rem)] rounded-tr-none border border-[#D4AF37]/35 bg-gradient-to-br from-[#F5E17A] to-[#B8960C] text-[#050505] shadow-[0_0_28px_rgba(212,175,55,0.25)]'
                        : 'w-full max-w-full rounded-tl-none border border-white/[0.08] bg-white/[0.04] text-white/65'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-[28px] rounded-tl-none border border-white/[0.08] bg-white/[0.04] p-4">
                    {[0, 0.2, 0.4].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]/50"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`rounded-2xl border p-4 transition-all ${
                    isListening
                      ? 'animate-pulse border-[#22D3EE]/50 bg-[#22D3EE]/15 text-[#22D3EE]'
                      : 'border-white/[0.08] bg-white/[0.04] text-[#D4AF37]/70 hover:border-[#D4AF37]/25 hover:text-[#D4AF37]'
                  }`}
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
                    className="w-full rounded-[28px] border border-white/[0.08] bg-white/[0.04] py-4 pl-6 pr-16 text-sm leading-[1.6] text-white placeholder:text-white/30 focus:border-[#D4AF37]/35 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/20 disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={!input.trim() || isTyping || !geminiKeyPresent}
                    className="absolute bottom-2 right-2 top-2 rounded-xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#F5E17A] to-[#B8960C] px-4 text-[#050505] shadow-[0_0_16px_rgba(212,175,55,0.25)] transition-all disabled:opacity-30"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/88 p-6 backdrop-blur-[40px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qa2045-knowledge-title"
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              className={`custom-scrollbar max-h-[80vh] w-full max-w-2xl overflow-y-auto p-8 sm:p-12 ${glassSection}`}
            >
              <div className="mb-8 flex justify-between gap-4">
                <h2
                  id="qa2045-knowledge-title"
                  className="text-2xl font-black uppercase tracking-[-0.05em] text-[#D4AF37] [text-shadow:0_0_18px_rgba(212,175,55,0.3)]"
                >
                  {t('adminQuantumApothecary2045.knowledgeTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowKnowledge(false)}
                  className="shrink-0 rounded-full border border-white/[0.08] p-2 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"
                  aria-label={t('adminQuantumApothecary2045.closeKnowledge')}
                >
                  <Trash2 className="h-6 w-6 text-white/45" />
                </button>
              </div>
              <div className="space-y-8 text-sm leading-[1.6] text-white/60">
                <section>
                  <h3 className={`${microLabel} mb-3 !text-[#D4AF37]`}>{t('adminQuantumApothecary2045.kWhatTitle')}</h3>
                  <p>{t('adminQuantumApothecary2045.kWhatBody')}</p>
                </section>
                <section>
                  <h3 className={`${microLabel} mb-3 !text-[#22D3EE]`}>{t('adminQuantumApothecary2045.kNadiTitle')}</h3>
                  <p>{t('adminQuantumApothecary2045.kNadiBody')}</p>
                </section>
                <section>
                  <h3 className={`${microLabel} mb-3 !text-[#D4AF37]`}>{t('adminQuantumApothecary2045.k247Title')}</h3>
                  <p>{t('adminQuantumApothecary2045.k247Body')}</p>
                </section>
                <section>
                  <h3 className={`${microLabel} mb-3 !text-[#D4AF37]`}>{t('adminQuantumApothecary2045.kWisdomTitle')}</h3>
                  <p>{t('adminQuantumApothecary2045.kWisdomBody')}</p>
                </section>
              </div>
              <button
                type="button"
                onClick={() => setShowKnowledge(false)}
                className="mt-12 w-full rounded-[40px] border border-[#D4AF37]/40 bg-gradient-to-b from-[#F5E17A] to-[#B8960C] py-4 text-sm font-black uppercase tracking-[0.2em] text-[#050505] shadow-[0_0_28px_rgba(212,175,55,0.25)]"
              >
                {t('adminQuantumApothecary2045.returnAether')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scan { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(100px); } }
        @keyframes pulse-bg { 0%, 100% { transform: scale(1); opacity: 0.35; } 50% { transform: scale(1.04); opacity: 0.5; } }
        .liquid-btn { filter: url(#goo-qa2045); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
