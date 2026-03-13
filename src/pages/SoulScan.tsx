// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, Lock, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import DigitalNadiScanner from '@/components/soul-scan/DigitalNadiScanner';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { getTierRank } from '@/lib/tierAccess';
import type { ScanResults, SessionModality } from '@/types/soulScan';
import { SESSION_MODALITIES } from '@/types/soulScan';

/* ─── LocalStorage keys ─── */
const LS_PRE = 'soulscan_pre_results';
const LS_PRE_TS = 'soulscan_pre_timestamp';
const LS_PRACTICE = 'soulscan_chosen_practice';
const PRE_SCAN_TTL_MS = 60 * 60 * 1000; // 60 minutes

/* ─── Metric definitions ─── */
interface Metric {
  key: keyof ScanResults['technicalData'];
  label: string;
  unit: string;
  /** lower = better (e.g. stress) */
  invertDelta?: boolean;
  /** format value to string */
  format?: (v: number | string) => string;
}

const METRICS: Metric[] = [
  { key: 'activeNadis', label: 'Nadi Level', unit: '/ 72k', format: (v) => `${Number(v).toLocaleString()}` },
  { key: 'nadiFlow', label: 'Nadi Flow', unit: '%' },
  { key: 'doshaImbalance', label: 'Dosha Balance', unit: '', format: (v) => String(v) },
  { key: 'stressLevel', label: 'Stress Level', unit: '%', invertDelta: true },
  { key: 'nervousSystemLevel', label: 'Nervous System', unit: '', format: (v) => String(v) },
  { key: 'bloodLevel', label: 'Blood Vitality', unit: '%' },
  { key: 'mindLevel', label: 'Mind Level', unit: '%' },
  { key: 'dnaAlignment', label: 'DNA Alignment', unit: '%' },
  { key: 'pastLifeClarity', label: 'Past Life Clarity', unit: '%' },
  { key: 'jyotishAlignment', label: 'Jyotish Alignment', unit: '%' },
  { key: 'heartSync', label: 'Heart Sync', unit: '%' },
];

/* ─── Compute numeric value for bar width ─── */
function numericVal(key: string, val: unknown): number {
  if (typeof val === 'number') {
    if (key === 'activeNadis') return Math.round((val / 72000) * 100);
    return Math.min(100, Math.max(0, val));
  }
  return 0;
}

/* ─── Delta label ─── */
function deltaLabel(metric: Metric, pre: unknown, post: unknown): { text: string; positive: boolean } | null {
  if (typeof pre !== 'number' || typeof post !== 'number') return null;
  const preN = metric.key === 'activeNadis' ? Math.round((pre / 72000) * 100) : pre;
  const postN = metric.key === 'activeNadis' ? Math.round((post / 72000) * 100) : post;
  const diff = Math.round((postN - preN) * 10) / 10;
  if (diff === 0) return null;
  const positive = metric.invertDelta ? diff < 0 : diff > 0;
  return { text: `${diff > 0 ? '+' : ''}${diff}%`, positive };
}

/* ─── Sri Yantra SVG background ─── */
const SriYantraBg = () => (
  <svg
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 480, height: 480, opacity: 0.07, pointerEvents: 'none' }}
    aria-hidden="true"
  >
    <circle cx="200" cy="200" r="195" stroke="#D4AF37" strokeWidth="0.8" fill="none" />
    <circle cx="200" cy="200" r="175" stroke="#D4AF37" strokeWidth="0.5" fill="none" strokeDasharray="4 6" />
    <circle cx="200" cy="200" r="150" stroke="#D4AF37" strokeWidth="0.6" fill="none" />
    <polygon points="200,40 368,320 32,320" stroke="#D4AF37" strokeWidth="1.6" fill="none" />
    <polygon points="200,75 348,305 52,305" stroke="#D4AF37" strokeWidth="1.2" fill="none" />
    <polygon points="200,105 328,288 72,288" stroke="#D4AF37" strokeWidth="0.9" fill="none" />
    <polygon points="200,355 32,75 368,75" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
    <polygon points="200,320 52,92 348,92" stroke="#D4AF37" strokeWidth="1.1" fill="none" />
    <polygon points="200,288 72,108 328,108" stroke="#D4AF37" strokeWidth="0.8" fill="none" />
    <circle cx="200" cy="200" r="12" fill="#D4AF37" opacity="0.6" />
    <circle cx="200" cy="200" r="5" fill="#D4AF37" />
  </svg>
);

/* ─── Practice picker ─── */
const PRACTICE_CATEGORIES = Array.from(new Set(SESSION_MODALITIES.map((m) => m.category)));

/* ─── Main component ─── */
export default function SoulScan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useMembership();
  const userRank = getTierRank(tier);
  const canPostScan = userRank >= 2; // Siddha Quantum +

  // ── Flow phases ──
  // 'pre-idle'    → show scanner for initial scan
  // 'pre-done'    → show pre-scan results + practice picker
  // 'practicing'  → user is doing their practice
  // 'post-idle'   → show scanner for post-scan
  // 'post-done'   → show Before/After comparison report
  const [phase, setPhase] = useState<'pre-idle' | 'pre-done' | 'practicing' | 'post-idle' | 'post-done'>('pre-idle');
  const [preScan, setPreScan] = useState<ScanResults | null>(null);
  const [postScan, setPostScan] = useState<ScanResults | null>(null);
  const [chosenPractice, setChosenPractice] = useState<SessionModality | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(PRACTICE_CATEGORIES[0]);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const ts = Number(localStorage.getItem(LS_PRE_TS) || 0);
      const now = Date.now();
      if (ts && now - ts < PRE_SCAN_TTL_MS) {
        const stored = localStorage.getItem(LS_PRE);
        const practice = localStorage.getItem(LS_PRACTICE);
        if (stored) {
          const parsed = JSON.parse(stored) as ScanResults;
          setPreScan(parsed);
          if (practice) {
            const mod = SESSION_MODALITIES.find((m) => m.id === practice);
            if (mod) setChosenPractice(mod);
            setPhase('practicing');
          } else {
            setPhase('pre-done');
          }
        }
      }
    } catch {}
  }, []);

  const handlePreScanComplete = useCallback((results: ScanResults) => {
    setPreScan(results);
    try {
      localStorage.setItem(LS_PRE, JSON.stringify(results));
      localStorage.setItem(LS_PRE_TS, String(Date.now()));
    } catch {}
    setPhase('pre-done');
  }, []);

  const handleSelectPractice = (mod: SessionModality) => {
    setChosenPractice(mod);
    try { localStorage.setItem(LS_PRACTICE, mod.id); } catch {}
    setPhase('practicing');
  };

  const handlePracticeDone = () => setPhase('post-idle');

  const handlePostScanComplete = useCallback((results: ScanResults) => {
    setPostScan(results);
    setPhase('post-done');
    try {
      localStorage.removeItem(LS_PRE);
      localStorage.removeItem(LS_PRE_TS);
      localStorage.removeItem(LS_PRACTICE);
    } catch {}
  }, []);

  const handleReset = () => {
    setPreScan(null);
    setPostScan(null);
    setChosenPractice(null);
    try {
      localStorage.removeItem(LS_PRE);
      localStorage.removeItem(LS_PRE_TS);
      localStorage.removeItem(LS_PRACTICE);
    } catch {}
    setPhase('pre-idle');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;700;800;900&display=swap');
        .ss-wrap{min-height:100vh;background:#050505;color:white;font-family:'Montserrat',sans-serif;padding-bottom:120px;position:relative;overflow-x:hidden}
        .ss-topbar{display:flex;align-items:center;gap:16px;padding:20px 24px;position:sticky;top:0;z-index:10;background:rgba(5,5,5,0.88);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.04)}
        .ss-back-btn{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:border-color 0.2s}
        .ss-back-btn:hover{border-color:rgba(212,175,55,0.3)}
        .ss-topbar-label{font-weight:800;font-size:7px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.25)}
        .ss-topbar-tier{font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:#D4AF37;margin-left:auto}
        /* Glass card */
        .ss-glass{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:28px;backdrop-filter:blur(24px)}
        .ss-glass-gold{background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.18);border-radius:28px;backdrop-filter:blur(24px)}
        /* Hero */
        .ss-hero{text-align:center;padding:48px 24px 32px;max-width:640px;margin:0 auto}
        .ss-hero-eyebrow{font-weight:800;font-size:7px;letter-spacing:0.6em;text-transform:uppercase;color:rgba(212,175,55,0.5);margin-bottom:16px}
        .ss-hero-title{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(2.8rem,8vw,4.5rem);color:white;line-height:0.95;margin-bottom:16px}
        .ss-hero-title .gold{color:#D4AF37}
        .ss-hero-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1rem;color:rgba(255,255,255,0.35);line-height:1.8;max-width:420px;margin:0 auto}
        /* Section */
        .ss-section{max-width:680px;margin:0 auto;padding:0 20px 40px}
        .ss-section-label{font-weight:800;font-size:7px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.45);margin-bottom:20px;display:flex;align-items:center;gap:12px}
        .ss-section-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,0.15),transparent)}
        /* Metric bar */
        .ss-metric-row{display:flex;flex-direction:column;gap:6px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .ss-metric-row:last-child{border-bottom:none}
        .ss-metric-label{font-weight:800;font-size:8px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.4)}
        .ss-metric-value{font-weight:800;font-size:13px;color:#D4AF37}
        .ss-bar-bg{height:4px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;flex:1}
        .ss-bar-fill{height:100%;border-radius:4px;transition:width 1s ease}
        /* Practice card */
        .ss-practice-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-radius:20px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);cursor:pointer;transition:all 0.2s;margin-bottom:8px}
        .ss-practice-card:hover{border-color:rgba(212,175,55,0.3);background:rgba(212,175,55,0.03)}
        .ss-practice-card.active{border-color:rgba(212,175,55,0.45);background:rgba(212,175,55,0.06)}
        .ss-practice-name{font-weight:800;font-size:11px;color:rgba(255,255,255,0.8)}
        .ss-practice-desc{font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px;line-height:1.4}
        /* CTA button */
        .ss-cta{display:block;width:100%;background:#D4AF37;color:#050505;border:none;border-radius:100px;padding:16px 24px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;text-align:center;box-shadow:0 0 32px rgba(212,175,55,0.35)}
        .ss-cta:hover{opacity:0.88;transform:translateY(-2px)}
        .ss-cta:disabled{opacity:0.4;cursor:not-allowed;transform:none}
        .ss-cta-ghost{display:block;width:100%;background:transparent;color:rgba(212,175,55,0.6);border:1px solid rgba(212,175,55,0.2);border-radius:100px;padding:14px 24px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;text-align:center}
        .ss-cta-ghost:hover{border-color:rgba(212,175,55,0.4);color:#D4AF37}
        /* Delta badge */
        .ss-delta{font-weight:900;font-size:10px;padding:3px 8px;border-radius:100px;flex-shrink:0}
        .ss-delta.positive{background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)}
        .ss-delta.negative{background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.25)}
        /* Big shift indicator */
        .ss-shift-hero{text-align:center;padding:32px 24px;position:relative;overflow:hidden}
        .ss-shift-number{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(3.5rem,12vw,6rem);line-height:1;margin-bottom:8px}
        .ss-shift-label{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.6)}
        /* Lock overlay */
        .ss-lock{background:rgba(5,5,5,0.85);backdrop-filter:blur(12px);border:1px solid rgba(212,175,55,0.15);border-radius:24px;padding:32px;text-align:center}
        /* Category tabs */
        .ss-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;margin-bottom:20px}
        .ss-tabs::-webkit-scrollbar{display:none}
        .ss-tab{font-weight:800;font-size:7px;letter-spacing:0.35em;text-transform:uppercase;padding:8px 16px;border-radius:100px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.3);cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0}
        .ss-tab.active{border-color:rgba(212,175,55,0.4);background:rgba(212,175,55,0.08);color:#D4AF37}
        /* Practicing card */
        .ss-practicing-card{text-align:center;padding:40px 28px;position:relative;overflow:hidden}
        .ss-practicing-icon{width:80px;height:80px;border-radius:50%;border:1px solid rgba(212,175,55,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;position:relative}
        .ss-practicing-icon::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(212,175,55,0.1);animation:ssRingPulse 2.5s ease-in-out infinite}
        .ss-practicing-icon::after{content:'';position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(212,175,55,0.05);animation:ssRingPulse 2.5s ease-in-out infinite 0.6s}
        @keyframes ssRingPulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
        @keyframes ssFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .ss-fade-up{animation:ssFadeUp 0.5s ease both}
        /* Comparison bars */
        .ss-compare-row{padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .ss-compare-row:last-child{border-bottom:none}
        .ss-compare-bars{display:flex;flex-direction:column;gap:4px;margin-top:8px}
        .ss-bar-label{font-weight:800;font-size:7px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.25);width:28px;flex-shrink:0}
        .ss-bar-row{display:flex;align-items:center;gap:8px}
        /* Stardust */
        @keyframes ssStardust{from{background-position:0 0}to{background-position:1000px 1000px}}
      ` }} />

      <div className="ss-wrap">
        {/* Stardust background */}
        <div style={{ position: 'fixed', inset: 0, backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')", opacity: 0.18, pointerEvents: 'none', zIndex: 0, animation: 'ssStardust 180s linear infinite' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top bar */}
          <div className="ss-topbar">
            <button type="button" className="ss-back-btn" onClick={() => navigate('/profile')} aria-label="Back">
              <ArrowLeft size={14} color="rgba(255,255,255,0.5)" />
            </button>
            <span className="ss-topbar-label">
              {phase === 'pre-idle' && 'Initial Resonance Scan'}
              {phase === 'pre-done' && 'Select Your Practice'}
              {phase === 'practicing' && 'Practice in Progress'}
              {phase === 'post-idle' && 'Post-Practice Recalibration'}
              {phase === 'post-done' && 'Shift Detected — Field Report'}
            </span>
            <span className="ss-topbar-tier">
              {canPostScan ? '◈ Siddha Quantum' : '◈ Free Access'}
            </span>
          </div>

          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════
                PHASE: PRE-IDLE — Initial scan
            ══════════════════════════════════════ */}
            {phase === 'pre-idle' && (
              <motion.div key="pre-idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="ss-hero">
                  <div className="ss-hero-eyebrow">◈ Siddha 2050 · Quantum Bio-Scanner</div>
                  <h1 className="ss-hero-title">Initial<br /><span className="gold">Resonance</span><br />Scan</h1>
                  <p className="ss-hero-desc">
                    The 2050 Quantum Intelligence maps your 72,000 Nadis, reads your Dosha field, stress signature, nervous system state, blood vitality, mind coherence, DNA alignment, past-life clarity, Jyotish resonance, and Heart Sync — before your practice.
                  </p>
                </div>
                <div className="ss-section">
                  <DigitalNadiScanner
                    isHealerPresent={false}
                    onScanComplete={handlePreScanComplete}
                    modalityName="Initial Resonance"
                    label="INITIALIZE RESONANCE SCAN"
                  />
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════
                PHASE: PRE-DONE — Results + Practice picker
            ══════════════════════════════════════ */}
            {phase === 'pre-done' && preScan && (
              <motion.div key="pre-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="ss-hero" style={{ paddingBottom: 16 }}>
                  <div className="ss-hero-eyebrow">◈ Pre-Scan Complete</div>
                  <h1 className="ss-hero-title">Your<br /><span className="gold">Field</span><br />Reading</h1>
                </div>

                {/* Metrics grid */}
                <div className="ss-section">
                  <div className="ss-section-label">◈ 11 Bio-Field Metrics</div>
                  <div className="ss-glass" style={{ padding: '20px 24px', marginBottom: 24 }}>
                    {METRICS.map((metric) => {
                      const raw = preScan.technicalData[metric.key];
                      const numVal = numericVal(metric.key, raw);
                      const displayVal = metric.format ? metric.format(raw) : (typeof raw === 'number' ? `${raw}${metric.unit}` : String(raw));
                      return (
                        <div key={metric.key} className="ss-metric-row">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span className="ss-metric-label">{metric.label}</span>
                            <span className="ss-metric-value">{displayVal}</span>
                          </div>
                          {typeof raw === 'number' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="ss-bar-bg">
                                <motion.div
                                  className="ss-bar-fill"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${numVal}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  style={{
                                    background: metric.invertDelta
                                      ? `linear-gradient(90deg, rgba(239,68,68,0.7), rgba(239,68,68,0.4))`
                                      : `linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.5))`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Practice picker */}
                  <div className="ss-section-label">◈ Select Your Practice</div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.92rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 20 }}>
                    Choose what you will practice now. When you finish, the scanner will measure the shift in your field.
                  </p>

                  {/* Category tabs */}
                  <div className="ss-tabs">
                    {PRACTICE_CATEGORIES.map((cat) => (
                      <button key={cat} type="button" className={`ss-tab${activeCategory === cat ? ' active' : ''}`} onClick={() => setActiveCategory(cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Practice list */}
                  {SESSION_MODALITIES.filter((m) => m.category === activeCategory).map((mod) => (
                    <div
                      key={mod.id}
                      className={`ss-practice-card${chosenPractice?.id === mod.id ? ' active' : ''}`}
                      onClick={() => setChosenPractice(mod)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setChosenPractice(mod)}
                    >
                      <div>
                        <div className="ss-practice-name">{mod.name}</div>
                        <div className="ss-practice-desc">{mod.description}</div>
                      </div>
                      <ChevronRight size={14} color={chosenPractice?.id === mod.id ? '#D4AF37' : 'rgba(255,255,255,0.2)'} />
                    </div>
                  ))}

                  <div style={{ marginTop: 28 }}>
                    <button
                      type="button"
                      className="ss-cta"
                      disabled={!chosenPractice}
                      onClick={() => chosenPractice && handleSelectPractice(chosenPractice)}
                    >
                      ◈ Begin {chosenPractice ? `— ${chosenPractice.name}` : 'Practice'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════
                PHASE: PRACTICING
            ══════════════════════════════════════ */}
            {phase === 'practicing' && chosenPractice && (
              <motion.div key="practicing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="ss-section" style={{ paddingTop: 48 }}>
                  <div className="ss-glass-gold ss-practicing-card">
                    <div className="ss-practicing-icon">
                      <Sparkles size={28} color="#D4AF37" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: 12 }}>
                      ◈ Practice Active
                    </div>
                    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.8rem,5vw,2.8rem)', color: 'white', marginBottom: 8, lineHeight: 1.1 }}>
                      {chosenPractice.name}
                    </h2>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.92rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
                      {chosenPractice.description}
                    </p>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(212,175,55,0.45)', marginBottom: 32 }}>
                      Your pre-scan field is locked in memory for 60 minutes. When your practice is complete, return here to run the Post-Scan and see your shift.
                    </div>

                    {canPostScan ? (
                      <button type="button" className="ss-cta" onClick={handlePracticeDone}>
                        ◈ Practice Complete — Run Post-Scan
                      </button>
                    ) : (
                      <div className="ss-lock">
                        <Lock size={24} color="rgba(212,175,55,0.5)" style={{ margin: '0 auto 12px' }} />
                        <div style={{ fontWeight: 800, fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: 8 }}>
                          Post-Scan Locked
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20, lineHeight: 1.6 }}>
                          The Before/After comparison is available for Siddha Quantum members and above.
                        </p>
                        <button type="button" className="ss-cta" onClick={() => navigate('/siddha-quantum')}>
                          ◈ Upgrade to Siddha Quantum
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <button type="button" className="ss-cta-ghost" onClick={handleReset}>
                      ↩ Start Over
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════
                PHASE: POST-IDLE — Post-practice scan
            ══════════════════════════════════════ */}
            {phase === 'post-idle' && (
              <motion.div key="post-idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="ss-hero" style={{ paddingBottom: 16 }}>
                  <div className="ss-hero-eyebrow">◈ Post-Practice Recalibration</div>
                  <h1 className="ss-hero-title">Measure<br />the <span className="gold">Shift</span></h1>
                  <p className="ss-hero-desc">
                    The scanner will now read your field again and compare it to your pre-practice baseline. Place your hand in frame and initialize.
                  </p>
                </div>
                <div className="ss-section">
                  <DigitalNadiScanner
                    isHealerPresent={false}
                    onScanComplete={handlePostScanComplete}
                    modalityName={chosenPractice?.name || 'Post-Practice'}
                    label="SCAN AFTER PRACTICE"
                  />
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════
                PHASE: POST-DONE — Before/After report
            ══════════════════════════════════════ */}
            {phase === 'post-done' && preScan && postScan && (
              <motion.div key="post-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

                {/* Hero shift card — Sri Yantra background */}
                <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 0' }}>
                  <div className="ss-glass-gold ss-shift-hero" style={{ marginBottom: 24, position: 'relative' }}>
                    <SriYantraBg />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 7, letterSpacing: '0.6em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', marginBottom: 16 }}>
                        ◈ Shift Detected — Field Report
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: 'italic', fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                        Practice: {chosenPractice?.name}
                      </div>

                      {/* Big Heart Sync shift */}
                      {(() => {
                        const preH = preScan.technicalData.heartSync;
                        const postH = postScan.technicalData.heartSync;
                        const diff = Math.round((postH - preH) * 10) / 10;
                        const positive = diff >= 0;
                        return (
                          <div style={{ marginBottom: 8 }}>
                            <div className="ss-shift-number" style={{ color: positive ? '#D4AF37' : '#ef4444', textShadow: positive ? '0 0 40px rgba(212,175,55,0.6)' : '0 0 40px rgba(239,68,68,0.4)' }}>
                              {diff > 0 ? '+' : ''}{diff}%
                            </div>
                            <div className="ss-shift-label">Heart Sync Shift</div>
                          </div>
                        );
                      })()}

                      {/* Secondary shifts row */}
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
                        {[
                          { key: 'stressLevel', label: 'Stress', invert: true },
                          { key: 'mindLevel', label: 'Mind' },
                          { key: 'nadiFlow', label: 'Nadi Flow' },
                          { key: 'dnaAlignment', label: 'DNA' },
                        ].map(({ key, label, invert }) => {
                          const pre = preScan.technicalData[key];
                          const post = postScan.technicalData[key];
                          if (typeof pre !== 'number' || typeof post !== 'number') return null;
                          const diff = Math.round((post - pre) * 10) / 10;
                          const positive = invert ? diff <= 0 : diff >= 0;
                          return (
                            <div key={key} style={{ textAlign: 'center', minWidth: 80 }}>
                              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: 'italic', fontSize: '1.6rem', color: positive ? '#D4AF37' : '#ef4444', lineHeight: 1 }}>
                                {diff > 0 ? '+' : ''}{diff}%
                              </div>
                              <div style={{ fontWeight: 800, fontSize: 7, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                                {label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Before / After comparison bars */}
                  <div className="ss-section-label" style={{ marginBottom: 16 }}>◈ Before & After — All Metrics</div>
                  <div className="ss-glass" style={{ padding: '20px 24px', marginBottom: 24 }}>
                    {METRICS.map((metric) => {
                      const preRaw = preScan.technicalData[metric.key];
                      const postRaw = postScan.technicalData[metric.key];
                      const preNum = numericVal(metric.key, preRaw);
                      const postNum = numericVal(metric.key, postRaw);
                      const delta = deltaLabel(metric, preRaw, postRaw);
                      const displayPre = metric.format ? metric.format(preRaw) : (typeof preRaw === 'number' ? `${preRaw}${metric.unit}` : String(preRaw));
                      const displayPost = metric.format ? metric.format(postRaw) : (typeof postRaw === 'number' ? `${postRaw}${metric.unit}` : String(postRaw));

                      return (
                        <div key={metric.key} className="ss-compare-row">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span className="ss-metric-label">{metric.label}</span>
                            {delta && (
                              <span className={`ss-delta ${delta.positive ? 'positive' : 'negative'}`}>
                                {delta.text}
                              </span>
                            )}
                          </div>
                          {typeof preRaw === 'number' ? (
                            <div className="ss-compare-bars">
                              <div className="ss-bar-row">
                                <span className="ss-bar-label">PRE</span>
                                <div className="ss-bar-bg">
                                  <motion.div
                                    className="ss-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${preNum}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{ background: 'rgba(255,255,255,0.2)' }}
                                  />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: 9, color: 'rgba(255,255,255,0.35)', width: 52, textAlign: 'right', flexShrink: 0 }}>{displayPre}</span>
                              </div>
                              <div className="ss-bar-row">
                                <span className="ss-bar-label">POST</span>
                                <div className="ss-bar-bg">
                                  <motion.div
                                    className="ss-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${postNum}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                                    style={{
                                      background: metric.invertDelta
                                        ? (postNum < preNum ? 'linear-gradient(90deg,#22c55e,rgba(34,197,94,0.5))' : 'linear-gradient(90deg,#ef4444,rgba(239,68,68,0.5))')
                                        : (postNum >= preNum ? 'linear-gradient(90deg,#D4AF37,rgba(212,175,55,0.5))' : 'linear-gradient(90deg,rgba(212,175,55,0.4),rgba(212,175,55,0.2))'),
                                    }}
                                  />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: 9, color: '#D4AF37', width: 52, textAlign: 'right', flexShrink: 0 }}>{displayPost}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
                              <span style={{ color: 'rgba(255,255,255,0.3)' }}>Before: {displayPre}</span>
                              <span style={{ color: '#D4AF37' }}>After: {displayPost}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Chakra comparison */}
                  <div className="ss-section-label" style={{ marginBottom: 16 }}>◈ Chakra Field Shift</div>
                  <div className="ss-glass" style={{ padding: '20px 24px', marginBottom: 24 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {postScan.technicalData.chakras.map((chakra, i) => {
                        const preChakra = preScan.technicalData.chakras[i];
                        const improved = chakra.status !== preChakra?.status && (chakra.status === 'Aligned' || chakra.status === 'Opening');
                        return (
                          <div key={i} style={{ padding: '6px 12px', borderRadius: 100, background: improved ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${improved ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`, fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: improved ? '#D4AF37' : 'rgba(255,255,255,0.15)' }} />
                            <span style={{ color: improved ? '#D4AF37' : 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                              {chakra.name}: {chakra.status}
                            </span>
                            {improved && <span style={{ fontSize: 8, color: 'rgba(212,175,55,0.6)' }}>↑</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Karmic signature */}
                  <div className="ss-glass-gold" style={{ padding: '20px 24px', marginBottom: 24 }}>
                    <div style={{ fontWeight: 800, fontSize: 7, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', marginBottom: 8 }}>◈ Karmic Field After Practice</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                      {postScan.technicalData.presentKarma}
                    </div>
                    {postScan.technicalData.karmicNodesExtracted != null && (
                      <div style={{ marginTop: 12, fontWeight: 800, fontSize: 11, color: '#D4AF37' }}>
                        {postScan.technicalData.karmicNodesExtracted} Karmic Nodes Extracted
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
                    <button type="button" className="ss-cta" onClick={handleReset}>
                      ◈ New Resonance Scan
                    </button>
                    <button type="button" className="ss-cta-ghost" onClick={() => navigate('/profile')}>
                      ↩ Return to Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
