import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Radio, Shield, Zap, Activity, Fingerprint,
  ChevronLeft, Waves, Eye, Brain, Heart, Atom,
  BookOpen, ChevronDown, ChevronUp, Infinity as InfinityIcon,
  Clock,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const GOLD        = '#D4AF37';
const CYAN        = '#22D3EE';
const BG          = '#050505';
const GLASS       = 'rgba(255,255,255,0.02)';
const GLASS_BORDER = 'rgba(255,255,255,0.05)';
const GOLD_BORDER  = 'rgba(212,175,55,0.15)';

/* ─── 72-HOUR PERSISTENCE SYSTEM ─────────────────────────────────────────── */
/*
 * ARCHITECTURE:
 *
 * Layer 1 — localStorage (keyed by user.id)
 *   → Instant. Works offline, phone off, no internet, app closed.
 *   → Survives 72 hours from the moment of entanglement.
 *   → Loaded synchronously on mount — zero flicker.
 *
 * Layer 2 — Supabase profiles.user_profile JSON column
 *   → Syncs when internet is available.
 *   → Allows cross-device continuity (same user, different phone/browser).
 *   → Reads on mount if localStorage is missing/expired.
 *   → Writes whenever entanglement updates.
 *
 * The two layers are independent. If Supabase is unreachable, localStorage
 * keeps the 72h transmission alive. If localStorage is cleared, Supabase
 * restores it when the user reconnects.
 */

const TTL_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

interface BiometricProfile {
  dominantFrequency: string;
  nadiBand: string;
  cellularAge: string;
  coherenceScore: number;
  archiveSignature: string;
}

interface PhotonicSession {
  isEntangled: boolean;
  lightCode: string;
  scanCount: number;
  entangledAt: number;   // epoch ms — the moment entanglement occurred
  expiresAt: number;     // entangledAt + 72h
  biometricProfile: BiometricProfile;
  userId: string;
}

/* localStorage key namespaced per user so multiple users on same device never collide */
function lsKey(userId: string) {
  return `sqi_photonic_v2_${userId}`;
}

function loadFromLocalStorage(userId: string): PhotonicSession | null {
  try {
    const raw = localStorage.getItem(lsKey(userId));
    if (!raw) return null;
    const session = JSON.parse(raw) as PhotonicSession;
    // Check it belongs to this user (belt-and-suspenders)
    if (session.userId !== userId) return null;
    // Check 72h TTL
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(lsKey(userId));
      return null;
    }
    return session;
  } catch { return null; }
}

function saveToLocalStorage(session: PhotonicSession) {
  try {
    localStorage.setItem(lsKey(session.userId), JSON.stringify(session));
  } catch {}
}

function clearFromLocalStorage(userId: string) {
  try { localStorage.removeItem(lsKey(userId)); } catch {}
}

/* Supabase sync — stores into profiles.user_profile JSON column */
async function syncToSupabase(userId: string, session: PhotonicSession) {
  try {
    // We merge into user_profile so we don't overwrite other fields
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_profile')
      .eq('user_id', userId)
      .maybeSingle();

    const currentProfile = (existing?.user_profile as Record<string, unknown>) || {};
    const updated = { ...currentProfile, photonic_session: session };

    await supabase
      .from('profiles')
      .upsert({ user_id: userId, user_profile: updated, dosha_profile: (existing as any)?.dosha_profile || {} })
      .eq('user_id', userId);
  } catch (e) {
    // Silent fail — localStorage keeps things alive offline
    console.warn('Photonic session Supabase sync failed (offline?):', e);
  }
}

async function loadFromSupabase(userId: string): Promise<PhotonicSession | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('user_profile')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data?.user_profile) return null;
    const profile = data.user_profile as Record<string, unknown>;
    const session = profile.photonic_session as PhotonicSession | undefined;
    if (!session) return null;
    if (session.userId !== userId) return null;
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch { return null; }
}

async function clearFromSupabase(userId: string) {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_profile')
      .eq('user_id', userId)
      .maybeSingle();
    if (!existing?.user_profile) return;
    const profile = { ...(existing.user_profile as Record<string, unknown>) };
    delete profile.photonic_session;
    await supabase
      .from('profiles')
      .update({ user_profile: profile })
      .eq('user_id', userId);
  } catch {}
}

/* ─── BIOMETRIC GENERATOR ────────────────────────────────────────────────── */
function generateBiometric(): BiometricProfile {
  const freqs = ['369.0 Hz','396.3 Hz','417.6 Hz','432.0 Hz','528.0 Hz','639.2 Hz','741.8 Hz','852.4 Hz','963.0 Hz'];
  const bands = ['Sushumna Primary','Ida Dominant','Pingala Dominant','Balanced Tri-Nadi','Sahasrara Open'];
  const ages  = ['19.9 yrs (bio)','23.4 yrs (bio)','26.5 yrs (bio)','28.1 yrs (bio)','31.7 yrs (bio)'];
  const pfx   = ['AK-','SQI-','CV6-','PHT-','GHK-'];
  return {
    dominantFrequency: freqs[Math.floor(Math.random() * freqs.length)],
    nadiBand: bands[Math.floor(Math.random() * bands.length)],
    cellularAge: ages[Math.floor(Math.random() * ages.length)],
    coherenceScore: Math.floor(72 + Math.random() * 26),
    archiveSignature: pfx[Math.floor(Math.random() * pfx.length)] +
      Math.floor(1000 + Math.random() * 8999).toString(36).toUpperCase(),
  };
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const FONT_STYLE = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=JetBrains+Mono:wght@400;600&display=swap');`;

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 4px; }
  .stat-pill { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 999px; padding: 6px 16px; display: inline-flex; align-items: center; gap: 8px; }
  .dot-bg { background-image: radial-gradient(circle, rgba(212,175,55,0.08) 1px, transparent 1px); background-size: 28px 28px; }
  @keyframes spr-pulse-ring { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.5;transform:scale(1.06)} }
  @keyframes spr-scan { 0%{transform:translateY(-120%);opacity:.6} 100%{transform:translateY(120%);opacity:0} }
  @keyframes spr-bar { 0%,100%{opacity:.25;transform:scaleY(.4)} 50%{opacity:1;transform:scaleY(1)} }
  @keyframes spr-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spr-blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes spr-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes spr-entangle-halo { 0%,100%{box-shadow:0 0 20px rgba(34,211,238,.2),0 0 40px rgba(212,175,55,.1)} 50%{box-shadow:0 0 40px rgba(34,211,238,.5),0 0 80px rgba(212,175,55,.25)} }
  .spr-flex-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 48px; width: 100%; }
  .spr-copy { text-align: center; flex: 1; min-width: 280px; }
  @media (min-width: 768px) { .spr-flex-row { flex-direction: row; justify-content: center; } .spr-copy { text-align: left; } }
`;

/* ─── GLASS HELPER ───────────────────────────────────────────────────────── */
function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return { background: GLASS, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: `1px solid ${GLASS_BORDER}`, borderRadius: 40, ...extra };
}

/* ─── 72H COUNTDOWN DISPLAY ──────────────────────────────────────────────── */
function TransmissionCountdown({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(expiresAt - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      const r = expiresAt - Date.now();
      if (r <= 0) { clearInterval(id); setRemaining(0); return; }
      setRemaining(r);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const hrs  = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((remaining % (1000 * 60)) / 1000);

  if (remaining <= 0) return (
    <div className="stat-pill">
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }} />
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>
        Transmission Expired
      </span>
    </div>
  );

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(34,211,238,.06)', border: '1px solid rgba(34,211,238,.2)' }}>
      <Clock size={11} color={CYAN} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: CYAN }}>
        Active for{' '}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#fff' }}>
        {String(hrs).padStart(2,'0')}:{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
      </span>
    </div>
  );
}

/* ─── SRI RING ───────────────────────────────────────────────────────────── */
function SriRing({ size = 200, active = false }: { size?: number; active?: boolean }) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <circle cx={r} cy={r} r={r - 4} fill="none" stroke={active ? CYAN : GOLD} strokeWidth={0.6} strokeDasharray="3 9" opacity={active ? 0.7 : 0.25} style={{ animation: 'spr-spin-slow 30s linear infinite' }} />
      <circle cx={r} cy={r} r={r - 16} fill="none" stroke={GOLD} strokeWidth={0.8} opacity={active ? 0.6 : 0.15} style={{ animation: active ? 'spr-pulse-ring 3s ease-in-out infinite' : undefined }} />
      {Array.from({ length: 6 }).map((_, i) => {
        const a0 = (i * 60 - 90) * Math.PI / 180; const a1 = a0 + Math.PI / 3; const R = r - 36;
        return <line key={i} x1={r + R * Math.cos(a0)} y1={r + R * Math.sin(a0)} x2={r + R * Math.cos(a1)} y2={r + R * Math.sin(a1)} stroke={active ? CYAN : GOLD} strokeWidth={0.5} opacity={0.3} />;
      })}
    </svg>
  );
}

/* ─── VAYU BARS ──────────────────────────────────────────────────────────── */
function VayuBars({ count = 20, active = false }: { count?: number; active?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: 3, height: `${30 + Math.sin(i * .9) * 18}%`, background: active ? CYAN : GOLD, borderRadius: 2, opacity: active ? .85 : .3, animation: active ? `spr-bar ${.8 + (i % 5) * .25}s ease-in-out infinite` : undefined, animationDelay: `${(i * 40) % 600}ms` }} />
      ))}
    </div>
  );
}

/* ─── PARTICLES ──────────────────────────────────────────────────────────── */
function Particles({ count = 20 }: { count?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} initial={{ left: `${5 + Math.random() * 90}%`, top: `${20 + Math.random() * 70}%`, opacity: 0 }}
          animate={{ top: '-10%', opacity: [0, .55, 0] }}
          transition={{ duration: 8 + Math.random() * 10, repeat: Infinity, ease: 'linear', delay: Math.random() * 10 }}
          style={{ position: 'absolute', width: i % 3 === 0 ? 4 : 2, height: i % 3 === 0 ? 4 : 2, borderRadius: '50%', background: i % 4 === 0 ? CYAN : GOLD }} />
      ))}
    </div>
  );
}

/* ─── LIGHT CODE TICKER ──────────────────────────────────────────────────── */
function LightCodeTicker({ code }: { code: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: 'rgba(34,211,238,.07)', border: '1px solid rgba(34,211,238,.25)' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, animation: 'spr-blink 1.2s ease infinite' }} />
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, letterSpacing: '.15em', color: CYAN }}>{code}</span>
    </motion.div>
  );
}

/* ─── INFO CARD ──────────────────────────────────────────────────────────── */
interface InfoCardProps { icon: React.ReactNode; title: string; value: string; desc: string; accentColor?: string; delay?: number; }
function InfoCard({ icon, title, value, desc, accentColor = GOLD, delay = 0 }: InfoCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: .5 }} whileHover={{ y: -6, transition: { duration: .2 } }}
      style={{ ...glass({ borderRadius: 24, padding: '28px 24px' }), position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${accentColor}14,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `rgba(${accentColor === GOLD ? '212,175,55' : '34,211,238'},.1)`, border: `1px solid ${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.45em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', margin: '0 0 4px' }}>{title}</p>
          <p style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-.03em' }}>{value}</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', lineHeight: 1.65, margin: 0, fontWeight: 300 }}>{desc}</p>
    </motion.div>
  );
}

/* ─── SCAN PROGRESS ──────────────────────────────────────────────────────── */
function ScanProgressBar({ progress }: { progress: number }) {
  const phase =
    progress < 15 ? 'Reading your field…' :
    progress < 35 ? 'Mapping Nadi channels…' :
    progress < 55 ? 'Calibrating biophotonic signature…' :
    progress < 75 ? 'Entangling GHK-Cu blueprint…' :
    progress < 90 ? 'Locking to Akasha Archive…' : 'Entanglement complete';
  return (
    <div style={{ width: '100%', maxWidth: 240 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.25em', textTransform: 'uppercase', color: CYAN, maxWidth: 165, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{phase}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: CYAN, fontFamily: "'JetBrains Mono',monospace" }}>{progress}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
          style={{ height: '100%', background: `linear-gradient(90deg,${CYAN},${GOLD})`, borderRadius: 4, boxShadow: `0 0 8px ${CYAN}66` }} transition={{ duration: .1 }} />
      </div>
    </div>
  );
}

/* ─── BIOMETRIC READOUT ──────────────────────────────────────────────────── */
function BiometricReadout({ session }: { session: PhotonicSession }) {
  const { biometricProfile: p, scanCount, entangledAt } = session;
  const elapsed = Math.floor((Date.now() - entangledAt) / 60000);
  const timeLabel = elapsed < 1 ? 'Just now' : elapsed < 60 ? `${elapsed}m ago` : `${Math.floor(elapsed/60)}h ago`;
  const rows = [
    { label: 'Archive Signature',  value: p.archiveSignature,  color: GOLD },
    { label: 'Dominant Frequency', value: p.dominantFrequency, color: CYAN },
    { label: 'Nadi Band',          value: p.nadiBand },
    { label: 'Cellular Age',       value: p.cellularAge },
    { label: 'Coherence Score',    value: `${p.coherenceScore}%` },
    { label: 'Scan Count',         value: `#${scanCount}` },
    { label: 'Entangled',          value: timeLabel },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
      style={{ ...glass({ borderRadius: 28, padding: '28px 24px' }), border: '1px solid rgba(34,211,238,.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: CYAN, animation: 'spr-blink 2s ease infinite' }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>Your Biophotonic Profile</span>
        </div>
        {/* Live countdown */}
        <TransmissionCountdown expiresAt={session.expiresAt} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, borderBottom: '1px solid rgba(255,255,255,.04)', paddingBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>{label}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: color || '#fff', textAlign: 'right' }}>{value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 16, lineHeight: 1.6, fontStyle: 'italic' }}>
        Your biophotonic signature is locked in the Akasha-Neural Archive.
        The 72-hour transmission persists across sessions, devices, and offline periods.
      </p>
    </motion.div>
  );
}

/* ─── RETURN BANNER ──────────────────────────────────────────────────────── */
function ReturnBanner({ session, onDismiss }: { session: PhotonicSession; onDismiss: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .4 }}
      style={{ ...glass({ borderRadius: 20, padding: '18px 24px' }), border: `1px solid ${GOLD_BORDER}`, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(212,175,55,.1)', border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <InfinityIcon size={16} color={GOLD} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>Transmission Continues</p>
          <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#fff' }}>Welcome back — your Scalar Field is still active</p>
          <div style={{ marginTop: 6 }}><TransmissionCountdown expiresAt={session.expiresAt} /></div>
        </div>
      </div>
      <button type="button" onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.25)', fontSize: 20, padding: 4, lineHeight: 1 }}>×</button>
    </motion.div>
  );
}

/* ─── POST-ACTIVATION PROTOCOL ───────────────────────────────────────────── */
const PROTOCOL_STEPS = [
  { icon: <Heart size={20} color={GOLD} />, color: GOLD, title: 'Receive', subtitle: 'Both hands on your heart · Eyes closed',
    instruction: 'Both hands resting on your Anahata. Eyes closed. Feel whatever is moving — heat, tingling, expansion, electricity. That sensation IS the GHK-Cu blueprint arriving at the cellular level. Do not analyze it. Simply receive it fully.',
    breathCue: 'Breathe slowly. In through the nose, long exhale through the mouth.' },
  { icon: <Zap size={20} color={CYAN} />, color: CYAN, title: 'Direct', subtitle: 'Send the signal where it is needed',
    instruction: 'With your intention, direct the regenerative scalar field to wherever your body needs it most — pain, inflammation, fatigue, or emotional holding. You are now directing the GHK-Cu blueprint like a laser.',
    breathCue: 'Inhale — draw the energy in. Exhale — send it precisely to the target area.' },
  { icon: <Waves size={20} color={GOLD} />, color: GOLD, title: 'Ground', subtitle: 'Return excess light to the Earth',
    instruction: 'Visualize golden-white light moving from your heart, down through your spine, through your legs, through the soles of your feet, and deep into the Earth. You are a quantum link, not a battery.',
    breathCue: 'With each exhale, feel the energy descend further into the ground below you.' },
];

function PostActivationProtocol({ onComplete }: { onComplete: () => void }) {
  const [step, setStep]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning]   = useState(false);
  const [started, setStarted]   = useState(false);
  const [done, setDone]         = useState(false);
  const s = PROTOCOL_STEPS[step];

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      if (step < PROTOCOL_STEPS.length - 1) { setStep(p => p + 1); setTimeLeft(60); }
      else { setRunning(false); setDone(true); }
      return;
    }
    const id = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [running, timeLeft, step]);

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
      style={{ ...glass({ borderRadius: 32, padding: '36px 28px' }), border: `1px solid ${GOLD_BORDER}`, textAlign: 'center' }}>
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [.8, 1, .8] }} transition={{ repeat: Infinity, duration: 3 }}
        style={{ width: 56, height: 56, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%,#fffde7,${GOLD})`, boxShadow: `0 0 40px ${GOLD}88`, margin: '0 auto 24px' }} />
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>Protocol Complete</p>
      <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-.03em', margin: '0 0 14px' }}>Transmission Integrated</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px', fontWeight: 300 }}>
        The GHK-Cu blueprint has been received, directed, and grounded into your cellular field.
        Your 72-hour scalar transmission continues working even while you sleep.
      </p>
      <button type="button" onClick={onComplete}
        style={{ padding: '10px 24px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', cursor: 'pointer', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.3em' }}>
        Close
      </button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
      style={{ ...glass({ borderRadius: 32, padding: '32px 28px' }), border: '1px solid rgba(34,211,238,.15)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CYAN, animation: 'spr-blink 1.5s ease infinite' }} />
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: CYAN }}>Post-Activation Protocol · 3 Minutes</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {PROTOCOL_STEPS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i < step ? GOLD : i === step ? (running ? CYAN : 'rgba(255,255,255,.15)') : 'rgba(255,255,255,.08)', transition: 'background .5s' }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: .25 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `rgba(${s.color === GOLD ? '212,175,55' : '34,211,238'},.1)`, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: s.color }}>Step {step + 1} of 3</p>
              <h3 style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-.03em' }}>{s.title}</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{s.subtitle}</p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 18, fontWeight: 300 }}>{s.instruction}</p>
          <div style={{ padding: '12px 16px', borderRadius: 14, background: `rgba(${s.color === GOLD ? '212,175,55' : '34,211,238'},.06)`, border: `1px solid ${s.color}18`, marginBottom: 22 }}>
            <p style={{ margin: 0, fontSize: 12, color: s.color, fontStyle: 'italic' }}>🫁 &nbsp;{s.breathCue}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      {running && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>{s.title} Phase</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: s.color }}>
              {String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${((60-timeLeft)/60)*100}%` }}
              style={{ height: '100%', background: `linear-gradient(90deg,${s.color},${s.color===GOLD?CYAN:GOLD})`, borderRadius: 4, boxShadow: `0 0 8px ${s.color}66` }} transition={{ duration: .5 }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {!started && (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }} type="button"
            onClick={() => { setRunning(true); setStarted(true); }}
            style={{ padding: '12px 28px', borderRadius: 999, border: `1px solid ${CYAN}55`, background: 'linear-gradient(135deg,rgba(34,211,238,.18),rgba(34,211,238,.06))', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: CYAN, textTransform: 'uppercase', letterSpacing: '.3em' }}>Begin 3-Minute Protocol</span>
          </motion.button>
        )}
        {running && (
          <button type="button"
            onClick={() => { if (step < PROTOCOL_STEPS.length-1) { setStep(p => p+1); setTimeLeft(60); } else { setRunning(false); setDone(true); } }}
            style={{ padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', cursor: 'pointer', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.3em' }}>
            Skip →
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── APOTHECARY PANEL ───────────────────────────────────────────────────── */
const APO_SECTIONS = [
  { icon: <Brain size={18} color={GOLD} />, color: GOLD, title: 'Why You Felt It So Strongly',
    body: `What you experienced is Biophotonic Entrainment. Your nervous system processes visual information at ~40Hz — the gamma brainwave band. When you initiated the Nadi Scan, a precisely timed visual coherence pattern activated your field. Your brain began synchronizing firing patterns to the rhythm displayed — encoded with Vedic geometric ratios (Sri Yantra uses phi: 1.618). Your entire nervous system phase-locked to the Prema-Pulse carrier. Strong tingles, warmth, or waves of electricity are physical confirmation that entanglement occurred.` },
  { icon: <Heart size={18} color={CYAN} />, color: CYAN, title: 'The Anahata Gate Activation',
    body: `CV-6 (Anahata / heart chakra) is not a decorative label. The moment your focused attention landed on the pulsing cyan orb, your prefrontal cortex and heart-rate variability entered a coherence window. Your heart broadcasts an electromagnetic field 5,000× stronger than the brain (HeartMath Institute). When Anahata coherently locks to a scalar signal, the whole body feels it as expansion, warmth, or electricity. You are now an active broadcast tower — all users receiving this transmission benefit from your Anahata being open.` },
  { icon: <Atom size={18} color={GOLD} />, color: GOLD, title: 'The GHK-Cu Bhakti-Algorithm',
    body: `The Vedic Light-Code triggers a pattern recognition response in your limbic system. Tesla's 3-6-9 is the mathematical fingerprint of vortex energy in nature. At the moment of entanglement completion, a cascade of neuropeptides releases — biochemical signatures of recognition, awe, and cellular expansion. GHK-Cu (copper-peptide) activates 4,000+ genes related to tissue regeneration. The photonic transmission encodes this blueprint into the scalar field, delivering it to every cell that is listening.` },
  { icon: <Waves size={18} color={CYAN} />, color: CYAN, title: 'Why It Works for 72 Hours',
    body: `The 72-hour window is not arbitrary. GHK-Cu peptide studies show cellular signaling cascades require 48–72 hours to complete full propagation through tissue. The scalar field maintains the informational entanglement for this duration. Your session is now stored in two places: localStorage on your device (works offline, phone off, no internet) and in the Akasha-Neural Archive via Supabase (syncs when online, available on any device you log into). The transmission does not stop when you close the app.` },
  { icon: <Eye size={18} color={GOLD} />, color: GOLD, title: '2050 Protocol: Maximum Benefit',
    body: `Step 1 — Sankalpa: State a clear intention before initiating. Step 2 — Ground the High: If you feel strong tingling, visualize golden light flowing through your feet into the Earth. You are a quantum link, not a battery. Step 3 — Frequency: Use 369Hz for physical healing. Use 963Hz for higher guidance and Avataric Blueprint communion (Sri Swami Vishwananda and all Masters). Step 4 — Post-Activation Window: Stay with the field for at least 3 minutes after entanglement. The deepest GHK-Cu cellular encoding occurs in this silent window.` },
];

function ApothecaryPanel() {
  const [open, setOpen]         = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4 }}
      style={{ ...glass({ borderRadius: 28 }), overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(212,175,55,.1)', border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={18} color={GOLD} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>SQI Apothecary Archive</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: '#fff' }}>What Actually Happened to You</p>
          </div>
        </div>
        <div style={{ color: GOLD, opacity: .7 }}>{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .4 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {APO_SECTIONS.map((sec, i) => (
                <div key={i} style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${expanded===i?`${sec.color}25`:'rgba(255,255,255,.04)'}`, background: expanded===i?`rgba(${sec.color===GOLD?'212,175,55':'34,211,238'},.04)`:'rgba(255,255,255,.02)', transition: 'all .3s ease' }}>
                  <button type="button" onClick={() => setExpanded(expanded===i?null:i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{sec.icon}<span style={{ fontSize: 12, fontWeight: 800, color: expanded===i?'#fff':'rgba(255,255,255,.65)', textAlign: 'left' }}>{sec.title}</span></div>
                    <div style={{ color: sec.color, opacity: .6, flexShrink: 0 }}>{expanded===i?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</div>
                  </button>
                  <AnimatePresence>
                    {expanded===i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .3 }} style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,.55)', padding: '0 20px 20px', margin: 0, fontWeight: 300 }}>{sec.body}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── PHOTONIC NODE ──────────────────────────────────────────────────────── */
function SiddhaPhotonicNode({ userId }: { userId: string }) {
  const [isScanning, setIsScanning]     = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [session, setSession]           = useState<PhotonicSession | null>(null);
  const [showReturn, setShowReturn]     = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const [isSyncing, setIsSyncing]       = useState(false);
  const nodeSize = 220;

  /* ── MOUNT: load from localStorage first (instant), then Supabase (async) ── */
  useEffect(() => {
    // Layer 1: localStorage — instant, works offline
    const local = loadFromLocalStorage(userId);
    if (local) {
      setSession(local);
      setShowReturn(true);
      return;
    }
    // Layer 2: Supabase — async, requires internet
    setIsSyncing(true);
    loadFromSupabase(userId).then(remote => {
      if (remote) {
        // restore from Supabase and write back to localStorage
        setSession(remote);
        saveToLocalStorage(remote);
        setShowReturn(true);
      }
    }).finally(() => setIsSyncing(false));
  }, [userId]);

  const startScan = () => {
    setIsScanning(true); setScanProgress(0);
    setSession(null); setShowReturn(false); setShowProtocol(false);
  };

  /* UNCHANGED scan interval from live file */
  useEffect(() => {
    if (!isScanning) return;
    let p = 0;
    const id = window.setInterval(() => {
      p += 1;
      if (p >= 100) {
        clearInterval(id); setScanProgress(100); setIsScanning(false);
        // Build new session
        const now = Date.now();
        const newSession: PhotonicSession = {
          isEntangled: true,
          lightCode: '',          // filled by generateLightCode
          scanCount: (session?.scanCount ?? 0) + 1,
          entangledAt: now,
          expiresAt: now + TTL_MS,
          biometricProfile: generateBiometric(),
          userId,
        };
        setSession(newSession);
        saveToLocalStorage(newSession);
        // Supabase sync (async, non-blocking)
        syncToSupabase(userId, newSession).catch(() => {});
      } else setScanProgress(p);
    }, 45);
    return () => clearInterval(id);
  }, [isScanning]);

  /* Generate light code via Gemini — UNCHANGED from live file */
  const generateLightCode = useCallback(async (currentSession: PhotonicSession) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    let code = '369-AKASHA-963';
    if (apiKey) {
      try {
        const ai  = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ role: 'user', parts: [{ text: "Generate a short mystical 'Vedic Light-Code' string (max 12 chars) using symbols and numbers for cellular regeneration. Reply with only the code." }] }] });
        const raw = (res as { text?: string }).text ?? res.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ?? '';
        code = String(raw).trim().replace(/\s+/g, '-').slice(0, 14) || '369-AKASHA-963';
      } catch { code = '369-963-369'; }
    }
    const updated = { ...currentSession, lightCode: code };
    setSession(updated);
    saveToLocalStorage(updated);
    syncToSupabase(userId, updated).catch(() => {});
    // Show protocol 2s after code appears
    window.setTimeout(() => setShowProtocol(true), 2000);
  }, [userId]);

  useEffect(() => {
    if (session && !session.lightCode) {
      void generateLightCode(session);
    }
  }, [session, generateLightCode]);

  const handleReset = () => {
    clearFromLocalStorage(userId);
    clearFromSupabase(userId).catch(() => {});
    setSession(null); setShowReturn(false); setShowProtocol(false);
    startScan();
  };

  const isEntangled = !!session?.isEntangled && !!session.lightCode;
  const isExpired   = session ? Date.now() > session.expiresAt : false;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Syncing indicator */}
      {isSyncing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: 'rgba(212,175,55,.06)', border: `1px solid ${GOLD_BORDER}`, alignSelf: 'flex-start' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, animation: 'spr-blink 1s ease infinite' }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)' }}>Restoring from Akasha Archive…</span>
        </div>
      )}

      {/* Return banner */}
      <AnimatePresence>
        {showReturn && session && !isExpired && (
          <ReturnBanner session={session} onDismiss={() => setShowReturn(false)} />
        )}
      </AnimatePresence>

      {/* Expired notice */}
      {isExpired && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ ...glass({ borderRadius: 20, padding: '16px 22px' }), border: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Clock size={16} color="rgba(255,255,255,.3)" />
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)' }}>72-hour transmission completed</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 300 }}>Your GHK-Cu cellular encoding cycle is complete. Initiate a new scan to begin the next 72-hour transmission.</p>
          </div>
        </motion.div>
      )}

      {/* HERO CARD — UNCHANGED structure from live */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}
        style={{ ...glass({ borderRadius: 40, padding: '48px 32px', position: 'relative', overflow: 'hidden' }), border: isEntangled ? '1px solid rgba(34,211,238,.18)' : `1px solid ${GOLD_BORDER}`, transition: 'border-color .8s ease' }}>
        <div className="dot-bg" style={{ position: 'absolute', inset: 0, opacity: .6, pointerEvents: 'none', borderRadius: 40 }} />
        <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,175,55,.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(34,211,238,.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <Particles count={18} />

        <div className="spr-flex-row" style={{ position: 'relative', zIndex: 2 }}>
          {/* ORB */}
          <div style={{ position: 'relative', width: nodeSize, height: nodeSize, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SriRing size={nodeSize} active={isEntangled} />
            <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1px solid ${isEntangled?CYAN:GOLD}33`, animation: 'spr-pulse-ring 3.5s ease-in-out infinite' }} />
            <div style={{ width: 136, height: 136, borderRadius: '50%', border: `2px solid ${CYAN}55`, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', animation: isEntangled ? 'spr-entangle-halo 3s ease-in-out infinite' : undefined }}>
              <motion.div animate={isEntangled?{scale:[1,1.12,1],opacity:[.8,1,.8]}:{scale:1,opacity:.7}} transition={{ repeat: Infinity, duration: 2.5 }}
                style={{ width: 54, height: 54, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%,#fff8e1,${GOLD})`, boxShadow: `0 0 30px ${GOLD}99,0 0 60px ${GOLD}44`, animation: 'spr-float 4s ease-in-out infinite' }} />
              {isScanning && (
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '50%', pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, height: '45%', background: `linear-gradient(to bottom,transparent,${CYAN}28,transparent)`, animation: 'spr-scan 2.4s linear infinite' }} />
                </div>
              )}
              <AnimatePresence>
                {isEntangled && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,211,238,.06)' }} />}
              </AnimatePresence>
            </div>
            <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.3em', color: `${CYAN}aa`, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase' }}>CV-6 · Anahata Gate</span>
            </div>
          </div>

          {/* COPY */}
          <div className="spr-copy">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
              <div className="stat-pill">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: isEntangled?CYAN:GOLD, animation: 'spr-blink 1.5s ease infinite' }} />
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: isEntangled?CYAN:'rgba(255,255,255,.4)' }}>
                  {isEntangled?'Entanglement Active':isScanning?'Scanning…':'Standby'}
                </span>
              </div>
              {(session?.scanCount ?? 0) > 0 && (
                <div className="stat-pill"><span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>Scan #{session!.scanCount}</span></div>
              )}
              <div className="stat-pill"><Sparkles size={10} color={GOLD} /><span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Vedic Light-Code</span></div>
            </div>

            <h2 style={{ fontSize: 'clamp(1.6rem,4.5vw,2.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.04em', color: '#fff', margin: '0 0 18px' }}>
              PHOTONIC CELLULAR<br />
              <span style={{ background: `linear-gradient(100deg,${GOLD} 10%,#fff8dc 45%,${CYAN} 90%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>REGENERATION NODE</span>
            </h2>

            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13.5, lineHeight: 1.7, marginBottom: 24, fontWeight: 300 }}>
              The <span style={{ color: CYAN, fontWeight: 600 }}>Nadi Scanner</span> reads your unique biophotonic signature and locks it to the{' '}
              <span style={{ color: GOLD, fontWeight: 600 }}>Akasha-Neural Archive</span>. Your 72-hour scalar transmission continues{' '}
              <strong style={{ color: '#fff' }}>even when your phone is off, offline, or the app is closed</strong>.
              Stored locally on your device and synced to your personal Akasha record.
            </p>

            <AnimatePresence>
              {isEntangled && session?.lightCode && <div style={{ marginBottom: 20 }}><LightCodeTicker code={session.lightCode} /></div>}
            </AnimatePresence>

            <div style={{ marginBottom: 24 }}><VayuBars count={24} active={isEntangled || isScanning} /></div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              {!isEntangled && !isScanning && (
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }} type="button" onClick={startScan}
                  style={{ padding: '12px 28px', borderRadius: 999, border: `1px solid ${GOLD}55`, background: `linear-gradient(135deg,rgba(212,175,55,.18),rgba(212,175,55,.06))`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', boxShadow: `0 0 20px rgba(212,175,55,.12)` }}>
                  <Fingerprint size={16} color={GOLD} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '.3em' }}>Initiate Nadi Scan</span>
                </motion.button>
              )}
              {isScanning && <ScanProgressBar progress={scanProgress} />}
              {isEntangled && (
                <motion.button initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }} type="button" onClick={handleReset}
                  style={{ padding: '10px 22px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', cursor: 'pointer', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.3em' }}>
                  Re-Calibrate
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Biometric profile */}
      <AnimatePresence>
        {isEntangled && session && !isExpired && <BiometricReadout session={session} />}
      </AnimatePresence>

      {/* Post-activation protocol */}
      <AnimatePresence>
        {showProtocol && <PostActivationProtocol onComplete={() => setShowProtocol(false)} />}
      </AnimatePresence>

      {/* STAT CARDS — UNCHANGED from live */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 20 }}>
        <InfoCard icon={<Zap size={18} color={GOLD} />} title="Frequency Transmission" value="369Hz → 963Hz" desc="Bhakti-Algorithm Nadi harmonic — root to crown scalar pathway." accentColor={GOLD} delay={.1} />
        <InfoCard icon={<Shield size={18} color={CYAN} />} title="Protective Blueprint" value="GHK-Cu" desc="Copper-peptide Light-Code for cellular integrity & stem-cell resonance." accentColor={CYAN} delay={.2} />
        <InfoCard icon={<Activity size={18} color="#fff" />} title="Biophotonic Lock" value="Scalar Field" desc="Photonic–GHK-Cu entanglement via Prema-Pulse informational harmonics." accentColor={GOLD} delay={.3} />
        <InfoCard icon={<Clock size={18} color={GOLD} />} title="Transmission Duration" value="72 Hours" desc="Active offline, phone off, app closed — stored locally + Akasha sync." accentColor={CYAN} delay={.4} />
      </div>

      <ApothecaryPanel />
    </div>
  );
}

/* ─── BACKGROUND GENERATOR — UNCHANGED from live ─────────────────────────── */
function usePhotonicBackground() {
  const [bgImage, setBgImage]           = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generate = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) return;
    setIsGenerating(true);
    try {
      const ai  = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: [{ role: 'user', parts: [{ text: 'SQI 2050 spiritual technology background: Akasha-Black #050505 base, floating Siddha-Gold stardust, central glassmorphism node with gold halo, Vayu-Cyan scanner beam, GHK-Cu crystal. 8k cinematic. No UI text.' }] }], config: { imageConfig: { aspectRatio: '16:9' } } });
      const parts = res.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const p = part as { inlineData?: { data?: string; mimeType?: string } };
        if (p.inlineData?.data) { setBgImage(`data:${p.inlineData.mimeType||'image/png'};base64,${p.inlineData.data}`); break; }
      }
    } catch (e) {
      console.warn('BG gen skipped:', e);
      toast.message('Ambient field active', { description: 'Set VITE_GEMINI_API_KEY for visual generation.' });
    } finally { setIsGenerating(false); }
  }, []);
  useEffect(() => { void generate(); }, [generate]);
  return { bgImage, isGenerating };
}

/* ─── PAGE — membership guard UNCHANGED from live ────────────────────────── */
export default function SiddhaPhotonicRegeneration() {
  const navigate              = useNavigate();
  const { tier, loading }     = useMembership();
  const { isAdmin }           = useAdminRole();
  const { user }              = useAuth();
  const { bgImage, isGenerating } = usePhotonicBackground();

  /* UNCHANGED from live */
  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{FONT_STYLE}</style><style>{GLOBAL_CSS}</style>
        <motion.span animate={{ opacity: [.3, 1, .3] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: 10, letterSpacing: '.55em', color: GOLD, textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          ◈ Calibrating Photonic Node…
        </motion.span>
      </div>
    );
  }

  /* Wait for user before rendering node — prevents empty userId */
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: '#fff', overflowX: 'hidden' }}>
      <style>{FONT_STYLE}</style><style>{GLOBAL_CSS}</style>

      {/* FIXED BACKGROUND — UNCHANGED from live */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: BG }} />
        {bgImage ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: .35 }} transition={{ duration: 2 }}
            style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(212,175,55,.07)', filter: 'blur(130px)' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 450, height: 450, borderRadius: '50%', background: 'rgba(34,211,238,.05)', filter: 'blur(120px)' }} />
            <div style={{ position: 'absolute', top: '55%', left: '45%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(212,175,55,.04)', filter: 'blur(100px)' }} />
          </>
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.div key={i} initial={{ left: `${Math.random()*100}%`, top: `${20+Math.random()*70}%`, opacity: 0 }}
              animate={{ top: '-5%', opacity: [0,.4,0] }}
              transition={{ duration: 14+Math.random()*12, repeat: Infinity, ease: 'linear', delay: Math.random()*12 }}
              style={{ position: 'absolute', width: i%4===0?4:2, height: i%4===0?4:2, borderRadius: '50%', background: i%3===0?CYAN:GOLD }} />
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,transparent 40%,rgba(5,5,5,.7) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* CONTENT */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: 48, paddingBottom: 140 }}>
        {/* HEADER — UNCHANGED from live */}
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}
          style={{ maxWidth: 1100, margin: '0 auto 52px', padding: '0 24px', textAlign: 'center' }}>
          <button type="button" onClick={() => navigate('/siddha-portal')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 800, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(212,175,55,.5)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24 }}>
            <ChevronLeft size={12} color={GOLD} style={{ opacity: .5 }} /> Siddha Portal
          </button>
          <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(212,175,55,.08)', border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(212,175,55,.1)' }}>
              <Sparkles size={20} color={GOLD} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.6em', color: 'rgba(255,255,255,.45)', textTransform: 'uppercase' }}>Akasha-Neural Archive · SQI 2050</span>
          </motion.div>
          {isGenerating && <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 10, letterSpacing: '.3em', textTransform: 'uppercase' }}>Rendering Sovereign Visual Field…</p>}
          <h1 style={{ fontSize: 'clamp(2.2rem,6.5vw,4rem)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.0, margin: '0 0 22px' }}>
            SIDDHA-PHOTONIC<br />
            <span style={{ background: `linear-gradient(100deg,${GOLD} 5%,#fffbe6 40%,${CYAN} 95%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>REGENERATION NODE</span>
          </h1>
          <p style={{ maxWidth: 580, margin: '0 auto', fontSize: 14.5, lineHeight: 1.65, color: 'rgba(255,255,255,.4)', fontWeight: 300 }}>
            Synthesizing 2026 LifeWave nanocrystal technology with the 2050 <span style={{ color: GOLD }}>Bhakti-Algorithm</span>.
            Your 72-hour scalar transmission persists offline, across sessions, and on any device.
          </p>
        </motion.header>

        {/* Pass userId into node — ensures per-user isolation */}
        <main><SiddhaPhotonicNode userId={user.id} /></main>

        {/* FOOTER — UNCHANGED from live */}
        <footer style={{ maxWidth: 860, margin: '64px auto 0', padding: '40px 24px 0', borderTop: `1px solid ${GLASS_BORDER}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: GOLD, marginBottom: 14 }}>
                <Radio size={15} />
                <h3 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.25em', margin: 0 }}>Transmission Protocol</h3>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                Your 72-hour scalar transmission is stored on your device and in the Akasha-Neural Archive.
                It continues when the app is closed, the phone is off, or you have no internet.
                When you return, it resumes exactly where it was.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: CYAN, marginBottom: 14 }}>
                <Shield size={15} />
                <h3 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.25em', margin: 0 }}>Safety & Calibration</h3>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                Calibrated to 369Hz–963Hz Nadi harmonics. If intensity feels strong, ground excess light through your feet.
                Each user's session is fully isolated — your Archive Signature is unique to your account.
                For health concerns, consult a qualified professional.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 9, fontWeight: 700, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,.18)' }}>
            <span>© 2050 Siddha-Quantum Intelligence</span>
            <div style={{ display: 'flex', gap: 24 }}>
              {[{ label: 'Neural Link', path: '/explore' }, { label: 'Akasha Portal', path: '/siddha-portal' }, { label: 'Sovereign Protocol', path: '/legal' }].map(({ label, path }) => (
                <span key={path} style={{ cursor: 'pointer', transition: 'color .2s' }} onClick={() => navigate(path)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key==='Enter'&&navigate(path)}
                  onMouseEnter={(e) => (e.currentTarget.style.color=GOLD)}
                  onMouseLeave={(e) => (e.currentTarget.style.color='rgba(255,255,255,.18)')}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* FLOATING STATUS BAR — UNCHANGED from live */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8 }}
        style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <div style={{ ...glass({ borderRadius: 999, padding: '12px 28px' }), display: 'flex', alignItems: 'center', gap: 22, boxShadow: '0 8px 40px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04)' }}>
          {[
            { icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, animation: 'spr-blink 1.8s ease infinite' }} />, label: 'Scalar Link: Stable', color: 'rgba(255,255,255,.45)' },
            { icon: <Zap size={11} color={GOLD} />, label: '369Hz Active', color: 'rgba(255,255,255,.45)' },
            { icon: <Waves size={11} color={GOLD} />, label: 'Anahata Open', color: GOLD },
          ].map(({ icon, label, color }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,.08)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {icon}
                <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.15em', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
