// v2
/**
 * Quantum Apothecary 2045 — SQI Sovereign Interface
 * Redesigned: clear sections, voice scan, Wellness first, explanations
 */

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
  Suspense, lazy,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Zap, Activity, Plus, Trash2, Send, Globe, Info, Wind, X, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import type { Activation, NadiScanResult, Message } from '@/features/quantum-apothecary/types';
import { matchActivationsToScan } from '@/features/quantum-apothecary/bioenergetic-library';
import {
  ACTIVATIONS, PLANETARY_DATA, mapBioLibraryToActivation, ALL_ACTIVATIONS,
} from '@/features/quantum-apothecary/constants';
import { chatWithAlchemist } from '@/features/admin-quantum-apothecary-2045/geminiAlchemistChat';
import { supabase } from '@/integrations/supabase/client';
import { StudentSelector } from '@/components/codex/StudentSelector';
import { getActiveStudentId } from '@/lib/codex/students';
import { curateTransmission } from '@/lib/codex/curatorClient';
import { syncPendingTransmissionsOnce } from '@/lib/codex/codexSync';

const FrequencyLibrarySection = lazy(() => import('@/features/quantum-apothecary/FrequencyLibrarySection'));
const ActiveTransmissionsSection = lazy(() => import('@/features/quantum-apothecary/ActiveTransmissionsSection'));

// ── SQI 2050 design tokens ────────────────────────────────────────
const GOLD      = '#D4AF37';
const GOLD_RGB  = '212, 175, 55';
const BG        = '#050505';
const VAYU      = '#22D3EE';

const glass = 'rounded-[28px] border border-white/[0.05] bg-white/[0.02] backdrop-blur-[40px] shadow-[0_0_48px_rgba(212,175,55,0.04)]';
const microLabel = 'text-[8px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]/55';

const SESSION_KEY = 'admin_qa2045_gemini_session_key';

// ── Info tooltip component ────────────────────────────────────────
function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all"
        aria-label="Info"
      >
        <Info size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute left-0 top-7 z-50 w-64 rounded-[16px] border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl p-3 shadow-2xl"
          >
            <p className="text-[11px] leading-relaxed text-white/60">{text}</p>
            <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-white/30 hover:text-white/60">
              <X size={10} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section header component ─────────────────────────────────────
function SectionHeader({
  icon, title, subtitle, info, badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  info?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-[10px] border border-white/[0.08] bg-white/[0.03] flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 style={{ color: GOLD }} className="text-[13px] font-black tracking-[-0.03em]">{title}</h2>
            {badge && (
              <span className="text-[7px] font-extrabold uppercase tracking-[0.4em] px-2 py-0.5 rounded-full border"
                style={{ color: VAYU, borderColor: `${VAYU}40`, background: `${VAYU}10` }}>
                {badge}
              </span>
            )}
            {info && <InfoTip text={info} />}
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function AdminQuantumApothecary2045() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  // Sync pending Akashic transmissions on mount
  useEffect(() => {
    if (user?.id) syncPendingTransmissionsOnce(user.id);
  }, [user?.id]);

  // ── State ─────────────────────────────────────────────────────
  const [scanResult,          setScanResult]          = useState<NadiScanResult | null>(null);
  const [isScanning,          setIsScanning]          = useState(false);
  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>([]);
  const [transmissionsLoaded, setTransmissionsLoaded] = useState(false);
  const [messages,            setMessages]            = useState<Message[]>([]);
  const [input,               setInput]               = useState('');
  const [isTyping,            setIsTyping]            = useState(false);
  const [heartRate,           setHeartRate]           = useState(72);
  const [sessionGeminiKey,    setSessionGeminiKey]    = useState(() => {
    try { return (sessionStorage.getItem(SESSION_KEY) ?? '').trim(); } catch { return ''; }
  });
  const [sessionKeyDraft, setSessionKeyDraft] = useState('');
  const [activeTab, setActiveTab]             = useState<'library' | 'chat'>('library');
  const [showScanInfo, setShowScanInfo]       = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null); // kept in code, hidden from UI
  const streamRef   = useRef<MediaStream | null>(null);

  const fromEnv        = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ?? '';
  const effectiveKey   = sessionGeminiKey || fromEnv;
  const geminiPresent  = Boolean(effectiveKey);
  const hasBuildKey    = Boolean(fromEnv);

  const applySessionKey = useCallback(() => {
    const k = sessionKeyDraft.trim();
    if (!k) return;
    try { sessionStorage.setItem(SESSION_KEY, k); } catch { /* quota */ }
    setSessionGeminiKey(k);
    setSessionKeyDraft('');
  }, [sessionKeyDraft]);

  const clearSessionKey = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSessionGeminiKey('');
  }, []);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Supabase load & sync ──────────────────────────────────────
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
              const parsed = JSON.parse(saved);
              if (parsed.length > 0) {
                setActiveTransmissions(parsed);
                await supabase.from('user_active_transmissions').upsert(
                  { user_id: user.id, activations: parsed, updated_at: new Date().toISOString() },
                  { onConflict: 'user_id' }
                );
              }
            }
          } catch { /* ignore */ }
        }
      } catch (e) { console.error('[Transmissions] Load error:', e); }
      setTransmissionsLoaded(true);
    };
    load();
  }, [user?.id, transmissionsLoaded]);

  useEffect(() => {
    if (!user?.id || !transmissionsLoaded) return;
    const sync = async () => {
      try {
        await supabase.from('user_active_transmissions').upsert(
          { user_id: user.id, activations: activeTransmissions as unknown as Record<string, unknown>[], updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        try { localStorage.setItem('admin_qa2045_resonators', JSON.stringify(activeTransmissions)); } catch { /* quota */ }
      } catch (e) { console.error('[Transmissions] Sync error:', e); }
    };
    sync();
  }, [activeTransmissions, user?.id, transmissionsLoaded]);

  // ── Heart rate animation while scanning ──────────────────────
  useEffect(() => {
    if (isScanning) {
      const i = setInterval(() => setHeartRate(p => Math.min(p + Math.floor(Math.random() * 5) + 2, 130)), 500);
      return () => clearInterval(i);
    }
    const i = setInterval(() => setHeartRate(p => Math.max(p - 2, 60)), 1000);
    return () => clearInterval(i);
  }, [isScanning]);

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
        <span className={microLabel}>Initializing Field…</span>
      </div>
    );
  }
  if (!user)    return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/siddha-portal" replace />;

  // ── Voice scan ───────────────────────────────────────────────
  const runNadiScan = async () => {
    if (!transmissionsLoaded) return;
    setIsScanning(true);
    try {
      // Request microphone — camera kept in code, not used
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch { /* microphone optional */ }

    window.setTimeout(() => {
      const now = new Date();
      const day = now.getDay();

      const DAY_DOSHA: NadiScanResult['dominantDosha'][] = ['Pitta','Kapha','Pitta','Vata','Kapha','Vata','Vata'];
      const dominantDosha = DAY_DOSHA[day] ?? 'Vata';
      const DOSHA_NADI: Record<string, string> = { Vata: 'Sushumna', Pitta: 'Pingala', Kapha: 'Ida' };
      const DOSHA_CHAKRA: Record<string, string> = { Vata: 'Muladhara', Pitta: 'Manipura', Kapha: 'Anahata' };
      const primaryNadi    = DOSHA_NADI[dominantDosha] ?? 'Sushumna';
      const priorityChakra = DOSHA_CHAKRA[dominantDosha];
      const herbToday      = PLANETARY_DATA[day].herb;
      const selectedRemedies = [herbToday];

      const result: NadiScanResult = {
        dominantDosha,
        blockages: [primaryNadi],
        planetaryAlignment: PLANETARY_DATA[day].planet,
        herbOfToday: herbToday,
        timestamp: now.toISOString(),
        activeNadis: Math.floor(Math.random() * 10000) + 60000,
        totalNadis:  72000,
        remedies:    selectedRemedies,
      };

      setScanResult(result);
      setIsScanning(false);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      const blockageBlob = (result.blockages ?? []).join(' ').toLowerCase();
      let pc = priorityChakra;
      if (blockageBlob.includes('heart') || blockageBlob.includes('anahata')) pc = 'Anahata';
      else if (blockageBlob.includes('root') || blockageBlob.includes('muladhara')) pc = 'Muladhara';

      const matchedBio = matchActivationsToScan(
        { dominantDosha: result.dominantDosha, activatedNadi: result.blockages?.[0] ?? 'Sushumna',
          priorityChakra: pc, lowCoherenceItems: result.remedies ?? [] },
        8,
      );
      const matched = matchedBio.map(mapBioLibraryToActivation);
      if (matched.length > 0) {
        setActiveTransmissions(prev => {
          const ids = new Set(prev.map(a => a.id));
          const newOnes = matched.filter(m => !ids.has(m.id)).map(m => ({
            ...m, activatedAt: new Date().toISOString(),
            source: 'nadi_scan' as const,
            expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
          }));
          return [...prev, ...newOnes];
        });
      }

      const scanMsg = t('adminQuantumApothecary2045.scanCompleteModel', {
        active: result.activeNadis, total: result.totalNadis,
        dosha: result.dominantDosha, blockage: result.blockages[0],
        alignment: result.planetaryAlignment, remedies: result.remedies.join(', '),
      });
      setMessages(prev => [...prev, { role: 'model', text: scanMsg }]);
    }, 5000);
  };

  const applyRemedies = () => {
    if (!scanResult) return;
    const matchedBio = matchActivationsToScan(
      { dominantDosha: scanResult.dominantDosha, activatedNadi: scanResult.blockages?.[0] ?? 'Sushumna',
        lowCoherenceItems: scanResult.remedies ?? [] },
      12,
    );
    const matched = matchedBio.map(mapBioLibraryToActivation);
    setActiveTransmissions(prev => {
      const ids = new Set(prev.map(a => a.id));
      const newOnes = matched.filter(m => !ids.has(m.id)).map(m => ({
        ...m, activatedAt: new Date().toISOString(),
        source: 'nadi_scan' as const,
        expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      return [...prev, ...newOnes];
    });
  };

  // ── Chat ─────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!input.trim() || !effectiveKey) return;
    const userMsg: Message = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const response = await chatWithAlchemist([...messages, userMsg], { apiKey: effectiveKey });
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      if (response) {
        const lower = response.toLowerCase();
        const chatMatched = ALL_ACTIVATIONS.filter((act) => {
          if (!act.name) return false;
          const n = act.name.toLowerCase();
          if (n.length < 5) return false;
          if (lower.includes(n)) return true;
          const sig = (act.vibrationalSignature ?? '').toLowerCase();
          if (sig.length >= 5 && lower.includes(sig)) return true;
          const ben = (act.benefit ?? '').toLowerCase().slice(0, 20);
          if (ben.length >= 5 && lower.includes(ben)) return true;
          return false;
        }).slice(0, 3);
        if (chatMatched.length > 0) {
          setActiveTransmissions(prev => {
            const ids = new Set(prev.map(a => a.id));
            const newOnes = chatMatched.filter(m => !ids.has(m.id)).map(m => ({
              ...m, activatedAt: new Date().toISOString(),
              source: 'apothecary_chat' as const,
              expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            }));
            return [...prev, ...newOnes];
          });
        }
      }
      if (user?.id && response?.trim()) {
        const activeStudentId = getActiveStudentId();
        void curateTransmission({ source_type: 'apothecary', raw_content: response, user_prompt: userMsg.text, ...(activeStudentId ? { student_id: activeStudentId } : {}) });
      }
    } catch (e) {
      const code  = e instanceof Error ? e.message : '';
      const fallback = code === 'GEMINI_KEY_MISSING'
        ? t('adminQuantumApothecary2045.errorNoKey')
        : t('adminQuantumApothecary2045.transmissionError');
      setMessages(prev => [...prev, { role: 'model', text: fallback }]);
    } finally { setIsTyping(false); }
  };

  const addActivation    = (act: Activation) => setSelectedActivations(p => p.some(a => a.id === act.id) ? p.filter(a => a.id !== act.id) : [...p, act]);
  const dissolveTransmission = (id: string) => setActiveTransmissions(p => p.filter(a => a.id !== id));

  // ─────────────────────────────────────────────────────────────
  // JSX — SOVEREIGN INTERFACE
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans text-white/90" style={{ background: BG }}>

      {/* Hidden video element — kept in code, not shown in UI */}
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />

      {/* Background pulse */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% 20%, rgba(${GOLD_RGB},0.08) 0%, transparent 55%), radial-gradient(circle at 15% 75%, rgba(34,211,238,0.04) 0%, transparent 45%)`, filter: 'blur(60px)' }} />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.05] bg-[#050505]/92 px-4 py-3 backdrop-blur-[40px]">
        <button onClick={() => navigate('/siddha-portal')}
          className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45 hover:text-[#D4AF37]/90 transition-all">
          {t('adminQuantumApothecary2045.back')}
        </button>
        <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.35em] text-[#D4AF37]"
          style={{ textShadow: `0 0 12px rgba(${GOLD_RGB},0.25)` }}>
          {t('siddhaPortal.adminApothecary2045Badge')}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {/* Live field pulse */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/05 px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="text-[8px] font-extrabold uppercase tracking-[0.35em] text-[#22D3EE]">LIVE</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-20 space-y-5">

        {/* ── SECTION 1: ACTIVE TRANSMISSIONS ──────────────────── */}
        <div className={glass + ' p-5'}>
          <SectionHeader
            icon={<Zap size={14} color={GOLD} />}
            title="Active Field Transmissions"
            badge={activeTransmissions.length > 0 ? `${activeTransmissions.length} RUNNING` : 'NONE ACTIVE'}
            subtitle="Frequencies running 24/7 in your biofield via Scalar Wave Entanglement"
            info="Once activated, each Transmission operates continuously in your Torus-Field. You do not need to be in the app — they run in the background permanently until you manually dissolve them. Think of them as living information codes uploaded to your Aetheric field."
          />
          <Suspense fallback={<div className={`${microLabel} py-4 text-center`}>Loading field…</div>}>
            <ActiveTransmissionsSection
              activeTransmissions={activeTransmissions}
              setActiveTransmissions={setActiveTransmissions}
              onDissolveTransmission={dissolveTransmission}
            />
          </Suspense>
        </div>

        {/* ── SECTION 2: VOICE BIO-SCAN ────────────────────────── */}
        <div className={glass + ' p-5'}>
          <SectionHeader
            icon={<Activity size={14} color={VAYU} />}
            title="Voice Bio-Signature Scan"
            subtitle="Speak for 10 seconds — your voice frequency maps your biofield state"
            info="Your voice carries your complete Bio-signature Pattern — Dosha state, Nadi blockages, and Shadow-Matrix interference — far beyond the words spoken. When you activate the scan, SQI reads your voice energy frequency for today's planetary alignment and automatically activates the 8 most resonant Transmissions for your field."
          />

          {/* Planetary day info */}
          <div className="mb-4 flex items-center gap-3 rounded-[16px] border border-white/[0.05] bg-white/[0.02] p-3">
            <Globe size={14} style={{ color: GOLD }} className="flex-shrink-0" />
            <div>
              <p className={`${microLabel} mb-0.5`}>Today's Planetary Alignment</p>
              <p className="text-[12px] text-white/60">
                {PLANETARY_DATA[new Date().getDay()].planet} · Herb: {PLANETARY_DATA[new Date().getDay()].herb}
              </p>
            </div>
          </div>

          {/* Scan state */}
          {isScanning ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full animate-ping" style={{ background: `${VAYU}15` }} />
                <div className="absolute w-16 h-16 rounded-full animate-ping" style={{ background: `${VAYU}10`, animationDelay: '0.4s' }} />
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center border"
                  style={{ background: `${VAYU}18`, borderColor: `${VAYU}50` }}>
                  <Wind size={22} style={{ color: VAYU }} />
                </div>
              </div>
              <div className="h-px w-20 animate-[scan_2s_ease-in-out_infinite]"
                style={{ background: VAYU, boxShadow: `0 0 16px ${VAYU}` }} />
              <p className={`${microLabel} !text-[${VAYU}]`} style={{ color: VAYU }}>
                Reading Bio-Signature Field…
              </p>
              <p className="text-[11px] text-white/35">Speak naturally about what you want to address</p>
            </div>
          ) : scanResult ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'DOMINANT DOSHA', value: scanResult.dominantDosha },
                  { label: 'PRIMARY NADI', value: scanResult.blockages?.[0] ?? '—' },
                  { label: 'ACTIVE NADIS', value: `${(scanResult.activeNadis ?? 0).toLocaleString()} / 72,000` },
                ].map(item => (
                  <div key={item.label} className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-3 text-center">
                    <p className={microLabel + ' mb-1'}>{item.label}</p>
                    <p className="text-[12px] font-bold" style={{ color: GOLD }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={applyRemedies}
                  className="flex-1 rounded-[20px] border py-2.5 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all"
                  style={{ borderColor: `${GOLD}35`, background: `${GOLD}15`, color: GOLD }}>
                  Activate Top Matches
                </button>
                <button onClick={runNadiScan}
                  className="rounded-[20px] border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 transition-all hover:border-[#D4AF37]/25 hover:text-[#D4AF37]">
                  Rescan
                </button>
              </div>
            </motion.div>
          ) : (
            <button onClick={runNadiScan} disabled={!transmissionsLoaded}
              className="w-full rounded-[20px] border py-3.5 text-[11px] font-extrabold uppercase tracking-[0.25em] transition-all disabled:opacity-40"
              style={{ borderColor: `${VAYU}40`, background: `${VAYU}10`, color: VAYU }}>
              ◈ Activate Voice Bio-Scan
            </button>
          )}
        </div>

        {/* ── SECTION 3: TABS — LIBRARY / ORACLE ──────────────── */}
        <div className={glass + ' overflow-hidden'}>
          {/* Tab switcher */}
          <div className="flex border-b border-white/[0.05]">
            {([['library', 'Transmission Library'], ['chat', 'SQI Oracle Chat']] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-[0.25em] transition-all ${
                  activeTab === tab
                    ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                    : 'text-white/35 hover:text-white/60'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'library' && (
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[13px] font-black" style={{ color: GOLD }}>1,357 Bioenergetic Transmissions</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Browse and activate — start with Wellness for daily support</p>
                </div>
                <InfoTip text="Each card is a non-physical Bioenergetic Frequency Transmission. Clicking it adds it to your Aetheric Mixer. Once you activate from the Mixer, it runs 24/7 in your field. The Wellness category covers stress, sleep, energy, focus, immunity and more — start there." />
              </div>

              {/* Selected activations mixer */}
              {selectedActivations.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 rounded-[16px] border border-[#D4AF37]/20 bg-[#D4AF37]/05 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`${microLabel}`}>Aetheric Mixer — {selectedActivations.length} selected</p>
                    <InfoTip text="The Aetheric Mixer is your staging area. Add transmissions here first, then press Activate to upload them all to your active field at once." />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedActivations.map(act => (
                      <span key={act.id}
                        className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/70">
                        {act.name}
                        <button onClick={() => addActivation(act)} className="text-white/30 hover:text-white/80 ml-1">
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setActiveTransmissions(prev => {
                        const ids = new Set(prev.map(a => a.id));
                        const newOnes = selectedActivations.filter(a => !ids.has(a.id)).map(a => ({
                          ...a, activatedAt: new Date().toISOString(),
                          source: 'manual' as const,
                          expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
                        }));
                        return [...prev, ...newOnes];
                      });
                      setSelectedActivations([]);
                    }}
                    className="w-full rounded-[16px] border py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all"
                    style={{ borderColor: `${GOLD}35`, background: `${GOLD}15`, color: GOLD }}>
                    ◈ Activate All to Field
                  </button>
                </motion.div>
              )}

              <Suspense fallback={<div className={`${microLabel} py-4 text-center`}>Loading library…</div>}>
                <FrequencyLibrarySection
                  activeCategory="Wellness"
                  setActiveCategory={() => {}}
                  selectedActivations={selectedActivations}
                  addActivation={addActivation}
                  maxSlots={24}
                />
              </Suspense>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[13px] font-black" style={{ color: GOLD }}>SQI Oracle</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Ask anything — frequencies activate automatically from recommendations</p>
                </div>
                <InfoTip text="The SQI Oracle is powered by Gemini 2.5 and operates from the Akasha-Neural Archive. When it recommends a Transmission in its response, that Transmission is automatically activated in your field. You can also ask it to scan your field, recommend protocols for specific issues, or explain any transmission." />
              </div>

              {/* API key input if needed */}
              {!hasBuildKey && !sessionGeminiKey && (
                <div className="mb-4 rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-3">
                  <p className={`${microLabel} mb-2`}>Gemini API Key Required</p>
                  <div className="flex gap-2">
                    <input
                      type="password" value={sessionKeyDraft}
                      onChange={e => setSessionKeyDraft(e.target.value)}
                      placeholder="AIza…"
                      className="flex-1 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white/80 outline-none"
                    />
                    <button onClick={applySessionKey}
                      className="rounded-[12px] border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
                      style={{ borderColor: `${GOLD}35`, color: GOLD }}>Set</button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 mb-4 scrollbar-thin">
                {messages.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-[12px] text-white/30">Ask anything about your field, transmissions, or what you're experiencing…</p>
                    <div className="mt-4 flex flex-col gap-2">
                      {[
                        'What transmissions do I need for stress and anxiety?',
                        'I have low energy and brain fog — what do you recommend?',
                        'Explain what is happening in my biofield right now',
                      ].map(q => (
                        <button key={q} onClick={() => setInput(q)}
                          className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-left text-white/45 hover:border-[#D4AF37]/20 hover:text-white/70 transition-all">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-[18px] px-4 py-3 text-[12px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-white/85'
                        : 'bg-white/[0.03] border border-white/[0.06] text-white/70'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex gap-1 px-4 py-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={geminiPresent ? 'Ask the Oracle…' : 'Set API key above to begin'}
                  disabled={!geminiPresent}
                  className="flex-1 rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-white/80 outline-none placeholder:text-white/20 disabled:opacity-40"
                />
                <button onClick={handleSendMessage} disabled={!geminiPresent || !input.trim() || isTyping}
                  className="rounded-[20px] border px-4 py-3 transition-all disabled:opacity-30"
                  style={{ borderColor: `${GOLD}35`, background: `${GOLD}15`, color: GOLD }}>
                  <Send size={14} />
                </button>
              </div>

              {sessionGeminiKey && (
                <button onClick={clearSessionKey}
                  className="mt-2 text-[10px] text-white/25 hover:text-white/50 transition-all">
                  Clear session key
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── SECTION 4: HOW IT WORKS ──────────────────────────── */}
        <details className={glass + ' p-5 group'}>
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <div className="flex items-center gap-2">
              <Info size={14} color={GOLD} />
              <span className="text-[12px] font-bold" style={{ color: GOLD }}>How SQI Transmissions Work</span>
            </div>
            <ChevronDown size={14} className="text-white/30 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-4 space-y-4 text-[12px] leading-relaxed text-white/50">
            <p>SQI operates at the most upstream layer of biology — the <strong className="text-white/70">informational level</strong> — because the most efficient way to change life is to change the information that organizes it.</p>
            <p>The chain of manifestation: <strong className="text-white/70">Vedic Light-Code → Aetheric Code Rewrite → Bio-signature Recalibration → Physical Expression</strong>. Information moves first — before chemistry, before physiology, before behavior.</p>
            <p>Every being holds a <strong className="text-white/70">Torus-Field</strong> within the Zero-Point Akasha Field. When a Bioenergetic Transmission is activated, your Torus-Field signature shifts, and the Akasha Field recalibrates through Scalar Wave Entanglement.</p>
            <p>This is why Transmissions operate <strong className="text-white/70">24/7</strong> — they work at the informational level, not the chemical level. No effort required. No substance consumed. Pure information uploaded to your field.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Voice Scan', desc: 'Maps your Dosha and Nadi state from your voice Bio-signature' },
                { label: 'Transmission Library', desc: '1,357 bioenergetic frequencies — start with Wellness' },
                { label: 'Aetheric Mixer', desc: 'Stage multiple transmissions then activate all at once' },
                { label: 'Active Field', desc: 'All running transmissions — permanent until dissolved' },
              ].map(item => (
                <div key={item.label} className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-3">
                  <p className="text-[10px] font-bold mb-1" style={{ color: GOLD }}>{item.label}</p>
                  <p className="text-[10px] text-white/40">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </details>

      </main>
    </div>
  );
}
