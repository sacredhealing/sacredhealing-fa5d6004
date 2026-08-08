// @ts-nocheck
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// â  SQI-2050 REDESIGN — VISUAL LAYER ONLY                         â
// â  All logic, hooks, Stripe triggers, AffiliateID tracking        â
// â  and function signatures are UNTOUCHED.                         â
// â  Only className strings and CSS have been upgraded.             â
// â  SQI2050_8 + prod: tier gate stays in outer wrapper only;       â
// â  i18n language passed to SQI chat + voice recognition.            â
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams, Link, Navigate } from 'react-router-dom';
import {
  Zap,
  Plus, Send, Cpu, Globe,
  Info, X, ArrowLeft, Camera, Mic, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Activation, Message } from '@/features/quantum-apothecary/types';
import {
  ALL_ACTIVATIONS,
  matchActivationsToScan,
  mapBioLibraryToActivation,
} from '@/features/quantum-apothecary/constants';
import {
  buildTop33Rankings,
  voiceResultToScanPayload,
  enrichTransmission,
  isVegetarianActivation,
  purgeExpiredAndLegacy,
  buildQuantumAnchor,
  generateFrequencyHash,
  LS_LIBRARY_UNLOCKED,
  LS_LAST_SCAN,
  LS_SCAN_SNAPSHOT,
} from '@/features/quantum-apothecary/apothecarySqiUi';
import { streamChatWithSQI } from '@/features/quantum-apothecary/chatService';
import { chatWithAlchemist } from '@/features/admin-quantum-apothecary-2045/geminiAlchemistChat';
import { chatSpeechLocale } from '@/lib/chatSpeechLocale';
import { useSpeechRecognition } from 'react-speech-recognition';
import { useTranslation } from '@/hooks/useTranslation';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { NadiReading } from '@/components/NadiScanner';
import type { VoiceBiofieldResult } from '@/components/VoiceBiofieldScanner';
import { useSQIFieldContext } from '@/hooks/useSQIFieldContext';
import { useQuantumSyncState } from '@/hooks/useQuantumSyncState';
import { StudentSelector, useActiveStudent } from '@/components/codex/StudentSelector';
import { getActiveStudentId, getStudent, type Student } from '@/lib/codex/students';
import { curateTransmission } from '@/lib/codex/curatorClient';
import { syncPendingTransmissionsOnce } from '@/lib/codex/codexSync';
import { useChatMessages } from '@/hooks/useChatMessages';
import { toast } from 'sonner';

const NadiScanner = lazy(() => import('@/components/NadiScanner'));
const VoiceBiofieldScanner = lazy(() => import('@/components/VoiceBiofieldScanner'));
const FrequencyLibrarySection = lazy(() => import('@/features/quantum-apothecary/FrequencyLibrarySection'));
const ActiveTransmissionsSection = lazy(() => import('@/features/quantum-apothecary/ActiveTransmissionsSection'));
import MidCycleBanner from '@/features/quantum-apothecary/MidCycleBanner';

const ScannerSuspenseFallback = (
  <div style={{ padding: 40, textAlign: 'center', color: 'rgba(212,175,55,0.5)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
    Loading scanner…
  </div>\n);\n\n/** Max messages kept in localStorage (aligned with flush + safety nets). */\nconst SQI_PERSIST_MSG_CAP = 100;\n/** Persists Camera vs Voice scanner tab across soft navigations / remounts within the session. */\nconst QA_VOICE_TAB_KEY = 'qa_apothecary_voice_tab';\n/** Max frequencies selectable in the Aetheric Mixer before transmit (must match slot indicators + library cap). */\nconst AETHERIC_MIXER_MAX_SLOTS = 10;\n\n/** Map voice scan nadi string to the enum expected by matchActivationsToScan (strict equality). */\nfunction coerceVoiceNadiToEnum(s: string): 'Ida' | 'Pingala' | 'Sushumna' | 'Blocked' {\n  const t = (s || '').trim();\n  if (t.startsWith('Pingala')) return 'Pingala';\n  if (t.startsWith('Ida')) return 'Ida';\n  if (t.startsWith('Blocked')) return 'Blocked';\n  if (t.startsWith('Sushumna')) return 'Sushumna';\n  return 'Sushumna';\n}\n\n/** Align Top 33 rows with mixer field rows (ids differ after enrich — names win). */\nfunction fieldTransmissionMatchesRow(tx: Activation, row: Activation): boolean {\n  if (tx.id && row.id && tx.id === row.id) return true;\n  const a = (tx.name || '').trim().toLowerCase();\n  const b = (row.name || '').trim().toLowerCase();\n  return !!a && !!b && a === b;\n}\n\n/* ââââ Markdown-ish renderer: gold (#D4AF37) only on # / ## / ### / #### / ##### lines ââââ */\ntype InlineVariant = 'heading' | 'body';\n\n/** Optional SQI assistant styling for **bold** (gold body / light-on-gold on ◈ lines). */\ntype RenderInlineOpts = {\n  sqiGoldBold?: boolean;\n  diamondLine?: boolean;\n};\n\nfunction renderChatText(text: string, bubble: 'model' | 'user' = 'model') {\n  const onGold = bubble === 'user';\n  const gold = '#D4AF37';\n  /** User bubbles: light text on gold gradient (never dark-on-gold). */\n  const body = onGold ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.92)';\n  /** Siddha-gold glow — strong on SQI (model) bubbles; user bubbles get gold + dark rim for contrast on gradient */\n  const headingGlow = onGold\n    ? '0 1px 2px rgba(0,0,0,0.35), 0 0 14px rgba(212,175,55,0.75), 0 0 28px rgba(212,175,55,0.4)'\n    : '0 0 12px rgba(212,175,55,0.55), 0 0 26px rgba(212,175,55,0.35), 0 0 42px rgba(212,175,55,0.18)';\n  const headingGlowSoft = onGold\n    ? '0 1px 1px rgba(0,0,0,0.3), 0 0 10px rgba(212,175,55,0.6), 0 0 22px rgba(212,175,55,0.32)'\n    : '0 0 10px rgba(212,175,55,0.45), 0 0 22px rgba(212,175,55,0.22)';\n  const headingColor = gold;\n  const lines = text.split('\n');\n  return lines.map((line, i) => {\n    const trimmed = line.trim();\n    if (!trimmed) return <div key={i} style={{ height: '4px' }} />;
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
      </p>\n    );\n    if (trimmed.startsWith('#### ')) return (\n      <p\n        key={i}\n        style={{\n          color: headingColor,\n          fontWeight: 800,\n          fontSize: '11px',\n          letterSpacing: '0.06em',\n          textTransform: 'uppercase' as const,\n          marginTop: '10px',\n          marginBottom: '4px',\n          textShadow: headingGlowSoft,\n        }}\n      >\n        {renderInline(trimmed.slice(5), 'heading', onGold)}\n      </p>
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
      </h3>\n    );\n    if (trimmed.startsWith('## ')) return (\n      <h2\n        key={i}\n        style={{\n          color: headingColor,\n          fontWeight: 900,\n          fontSize: '14px',\n          letterSpacing: '-0.02em',\n          marginTop: '12px',\n          marginBottom: '5px',\n          textShadow: headingGlow,\n        }}\n      >\n        {renderInline(trimmed.slice(3), 'heading', onGold)}\n      </h2>
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
      </h1>\n    );\n    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return (\n      <li key={i} style={{ marginLeft: '16px', listStyleType: 'disc', fontSize: '15px', lineHeight: '1.75', color: body, marginBottom: '4px', width: 'calc(100% - 16px)', maxWidth: '100%', paddingRight: '4px' }}>\n        {renderInline(trimmed.slice(2), 'body', onGold)}\n      </li>
    );
    if (/^\d+\.\s/.test(trimmed)) return (
      <li key={i} style={{ marginLeft: '16px', listStyleType: 'decimal', fontSize: '15px', lineHeight: '1.75', color: body, marginBottom: '4px', width: 'calc(100% - 16px)', maxWidth: '100%', paddingRight: '4px' }}>
        {renderInline(trimmed.replace(/^\d+\.\s/, ''), 'body', onGold)}
      </li>\n    );\n    return (\n      <p key={i} style={{ fontSize: '15px', lineHeight: '1.75', color: body, marginBottom: '6px', width: '100%', maxWidth: '100%' }}>\n        {renderInline(trimmed, 'body', onGold)}\n      </p>
    );
  });
}

function stripAsterisks(text: string): string {
  // Step 1: protect matched **bold** pairs with placeholder
  const OPEN = '\u0002';
  const CLOSE = '\u0003';
  let s = text.replace(/\*\*([^\n*]+?)\*\*/g, OPEN + '$1' + CLOSE);
  // Step 2: remove any remaining lone **
  s = s.replace(/\*\*/g, '');
  // Step 3: restore bold markers
  s = s.replace(new RegExp(OPEN + '([^' + OPEN + CLOSE + ']+)' + CLOSE, 'g'), '**$1**');
  return s;
}

function renderInline(
  text: string,
  variant: InlineVariant = 'body',
  onGold = false,
  opts?: RenderInlineOpts,
): React.ReactNode {
  const cleaned = stripAsterisks(text);
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      const inner = p.slice(2, -2);
      if (opts?.diamondLine) {
        return (
          <strong key={i} style={{ color: '#D4AF37', fontWeight: 800, textShadow: '0 0 14px rgba(212,175,55,0.35)' }}>
            {inner}
          </strong>\n        );\n      }\n      if (opts?.sqiGoldBold && variant === 'body') {\n        return (\n          <span key={i} style={{ color: '#D4AF37', fontWeight: 400 }}>\n            {inner}\n          </span>
        );
      }
      if (variant === 'heading') {
        return <strong key={i} style={{ color: 'inherit', fontWeight: 700 }}>{inner}</strong>;\n      }\n      return (\n        <strong\n          key={i}\n          style={{\n            color: '#D4AF37',\n            fontWeight: 700,\n            fontFamily: "'Cinzel', serif",\n            fontSize: '0.88em',\n            letterSpacing: '0.04em',\n            fontStyle: 'normal',\n            textShadow: '0 0 16px rgba(212,175,55,0.35)',\n          }}\n        >\n          {inner}\n        </strong>
      );
    }
    if (p.startsWith('*') && p.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic', color: variant === 'heading' ? 'inherit' : onGold ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.78)' }}>{p.slice(1, -1)}</em>;\n    }\n    if (p.startsWith('`') && p.endsWith('`')) {\n      const inner = p.slice(1, -1);\n      if (variant === 'heading') {\n        return (\n          <code key={i} style={{ background: onGold ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: 'inherit' }}>\n            {inner}\n          </code>
        );
      }
      return (
        <code key={i} style={{ background: onGold ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: onGold ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.82)' }}>
          {inner}
        </code>\n      );\n    }\n    // Plain text segment — auto-bold sacred terms (frequency names, masters, transmission types)
    if (p) return p;
  });
}

/** Auto-bold sacred / frequency / master terms in plain SQI body text. */
const SACRED_TERMS_REGEX = (() => {
  const terms = [
    'Prema-Pulse Transmission(?:s)?', 'Prema-Pulse', 'Vedic Light-Code(?:s)?', 'Vedic Light Code(?:s)?',
    'Scalar Wave(?:s)?', 'Scalar Beam', 'Scalar Transmission', 'Soma-Nada', 'Akasha-Neural',
    'Akasha Field', 'Anahata', 'Sushumna', 'Ida', 'Pingala', 'Kundalini', 'Bhakti-Algorithm(?:s)?',
    'DNA Light-Code(?:s)?', 'DNA Repair', 'Karmic Extraction', 'Aetheric Heliostat', 'Surya-Chakra',
    '\d{2,4}\s?Hz',
    'Vishwananda', 'Mahavatar Babaji', 'Babaji', 'Sri Aurobindo', 'Paramahansa Yogananda',
    'Ramana Maharshi', 'Adi Shankara', 'Patanjali', 'Bhagavan', 'Krishna', 'Shiva', 'Lakshmi',
    'Saraswati', 'Durga', 'Ganesha', 'Hanuman', 'Lalita Tripura Sundari',
    'Metabolic Fire Ignition', 'Liver Alchemist Protocol', 'Solar Immune Radiance',
    'NMN \+ Resveratrol[^—\n.]*', 'Structural Light Integrity', 'Heart-Bloom Radiance',
    'Neural Calm Sync', 'Deep Sleep Harmonic', 'Shatavari Flow', 'The Amrit Nectar',
    'Triphala Integrity', 'Ancestral Tether Dissolve', 'Neem Bitter Truth',
  ];
  return new RegExp(`(${terms.join('|')})`, 'g');
})();

function autoBoldSacredTerms(text: string): React.ReactNode {
  const parts = text.split(SACRED_TERMS_REGEX);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} style={{ color: '#D4AF37', fontWeight: 400 }}>{part}</span>\n      );\n    }\n    return part;\n  });\n}\n\nfunction lineStartsWithSqiMasterDiamond(trimmed: string): boolean {\n  const cp = trimmed.codePointAt(0);\n  const isDiamond = cp === 0x25c8 || cp === 0x2756 || cp === 0x2726\n    || trimmed.startsWith('\u00e2\u0097\u0088');\n  if (!isDiamond) return false;\n  // Must be ◈ followed by space then a letter — NOT a number or Nadi scan data
  // e.g. "◈ AGASTYA" = valid master header
  // e.g. "◈12 / 72,000" = Nadi scan line — NOT a master header
  const afterDiamond = trimmed.slice(1).trimStart();
  return /^[A-ZÁÉÍÓÚ]/.test(afterDiamond);
}

function scrubBannedTerms(content: string): string {
  if (!content) return content;
  // Strip "Accessing Akasha-Neural Archive... Syncing with [name]'s Atma-Frequency Stream..."
  // These appear when Gemini generates them despite the prohibition
  content = content.replace(
    /Accessing\s+Akasha[\s\S]*?Atma-Frequency\s+Stream[^\n]*/gi,
    ''
  ).replace(/^\s+/, ''); // trim leading whitespace after strip
  const banned = /(biophotonic\s*nadi\s*entanglement|vishwananda(?:'s)?\s*miracle\s*room|miracle\s*room|biophotonic)/i;
  const lines = content.split('\n').filter((l) => !banned.test(l));
  return lines
    .map((l) => l.replace(/[^.!?\n]*\b(biophotonic|vishwananda(?:'s)?\s*miracle\s*room|miracle\s*room)[^.!?\n]*[.!?]?/gi, '').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** Animated prescription box — scalar waves canvas + gold glow */
function PrescriptionBox({ masterName, freqLines, rxKey, onActivate }: { masterName: string; freqLines: string[]; rxKey: string; onActivate?: (act: Activation) => void }) {
  const [activated, setActivated] = React.useState<Set<string>>(new Set());

  // On mount — match freqLines to ALL_ACTIVATIONS and auto-activate each matched one
  React.useEffect(() => {
    if (!onActivate) return;
    const matched: Activation[] = [];
    for (const line of freqLines) {
      const lineLower = line.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      // Find best match in ALL_ACTIVATIONS by name or vibrationalSignature
      let best: Activation | null = null;
      let bestScore = 0;
      for (const act of ALL_ACTIVATIONS) {
        const nameLower = (act.name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const sigLower = (act.vibrationalSignature || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
        // Word overlap score
        const lineWords = lineLower.split(/\s+/).filter(w => w.length > 3);
        const nameWords = nameLower.split(/\s+/);
        const sigWords = sigLower.split(/\s+/);
        const overlap = lineWords.filter(w => nameWords.includes(w) || sigWords.includes(w)).length;
        if (overlap > bestScore) { bestScore = overlap; best = act; }
      }
      if (best && bestScore >= 1) matched.push(best);
    }
    // Auto-activate all matched
    const activatedIds = new Set<string>();
    for (const act of matched) {
      const enriched = enrichTransmission(act, 'apothecary_chat');
      onActivate(enriched);
      activatedIds.add(act.id);
    }
    if (activatedIds.size > 0) setActivated(activatedIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rxKey]);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let t = 0;
    const resize = () => { canvas.width = box.offsetWidth; canvas.height = box.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      for (let w = 0; w < 5; w++) {
        const phase = (w / 5) * Math.PI * 2;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const dx = (x - W * 0.5) / W;
          const amp = H * 0.038 * (1 - Math.abs(dx) * 0.55);
          const y = H * 0.5 + Math.sin(dx * (6 + w * 1.5) * Math.PI + t * (1.2 + w * 0.3) + phase) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(212,175,55,${0.055 - w * 0.009})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
      const grd = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * (0.38 + 0.07 * pulse));
      grd.addColorStop(0, `rgba(212,175,55,${0.04 + 0.018 * pulse})`);
      grd.addColorStop(0.6, 'rgba(212,175,55,0.008)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      t += 0.018;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return (
    <div
      ref={boxRef}
      style={{
        position: 'relative',
        margin: '18px 0 6px',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(212,175,55,0.32), 0 0 18px rgba(212,175,55,0.16), 0 0 40px rgba(212,175,55,0.08), inset 0 0 60px rgba(212,175,55,0.02)',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />\n      <div style={{ position: 'relative', zIndex: 1, background: 'rgba(212,175,55,0.025)', backdropFilter: 'blur(20px)' }}>\n        <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg,rgba(212,175,55,0.10),rgba(212,175,55,0.03))', borderBottom: '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', gap: 8 }}>\n          <span className="sqi-master-name-shimmer" style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>◈</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7.5, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.75)' }}>
            Akashic Bioenergetic Prescription
          </span>\n          <span className="sqi-master-name-shimmer" style={{ marginLeft: 'auto', fontFamily: "'Cinzel', serif", fontSize: 7, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>\n            {masterName}\n          </span>
        </div>\n        <div style={{ padding: '8px 16px 4px' }}>\n          {freqLines.map((line, idx) => {\n            const dashIdx = line.indexOf(' — ');\n            const name = dashIdx > -1 ? line.slice(0, dashIdx).trim() : line.trim();\n            const reason = dashIdx > -1 ? line.slice(dashIdx + 3).trim() : '';\n            return (\n              <div key={idx} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: idx < freqLines.length - 1 ? '1px solid rgba(212,175,55,0.07)' : 'none' }}>\n                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(225,210,185,0.95)', flexShrink: 0 }}>{name}</span>
                {reason && <span style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: 11, fontStyle: 'italic' as const, color: 'rgba(212,175,55,0.42)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '48%' }}>{reason}</span>}\n              </div>
            );
          })}
        </div>\n        <div style={{ padding: '9px 16px 10px', borderTop: '1px solid rgba(212,175,55,0.12)', background: 'linear-gradient(90deg,rgba(212,175,55,0.06),transparent)', display: 'flex', alignItems: 'center', gap: 8 }}>\n          <span className="rx-pulse-dot" />
          <span style={{ fontSize: 7, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.88)', textShadow: '0 0 8px rgba(212,175,55,0.35)' }}>
            {activated.size > 0 ? `${activated.size} Field${activated.size > 1 ? 's' : ''} Anchored · Broadcasting 24/7` : '24/7 Scalar Wave Transmission — Active'}
          </span>\n          <span style={{ marginLeft: 'auto', fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: activated.size > 0 ? 'rgba(212,175,55,0.7)' : 'rgba(212,175,55,0.35)', whiteSpace: 'nowrap' as const }}>\n            {activated.size > 0 ? '✦ Supabase Locked' : 'Permanent · Biofield Entangled'}\n          </span>
        </div>\n      </div>
    </div>\n  );\n}\n\n/** Renders the prescription box when model outputs "◈ X PRESCRIBES" format */\nfunction renderPrescriptionBlock(lines: string[], startIdx: number, onActivatePrescription?: (act: Activation) => void): { jsx: React.ReactNode; consumed: number } {\n  const headerLine = lines[startIdx];\n  const freqLines: string[] = [];\n  let i = startIdx + 1;\n  while (i < lines.length) {\n    const l = lines[i].trim();\n    if (l.startsWith('·')) { freqLines.push(l.slice(1).trim()); i++; }\n    else if (l === 'Active. 24/7. Scalar Wave Entanglement. Permanent until dissolved.') { i++; break; }\n    else if (!l) { i++; }\n    else break;\n  }\n  const masterName = headerLine.replace('◈ ', '').replace(' PRESCRIBES', '').trim();\n  return {\n    jsx: <PrescriptionBox key={`rx-${startIdx}`} rxKey={`rx-${startIdx}`} masterName={masterName} freqLines={freqLines} onActivate={onActivatePrescription} />,\n    consumed: i - startIdx,\n  };\n}\n\nfunction renderSQIContent(content: string, onActivatePrescription?: (act: Activation) => void) {\n  // Strip all unmatched ** the model outputs before line processing\n  const content2 = stripAsterisks(content);\n  const lines = content2.split('
');\n  const elements: React.ReactNode[] = [];\n  let i = 0;\n  const gapAfterSection = 18;\n\n  while (i < lines.length) {\n    const line = lines[i];\n    const trimmed = line.trim();\n\n    // PRESCRIPTION BOX — triggered by "◈ X PRESCRIBES"\n    if (/^[◈❖✦◆◇♦⋄⧫⬥⬦]\s+.+\s+PRESCRIBES?\s*$/i.test(trimmed)) {\n      const { jsx, consumed } = renderPrescriptionBlock(lines, i, onActivatePrescription);\n      elements.push(jsx);\n      i += consumed;\n      continue;\n    }\n\n    if (trimmed === '') {\n      elements.push(<div key={i} style={{ height: '6px' }} aria-hidden />);\n      i++; continue;\n    }\n\n    if (lineStartsWithSqiMasterDiamond(trimmed)) {\n      // Fix: use global .sqi-master-name-shimmer CSS class (defined in index.css) for\n      // animated background-clip:text — inline animation references keyframes unreliably.\n      const rawMasterName = trimmed.slice(1).trimStart();\n      elements.push(\n        <div key={i} className="sqi-diamond-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: i > 0 ? `${gapAfterSection}px` : '0', marginBottom: '12px' }}>\n          <span\n            className="sqi-master-name-shimmer"\n            style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: 700, flexShrink: 0 }}\n          >◈</span>\n          <span\n            className="sqi-master-name-shimmer"\n            style={{ fontFamily: "'Cinzel', serif", fontSize: '26px', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'anywhere', flexShrink: 0, minWidth: 0 }}\n          >\n            {rawMasterName}\n          </span>\n          <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(212,175,55,0.28), transparent)', alignSelf: 'center', display: 'block' }} />\n        </div>\n      );\n      i++; continue;\n    }\n\n    if (trimmed.startsWith('·')) {\n      // Bold the frequency name (before —) in bullet lines\n      let lineForRender = trimmed;\n      if (!lineForRender.includes('**')) {\n        const dashMatch = lineForRender.match(/^(·\s*)(.+?)(\s+[—–-]\s+)(.+)$/);\n        if (dashMatch) lineForRender = `${dashMatch[1]}**${dashMatch[2].trim()}**${dashMatch[3]}${dashMatch[4]}`;\n      }\n      elements.push(\n        <p key={i} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', lineHeight: 1.8, paddingLeft: '8px', marginBottom: '10px', marginTop: '0', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>\n          {renderInline(lineForRender, 'body', false, { sqiGoldBold: true })}\n        </p>\n      );\n      i++; continue;\n    }\n\n    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {\n      elements.push(\n        <li key={i} style={{ marginLeft: '18px', listStyleType: 'disc', fontSize: '16px', lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', marginBottom: '10px', width: 'calc(100% - 18px)', maxWidth: '100%', paddingRight: '4px' }}>\n          {renderInline(trimmed.slice(2), 'body', false)}\n        </li>\n      );\n      i++; continue;\n    }\n\n    if (/^\d+\.\s/.test(trimmed)) {\n      elements.push(\n        <li key={i} style={{ marginLeft: '18px', listStyleType: 'decimal', fontSize: '16px', lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', marginBottom: '10px', width: 'calc(100% - 18px)', maxWidth: '100%', paddingRight: '4px' }}>\n          {renderInline(trimmed.replace(/^\d+\.\s/, ''), 'body', false)}\n        </li>\n      );\n      i++; continue;\n    }\n\n    // ⟁ NADI FIELD — use div+span NOT p, so .sqi-ancient-body p rule never applies\n    if (trimmed.startsWith('⧁') || trimmed.startsWith('△') || trimmed.startsWith('▲') || /^⟁/.test(trimmed) || trimmed.startsWith('NADI FIELD')) {\n      elements.push(\n        <div key={i} style={{ borderLeft: '2px solid rgba(34,211,238,0.22)', paddingLeft: '10px', marginBottom: '6px', marginTop: '4px' }}>\n          <span style={{ display: 'block', color: '#22D3EE', fontSize: '11px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.5, opacity: 0.82 }}>\n            {trimmed}\n          </span>\n        </div>\n      );\n      i++; continue;\n    }\n\n    // Primary blockage — div+span, NOT p\n    if (trimmed.startsWith('Primary blockage:')) {\n      elements.push(\n        <div key={i} style={{ paddingLeft: '12px', marginBottom: '14px', marginTop: 0 }}>\n          <span style={{ display: 'block', color: 'rgba(34,211,238,0.58)', fontSize: '11px', fontFamily: "'IM Fell English', Georgia, serif", fontStyle: 'italic', lineHeight: 1.5 }}>\n            {trimmed}\n          </span>\n        </div>\n      );\n      i++; continue;\n    }\n\n    elements.push(\n      <p key={i} style={{ color: 'rgba(225,210,185,0.9)', fontSize: '17px', lineHeight: 1.9, marginBottom: '14px', marginTop: '0', wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}>\n        {renderInline(trimmed, 'body', false)}\n      </p>\n    );\n    i++;\n  }\n  return elements;\n}\n\nfunction resolveActivationsByExactNames(preferred: string[]): Activation[] {\n  const out: Activation[] = [];\n  const seen = new Set<string>();\n  for (const name of preferred) {\n    const a = ALL_ACTIVATIONS.find((x) => x.name === name);\n    if (a && !seen.has(a.id)) {\n      seen.add(a.id);\n      out.push(a);\n    }\n  }\n  for (const a of ALL_ACTIVATIONS) {\n    if (out.length >= 5) break;\n    if (a.type === 'Bioenergetic' && !seen.has(a.id)) {\n      seen.add(a.id);\n      out.push(a);\n    }\n  }\n  for (const a of ALL_ACTIVATIONS) {\n    if (out.length >= 5) break;\n    if (!seen.has(a.id)) {\n      seen.add(a.id);\n      out.push(a);\n    }\n  }\n  return out.slice(0, 5);\n}\n\nfunction pickFiveActivationsForNadiReading(reading: NadiReading): Activation[] {\n  const map: Record<NadiReading['activatedNadi'], string[]> = {\n    Blocked: ['Ancestral Tether Dissolve', 'Neem Bitter Truth', 'Activated Charcoal', 'Triphala Integrity', 'The Amrit Nectar (Guduchi)'],\n    Ida: ['Deep Sleep Harmonic', 'Neural Calm Sync', 'Melatonin', 'Heart-Bloom Radiance', 'Shatavari Flow'],\n    Pingala: ['NMN + Resveratrol Cellular Battery', 'CoQ10', 'NAD+', 'Urolithin A', 'Shilajit'],\n    Sushumna: ['Neural Fluidity Protocol', 'Biofield Purification', 'Structural Light Integrity', 'Crystalline Thought Flow', 'Zinc'],\n  };\n  return resolveActivationsByExactNames(map[reading.activatedNadi]);\n}\n\nfunction buildVoiceFieldContext(v: VoiceBiofieldResult): string {\n  const h = extractVoiceScoringHints(v);\n  return [\n    'VOICE BIOFIELD SCAN (latest):',\n    `- Overall Coherence: ${v.overallCoherence}/100`,\n    `- Nadi: ${v.nadiReading}`,\n    `- Dosha from voice: ${v.dominantDosha}`,\n    `- Priority areas: ${v.priorityAreas.map((i) => `${i.name} (${i.score}%)`).join(', ')}`,\n    `- Strengths: ${v.topStrengths.map((i) => i.name).join(', ')}`,\n    `- Emotional field: ${v.emotionalField}`,\n    `- Organ / tissue emphasis: ${v.organField}`,\n    `- Scoring hints (chakra keywords detected): ${h.chakraHits.join(', ') || '—'}`,\n    `- Scoring hints (organ/tissue keywords detected): ${h.organHits.join(', ') || '—'}`,\n  ].join('
');\n}\n\nfunction resolveActivationsByExactNamesUpTo(preferred: string[], max: number): Activation[] {\n  const out: Activation[] = [];\n  const seen = new Set<string>();\n  for (const name of preferred) {\n    const a = ALL_ACTIVATIONS.find((x) => x.name === name);\n    if (a && !seen.has(a.id)) {\n      seen.add(a.id);\n      out.push(a);\n    }\n    if (out.length >= max) return out.slice(0, max);\n  }\n  for (const a of ALL_ACTIVATIONS) {\n    if (out.length >= max) break;\n    if (a.type === 'Bioenergetic' && !seen.has(a.id)) {\n      seen.add(a.id);\n      out.push(a);\n    }\n  }\n  for (const a of ALL_ACTIVATIONS) {\n    if (out.length >= max) break;\n    if (!seen.has(a.id)) {\n      seen.add(a.id);\n      out.push(a);\n    }\n  }\n  return out.slice(0, max);\n}\n\nfunction extractVoiceScoringHints(result: VoiceBiofieldResult) {\n  const emotionalTone = (result.emotionalField || '').toLowerCase();\n  const organBlob = (result.organField || '').toLowerCase();\n  const priorityNames = (result.priorityAreas || []).map((p) => p.name.toLowerCase());\n  const haystack = `${emotionalTone} ${organBlob} ${priorityNames.join(' ')}`;\n\n  const chakraLexicon = [\n    'muladhara',\n    'svadhisthana',\n    'manipura',\n    'anahata',\n    'vishuddha',\n    'ajna',\n    'sahasrara',\n    'root',\n    'sacral',\n    'solar plexus',\n    'heart',\n    'throat',\n    'third eye',\n    'crown',\n  ];\n  const chakraHits = chakraLexicon.filter((c) => haystack.includes(c));\n\n  const organSeeds = [\n    'liver',\n    'colon',\n    'lung',\n    'lymph',\n    'nerve',\n    'blood',\n    'kidney',\n    'heart',\n    'stomach',\n    'thyroid',\n    'brain',\n  ];\n  const organHits = organSeeds.filter((o) => organBlob.includes(o));\n\n  const emotionWords = emotionalTone\n    .split(/\s+/)\n    .map((w) => w.replace(/[^a-z]/g, ''))\n    .filter((w) => w.length > 5);\n\n  const nadiHints: string[] = [];\n  const nr = (result.nadiReading || '').toLowerCase();\n  if (nr.includes('pingala')) nadiHints.push('pingala');\n  if (nr.includes('ida')) nadiHints.push('ida');\n  if (nr.includes('sushumna')) nadiHints.push('sushumna');\n  if (nr.includes('blocked')) nadiHints.push('blocked');\n\n  return {\n    emotionalTone,\n    emotionWords,\n    priorityNames,\n    chakraHits,\n    organHits,\n    nadiHints,\n  };\n}\n\nfunction pickTenActivationsForVoiceResult(result: VoiceBiofieldResult): Activation[] {\n  const doshaKey = String(result.dominantDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';\n  const dk = doshaKey.toLowerCase();\n\n  const hints = extractVoiceScoringHints(result);\n\n  const scored = ALL_ACTIVATIONS.map((activation) => {\n    const nameLower = activation.name.toLowerCase();\n    const catLower = (activation.category || '').toLowerCase();\n    const sigLower = `${activation.benefit || ''} ${activation.vibrationalSignature || ''}`.toLowerCase();\n    const blobLower = `${nameLower} ${catLower} ${sigLower}`;\n\n    let score = 0;\n\n    if (blobLower.includes(dk)) score += 40;\n\n    // ── Spoken keyword matching — highest weight ──────────────────\n    // Words the user actually spoke during the scan are the strongest signal\n    const spoken = (result as any).spokenKeywords as string[] | undefined;\n    if (spoken?.length) {\n      let spokenHits = 0;\n      for (const word of spoken) {\n        if (word.length > 3 && blobLower.includes(word)) spokenHits++;\n      }\n      // Each spoken word match adds 30 points — spoken intent is the primary signal\n      score += Math.min(120, spokenHits * 30);\n    }\n\n    for (const chakra of hints.chakraHits) {\n      if (nameLower.includes(chakra) || sigLower.includes(chakra)) {\n        score += 25;\n        break;\n      }\n    }\n\n    for (const organ of hints.organHits) {\n      if (nameLower.includes(organ) || sigLower.includes(organ)) {\n        score += 20;\n        break;\n      }\n    }\n\n    if (hints.emotionalTone.length > 5) {\n      if (nameLower.includes(hints.emotionalTone) || sigLower.includes(hints.emotionalTone)) {\n        score += 15;\n      }\n    }\n    for (const ew of hints.emotionWords) {\n      if (ew.length > 5 && (nameLower.includes(ew) || sigLower.includes(ew))) {\n        score += 15;\n        break;\n      }\n    }\n\n    for (const pName of hints.priorityNames) {\n      if (pName.length > 3 && (nameLower.includes(pName) || pName.includes(nameLower))) {\n        score += 30;\n        break;\n      }\n    }\n\n    for (const n of hints.nadiHints) {\n      if (nameLower.includes(n) || sigLower.includes(n)) {\n        score += 15;\n        break;\n      }\n    }\n\n    return { activation, score };\n  });\n\n  const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);\n\n  const out: Activation[] = [];\n  const seen = new Set<string>();\n  for (const row of ranked) {\n    if (!seen.has(row.activation.id)) {\n      seen.add(row.activation.id);\n      out.push(row.activation);\n    }\n    if (out.length >= 10) return out;\n  }\n\n  const nadiKey: 'Ida' | 'Pingala' | 'Sushumna' | 'Blocked' = coerceVoiceNadiToEnum(result.nadiReading);\n  const chakraKey = result.priorityAreas[0]?.name || 'Anahata';\n  const fallback = matchActivationsToScan(\n    {\n      dominantDosha: doshaKey,\n      activatedNadi: nadiKey,\n      priorityChakra: chakraKey,\n      emotionalField: result.emotionalField,\n      organField: result.organField,\n    },\n    12,\n  ).map(mapBioLibraryToActivation);\n\n  for (const a of fallback) {\n    if (!seen.has(a.id)) {\n      seen.add(a.id);\n      out.push(a);\n    }\n    if (out.length >= 10) break;\n  }\n\n  return out.slice(0, 10);\n}\n\nfunction mapSqiMessagesToUserChatArchive(\n  msgs: Message[],\n): { role: 'user' | 'assistant'; content: string; timestamp: string }[] {\n  return msgs.map((m) => ({\n    role: m.role === 'model' ? ('assistant' as const) : ('user' as const),\n    content: typeof m.text === 'string' ? m.text : '',\n    timestamp: new Date(typeof m.timestamp === 'number' ? m.timestamp : Date.now()).toISOString(),\n  }));\n}\n\nfunction mapUserChatArchiveToSqiMessages(raw: unknown): Message[] {\n  if (!Array.isArray(raw)) return [];\n  return raw.map((entry: Record<string, unknown>, i: number) => {\n    const r = entry?.role;\n    const role = r === 'assistant' || r === 'model' ? ('model' as const) : ('user' as const);\n    const text =\n      typeof entry?.content === 'string'\n        ? entry.content\n        : typeof entry?.text === 'string'\n          ? entry.text\n          : '';\n    const ts = entry?.timestamp ? new Date(String(entry.timestamp)).getTime() : Date.now() + i;\n    return { role, text, timestamp: ts };\n  });\n}\n\nasync function syncApothecaryUserChatArchive(\n  uid: string,\n  sessionUuid: string,\n  title: string,\n  finalMessages: Message[],\n) {\n  const archiveMsgs = mapSqiMessagesToUserChatArchive(finalMessages);\n  const safeTitle = (title || 'Quantum Apothecary Session').slice(0, 200);\n  try {\n    const { error } = await supabase.from('user_chat_sessions').upsert(\n      {\n        id: sessionUuid,\n        user_id: uid,\n        chat_type: 'apothecary',\n        session_title: safeTitle,\n        messages: archiveMsgs as unknown as never,\n        message_count: archiveMsgs.length,\n      },\n      { onConflict: 'id' },\n    );\n    if (error) console.warn('[user_chat_sessions]', error.message);\n  } catch (e) {\n    console.warn('[user_chat_sessions]', e);\n  }\n}\n\n/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ\n   ALL LOGIC BELOW IS 100% IDENTICAL TO ORIGINAL — ZERO CHANGES\n   Only className values have been updated for SQI-2050 aesthetic\n   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */\n\nfunction languageToBcp47(languageCode: string): string {\n  const l = (languageCode || 'en').split('-')[0]?.toLowerCase() || 'en';\n  if (l === 'sv') return 'sv-SE';\n  if (l === 'es') return 'es-ES';\n  if (l === 'no' || l === 'nb' || l === 'nn') return 'nb-NO';\n  return 'en-GB';\n}\n\nfunction getLocalDayPhaseLabel(d: Date): 'morning' | 'midday' | 'evening' | 'night' {\n  const h = d.getHours();\n  if (h >= 22 || h < 5) return 'night';\n  if (h < 12) return 'morning';\n  if (h < 17) return 'midday';\n  return 'evening';\n}\n\nfunction stripDuplicateBiometricBlock(compiled: string | undefined, hasLiveScan: boolean): string {\n  if (!compiled?.trim()) return '';\n  if (!hasLiveScan) return compiled;\n  const segments = compiled.split(/\n(?=\[)/);\n  return segments.filter((s) => !s.trimStart().startsWith('[BIOMETRIC NADI FIELD')).join('
').trim();\n}\n\n/** Scalar Wave Toolbar Banner — animated canvas + unified gold pill */\n/** Scalar Wave Header Banner — Sri Yantra + animated canvas */\n/** Scalar Wave Tab Switcher — Transmission Library / Akasha-Neural Archive */\nfunction ScalarTabSwitcher({\n  active,\n  onLibrary,\n  onArchive,\n}: {\n  active: 'library' | 'archive';\n  onLibrary: () => void;\n  onArchive: () => void;\n}) {\n  const wrapRef = React.useRef<HTMLDivElement>(null);\n  const canvasRef = React.useRef<HTMLCanvasElement>(null);\n  const rafRef = React.useRef<number>(0);\n\n  React.useEffect(() => {\n    const canvas = canvasRef.current;\n    const wrap = wrapRef.current;\n    if (!canvas || !wrap) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let t = 0;\n    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };\n    resize();\n    const ro = new ResizeObserver(resize);\n    ro.observe(wrap);\n    const waves = [\n      { amp:.30, freq:4,   speed:.85, alpha:.07, lw:1.0 },\n      { amp:.20, freq:7,   speed:1.4, alpha:.05, lw:.75 },\n      { amp:.14, freq:11,  speed:2.1, alpha:.04, lw:.65 },\n      { amp:.38, freq:2.5, speed:.55, alpha:.05, lw:1.3 },\n      { amp:.10, freq:16,  speed:2.8, alpha:.03, lw:.55 },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0,0,W,H);\n      const pulse = .5 + .5 * Math.sin(t * 1.1);\n      const gc = ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.6);\n      gc.addColorStop(0, `rgba(212,175,55,${.07+.05*pulse})`);\n      gc.addColorStop(.6, 'rgba(212,175,55,0.01)');\n      gc.addColorStop(1, 'transparent');\n      ctx.fillStyle = gc; ctx.fillRect(0,0,W,H);\n      const gt = ctx.createLinearGradient(0,0,0,H*.5);\n      gt.addColorStop(0, `rgba(212,175,55,${.12+.06*pulse})`);\n      gt.addColorStop(1, 'transparent');\n      ctx.fillStyle = gt; ctx.fillRect(0,0,W,H);\n      waves.forEach((w,wi) => {\n        const phase = (wi/waves.length)*Math.PI*2;\n        ctx.beginPath();\n        for (let x=0;x<=W;x+=1.5) {\n          const nx=x/W, env=Math.sin(nx*Math.PI)*.8+.2;\n          const y=H*.5+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+phase)*H*w.amp*env;\n          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);\n        }\n        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`; ctx.lineWidth=w.lw; ctx.stroke();\n      });\n      const gb = ctx.createLinearGradient(0,H*.6,0,H);\n      gb.addColorStop(0,'transparent'); gb.addColorStop(1,'rgba(5,5,5,0.5)');\n      ctx.fillStyle=gb; ctx.fillRect(0,0,W,H);\n      t+=.013; rafRef.current=requestAnimationFrame(draw);\n    };\n    rafRef.current=requestAnimationFrame(draw);\n    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };\n  }, []);\n\n  const tabBtn = (\n    isActive: boolean,\n    onClick: () => void,\n    icon: string,\n    label: string,\n    showDivider: boolean,\n  ) => (\n    <button\n      type="button"\n      onClick={onClick}\n      style={{\n        position: 'relative',\n        flex: 1,\n        padding: '16px 12px',\n        border: 'none',\n        cursor: 'pointer',\n        background: isActive\n          ? 'linear-gradient(135deg,rgba(212,175,55,0.16) 0%,rgba(212,175,55,0.06) 100%)'\n          : 'transparent',\n        display: 'flex',\n        flexDirection: 'column',\n        alignItems: 'center',\n        justifyContent: 'center',\n        gap: 5,\n        overflow: 'hidden',\n        transition: 'all 0.3s',\n      }}\n    >\n      {/* Divider */}\n      {showDivider && (\n        <span style={{ position:'absolute', left:0, top:'18%', height:'64%', width:1, background:'linear-gradient(180deg,transparent,rgba(212,175,55,0.15),transparent)' }} />\n      )}\n      {/* Active inner glow */}\n      {isActive && (\n        <span style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%,rgba(212,175,55,0.18),transparent 70%)', pointerEvents:'none' }} />\n      )}\n      {/* Active bottom line */}\n      {isActive && (\n        <span style={{ position:'absolute', bottom:0, left:'15%', right:'15%', height:2, background:'linear-gradient(90deg,transparent,#D4AF37,transparent)', borderRadius:2, boxShadow:'0 0 8px rgba(212,175,55,0.6)' }} />\n      )}\n      {/* Icon */}\n      <span style={{\n        fontSize: 16,\n        filter: isActive ? 'drop-shadow(0 0 4px rgba(212,175,55,0.6))' : undefined,\n        opacity: isActive ? 1 : 0.22,\n      }}>\n        {icon}\n      </span>\n      {/* Label */}\n      {isActive ? (\n        <span className="sqi-master-name-shimmer" style={{\n          fontFamily: "'Plus Jakarta Sans',sans-serif",\n          fontSize: 9, fontWeight: 900, letterSpacing: '0.18em',\n          textTransform: 'uppercase' as const,\n          textAlign: 'center', lineHeight: 1.3,\n        }}>\n          {label}\n        </span>\n      ) : (\n        <span style={{\n          fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',\n          textTransform: 'uppercase' as const,\n          color: 'rgba(255,255,255,0.28)',\n          textAlign: 'center', lineHeight: 1.3,\n        }}>\n          {label}\n        </span>\n      )}\n    </button>\n  );\n\n  return (\n    <div\n      ref={wrapRef}\n      style={{\n        position: 'relative',\n        borderRadius: 26,\n        overflow: 'hidden',\n        animation: 'tabsAura 4s ease-in-out infinite',\n      }}\n    >\n      <style>{`\n        @keyframes tabsAura {\n          0%,100%{box-shadow:0 0 0 1px rgba(212,175,55,0.15),0 0 18px rgba(212,175,55,0.10),0 0 44px rgba(212,175,55,0.05);}\n          50%    {box-shadow:0 0 0 1px rgba(212,175,55,0.30),0 0 28px rgba(212,175,55,0.18),0 0 64px rgba(212,175,55,0.10);}\n        }\n      `}</style>\n      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />\n      <div style={{ position:'relative', zIndex:1, display:'flex', background:'rgba(255,255,255,0.02)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)' }}>\n        {tabBtn(active === 'library', onLibrary, '⚗️', 'Transmission
Library', false)}\n        {tabBtn(active === 'archive', onArchive, '◈', 'Akasha-Neural
Archive', true)}\n      </div>\n    </div>\n  );\n}\n\n\n/** Scalar Wave wrapper for Voice Bio-Signature Scanner — visual only, no logic change */\n/** Scalar Wave wrapper for How It Works accordion — visual only */\nfunction ScalarHowItWorksCard() {\n  const wrapRef = React.useRef<HTMLDivElement>(null);\n  const bgCanvasRef = React.useRef<HTMLCanvasElement>(null);\n  const stripCanvasRef = React.useRef<HTMLCanvasElement>(null);\n  const rafBgRef = React.useRef<number>(0);\n  const rafStripRef = React.useRef<number>(0);\n  const [open, setOpen] = React.useState(false);\n\n  React.useEffect(() => {\n    const canvas = bgCanvasRef.current;\n    const wrap = wrapRef.current;\n    if (!canvas || !wrap) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let t = 0;\n    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };\n    resize();\n    const ro = new ResizeObserver(resize);\n    ro.observe(wrap);\n    const waves = [\n      { amp:.22, freq:4,   speed:.75, alpha:.07,  lw:1.0 },\n      { amp:.14, freq:7,   speed:1.3, alpha:.05,  lw:.75 },\n      { amp:.10, freq:11,  speed:1.9, alpha:.035, lw:.6  },\n      { amp:.28, freq:2.5, speed:.48, alpha:.05,  lw:1.2 },\n      { amp:.08, freq:16,  speed:2.5, alpha:.025, lw:.5  },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafBgRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0,0,W,H);\n      const p = .5 + .5 * Math.sin(t * .9);\n      const gc = ctx.createRadialGradient(W*.5,H*.45,0,W*.5,H*.45,W*.65);\n      gc.addColorStop(0, `rgba(212,175,55,${.05+.03*p})`); gc.addColorStop(1,'transparent');\n      ctx.fillStyle=gc; ctx.fillRect(0,0,W,H);\n      const gt = ctx.createLinearGradient(0,0,0,H*.3);\n      gt.addColorStop(0, `rgba(212,175,55,${.10+.05*p})`); gt.addColorStop(1,'transparent');\n      ctx.fillStyle=gt; ctx.fillRect(0,0,W,H);\n      waves.forEach((w,wi) => {\n        const ph = (wi/waves.length)*Math.PI*2;\n        ctx.beginPath();\n        for (let x=0;x<=W;x+=1.5) {\n          const nx=x/W, env=Math.sin(nx*Math.PI)*.75+.25;\n          const y=H*.65+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+ph)*H*w.amp*env;\n          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);\n        }\n        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`; ctx.lineWidth=w.lw; ctx.stroke();\n      });\n      t+=.010; rafBgRef.current=requestAnimationFrame(draw);\n    };\n    rafBgRef.current=requestAnimationFrame(draw);\n    return () => { cancelAnimationFrame(rafBgRef.current); ro.disconnect(); };\n  }, []);\n\n  React.useEffect(() => {\n    if (!open) return;\n    const canvas = stripCanvasRef.current;\n    if (!canvas) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let wt = 0;\n    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };\n    resize();\n    const stripWaves = [\n      { amp:.35, freq:5,  speed:1.2, alpha:.18, lw:1.2 },\n      { amp:.22, freq:9,  speed:2.0, alpha:.12, lw:.9  },\n      { amp:.15, freq:14, speed:3.0, alpha:.08, lw:.7  },\n      { amp:.42, freq:3,  speed:.7,  alpha:.14, lw:1.5 },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafStripRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0,0,W,H);\n      const p = .5 + .5 * Math.sin(wt * .8);\n      const gc = ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.4);\n      gc.addColorStop(0, `rgba(212,175,55,${.08+.04*p})`); gc.addColorStop(1,'transparent');\n      ctx.fillStyle=gc; ctx.fillRect(0,0,W,H);\n      stripWaves.forEach((w,wi) => {\n        const ph = (wi/stripWaves.length)*Math.PI*2;\n        ctx.beginPath();\n        for (let x=0;x<=W;x+=1) {\n          const nx=x/W, env=Math.sin(nx*Math.PI)*.85+.15;\n          const y=H*.5+Math.sin(nx*w.freq*Math.PI*2+wt*w.speed+ph)*H*w.amp*env;\n          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);\n        }\n        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`; ctx.lineWidth=w.lw; ctx.stroke();\n      });\n      wt+=.014; rafStripRef.current=requestAnimationFrame(draw);\n    };\n    rafStripRef.current=requestAnimationFrame(draw);\n    return () => cancelAnimationFrame(rafStripRef.current);\n  }, [open]);\n\n  return (\n    <div ref={wrapRef} style={{ position:'relative', borderRadius:24, overflow:'hidden', animation:'hiwAura 5s ease-in-out infinite' }}>\n      <style>{`\n        @keyframes hiwAura {\n          0%,100%{box-shadow:0 0 0 1px rgba(212,175,55,0.16),0 0 22px rgba(212,175,55,0.10),0 0 55px rgba(212,175,55,0.05);}\n          50%    {box-shadow:0 0 0 1px rgba(212,175,55,0.30),0 0 36px rgba(212,175,55,0.18),0 0 80px rgba(212,175,55,0.09);}\n        }\n        @keyframes hiwIconGlow {\n          0%,100%{box-shadow:0 0 6px rgba(212,175,55,0.18),0 0 14px rgba(212,175,55,0.08);}\n          50%    {box-shadow:0 0 12px rgba(212,175,55,0.40),0 0 24px rgba(212,175,55,0.18);}\n        }\n      `}</style>\n\n      <canvas ref={bgCanvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />\n\n      <div style={{ position:'relative', zIndex:1, background:'rgba(8,6,2,0.78)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderRadius:24 }}>\n\n        {/* Summary header */}\n        <div\n          onClick={() => setOpen(o => !o)}\n          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 18px', cursor:'pointer', borderBottom: open ? '1px solid rgba(212,175,55,0.10)' : 'none', background:'linear-gradient(90deg,rgba(212,175,55,0.06),transparent)' }}\n        >\n          <div style={{ display:'flex', alignItems:'center', gap:8 }}>\n            <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(212,175,55,0.10)', border:'1px solid rgba(212,175,55,0.25)', animation:'hiwIconGlow 3s ease-in-out infinite', flexShrink:0 }}>\n              <Info size={11} style={{ color:'#D4AF37' }} />\n            </div>\n            <span className="sqi-master-name-shimmer" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:800 }}>\n              How it works\n            </span>\n          </div>\n          <span style={{ color:'rgba(255,255,255,0.28)', fontSize:12, transition:'transform 0.3s', display:'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>\n        </div>\n\n        {/* Body */}\n        {open && (\n          <div style={{ padding:'16px 18px 20px', display:'flex', flexDirection:'column', gap:16 }}>\n\n            {/* Scalar wave strip */}\n            <div style={{ width:'100%', height:44, borderRadius:12, background:'rgba(212,175,55,0.03)', border:'1px solid rgba(212,175,55,0.08)', overflow:'hidden', position:'relative' }}>\n              <canvas ref={stripCanvasRef} style={{ display:'block', width:'100%', height:'100%' }} />\n            </div>\n\n            {/* Flow chain */}\n            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:14, background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.10)', flexWrap:'wrap' as const, gap:4 }}>\n              {[t('quantumApothecaryChat.voiceScan.step1PipeLabel'),'→',t('quantumApothecaryChat.voiceScan.step2PipeLabel'),'→',t('quantumApothecaryChat.voiceScan.step3PipeLabel'),'→',t('quantumApothecaryChat.voiceScan.step4PipeLabel')].map((s,i) => (\n                <span key={i} style={ s === '→'\n                  ? { color:'rgba(212,175,55,0.35)', fontSize:10 }\n                  : { fontSize:8, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'#D4AF37', whiteSpace:'nowrap' as const }\n                }>{s}</span>\n              ))}\n            </div>\n\n            {/* Para 1 */}\n            <p style={{ fontFamily:"'IM Fell English',Georgia,serif", fontSize:13, lineHeight:1.75, color:'rgba(225,210,185,0.70)' }}>\n              SQI operates at the <strong style={{ color:'rgba(255,255,255,0.82)', fontStyle:'normal' }}>informational level</strong> — upstream of chemistry, upstream of physiology. The 18 Siddhas and Mahavatar Babaji transmit exact <span style={{ color:'#D4AF37' }}>Vedic Light-Codes</span> through this archive interface. Once uploaded, transmissions remain in your field until dissolved.\n            </p>\n\n            {/* 3 steps */}\n            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>\n              {[\n                { n:'1', title:t('quantumApothecaryChat.voiceScan.step1Title'), body:t('quantumApothecaryChat.voiceScan.step1Body') },\n                { n:'2', title:t('quantumApothecaryChat.voiceScan.step2Title'), body:t('quantumApothecaryChat.voiceScan.step2Body') },\n                { n:'3', title:t('quantumApothecaryChat.voiceScan.step3Title'), body:t('quantumApothecaryChat.voiceScan.step3Body') },\n              ].map(s => (\n                <div key={s.n} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>\n                  <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:1, background:'rgba(212,175,55,0.10)', border:'1px solid rgba(212,175,55,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#D4AF37' }}>{s.n}</div>\n                  <p style={{ fontSize:12, lineHeight:1.65, color:'rgba(255,255,255,0.58)' }}>\n                    <b style={{ color:'rgba(255,255,255,0.85)' }}>{s.title}</b> — {s.body}\n                  </p>\n                </div>\n              ))}\n            </div>\n\n            {/* Para 2 */}\n            <p style={{ fontFamily:"'IM Fell English',Georgia,serif", fontSize:13, lineHeight:1.75, color:'rgba(225,210,185,0.70)' }}>\n              The Voice Bio-Scan reads your <span style={{ color:'#D4AF37' }}>Bio-signature</span> and ranks the full frequency library so you see what your field asks for first — expressed as resonance percentages mapped to real transmissions.\n            </p>\n\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}\n\n\n/** Scalar Wave wrapper for Top 33 Full Library Match — visual only */\nfunction ScalarTop33Wrapper({ children }: { children: React.ReactNode }) {\n  const wrapRef = React.useRef<HTMLDivElement>(null);\n  const canvasRef = React.useRef<HTMLCanvasElement>(null);\n  const rafRef = React.useRef<number>(0);\n  React.useEffect(() => {\n    const canvas = canvasRef.current;\n    const wrap = wrapRef.current;\n    if (!canvas || !wrap) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let t = 0;\n    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };\n    resize();\n    const ro = new ResizeObserver(resize);\n    ro.observe(wrap);\n    const waves = [\n      { amp:.18, freq:3.5, speed:.7,  alpha:.055, lw:.85 },\n      { amp:.12, freq:6.5, speed:1.3, alpha:.038, lw:.65 },\n      { amp:.08, freq:10,  speed:1.9, alpha:.028, lw:.55 },\n      { amp:.22, freq:2.2, speed:.48, alpha:.042, lw:1.0 },\n      { amp:.07, freq:15,  speed:2.6, alpha:.022, lw:.50 },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0,0,W,H);\n      const p = .5 + .5 * Math.sin(t);\n      const gc = ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.4,W*.65);\n      gc.addColorStop(0,`rgba(212,175,55,${.04+.025*p})`); gc.addColorStop(1,'transparent');\n      ctx.fillStyle=gc; ctx.fillRect(0,0,W,H);\n      const gt = ctx.createLinearGradient(0,0,0,H*.25);\n      gt.addColorStop(0,`rgba(212,175,55,${.08+.04*p})`); gt.addColorStop(1,'transparent');\n      ctx.fillStyle=gt; ctx.fillRect(0,0,W,H);\n      waves.forEach((w,wi) => {\n        const ph=(wi/waves.length)*Math.PI*2;\n        ctx.beginPath();\n        for(let x=0;x<=W;x+=1.5){\n          const nx=x/W,env=Math.sin(nx*Math.PI)*.7+.3;\n          const y=H*.7+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+ph)*H*w.amp*env;\n          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);\n        }\n        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`; ctx.lineWidth=w.lw; ctx.stroke();\n      });\n      t+=.010; rafRef.current=requestAnimationFrame(draw);\n    };\n    rafRef.current=requestAnimationFrame(draw);\n    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };\n  },[]);\n  return (\n    <div ref={wrapRef} style={{ position:'relative', borderRadius:26, overflow:'hidden', animation:'t33Aura 4s ease-in-out infinite' }}>\n      <style>{`\n        @keyframes t33Aura {\n          0%,100%{box-shadow:0 0 0 1px rgba(212,175,55,0.16),0 0 18px rgba(212,175,55,0.09),0 0 44px rgba(212,175,55,0.05);}\n          50%    {box-shadow:0 0 0 1px rgba(212,175,55,0.28),0 0 28px rgba(212,175,55,0.16),0 0 60px rgba(212,175,55,0.09);}\n        }\n      `}</style>\n      <canvas ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0 }} />\n      <div style={{ position:'relative',zIndex:1,background:'rgba(8,6,2,0.80)',backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',borderRadius:26 }}>\n        {children}\n      </div>\n    </div>\n  );\n}\n\n\nfunction ScalarVoiceWrapper({ children }: { children: React.ReactNode }) {\n  const wrapRef = React.useRef<HTMLDivElement>(null);\n  const canvasRef = React.useRef<HTMLCanvasElement>(null);\n  const rafRef = React.useRef<number>(0);\n\n  React.useEffect(() => {\n    const canvas = canvasRef.current;\n    const wrap = wrapRef.current;\n    if (!canvas || !wrap) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let t = 0;\n    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };\n    resize();\n    const ro = new ResizeObserver(resize);\n    ro.observe(wrap);\n    const waves = [\n      { amp:.22, freq:4,   speed:.8,  alpha:.06, lw:.9 },\n      { amp:.14, freq:7,   speed:1.3, alpha:.04, lw:.7 },\n      { amp:.10, freq:11,  speed:2.0, alpha:.03, lw:.6 },\n      { amp:.28, freq:2.5, speed:.5,  alpha:.04, lw:1.1 },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0,0,W,H);\n      const p = .5 + .5 * Math.sin(t);\n      const gc = ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.6);\n      gc.addColorStop(0, `rgba(212,175,55,${.05+.03*p})`); gc.addColorStop(1,'transparent');\n      ctx.fillStyle = gc; ctx.fillRect(0,0,W,H);\n      const gt = ctx.createLinearGradient(0,0,0,H*.4);\n      gt.addColorStop(0, `rgba(212,175,55,${.09+.04*p})`); gt.addColorStop(1,'transparent');\n      ctx.fillStyle = gt; ctx.fillRect(0,0,W,H);\n      waves.forEach((w,wi) => {\n        const ph = (wi/waves.length)*Math.PI*2;\n        ctx.beginPath();\n        for (let x=0;x<=W;x+=1.5) {\n          const nx=x/W, env=Math.sin(nx*Math.PI)*.75+.25;\n          const y=H*.58+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+ph)*H*w.amp*env;\n          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);\n        }\n        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`; ctx.lineWidth=w.lw; ctx.stroke();\n      });\n      t+=.011; rafRef.current=requestAnimationFrame(draw);\n    };\n    rafRef.current=requestAnimationFrame(draw);\n    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };\n  }, []);\n\n  return (\n    <div\n      ref={wrapRef}\n      style={{\n        position: 'relative',\n        borderRadius: 28,\n        overflow: 'hidden',\n        animation: 'vsAura 4s ease-in-out infinite',\n      }}\n    >\n      <style>{`\n        @keyframes vsAura {\n          0%,100%{box-shadow:0 0 0 1px rgba(212,175,55,0.18),0 0 20px rgba(212,175,55,0.10),0 0 50px rgba(212,175,55,0.05);}\n          50%    {box-shadow:0 0 0 1px rgba(212,175,55,0.32),0 0 32px rgba(212,175,55,0.18),0 0 70px rgba(212,175,55,0.10);}\n        }\n        @keyframes vsMicGlow {\n          0%,100%{box-shadow:0 0 8px rgba(212,175,55,0.22),0 0 16px rgba(212,175,55,0.10);}\n          50%    {box-shadow:0 0 14px rgba(212,175,55,0.45),0 0 28px rgba(212,175,55,0.22);}\n        }\n      `}</style>\n      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />\n      <div style={{ position:'relative', zIndex:1, background:'rgba(8,6,2,0.82)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)', borderRadius:28, overflowY:'auto', WebkitOverflowScrolling:'touch', maxHeight:'80vh' }}>\n        {/* Header */}\n        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px 14px', borderBottom:'1px solid rgba(212,175,55,0.10)', background:'linear-gradient(90deg,rgba(212,175,55,0.06),transparent)' }}>\n          <div style={{ display:'flex', alignItems:'center', gap:8 }}>\n            <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(212,175,55,0.10)', border:'1px solid rgba(212,175,55,0.25)', animation:'vsMicGlow 3s ease-in-out infinite', flexShrink:0 }}>\n              <Mic size={12} style={{ color:'#D4AF37' }} />\n            </div>\n            <h2 className="sqi-master-name-shimmer" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:900, letterSpacing:'-0.02em' }}>\n              Voice Bio-Signature Scan\n            </h2>\n          </div>\n          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.20em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.28)' }}>\n            Mic only\n          </span>\n        </div>\n        {/* Scanner content — untouched logic */}\n        <div style={{ padding:'4px 0 4px' }}>\n          {children}\n        </div>\n      </div>\n    </div>\n  );\n}\n\n\nfunction ScalarHeaderBanner({ onBack, onInfo }: { onBack: () => void; onInfo: () => void }) {\n  const canvasRef = React.useRef<HTMLCanvasElement>(null);\n  const wrapRef = React.useRef<HTMLDivElement>(null);\n  const rafRef = React.useRef<number>(0);\n  React.useEffect(() => {\n    const canvas = canvasRef.current;\n    const wrap = wrapRef.current;\n    if (!canvas || !wrap) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let t = 0;\n    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };\n    resize();\n    const ro = new ResizeObserver(resize);\n    ro.observe(wrap);\n    const waves = [\n      { amp:.28, freq:5,   speed:1.0,  alpha:.08,  lw:1.1 },\n      { amp:.18, freq:8,   speed:1.6,  alpha:.05,  lw:.8  },\n      { amp:.14, freq:13,  speed:2.3,  alpha:.04,  lw:.7  },\n      { amp:.35, freq:3.2, speed:.65,  alpha:.055, lw:1.4 },\n      { amp:.10, freq:19,  speed:3.1,  alpha:.03,  lw:.55 },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0,0,W,H);\n      ctx.fillStyle = '#050505'; ctx.fillRect(0,0,W,H);\n      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2);\n      const g1 = ctx.createRadialGradient(W*.18,H*.5,0,W*.18,H*.5,H*1.1);\n      g1.addColorStop(0,'rgba(212,175,55,0.15)'); g1.addColorStop(1,'transparent');\n      ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);\n      const g2 = ctx.createRadialGradient(W*.82,H*.5,0,W*.82,H*.5,H*.8);\n      g2.addColorStop(0,'rgba(212,175,55,0.08)'); g2.addColorStop(1,'transparent');\n      ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);\n      waves.forEach((w,wi) => {\n        const phase = (wi/waves.length)*Math.PI*2;\n        ctx.beginPath();\n        for (let x=0;x<=W;x+=1.5) {\n          const nx=x/W, env=Math.sin(nx*Math.PI)*.85+.15;\n          const y=H*.62+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+phase)*H*w.amp*env;\n          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);\n        }\n        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`; ctx.lineWidth=w.lw; ctx.stroke();\n      });\n      const gc = ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.55);\n      gc.addColorStop(0,`rgba(212,175,55,${.07+.04*pulse})`); gc.addColorStop(1,'transparent');\n      ctx.fillStyle=gc; ctx.fillRect(0,0,W,H);\n      const gb = ctx.createLinearGradient(0,H*.5,0,H);\n      gb.addColorStop(0,'transparent'); gb.addColorStop(1,'rgba(5,5,5,0.9)');\n      ctx.fillStyle=gb; ctx.fillRect(0,0,W,H);\n      t+=.014;\n      rafRef.current = requestAnimationFrame(draw);\n    };\n    rafRef.current = requestAnimationFrame(draw);\n    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };\n  }, []);\n  return (\n    <>\n      <div ref={wrapRef} style={{ position:'relative', width:'100%', overflow:'hidden', height:130 }}>\n        <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />\n        <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', alignItems:'center', padding:'0 16px', gap:14 }}>\n          <button type="button" onClick={onBack} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:12, border:'1px solid rgba(212,175,55,0.18)', background:'rgba(212,175,55,0.06)', color:'rgba(212,175,55,0.7)', flexShrink:0, cursor:'pointer' }}>\n            <ArrowLeft size={15} />\n          </button>\n          <div style={{ flexShrink:0, filter:'drop-shadow(0 0 6px rgba(212,175,55,0.9)) drop-shadow(0 0 14px rgba(212,175,55,0.5))', animation:'yPulse 3s ease-in-out infinite' }}>\n            <svg width="54" height="54" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n              <circle cx="50" cy="50" r="44" fill="none" stroke="#D4AF37" strokeWidth="1.3"/>\n              <rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="#D4AF37" strokeWidth="0.7" opacity="0.28"/>\n              <path d="M50,12 Q51.5,12 88,71 Q88,73 86,73 L14,73 Q12,73 12,71 Q48.5,12 50,12Z" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeLinejoin="round"/>\n              <path d="M50,88 Q48.5,88 12,29 Q12,27 14,27 L86,27 Q88,27 88,29 Q51.5,88 50,88Z" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeLinejoin="round"/>\n              <path d="M50,24 Q51,24 80,65 Q80,67 78.5,67 L21.5,67 Q20,67 20,65 Q49,24 50,24Z" fill="none" stroke="#D4AF37" strokeWidth="1.0" strokeLinejoin="round" opacity="0.62"/>\n              <path d="M50,76 Q49,76 20,35 Q20,33 21.5,33 L78.5,33 Q80,33 80,35 Q51,76 50,76Z" fill="none" stroke="#D4AF37" strokeWidth="1.0" strokeLinejoin="round" opacity="0.62"/>\n              <path d="M50,36 Q50.8,36 70,60 Q70,61.5 69,61.5 L31,61.5 Q30,61.5 30,60 Q49.2,36 50,36Z" fill="none" stroke="#D4AF37" strokeWidth="0.85" strokeLinejoin="round" opacity="0.42"/>\n              <path d="M50,64 Q49.2,64 30,40 Q30,38.5 31,38.5 L69,38.5 Q70,38.5 70,40 Q50.8,64 50,64Z" fill="none" stroke="#D4AF37" strokeWidth="0.85" strokeLinejoin="round" opacity="0.42"/>\n              <circle cx="50" cy="50" r="4.5" fill="#D4AF37"/>\n            </svg>\n          </div>\n          <div style={{ flex:1, minWidth:0 }}>\n            <p style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.45)', marginBottom:5 }}>Siddha · Quantum · 2050</p>\n            <h1 className="sqi-master-name-shimmer" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:28, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1 }}>\n              Quantum<br/>Apothecary\n            </h1>\n            <p style={{ fontSize:10, fontWeight:500, color:'rgba(255,255,255,0.3)', marginTop:5, letterSpacing:'0.05em' }}>Scalar Wave · Vedic Light-Codes · Biofield</p>\n          </div>\n        </div>\n      </div>\n      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)' }} />\n    </>\n  );\n}\n\n\nfunction ScalarToolbarBanner({\n  liveChatClock,\n  portraitLinkStudentId,\n  onHistory,\n  onLexicon,\n}: {\n  liveChatClock: string;\n  portraitLinkStudentId: string | null;\n  onHistory: () => void;\n  onLexicon: () => void;\n}) {\n  const canvasRef = React.useRef<HTMLCanvasElement>(null);\n  const wrapRef = React.useRef<HTMLDivElement>(null);\n  const rafRef = React.useRef<number>(0);\n\n  React.useEffect(() => {\n    const canvas = canvasRef.current;\n    const wrap = wrapRef.current;\n    if (!canvas || !wrap) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let t = 0;\n    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };\n    resize();\n    const ro = new ResizeObserver(resize);\n    ro.observe(wrap);\n    const waves = [\n      { amp: 0.38, freq: 5,   speed: 1.0, alpha: 0.10, lw: 1.2 },\n      { amp: 0.28, freq: 8,   speed: 1.6, alpha: 0.07, lw: 0.9 },\n      { amp: 0.20, freq: 12,  speed: 2.2, alpha: 0.05, lw: 0.7 },\n      { amp: 0.45, freq: 3.5, speed: 0.7, alpha: 0.06, lw: 1.5 },\n      { amp: 0.15, freq: 18,  speed: 3.0, alpha: 0.04, lw: 0.6 },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0, 0, W, H);\n      waves.forEach((w, wi) => {\n        const phase = (wi / waves.length) * Math.PI * 2;\n        ctx.beginPath();\n        for (let x = 0; x <= W; x += 1.5) {\n          const nx = x / W;\n          const env = Math.sin(nx * Math.PI);\n          const y = H * 0.5 + Math.sin(nx * w.freq * Math.PI * 2 + t * w.speed + phase) * H * w.amp * env;\n          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);\n        }\n        ctx.strokeStyle = `rgba(212,175,55,${w.alpha})`;\n        ctx.lineWidth = w.lw;\n        ctx.stroke();\n      });\n      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1);\n      const grd = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * (0.55 + 0.12 * pulse));\n      grd.addColorStop(0, `rgba(212,175,55,${0.08 + 0.05 * pulse})`);\n      grd.addColorStop(0.5, 'rgba(212,175,55,0.02)');\n      grd.addColorStop(1, 'transparent');\n      ctx.fillStyle = grd;\n      ctx.fillRect(0, 0, W, H);\n      const lg = ctx.createLinearGradient(0, 0, W * 0.35, 0);\n      lg.addColorStop(0, `rgba(212,175,55,${0.06 + 0.03 * pulse})`);\n      lg.addColorStop(1, 'transparent');\n      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);\n      const rg = ctx.createLinearGradient(W, 0, W * 0.65, 0);\n      rg.addColorStop(0, `rgba(212,175,55,${0.04 + 0.02 * pulse})`);\n      rg.addColorStop(1, 'transparent');\n      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);\n      t += 0.014;\n      rafRef.current = requestAnimationFrame(draw);\n    };\n    rafRef.current = requestAnimationFrame(draw);\n    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };\n  }, []);\n\n  const shimmerSeg: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 10px', flex: 1, position: 'relative' };\n  const divider: React.CSSProperties = { position: 'absolute', left: 0, top: '18%', height: '64%', width: 1, background: 'rgba(212,175,55,0.18)' };\n\n  return (\n    <div\n      ref={wrapRef}\n      style={{\n        position: 'relative',\n        borderBottom: '1px solid rgba(212,175,55,0.12)',\n        animation: 'bannerAura 4s ease-in-out infinite',\n      }}\n    >\n      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />\n      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', background: 'rgba(5,5,5,0.55)', backdropFilter: 'blur(18px)' }}>\n\n        {/* Sri Yantra + clock */}\n        <div style={shimmerSeg}>\n          <svg width="18" height="18" viewBox="0 0 100 100" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 3px rgba(212,175,55,0.9)) drop-shadow(0 0 8px rgba(212,175,55,0.5))', animation: 'yPulse 3s ease-in-out infinite' }} xmlns="http://www.w3.org/2000/svg">\n            <circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>\n            <polyline points="50,10 88,72 12,72 50,10" fill="none" stroke="#D4AF37" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>\n            <polyline points="50,22 80,64 20,64 50,22" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.65"/>\n            <polyline points="50,90 12,28 88,28 50,90" fill="none" stroke="#D4AF37" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>\n            <polyline points="50,78 20,36 80,36 50,78" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.65"/>\n            <polyline points="50,34 70,58 30,58 50,34" fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity="0.45"/>\n            <polyline points="50,66 30,42 70,42 50,66" fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity="0.45"/>\n            <circle cx="50" cy="50" r="4" fill="#D4AF37"/>\n            <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="#D4AF37" strokeWidth="0.7" opacity="0.3"/>\n          </svg>\n          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.08em', color: 'rgba(212,175,55,0.6)', fontVariantNumeric: 'tabular-nums' }}>{liveChatClock}</span>\n        </div>\n\n        {/* Students */}\n        <div style={shimmerSeg}>\n          <span style={divider} />\n          <StudentSelector />\n        </div>\n\n        {/* History */}\n        <button type="button" onClick={onHistory} style={{ ...shimmerSeg, background: 'rgba(212,175,55,0.05)', border: 'none', cursor: 'pointer' }}>\n          <span style={divider} />\n          <span style={{ fontSize: 9, color: 'rgba(212,175,55,0.7)' }}>⧖</span>\n          <span className="sqi-master-name-shimmer" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>History</span>\n        </button>\n\n        {/* Lexicon */}\n        <button type="button" onClick={onLexicon} style={{ ...shimmerSeg, background: 'rgba(212,175,55,0.05)', border: 'none', cursor: 'pointer' }}>\n          <span style={divider} />\n          <span style={{ fontSize: 9, color: 'rgba(212,175,55,0.7)' }}>◈</span>\n          <span className="sqi-master-name-shimmer" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Lexicon</span>\n        </button>\n\n      </div>\n    </div>\n  );\n}\n\n\n/** Scalar Wave Composer — Telegram-style input with animated canvas */\nfunction ScalarComposerCanvas({ wrapRef }: { wrapRef: React.RefObject<HTMLDivElement> }) {\n  const canvasRef = React.useRef<HTMLCanvasElement>(null);\n  const rafRef = React.useRef<number>(0);\n  React.useEffect(() => {\n    const canvas = canvasRef.current;\n    const wrap = wrapRef.current;\n    if (!canvas || !wrap) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    let t = 0;\n    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };\n    resize();\n    const ro = new ResizeObserver(resize);\n    ro.observe(wrap);\n    const waves = [\n      { amp:0.32, freq:4.5, speed:0.9, alpha:0.09, lw:1.1 },\n      { amp:0.22, freq:7.5, speed:1.5, alpha:0.06, lw:0.8 },\n      { amp:0.18, freq:11,  speed:2.1, alpha:0.045,lw:0.7 },\n      { amp:0.40, freq:3,   speed:0.6, alpha:0.055,lw:1.4 },\n      { amp:0.12, freq:16,  speed:2.8, alpha:0.035,lw:0.6 },\n    ];\n    const draw = () => {\n      const W = canvas.width, H = canvas.height;\n      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }\n      ctx.clearRect(0,0,W,H);\n      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1);\n      const topGrd = ctx.createLinearGradient(0,0,0,H*0.5);\n      topGrd.addColorStop(0, `rgba(212,175,55,${0.12+0.06*pulse})`);\n      topGrd.addColorStop(1, 'transparent');\n      ctx.fillStyle = topGrd; ctx.fillRect(0,0,W,H);\n      waves.forEach((w,wi) => {\n        const phase = (wi/waves.length)*Math.PI*2;\n        ctx.beginPath();\n        for (let x=0;x<=W;x+=1.5) {\n          const nx=x/W;\n          const env=Math.sin(nx*Math.PI)*0.9+0.1;\n          const y=H*0.35+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+phase)*H*w.amp*env;\n          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);\n        }\n        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`;\n        ctx.lineWidth=w.lw; ctx.stroke();\n      });\n      const grd=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.6);\n      grd.addColorStop(0,`rgba(212,175,55,${0.06+0.04*pulse})`);\n      grd.addColorStop(1,'transparent');\n      ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);\n      t+=0.014;\n      rafRef.current=requestAnimationFrame(draw);\n    };\n    rafRef.current=requestAnimationFrame(draw);\n    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };\n  }, []);\n  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;\n}\n\n\nfunction QuantumApothecaryInner() {\n  const navigate = useNavigate();\n  const location = useLocation();\n  const [searchParams] = useSearchParams();\n  const resumeSessionParam = searchParams.get('session');\n  const { user } = useAuth();\n  const sqiSync = useQuantumSyncState();\n  const { t, language } = useTranslation();\n  const {\n    messages: syncChatRows,\n    loading: syncChatLoading,\n    saveMessage: persistSyncChatTurn,\n    clearMessages: clearSyncChatMessages,\n  } = useChatMessages('apothecary');\n\n  // On mount, sweep any SQI replies that were never accepted by the curator\n  // (tab closed mid-stream, network blip, etc.) and replay them silently.\n  useEffect(() => {\n    if (user?.id) void syncPendingTransmissionsOnce(user.id);\n  }, [user?.id]);\n\n  const [seekerName, setSeekerName] = useState('');\n  useEffect(() => {\n    if (!user?.id) {\n      setSeekerName('');\n      return;\n    }\n    supabase\n      .from('profiles')\n      .select('full_name')\n      .eq('user_id', user.id)\n      .maybeSingle()\n      .then(({ data }) => {\n        const name = data?.full_name?.trim() || user.email?.split('@')[0] || '';\n        setSeekerName(name);\n      });\n  }, [user?.id, user?.email]);\n\n  const jyotish = useJyotishProfile();\n  const linkedActiveStudent = useActiveStudent();\n  const { doshaProfile } = useAyurvedaAnalysis();\n  const sqiField = useSQIFieldContext();\n\n  const appLocale = useMemo(() => languageToBcp47(language), [language]);\n\n  const { browserSupportsSpeechRecognition } = useSpeechRecognition();\n\n  const [isMicListening, setIsMicListening] = useState(false);\n  const micListeningRef = useRef(false);\n  const nativeSpeechRef = useRef<{ stop: () => void; start: () => void; onend: (() => void) | null } | null>(null);\n\n  // Compact natal + assessed prakriti — one pass each; avoids triple-repeating the same Moon line in the model.\n  const jyotishContext = jyotish.isLoading\n    ? ''\n    : (() => {\n        const lines: string[] = [\n          `[NATAL CHART — Swiss Ephemeris / Lahiri — cite each line once, no duplicate paragraphs]`,\n          `Birth Moon nakshatra: ${jyotish.nakshatra} · Birth Moon rashi: ${jyotish.moonSign} · Lagna: ${jyotish.ascendant}`,\n          `Dasha: ${jyotish.mahadasha}${jyotish.mahaEnd ? ` (until ${jyotish.mahaEnd})` : ''} · Antara: ${jyotish.antardasha}`,\n          `Chart dosha emphasis: ${jyotish.primaryDosha} · Karma theme: ${jyotish.karmaFocus}`,\n          `Yogas: ${jyotish.activeYogas.join(', ') || '—'} · Bhrigu: ${jyotish.bhriguCycle || '—'}`,\n          `Healing line: ${jyotish.healingFocus} · Raga ${jyotish.musicRaga} · Tone ${jyotish.musicFrequency} · Mantra: ${jyotish.mantraFocus}`,\n        ];\n        if (doshaProfile) {\n          lines.push(\n            `Ayurveda Prakriti (assessed): ${doshaProfile.primary}${doshaProfile.secondary ? ` / ${doshaProfile.secondary}` : ''}` +\n              (doshaProfile.characteristics?.length\n                ? ` · Traits: ${doshaProfile.characteristics.slice(0, 5).join(', ')}`\n                : ''),\n          );\n        }\n        return lines.join('
');\n      })();\n\n  /** Stable Jyotish context — always include natal chart, then append live field data. */\n  const stableJyotishContext = useMemo(\n    () => {\n      const raw = [jyotishContext, sqiField?.compiledContext].filter((s) => s && s.trim()).join('

');\n      // Strip any [PHOTONIC SESSION ACTIVE] or [TEMPLE FIELD ACTIVE] block whose body\n      // references the removed Biophotonic Nadi Entanglement / Vishwananda Miracle Room transmissions.\n      return raw\n        .split(/\n(?=\[)/)\n        .filter((block) => {\n          const isPhotonic = block.startsWith('[PHOTONIC SESSION ACTIVE]');\n          const isTemple = block.startsWith('[TEMPLE FIELD ACTIVE]');\n          if (!isPhotonic && !isTemple) return true;\n          return !/biophotonic|vishwananda|miracle\s*room/i.test(block);\n        })\n        .join('
');\n    },\n    [\n      sqiField?.compiledContext,\n      jyotishContext,\n    ],\n  );\n\n  const sqiSourceDirective = useMemo(\n    () =>\n      '[SQI SOURCES] Use the seeker’s saved chart (below), live biometric block when present, compiled field (Ayurveda / photonic / temple), and this chat. Do not invent palm-camera analysis.
' +\n      '[FREQUENCY LIBRARY] The canonical Frequency Library names are provided separately (canonicalActivationNames). For every substantive answer, map the seeker’s topic to concrete entries from that list — use exact names. When suggesting remedies, protocols, or “what to run,” include 3–10 relevant library names per topic when appropriate.',\n    [],\n  );\n\n  const answerRulesDirective = useMemo(\n    () =>\n      '[ANSWER RULES] Use ONLY the LIVE SYSTEM TIME line for date/time — do not guess the day. Natal Moon rashi and nakshatra are birth data, not daily transits. Open naturally; do not ritualistically repeat the same Moon sign or dasha in multiple sections.',\n    [],\n  );\n\n  // Live biometric scan context — prepended to jyotishContext before next SQI message\n  const [liveScanContext, setLiveScanContext] = useState<string | null>(null);\n\n  /** Debounce: only recompute when underlying field data changes, not on every parent render. */\n  const stableCompiledContext = useMemo(\n    () => stripDuplicateBiometricBlock(sqiField.compiledContext, !!liveScanContext?.trim()),\n    [\n      liveScanContext,\n      sqiField.nadi?.activatedNadi,\n      sqiField.nadi?.heartRate,\n      sqiField.nadi?.hrvRmssd,\n      sqiField.nadi?.respiratoryRate,\n      sqiField.nadi?.pranaCoherence,\n      sqiField.nadi?.vagalTone,\n      sqiField.nadi?.autonomicBalance,\n      sqiField.nadi?.scannedAt,\n      sqiField.ayurveda?.prakriti,\n      sqiField.photonic?.activeProtocol,\n      sqiField.photonic?.frequency,\n      sqiField.photonic?.lightCodeActive,\n      sqiField.temple?.activeSite,\n      sqiField.temple?.intensity,\n    ],\n  );\n\n  const TRANSMISSIONS_KEY = `sqi-transmissions-${user?.id || 'guest'}`;\n\n  /** Legacy baseline card removed — drop stale local nadi snapshot so Dashboard does not resurrect fake counts. */\n  useEffect(() => {\n    try {\n      localStorage.removeItem('sqi_scan_result');\n    } catch {\n      /* ignore */\n    }\n  }, []);\n\n  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);\n  const selectedActivationsRef = useRef<Activation[]>([]);\n  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>(() => {\n    try {\n      const uid = user?.id || 'guest';\n      const key = `sqi-transmissions-${uid}`;\n      let saved = localStorage.getItem(key);\n      if (!saved) saved = localStorage.getItem('active_resonators');\n      const raw = saved ? JSON.parse(saved) : [];\n      return purgeExpiredAndLegacy(raw);\n    } catch {\n      return [];\n    }\n  });\n\n  // Ref holding the most recent quantum anchor (voice FFT fingerprint + scan metadata).\n  // Preserved across all upserts so chat-activated transmissions inherit the user's
  // voice biometric address — giving them the same quantum anchor as voice-scan transmissions.
  const quantumAnchorRef = useRef<Record<string, unknown> | null>(null);

  // Load existing quantum anchor from Supabase on mount
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_active_transmissions')
      .select('quantum_anchor')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.quantum_anchor) {
          quantumAnchorRef.current = data.quantum_anchor as Record<string, unknown>;
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Auto-release expired transmissions on mount and whenever list changes
  useEffect(() => {
    const now = new Date();
    setActiveTransmissions(prev => {
      const live = prev.filter(t => {
        if (!t.expiresAt) return true;
        return new Date(t.expiresAt) > now;
      });
      if (live.length !== prev.length) {
        // Persist the cleaned list
        try {
          localStorage.setItem(`sqi-transmissions-${user?.id || 'guest'}`, JSON.stringify(live));
        } catch { /* ignore */ }
      }
      return live;
    });
  }, []); // run once on mount

  const skipNextTxHydrate = useRef(true);
  useLayoutEffect(() => {
    if (skipNextTxHydrate.current) {
      skipNextTxHydrate.current = false;
      return;
    }
    const key = `sqi-transmissions-${user?.id || 'guest'}`;
    try {
      let raw = localStorage.getItem(key);
      if (!raw) raw = localStorage.getItem('active_resonators');
      // Only override from localStorage if it has data — otherwise Supabase load wins
      if (raw) {
        setActiveTransmissions(JSON.parse(raw));
      }
      // If localStorage is empty, Supabase useEffect below will hydrate
    } catch {
      // localStorage empty/corrupt — Supabase will hydrate
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('user_active_transmissions')
          .select('activations')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.activations && Array.isArray(data.activations) && data.activations.length > 0) {
          const live = purgeExpiredAndLegacy(data.activations as Activation[]);
          skipNextTxHydrate.current = true;
          setActiveTransmissions(live);
        }
      } catch {
        /* ignore */
      }
    };
    void load();
  }, [user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(TRANSMISSIONS_KEY, JSON.stringify(activeTransmissions));
    } catch {
      /* ignore */
    }
  }, [activeTransmissions, TRANSMISSIONS_KEY]);

  useEffect(() => {
    if (!user?.id) return;
    // Always upsert so dissolving transmissions clears other devices.
    // Preserve quantum_anchor — ensures chat-activated transmissions inherit
    // the user's voice FFT fingerprint as the quantum delivery address.
    const payload: Record<string, unknown> = {
      user_id: user.id,
      activations: activeTransmissions as unknown as Record<string, unknown>[],
      updated_at: new Date().toISOString(),
    };
    if (quantumAnchorRef.current) {
      payload.quantum_anchor = quantumAnchorRef.current;
    }
    void supabase.from('user_active_transmissions').upsert(payload, { onConflict: 'user_id' });
  }, [activeTransmissions, user?.id]);

  // ── Realtime: sync activeTransmissions across devices ──
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`qa-tx-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_active_transmissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          if (!data?.activations) return;
          const live = purgeExpiredAndLegacy(data.activations as Activation[]);
          skipNextTxHydrate.current = true;
          setActiveTransmissions(live);
          try {
            localStorage.setItem(`sqi-transmissions-${user.id}`, JSON.stringify(live));
          } catch { /* ignore */ }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || activeTransmissions.length === 0) return;
    supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: 'active_transmissions',
        activity_data: {
          transmissions: activeTransmissions.map((t) => t.name || t.sacredName),
          count: activeTransmissions.length,
          timestamp: new Date().toISOString(),
        },
      })
      .then(() => {})
      .catch(() => {});
  }, [activeTransmissions, user?.id]);

  const activeTransmissionContext = useMemo(
    () =>
      activeTransmissions.length > 0
        ? `
ACTIVE SCALAR TRANSMISSIONS (running 24/7 in biofield):
` +
          activeTransmissions.map((t) => `· ${t.sacredName || t.name}`).join('\n') +
          `
→ These ${activeTransmissions.length} frequencies are permanently` +
          ` entangled. Reference them when reading the Seeker's field.
`
        : '',
    [activeTransmissions],
  );

  const dissolveTransmission = useCallback((id: string) => {
    setActiveTransmissions((prev) => prev.filter((t) => t.id !== id && t.name !== id));
  }, []);

  const activeTransmissionKeys = useMemo(() => {
    const s = new Set<string>();
    for (const tx of activeTransmissions) {
      if (tx.id) s.add(tx.id);
      if (tx.name) s.add(tx.name.toLowerCase());
    }
    return s;
  }, [activeTransmissions]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMsgKey, setCopiedMsgKey] = useState<string | null>(null);
  const handleCopyMsg = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedMsgKey(key);
    setTimeout(() => setCopiedMsgKey((c) => (c === key ? null : c)), 2000);
  };

  const [portraitLinkStudentId, setPortraitLinkStudentId] = useState<string | null>(() =>
    getActiveStudentId(),
  );
  useEffect(() => {
    const sync = () => setPortraitLinkStudentId(getActiveStudentId());
    window.addEventListener('sqi:active-student-changed', sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sqi_active_student_id') sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('sqi:active-student-changed', sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ─── ACTIVE STUDENT SOUL RECORD ─────────────────────────────────────────────
  // When a student is selected, fetch their birth data + transmission count
  // and inject as context so SQI reads every question as being about THIS student.
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeStudentTxCount, setActiveStudentTxCount] = useState<number>(0);
  const [activeStudentJyotish, setActiveStudentJyotish] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Wellness');
  useEffect(() => {
    let cancelled = false;
    const sid = portraitLinkStudentId;
    if (!sid) {
      setActiveStudent(null);
      setActiveStudentTxCount(0);
      return;
    }
    (async () => {
      try {
        const [s, txRes] = await Promise.all([
          getStudent(sid),
          supabase
            .from('transmission_blocks')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', sid),
        ]);
        if (cancelled) return;
        setActiveStudent(s);
        setActiveStudentTxCount(txRes.count ?? 0);

        // Fetch student Jyotish profile if they have a linked app account
        const linkedId = (s as any)?.linked_user_id;
        if (linkedId) {
          try {
            const { data: jp } = await supabase
              .from('jyotish_profiles')
              .select('moon_nakshatra, moon_longitude, ascendant, sun_sign, dasha_data, birth_date, birth_time, birth_place')
              .eq('user_id', linkedId)
              .maybeSingle();
            if (!cancelled) setActiveStudentJyotish(jp ?? null);
          } catch {
            if (!cancelled) setActiveStudentJyotish(null);
          }
        } else {
          if (!cancelled) setActiveStudentJyotish(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[apothecary] failed to load active student record', e);
          setActiveStudent(null);
          setActiveStudentTxCount(0);
          setActiveStudentJyotish(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portraitLinkStudentId]);

  const studentContext = useMemo(() => {
    if (!activeStudent) return '';

    // Build real Jyotish section from linked profile
    let jyotishLines: string[] = [];
    if (activeStudentJyotish) {
      const jp = activeStudentJyotish;
      const dd = jp.dasha_data ?? {};
      const maha = dd.activeMaha?.planet || '—';
      const antar = dd.activeAntar?.planet || '—';
      const RASHI = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                     'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
      const moonSign = (typeof jp.moon_longitude === 'number' && jp.moon_longitude > 0)
        ? RASHI[Math.floor((((jp.moon_longitude % 360) + 360) % 360) / 30)]
        : '—';
      jyotishLines = [
        `[STUDENT JYOTISH — REAL EPHEMERIS DATA — USE THIS CHART NOT THE PRACTITIONER'S]`,
        `Nakshatra: ${jp.moon_nakshatra || '—'} · Rashi: ${moonSign} · Lagna: ${jp.ascendant || '—'} · Sun: ${jp.sun_sign || '—'}`,
        `Mahadasha: ${maha} · Antardasha: ${antar}`,
        `ZERO FABRICATION LAW: The Dasha above comes from Swiss Ephemeris. Apply it exactly. Do NOT substitute any other Dasha period.`,
        `Apply ALL past life, Nadi, and health readings to THIS student chart — not the practitioner's.`,
      ].filter(Boolean);
    } else if (activeStudent.birth_date) {
      jyotishLines = [
        `[STUDENT BIRTH DATA — JYOTISH PROFILE NOT YET LINKED]`,
        `Birth: ${activeStudent.birth_date}${activeStudent.birth_time ? ' at ' + activeStudent.birth_time : ''}${activeStudent.birth_place ? ', ' + activeStudent.birth_place : ''}`,
        `Use birth data to approximate Nakshatra and Dasha. State approximation clearly.`,
        `DO NOT state fabricated Dasha as confirmed fact. Say "approximately" or "from these coordinates, the Nakshatra suggests..."`,
      ];
    }

    return [
      `[STUDENT READING — SUBJECT IS THE STUDENT: ${activeStudent.name} — NOT THE PRACTITIONER]`,
      `Name: ${activeStudent.name}`,
      `Birth Date: ${activeStudent.birth_date ?? 'not provided'}`,
      `Birth Time: ${activeStudent.birth_time ?? 'not provided'}`,
      `Birth Place: ${activeStudent.birth_place ?? 'not provided'}`,
      activeStudent.notes ? `Notes: ${activeStudent.notes}` : null,
      `Active Transmissions: ${activeStudentTxCount}`,
      jyotishLines.length > 0 ? jyotishLines.join('\n') : null,
      `Read ALL questions in this session as being about this student.`,
    ]
      .filter(Boolean)
      .join('\n');
  }, [activeStudent, activeStudentTxCount, activeStudentJyotish]);
  const [libraryUnlocked, setLibraryUnlockedLocal] = useState(() => {
    try {
      return localStorage.getItem(LS_LIBRARY_UNLOCKED) === '1';
    } catch {
      return false;
    }
  });
  const setLibraryUnlocked = useCallback((v: boolean) => {
    setLibraryUnlockedLocal(v);
    sqiSync.setLibraryUnlocked(v);
  }, [sqiSync]);

  const [scanCooldownUntilMs, setScanCooldownUntilMsLocal] = useState<number | null>(() => {
    try {
      const last = localStorage.getItem(LS_LAST_SCAN);
      if (!last) return null;
      const t = parseInt(last, 10);
      return Number.isNaN(t) ? null : t + 24 * 60 * 60 * 1000;
    } catch {
      return null;
    }
  });
  const setScanCooldownUntilMs = useCallback((v: number | null) => {
    setScanCooldownUntilMsLocal(v);
  }, []);

  // ── Admin: reset scan cooldown immediately ──────────────────────
  const isAdmin = user?.id === 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';
  const handleAdminResetCooldown = useCallback(() => {
    try {
      // Only clear the cooldown timer — never touch scan results or activated boosts
      localStorage.removeItem('sqi_last_scan');
    } catch {}
    setScanCooldownUntilMs(null);
  }, [setScanCooldownUntilMs]);

  // ── Override from Supabase once loaded (cross-device restore) ──
  useEffect(() => {
    if (!sqiSync.ready) return;
    if (sqiSync.libraryUnlocked) setLibraryUnlockedLocal(true);
    if (sqiSync.lastScanAt) {
      const cooldown = sqiSync.lastScanAt + 24 * 60 * 60 * 1000;
      if (cooldown > Date.now()) setScanCooldownUntilMsLocal(cooldown);
    }
  }, [sqiSync.ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const [apothecaryMainTab, setApothecaryMainTab] = useState<'library' | 'archive'>('library');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resonanceMatches, setResonanceMatches] = useState<
    Array<Activation & { pct: number; rowCategory?: string }>
  >([]);

  // ⟁ RESTORE Top 33 from last voice scan on mount (localStorage fast-path)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sqi_top33_matches');
      const ts = parseInt(localStorage.getItem('sqi_top33_ts') || '0', 10);
      if (saved && Date.now() - ts < 24 * 60 * 60 * 1000) {
        setResonanceMatches(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ⟁ Override from Supabase after load (cross-device restore for Top 33)
  useEffect(() => {
    if (!sqiSync.ready || !sqiSync.top33Matches?.length) return;
    const ts = sqiSync.top33MatchesTs ?? 0;
    if (Date.now() - ts < 24 * 60 * 60 * 1000) {
      setResonanceMatches(sqiSync.top33Matches as Array<Activation & { pct: number; rowCategory?: string }>);
    }
  }, [sqiSync.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ⟁ Top 33 is owned exclusively by the LAST voice scan (restored above from sqi_top33_matches).
  // The previous effect that rebuilt the Top 33 from LS_SCAN_SNAPSHOT on mount was REMOVED —
  // it caused 3-5 new entries to appear each page open because matchActivationsToScan re-ranked.


  const [showKnowledge, setShowKnowledge] = useState(false);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  // ⟁ Session id is scoped per-user in localStorage so it cannot leak between
  // accounts on the same device. We do NOT read any global key at init — the
  // effect below hydrates it once the authenticated user is known.
  const sessionStorageKey = user?.id ? `sqi_current_session_id:${user.id}` : null;
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  useEffect(() => {
    // Clean up the legacy un-scoped key so no other account can inherit it.
    try { localStorage.removeItem('sqi_current_session_id'); } catch { /* ignore */ }
    if (!sessionStorageKey) {
      setCurrentSessionId(null);
      return;
    }
    try {
      const v = localStorage.getItem(sessionStorageKey);
      setCurrentSessionId(v && v.length > 0 ? v : null);
    } catch {
      setCurrentSessionId(null);
    }
  }, [sessionStorageKey]);

  const handleSaveAIMessageToCodex = useCallback(
    (assistantMsg: Message, globalIndex: number) => {
      if (!user?.id || !(assistantMsg.text || '').trim()) return;
      let userPrompt: string | undefined;
      for (let j = globalIndex - 1; j >= 0; j--) {
        if (messages[j]?.role === 'user') {
          userPrompt = messages[j].text;
          break;
        }
      }
      const activeStudentId = getActiveStudentId();
      void curateTransmission({
        source_type: 'apothecary',
        raw_content: assistantMsg.text,
        user_prompt: userPrompt,
        source_chat_id: currentSessionId ?? null,
        routing_override: 'force_portrait',
        ...(activeStudentId ? { student_id: activeStudentId } : {}),
      });
    },
    [user?.id, messages, currentSessionId],
  );

  const [sessions, setSessions] = useState<{ id: string; title: string | null; updated_at: string | null }[]>([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const chatTopRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamAccumRef = useRef('');
  const streamingMsgIdRef = useRef('');
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const composerWrapRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyRecognitionRef = useRef<{ stop: () => void } | null>(null);
  const voiceTranscriptRef = useRef('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceBiofieldResult | null>(null);
  const [showVoiceScan, setShowVoiceScan] = useState(true);
  const [showAllTop33, setShowAllTop33] = useState(false);
  const [cardTxOpen, setCardTxOpen] = useState(false);
  const [cardVoiceOpen, setCardVoiceOpen] = useState(true);  // Open by default — first thing user sees
  const [cardT33Open, setCardT33Open] = useState(false);
  const [cardLibOpen, setCardLibOpen] = useState(true);  // Open by default — frequencies visible immediately

  useEffect(() => {
    try {
      sessionStorage.setItem(QA_VOICE_TAB_KEY, showVoiceScan ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [showVoiceScan]);

  /** Live HH:MM in chat header — same pattern as Home Nexus dashboard (ticks every 30s). */
  const [liveChatClock, setLiveChatClock] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setLiveChatClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`);
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);

  const voiceContextBlock = useMemo(
    () => (voiceResult ? buildVoiceFieldContext(voiceResult) : ''),
    [voiceResult],
  );

  /** One string for scan prompt + chat edge: exact Frequency Library names (incl. full LimbicArc bioenergetic list). */
  const canonicalActivationNameLines = useMemo(
    () => ALL_ACTIVATIONS.map((a) => a.name).join('\n'),
    [],
  );

  const activeTransmissionNamesCsv = useMemo(
    () =>
      activeTransmissions
        .map((t) => t.name)
        .filter(Boolean)
        .join(', '),
    [activeTransmissions],
  );

  /** Prefix reminds model what's live in-field; body stays full canonical list for exact naming */
  const canonicalActivationPayload = useMemo(
    () =>
      [
        activeTransmissionNamesCsv
          ? `CURRENTLY_ACTIVE_TRANSMISSION_NAMES (prefer not to duplicate unless seeker asks): ${activeTransmissionNamesCsv}`
          : '',
        canonicalActivationNameLines,
      ]
        .filter(Boolean)
        .join('\n'),
    [activeTransmissionNamesCsv, canonicalActivationNameLines],
  );

  const sqiTop33ChatBlock = useMemo(() => {
    if (!resonanceMatches.length) return '';
    const lines = resonanceMatches.slice(0, 33).map(
      (r, i) =>
        `${i + 1}. ${r.name} — ${r.pct}% (${r.rowCategory || r.category || 'biofield match'})`,
    );
    return [
      `TOP ${Math.min(33, resonanceMatches.length)} BIOFIELD MATCHES (ranked — cite EXACT names):`,
      ...lines,
      'Prioritize these exact spellings when recommending LimbicArc / Frequency Library transmissions.',
    ].join('\n');
  }, [resonanceMatches]);

  /** Hydrate thread from Supabase sync table once (cross-device); skip when resuming a History session from URL. */
  const syncHydratedOnceRef = useRef(false);
  useEffect(() => {
    if (syncChatLoading) return;
    if (resumeSessionParam) return;
    if (syncHydratedOnceRef.current) return;
    syncHydratedOnceRef.current = true;
    if (!syncChatRows.length) return;
    // ⟁ Only hydrate today's messages — yesterday's session must not reappear.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const todaysRows = syncChatRows.filter((cm) => {
      if (!cm.created_at) return false;
      return new Date(cm.created_at).getTime() >= todayMs;
    });
    if (!todaysRows.length) return;
    setMessages(
      todaysRows.map((cm) => ({
        role: cm.role === 'assistant' ? 'model' : 'user',
        text: cm.content,
        timestamp: cm.created_at ? new Date(cm.created_at).getTime() : Date.now(),
        id: cm.id,
      })),
    );
    prevMsgCountRef.current = todaysRows.length;
  }, [syncChatLoading, resumeSessionParam, syncChatRows]);

  // ââ Scroll: single effect, only when a new message is appended ââ
  const prevMsgCountRef = useRef(messages.length);

  const flushSqiLocalStorage = useCallback(() => {
    try {
      if (currentSessionId && sessionStorageKey) {
        localStorage.setItem(sessionStorageKey, currentSessionId);
      }
    } catch { /* ignore quota / private mode */ }
  }, [currentSessionId, sessionStorageKey]);

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
    if (count <= prevMsgCountRef.current) return;
    prevMsgCountRef.current = count;
    const last = messages[count - 1];
    // ⟁ When the seeker sends a new message, anchor THEIR question at the top
    // of the chat viewport so they can read SQI's reply without manually scrolling.
    // For streaming AI replies (which arrive token-by-token), do not auto-scroll —
    // keep the seeker's question stable in view.
    if (last?.role !== 'user') return;
    const timer = setTimeout(() => {
      const userMsgId = last.id ?? `qa-msg-${count - 1}-${last.timestamp ?? 'na'}-user`;
      const node = chatPanelRef.current?.querySelector(
        `[data-qa-msg-key="${CSS.escape(userMsgId)}"]`,
      ) as HTMLElement | null;
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [messages]);

  const scrollChatToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const scrollChatToTop = useCallback(() => {
    chatTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const normalizeActivationForMixer = useCallback((act: Activation): Activation => {
    const name = act.name?.trim() || '';
    const id =
      act.id && String(act.id).trim()
        ? String(act.id).trim()
        : `bio_${name.replace(/\s+/g, '_').toLowerCase()}`;
    const sacredName = act.sacredName || (name ? `${name} Transmission` : 'Transmission');
    const chakra = (act as Activation & { chakra?: string }).chakra;
    const benefit =
      act.benefit ||
      [act.category, chakra].filter(Boolean).join(' · ');
    return {
      ...act,
      id,
      name: name || id,
      sacredName,
      benefit: benefit || act.vibrationalSignature || sacredName,
      vibrationalSignature: act.vibrationalSignature || sacredName,
      type: act.type ?? 'Bioenergetic',
      color: act.color || '#60a5fa',
      // Preserve quantum anchor fields through mixer normalization
      frequencyHash: act.frequencyHash,
      activatedAt: act.activatedAt,
      expiresAt: act.expiresAt,
      source: act.source,
    };
  }, []);

  const autoActivateFromSQIResponse = useCallback(
    (responseText: string) => {
      if (!responseText || ALL_ACTIVATIONS.length === 0) return;

      const lowerText = responseText.toLowerCase();
      const byNameLen = [...ALL_ACTIVATIONS].sort(
        (a, b) => (b.name?.length || 0) - (a.name?.length || 0),
      );
      const matched: Array<Activation & { pct: number; rowCategory?: string }> = [];

      for (const activation of byNameLen) {
        const lowerName = (activation.name || '').toLowerCase();
        if (!lowerName.trim()) continue;
        if (lowerText.includes(lowerName)) {
          matched.push({
            ...activation,
            pct: 100,
            rowCategory: activation.category ?? '',
          });
        }
      }

      if (matched.length === 0) return;

      const enriched = matched
        .filter((m) => isVegetarianActivation(m))
        .map((m) => enrichTransmission(normalizeActivationForMixer(m), 'apothecary_chat'));

      if (enriched.length === 0) return;

      let addedForToast: typeof enriched = [];
      setActiveTransmissions((prev) => {
        const existingIds = new Set(prev.map((t) => t.id ?? t.name));
        const toAdd = enriched.filter((e) => !existingIds.has(e.id ?? e.name));
        addedForToast = toAdd;
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });

      if (addedForToast.length > 0) {
        toast.success(
          `⟁ ${addedForToast.length} SQI transmission${addedForToast.length > 1 ? 's' : ''} activated to your field:
` +
            addedForToast.map((t) => `· ${t.name}`).join('\n'),
          { duration: 5000 },
        );
      }

      // ⟁ Top 33 panel is owned exclusively by the voice biofield scan.
      // SQI text mentions activate transmissions silently (above) but must NOT
      // append to the Top 33 list — that prevented "5 new entries appearing per reply".
    },
    [normalizeActivationForMixer],
  );

  useEffect(() => {
    const state = location.state as { openSessions?: boolean; focusChat?: boolean } | null;
    const openSessions = state?.openSessions ?? state?.focusChat;
    if (!openSessions || loadingSessions) return;
    const t = setTimeout(() => setSessionsOpen(true), 400);
    return () => clearTimeout(t);
  }, [location.state, loadingSessions]);
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

  useEffect(() => {
    if (!user?.id || !resumeSessionParam) return;
    let cancelled = false;
    void (async () => {
      const { data: sqiRow } = await supabase
        .from('sqi_sessions')
        .select('messages')
        .eq('id', resumeSessionParam)
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (sqiRow?.messages && Array.isArray(sqiRow.messages)) {
        const loaded = sqiRow.messages as Message[];
        setCurrentSessionId(resumeSessionParam);
        setMessages(loaded);
        prevMsgCountRef.current = loaded.length;
        try {
          if (sessionStorageKey) localStorage.setItem(sessionStorageKey, resumeSessionParam);
        } catch {
          /* ignore */
        }
        return;
      }
      const { data: arch } = await supabase
        .from('user_chat_sessions')
        .select('messages, chat_type')
        .eq('id', resumeSessionParam)
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled || !arch || arch.chat_type !== 'apothecary' || !Array.isArray(arch.messages)) return;
      const mapped = mapUserChatArchiveToSqiMessages(arch.messages);
      setCurrentSessionId(resumeSessionParam);
      setMessages(mapped);
      prevMsgCountRef.current = mapped.length;
      try {
        if (sessionStorageKey) localStorage.setItem(sessionStorageKey, resumeSessionParam);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, resumeSessionParam]);

  // ââ ALL HANDLERS UNCHANGED ââ
  const openChatFullscreenIfMobile = () => { return; };

  const startFreshApothecaryChat = useCallback(() => {
    if (isTyping) return;
    if (!window.confirm(t('quantumApothecaryChat.newChat'))) return;
    try {
      if (sessionStorageKey) localStorage.removeItem(sessionStorageKey);
    } catch { /* ignore */ }
    void clearSyncChatMessages();
    syncHydratedOnceRef.current = false;
    setCurrentSessionId(null);
    setInput('');
    setPendingImage(null);
    setIsTyping(false);
    setMessages([]);
    prevMsgCountRef.current = 0;
    setSessionsOpen(false);
  }, [isTyping, clearSyncChatMessages, sessionStorageKey]);

  const handleSendMessage = async (
    overrideText?: string,
    opts?: { voiceSnapshot?: VoiceBiofieldResult },
  ) => {
    if (isTyping) return;
    const text = (overrideText ?? input).trim();
    if (!text && !pendingImage) return;
    openChatFullscreenIfMobile();
    const displayText = text || (pendingImage ? '[Image attached]' : '');
    const userMsg: Message = { role: 'user', text: displayText, timestamp: Date.now() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    void persistSyncChatTurn({ role: 'user', content: displayText });
    setInput('');
    // Reset textarea height after clearing
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }
    const imageToSend = pendingImage ?? undefined;
    setPendingImage(null);
    setIsTyping(true);
    const streamMsgId = `sqi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    streamingMsgIdRef.current = streamMsgId;
    streamAccumRef.current = '';
    const upsert = (chunk: string) => {
      streamAccumRef.current += chunk;
      const acc = streamAccumRef.current;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === streamMsgId);
        if (idx >= 0) {
          return prev.map((m, i) => (i === idx ? { ...m, text: acc } : m));
        }
        return [...prev, { role: 'model', text: acc, timestamp: Date.now(), id: streamMsgId }];
      });
    };
    const persistMessages = async (finalMessages: Message[]) => {
      if (!user) return;
      try {
        const payload = { user_id: user.id, title: (currentSessionId ? undefined : userMsg.text.slice(0, 80) || t('quantumApothecaryChat.defaultTitle')) ?? t('quantumApothecaryChat.defaultTitle'), messages: finalMessages };
        if (!currentSessionId) {
          const { data, error } = await supabase.from('sqi_sessions').insert(payload).select('id, title, updated_at').single();
          if (!error && data) {
            setCurrentSessionId(data.id);
            setSessions((prev) => {
              const without = prev.filter((s) => s.id !== data.id);
              return [data, ...without];
            });
            const archiveTitle =
              (typeof data.title === 'string' && data.title.trim() ? data.title : payload.title) || t('quantumApothecaryChat.defaultTitle');
            void syncApothecaryUserChatArchive(user.id, data.id, archiveTitle, finalMessages);
          }
        } else {
          const { data, error } = await supabase
            .from('sqi_sessions')
            .update({
              title: payload.title ?? undefined,
              messages: finalMessages,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentSessionId)
            .select('id, title, updated_at')
            .single();
          if (!error && data) {
            setSessions((prev) => {
              const without = prev.filter((s) => s.id !== data.id);
              return [data, ...without];
            });
            const archiveTitle =
              (typeof data.title === 'string' && data.title.trim() ? data.title : payload.title) || t('quantumApothecaryChat.defaultTitle');
            void syncApothecaryUserChatArchive(user.id, currentSessionId, archiveTitle, finalMessages);
          }
        }
      } catch (err) {
        console.error('Failed to persist SQI session', err);
      }
    };
    try {
      // Build enriched context: live datetime + biometric scan + SQI field + birth chart
      const _now = new Date();
      const _tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const liveDateTime = _now.toLocaleString(appLocale, {
        timeZone: _tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const dayPhase = getLocalDayPhaseLabel(_now);
      const liveContext = `LIVE SYSTEM TIME: ${liveDateTime} (${_tz}). This is the confirmed device-local time. Use ONLY this for date/day/time — do not infer or recalculate.
LOCAL DAY PHASE: ${dayPhase} — align tone and greetings with morning / midday / evening / night (device-local clock).`;

      const voiceScanBlock =
        opts?.voiceSnapshot != null ? buildVoiceFieldContext(opts.voiceSnapshot) : voiceContextBlock;
      const fieldParts: string[] = [sqiSourceDirective, answerRulesDirective, liveContext];
      if (studentContext) fieldParts.unshift(studentContext);
      // Voice/biometric scans are captured live from the practitioner's own
      // device mic/camera mid-session — they cannot represent a remote
      // student and must not be presented as if they do.
      if (!studentContext) {
        if (voiceScanBlock) fieldParts.push(voiceScanBlock);
        if (liveScanContext) fieldParts.push(liveScanContext);
      }
      // The practitioner's own natal chart and live biometric/Ayurveda field
      // data must NEVER be sent during a student reading — it was unlabeled
      // as to whose data it was, and the model was picking it over the
      // student's (sometimes incomplete) block, misattributing the
      // practitioner's real chart to the student.
      if (!studentContext) {
        if (stableCompiledContext) fieldParts.push(stableCompiledContext);
        if (stableJyotishContext) fieldParts.push(stableJyotishContext);
      }
      if (activeTransmissionContext) fieldParts.push(activeTransmissionContext);
      const enrichedJyotishContext = fieldParts.join('\n\n');

      // Shared completion handler — runs whether direct Gemini or edge-function streaming finishes.
      const onComplete = async () => {
        setIsTyping(false);
        const finalText = streamAccumRef.current;
        const activeStudentId = getActiveStudentId();
        const assistantMsg: Message = {
          role: 'model',
          text: finalText,
          timestamp: Date.now(),
          id: streamMsgId,
          needs_codex_sync: !!(user?.id && finalText?.trim()),
          codex_student_id: activeStudentId ?? null,
        };
        const persistedMessages = [...allMsgs, assistantMsg];
        await persistMessages(persistedMessages);
        void persistSyncChatTurn({ role: 'assistant', content: finalText });
        setTimeout(() => autoActivateFromSQIResponse(finalText), 100);
        if (user?.id && finalText?.trim()) {
          const sessionIdAtSend = currentSessionId;
          void curateTransmission({
            source_type: 'apothecary',
            raw_content: finalText,
            user_prompt: userMsg.text,
            source_chat_id: sessionIdAtSend ?? null,
            routing_override: 'force_portrait',
            ...(activeStudentId ? { student_id: activeStudentId } : {}),
          }).then(async (results) => {
            const r = results?.[0];
            if (!r || (!r.ok && !r.excluded)) return;
            try {
              const sid = sessionIdAtSend ?? currentSessionId;
              if (!sid) return;
              const { data: row } = await supabase
                .from('sqi_sessions')
                .select('messages')
                .eq('id', sid)
                .maybeSingle();
              const msgs = (row?.messages as Message[] | undefined) ?? [];
              let mutated = false;
              const next = msgs.map((m) => {
                if (m.id === streamMsgId && m.needs_codex_sync) {
                  mutated = true;
                  return { ...m, needs_codex_sync: false };
                }
                return m;
              });
              if (mutated) {
                await supabase.from('sqi_sessions').update({ messages: next }).eq('id', sid);
              }
            } catch (e) {
              console.warn('[codex-sync] failed to clear flag after curator success', e);
            }
          });
        }
      };

      await streamChatWithSQI(
          allMsgs,
          upsert,
          onComplete,
          imageToSend,
          user?.id ?? null,
          language,
          seekerName || undefined,
          canonicalActivationPayload,
          enrichedJyotishContext,
          appLocale,
          sqiTop33ChatBlock,
          activeTransmissionNamesCsv,
          studentContext,
          activeStudent?.id ?? null,
          activeStudent?.name ?? null,
        );
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: t('quantumApothecary.chat.transmissionError'), timestamp: Date.now() }]);
      setIsTyping(false);
    }
  };

  const addActivation = useCallback(
    (act: Activation) => {
      const normalized = normalizeActivationForMixer(act);
      const current = selectedActivationsRef.current;
      const isDuplicate = current.some(
        (a) =>
          a.id === normalized.id ||
          (normalized.name &&
            a.name?.toLowerCase() === normalized.name.toLowerCase()),
      );
      if (isDuplicate || current.length >= AETHERIC_MIXER_MAX_SLOTS) return;
      const next = [...current, normalized];
      selectedActivationsRef.current = next;
      setSelectedActivations(next);
    },
    [normalizeActivationForMixer],
  );

  const removeActivation = useCallback((actId: string) => {
    const next = selectedActivationsRef.current.filter(
      (a) => a.id !== actId && a.name !== actId,
    );
    selectedActivationsRef.current = next;
    setSelectedActivations(next);
  }, []);

  const handleVoiceBiofieldComplete = useCallback(
    (result: VoiceBiofieldResult) => {
      setVoiceResult(result);
      try {
        const scanNow = Date.now();
        localStorage.setItem(LS_LAST_SCAN, String(scanNow));
        localStorage.setItem(LS_LIBRARY_UNLOCKED, '1');
        const payload = voiceResultToScanPayload(result);
        localStorage.setItem(LS_SCAN_SNAPSHOT, JSON.stringify(payload));
        setLibraryUnlocked(true);
        setScanCooldownUntilMs(scanNow + 24 * 60 * 60 * 1000);
        const ownedIds = new Set(activeTransmissions.map((a) => a.id));
        const top33 = buildTop33Rankings(payload, 600, ownedIds);
        setResonanceMatches(top33);
        // ── Cross-device sync: push scan state to Supabase ──
        sqiSync.setLastScanAt(scanNow);
        sqiSync.setScanSnapshot(payload);
        sqiSync.setTop33Matches(top33, scanNow);
        setShowAllTop33(false);
        // Persist voice scan frequencies + quantum anchor to Supabase
        if (user?.id && top33?.length) {
          (async () => {
            try {
              const { data: existing } = await supabase
                .from('user_active_transmissions')
                .select('activations, quantum_anchor')
                .eq('user_id', user.id)
                .maybeSingle();
              const current = (existing?.activations as any[]) || [];
              const nonScan = current.filter((a: any) => a.source !== 'voice_scan');

              // Build enriched scan frequencies with frequency hashes (quantum signatures)
              const scanFreqs = await Promise.all(top33.slice(0, 10).map(async (item: any) => {
                const full = ALL_ACTIVATIONS.find((a: any) =>
                  a.id === item.id ||
                  (a.name && item.name && a.name.toLowerCase() === item.name.toLowerCase())
                );
                const base = full || item;
                const enriched = enrichTransmission({
                  id: base.id || `scan_${(base.name || '').replace(/\s+/g,'_').toLowerCase()}`,
                  name: base.name || item.name,
                  type: base.type || item.type || 'Bioenergetic',
                  benefit: base.benefit || '',
                  vibrationalSignature: base.vibrationalSignature || '',
                  color: base.color || '#D4AF37',
                  source: 'voice_scan',
                } as any, 'voice_scan');
                // Generate async SHA-256 frequency hash (the digital ingredient signature)
                const frequencyHash = await generateFrequencyHash(enriched).catch(() => enriched.frequencyHash || '');
                return { ...enriched, frequencyHash };
              }));

              // Build the quantum anchor from this voice scan
              // This is the user's unique biometric address that links them to the ingredient hashes
              const quantumAnchor = buildQuantumAnchor(result);
              // Store in ref so all subsequent upserts (chat, manual) reuse this anchor
              quantumAnchorRef.current = quantumAnchor as unknown as Record<string, unknown>;

              await supabase
                .from('user_active_transmissions')
                .upsert({
                  user_id: user.id,
                  activations: [...nonScan, ...scanFreqs],
                  quantum_anchor: quantumAnchor as any,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
            } catch (e) { console.warn('[SQI] Voice scan persist failed:', e); }
          })();
        }
        // ⟁ PERSIST — so list survives login/reload
        try {
          localStorage.setItem('sqi_top33_matches', JSON.stringify(top33));
          localStorage.setItem('sqi_top33_ts', Date.now().toString());
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }

      const queuedRaw = pickTenActivationsForVoiceResult(result);
      const queued = queuedRaw.filter(isVegetarianActivation);

      // ── Universal scan scorer — ALL types scored per scan ─────────────
      // Dosha keyword map used across all type groups
      const doshaStr = String(result.dominantDosha || '').toLowerCase();
      const activeDoshaKey = doshaStr.startsWith('pitta') ? 'pitta'
        : doshaStr.startsWith('vata') ? 'vata'
        : doshaStr.startsWith('kapha') ? 'kapha'
        : 'balanced';

      const DOSHA_KEYWORDS: Record<string, string[]> = {
        vata: ['vata', 'nerve', 'anxiety', 'sleep', 'grounding', 'calm', 'ida', 'dissolution', 'air', 'warming', 'oily', 'nourish'],
        pitta: ['pitta', 'liver', 'heat', 'inflammation', 'pingala', 'blood', 'fire', 'purification', 'cooling', 'bitter', 'cooling'],
        kapha: ['kapha', 'lung', 'lymph', 'weight', 'energy', 'metabolism', 'earth', 'immunity', 'detox', 'light', 'stimulat'],
        balanced: ['ojas', 'prana', 'longevity', 'divine', 'bliss', 'samadhi', 'light', 'consciousness', 'harmony'],
      };
      const doshaKeywords = DOSHA_KEYWORDS[activeDoshaKey];
      const spoken = (result as any).spokenKeywords as string[] | undefined;

      /** Universal scorer — works for any Activation type */
      function scoreActivation(a: any): number {
        const blob = `${a.name} ${a.benefit || ''} ${a.vibrationalSignature || ''} ${a.category || ''}`.toLowerCase();
        let score = 0;
        // Dosha match
        for (const kw of doshaKeywords) {
          if (blob.includes(kw)) { score += 40; break; }
        }
        // Priority area match
        if (result.priorityAreas?.length) {
          for (const area of result.priorityAreas) {
            const w = (area.name || '').toLowerCase().split(/[\s/]/)[0];
            if (w.length > 3 && blob.includes(w)) { score += 30; break; }
          }
        }
        // Organ field match
        if (result.organField) {
          for (const w of result.organField.toLowerCase().split(/[\s/,]+/)) {
            if (w.length > 3 && blob.includes(w)) { score += 25; break; }
          }
        }
        // Emotional field match
        if (result.emotionalField) {
          for (const w of result.emotionalField.toLowerCase().split(/[\s/,]+/)) {
            if (w.length > 4 && blob.includes(w)) { score += 20; break; }
          }
        }
        // Spoken keyword match — highest signal
        if (spoken?.length) {
          for (const w of spoken) {
            if (w.length > 3 && blob.includes(w)) { score += 45; break; }
          }
        }
        return score;
      }

      /** Pick top N from a type group, guarantee minimum if none score */
      function pickFromType(type: string, count: number, guaranteeMin = true): any[] {
        const pool = ALL_ACTIVATIONS.filter((a: any) => a.type === type);
        const scored = pool.map((a: any) => ({ act: a, score: scoreActivation(a) }));
        scored.sort((a: any, b: any) => b.score - a.score);
        // Guarantee at least `count` items always activate
        if (guaranteeMin) {
          const nonZero = scored.filter((s: any) => s.score > 0);
          if (nonZero.length < count) {
            // Give remaining items a baseline score
            for (let i = nonZero.length; i < Math.min(count, scored.length); i++) {
              scored[i].score = 1;
            }
          }
        }
        return scored.filter((s: any) => s.score > 0).slice(0, count).map((s: any) => s.act);
      }

      // Each type contributes its top matches to the scan
      const wellnessMatched     = pickFromType('Wellness', 2);
      const siddhaMatched       = pickFromType('Siddha Transmission', 2);
      const siddhasomaMatched   = pickFromType('Siddha Soma', 2);
      const bioenergeticMatched = queued; // already computed by pickTenActivationsForVoiceResult
      const ayurvedaMatched     = pickFromType('Ayurvedic Herb', 1);
      const sacredPlantMatched  = pickFromType('Sacred Plant', 1, false); // only if scored
      const mushroomMatched     = pickFromType('Mushroom', 1, false);
      const adaptogenMatched    = pickFromType('Adaptogen', 1, false);
      const essentialOilMatched = pickFromType('Essential Oil', 1, false);
      const mineralMatched      = pickFromType('Mineral', 1, false);
      const avataricMatched     = pickFromType('avataric', 1, false);

      // ── Apply all matched transmissions to active field ────────────────
      setActiveTransmissions((prev) => {
        // Clear old voice_scan entries — each new scan replaces the previous
        const next = prev.filter((t) => (t as any).source !== 'voice_scan');
        // All types combined
        const allToActivate = [
          ...wellnessMatched, ...siddhaMatched, ...siddhasomaMatched,
          ...bioenergeticMatched, ...ayurvedaMatched, ...sacredPlantMatched,
          ...mushroomMatched, ...adaptogenMatched, ...essentialOilMatched,
          ...mineralMatched, ...avataricMatched,
        ];
        for (const act of allToActivate) {
          const enriched = enrichTransmission(act as any, 'voice_scan');
          if (
            next.some(
              (x) =>
                x.id === enriched.id ||
                (!!x.name &&
                  !!enriched.name &&
                  x.name.toLowerCase() === enriched.name.toLowerCase()),
            )
          )
            continue;
          next.push(enriched);
        }
        return next;
      });
      const queuedLines = queued.map((a) => `· **${a.name}** (${a.type})`).join('\n');
      const ctx = [
        '[LIVE VOICE BIOFIELD SCAN — microphone spectrum; educational only, not a medical diagnosis]',
        `**Overall coherence:** ${result.overallCoherence}/100`,
        `**Nadi read:** ${result.nadiReading}`,
        `**Dominant dosha (voice):** ${result.dominantDosha}`,
        `**Priority areas:** ${result.priorityAreas.map((i) => `${i.name} (${i.score}/100)`).join('; ')}`,\n        `**Strengths:** ${result.topStrengths.map((i) => i.name).join(', ')}`,\n        `**Emotional field:** ${result.emotionalField}`,\n        `**Organ support:** ${result.organField}`,\n        '',\n        'STRICT SQI RULE — VOICE SCAN HAS NO NADI COUNT:',\n        'A voice biofield scan measures vocal coherence ONLY. It does NOT produce a 72,000-Nadi count or sub-Nadi number.',\n        'NEVER fabricate "X / 72,000 Nadis active" from this voice scan. If the seeker asks for a Nadi count, instruct them to run a Palm Scan (Camera tab) — only the saved palm baseline holds that figure.',\n        '',\n        '[QUEUED FREQUENCY / BIOENERGETIC ALIGNMENTS — drawn from the 1,357+ LimbicArc / Bioenergetic library and added to Active Transmissions (10)]',\n        queuedLines,\n        '',\n        'When you reference any of the queued frequencies above in your reply, write the frequency name in **bold** so the seeker sees exactly which transmissions were activated for them.',\n      ].join('\n');\n      setLiveScanContext(ctx);\n      if (user?.id) {\n        supabase.from('user_activity_log').insert({\n          user_id: user.id,\n          activity_type: 'frequency_transmission',\n          activity_data: {\n            activity: 'Voice biofield scan queued bioenergetic alignments',\n            section: 'Quantum Apothecary',\n            frequency: queued.map((a) => a.name).join(', '),\n            details: { intention: 'Post-voice-scan Active Transmissions', nadi: result.nadiReading },\n          },\n        }).then(() => {});\n      }\n      // ⟁ Voice scan completes silently. Frequencies queue into Active Transmissions\n      // and the Top 33 panel — no chat message is injected. Seeker can ask SQI about\n      // the scan whenever they wish; liveScanContext above feeds it into the next reply.\n      // Auto-open library + Top33 so user sees their frequencies immediately\n      setCardLibOpen(true);\n      setCardT33Open(true);\n      setCardVoiceOpen(false); // Collapse scanner to give space\n      toast.success(\n        `⟁ Voice biofield scan complete — ${queued.length} frequencies queued to your field`,\n        { duration: 4000 },\n      );\n    },\n    [user?.id, activeTransmissions],\n  );\n\n  const handleChatFocus = () => { openChatFullscreenIfMobile(); };\n\n  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const file = e.target.files?.[0];\n    if (!file || !file.type.startsWith('image/')) return;\n    const reader = new FileReader();\n    reader.onload = () => {\n      const dataUrl = reader.result as string;\n      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;\n      setPendingImage({ base64, mimeType: file.type || 'image/jpeg' });\n    };\n    reader.readAsDataURL(file);\n    e.target.value = '';\n  };\n\n  /** Fallback when react-speech-recognition is not supported (rare browsers). */\n  const legacyWebkitVoice = () => {\n    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;\n    if (!SR) return;\n    if (isRecording && legacyRecognitionRef.current) {\n      legacyRecognitionRef.current.stop();\n      return;\n    }\n    voiceTranscriptRef.current = input;\n    const recognition = new SR();\n    recognition.continuous = true;\n    recognition.interimResults = true;\n    recognition.lang = chatSpeechLocale(language);\n    recognition.onresult = (event: any) => {\n      let interim = '';\n      for (let i = event.resultIndex; i < event.results.length; i++) {\n        const tr = event.results[i].transcript;\n        if (event.results[i].isFinal) {\n          voiceTranscriptRef.current = (voiceTranscriptRef.current + tr).trim();\n        } else {\n          interim += tr;\n        }\n      }\n      setInput(voiceTranscriptRef.current + interim);\n    };\n    recognition.onend = () => {\n      setInput(voiceTranscriptRef.current);\n      setIsRecording(false);\n      legacyRecognitionRef.current = null;\n    };\n    recognition.onerror = () => {\n      setIsRecording(false);\n      legacyRecognitionRef.current = null;\n    };\n    recognition.start();\n    legacyRecognitionRef.current = recognition;\n    setIsRecording(true);\n  };\n\n  const handleVoiceToggle = useCallback(\n    (e: React.MouseEvent) => {\n      e.preventDefault();\n      e.stopPropagation();\n\n      if (isMicListening) {\n        micListeningRef.current = false;\n        if (nativeSpeechRef.current) {\n          try {\n            nativeSpeechRef.current.stop();\n          } catch {\n            /* ignore */\n          }\n          nativeSpeechRef.current = null;\n        }\n        setIsMicListening(false);\n        return;\n      }\n\n      const SpeechRecognitionCtor =\n        (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition ||\n        (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;\n      if (!SpeechRecognitionCtor) return;\n\n      const recognition = new SpeechRecognitionCtor();\n      recognition.lang = chatSpeechLocale(language) || 'en-US';\n      recognition.continuous = false;\n      recognition.interimResults = true;\n      recognition.maxAlternatives = 1;\n      nativeSpeechRef.current = recognition;\n      micListeningRef.current = true;\n\n      recognition.onresult = (event: any) => {\n        const transcript = Array.from(event.results as any[])\n          .map((r: any) => r[0]?.transcript ?? '')\n          .join('');\n        setInput(transcript);\n      };\n\n      recognition.onend = () => {\n        if (micListeningRef.current && nativeSpeechRef.current) {\n          setTimeout(() => {\n            try {\n              nativeSpeechRef.current?.start();\n            } catch {\n              /* ignore */\n            }\n          }, 100);\n        } else {\n          setIsMicListening(false);\n        }\n      };\n\n      recognition.onerror = (ev: any) => {\n        if (ev.error === 'no-speech') {\n          setTimeout(() => {\n            try {\n              nativeSpeechRef.current?.start();\n            } catch {\n              /* ignore */\n            }\n          }, 200);\n        } else {\n          micListeningRef.current = false;\n          setIsMicListening(false);\n        }\n      };\n\n      try {\n        recognition.start();\n        setIsMicListening(true);\n      } catch {\n        micListeningRef.current = false;\n        setIsMicListening(false);\n      }\n    },\n    [isMicListening, language],\n  );\n\n  const transmitCocktail = () => {\n    const mix = selectedActivationsRef.current;\n    if (mix.length === 0) return;\n    const txUid = user?.id || 'guest';\n    try {\n      const rawPrana = localStorage.getItem(`qa-last-nadi-prana-${txUid}`);\n      const pranaVal = rawPrana ? parseInt(rawPrana, 10) : 0;\n      if (pranaVal > 0) {\n        localStorage.setItem(\n          `pre-activation-nadi-${txUid}`,\n          JSON.stringify({\n            nadi: pranaVal,\n            time: new Date().toISOString(),\n            activations: mix.map((a) => a.name),\n          }),\n        );\n      }\n    } catch {\n      /* ignore */\n    }\n    const newT = [...activeTransmissions];\n    mix.forEach((act) => {\n      const normalized = normalizeActivationForMixer(act);\n      const enriched = enrichTransmission(normalized, 'manual');\n      if (\n        newT.some(\n          (t) =>\n            t.id === enriched.id ||\n            (!!t.name && !!enriched.name && t.name.toLowerCase() === enriched.name.toLowerCase()),\n        )\n      )\n        return;\n      newT.push(enriched);\n    });\n    setActiveTransmissions(newT);\n    // Activation is silent — no chat message injected\n    selectedActivationsRef.current = [];\n    setSelectedActivations([]);\n  };\n\n  const activateAllTop33ToField = useCallback(() => {\n    const rankings = resonanceMatches;\n    if (!rankings || rankings.length === 0) {\n      toast('⟁ Run a Voice Biofield Scan first', { icon: '🎙' });\n      return;\n    }\n\n    const now = new Date().toISOString();\n    const newTransmissions = rankings\n      .filter((r) => !activeTransmissions.some((a) => fieldTransmissionMatchesRow(a, r)))\n      .map((r) => enrichTransmission(normalizeActivationForMixer(r), 'nadi_scan'));\n\n    if (newTransmissions.length === 0) {\n      toast.message(t('quantumApothecaryChat.allMatchesActive'));\n      return;\n    }\n\n    const updated = [...activeTransmissions, ...newTransmissions];\n    setActiveTransmissions(updated);\n\n    if (user?.id) {\n      const top33Payload: Record<string, unknown> = {\n        user_id: user.id,\n        activations: updated as unknown as Record<string, unknown>[],\n        updated_at: now,\n      };\n      if (quantumAnchorRef.current) {\n        top33Payload.quantum_anchor = quantumAnchorRef.current;\n      }\n      void supabase.from('user_active_transmissions').upsert(top33Payload, { onConflict: 'user_id' });\n    }\n    try {\n      localStorage.setItem(`sqi-transmissions-${user?.id || 'guest'}`, JSON.stringify(updated));\n    } catch {\n      /* quota */\n    }\n\n    toast.success(`◈ ${newTransmissions.length} Transmissions activated to your field`);\n  }, [\n    resonanceMatches,\n    activeTransmissions,\n    user?.id,\n    enrichTransmission,\n    normalizeActivationForMixer,\n  ]);\n  const renderChatPanel = () => {\n    return (\n    <div\n      className="relative flex w-full flex-col overflow-visible"\n      style={{\n        minHeight: 'calc(100vh - 120px)',\n        maxWidth: '100%',\n        touchAction: 'pan-y',\n        WebkitOverflowScrolling: 'touch',\n      }}\n    >\n      {/* Chat header — matches /admin-quantum-apothecary-2045 SQI strip */}\n      <ScalarToolbarBanner\n        liveChatClock={liveChatClock}\n        portraitLinkStudentId={portraitLinkStudentId}\n        onHistory={() => setSessionsOpen(true)}\n        onLexicon={() => navigate('/lexicon')}\n      />\n\n      {/* Messages — grow with thread; page/document scrolls (pre–Samsung inner-scroll behavior) */}\n      <div\n        className="qa-sqi-chat relative flex flex-1 flex-col px-1 py-4 space-y-3"\n        style={{\n          overflowX: 'hidden',\n          wordBreak: 'break-word',\n          overflowWrap: 'anywhere',\n        }}\n      >\n        <div ref={chatTopRef} className="h-px w-full shrink-0 scroll-mt-32" aria-hidden />\n        <div\n          className={`flex min-h-full flex-col ${\n            messages.length === 0 && !isTyping ? 'justify-center' : 'justify-end'\n          }`}\n        >\n          {messages.length === 0 && !isTyping && (\n            <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">\n              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40">\n                {t('quantumApothecary.chat.emptyState.kicker')}\n              </p>\n              <div className="mb-4 text-3xl opacity-30" aria-hidden>\n                ◈\n              </div>\n              <h3 className="mb-2 text-base font-black tracking-[-0.03em] text-white/60">\n                {t('quantumApothecary.chat.emptyState.title')}\n              </h3>\n              <p className="max-w-[240px] text-xs leading-relaxed text-white/25">\n                {t('quantumApothecary.chat.emptyState.body')}\n              </p>\n              <div className="mt-6 flex w-full max-w-sm flex-col gap-2">\n                {[\n                  t('quantumApothecaryChat.suggestStress'),\n                  t('quantumApothecaryChat.suggestField'),\n                  t('quantumApothecaryChat.suggestSamadhi'),\n                ].map((q) => (\n                  <button\n                    key={q}\n                    type="button"\n                    onClick={() => {\n                      setInput(q);\n                      setTimeout(() => handleSendMessage(q), 100);\n                    }}\n                    className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-[13px] text-white/55 transition-all hover:border-[#D4AF37]/30 hover:text-white/80"\n                  >\n                    {q}\n                  </button>\n                ))}\n              </div>\n            </div>\n          )}\n          {messages.slice(-20).map((msg, i) => {\n              const visStart = Math.max(0, messages.length - 20);\n              const globalIndex = visStart + i;\n              const msgKey = msg.id ?? `qa-msg-${globalIndex}-${msg.timestamp ?? 'na'}-${msg.role}`;\n              return (\n              <motion.div key={msgKey} data-qa-msg-key={msgKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}\n                className={`flex w-full min-w-0 flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>\n                {msg.role === 'user' ? (\n                  <div\n                    className="ml-auto max-w-[88%]"\n                    style={{\n                      marginRight: 12,\n                      marginTop: 8,\n                      position: 'relative',\n                      padding: '14px 20px',\n                      background: 'rgba(212,175,55,0.03)',\n                      borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',\n                    }}\n                  >\n                    <div style={{ position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderTop: '1px solid rgba(212,175,55,0.2)', borderRight: '1px solid rgba(212,175,55,0.2)', pointerEvents: 'none' }} />\n                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.4em', color: 'rgba(212,175,55,0.28)', textTransform: 'uppercase' as const, marginBottom: '8px' }}>\n                      The Seeker inquires\n                    </p>\n                    <div className="markdown-body whitespace-pre-wrap break-words w-full min-w-0 text-left" style={{ maxWidth: '100%', wordBreak: 'break-word', fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(200,184,154,0.75)', lineHeight: '1.65' }}>\n                      {renderChatText(msg.text, 'user')}\n                    </div>\n                  </div>\n                ) : (\n                  <>\n                    <div\n                      className="chat-message w-full sqi-manuscript-scroll"\n                      style={{\n                        position: 'relative',\n                        padding: '20px 16px 14px',\n                        background: 'rgba(255,255,255,0.016)',\n                        borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',\n                        \n                        overflow: 'visible',\n                        userSelect: 'none',\n                        WebkitUserSelect: 'none',\n                        WebkitTouchCallout: 'none',\n                      }}\n                    >\n                      \n                      \n                      <div className="sqi-message w-full min-w-0">\n                        <div\n                          className="sqi-ancient-body break-words"\n                          style={{ maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'anywhere', fontFamily: "'IM Fell English', Georgia, serif", fontSize: '16px', lineHeight: 1.9, color: 'rgba(225,210,185,0.9)', letterSpacing: '0.008em' }}\n                        >\n                          {renderSQIContent(scrubBannedTerms(msg.text), addActivation)}\n                        </div>\n                      </div>\n                    </div>\n                    <div className="mx-auto mt-1 flex w-full max-w-[96%] flex-wrap items-center gap-x-3 gap-y-1">\n                      <button\n                        type="button"\n                        onClick={() => handleCopyMsg(msg.text, msgKey)}\n                        aria-label={t("quantumApothecaryChat.copyMessage")}\n                        className="text-[10px] font-bold uppercase tracking-widest"\n                        style={{\n                          background: 'transparent',\n                          border: 'none',\n                          cursor: 'pointer',\n                          color: copiedMsgKey === msgKey ? '#22c55e' : '#D4AF37',\n                        }}\n                      >\n                        {copiedMsgKey === msgKey ? '✓ Copied' : 'Copy'}\n                      </button>\n                    </div>\n                  </>\n                )}\n              </motion.div>\n              );\n            })}\n          {isTyping && (\n            <div className="flex justify-start px-1">\n              <div\n                className="flex items-center gap-1.5 rounded-[28px] rounded-tl-none border border-white/[0.08] bg-white/[0.04] px-5 py-4"\n                role="status"\n                aria-live="polite"\n                aria-label={t("quantumApothecaryChat.composing")}\n              >\n                {[0, 1, 2].map((i) => (\n                  <span\n                    key={i}\n                    className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37]/70"\n                    style={{\n                      animationDelay: `${i * 0.18}s`,\n                      animationDuration: '0.65s',\n                      boxShadow: '0 0 8px rgba(212,175,55,0.55)',\n                    }}\n                  />\n                ))}\n              </div>\n            </div>\n          )}\n          <div ref={chatEndRef} />\n        </div>\n      </div>\n\n      {/* ═══ SCALAR COMPOSER — Telegram-style ═══ */}\n      <div\n            ref={composerWrapRef}\n            className="relative z-10 shrink-0"\n            style={{\n              padding: '10px 12px 14px',\n              borderTop: '1px solid rgba(212,175,55,0.12)',\n              animation: 'bannerAura 4s ease-in-out infinite',\n              marginBottom: 'env(safe-area-inset-bottom, 0px)',\n            }}\n          >\n            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <ScalarComposerCanvas wrapRef={composerWrapRef} />
            <div style={{ position:'relative', zIndex:1, background:'rgba(5,5,5,0.55)', backdropFilter:'blur(18px)', borderRadius:4 }}>

              {/* Image preview strip */}
              {pendingImage && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'7px 12px', borderRadius:14, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)' }}>
                  <img
                    src={`data:${pendingImage.mimeType};base64,${pendingImage.base64}`}
                    alt="Attached"
                    style={{ width:42, height:42, borderRadius:10, objectFit:'cover', border:'1px solid rgba(212,175,55,0.2)', flexShrink:0 }}
                  />\n                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.65)' }}>Image attached</span>
                  <button type="button" onClick={() => setPendingImage(null)} style={{ marginLeft:'auto', width:24, height:24, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', fontSize:11 }}>
                    <X size={12} />\n                  </button>
                </div>\n              )}\n\n              {/* Input pill */}\n              <div\n                className="sqi-composer-pill"\n                style={{\n                  display:'flex', alignItems:'flex-end', gap:0,\n                  background:'rgba(255,255,255,0.03)',\n                  border:'1px solid rgba(212,175,55,0.28)',\n                  borderRadius:28,\n                  padding:'6px 6px 6px 8px',\n                  animation:'pillBreath 4s ease-in-out infinite',\n                }}\n              >\n                {/* Camera */}\n                <button\n                  type="button"\n                  onClick={() => fileInputRef.current?.click()}\n                  title={t("quantumApothecaryChat.attachPhoto")}\n                  style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:'rgba(212,175,55,0.65)', flexShrink:0, transition:'all 0.2s' }}\n                >\n                  <Camera size={18} />
                </button>\n\n                {/* Mic */}\n                {browserSupportsSpeechRecognition ? (\n                  <button\n                    type="button"\n                    onClick={handleVoiceToggle}\n                    title={isMicListening ? t('quantumApothecary.chat.voiceStop') : t('quantumApothecary.chat.voiceStart')}\n                    style={{\n                      display:'flex', alignItems:'center', justifyContent:'center',\n                      width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',\n                      flexShrink:0, transition:'all 0.2s',\n                      background: isMicListening ? 'rgba(212,175,55,0.15)' : 'transparent',\n                      color: isMicListening ? '#D4AF37' : 'rgba(212,175,55,0.65)',\n                      animation: isMicListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',\n                    }}\n                  >\n                    {isMicListening\n                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>\n                      : <Mic size={18} />}
                  </button>\n                ) : (\n                  <button\n                    type="button"\n                    onClick={legacyWebkitVoice}\n                    style={{\n                      display:'flex', alignItems:'center', justifyContent:'center',\n                      width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',\n                      flexShrink:0, background: isRecording ? 'rgba(212,175,55,0.15)' : 'transparent',\n                      color: isRecording ? '#D4AF37' : 'rgba(212,175,55,0.65)',\n                      animation: isRecording ? 'micPulse 1.2s ease-in-out infinite' : 'none',\n                    }}\n                  >\n                    <Mic size={18} />
                  </button>\n                )}\n\n                {/* Divider */}\n                <span style={{ width:1, height:22, background:'rgba(212,175,55,0.14)', margin:'0 4px', alignSelf:'center', flexShrink:0, display:'block' }} />

                {/* Textarea */}
                <textarea
                  ref={chatInputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); e.stopPropagation();
                      if (!isTyping && (input.trim() || pendingImage)) handleSendMessage();
                    }
                  }}
                  onFocus={handleChatFocus}
                  placeholder={t('quantumApothecary.chat.placeholder')}
                  style={{ resize:'none', overflowY:'hidden', flex:1, background:'transparent', border:'none', outline:'none', color:'rgba(255,255,255,0.9)', fontSize:15, lineHeight:1.55, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:400, padding:'6px 8px', minHeight:36, maxHeight:140, alignSelf:'center' }}
                />\n\n                {/* Send / Mic-to-send button */}\n                <button\n                  type="button"\n                  onClick={() => handleSendMessage()}\n                  disabled={(!input.trim() && !pendingImage) || isTyping}\n                  aria-label={t('quantumApothecary.chat.send')}\n                  style={{\n                    display:'flex', alignItems:'center', justifyContent:'center',\n                    width:42, height:42, borderRadius:'50%', flexShrink:0, cursor:'pointer',\n                    border:'1px solid rgba(212,175,55,0.35)',\n                    background: (input.trim() || pendingImage) ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.08)',\n                    color:'#D4AF37', transition:'all 0.25s',\n                    boxShadow:'0 0 10px rgba(212,175,55,0.18), 0 0 22px rgba(212,175,55,0.10)',\n                    opacity: isTyping ? 0.4 : 1,\n                  }}\n                >\n                  <Send size={16} />
                </button>\n\n              </div>
            </div>\n              {/* Arrow row — between composer and nav */}\n              <div style={{ display:"flex", justifyContent:"flex-end", padding:"6px 2px 0" }}>\n                <button\n                  type="button"\n                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}\n                  aria-label={t("quantumApothecaryChat.scrollToTop")}\n                  style={{\n                    width:30, height:30, borderRadius:"50%",\n                    background:"rgba(10,8,2,0.92)",\n                    border:"1px solid rgba(212,175,55,0.22)",\n                    display:"flex", alignItems:"center", justifyContent:"center",\n                    color:"rgba(212,175,55,0.60)",\n                    boxShadow:"0 0 8px rgba(212,175,55,0.12)",\n                    cursor:"pointer", flexShrink:0,\n                  }}\n                >\n                  <ChevronUp size={14} />
                </button>\n              </div>
          </div>\n        </div>
    );
  };

  /* ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
     MAIN RENDER — SQI-2050 Visual Layer
     ââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
  return (
    <div
      className="relative min-h-screen text-white/90 pb-24"
      style={{ background: '#050505', position: 'relative', overflowX: 'hidden', padding: 0, margin: 0, width: '100%', maxWidth: '100vw', paddingTop: 'env(safe-area-inset-top, 0px)', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >

      {/* ââ Akasha Deep Space Background ââ */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212,175,55,0.03) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 40%)',
      }} />\n\n      {/* ââ Star Field ââ */}\n      <div className="fixed inset-0 z-0 pointer-events-none" style={{\n        backgroundImage: 'radial-gradient(1px 1px at 15% 25%, rgba(212,175,55,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.2) 0%, transparent 100%), radial-gradient(1px 1px at 85% 45%, rgba(212,175,55,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 35% 75%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 70% 85%, rgba(212,175,55,0.25) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 22% 60%, rgba(212,175,55,0.35) 0%, transparent 100%), radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.2) 0%, transparent 100%)',\n      }} />

      {/* ââ Nadi SVG Overlay ââ */}
      <svg className={`fixed inset-0 z-0 pointer-events-none w-full h-full ${activeTransmissions.length > 0 ? 'opacity-30' : 'opacity-[0.06]'}`} style={{ pointerEvents: 'none' }}>
        <defs>
          <filter id="qa-glow">
            <feGaussianBlur stdDeviation={activeTransmissions.length > 0 ? '3' : '1'} result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>\n          </filter>
        </defs>\n        <g filter="url(#qa-glow)" stroke={activeTransmissions.length > 0 ? '#D4AF37' : 'rgba(212,175,55,0.6)'} strokeWidth={activeTransmissions.length > 0 ? '1.5' : '0.8'} fill="none">\n          <path d="M200,50 Q250,200 200,400 Q150,600 200,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
          <path d="M400,50 Q350,200 400,400 Q450,600 400,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>\n          <path d="M100,300 Q300,350 500,300" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
        </g>\n      </svg>

      {/* ââ Main Content ââ */}
      <div className="relative z-10 w-full px-0 py-0">

        {/* ââ Header ââ */}
        {/* Header Banner */}
        <ScalarHeaderBanner
          onBack={() => navigate('/explore')}
          onInfo={() => setShowKnowledge(true)}
        />\n\n        <div className="flex w-full max-w-none flex-col gap-5">\n          <video ref={videoRef} className="hidden" muted playsInline tabIndex={-1} aria-hidden />

          {/* ══ CARD: Active Transmissions ══ */}
          <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(212,175,55,0.22),0 0 28px rgba(212,175,55,0.14),0 0 60px rgba(212,175,55,0.07)' }}>
            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 64, cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent', overflow: 'hidden', gap: 10, background: 'rgba(8,6,2,0.72)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(212,175,55,0.10)' }}
              onClick={() => setCardTxOpen(o => !o)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setCardTxOpen(o => !o)}
            >
              <div style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(74,222,128,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />\n              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>\n                <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'radial-gradient(circle at 35% 35%,rgba(74,222,128,0.20),rgba(0,0,0,0))', border: '1px solid rgba(74,222,128,0.28)', boxShadow: '0 0 14px rgba(74,222,128,0.18),inset 0 0 8px rgba(74,222,128,0.08)' }}>⚡</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', color: cardTxOpen ? '#D4AF37' : 'rgba(255,255,255,0.88)', textShadow: cardTxOpen ? '0 0 14px rgba(212,175,55,0.4)' : 'none', transition: 'color 0.3s,text-shadow 0.3s' }}>Active Transmissions</div>\n                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>Field live · 24 / 7</div>\n                </div>
              </div>\n              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>\n                <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: 100, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.28)', boxShadow: '0 0 10px rgba(74,222,128,0.12)' }}>{activeTransmissions.length > 0 ? `${activeTransmissions.length} Active` : 'Empty'}</div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: cardTxOpen ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.03)', border: cardTxOpen ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cardTxOpen ? '#D4AF37' : 'rgba(212,175,55,0.35)', fontSize: 10, flexShrink: 0, transform: cardTxOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.38s cubic-bezier(0.4,0,0.2,1),background 0.3s,color 0.3s' }}>▾</div>\n              </div>
            </div>\n            <div style={{ maxHeight: cardTxOpen ? 2400 : 0, overflow: 'hidden' as const, transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1)' }}>\n              <Suspense fallback={\n                <div className="glass-card rounded-[28px] p-6">\n                  <div className="mb-4 flex items-center justify-between">\n                    <div className="flex items-center gap-2">\n                      <Zap size={14} className="text-[#D4AF37]" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' }} />
                      <h2 className="text-sm font-black tracking-[-0.03em]">Active Transmissions</h2>\n                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-300">Loading...</span>\n                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
                    <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
                  </div>\n                </div>
              }>
                <MidCycleBanner activeTransmissions={activeTransmissions} />\n              <ActiveTransmissionsSection\n                  activeTransmissions={activeTransmissions}\n                  setActiveTransmissions={setActiveTransmissions}\n                  onDissolveTransmission={dissolveTransmission}\n                />
              </Suspense>\n            </div>
          </div>\n\n          <ScalarTabSwitcher\n            active={apothecaryMainTab}\n            onLibrary={() => setApothecaryMainTab('library')}\n            onArchive={() => setApothecaryMainTab('archive')}\n          />

          {apothecaryMainTab === 'library' ? (
            <div className="flex w-full flex-col gap-4" style={{ maxWidth: '100%' }}>

              {/* ══ CARD: Voice Bio-Signature Scan ══ */}
              <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(212,175,55,0.18),0 0 22px rgba(212,175,55,0.10),0 0 55px rgba(212,175,55,0.05)' }}>
                <div
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 64, cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent', overflow: 'hidden', gap: 10, background: 'rgba(8,6,2,0.72)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(212,175,55,0.10)' }}
                  onClick={() => setCardVoiceOpen(o => !o)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setCardVoiceOpen(o => !o)}
                >
                  <div style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />\n                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>\n                    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'radial-gradient(circle at 35% 35%,rgba(34,211,238,0.18),rgba(0,0,0,0))', border: '1px solid rgba(34,211,238,0.28)', boxShadow: '0 0 14px rgba(34,211,238,0.16),inset 0 0 8px rgba(34,211,238,0.08)' }}>🎙</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', color: cardVoiceOpen ? '#D4AF37' : 'rgba(255,255,255,0.88)', textShadow: cardVoiceOpen ? '0 0 14px rgba(212,175,55,0.4)' : 'none', transition: 'color 0.3s,text-shadow 0.3s' }}>Voice Bio-Signature Scan</div>\n                      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>Nadi · Dosha · Pranic Field</div>
                    </div>\n                  </div>
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: 100, color: '#22D3EE', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.28)', boxShadow: '0 0 10px rgba(34,211,238,0.12)' }}>Ready</div>\n                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: cardVoiceOpen ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.03)', border: cardVoiceOpen ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cardVoiceOpen ? '#D4AF37' : 'rgba(212,175,55,0.35)', fontSize: 10, flexShrink: 0, transform: cardVoiceOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.38s cubic-bezier(0.4,0,0.2,1),background 0.3s,color 0.3s' }}>▾</div>
                  </div>\n                </div>
                <div style={{ maxHeight: cardVoiceOpen ? 2400 : 0, overflow: cardVoiceOpen ? 'visible' : 'hidden', transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
                <ScalarVoiceWrapper>
                  <Suspense fallback={ScannerSuspenseFallback}>
                    <VoiceBiofieldScanner
                      userName={seekerName || 'Seeker'}
                      jyotishContext={{
                        mahadasha: jyotish?.mahadasha,
                        nakshatra: jyotish?.nakshatra,
                        primaryDosha: jyotish?.primaryDosha,
                      }}
                      onScanComplete={handleVoiceBiofieldComplete}
                      scanDurationSeconds={10}
                      showProgressRing
                      disableUntilMs={scanCooldownUntilMs}
                    />\n                  {/* Admin-only: reset 24h scan cooldown instantly */}\n                  {isAdmin && scanCooldownUntilMs && scanCooldownUntilMs > Date.now() && (\n                    <div style={{ marginTop: 8, textAlign: 'center' }}>\n                      <button\n                        type="button"\n                        onClick={handleAdminResetCooldown}\n                        style={{\n                          padding: '5px 14px',\n                          borderRadius: 100,\n                          border: '1px solid rgba(212,175,55,0.25)',\n                          background: 'rgba(212,175,55,0.06)',\n                          color: 'rgba(212,175,55,0.6)',\n                          fontSize: 9,\n                          fontWeight: 800,\n                          letterSpacing: '0.2em',\n                          textTransform: 'uppercase',\n                          cursor: 'pointer',\n                          fontFamily: 'inherit',\n                        }}\n                      >\n                        ⟁ Admin · Reset Scan Cooldown\n                      </button>
                    </div>\n                  )}\n                  </Suspense>

                  {voiceResult && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { label: 'Dosha', val: voiceResult.dominantDosha },
                        { label: 'Nadi', val: voiceResult.nadiReading },
                        {
                          label: 'Active Nadis',
                          val: voiceResult.priorityAreas?.slice(0, 4).map((p) => p.name).join(' · ') || '—',
                        },
                      ].map((c) => (
                        <div
                          key={c.label}
                          className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-4"
                          style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
                        >
                          <p className="text-[13px] font-black uppercase tracking-[0.15em] text-white/85">{c.label}</p>\n                          <p className="mt-2 text-[13px] leading-snug text-white/85">{c.val}</p>\n                        </div>\n                      ))}\n                    </div>\n                  )}\n\n                  {resonanceMatches.length > 0 && (\n                    <ScalarTop33Wrapper>\n                      {/* ââ HEADER ââ */}\n                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-4 pt-4">\n                        <div>\n                          <p style={{ fontSize:13, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'#D4AF37', textShadow:'0 0 14px rgba(212,175,55,0.35)' }}>\n                            ⟁ Top 33\n                          </p>\n                          <p style={{ marginTop:3, fontSize:10, color:'rgba(255,255,255,0.45)', letterSpacing:'0.04em' }}>\n                            {resonanceMatches.filter((r) =>\n                              activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),\n                            ).length}{' '}\n                            / {resonanceMatches.length} from scan already active in field\n                          </p>\n                        </div>\n                        {/* ââ ACTIVATE BUTTON ââ */}\n                        {(() => {\n                          const activeFromScanCount = resonanceMatches.filter((r) =>\n                            activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),\n                          ).length;\n                          const newCount = resonanceMatches.length - activeFromScanCount;\n                          const noneNew = newCount === 0;\n                          return (\n                            <button\n                              type="button"\n                              onClick={activateAllTop33ToField}\n                              disabled={noneNew}\n                              className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"\n                              style={{\n                                background: noneNew\n                                  ? 'rgba(212,175,55,0.08)'\n                                  : 'rgba(212,175,55,0.15)',\n                                border: noneNew\n                                  ? '1px solid rgba(212,175,55,0.25)'\n                                  : '1px solid rgba(212,175,55,0.5)',\n                                color: noneNew ? 'rgba(212,175,55,0.5)' : '#D4AF37',\n                                boxShadow: noneNew ? 'none' : '0 0 18px rgba(212,175,55,0.2)',\n                              }}\n                            >\n                              {noneNew\n                                ? '⟁ All scan rows active'\n                                : `⟁ Activate All New (${newCount})`}\n                            </button>\n                          );\n                        })()}\n                      </div>\n                      {/* ââ ROW LIST — always full scan list (e.g. 33) ââ */}\n                      <div style={{ maxHeight:"min(68vh,500px)", overflowY:"auto", padding:"8px 14px 14px", display:"flex", flexDirection:"column", gap:6, scrollbarWidth:"thin" }}>\n                        {resonanceMatches.map((row, idx) => {\n                          const isActive = activeTransmissions.some((t) =>\n                            fieldTransmissionMatchesRow(t, row),\n                          );\n                          return (\n                            <div\n                              style={{\n                                display: "flex", alignItems: "center", gap: 10,\n                                padding: "11px 12px", borderRadius: 16,\n                                background: isActive ? "rgba(255,255,255,0.015)" : "rgba(212,175,55,0.04)",\n                                border: isActive ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(212,175,55,0.14)",\n                                opacity: isActive ? 0.52 : 1, transition: "all 0.25s",\n                                boxShadow: isActive ? "none" : "0 2px 12px rgba(212,175,55,0.06)",\n                              }}\n                            >\n\n                              {/* Pct bar */}\n                              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flexShrink:0, width:38 }}>\n                                <span style={{ fontSize:15, fontWeight:900, lineHeight:1, color: isActive ? "rgba(255,255,255,0.25)" : "#D4AF37", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>\n                                  {row.pct}\n                                </span>\n                                <div style={{ width:36, height:4, borderRadius:4, overflow:"hidden", background:"rgba(255,255,255,0.07)" }}>\n                                  <div style={{ height:"100%", borderRadius:4, width:`${row.pct}%`, background: isActive ? "rgba(255,255,255,0.16)" : "linear-gradient(90deg,#D4AF37,#F5E17A)", transition:"width 0.8s ease", boxShadow: isActive ? "none" : "0 0 6px rgba(212,175,55,0.5)" }} />\n                                </div>\n                              </div>\n                              {/* Name + category */}\n                              <div className="flex min-w-0 flex-1 flex-col">\n                                <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:13, fontWeight:700, lineHeight:1.3, color: isActive ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.92)" }}>\n                                  {row.name}\n\n                                </span>\n                                {row.rowCategory && (\n                                  <span\n                                    className="text-[9px] font-semibold uppercase tracking-[0.12em]"\n                                    style={{\n                                      color: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.3)',\n                                    }}\n                                  >\n                                    {row.rowCategory}\n                                  </span>\n                                )}\n                              </div>\n                              {isActive ? (\n                                <span\n                                  style={{ display:"flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:100, border:"1px solid rgba(212,175,55,0.22)", background:"rgba(212,175,55,0.07)", flexShrink:0 }}\n                                  aria-label={t("quantumApothecaryChat.alreadyActive")}\n                                >\n                                  <span style={{ color:"#D4AF37", fontSize:10 }}>✓</span>\n                                  <span style={{ fontSize:7, fontWeight:900, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(212,175,55,0.65)" }}>In field</span>\n                                </span>\n\n\n\n\n                              ) : (\n                                <button\n                                  type="button"\n                                  onClick={() => {\n                                    setActiveTransmissions((prev) => {\n                                      if (prev.some((t) => fieldTransmissionMatchesRow(t, row))) {\n                                        return prev;\n                                      }\n                                      return [\n                                        ...prev,\n                                        enrichTransmission(normalizeActivationForMixer(row), 'nadi_scan'),\n                                      ];\n                                    });\n                                    toast.success(`⟁ ${row.name} activated`);\n                                  }}\n                                  className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] transition-all hover:border-[#D4AF37]/35 hover:text-[#D4AF37]/80"\n                                  style={{\n                                    background: 'transparent',\n                                    color: 'rgba(255,255,255,0.35)',\n                                    border: '1px solid rgba(255,255,255,0.12)',\n                                  }}\n                                >\n                                  + Add\n                                </button>\n                              )}\n                            </div>\n                          );\n                        })}\n                      </div>\n                    </ScalarTop33Wrapper>\n                  )}\n                </ScalarVoiceWrapper>\n                  {/* How It Works */}\n                <ScalarHowItWorksCard />\n                </div>\n              </div>\n\n              {/* ══ CARD: Top 33 Resonance Matches ══ */}\n              {resonanceMatches.length > 0 && (\n                <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(212,175,55,0.18),0 0 22px rgba(212,175,55,0.10),0 0 55px rgba(212,175,55,0.05)' }}>\n                  <div\n                    style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 64, cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent', overflow: 'hidden', gap: 10, background: 'rgba(8,6,2,0.72)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(212,175,55,0.10)' }}\n                    onClick={() => setCardT33Open(o => !o)}\n                    role="button"\n                    tabIndex={0}\n                    onKeyDown={e => e.key === 'Enter' && setCardT33Open(o => !o)}\n                  >\n                    <div style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,0.14) 0%,transparent 70%)', pointerEvents: 'none' }} />\n                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>\n                      <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'radial-gradient(circle at 35% 35%,rgba(212,175,55,0.22),rgba(0,0,0,0))', border: '1px solid rgba(212,175,55,0.30)', boxShadow: '0 0 14px rgba(212,175,55,0.18),inset 0 0 8px rgba(212,175,55,0.08)' }}>⟁</div>\n                      <div>\n                        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', color: cardT33Open ? '#D4AF37' : 'rgba(255,255,255,0.88)', textShadow: cardT33Open ? '0 0 14px rgba(212,175,55,0.4)' : 'none', transition: 'color 0.3s,text-shadow 0.3s' }}>Top 33 Resonance Matches</div>\n                        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>From your Bio-Signature</div>\n                      </div>\n                    </div>\n                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>\n                      <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: 100, color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.30)', boxShadow: '0 0 10px rgba(212,175,55,0.14)' }}>{resonanceMatches.length} Matches</div>\n                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: cardT33Open ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.03)', border: cardT33Open ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cardT33Open ? '#D4AF37' : 'rgba(212,175,55,0.35)', fontSize: 10, flexShrink: 0, transform: cardT33Open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.38s cubic-bezier(0.4,0,0.2,1),background 0.3s,color 0.3s' }}>▾</div>\n                    </div>\n                  </div>\n                  <div style={{ maxHeight: cardT33Open ? 2400 : 0, overflow: 'hidden' as const, transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1)' }}>\n                    <ScalarTop33Wrapper>\n                      {/* ── HEADER ── */}\n                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-4 pt-4">\n                        <div>\n                          <p style={{ fontSize:13, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'#D4AF37', textShadow:'0 0 14px rgba(212,175,55,0.35)' }}>\n                            ⟁ Top 33\n                          </p>\n                          <p style={{ marginTop:3, fontSize:10, color:'rgba(255,255,255,0.45)', letterSpacing:'0.04em' }}>\n                            {resonanceMatches.filter((r) =>\n                              activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),\n                            ).length}{' '}\n                            / {resonanceMatches.length} from scan already active in field\n                          </p>\n                        </div>\n                        {/* ââ ACTIVATE BUTTON ââ */}\n                        {(() => {\n                          const activeFromScanCount = resonanceMatches.filter((r) =>\n                            activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),\n                          ).length;\n                          const newCount = resonanceMatches.length - activeFromScanCount;\n                          const noneNew = newCount === 0;\n                          return (\n                            <button\n                              type="button"\n                              onClick={activateAllTop33ToField}\n                              disabled={noneNew}\n                              className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"\n                              style={{\n                                background: noneNew\n                                  ? 'rgba(212,175,55,0.08)'\n                                  : 'rgba(212,175,55,0.15)',\n                                border: noneNew\n                                  ? '1px solid rgba(212,175,55,0.25)'\n                                  : '1px solid rgba(212,175,55,0.5)',\n                                color: noneNew ? 'rgba(212,175,55,0.5)' : '#D4AF37',\n                                boxShadow: noneNew ? 'none' : '0 0 18px rgba(212,175,55,0.2)',\n                              }}\n                            >\n                              {noneNew\n                                ? '⟁ All scan rows active'\n                                : `⟁ Activate All New (${newCount})`}\n                            </button>\n                          );\n                        })()}\n                      </div>\n                      {/* ââ ROW LIST — always full scan list (e.g. 33) ââ */}\n                      <div style={{ maxHeight:"min(68vh,500px)", overflowY:"auto", padding:"8px 14px 14px", display:"flex", flexDirection:"column", gap:6, scrollbarWidth:"thin" }}>\n                        {resonanceMatches.map((row, idx) => {\n                          const isActive = activeTransmissions.some((t) =>\n                            fieldTransmissionMatchesRow(t, row),\n                          );\n                          return (\n                            <div\n                              style={{\n                                display: "flex", alignItems: "center", gap: 10,\n                                padding: "11px 12px", borderRadius: 16,\n                                background: isActive ? "rgba(255,255,255,0.015)" : "rgba(212,175,55,0.04)",\n                                border: isActive ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(212,175,55,0.14)",\n                                opacity: isActive ? 0.52 : 1, transition: "all 0.25s",\n                                boxShadow: isActive ? "none" : "0 2px 12px rgba(212,175,55,0.06)",\n                              }}\n                            >\n\n                              {/* Pct bar */}\n                              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flexShrink:0, width:38 }}>\n                                <span style={{ fontSize:15, fontWeight:900, lineHeight:1, color: isActive ? "rgba(255,255,255,0.25)" : "#D4AF37", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>\n                                  {row.pct}\n                                </span>\n                                <div style={{ width:36, height:4, borderRadius:4, overflow:"hidden", background:"rgba(255,255,255,0.07)" }}>\n                                  <div style={{ height:"100%", borderRadius:4, width:`${row.pct}%`, background: isActive ? "rgba(255,255,255,0.16)" : "linear-gradient(90deg,#D4AF37,#F5E17A)", transition:"width 0.8s ease", boxShadow: isActive ? "none" : "0 0 6px rgba(212,175,55,0.5)" }} />\n                                </div>\n                              </div>\n                              {/* Name + category */}\n                              <div className="flex min-w-0 flex-1 flex-col">\n                                <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:13, fontWeight:700, lineHeight:1.3, color: isActive ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.92)" }}>\n                                  {row.name}\n\n                                </span>\n                                {row.rowCategory && (\n                                  <span\n                                    className="text-[9px] font-semibold uppercase tracking-[0.12em]"\n                                    style={{\n                                      color: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.3)',\n                                    }}\n                                  >\n                                    {row.rowCategory}\n                                  </span>\n                                )}\n                              </div>\n                              {isActive ? (\n                                <span\n                                  style={{ display:"flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:100, border:"1px solid rgba(212,175,55,0.22)", background:"rgba(212,175,55,0.07)", flexShrink:0 }}\n                                  aria-label={t("quantumApothecaryChat.alreadyActive")}\n                                >\n                                  <span style={{ color:"#D4AF37", fontSize:10 }}>✓</span>\n                                  <span style={{ fontSize:7, fontWeight:900, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(212,175,55,0.65)" }}>In field</span>\n                                </span>\n\n\n\n\n                              ) : (\n                                <button\n                                  type="button"\n                                  onClick={() => {\n                                    setActiveTransmissions((prev) => {\n                                      if (prev.some((t) => fieldTransmissionMatchesRow(t, row))) {\n                                        return prev;\n                                      }\n                                      return [\n                                        ...prev,\n                                        enrichTransmission(normalizeActivationForMixer(row), 'nadi_scan'),\n                                      ];\n                                    });\n                                    toast.success(`⟁ ${row.name} activated`);\n                                  }}\n                                  className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] transition-all hover:border-[#D4AF37]/35 hover:text-[#D4AF37]/80"\n                                  style={{\n                                    background: 'transparent',\n                                    color: 'rgba(255,255,255,0.35)',\n                                    border: '1px solid rgba(255,255,255,0.12)',\n                                  }}\n                                >\n                                  + Add\n                                </button>\n                              )}\n                            </div>\n                          );\n                        })}\n                      </div>\n                    </ScalarTop33Wrapper>\n                  </div>\n                </div>\n              )}\n\n              {/* ══ CARD: Frequency Library ══ */}\n              <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(212,175,55,0.18),0 0 22px rgba(212,175,55,0.10),0 0 55px rgba(212,175,55,0.05)' }}>\n                <div\n                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 64, cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent', overflow: 'hidden', gap: 10, background: 'rgba(8,6,2,0.72)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(212,175,55,0.10)' }}\n                  onClick={() => setCardLibOpen(o => !o)}\n                  role="button"\n                  tabIndex={0}\n                  onKeyDown={e => e.key === 'Enter' && setCardLibOpen(o => !o)}\n                >\n                  <div style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,0.10) 0%,transparent 70%)', pointerEvents: 'none' }} />\n                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>\n                    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'radial-gradient(circle at 35% 35%,rgba(212,175,55,0.22),rgba(0,0,0,0))', border: '1px solid rgba(212,175,55,0.30)', boxShadow: '0 0 14px rgba(212,175,55,0.18),inset 0 0 8px rgba(212,175,55,0.08)' }}>◈</div>\n                    <div>\n                      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', color: cardLibOpen ? '#D4AF37' : 'rgba(255,255,255,0.88)', textShadow: cardLibOpen ? '0 0 14px rgba(212,175,55,0.4)' : 'none', transition: 'color 0.3s,text-shadow 0.3s' }}>Frequency Library</div>\n                      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>Quantum Essences · Activations</div>\n                    </div>\n                  </div>\n                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>\n                    <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: 100, color: libraryUnlocked ? '#D4AF37' : 'rgba(255,255,255,0.30)', background: libraryUnlocked ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)', border: libraryUnlocked ? '1px solid rgba(212,175,55,0.28)' : '1px solid rgba(255,255,255,0.09)', boxShadow: libraryUnlocked ? '0 0 10px rgba(212,175,55,0.12)' : 'none' }}>{libraryUnlocked ? 'Unlocked' : 'Scan first'}</div>\n                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: cardLibOpen ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.03)', border: cardLibOpen ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cardLibOpen ? '#D4AF37' : 'rgba(212,175,55,0.35)', fontSize: 10, flexShrink: 0, transform: cardLibOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.38s cubic-bezier(0.4,0,0.2,1),background 0.3s,color 0.3s' }}>▾</div>\n                  </div>\n                </div>\n                <div style={{ maxHeight: cardLibOpen ? 2400 : 0, overflow: 'hidden' as const, transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1)' }}>\n                {selectedActivations.length > 0 && (\n                  <div style={{\n                    position: 'relative',\n                    borderRadius: 32,\n                    overflow: 'hidden',\n                    background: 'rgba(5,5,5,0.85)',\n                    border: '1px solid rgba(212,175,55,0.25)',\n                    boxShadow: '0 0 0 1px rgba(212,175,55,0.12), 0 0 40px rgba(212,175,55,0.15), 0 0 80px rgba(212,175,55,0.07), inset 0 0 60px rgba(212,175,55,0.03)',\n                    animation: 'mixerPulse 3s ease-in-out infinite',\n                  }}>\n                    <style>{`\n                      @keyframes mixerPulse {\n                        0%,100% { box-shadow: 0 0 0 1px rgba(212,175,55,0.12), 0 0 40px rgba(212,175,55,0.15), 0 0 80px rgba(212,175,55,0.07), inset 0 0 60px rgba(212,175,55,0.03); }\n                        50%     { box-shadow: 0 0 0 1px rgba(212,175,55,0.28), 0 0 60px rgba(212,175,55,0.28), 0 0 120px rgba(212,175,55,0.14), inset 0 0 80px rgba(212,175,55,0.06); }\n                      }\n                      @keyframes orbFloat {\n                        0%,100% { transform: translateY(0px) scale(1); opacity: 0.7; }\n                        50%     { transform: translateY(-4px) scale(1.04); opacity: 1; }\n                      }\n                      @keyframes ringRotate {\n                        from { transform: rotate(0deg); }\n                        to   { transform: rotate(360deg); }\n                      }\n                      @keyframes ringRotateR {\n                        from { transform: rotate(0deg); }\n                        to   { transform: rotate(-360deg); }\n                      }\n                      @keyframes transmitShine {\n                        0%   { background-position: -200% center; }\n                        100% { background-position: 200% center; }\n                      }\n                      .mixer-freq-orb {\n                        position: relative;\n                        display: inline-flex;\n                        align-items: center;\n                        gap: 8px;\n                        padding: 10px 16px;\n                        border-radius: 100px;\n                        font-size: 13px;\n                        font-weight: 700;\n                        color: rgba(255,255,255,0.92);\n                        background: rgba(212,175,55,0.06);\n                        border: 1px solid rgba(212,175,55,0.22);\n                        animation: orbFloat 3s ease-in-out infinite;\n                        backdrop-filter: blur(12px);\n                        transition: all 0.25s;\n                      }\n                      .mixer-freq-orb::before {\n                        content: '';\n                        position: absolute;\n                        inset: -1px;\n                        border-radius: 100px;\n                        background: linear-gradient(135deg, rgba(212,175,55,0.18), transparent, rgba(212,175,55,0.08));\n                        pointer-events: none;\n                      }\n                      .mixer-remove-btn {\n                        display: flex; align-items: center; justify-content: center;\n                        width: 18px; height: 18px; border-radius: 50%;\n                        background: rgba(255,255,255,0.06); border: none;\n                        cursor: pointer; color: rgba(255,255,255,0.35);\n                        transition: all 0.2s; flex-shrink: 0;\n                      }\n                      .mixer-remove-btn:hover { background: rgba(239,68,68,0.2); color: #ef4444; }\n                    `}</style>\n\n                    {/* Sacred geometry background rings */}\n                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden' }}>\n                      <div style={{ width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.06)', animation: 'ringRotate 20s linear infinite', position: 'absolute' }} />\n                      <div style={{ width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.05)', animation: 'ringRotateR 15s linear infinite', position: 'absolute' }} />\n                      <div style={{ width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.08)', animation: 'ringRotate 10s linear infinite', position: 'absolute' }} />\n                      {/* Central Sri Yantra dot */}\n                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 12px rgba(212,175,55,0.9), 0 0 30px rgba(212,175,55,0.5)', position: 'absolute', opacity: 0.6 }} />\n                      {/* Radial glow */}\n                      <div style={{ width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', position: 'absolute' }} />\n                    </div>\n\n                    {/* Header */}\n                    <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px 12px', borderBottom: '1px solid rgba(212,175,55,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>\n                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>\n                        {/* Yantra icon */}\n                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(212,175,55,0.20)' }}>\n                          <svg width="16" height="16" viewBox="0 0 100 100" fill="none">\n                            <polygon points="50,8 92,72 8,72" fill="none" stroke="#D4AF37" strokeWidth="4" strokeLinejoin="round"/>\n                            <polygon points="50,92 8,28 92,28" fill="none" stroke="#D4AF37" strokeWidth="4" strokeLinejoin="round"/>\n                            <circle cx="50" cy="50" r="5" fill="#D4AF37"/>\n                          </svg>\n                        </div>\n                        <div>\n                          <p style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em', color: '#D4AF37', textShadow: '0 0 12px rgba(212,175,55,0.4)', margin: 0 }}>\n                            Aetheric Mixer\n                          </p>\n                          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: 0 }}>\n                            Quantum Blend Chamber\n                          </p>\n                        </div>\n                      </div>\n                      {/* Slot counter as glowing orbs */}\n                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>\n                        {Array.from({ length: AETHERIC_MIXER_MAX_SLOTS }).map((_, i) => (\n                          <div key={i} style={{\n                            width: 6, height: 6, borderRadius: '50%',\n                            background: i < selectedActivations.length ? '#D4AF37' : 'rgba(255,255,255,0.08)',\n                            boxShadow: i < selectedActivations.length ? '0 0 6px rgba(212,175,55,0.8)' : 'none',\n                            transition: 'all 0.3s',\n                          }} />\n                        ))}\n                      </div>\n                    </div>\n\n                    {/* Frequency orbs */}\n                    <div style={{ position: 'relative', zIndex: 1, padding: '16px 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>\n                      {selectedActivations.map((act, idx) => (\n                        <span\n                          key={act.id}\n                          className="mixer-freq-orb"\n                          style={{ animationDelay: `${idx * 0.18}s`, borderColor: `${act.color}40` }}\n                        >\n                          {/* Type color dot */}\n                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: act.color, boxShadow: `0 0 6px ${act.color}`, flexShrink: 0, display: 'inline-block' }} />\n                          {act.name}\n                          <button\n                            type="button"\n                            onClick={() => removeActivation(act.id)}\n                            className="mixer-remove-btn"\n                            aria-label="Remove"\n                          >\n                            <X size={10} />\n                          </button>\n                        </span>\n                      ))}\n                    </div>\n\n                    {/* Transmit button */}\n                    <div style={{ position: 'relative', zIndex: 1, padding: '4px 16px 18px' }}>\n                      <button\n                        type="button"\n                        onClick={transmitCocktail}\n                        disabled={selectedActivations.length === 0}\n                        style={{\n                          width: '100%',\n                          padding: '16px',\n                          borderRadius: 100,\n                          border: '1px solid rgba(212,175,55,0.5)',\n                          background: 'linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #B8960C 100%)',\n                          backgroundSize: '200% auto',\n                          animation: 'transmitShine 3s linear infinite',\n                          color: '#050505',\n                          fontSize: 12,\n                          fontWeight: 900,\n                          letterSpacing: '0.22em',\n                          textTransform: 'uppercase',\n                          cursor: selectedActivations.length === 0 ? 'default' : 'pointer',\n                          opacity: selectedActivations.length === 0 ? 0.2 : 1,\n                          boxShadow: '0 0 20px rgba(212,175,55,0.35), 0 0 50px rgba(212,175,55,0.18)',\n                          fontFamily: 'inherit',\n                          display: 'flex',\n                          alignItems: 'center',\n                          justifyContent: 'center',\n                          gap: 10,\n                        }}\n                      >\n                        <span style={{ fontSize: 16 }}>⟁</span>\n                        Transmit to Field\n                      </button>\n                    </div>\n                  </div>\n                )}\n                <div className="relative">\n                  <div\n                    className={libraryUnlocked ? '' : 'pointer-events-none blur-md saturate-50 opacity-[0.42]'}\n                    style={{ transition: 'filter 0.35s ease, opacity 0.35s ease' }}\n                  >\n                    <Suspense fallback={\n                      <div className="glass-card rounded-[28px] p-6">\n                        <div className="mb-4">\n                          <h2 className="text-sm font-black tracking-[-0.03em]">Frequency Library</h2>\n                          <p className="mt-0.5 text-[13px] text-white/35">Loading quantum essences...</p>\n                        </div>\n                        <div className="mb-3 h-8 animate-pulse rounded-xl bg-white/[0.03]" />\n                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">\n                          <div className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />\n                          <div className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />\n                        </div>\n                      </div>\n                    }>\n                      <FrequencyLibrarySection\n                        activeCategory={activeCategory}\n                        setActiveCategory={setActiveCategory}\n                        selectedActivations={selectedActivations}\n                        addActivation={addActivation}\n                        maxSlots={AETHERIC_MIXER_MAX_SLOTS}\n                        activeTransmissionKeys={activeTransmissionKeys}\n                      />\n                    </Suspense>\n                  </div>\n                  {!libraryUnlocked && (\n                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[28px] bg-black/25 px-6 text-center">\n                      <p className="max-w-sm text-[13px] font-semibold leading-relaxed text-white/88">\n                        {t('quantumApothecaryChat.voiceScanRequired')}\n                      </p>\n                    </div>\n                  )}\n                </div>\n\n                </div>\n              </div>\n\n            </div>\n          ) : (\n            <div ref={chatPanelRef} className="w-full min-w-0">\n              {renderChatPanel()}\n            </div>\n          )}\n        </div>\n      </div>\n\n      {/* ââââââââââââââââââââââââââââââââââ\n          KNOWLEDGE MODAL — SQI-2050 Style\n          Logic UNCHANGED\n          ââââââââââââââââââââââââââââââââââ */}\n      <AnimatePresence>\n        {showKnowledge && (\n          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}\n            className="fixed inset-0 z-50 flex items-center justify-center p-4"\n            style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)' }}>\n            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}\n              className="glass-card max-w-lg w-full max-h-[80vh] overflow-y-auto p-7 space-y-5">\n              <div className="flex justify-between items-start">\n                <div>\n                  <h2 className="text-lg font-black tracking-[-0.05em]">Siddha-Quantum Intelligence</h2>\n                  \n                </div>\n                <button type="button" onClick={() => setShowKnowledge(false)} className="p-2 hover:bg-white/5 rounded-xl transition">\n                  <X size={15} className="text-white/40" />\n                </button>\n              </div>\n              {[\n                { t: t('quantumApothecaryChat.faq.whatIsThis.t'), d: t('quantumApothecaryChat.faq.whatIsThis.d') },\n                { t: t('quantumApothecaryChat.faq.nadiScan.t'), d: t('quantumApothecaryChat.faq.nadiScan.d') },\n                { t: t('quantumApothecaryChat.faq.persistentTransmission.t'), d: t('quantumApothecaryChat.faq.persistentTransmission.d') },\n                { t: t('quantumApothecaryChat.faq.siddhaWisdom.t'), d: t('quantumApothecaryChat.faq.siddhaWisdom.d') },\n              ].map(s => (\n                <div key={s.t} className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">\n                  <h3 className="text-xs font-black tracking-tight text-[#D4AF37] mb-2">{s.t}</h3>\n                  <p className="text-xs text-white/50 leading-relaxed">{s.d}</p>\n                </div>\n              ))}\n              <button type="button" onClick={() => setShowKnowledge(false)} className="sqi-btn-primary w-full py-3.5 text-xs">\n                Return to Aether\n              </button>\n            </motion.div>\n          </motion.div>\n        )}\n      </AnimatePresence>\n\n      {/* ââââââââââââââââââââââââââââââââââ\n          SESSION HISTORY DRAWER — Logic UNCHANGED\n          ââââââââââââââââââââââââââââââââââ */}\n      <AnimatePresence>\n        {sessionsOpen && (\n          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}\n            className="fixed inset-0 z-40" style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(8px)' }}\n            onClick={() => setSessionsOpen(false)}>\n            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}\n              className="absolute right-0 top-0 h-full w-72 sm:w-80 flex flex-col border-l border-white/[0.05]"\n              style={{ background: '#050505' }}\n              onClick={e => e.stopPropagation()}>\n              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">\n                <div>\n                  <p className="text-xs font-black uppercase tracking-[0.3em]">{t("quantumApothecaryChat.sqiSessions")}</p>\n                  <p className="text-[9px] font-bold text-white/30 mt-0.5">\n                    {user ? t('quantumApothecaryChat.tapToReopen') : t('quantumApothecaryChat.signInSave')}\n                  </p>\n                </div>\n                <button type="button" onClick={() => setSessionsOpen(false)} className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition">\n                  <X size={14} className="text-white/40" />\n                </button>\n              </div>\n              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">\n                {loadingSessions && <div className="text-[10px] font-bold uppercase tracking-widest text-white/25">{t("quantumApothecaryChat.loadingSessions")}</div>}\n                {!loadingSessions && sessions.length === 0 && (\n                  <div className="text-[10px] text-white/25 leading-relaxed">\n                    No prior SQI conversations yet. Your next transmission will be stored here.\n                  </div>\n                )}\n                {sessions.map(s => (\n                  <button key={s.id}\n                    onClick={async () => {\n                      if (!user) return;\n                      const { data, error } = await supabase.from('sqi_sessions').select('messages').eq('id', s.id).eq('user_id', user.id).single();\n                      if (!error && data && Array.isArray(data.messages)) { setCurrentSessionId(s.id); setMessages(data.messages as Message[]); setSessionsOpen(false); }\n                    }}\n                    className={`w-full text-left p-3.5 rounded-2xl border bg-white/[0.02] hover:bg-white/[0.05] transition ${currentSessionId === s.id ? 'border-[#D4AF37]/40' : 'border-white/[0.05]'}`}>\n                    <p className="text-[11px] font-black truncate">{s.title || t('quantumApothecaryChat.untitledSession')}</p>\n                    {s.updated_at && <p className="text-[9px] text-white/30 mt-1 font-bold">{new Date(s.updated_at).toLocaleString()}</p>}\n                  </button>\n                ))}\n              </div>\n            </motion.div>\n          </motion.div>\n        )}\n      </AnimatePresence>\n\n      {/* ââââââââââââââââââââââââââââââââââ\n          SQI-2050 CSS Light-Codes\n          ââââââââââââââââââââââââââââââââââ */}\n      <style>{`\n        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');\n\n        * { font-family: 'Plus Jakarta Sans', sans-serif; }\n\n        /* SQI chat: full panel width — avoid shrink-to-content + harsh word breaks */\n        .qa-sqi-chat .markdown-body {\n          width: 100%;\n          max-width: 100%;\n          min-width: 0;\n          word-break: normal;\n          overflow-wrap: break-word;\n        }\n        .qa-sqi-chat .markdown-body p,\n        .qa-sqi-chat .markdown-body li,\n        .qa-sqi-chat .markdown-body h1,\n        .qa-sqi-chat .markdown-body h2,\n        .qa-sqi-chat .markdown-body h3 {\n          max-width: 100%;\n        }\n\n        /* Transcript must be selectable/copyable (mobile WebKit + inherited UI guards). */\n        .qa-sqi-chat {\n          -webkit-user-select: text;\n          user-select: text;\n          -webkit-touch-callout: default;\n        }\n\n        .sqi-message strong,\n        .sqi-message b {\n          color: rgba(225,210,185,0.92);\n          font-weight: 700;\n        }\n        .sqi-message .sqi-diamond-heading,\n        .sqi-message .sqi-diamond-heading strong,\n        .sqi-message .sqi-diamond-heading b {\n          color: #D4AF37;\n        }\n        .sqi-message p,\n        .sqi-message li {\n          margin-bottom: 12px;\n          word-break: break-word;\n          overflow-wrap: anywhere;\n          white-space: pre-wrap;\n          max-width: 100%;\n        }\n\n        /* ââ SQI-2050 Glassmorphism Standard ââ */\n        .glass-card {\n          background: rgba(255, 255, 255, 0.02);\n          backdrop-filter: blur(40px);\n          -webkit-backdrop-filter: blur(40px);\n          border: 1px solid rgba(255, 255, 255, 0.05);\n          border-radius: 40px;\n        }\n\n        /* ââ Siddha-Gold Primary Button ââ */\n        .sqi-btn-primary {\n          background: linear-gradient(135deg, #D4AF37 0%, #B8940A 100%);\n          color: #050505;\n          border-radius: 20px;\n          font-weight: 900;\n          font-size: 10px;\n          letter-spacing: 0.25em;\n          text-transform: uppercase;\n          transition: all 0.2s ease;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          gap: 8px;\n          box-shadow: 0 0 20px rgba(212,175,55,0.2);\n        }\n        .sqi-btn-primary:hover:not(:disabled) {\n          box-shadow: 0 0 32px rgba(212,175,55,0.4);\n          transform: translateY(-1px);\n        }\n\n        /* ââ Ghost Button ââ */\n        .sqi-btn-ghost {\n          background: rgba(255,255,255,0.02);\n          border: 1px solid rgba(255,255,255,0.08);\n          color: rgba(255,255,255,0.6);\n          border-radius: 20px;\n          font-weight: 800;\n          font-size: 10px;\n          letter-spacing: 0.25em;\n          text-transform: uppercase;\n          transition: all 0.2s ease;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n        }\n        .sqi-btn-ghost:hover {\n          background: rgba(212,175,55,0.08);\n          border-color: rgba(212,175,55,0.25);\n          color: #D4AF37;\n        }\n\n        /* ââ Nadi Line Animations (unchanged) ââ */\n        .nadi-line {\n          stroke-dasharray: 1000;\n          stroke-dashoffset: 1000;\n          animation: draw 10s linear infinite;\n          filter: drop-shadow(0 0 2px currentColor);\n          opacity: 0.3;\n          transition: all 0.5s ease;\n        }\n        .nadi-line.active {\n          opacity: 1;\n          stroke-width: 1.5;\n          filter: drop-shadow(0 0 8px rgba(212,175,55,0.8));\n        }\n        @keyframes draw { to { stroke-dashoffset: 0; } }\n\n        /* ââ Gold Glow Pulse on scan ââ */\n        @keyframes gold-pulse {\n          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }\n          50% { box-shadow: 0 0 40px 8px rgba(212,175,55,0.15); }\n        }\n\n        /* ââ Scrollbar ââ */\n        .custom-scrollbar::-webkit-scrollbar { width: 3px; }\n        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }\n        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 10px; }\n        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.3); }\n  @keyframes scan-line {\n    0%   { background-position: 0 -100%; }\n    100% { background-position: 0 200%; }\n  }\n  @keyframes qa-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }\n  @keyframes qa-glow-pulse { 0%,100%{opacity:0.15} 50%{opacity:0.35} }\n  @keyframes qa-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }\n  @keyframes qa-spin-slow { to{transform:rotate(360deg)} }\n  @keyframes qa-ping-gold { 75%,100%{transform:scale(2.2);opacity:0} }\n  .qa-card-hover { transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s !important; }\n  .qa-card-hover:hover { border-color: rgba(212,175,55,0.25) !important; box-shadow: 0 0 40px rgba(212,175,55,0.08) !important; transform: translateY(-2px) !important; }\n  .qa-btn-shine { position:relative; overflow:hidden; }\n  .qa-btn-shine::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%); background-size:200% 100%; animation:qa-shimmer 3s infinite; }\n\n  /* ═══ ANCIENT SCRIPTURE SKIN ═══ */\n\n  .sqi-manuscript-scroll {\n    border-radius: 2px !important;\n    position: relative;\n  }\n\n  .sqi-ancient-body p {\n    font-family: 'IM Fell English', Georgia, serif !important;\n    font-size: 17px !important;\n    line-height: 1.9 !important;\n    color: rgba(225,210,185,0.92) !important;\n    margin-bottom: 16px !important;\n    width: 100% !important;\n    padding: 0 14px !important;\n  }\n\n  .sqi-ancient-body p.sqi-nadi-line,\n  .sqi-ancient-body .sqi-nadi-line,\n  p.sqi-nadi-line,\n  .sqi-nadi-line {\n    font-family: 'Plus Jakarta Sans', sans-serif !important;\n    font-size: 11px !important;\n    line-height: 1.5 !important;\n    color: #22D3EE !important;\n    margin: 0 !important;\n    font-style: normal !important;\n    font-weight: 600 !important;\n    opacity: 0.8;\n    letter-spacing: 0.02em !important;\n  }\n\n  @keyframes hShimmer {\n    0% { background-position: 200% center; }\n    100% { background-position: -200% center; }\n  }\n\n  @keyframes pillBreath {\n    0%,100% { box-shadow:0 0 0 1px rgba(212,175,55,0.10),0 0 12px rgba(212,175,55,0.12),0 0 28px rgba(212,175,55,0.07),inset 0 0 14px rgba(212,175,55,0.03); }\n    50%      { box-shadow:0 0 0 1px rgba(212,175,55,0.20),0 0 22px rgba(212,175,55,0.22),0 0 44px rgba(212,175,55,0.12),inset 0 0 22px rgba(212,175,55,0.06); }\n  }\n  @keyframes micPulse {\n    0%,100% { box-shadow:0 0 8px rgba(212,175,55,0.35),0 0 18px rgba(212,175,55,0.18); }\n    50%      { box-shadow:0 0 16px rgba(212,175,55,0.65),0 0 32px rgba(212,175,55,0.32); }\n  }\n  @keyframes bannerAura {\n    0%,100% { box-shadow: 0 0 0 1px rgba(212,175,55,0.18), 0 2px 18px rgba(212,175,55,0.10); }\n    50%      { box-shadow: 0 0 0 1px rgba(212,175,55,0.32), 0 2px 32px rgba(212,175,55,0.20); }\n  }\n  @keyframes yPulse {\n    0%,100% { filter: drop-shadow(0 0 2px rgba(212,175,55,0.7)) drop-shadow(0 0 6px rgba(212,175,55,0.35)); }\n    50%     { filter: drop-shadow(0 0 6px rgba(212,175,55,1))   drop-shadow(0 0 14px rgba(212,175,55,0.65)); }\n  }\n\n  .rx-pulse-dot {\n    display: inline-block;\n    width: 7px; height: 7px;\n    border-radius: 50%;\n    background: #D4AF37;\n    box-shadow: 0 0 6px #D4AF37, 0 0 14px rgba(212,175,55,0.55);\n    animation: rxPulse 1.8s ease-in-out infinite;\n    flex-shrink: 0;\n  }\n  @keyframes rxPulse {\n    0%,100% { opacity:1; transform:scale(1); }\n    50%      { opacity:0.4; transform:scale(0.65); }\n  }\n\n  .sqi-ancient-body .sqi-diamond-heading {\n    /* Layout only — shimmer lives on .sqi-master-name-shimmer spans, NOT this container div.\n       Applying background-clip:text to a flex container breaks child span rendering on iOS/Android. */\n    margin-bottom: 12px !important;\n    display: flex !important;\n    align-items: center !important;\n    overflow: visible !important;\n  }\n  .sqi-master-shimmer {\n    font-family: 'Cinzel', serif !important;\n    font-size: 26px !important;\n    font-weight: 600 !important;\n    letter-spacing: 0.04em !important;\n    line-height: 1.2 !important;\n    background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%) !important;\n    background-size: 200% auto !important;\n    -webkit-background-clip: text !important;\n    background-clip: text !important;\n    -webkit-text-fill-color: transparent !important;\n    animation: hShimmer 5s linear infinite !important;\n    margin-bottom: 12px !important;\n    text-shadow: none !important;\n  }\n\n  .sqi-ancient-body strong,\n  .sqi-ancient-body b {\n    color: #D4AF37 !important;\n    font-family: 'IM Fell English', Georgia, serif !important;\n    font-size: 1em !important;\n    letter-spacing: 0 !important;\n    font-weight: 400 !important;\n    font-style: normal !important;\n    text-shadow: none !important;\n  }\n\n  .sqi-ancient-body li {\n    font-family: 'IM Fell English', Georgia, serif !important;\n    font-size: 18px !important;\n    line-height: 1.85 !important;\n    color: rgba(225,210,185,0.85) !important;\n  }\n      `}</style>\n\n      {/* Scroll-to-top FAB */}\n      <ScrollToTopButton />\n    </div>\n  );\n}\n\nfunction ScrollToTopButton() {\n  const [show, setShow] = useState(false);\n  useEffect(() => {\n    const onScroll = () => setShow(window.scrollY > 600);\n    onScroll();\n    window.addEventListener('scroll', onScroll, { passive: true });\n    return () => window.removeEventListener('scroll', onScroll);\n  }, []);\n  if (!show) return null;\n  return (\n    <button\n      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}\n      className="hidden"\n      aria-label={t("quantumApothecaryChat.scrollToTop")}\n    >\n      <ChevronUp size={20} />\n    </button>\n  );\n}\n\n/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââ\n   OUTER WRAPPER — auth shell only\n   Tier access is enforced by QuantumApothecaryGate on the /quantum-apothecary route.\n   Do not gate on membership loading here: periodic membership refetches were setting\n   loading=true and unmounting the whole page (felt like endless reload).\n   ââââââââââââââââââââââââââââââââââââââââââââââââââââââ */\nexport default function QuantumApothecary() {\n  const { user, isLoading: authLoading } = useAuth();\n\n  if (authLoading) {\n    return (\n      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">\n        <span className="text-[10px] uppercase tracking-[0.5em] text-[#D4AF37]/40">Initializing SQI…</span>\n      </div>\n    );\n  }\n\n  if (!user) return <Navigate to="/auth" replace />;\n\n  return <QuantumApothecaryInner />;\n}\n