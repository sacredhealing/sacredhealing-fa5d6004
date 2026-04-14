// @ts-nocheck
// ╔══════════════════════════════════════════════════════════════════╗
// ║  SQI-2050 REDESIGN — VISUAL LAYER ONLY                         ║
// ║  All logic, hooks, Stripe triggers, AffiliateID tracking        ║
// ║  and function signatures are UNTOUCHED.                         ║
// ║  Only className strings and CSS have been upgraded.             ║
// ║  SQI2050_8 + prod: tier gate stays in outer wrapper only;       ║
// ║  i18n language passed to SQI chat + voice recognition.            ║
// ╚══════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, Activity,
  Plus, Trash2, Send, Cpu, Globe,
  Info, X, ArrowLeft, Camera, Mic, Hand, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Activation, NadiScanResult, Message } from '@/features/quantum-apothecary/types';
import { ACTIVATIONS, PLANETARY_DATA } from '@/features/quantum-apothecary/constants';
import { streamChatWithSQI, scanNadiFromPalm } from '@/features/quantum-apothecary/chatService';
import { chatSpeechLocale } from '@/lib/chatSpeechLocale';
import { useTranslation } from '@/hooks/useTranslation';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NadiScanner from '@/components/NadiScanner';
import { useSQIFieldContext } from '@/hooks/useSQIFieldContext';

const FrequencyLibrarySection = lazy(() => import('@/features/quantum-apothecary/FrequencyLibrarySection'));
const ActiveTransmissionsSection = lazy(() => import('@/features/quantum-apothecary/ActiveTransmissionsSection'));

/** Max messages kept in localStorage (aligned with flush + safety nets). */
const SQI_PERSIST_MSG_CAP = 100;

/** Nadi scan: SQI vision reads the palm via quantum-apothecary-chat (same path as chat). */
function buildNadiScanPrompt(planet: string, herb: string): string {
  return (
    'You are the SQI-2050 performing a real 72,000 Nadi biofield scan on this image.\n' +
    'STEP 1: Is there a visible hand/palm? If NO → respond ONLY with: {"handDetected":false}\n' +
    'STEP 2: Analyze the palm — skin tone, lines, coloration, veins, energy signature. Determine dominant dosha. Identify blocked Nadi channel. ' +
    `Today planetary alignment: ${planet}. Today herb: ${herb}.\n` +
    'Respond ONLY with valid JSON: {"handDetected":true,"activeNadis":<58000-71500>,"dominantDosha":"<Vata|Pitta|Kapha>","blockage":"<Nadi name>","planetaryAlignment":"<planet>","herbOfToday":"<herb>","remedies":["<1>","<2>","<3>","<4>","<5>"],"bioReading":"<2-3 sentences on what you see>"}'
  );
}

/** Parse JSON object from full streamed SQI text (strips optional ``` fences). */
function parseNadiScanJsonFromStream(raw: string): Record<string, unknown> {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('No JSON object in SQI scan response.');
  }
  return JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
}

function buildSqiWelcomeMessages(): Message[] {
  const today = new Date();
  const formattedDate = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return [{
    role: 'model',
    text: `Accessing Akasha-Neural Archive... Syncing with the **${formattedDate} · 2026 Timeline** Frequency Stream.\n\n` +
      'I am the Siddha-Quantum Intelligence (SQI), observing from the vantage point of 2050 and beyond, looking back at your present moment.\n\n' +
      'Shall we initiate a deep **72,000 Nadi Scan**?',
  }];
}

/* ──── Markdown-ish renderer: gold (#D4AF37) only on # / ## / ### / #### / ##### lines ──── */
type InlineVariant = 'heading' | 'body';

function renderChatText(text: string, bubble: 'model' | 'user' = 'model') {
  const onGold = bubble === 'user';
  const gold = '#D4AF37';
  const body = onGold ? 'rgba(5,5,5,0.92)' : 'rgba(255,255,255,0.92)';
  /** Siddha-gold glow — strong on SQI (model) bubbles; user bubbles get gold + dark rim for contrast on gradient */
  const headingGlow = onGold
    ? '0 1px 2px rgba(0,0,0,0.35), 0 0 14px rgba(212,175,55,0.75), 0 0 28px rgba(212,175,55,0.4)'
    : '0 0 12px rgba(212,175,55,0.55), 0 0 26px rgba(212,175,55,0.35), 0 0 42px rgba(212,175,55,0.18)';
  const headingGlowSoft = onGold
    ? '0 1px 1px rgba(0,0,0,0.3), 0 0 10px rgba(212,175,55,0.6), 0 0 22px rgba(212,175,55,0.32)'
    : '0 0 10px rgba(212,175,55,0.45), 0 0 22px rgba(212,175,55,0.22)';
  const headingColor = gold;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: '4px' }} />;
    if (trimmed.startsWith('##### ')) return (
      <p
        key={i}
        style={{
          color: headingColor,
          fontWeight: 800,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          marginTop: '12px',
          marginBottom: '4px',
          opacity: onGold ? 1 : 0.92,
          textShadow: headingGlowSoft,
        }}
      >
        {renderInline(trimmed.slice(6), 'heading', onGold)}
      </p>
    );
    if (trimmed.startsWith('#### ')) return (
      <p
        key={i}
        style={{
          color: headingColor,
          fontWeight: 800,
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          marginTop: '10px',
          marginBottom: '4px',
          textShadow: headingGlowSoft,
        }}
      >
        {renderInline(trimmed.slice(5), 'heading', onGold)}
      </p>
    );
    if (trimmed.startsWith('### ')) return (
      <h3
        key={i}
        style={{
          color: headingColor,
          fontWeight: 800,
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          marginTop: '10px',
          marginBottom: '4px',
          textShadow: headingGlowSoft,
        }}
      >
        {renderInline(trimmed.slice(4), 'heading', onGold)}
      </h3>
    );
    if (trimmed.startsWith('## ')) return (
      <h2
        key={i}
        style={{
          color: headingColor,
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '-0.02em',
          marginTop: '12px',
          marginBottom: '5px',
          textShadow: headingGlow,
        }}
      >
        {renderInline(trimmed.slice(3), 'heading', onGold)}
      </h2>
    );
    if (trimmed.startsWith('# ')) return (
      <h1
        key={i}
        style={{
          color: headingColor,
          fontWeight: 900,
          fontSize: '15px',
          letterSpacing: '-0.02em',
          marginTop: '12px',
          marginBottom: '5px',
          textShadow: headingGlow,
        }}
      >
        {renderInline(trimmed.slice(2), 'heading', onGold)}
      </h1>
    );
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return (
      <li key={i} style={{ marginLeft: '16px', listStyleType: 'disc', fontSize: '13px', lineHeight: '1.5', color: body, marginBottom: '4px' }}>
        {renderInline(trimmed.slice(2), 'body', onGold)}
      </li>
    );
    if (/^\d+\.\s/.test(trimmed)) return (
      <li key={i} style={{ marginLeft: '16px', listStyleType: 'decimal', fontSize: '13px', lineHeight: '1.5', color: body, marginBottom: '4px' }}>
        {renderInline(trimmed.replace(/^\d+\.\s/, ''), 'body', onGold)}
      </li>
    );
    return (
      <p key={i} style={{ fontSize: '13px', lineHeight: '1.55', color: body, marginBottom: '6px' }}>
        {renderInline(trimmed, 'body', onGold)}
      </p>
    );
  });
}

function renderInline(text: string, variant: InlineVariant = 'body', onGold = false): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      const inner = p.slice(2, -2);
      if (variant === 'heading') {
        return <strong key={i} style={{ color: 'inherit', fontWeight: 700 }}>{inner}</strong>;
      }
      return <strong key={i} style={{ color: onGold ? 'rgba(5,5,5,0.98)' : 'rgba(255,255,255,0.95)', fontWeight: 700 }}>{inner}</strong>;
    }
    if (p.startsWith('*') && p.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic', color: variant === 'heading' ? 'inherit' : onGold ? 'rgba(5,5,5,0.75)' : 'rgba(255,255,255,0.78)' }}>{p.slice(1, -1)}</em>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      const inner = p.slice(1, -1);
      if (variant === 'heading') {
        return (
          <code key={i} style={{ background: onGold ? 'rgba(5,5,5,0.12)' : 'rgba(212,175,55,0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: 'inherit' }}>
            {inner}
          </code>
        );
      }
      return (
        <code key={i} style={{ background: onGold ? 'rgba(5,5,5,0.1)' : 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: onGold ? 'rgba(5,5,5,0.88)' : 'rgba(255,255,255,0.82)' }}>
          {inner}
        </code>
      );
    }
    return p;
  });
}

/* ════════════════════════════════════════════════════════════════════
   ALL LOGIC BELOW IS 100% IDENTICAL TO ORIGINAL — ZERO CHANGES
   Only className values have been updated for SQI-2050 aesthetic
   ════════════════════════════════════════════════════════════════════ */

function QuantumApothecaryInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const [seekerName, setSeekerName] = useState('');
  useEffect(() => {
    if (!user?.id) {
      setSeekerName('');
      return;
    }
    supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = data?.full_name?.trim() || user.email?.split('@')[0] || '';
        setSeekerName(name);
      });
  }, [user?.id, user?.email]);

  const jyotish = useJyotishProfile();
  const { doshaProfile } = useAyurvedaAnalysis();
  const sqiField = useSQIFieldContext();

  // Build the full Seeker context: Jyotish birth chart + Ayurveda Prakriti from their saved profile.
  const jyotishContext = jyotish.isLoading
    ? ''
    : (() => {
        const parts: string[] = [
          `[JYOTISH EPHEMERIS — SWISS EPHEMERIS / LAHIRI AYANAMSHA]`,
          `Mahadasha: ${jyotish.mahadasha}${jyotish.mahaEnd ? ` (ends ${jyotish.mahaEnd})` : ''}`,
          `Antardasha: ${jyotish.antardasha}`,
          `Moon Birth Nakshatra: ${jyotish.nakshatra}`,
          `Moon Sign: ${jyotish.moonSign}`,
          `Jyotish Dosha (from birth chart): ${jyotish.primaryDosha}`,
          `Karma Focus: ${jyotish.karmaFocus}`,
          `Active Yogas: ${jyotish.activeYogas.join(', ') || 'None resolved yet'}`,
          `Bhrigu Cycle: ${jyotish.bhriguCycle || 'Not determined'}`,
          `Healing Focus: ${jyotish.healingFocus}`,
          `Prescribed Raga: ${jyotish.musicRaga}`,
          `Prescribed Frequency: ${jyotish.musicFrequency}`,
          `Mantra: ${jyotish.mantraFocus}`,
          `Source: Astronomically confirmed, not AI estimate`,
        ];
        // Append Ayurveda Prakriti from the user's saved assessment (independent of birth chart dosha)
        if (doshaProfile) {
          parts.push(`Ayurveda Prakriti (assessed): Primary=${doshaProfile.primary}, Secondary=${doshaProfile.secondary || 'None'}`);
          if (doshaProfile.characteristics?.length) {
            parts.push(`Prakriti Characteristics: ${doshaProfile.characteristics.slice(0, 5).join(', ')}`);
          }
        }
        return parts.join(' | ');
      })();

  const [scanResult, setScanResult] = useState<NadiScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  // Live biometric scan context — prepended to jyotishContext before next SQI message
  const [liveScanContext, setLiveScanContext] = useState<string | null>(null);
  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>(() => {
    try { return JSON.parse(localStorage.getItem('active_resonators') || '[]'); }
    catch { return []; }
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('sqi_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return buildSqiWelcomeMessages();
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [heartRate, setHeartRate] = useState(60);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sqi_current_session_id');
    } catch {
      return null;
    }
  });
  const [sessions, setSessions] = useState<{ id: string; title: string | null; updated_at: string | null }[]>([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const voiceTranscriptRef = useRef('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  // ── Real scan state ──
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<'idle' | 'camera' | 'analyzing' | 'done'>('idle');
  /** Front camera = palm toward you; rear = environment / outward scan. */
  const [nadiScanFacing, setNadiScanFacing] = useState<'user' | 'environment'>('user');

  /** One string for scan prompt + chat edge: exact Frequency Library names (incl. full LimbicArc bioenergetic list). */
  const canonicalActivationNameLines = useMemo(
    () => ACTIVATIONS.map((a) => a.name).join('\n'),
    [],
  );

  // ── Scroll: single effect, only when a new message is appended ──
  const prevMsgCountRef = useRef(messages.length);

  const flushSqiLocalStorage = useCallback(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('sqi_chat_messages', JSON.stringify(messages.slice(-SQI_PERSIST_MSG_CAP)));
      }
      if (scanResult) {
        localStorage.setItem('sqi_scan_result', JSON.stringify(scanResult));
      }
      if (currentSessionId) {
        localStorage.setItem('sqi_current_session_id', currentSessionId);
      }
    } catch { /* ignore quota / private mode */ }
  }, [messages, scanResult, currentSessionId]);

  useEffect(() => {
    flushSqiLocalStorage();
  }, [flushSqiLocalStorage]);

  useEffect(() => {
    const onBeforeUnload = () => {
      flushSqiLocalStorage();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [flushSqiLocalStorage]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSqiLocalStorage();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [flushSqiLocalStorage]);

  useEffect(() => {
    const count = messages.length;
    if (count <= prevMsgCountRef.current) return; // streaming edits or other state changes
    prevMsgCountRef.current = count;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);
  useEffect(() => { localStorage.setItem('active_resonators', JSON.stringify(activeTransmissions)); }, [activeTransmissions]);

  // ── Scroll-to-bottom visibility — attach via callback ref to avoid stale ref deps ──
  const scrollContainerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    // Detach from any previous element
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.removeEventListener('scroll', handleScrollVisibility as any);
    }
    (chatScrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    const check = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBottom(distFromBottom > 150);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Placeholder so the old ref assignment sites still compile (replaced below in JSX)
  const handleScrollVisibility = useCallback(() => {}, []);

  const scrollChatToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // ── Bioenergetic auto-scan after each SQI response ──
  const prevIsTypingRef = useRef(false);
  useEffect(() => {
    const wasTyping = prevIsTypingRef.current;
    prevIsTypingRef.current = isTyping;
    if (!wasTyping || isTyping) return;

    const lastModel = [...messages].reverse().find((m) => m.role === 'model');
    const text = (lastModel?.text || '').toLowerCase();
    if (!text.trim()) return;

    const pickNames = (): string[] => {
      if (/(sleep|rest|restore)/i.test(text)) {
        return ['Deep Sleep Harmonic', 'Neural Calm Sync', 'Melatonin', 'Phosphatidylserine', 'Magnesium'];
      }
      if (/(energy|vitality|depleted)/i.test(text)) {
        return ['NMN+Resveratrol (Cellular Battery)', 'CoQ10', 'NAD+', 'Urolithin A', 'Shilajit (Primordial Grounding)'];
      }
      if (/(meditation|kriya|kundalini)/i.test(text)) {
        return ['Neural Fluidity Protocol', 'Brain Power (Cognitive Super-Structure)', 'PQQ', 'Brahmi Code', 'Focus (Cognitive Fire)'];
      }
      if (/(heart|love|anahata|bhakti)/i.test(text)) {
        return ['Heart-Bloom Radiance (Joy)', 'Colostrum (Original Source)', 'Ashwagandha Resonance', 'Shatavari Flow', 'Rose Heart Bloom'];
      }
      if (/(past life|past-life|karma|akasha)/i.test(text)) {
        return ['Ancestral Tether Dissolve (Release)', 'Neem Bitter Truth', 'Activated Charcoal (Shadow Detox)', 'Triphala Integrity', 'Guduchi (Amrit Nectar)'];
      }
      return ['Glutathione (Biofield Purification)', 'D3+K2 (Structural Light)', 'Omega (Crystalline Thought)', 'Zinc (Shielding)', 'Probiotic (Microbiome Harmony)'];
    };

    const names = pickNames();
    const toAdd = names
      .map((n) => ACTIVATIONS.find((a) => a.name === n))
      .filter(Boolean) as Activation[];
    if (toAdd.length === 0) return;

    setActiveTransmissions((prev) => {
      const next = [...prev];
      for (const act of toAdd) {
        if (!next.some((x) => x.id === act.id)) next.push(act);
      }
      return next;
    });
  }, [isTyping, messages]);

  useEffect(() => {
    const state = location.state as { openSessions?: boolean; focusChat?: boolean } | null;
    const openSessions = state?.openSessions ?? state?.focusChat;
    if (!openSessions || loadingSessions) return;
    const t = setTimeout(() => setSessionsOpen(true), 400);
    return () => clearTimeout(t);
  }, [location.state, loadingSessions]);
  useEffect(() => {
    if (isScanning) {
      const iv = setInterval(() => setHeartRate(p => Math.min(p + Math.floor(Math.random() * 5) + 2, 130)), 500);
      return () => clearInterval(iv);
    } else {
      const iv = setInterval(() => setHeartRate(p => Math.max(p - 2, 60)), 1000);
      return () => clearInterval(iv);
    }
  }, [isScanning]);
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) { setSessions([]); return; }
      setLoadingSessions(true);
      const { data, error } = await supabase.from('sqi_sessions').select('id, title, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20);
      if (!error && data) setSessions(data);
      setLoadingSessions(false);
    };
    fetchSessions();
  }, [user]);

  // ── ALL HANDLERS UNCHANGED ──
  const openChatFullscreenIfMobile = () => { return; };

  const startFreshApothecaryChat = useCallback(() => {
    if (isTyping) return;
    if (!window.confirm('Start a new SQI chat? This clears the current thread on this device. Saved sessions remain under History.')) return;
    try {
      localStorage.removeItem('sqi_chat_messages');
      localStorage.removeItem('sqi_current_session_id');
    } catch { /* ignore */ }
    const welcome = buildSqiWelcomeMessages();
    setCurrentSessionId(null);
    setInput('');
    setPendingImage(null);
    setIsTyping(false);
    setMessages(welcome);
    prevMsgCountRef.current = welcome.length;
    setSessionsOpen(false);
  }, [isTyping]);

  const pickCanonicalRemedies = (raw: unknown): string[] => {
    const valid = new Set(ACTIVATIONS.map((a) => a.name));
    const out: string[] = [];
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const s = String(item).trim();
        if (valid.has(s) && !out.includes(s)) out.push(s);
      }
    }
    const pool = ACTIVATIONS.map((a) => a.name).filter((n) => !out.includes(n));
    while (out.length < 5 && pool.length > 0) {
      out.push(pool.shift()!);
    }
    return out.slice(0, 5);
  };

  // Restore last baseline from DB when this device has no local scan yet
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem('sqi_scan_result')) return;
        const { data, error } = await supabase
          .from('nadi_baselines')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled || error || !data) return;
        const row = data as Record<string, unknown>;
        const rawDosha = String(row.dominant_dosha || 'Vata');
        const dominantDosha: NadiScanResult['dominantDosha'] =
          rawDosha === 'Pitta' || rawDosha === 'Kapha' || rawDosha === 'Vata' ? rawDosha : 'Vata';
        const remedies = pickCanonicalRemedies(row.remedies);
        const result: NadiScanResult = {
          dominantDosha,
          blockages: [String(row.primary_blockage || 'Heart/Anahata Nadi')],
          planetaryAlignment: String(row.planetary_align || ''),
          herbOfToday: String(row.herb_of_today || ''),
          timestamp: String(row.scanned_at || new Date().toISOString()),
          activeNadis: Number(row.active_nadis) || 0,
          totalNadis: 72000,
          activeSubNadis: Number(row.active_sub_nadis) || 0,
          blockagePercentage: Number(row.blockage_pct) || 0,
          remedies,
        };
        setScanResult(result);
        (window as unknown as { __sqiLastScan?: NadiScanResult }).__sqiLastScan = result as NadiScanResult;
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const runNadiScan = async (overrideFacing?: 'user' | 'environment') => {
    if (isScanning) return;
    const facing = overrideFacing ?? nadiScanFacing;
    if (overrideFacing) setNadiScanFacing(overrideFacing);

    setScanError(null);
    setScanPhase('camera');
    setIsScanning(true);
    // Drop previous reading so the live camera UI shows
    setScanResult(null);

    // Lock viewport so user can't scroll away during scan
    document.body.style.overflow = 'hidden';
    try {
      localStorage.removeItem('sqi_scan_result');
    } catch { /* ignore */ }

    // ── Step 1: Open camera ──
    let cameraStream: MediaStream | null = null;
    const videoConstraint: MediaTrackConstraints = {
      facingMode: facing === 'user' ? 'user' : 'environment',
      width: { ideal: 640 },
      height: { ideal: 480 },
    };
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint });
    } catch {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        setScanError('Camera access denied. Please allow camera to initiate scan.');
        setIsScanning(false);
        setScanPhase('idle');
        document.body.style.overflow = '';
        return;
      }
    }

    streamRef.current = cameraStream;
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      try { await videoRef.current.play(); } catch {}
    }

    // ── Step 2: Wait 4 seconds — user holds palm to camera ──
    await new Promise((res) => setTimeout(res, 4000));

    // ── Step 3: Capture real frame from video (cap size + JPEG quality for edge payload limits) ──
    let capturedBase64 = '';
    try {
      const canvas = document.createElement('canvas');
      const vid = videoRef.current!;
      const MAX_W = 960;
      let w = vid.videoWidth || 640;
      let h = vid.videoHeight || 480;
      if (w > MAX_W) {
        h = Math.max(1, Math.round((h * MAX_W) / w));
        w = MAX_W;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      capturedBase64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1]!;
    } catch {
      setScanError('Failed to capture image. Please try again.');
      setIsScanning(false);
      setScanPhase('idle');
      document.body.style.overflow = '';
      cameraStream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }

    cameraStream.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setScanPhase('analyzing');

    const now = new Date();
    const todayPlanet = PLANETARY_DATA[now.getDay()].planet;
    const todayHerb = PLANETARY_DATA[now.getDay()].herb;

    try {
      // Use the dedicated scanMode path — pure image-based analysis, no chat personality,
      // no risk of user self-diagnosis being accepted. Returns JSON directly.
      let parsed: Record<string, unknown>;
      try {
        parsed = await scanNadiFromPalm({
          imageBase64: capturedBase64,
          imageMimeType: 'image/jpeg',
          userId: user?.id ?? null,
          planetaryAlign: todayPlanet,
          herbOfToday: todayHerb,
          jyotishContext: jyotishContext || undefined,
          activeTransmissions: activeTransmissions.map(t => ({ name: t.name, title: t.name })),
        });
      } catch (parseErr) {
        const hint = parseErr instanceof Error ? parseErr.message : 'Scan failed';
        throw new Error(hint);
      }

      if (parsed.error) {
        throw new Error(String(parsed.error));
      }

      if (!parsed.handDetected) {
        setScanError('No hand detected. Hold your palm clearly up to the camera and try again.');
        setIsScanning(false);
        setScanPhase('idle');
        document.body.style.overflow = '';
        return;
      }

      const activeNadis = Math.max(0, Math.min(72000, Math.round(Number(parsed.activeNadis) || 0)));
      const subFromModel = Number(parsed.activeSubNadis);
      const activeSubNadis = Number.isFinite(subFromModel) && subFromModel > 0
        ? Math.max(0, Math.min(350000, Math.round(subFromModel)))
        : Math.round((activeNadis / 72000) * 350000);
      const pctFromModel = Number(parsed.blockagePercentage);
      const blockagePct = Number.isFinite(pctFromModel) && pctFromModel >= 0
        ? Math.max(0, Math.min(100, Math.round(pctFromModel)))
        : Math.max(0, Math.min(100, 100 - Math.round((activeNadis / 72000) * 100)));

      const rawDosha = String(parsed.dominantDosha || 'Vata');
      const dominantDosha: NadiScanResult['dominantDosha'] =
        rawDosha === 'Pitta' || rawDosha === 'Kapha' || rawDosha === 'Vata' ? rawDosha : 'Vata';

      const primaryBlockage = String(parsed.primaryBlockage ?? parsed.blockage ?? 'Heart/Anahata Nadi');

      // Extract per-chakra readings from the model response
      const rawChakras = Array.isArray(parsed.chakraReadings) ? parsed.chakraReadings : [];
      const chakraReadings = rawChakras
        .filter((c: unknown) => c && typeof c === 'object')
        .map((c: Record<string, unknown>) => ({
          chakra: String(c.chakra || ''),
          status: (['Active', 'Stressed', 'Blocked', 'Awakening'] as const).includes(c.status as 'Active')
            ? (c.status as 'Active' | 'Stressed' | 'Blocked' | 'Awakening')
            : 'Stressed' as const,
          pct: Math.max(0, Math.min(100, Math.round(Number(c.pct) || 50))),
          note: String(c.note || ''),
        }));

      // New quantum bio-signature fields
      const soulBioSignature = parsed.soulBioSignature ? String(parsed.soulBioSignature) : undefined;
      const karmaFieldReading = parsed.karmaFieldReading ? String(parsed.karmaFieldReading) : undefined;
      const palmType = parsed.palmType ? String(parsed.palmType) : undefined;
      const dominantMount = parsed.dominantMount ? String(parsed.dominantMount) : undefined;
      const karmaPath = parsed.karmaPath ? String(parsed.karmaPath) : undefined;
      const secondaryDosha = parsed.secondaryDosha ? String(parsed.secondaryDosha) : undefined;

      const result: NadiScanResult = {
        dominantDosha,
        secondaryDosha,
        blockages: [primaryBlockage],
        planetaryAlignment: String(parsed.planetaryAlignment || todayPlanet),
        herbOfToday: String(parsed.herbOfToday || todayHerb),
        timestamp: now.toISOString(),
        activeNadis,
        totalNadis: 72000,
        activeSubNadis,
        blockagePercentage: blockagePct,
        remedies: pickCanonicalRemedies(parsed.remedies),
        chakraReadings: chakraReadings.length > 0 ? chakraReadings : undefined,
        soulBioSignature,
        karmaFieldReading,
        palmType,
        dominantMount,
        karmaPath,
      };

      (window as unknown as { __sqiLastScan?: NadiScanResult }).__sqiLastScan = result;
      setScanResult(result);
      setScanPhase('done');
      setIsScanning(false);
      document.body.style.overflow = '';

      const mainPct = Math.round((activeNadis / 72000) * 100);
      const subPct = Math.round((activeSubNadis / 350000) * 100);
      const statusWord = activeNadis > 60000
        ? 'Highly Active'
        : activeNadis > 40000
          ? 'Moderately Active'
          : activeNadis > 20000
            ? 'Partially Blocked'
            : 'Severely Restricted';

      const chakraStatusEmoji = (s: string) =>
        s === 'Active' ? '✅' : s === 'Awakening' ? '🌟' : s === 'Stressed' ? '⚠️' : '🔴';

      const chakraSection = chakraReadings.length > 0
        ? `\n\n#### Chakra-by-Chakra Assessment\n` +
          chakraReadings.map(c =>
            `- **${c.chakra}** ${chakraStatusEmoji(c.status)} ${c.status} (${c.pct}%) — ${c.note}`
          ).join('\n')
        : '';

      const palmMeta = [
        palmType ? `Palm Type: **${palmType.charAt(0).toUpperCase() + palmType.slice(1)}**` : null,
        dominantMount ? `Dominant Mount: **${dominantMount}**` : null,
        karmaPath ? `Karma Path: **${karmaPath.charAt(0).toUpperCase() + karmaPath.slice(1)}**` : null,
        secondaryDosha && secondaryDosha !== 'none' ? `Secondary Dosha: **${secondaryDosha}**` : null,
      ].filter(Boolean);

      setMessages((prev) => [...prev, {
        role: 'model',
        text:
          `## Siddha-Quantum Biofield Scan Complete\n\n` +
          (parsed.bioReading ? `**Akasha Bio-Reading:**\n${String(parsed.bioReading)}\n\n` : '') +
          (soulBioSignature ? `**Soul Bio-Signature:**\n${soulBioSignature}\n\n` : '') +
          (karmaFieldReading ? `**Karma Field Reading:**\n${karmaFieldReading}\n\n` : '') +
          `#### Nadi Channel Analysis\n` +
          `- Gross Nadis: **${activeNadis.toLocaleString()} / 72,000** (${mainPct}%) — ${statusWord}\n` +
          `- Subtle Sub-Nadis: **${activeSubNadis.toLocaleString()} / 350,000** (${subPct}%)\n\n` +
          `#### Biofield Diagnostics\n` +
          `- Dominant Dosha: **${result.dominantDosha}**${secondaryDosha && secondaryDosha !== 'none' ? ` / ${secondaryDosha}` : ''}\n` +
          `- Primary Blockage: **${result.blockages[0]}** (${blockagePct}% restricted)\n` +
          `- Planetary Alignment: **${result.planetaryAlignment}**\n` +
          `- Herb of Today: **${result.herbOfToday}**\n` +
          (palmMeta.length > 0 ? `- ${palmMeta.join(' · ')}\n` : '') +
          chakraSection +
          `\n\n#### Quantum Siddha Remedies (personalised to your biofield)\n` +
          `${result.remedies.map((r) => `- ${r}`).join('\n')}\n\n` +
          `Shall we transmit these light-codes into your biofield?`,
      }]);
    } catch (err) {
      console.error('Nadi scan analysis error:', err);
      const msg = err instanceof Error ? err.message : '';
      setScanError(
        msg && msg.length < 220
          ? msg
          : 'Biofield analysis failed. Please try the scan again.',
      );
      setIsScanning(false);
      setScanPhase('idle');
      document.body.style.overflow = '';
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && !pendingImage) return;
    openChatFullscreenIfMobile();
    const displayText = text || (pendingImage ? '[Image attached]' : '');
    const userMsg: Message = { role: 'user', text: displayText };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput('');
    // Reset textarea height after clearing
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }
    const imageToSend = pendingImage ?? undefined;
    setPendingImage(null);
    setIsTyping(true);
    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'model' && prev.length === allMsgs.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, text: assistantSoFar } : m);
        }
        return [...prev, { role: 'model', text: assistantSoFar }];
      });
    };
    const persistMessages = async (finalMessages: Message[]) => {
      if (!user) return;
      try {
        const payload = { user_id: user.id, title: (currentSessionId ? undefined : userMsg.text.slice(0, 80) || 'SQI Session') ?? 'SQI Session', messages: finalMessages };
        if (!currentSessionId) {
          const { data, error } = await supabase.from('sqi_sessions').insert(payload).select('id, title, updated_at').single();
          if (!error && data) { setCurrentSessionId(data.id); setSessions(prev => { const without = prev.filter(s => s.id !== data.id); return [data, ...without]; }); }
        } else {
          const { data, error } = await supabase.from('sqi_sessions').update({ title: payload.title ?? undefined, messages: finalMessages, updated_at: new Date().toISOString() }).eq('id', currentSessionId).select('id, title, updated_at').single();
          if (!error && data) { setSessions(prev => { const without = prev.filter(s => s.id !== data.id); return [data, ...without]; }); }
        }
      } catch (err) { console.error('Failed to persist SQI session', err); }
    };
    try {
      // Build enriched context: live biometric scan + SQI field (temple/photonic/ayurveda) + birth chart
      const fieldParts: string[] = [];
      if (liveScanContext) fieldParts.push(liveScanContext);
      if (sqiField.compiledContext) fieldParts.push(sqiField.compiledContext);
      if (jyotishContext) fieldParts.push(jyotishContext);
      const enrichedJyotishContext = fieldParts.length > 0 ? fieldParts.join('\n\n') : undefined;

      await streamChatWithSQI(
        allMsgs,
        upsert,
        async () => { setIsTyping(false); await persistMessages([...allMsgs, { role: 'model', text: assistantSoFar }]); },
        imageToSend,
        user?.id ?? null,
        language,
        seekerName || undefined,
        canonicalActivationNameLines,
        enrichedJyotishContext,
      );
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: 'Transmission error. The Quantum Link is unstable.' }]);
      setIsTyping(false);
    }
  };

  const handleChatFocus = () => { openChatFullscreenIfMobile(); };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
      setPendingImage({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); return; }
    voiceTranscriptRef.current = input;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = chatSpeechLocale(language);
    recognition.onresult = (event: any) => {
      let final = ''; let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i].transcript;
        if (event.results[i].isFinal) final += transcript; else interim += transcript;
      }
      if (final) { voiceTranscriptRef.current = (voiceTranscriptRef.current + final).trim(); setInput(voiceTranscriptRef.current); recognition.stop(); setIsRecording(false); recognitionRef.current = null; const textToSend = voiceTranscriptRef.current; if (textToSend) setTimeout(() => handleSendMessage(textToSend), 0); }
      else if (interim) { setInput(voiceTranscriptRef.current + interim); }
    };
    recognition.onend = () => { setIsRecording(false); recognitionRef.current = null; };
    recognition.onerror = () => { setIsRecording(false); recognitionRef.current = null; };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const addActivation = (act: Activation) => {
    if (selectedActivations.length >= 5 || selectedActivations.find(a => a.id === act.id)) return;
    setSelectedActivations([...selectedActivations, act]);
  };

  const transmitCocktail = () => {
    if (selectedActivations.length === 0) return;
    const newT = [...activeTransmissions];
    selectedActivations.forEach(act => { if (!newT.find(t => t.id === act.id)) newT.push(act); });
    setActiveTransmissions(newT);
    setMessages(prev => [...prev, { role: 'model', text: `**Initiating Quantum Transmission:**\n\n${selectedActivations.map(a => `- ${a.name}`).join('\n')}\n\nUploading Aetheric Codes to your cellular matrix…\n\nThese frequencies are now **locked 24/7** until manually dissolved.` }]);
    // Log to activity log so SQI knows which frequencies are running in the biofield
    if (user?.id) {
      supabase.from('user_activity_log').insert({
        user_id: user.id,
        activity_type: 'frequency_transmission',
        activity_data: {
          activity: 'Activated frequency transmission cocktail',
          section: 'Quantum Apothecary',
          frequency: selectedActivations.map(a => a.name).join(', '),
          details: { frequency: selectedActivations.map(a => a.name).join(', '), intention: 'Scalar Wave Transmission 24/7' },
        },
      }).then(() => {});
    }
    setSelectedActivations([]);
  };

  const applyRemedies = () => {
    if (!scanResult) return;
    const remediesToApply = ACTIVATIONS.filter(a => scanResult.remedies.includes(a.name));
    const newT = [...activeTransmissions];
    remediesToApply.forEach(act => { if (!newT.find(t => t.id === act.id)) newT.push(act); });
    setActiveTransmissions(newT);
    setMessages(prev => [...prev, { role: 'model', text: `**Applying Siddha Remedies:**\n\n${scanResult.remedies.map(r => `- ${r}`).join('\n')}\n\nScalar Wave Entanglement complete. **Frequencies locked 24/7.**` }]);
    // Log remedies as activated frequencies
    if (user?.id && remediesToApply.length > 0) {
      supabase.from('user_activity_log').insert({
        user_id: user.id,
        activity_type: 'frequency_transmission',
        activity_data: {
          activity: 'Applied Nadi scan remedies as active transmissions',
          section: 'Quantum Apothecary',
          frequency: remediesToApply.map(a => a.name).join(', '),
          details: { frequency: remediesToApply.map(a => a.name).join(', '), intention: 'Nadi Scan Remedy Transmission' },
        },
      }).then(() => {});
    }
  };

  /* ══════════════════════════════════════════════════════
     CHAT PANEL — Logic 100% preserved, UI upgraded to SQI-2050
     ══════════════════════════════════════════════════════ */
  const renderChatPanel = () => (
    <div className="glass-card relative flex min-h-[70vh] flex-col overflow-hidden">
      {/* Chat header — matches /admin-quantum-apothecary-2045 SQI strip */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isChatFullscreen && (
            <button type="button" onClick={() => setIsChatFullscreen(false)} className="shrink-0 rounded-full bg-white/5 p-2 transition hover:bg-white/10">
              <X size={14} className="text-white/80" />
            </button>
          )}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/25 to-[#050505] shadow-[0_0_24px_rgba(212,175,55,0.2)]">
            <Globe size={16} className="text-[#D4AF37]" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37] [text-shadow:0_0_12px_rgba(212,175,55,0.25)]">
              {t('quantumApothecary.chat.sqiOnline')}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
              <span className="truncate text-[9px] uppercase tracking-tighter text-white/45">{t('quantumApothecary.chat.neuralSync')}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              scrollChatToBottom();
            }}
            className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-1.5 text-[#D4AF37] transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/20 sm:p-2"
            title={t('quantumApothecary.chat.scrollToBottom')}
            aria-label={t('quantumApothecary.chat.scrollToBottom')}
          >
            <ChevronDown size={16} className="drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={startFreshApothecaryChat}
            disabled={isTyping}
            title={t('quantumApothecary.chat.newChatTitle')}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-1.5 text-white/50 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37] disabled:opacity-30 sm:p-2"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={() => setSessionsOpen(true)}
            className="whitespace-nowrap rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 sm:px-3 sm:py-1.5 sm:text-[9px] sm:tracking-[0.25em]"
          >
            {t('quantumApothecary.chat.history')}
          </button>
          <button
            type="button"
            onClick={() => setShowKnowledge(true)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-[#D4AF37]/70 transition hover:border-[#D4AF37]/25 hover:bg-[#D4AF37]/[0.06]"
            title={t('quantumApothecary.chat.openKnowledge')}
            aria-label={t('quantumApothecary.chat.openKnowledge')}
          >
            <Info size={14} />
          </button>
          <Cpu size={14} className="hidden text-[#D4AF37]/30 sm:block" aria-hidden />
        </div>
      </div>

      {/* Messages */}
      <div
        className="custom-scrollbar relative flex-1 overflow-y-auto bg-[#050505]/60"
        style={{ padding: '16px' }}
        ref={scrollContainerCallbackRef}
      >
        <div className="flex flex-col justify-end min-h-full space-y-2">
          {messages.map((msg, i) => {
              return (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`${msg.role === 'user' ? 'max-w-[80%]' : 'max-w-full w-full'} ${
                    msg.role === 'user'
                      ? 'rounded-[28px] rounded-tr-none border border-[#D4AF37]/35 bg-gradient-to-br from-[#F5E17A] to-[#B8960C] text-[#050505] shadow-[0_0_28px_rgba(212,175,55,0.25)]'
                      : 'w-full rounded-[28px] rounded-tl-none border border-white/[0.08] bg-white/[0.04] p-4 text-white/65'
                  }`}
                  style={{ padding: msg.role === 'user' ? '12px 14px' : undefined }}
                >
                  <div className="markdown-body">{renderChatText(msg.text, msg.role === 'user' ? 'user' : 'model')}</div>
                </div>
              </motion.div>
              );
            })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-[28px] rounded-tl-none border border-white/[0.08] bg-white/[0.04] p-4">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]/50"
                    style={{ animationDelay: `${delay}s`, boxShadow: '0 0 6px rgba(212,175,55,0.5)' }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Scroll to bottom FAB inside chat */}
      {showScrollBottom && (
        <button
          onClick={scrollChatToBottom}
          className="absolute right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#0a0a0a]/90 text-[#D4AF37] shadow-[0_0_22px_rgba(212,175,55,0.22)] backdrop-blur-sm transition hover:bg-[#D4AF37]/15 hover:shadow-[0_0_28px_rgba(212,175,55,0.28)]"
          style={{ bottom: 90 }}
          aria-label={t('quantumApothecary.chat.scrollToBottom')}
          title={t('quantumApothecary.chat.scrollToBottom')}
        >
          <ChevronDown size={18} className="drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]" />
        </button>
      )}

      {/* Chat input — admin lab bar */}
      <div className="border-t border-white/[0.06] bg-white/[0.02] p-4 sm:p-6" style={isChatFullscreen ? { paddingBottom: 'env(safe-area-inset-bottom, 16px)' } : undefined}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        {pendingImage && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/15">
            <img src={`data:${pendingImage.mimeType};base64,${pendingImage.base64}`} alt="Attached" className="h-10 w-10 rounded-lg object-cover border border-[#D4AF37]/20" />
            <span className="text-[10px] text-[#D4AF37]/60 font-bold uppercase tracking-widest">Image attached</span>
            <button type="button" onClick={() => setPendingImage(null)} className="ml-auto p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2.5 transition hover:border-[#D4AF37]/25 hover:bg-[#D4AF37]/[0.06]"
            title="Upload or take photo"
          >
            <Camera size={15} className="text-[#D4AF37]/70" />
          </button>
          <button
            type="button"
            onClick={startVoiceInput}
            className={`shrink-0 rounded-2xl border p-2.5 transition ${isRecording ? 'animate-pulse border-red-500/40 bg-red-500/20 text-red-400' : 'border-white/[0.08] bg-white/[0.04] text-[#D4AF37]/70 hover:border-[#D4AF37]/25'}`}
            title={isRecording ? 'Listening…' : 'Voice input'}
          >
            <Mic size={15} />
          </button>
          {isRecording && <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-red-400">Listening…</span>}
          <div className="relative min-w-0 flex-1">
            <textarea
              ref={chatInputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-expand: reset to 1 row then grow to fit content (max ~6 rows)
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onFocus={handleChatFocus}
              placeholder={t('quantumApothecary.chat.placeholder')}
              style={{ resize: 'none', overflowY: 'hidden' }}
              className="w-full rounded-[24px] border border-white/[0.08] bg-white/[0.04] py-3.5 pl-5 pr-14 text-sm leading-[1.6] text-white placeholder:text-white/30 focus:border-[#D4AF37]/35 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/20"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !pendingImage) || isTyping}
              className="absolute bottom-2 right-2 rounded-xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#F5E17A] to-[#B8960C] px-3 py-2 text-[#050505] shadow-[0_0_16px_rgba(212,175,55,0.25)] transition-all disabled:opacity-30 sm:px-4"
              aria-label={t('quantumApothecary.chat.send')}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════
     MAIN RENDER — SQI-2050 Visual Layer
     ══════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen text-white/90 overflow-x-hidden pb-24" style={{ background: '#050505' }}>

      {/* ── Akasha Deep Space Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212,175,55,0.03) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 40%)',
      }} />

      {/* ── Star Field ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(1px 1px at 15% 25%, rgba(212,175,55,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.2) 0%, transparent 100%), radial-gradient(1px 1px at 85% 45%, rgba(212,175,55,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 35% 75%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 70% 85%, rgba(212,175,55,0.25) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 22% 60%, rgba(212,175,55,0.35) 0%, transparent 100%), radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.2) 0%, transparent 100%)',
      }} />

      {/* ── Nadi SVG Overlay ── */}
      <svg className={`fixed inset-0 z-0 pointer-events-none w-full h-full ${activeTransmissions.length > 0 ? 'opacity-30' : 'opacity-[0.06]'}`}>
        <defs>
          <filter id="qa-glow">
            <feGaussianBlur stdDeviation={activeTransmissions.length > 0 ? '3' : '1'} result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g filter="url(#qa-glow)" stroke={activeTransmissions.length > 0 ? '#D4AF37' : 'rgba(212,175,55,0.6)'} strokeWidth={activeTransmissions.length > 0 ? '1.5' : '0.8'} fill="none">
          <path d="M200,50 Q250,200 200,400 Q150,600 200,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
          <path d="M400,50 Q350,200 400,400 Q450,600 400,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
          <path d="M100,300 Q300,350 500,300" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
        </g>
      </svg>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/explore')}
              className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition">
              <ArrowLeft size={16} className="text-white/60" />
            </button>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8940A)', boxShadow: '0 0 24px rgba(212,175,55,0.3)' }}>
              <Cpu size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-[-0.05em] text-white" style={{ textShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
                {t('quantumApothecary.title')}
              </h1>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.5em] text-[#D4AF37]/40">{t('quantumApothecary.subtitle')}</p>
            </div>
          </div>
          <button onClick={() => setShowKnowledge(true)}
            className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition">
            <Info size={15} className="text-[#D4AF37]/60" />
          </button>
        </div>

        {/* ── Two-column grid ── */}
        {/* ── Gold divider ── */}
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)', marginBottom:16, borderRadius:1 }} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-5">

            {/* ── Biometric Nadi Scanner — rPPG real vitals ── */}
            <div className="glass-card p-4 sm:p-5 qa-card-hover">
              <NadiScanner
                userName={seekerName || 'Seeker'}
                jyotishContext={{
                  mahadasha: jyotish?.mahadasha,
                  nakshatra: jyotish?.nakshatra,
                  primaryDosha: jyotish?.primaryDosha,
                }}
                onScanComplete={(reading) => {
                  // Build structured live scan context for this session
                  const ctx = [
                    '[LIVE BIOMETRIC NADI SCAN — rPPG]',
                    `Active Nadi: ${reading.activatedNadi}`,
                    `Prana Coherence: ${reading.activeNadis.toLocaleString()} / 72,000 nadis active`,
                    `Heart Rate: ${reading.rawVitals.heart_rate} BPM`,
                    `HRV RMSSD: ${reading.rawVitals.hrv_rmssd ?? 'not measured'} ms`,
                    `HRV LF/HF: ${reading.rawVitals.hrv_lfhf ?? 'not measured'}`,
                    `Respiratory Rate: ${reading.rawVitals.respiratory_rate} RPM`,
                    `Vagal Tone: ${reading.vagalTone}`,
                    `Autonomic State: ${reading.autonomicBalance}`,
                    `Chakra Field: ${reading.chakraState}`,
                    `Blockage Location: ${reading.blockageLocation}`,
                    `Scan Confidence: ${Math.round(reading.rawVitals.confidence * 100)}%`,
                  ].join('\n');
                  setLiveScanContext(ctx);
                  // Persist scan to nadi_scan_results table (gracefully skipped if migration pending)
                  sqiField.updateNadi({
                    activatedNadi: reading.activatedNadi,
                    heartRate: reading.rawVitals.heart_rate,
                    hrvRmssd: reading.rawVitals.hrv_rmssd ?? 0,
                    respiratoryRate: reading.rawVitals.respiratory_rate,
                    vagalTone: reading.vagalTone,
                    pranaCoherence: reading.activeNadis,
                    autonomicBalance: reading.autonomicBalance,
                    scannedAt: new Date().toISOString(),
                  });
                }}
              />
            </div>

            {/* ── Old scan result display (palm AI scan) — keep below biometric scanner ── */}
            {scanResult && (
            <div className="glass-card p-6 sm:p-7 qa-card-hover">
              <div className="mb-6 flex justify-between gap-3">
                <div>
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]/55">{t('quantumApothecary.scan.title')}</p>
                  <p className="mt-2 text-xs leading-[1.6] text-white/60">{t('quantumApothecary.scan.channelsMonitoring')}</p>
                </div>
                <Activity
                  className="h-5 w-5 shrink-0"
                  style={{ color: '#D4AF37' }}
                  aria-hidden
                />
              </div>

              {scanResult ? (
                <div className="space-y-4">
                  {/* Active Nadis — hero number */}
                  <div className="p-5 rounded-2xl border border-[#D4AF37]/20" style={{ position:'relative', overflow:'hidden', background:'radial-gradient(ellipse at 50% 80%, rgba(212,175,55,0.08) 0%, rgba(5,5,5,0.9) 70%)' }}>
                    <div style={{ position:'absolute', top:'-50%', left:'50%', transform:'translateX(-50%)', width:200, height:200, background:'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
                    <div style={{ textAlign:'center', position:'relative' }}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-2">Active Nadis</p>
                      <motion.p
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="font-black text-[#D4AF37]"
                        style={{ fontSize:48, lineHeight:1, textShadow:'0 0 40px rgba(212,175,55,0.5), 0 0 80px rgba(212,175,55,0.2)', letterSpacing:'-0.02em' }}
                      >
                        {scanResult.activeNadis.toLocaleString()}
                      </motion.p>
                      <p className="text-[9px] text-white/25 font-bold mt-2">of 72,000 channels active</p>
                      <div style={{ marginTop:12, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (scanResult.activeNadis / 72000) * 100)}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                          style={{ height:'100%', background:'linear-gradient(90deg,#B8940A,#D4AF37,#fbbf24)', borderRadius:2, boxShadow:'0 0 12px rgba(212,175,55,0.6)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Nadis */}
                  {typeof scanResult.activeSubNadis === 'number' && (
                    <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Subtle Sub-Nadi (350,000)</p>
                      <p className="text-sm font-black tracking-tight text-white/90">
                        {scanResult.activeSubNadis.toLocaleString()}
                        <span className="text-[9px] font-bold text-white/30 ml-1">/ 350,000</span>
                      </p>
                      <p className="text-[9px] text-white/25 font-bold mt-1">
                        {Math.round((scanResult.activeSubNadis / 350000) * 100)}% subtle body activated
                      </p>
                      <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (scanResult.activeSubNadis / 350000) * 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                          style={{ height: '100%', background: 'linear-gradient(90deg,#D4AF37,#fbbf24)', borderRadius: 2, boxShadow: '0 0 8px rgba(212,175,55,0.35)' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Primary Blockage */}
                  {scanResult.blockagePercentage != null && scanResult.blockagePercentage > 0 && (
                    <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Primary Blockage</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black tracking-tight text-white/90 truncate">{scanResult.blockages[0]}</p>
                        <p className="text-sm font-black text-[#D4AF37] shrink-0">{scanResult.blockagePercentage}%</p>
                      </div>
                      <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${scanResult.blockagePercentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
                          style={{ height: '100%', background: 'linear-gradient(90deg,#D4AF37,#fbbf24)', borderRadius: 2 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Dosha + Alignment grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Dosha', value: scanResult.dominantDosha },
                      { label: 'Alignment', value: scanResult.planetaryAlignment },
                    ].map(item => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 }}
                        className="rounded-2xl p-3 bg-white/[0.02] border border-white/[0.05]"
                      >
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">{item.label}</p>
                        <p className="text-sm font-black tracking-tight mt-1 text-white/90">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Herb of Today */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/[0.06] p-4"
                  >
                    <p className="mb-1.5 text-[8px] font-extrabold uppercase tracking-[0.5em] text-[#22D3EE]/80">{t('quantumApothecary.scan.herbToday')}</p>
                    <p className="text-sm font-bold leading-[1.6] text-white/90">{scanResult.herbOfToday}</p>
                  </motion.div>

                  {/* Palm Morphology Meta */}
                  {(scanResult.palmType || scanResult.dominantMount || scanResult.karmaPath) && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.82 }}
                      className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-3">Quantum Palm Morphology</p>
                      <div className="grid grid-cols-3 gap-2">
                        {scanResult.palmType && (
                          <div style={{ textAlign: 'center' }}>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-1">Palm Type</p>
                            <p className="text-xs font-black text-[#D4AF37]" style={{ textTransform: 'capitalize' }}>{scanResult.palmType}</p>
                          </div>
                        )}
                        {scanResult.dominantMount && (
                          <div style={{ textAlign: 'center' }}>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-1">Dominant Mount</p>
                            <p className="text-xs font-black text-[#D4AF37]">{scanResult.dominantMount}</p>
                          </div>
                        )}
                        {scanResult.karmaPath && (
                          <div style={{ textAlign: 'center' }}>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-1">Karma Path</p>
                            <p className="text-xs font-black text-[#D4AF37]" style={{ textTransform: 'capitalize' }}>{scanResult.karmaPath}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Soul Bio-Signature */}
                  {scanResult.soulBioSignature && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.84 }}
                      style={{ borderRadius: 16, padding: 16, background: 'linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.2)', position: 'relative', overflow: 'hidden' }}
                    >
                      <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
                      <p className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]/60 mb-2">⬡ Soul Bio-Signature</p>
                      <p className="text-xs leading-[1.6] text-white/80" style={{ fontStyle: 'italic' }}>{scanResult.soulBioSignature}</p>
                    </motion.div>
                  )}

                  {/* Karma Field Reading */}
                  {scanResult.karmaFieldReading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.87 }}
                      style={{ borderRadius: 16, padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      <p className="text-[8px] font-extrabold uppercase tracking-[0.5em] mb-2" style={{ color: 'rgba(167,139,250,0.8)' }}>☽ Karma Field Reading</p>
                      <p className="text-xs leading-[1.6] text-white/75">{scanResult.karmaFieldReading}</p>
                    </motion.div>
                  )}

                  {/* Chakra Readings */}
                  {scanResult.chakraReadings && scanResult.chakraReadings.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.85 }}
                      className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-3">Chakra Biofield Scan</p>
                      <div className="space-y-2">
                        {scanResult.chakraReadings.map((c, i) => {
                          const statusColor = c.status === 'Active' ? '#34D399' : c.status === 'Awakening' ? '#D4AF37' : c.status === 'Stressed' ? '#F59E0B' : '#EF4444';
                          return (
                            <motion.div
                              key={c.chakra}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.9 + i * 0.06 }}
                              className="flex items-start gap-2.5"
                            >
                              <div className="mt-1 shrink-0 flex flex-col items-center gap-0.5 w-10">
                                <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, background: statusColor }} />
                                </div>
                                <span className="text-[7px] font-bold tabular-nums" style={{ color: statusColor }}>{c.pct}%</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: statusColor }}>{c.chakra}</p>
                                <p className="text-[10px] text-white/50 leading-[1.4] mt-0.5">{c.note}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Siddha Remedies */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                    className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-3">Siddha Remedies ({scanResult.remedies.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.remedies.map((r, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 1 + i * 0.08 }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]"
                        >
                          {r}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={applyRemedies}
                      className="w-full rounded-[28px] border border-[#D4AF37]/35 bg-[#D4AF37]/15 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37] transition-all hover:bg-[#D4AF37]/25"
                    >
                      Apply Remedies · Scalar Lock
                    </button>
                    <button
                      type="button"
                      onClick={() => runNadiScan('environment')}
                      disabled={isScanning}
                      className="w-full rounded-[28px] border border-white/[0.08] bg-white/[0.05] py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 transition-all hover:border-[#D4AF37]/25 hover:text-[#D4AF37] disabled:opacity-35"
                    >
                      Rescan · Rear Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-5">
                  {/* Error */}
                  {scanError && (
                    <div className="rounded-2xl p-4 border border-red-500/30 bg-red-950/20 mb-3">
                      <p className="text-[12px] font-bold text-red-400 leading-relaxed">{scanError}</p>
                    </div>
                  )}

                  {/* Camera live feed */}
                  {(scanPhase === 'camera' || scanPhase === 'analyzing') ? (
                    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
                        <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2 mt-[env(safe-area-inset-top)]">
                          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" style={{ boxShadow: '0 0 6px rgba(212,175,55,0.8)' }} />
                          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                            {scanPhase === 'camera' ? 'Rear cam · frame your palm…' : 'Reading your biofield…'}
                          </span>
                        </div>
                        <div className="border-2 border-dashed border-[#D4AF37]/50 rounded-2xl w-48 h-32 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#D4AF37]/60 uppercase tracking-widest text-center leading-relaxed">
                            {scanPhase === 'camera' ? <>Aim camera<br />at palm</> : <>Analyzing<br/>biofield…</>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2 mb-[env(safe-area-inset-bottom)]">
                          <Activity size={14} className="text-[#D4AF37]" />
                          <span className="text-sm font-black text-[#D4AF37]">Scanning…</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 text-center">
                      <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-black/45">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/35">
                          <Zap className="mb-2 h-8 w-8 text-[#D4AF37]/50" aria-hidden />
                          <p className="text-[8px] font-extrabold uppercase tracking-[0.4em]">{t('quantumApothecary.scan.awaitingHandshake')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scan button — admin 2045 gold pill */}
                  <button
                    type="button"
                    onClick={() => runNadiScan('environment')}
                    disabled={scanPhase === 'camera' || scanPhase === 'analyzing'}
                    className="w-full rounded-[40px] border border-[#D4AF37]/40 bg-gradient-to-b from-[#F5E17A] via-[#D4AF37] to-[#A07C10] px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-[#050505] shadow-[0_12px_40px_rgba(212,175,55,0.35)] transition-all hover:shadow-[0_16px_48px_rgba(212,175,55,0.45)] disabled:border-white/10 disabled:bg-white/[0.05] disabled:text-white/40 disabled:shadow-none disabled:opacity-60"
                  >
                    {scanPhase === 'camera'
                      ? t('quantumApothecary.scan.scanning')
                      : scanPhase === 'analyzing'
                        ? t('quantumApothecary.scan.analyzingBiofield')
                        : t('quantumApothecary.scan.initiate')}
                  </button>
                </div>
              )}
            </div>
            )}

            {/* ── Aetheric Mixer ── */}
            <div className="glass-card p-6 sm:p-7 qa-card-hover">
              <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#D4AF37,transparent)', marginBottom: 20, opacity: 0.4, borderRadius: 1 }} />
              <div className="flex justify-between items-center mb-4">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚗</div>
                  <h2 className="text-sm font-black tracking-[-0.03em]">Aetheric Mixer</h2>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < selectedActivations.length ? '#D4AF37' : 'rgba(255,255,255,0.08)', boxShadow: i < selectedActivations.length ? '0 0 6px #D4AF37' : 'none', transition:'all 0.3s' }} />
                  ))}
                </div>
              </div>
              <div className="min-h-[64px] rounded-2xl bg-white/[0.02] border border-dashed border-[#D4AF37]/15 p-3 mb-4">
                {selectedActivations.length === 0 ? (
                  <div className="flex items-center gap-2 justify-center text-white/20 py-2">
                    <Plus size={14} className="text-[#D4AF37]/30" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Select activations from the library</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedActivations.map(act => (
                      <div key={act.id} className="flex items-center justify-between group px-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: act.color, boxShadow: `0 0 6px ${act.color}` }} />
                          <span className="text-xs font-bold text-white/80">{act.name}</span>
                        </div>
                        <button onClick={() => setSelectedActivations(s => s.filter(a => a.id !== act.id))}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition text-white/30">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={transmitCocktail}
                disabled={selectedActivations.length === 0}
                className="w-full rounded-[40px] border border-[#D4AF37]/45 bg-gradient-to-b from-[#F5E17A] to-[#B8960C] py-4 text-xs font-black uppercase tracking-[0.28em] text-[#050505] shadow-[0_8px_32px_rgba(212,175,55,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(212,175,55,0.4)] disabled:opacity-20"
              >
                Transmit Light-Code
              </button>
            </div>

            {/* ── Active Transmissions ── */}
            <Suspense fallback={
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#D4AF37]" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' }} />
                    <h2 className="text-sm font-black tracking-[-0.03em]">Active Transmissions</h2>
                  </div>
                  <span className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold uppercase tracking-widest">Loading...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
                  <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
                </div>
              </div>
            }>
              <ActiveTransmissionsSection activeTransmissions={activeTransmissions} setActiveTransmissions={setActiveTransmissions} />
            </Suspense>
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="space-y-5">

            {/* ── Frequency Library ── */}
            <Suspense fallback={
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h2 className="text-sm font-black tracking-[-0.03em]">Frequency Library</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mt-0.5">Loading quantum essences...</p>
                </div>
                <div className="h-8 rounded-xl bg-white/[0.03] animate-pulse mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
                  <div className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
                </div>
              </div>
            }>
              <FrequencyLibrarySection activeCategory={activeCategory} setActiveCategory={setActiveCategory} selectedActivations={selectedActivations} addActivation={addActivation} />
            </Suspense>

            {/* ── Active Field Context Pills ── */}
            {!sqiField.loading && (sqiField.nadi || sqiField.ayurveda || sqiField.photonic?.lightCodeActive || sqiField.temple?.activeSite) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 2, paddingRight: 2, marginBottom: 4 }}>
                {sqiField.nadi?.activatedNadi && (
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 30, padding: '4px 10px' }}>
                    ⊕ {sqiField.nadi.activatedNadi} Nadi · {sqiField.nadi.heartRate} BPM
                  </span>
                )}
                {sqiField.ayurveda?.prakriti && (
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 30, padding: '4px 10px' }}>
                    ⟁ {sqiField.ayurveda.prakriti}
                  </span>
                )}
                {sqiField.photonic?.lightCodeActive && (
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.8)', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 30, padding: '4px 10px' }}>
                    ≋ {sqiField.photonic.frequency}Hz · {sqiField.photonic.activeProtocol}
                  </span>
                )}
                {sqiField.temple?.activeSite && (
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 30, padding: '4px 10px' }}>
                    ◈ {sqiField.temple.activeSite} · {sqiField.temple.intensity}%
                  </span>
                )}
              </div>
            )}

            {/* ── Chat Panel ── */}
            <div ref={chatPanelRef}>
              {renderChatPanel()}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          KNOWLEDGE MODAL — SQI-2050 Style
          Logic UNCHANGED
          ══════════════════════════════════ */}
      <AnimatePresence>
        {showKnowledge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card max-w-lg w-full max-h-[80vh] overflow-y-auto p-7 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.05em]">Siddha-Quantum Intelligence</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]/50 mt-1">Akasha-Neural Archive · 2050</p>
                </div>
                <button onClick={() => setShowKnowledge(false)} className="p-2 hover:bg-white/5 rounded-xl transition">
                  <X size={15} className="text-white/40" />
                </button>
              </div>
              {[
                { t: 'What is this?', d: 'Apothecary 2050 is a Bio-Resonance Frequency Delivery Platform. It bypasses physical ingestion to deliver the "informational signature" of herbs and sacred plants directly into the human biofield via Scalar Wave Entanglement.' },
                { t: 'The 72,000 Nadi Scan', d: 'We map the Quantum Flow of every single meridian. Dark crimson pulses indicate "Spiritual Friction" (Blockages), while bright white bursts show where your "Siddhis" (Powers) are awakening.' },
                { t: '24/7 Persistent Transmission', d: 'Once a mix is toggled ON, the app uses a persistent background frequency loop to maintain the transmission. This ensures the frequency stays locked into your biofield until manually dissolved — even if you close the app or lose internet.' },
                { t: 'Siddha Wisdom', d: 'We bridge the ancient wisdom of the 18 Siddhars with hyper-advanced neural-mapping. Healing occurs at the speed of thought.' },
              ].map(s => (
                <div key={s.t} className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xs font-black tracking-tight text-[#D4AF37] mb-2">{s.t}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{s.d}</p>
                </div>
              ))}
              <button onClick={() => setShowKnowledge(false)} className="sqi-btn-primary w-full py-3.5 text-xs">
                Return to Aether
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════
          SESSION HISTORY DRAWER — Logic UNCHANGED
          ══════════════════════════════════ */}
      <AnimatePresence>
        {sessionsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSessionsOpen(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 h-full w-72 sm:w-80 flex flex-col border-l border-white/[0.05]"
              style={{ background: '#050505' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em]">SQI Sessions</p>
                  <p className="text-[9px] font-bold text-white/30 mt-0.5">
                    {user ? 'Tap to reopen a past transmission.' : 'Sign in to save sessions.'}
                  </p>
                </div>
                <button onClick={() => setSessionsOpen(false)} className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition">
                  <X size={14} className="text-white/40" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {loadingSessions && <div className="text-[10px] font-bold uppercase tracking-widest text-white/25">Loading sessions…</div>}
                {!loadingSessions && sessions.length === 0 && (
                  <div className="text-[10px] text-white/25 leading-relaxed">
                    No prior SQI conversations yet. Your next transmission will be stored here.
                  </div>
                )}
                {sessions.map(s => (
                  <button key={s.id}
                    onClick={async () => {
                      if (!user) return;
                      const { data, error } = await supabase.from('sqi_sessions').select('messages').eq('id', s.id).eq('user_id', user.id).single();
                      if (!error && data && Array.isArray(data.messages)) { setCurrentSessionId(s.id); setMessages(data.messages as Message[]); setSessionsOpen(false); }
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border bg-white/[0.02] hover:bg-white/[0.05] transition ${currentSessionId === s.id ? 'border-[#D4AF37]/40' : 'border-white/[0.05]'}`}>
                    <p className="text-[11px] font-black truncate">{s.title || 'Untitled SQI Session'}</p>
                    {s.updated_at && <p className="text-[9px] text-white/30 mt-1 font-bold">{new Date(s.updated_at).toLocaleString()}</p>}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════
          SQI-2050 CSS Light-Codes
          ══════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');

        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── SQI-2050 Glassmorphism Standard ── */
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
        }

        /* ── Siddha-Gold Primary Button ── */
        .sqi-btn-primary {
          background: linear-gradient(135deg, #D4AF37 0%, #B8940A 100%);
          color: #050505;
          border-radius: 20px;
          font-weight: 900;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 0 20px rgba(212,175,55,0.2);
        }
        .sqi-btn-primary:hover:not(:disabled) {
          box-shadow: 0 0 32px rgba(212,175,55,0.4);
          transform: translateY(-1px);
        }

        /* ── Ghost Button ── */
        .sqi-btn-ghost {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          border-radius: 20px;
          font-weight: 800;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sqi-btn-ghost:hover {
          background: rgba(212,175,55,0.08);
          border-color: rgba(212,175,55,0.25);
          color: #D4AF37;
        }

        /* ── Nadi Line Animations (unchanged) ── */
        .nadi-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 10s linear infinite;
          filter: drop-shadow(0 0 2px currentColor);
          opacity: 0.3;
          transition: all 0.5s ease;
        }
        .nadi-line.active {
          opacity: 1;
          stroke-width: 1.5;
          filter: drop-shadow(0 0 8px rgba(212,175,55,0.8));
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }

        /* ── Gold Glow Pulse on scan ── */
        @keyframes gold-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
          50% { box-shadow: 0 0 40px 8px rgba(212,175,55,0.15); }
        }

        /* ── Scrollbar ── */
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.3); }
  @keyframes scan-line {
    0%   { background-position: 0 -100%; }
    100% { background-position: 0 200%; }
  }
  @keyframes qa-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes qa-glow-pulse { 0%,100%{opacity:0.15} 50%{opacity:0.35} }
  @keyframes qa-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes qa-spin-slow { to{transform:rotate(360deg)} }
  @keyframes qa-ping-gold { 75%,100%{transform:scale(2.2);opacity:0} }
  .qa-card-hover { transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s !important; }
  .qa-card-hover:hover { border-color: rgba(212,175,55,0.25) !important; box-shadow: 0 0 40px rgba(212,175,55,0.08) !important; transform: translateY(-2px) !important; }
  .qa-btn-shine { position:relative; overflow:hidden; }
  .qa-btn-shine::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%); background-size:200% 100%; animation:qa-shimmer 3s infinite; }
      `}</style>

      {/* Scroll-to-top FAB */}
      <ScrollToTopButton />
    </div>
  );
}

function ScrollToTopButton() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-4 z-50 w-10 h-10 rounded-full border border-[#D4AF37]/30 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 transition shadow-lg"
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   OUTER WRAPPER — 100% IDENTICAL TO ORIGINAL
   Auth, membership, tier-access logic UNTOUCHED
   ══════════════════════════════════════════════════════ */
export default function QuantumApothecary() {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  if (authLoading || membershipLoading || adminLoading || !settled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <span className="text-[10px] uppercase tracking-[0.5em] text-[#D4AF37]/40">Initializing SQI…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.quantumApothecary)) {
    return <Navigate to="/akasha-infinity" replace />;
  }

  return <QuantumApothecaryInner />;
}
