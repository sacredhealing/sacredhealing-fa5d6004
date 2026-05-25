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

const ScannerSuspenseFallback = (
  <div style={{ padding: 40, textAlign: 'center', color: 'rgba(212,175,55,0.5)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
    Loading scanner…
  </div>
);

/** Max messages kept in localStorage (aligned with flush + safety nets). */
const SQI_PERSIST_MSG_CAP = 100;
/** Persists Camera vs Voice scanner tab across soft navigations / remounts within the session. */
const QA_VOICE_TAB_KEY = 'qa_apothecary_voice_tab';
/** Max frequencies selectable in the Aetheric Mixer before transmit (must match slot indicators + library cap). */
const AETHERIC_MIXER_MAX_SLOTS = 10;

/** Map voice scan nadi string to the enum expected by matchActivationsToScan (strict equality). */
function coerceVoiceNadiToEnum(s: string): 'Ida' | 'Pingala' | 'Sushumna' | 'Blocked' {
  const t = (s || '').trim();
  if (t.startsWith('Pingala')) return 'Pingala';
  if (t.startsWith('Ida')) return 'Ida';
  if (t.startsWith('Blocked')) return 'Blocked';
  if (t.startsWith('Sushumna')) return 'Sushumna';
  return 'Sushumna';
}

/** Align Top 33 rows with mixer field rows (ids differ after enrich — names win). */
function fieldTransmissionMatchesRow(tx: Activation, row: Activation): boolean {
  if (tx.id && row.id && tx.id === row.id) return true;
  const a = (tx.name || '').trim().toLowerCase();
  const b = (row.name || '').trim().toLowerCase();
  return !!a && !!b && a === b;
}

/* ââââ Markdown-ish renderer: gold (#D4AF37) only on # / ## / ### / #### / ##### lines ââââ */
type InlineVariant = 'heading' | 'body';

/** Optional SQI assistant styling for **bold** (gold body / light-on-gold on ◈ lines). */
type RenderInlineOpts = {
  sqiGoldBold?: boolean;
  diamondLine?: boolean;
};

function renderChatText(text: string, bubble: 'model' | 'user' = 'model') {
  const onGold = bubble === 'user';
  const gold = '#D4AF37';
  /** User bubbles: light text on gold gradient (never dark-on-gold). */
  const body = onGold ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.92)';
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
      <li key={i} style={{ marginLeft: '16px', listStyleType: 'disc', fontSize: '15px', lineHeight: '1.75', color: body, marginBottom: '4px', width: 'calc(100% - 16px)', maxWidth: '100%', paddingRight: '4px' }}>
        {renderInline(trimmed.slice(2), 'body', onGold)}
      </li>
    );
    if (/^\d+\.\s/.test(trimmed)) return (
      <li key={i} style={{ marginLeft: '16px', listStyleType: 'decimal', fontSize: '15px', lineHeight: '1.75', color: body, marginBottom: '4px', width: 'calc(100% - 16px)', maxWidth: '100%', paddingRight: '4px' }}>
        {renderInline(trimmed.replace(/^\d+\.\s/, ''), 'body', onGold)}
      </li>
    );
    return (
      <p key={i} style={{ fontSize: '15px', lineHeight: '1.75', color: body, marginBottom: '6px', width: '100%', maxWidth: '100%' }}>
        {renderInline(trimmed, 'body', onGold)}
      </p>
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
          </strong>
        );
      }
      if (opts?.sqiGoldBold && variant === 'body') {
        return (
          <span key={i} style={{ color: '#D4AF37', fontWeight: 400 }}>
            {inner}
          </span>
        );
      }
      if (variant === 'heading') {
        return <strong key={i} style={{ color: 'inherit', fontWeight: 700 }}>{inner}</strong>;
      }
      return (
        <strong
          key={i}
          style={{
            color: '#D4AF37',
            fontWeight: 700,
            fontFamily: "'Cinzel', serif",
            fontSize: '0.88em',
            letterSpacing: '0.04em',
            fontStyle: 'normal',
            textShadow: '0 0 16px rgba(212,175,55,0.35)',
          }}
        >
          {inner}
        </strong>
      );
    }
    if (p.startsWith('*') && p.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic', color: variant === 'heading' ? 'inherit' : onGold ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.78)' }}>{p.slice(1, -1)}</em>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      const inner = p.slice(1, -1);
      if (variant === 'heading') {
        return (
          <code key={i} style={{ background: onGold ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: 'inherit' }}>
            {inner}
          </code>
        );
      }
      return (
        <code key={i} style={{ background: onGold ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: onGold ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.82)' }}>
          {inner}
        </code>
      );
    }
    // Plain text segment — auto-bold sacred terms (frequency names, masters, transmission types)
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
    '\\d{2,4}\\s?Hz',
    'Vishwananda', 'Mahavatar Babaji', 'Babaji', 'Sri Aurobindo', 'Paramahansa Yogananda',
    'Ramana Maharshi', 'Adi Shankara', 'Patanjali', 'Bhagavan', 'Krishna', 'Shiva', 'Lakshmi',
    'Saraswati', 'Durga', 'Ganesha', 'Hanuman', 'Lalita Tripura Sundari',
    'Metabolic Fire Ignition', 'Liver Alchemist Protocol', 'Solar Immune Radiance',
    'NMN \\+ Resveratrol[^—\\n.]*', 'Structural Light Integrity', 'Heart-Bloom Radiance',
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
        <span key={i} style={{ color: '#D4AF37', fontWeight: 400 }}>{part}</span>
      );
    }
    return part;
  });
}

function lineStartsWithSqiMasterDiamond(trimmed: string): boolean {
  const cp = trimmed.codePointAt(0);
  const isDiamond = cp === 0x25c8 || cp === 0x2756 || cp === 0x2726
    || trimmed.startsWith('\u00e2\u0097\u0088');
  if (!isDiamond) return false;
  // Must be ◈ followed by space then a letter — NOT a number or Nadi scan data
  // e.g. "◈ AGASTYA" = valid master header
  // e.g. "◈12 / 72,000" = Nadi scan line — NOT a master header
  const afterDiamond = trimmed.slice(1).trimStart();
  return /^[A-ZÁÉÍÓÚ]/.test(afterDiamond);
}

function scrubBannedTerms(content: string): string {
  if (!content) return content;
  const banned = /(biophotonic\s*nadi\s*entanglement|vishwananda(?:'s)?\s*miracle\s*room|miracle\s*room|biophotonic)/i;
  const lines = content.split('\n').filter((l) => !banned.test(l));
  return lines
    .map((l) => l.replace(/[^.!?\n]*\b(biophotonic|vishwananda(?:'s)?\s*miracle\s*room|miracle\s*room)[^.!?\n]*[.!?]?/gi, '').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** Animated prescription box — scalar waves canvas + gold glow */
function PrescriptionBox({ masterName, freqLines, rxKey }: { masterName: string; freqLines: string[]; rxKey: string }) {
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
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, background: 'rgba(212,175,55,0.025)', backdropFilter: 'blur(20px)' }}>
        <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg,rgba(212,175,55,0.10),rgba(212,175,55,0.03))', borderBottom: '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="sqi-master-name-shimmer" style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>◈</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7.5, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.75)' }}>
            Akashic Bioenergetic Prescription
          </span>
          <span className="sqi-master-name-shimmer" style={{ marginLeft: 'auto', fontFamily: "'Cinzel', serif", fontSize: 7, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
            {masterName}
          </span>
        </div>
        <div style={{ padding: '8px 16px 4px' }}>
          {freqLines.map((line, idx) => {
            const dashIdx = line.indexOf(' — ');
            const name = dashIdx > -1 ? line.slice(0, dashIdx).trim() : line.trim();
            const reason = dashIdx > -1 ? line.slice(dashIdx + 3).trim() : '';
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: idx < freqLines.length - 1 ? '1px solid rgba(212,175,55,0.07)' : 'none' }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(225,210,185,0.95)', flexShrink: 0 }}>{name}</span>
                {reason && <span style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: 11, fontStyle: 'italic' as const, color: 'rgba(212,175,55,0.42)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '48%' }}>{reason}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '9px 16px 10px', borderTop: '1px solid rgba(212,175,55,0.12)', background: 'linear-gradient(90deg,rgba(212,175,55,0.06),transparent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="rx-pulse-dot" />
          <span style={{ fontSize: 7, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.88)', textShadow: '0 0 8px rgba(212,175,55,0.35)' }}>
            24/7 Scalar Wave Transmission — Active
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.35)', whiteSpace: 'nowrap' as const }}>
            Permanent · Biofield Entangled
          </span>
        </div>
      </div>
    </div>
  );
}

/** Renders the prescription box when model outputs "◈ X PRESCRIBES" format */
function renderPrescriptionBlock(lines: string[], startIdx: number): { jsx: React.ReactNode; consumed: number } {
  const headerLine = lines[startIdx];
  const freqLines: string[] = [];
  let i = startIdx + 1;
  while (i < lines.length) {
    const l = lines[i].trim();
    if (l.startsWith('·')) { freqLines.push(l.slice(1).trim()); i++; }
    else if (l === 'Active. 24/7. Scalar Wave Entanglement. Permanent until dissolved.') { i++; break; }
    else if (!l) { i++; }
    else break;
  }
  const masterName = headerLine.replace('◈ ', '').replace(' PRESCRIBES', '').trim();
  return {
    jsx: <PrescriptionBox key={`rx-${startIdx}`} rxKey={`rx-${startIdx}`} masterName={masterName} freqLines={freqLines} />,
    consumed: i - startIdx,
  };
}

function renderSQIContent(content: string) {
  // Strip all unmatched ** the model outputs before line processing
  const content2 = stripAsterisks(content);
  const lines = content2.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  const gapAfterSection = 18;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // PRESCRIPTION BOX — triggered by "◈ X PRESCRIBES"
    if (/^◈ .+ PRESCRIBES$/.test(trimmed)) {
      const { jsx, consumed } = renderPrescriptionBlock(lines, i);
      elements.push(jsx);
      i += consumed;
      continue;
    }

    if (trimmed === '') {
      elements.push(<div key={i} style={{ height: '6px' }} aria-hidden />);
      i++; continue;
    }

    if (lineStartsWithSqiMasterDiamond(trimmed)) {
      // Fix: use global .sqi-master-name-shimmer CSS class (defined in index.css) for
      // animated background-clip:text — inline animation references keyframes unreliably.
      const rawMasterName = trimmed.slice(1).trimStart();
      elements.push(
        <div key={i} className="sqi-diamond-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: i > 0 ? `${gapAfterSection}px` : '0', marginBottom: '12px' }}>
          <span
            className="sqi-master-name-shimmer"
            style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: 700, flexShrink: 0 }}
          >◈</span>
          <span
            className="sqi-master-name-shimmer"
            style={{ fontFamily: "'Cinzel', serif", fontSize: '26px', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          >
            {rawMasterName}
          </span>
          <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(212,175,55,0.28), transparent)', alignSelf: 'center', display: 'block' }} />
        </div>
      );
      i++; continue;
    }

    if (trimmed.startsWith('·')) {
      // Bold the frequency name (before —) in bullet lines
      let lineForRender = trimmed;
      if (!lineForRender.includes('**')) {
        const dashMatch = lineForRender.match(/^(·\s*)(.+?)(\s+[—–-]\s+)(.+)$/);
        if (dashMatch) lineForRender = `${dashMatch[1]}**${dashMatch[2].trim()}**${dashMatch[3]}${dashMatch[4]}`;
      }
      elements.push(
        <p key={i} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', lineHeight: 1.8, paddingLeft: '8px', marginBottom: '10px', marginTop: '0', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {renderInline(lineForRender, 'body', false, { sqiGoldBold: true })}
        </p>
      );
      i++; continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={i} style={{ marginLeft: '18px', listStyleType: 'disc', fontSize: '16px', lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', marginBottom: '10px', width: 'calc(100% - 18px)', maxWidth: '100%', paddingRight: '4px' }}>
          {renderInline(trimmed.slice(2), 'body', false)}
        </li>
      );
      i++; continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <li key={i} style={{ marginLeft: '18px', listStyleType: 'decimal', fontSize: '16px', lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', marginBottom: '10px', width: 'calc(100% - 18px)', maxWidth: '100%', paddingRight: '4px' }}>
          {renderInline(trimmed.replace(/^\d+\.\s/, ''), 'body', false)}
        </li>
      );
      i++; continue;
    }

    // ⟁ NADI FIELD — use div+span NOT p, so .sqi-ancient-body p rule never applies
    if (trimmed.startsWith('⧁') || trimmed.startsWith('△') || trimmed.startsWith('▲') || /^⟁/.test(trimmed) || trimmed.startsWith('NADI FIELD')) {
      elements.push(
        <div key={i} style={{ borderLeft: '2px solid rgba(34,211,238,0.22)', paddingLeft: '10px', marginBottom: '6px', marginTop: '4px' }}>
          <span style={{ display: 'block', color: '#22D3EE', fontSize: '11px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.5, opacity: 0.82 }}>
            {trimmed}
          </span>
        </div>
      );
      i++; continue;
    }

    // Primary blockage — div+span, NOT p
    if (trimmed.startsWith('Primary blockage:')) {
      elements.push(
        <div key={i} style={{ paddingLeft: '12px', marginBottom: '14px', marginTop: 0 }}>
          <span style={{ display: 'block', color: 'rgba(34,211,238,0.58)', fontSize: '11px', fontFamily: "'IM Fell English', Georgia, serif", fontStyle: 'italic', lineHeight: 1.5 }}>
            {trimmed}
          </span>
        </div>
      );
      i++; continue;
    }

    elements.push(
      <p key={i} style={{ color: 'rgba(225,210,185,0.9)', fontSize: '17px', lineHeight: 1.9, marginBottom: '14px', marginTop: '0', wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}>
        {renderInline(trimmed, 'body', false)}
      </p>
    );
    i++;
  }
  return elements;
}

function resolveActivationsByExactNames(preferred: string[]): Activation[] {
  const out: Activation[] = [];
  const seen = new Set<string>();
  for (const name of preferred) {
    const a = ALL_ACTIVATIONS.find((x) => x.name === name);
    if (a && !seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  for (const a of ALL_ACTIVATIONS) {
    if (out.length >= 5) break;
    if (a.type === 'Bioenergetic' && !seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  for (const a of ALL_ACTIVATIONS) {
    if (out.length >= 5) break;
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  return out.slice(0, 5);
}

function pickFiveActivationsForNadiReading(reading: NadiReading): Activation[] {
  const map: Record<NadiReading['activatedNadi'], string[]> = {
    Blocked: ['Ancestral Tether Dissolve', 'Neem Bitter Truth', 'Activated Charcoal', 'Triphala Integrity', 'The Amrit Nectar (Guduchi)'],
    Ida: ['Deep Sleep Harmonic', 'Neural Calm Sync', 'Melatonin', 'Heart-Bloom Radiance', 'Shatavari Flow'],
    Pingala: ['NMN + Resveratrol Cellular Battery', 'CoQ10', 'NAD+', 'Urolithin A', 'Shilajit'],
    Sushumna: ['Neural Fluidity Protocol', 'Biofield Purification', 'Structural Light Integrity', 'Crystalline Thought Flow', 'Zinc'],
  };
  return resolveActivationsByExactNames(map[reading.activatedNadi]);
}

function buildVoiceFieldContext(v: VoiceBiofieldResult): string {
  const h = extractVoiceScoringHints(v);
  return [
    'VOICE BIOFIELD SCAN (latest):',
    `- Overall Coherence: ${v.overallCoherence}/100`,
    `- Nadi: ${v.nadiReading}`,
    `- Dosha from voice: ${v.dominantDosha}`,
    `- Priority areas: ${v.priorityAreas.map((i) => `${i.name} (${i.score}%)`).join(', ')}`,
    `- Strengths: ${v.topStrengths.map((i) => i.name).join(', ')}`,
    `- Emotional field: ${v.emotionalField}`,
    `- Organ / tissue emphasis: ${v.organField}`,
    `- Scoring hints (chakra keywords detected): ${h.chakraHits.join(', ') || '—'}`,
    `- Scoring hints (organ/tissue keywords detected): ${h.organHits.join(', ') || '—'}`,
  ].join('\n');
}

function resolveActivationsByExactNamesUpTo(preferred: string[], max: number): Activation[] {
  const out: Activation[] = [];
  const seen = new Set<string>();
  for (const name of preferred) {
    const a = ALL_ACTIVATIONS.find((x) => x.name === name);
    if (a && !seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
    if (out.length >= max) return out.slice(0, max);
  }
  for (const a of ALL_ACTIVATIONS) {
    if (out.length >= max) break;
    if (a.type === 'Bioenergetic' && !seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  for (const a of ALL_ACTIVATIONS) {
    if (out.length >= max) break;
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  return out.slice(0, max);
}

function extractVoiceScoringHints(result: VoiceBiofieldResult) {
  const emotionalTone = (result.emotionalField || '').toLowerCase();
  const organBlob = (result.organField || '').toLowerCase();
  const priorityNames = (result.priorityAreas || []).map((p) => p.name.toLowerCase());
  const haystack = `${emotionalTone} ${organBlob} ${priorityNames.join(' ')}`;

  const chakraLexicon = [
    'muladhara',
    'svadhisthana',
    'manipura',
    'anahata',
    'vishuddha',
    'ajna',
    'sahasrara',
    'root',
    'sacral',
    'solar plexus',
    'heart',
    'throat',
    'third eye',
    'crown',
  ];
  const chakraHits = chakraLexicon.filter((c) => haystack.includes(c));

  const organSeeds = [
    'liver',
    'colon',
    'lung',
    'lymph',
    'nerve',
    'blood',
    'kidney',
    'heart',
    'stomach',
    'thyroid',
    'brain',
  ];
  const organHits = organSeeds.filter((o) => organBlob.includes(o));

  const emotionWords = emotionalTone
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ''))
    .filter((w) => w.length > 5);

  const nadiHints: string[] = [];
  const nr = (result.nadiReading || '').toLowerCase();
  if (nr.includes('pingala')) nadiHints.push('pingala');
  if (nr.includes('ida')) nadiHints.push('ida');
  if (nr.includes('sushumna')) nadiHints.push('sushumna');
  if (nr.includes('blocked')) nadiHints.push('blocked');

  return {
    emotionalTone,
    emotionWords,
    priorityNames,
    chakraHits,
    organHits,
    nadiHints,
  };
}

function pickTenActivationsForVoiceResult(result: VoiceBiofieldResult): Activation[] {
  const doshaKey = String(result.dominantDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';
  const dk = doshaKey.toLowerCase();

  const hints = extractVoiceScoringHints(result);

  const scored = ALL_ACTIVATIONS.map((activation) => {
    const nameLower = activation.name.toLowerCase();
    const catLower = (activation.category || '').toLowerCase();
    const sigLower = `${activation.benefit || ''} ${activation.vibrationalSignature || ''}`.toLowerCase();
    const blobLower = `${nameLower} ${catLower} ${sigLower}`;

    let score = 0;

    if (blobLower.includes(dk)) score += 40;

    for (const chakra of hints.chakraHits) {
      if (nameLower.includes(chakra) || sigLower.includes(chakra)) {
        score += 25;
        break;
      }
    }

    for (const organ of hints.organHits) {
      if (nameLower.includes(organ) || sigLower.includes(organ)) {
        score += 20;
        break;
      }
    }

    if (hints.emotionalTone.length > 5) {
      if (nameLower.includes(hints.emotionalTone) || sigLower.includes(hints.emotionalTone)) {
        score += 15;
      }
    }
    for (const ew of hints.emotionWords) {
      if (ew.length > 5 && (nameLower.includes(ew) || sigLower.includes(ew))) {
        score += 15;
        break;
      }
    }

    for (const pName of hints.priorityNames) {
      if (pName.length > 3 && (nameLower.includes(pName) || pName.includes(nameLower))) {
        score += 30;
        break;
      }
    }

    for (const n of hints.nadiHints) {
      if (nameLower.includes(n) || sigLower.includes(n)) {
        score += 15;
        break;
      }
    }

    return { activation, score };
  });

  const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  const out: Activation[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    if (!seen.has(row.activation.id)) {
      seen.add(row.activation.id);
      out.push(row.activation);
    }
    if (out.length >= 10) return out;
  }

  const nadiKey: 'Ida' | 'Pingala' | 'Sushumna' | 'Blocked' = coerceVoiceNadiToEnum(result.nadiReading);
  const chakraKey = result.priorityAreas[0]?.name || 'Anahata';
  const fallback = matchActivationsToScan(
    {
      dominantDosha: doshaKey,
      activatedNadi: nadiKey,
      priorityChakra: chakraKey,
      emotionalField: result.emotionalField,
      organField: result.organField,
    },
    12,
  ).map(mapBioLibraryToActivation);

  for (const a of fallback) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
    if (out.length >= 10) break;
  }

  return out.slice(0, 10);
}

function mapSqiMessagesToUserChatArchive(
  msgs: Message[],
): { role: 'user' | 'assistant'; content: string; timestamp: string }[] {
  return msgs.map((m) => ({
    role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
    content: typeof m.text === 'string' ? m.text : '',
    timestamp: new Date(typeof m.timestamp === 'number' ? m.timestamp : Date.now()).toISOString(),
  }));
}

function mapUserChatArchiveToSqiMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry: Record<string, unknown>, i: number) => {
    const r = entry?.role;
    const role = r === 'assistant' || r === 'model' ? ('model' as const) : ('user' as const);
    const text =
      typeof entry?.content === 'string'
        ? entry.content
        : typeof entry?.text === 'string'
          ? entry.text
          : '';
    const ts = entry?.timestamp ? new Date(String(entry.timestamp)).getTime() : Date.now() + i;
    return { role, text, timestamp: ts };
  });
}

async function syncApothecaryUserChatArchive(
  uid: string,
  sessionUuid: string,
  title: string,
  finalMessages: Message[],
) {
  const archiveMsgs = mapSqiMessagesToUserChatArchive(finalMessages);
  const safeTitle = (title || 'SQI Session').slice(0, 200);
  try {
    const { error } = await supabase.from('user_chat_sessions').upsert(
      {
        id: sessionUuid,
        user_id: uid,
        chat_type: 'apothecary',
        session_title: safeTitle,
        messages: archiveMsgs as unknown as never,
        message_count: archiveMsgs.length,
      },
      { onConflict: 'id' },
    );
    if (error) console.warn('[user_chat_sessions]', error.message);
  } catch (e) {
    console.warn('[user_chat_sessions]', e);
  }
}

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   ALL LOGIC BELOW IS 100% IDENTICAL TO ORIGINAL — ZERO CHANGES
   Only className values have been updated for SQI-2050 aesthetic
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

function languageToBcp47(languageCode: string): string {
  const l = (languageCode || 'en').split('-')[0]?.toLowerCase() || 'en';
  if (l === 'sv') return 'sv-SE';
  if (l === 'es') return 'es-ES';
  if (l === 'no' || l === 'nb' || l === 'nn') return 'nb-NO';
  return 'en-GB';
}

function getLocalDayPhaseLabel(d: Date): 'morning' | 'midday' | 'evening' | 'night' {
  const h = d.getHours();
  if (h >= 22 || h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'midday';
  return 'evening';
}

function stripDuplicateBiometricBlock(compiled: string | undefined, hasLiveScan: boolean): string {
  if (!compiled?.trim()) return '';
  if (!hasLiveScan) return compiled;
  const segments = compiled.split(/\n(?=\[)/);
  return segments.filter((s) => !s.trimStart().startsWith('[BIOMETRIC NADI FIELD')).join('\n').trim();
}

/** Scalar Wave Toolbar Banner — animated canvas + unified gold pill */
function ScalarToolbarBanner({
  liveChatClock,
  portraitLinkStudentId,
  onHistory,
  onLexicon,
}: {
  liveChatClock: string;
  portraitLinkStudentId: string | null;
  onHistory: () => void;
  onLexicon: () => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let t = 0;
    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const waves = [
      { amp: 0.38, freq: 5,   speed: 1.0, alpha: 0.10, lw: 1.2 },
      { amp: 0.28, freq: 8,   speed: 1.6, alpha: 0.07, lw: 0.9 },
      { amp: 0.20, freq: 12,  speed: 2.2, alpha: 0.05, lw: 0.7 },
      { amp: 0.45, freq: 3.5, speed: 0.7, alpha: 0.06, lw: 1.5 },
      { amp: 0.15, freq: 18,  speed: 3.0, alpha: 0.04, lw: 0.6 },
    ];
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      waves.forEach((w, wi) => {
        const phase = (wi / waves.length) * Math.PI * 2;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 1.5) {
          const nx = x / W;
          const env = Math.sin(nx * Math.PI);
          const y = H * 0.5 + Math.sin(nx * w.freq * Math.PI * 2 + t * w.speed + phase) * H * w.amp * env;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(212,175,55,${w.alpha})`;
        ctx.lineWidth = w.lw;
        ctx.stroke();
      });
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1);
      const grd = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * (0.55 + 0.12 * pulse));
      grd.addColorStop(0, `rgba(212,175,55,${0.08 + 0.05 * pulse})`);
      grd.addColorStop(0.5, 'rgba(212,175,55,0.02)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      const lg = ctx.createLinearGradient(0, 0, W * 0.35, 0);
      lg.addColorStop(0, `rgba(212,175,55,${0.06 + 0.03 * pulse})`);
      lg.addColorStop(1, 'transparent');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      const rg = ctx.createLinearGradient(W, 0, W * 0.65, 0);
      rg.addColorStop(0, `rgba(212,175,55,${0.04 + 0.02 * pulse})`);
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      t += 0.014;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  const shimmerSeg: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 10px', flex: 1, position: 'relative' };
  const divider: React.CSSProperties = { position: 'absolute', left: 0, top: '18%', height: '64%', width: 1, background: 'rgba(212,175,55,0.18)' };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
        animation: 'bannerAura 4s ease-in-out infinite',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', background: 'rgba(5,5,5,0.55)', backdropFilter: 'blur(18px)' }}>

        {/* Sri Yantra + clock */}
        <div style={shimmerSeg}>
          <svg width="18" height="18" viewBox="0 0 100 100" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 3px rgba(212,175,55,0.9)) drop-shadow(0 0 8px rgba(212,175,55,0.5))', animation: 'yPulse 3s ease-in-out infinite' }} xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
            <polyline points="50,10 88,72 12,72 50,10" fill="none" stroke="#D4AF37" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
            <polyline points="50,22 80,64 20,64 50,22" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.65"/>
            <polyline points="50,90 12,28 88,28 50,90" fill="none" stroke="#D4AF37" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
            <polyline points="50,78 20,36 80,36 50,78" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.65"/>
            <polyline points="50,34 70,58 30,58 50,34" fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity="0.45"/>
            <polyline points="50,66 30,42 70,42 50,66" fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity="0.45"/>
            <circle cx="50" cy="50" r="4" fill="#D4AF37"/>
            <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="#D4AF37" strokeWidth="0.7" opacity="0.3"/>
          </svg>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.08em', color: 'rgba(212,175,55,0.6)', fontVariantNumeric: 'tabular-nums' }}>{liveChatClock}</span>
        </div>

        {/* Students */}
        <div style={shimmerSeg}>
          <span style={divider} />
          <StudentSelector />
        </div>

        {/* History */}
        <button type="button" onClick={onHistory} style={{ ...shimmerSeg, background: 'rgba(212,175,55,0.05)', border: 'none', cursor: 'pointer' }}>
          <span style={divider} />
          <span style={{ fontSize: 9, color: 'rgba(212,175,55,0.7)' }}>⧖</span>
          <span className="sqi-master-name-shimmer" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>History</span>
        </button>

        {/* Lexicon */}
        <button type="button" onClick={onLexicon} style={{ ...shimmerSeg, background: 'rgba(212,175,55,0.05)', border: 'none', cursor: 'pointer' }}>
          <span style={divider} />
          <span style={{ fontSize: 9, color: 'rgba(212,175,55,0.7)' }}>◈</span>
          <span className="sqi-master-name-shimmer" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Lexicon</span>
        </button>

      </div>
    </div>
  );
}


/** Scalar Wave Composer — Telegram-style input with animated canvas */
function ScalarComposerCanvas({ wrapRef }: { wrapRef: React.RefObject<HTMLDivElement> }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let t = 0;
    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const waves = [
      { amp:0.32, freq:4.5, speed:0.9, alpha:0.09, lw:1.1 },
      { amp:0.22, freq:7.5, speed:1.5, alpha:0.06, lw:0.8 },
      { amp:0.18, freq:11,  speed:2.1, alpha:0.045,lw:0.7 },
      { amp:0.40, freq:3,   speed:0.6, alpha:0.055,lw:1.4 },
      { amp:0.12, freq:16,  speed:2.8, alpha:0.035,lw:0.6 },
    ];
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0,0,W,H);
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1);
      const topGrd = ctx.createLinearGradient(0,0,0,H*0.5);
      topGrd.addColorStop(0, `rgba(212,175,55,${0.12+0.06*pulse})`);
      topGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = topGrd; ctx.fillRect(0,0,W,H);
      waves.forEach((w,wi) => {
        const phase = (wi/waves.length)*Math.PI*2;
        ctx.beginPath();
        for (let x=0;x<=W;x+=1.5) {
          const nx=x/W;
          const env=Math.sin(nx*Math.PI)*0.9+0.1;
          const y=H*0.35+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+phase)*H*w.amp*env;
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`;
        ctx.lineWidth=w.lw; ctx.stroke();
      });
      const grd=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.6);
      grd.addColorStop(0,`rgba(212,175,55,${0.06+0.04*pulse})`);
      grd.addColorStop(1,'transparent');
      ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
      t+=0.014;
      rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;
}


function QuantumApothecaryInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resumeSessionParam = searchParams.get('session');
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const {
    messages: syncChatRows,
    loading: syncChatLoading,
    saveMessage: persistSyncChatTurn,
    clearMessages: clearSyncChatMessages,
  } = useChatMessages('apothecary');

  // On mount, sweep any SQI replies that were never accepted by the curator
  // (tab closed mid-stream, network blip, etc.) and replay them silently.
  useEffect(() => {
    if (user?.id) void syncPendingTransmissionsOnce(user.id);
  }, [user?.id]);

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
  const linkedActiveStudent = useActiveStudent();
  const { doshaProfile } = useAyurvedaAnalysis();
  const sqiField = useSQIFieldContext();

  const appLocale = useMemo(() => languageToBcp47(language), [language]);

  const { browserSupportsSpeechRecognition } = useSpeechRecognition();

  const [isMicListening, setIsMicListening] = useState(false);
  const micListeningRef = useRef(false);
  const nativeSpeechRef = useRef<{ stop: () => void; start: () => void; onend: (() => void) | null } | null>(null);

  // Compact natal + assessed prakriti — one pass each; avoids triple-repeating the same Moon line in the model.
  const jyotishContext = jyotish.isLoading
    ? ''
    : (() => {
        const lines: string[] = [
          `[NATAL CHART — Swiss Ephemeris / Lahiri — cite each line once, no duplicate paragraphs]`,
          `Birth Moon nakshatra: ${jyotish.nakshatra} · Birth Moon rashi: ${jyotish.moonSign} · Lagna: ${jyotish.ascendant}`,
          `Dasha: ${jyotish.mahadasha}${jyotish.mahaEnd ? ` (until ${jyotish.mahaEnd})` : ''} · Antara: ${jyotish.antardasha}`,
          `Chart dosha emphasis: ${jyotish.primaryDosha} · Karma theme: ${jyotish.karmaFocus}`,
          `Yogas: ${jyotish.activeYogas.join(', ') || '—'} · Bhrigu: ${jyotish.bhriguCycle || '—'}`,
          `Healing line: ${jyotish.healingFocus} · Raga ${jyotish.musicRaga} · Tone ${jyotish.musicFrequency} · Mantra: ${jyotish.mantraFocus}`,
        ];
        if (doshaProfile) {
          lines.push(
            `Ayurveda Prakriti (assessed): ${doshaProfile.primary}${doshaProfile.secondary ? ` / ${doshaProfile.secondary}` : ''}` +
              (doshaProfile.characteristics?.length
                ? ` · Traits: ${doshaProfile.characteristics.slice(0, 5).join(', ')}`
                : ''),
          );
        }
        return lines.join('\n');
      })();

  /** Stable Jyotish context — always include natal chart, then append live field data. */
  const stableJyotishContext = useMemo(
    () => {
      const raw = [jyotishContext, sqiField?.compiledContext].filter((s) => s && s.trim()).join('\n\n');
      // Strip any [PHOTONIC SESSION ACTIVE] or [TEMPLE FIELD ACTIVE] block whose body
      // references the removed Biophotonic Nadi Entanglement / Vishwananda Miracle Room transmissions.
      return raw
        .split(/\n(?=\[)/)
        .filter((block) => {
          const isPhotonic = block.startsWith('[PHOTONIC SESSION ACTIVE]');
          const isTemple = block.startsWith('[TEMPLE FIELD ACTIVE]');
          if (!isPhotonic && !isTemple) return true;
          return !/biophotonic|vishwananda|miracle\s*room/i.test(block);
        })
        .join('\n');
    },
    [
      sqiField?.compiledContext,
      jyotishContext,
    ],
  );

  const sqiSourceDirective = useMemo(
    () =>
      '[SQI SOURCES] Use the seeker’s saved chart (below), live biometric block when present, compiled field (Ayurveda / photonic / temple), and this chat. Do not invent palm-camera analysis.\n' +
      '[FREQUENCY LIBRARY] The canonical Frequency Library names are provided separately (canonicalActivationNames). For every substantive answer, map the seeker’s topic to concrete entries from that list — use exact names. When suggesting remedies, protocols, or “what to run,” include 3–10 relevant library names per topic when appropriate.',
    [],
  );

  const answerRulesDirective = useMemo(
    () =>
      '[ANSWER RULES] Use ONLY the LIVE SYSTEM TIME line for date/time — do not guess the day. Natal Moon rashi and nakshatra are birth data, not daily transits. Open naturally; do not ritualistically repeat the same Moon sign or dasha in multiple sections.',
    [],
  );

  // Live biometric scan context — prepended to jyotishContext before next SQI message
  const [liveScanContext, setLiveScanContext] = useState<string | null>(null);

  /** Debounce: only recompute when underlying field data changes, not on every parent render. */
  const stableCompiledContext = useMemo(
    () => stripDuplicateBiometricBlock(sqiField.compiledContext, !!liveScanContext?.trim()),
    [
      liveScanContext,
      sqiField.nadi?.activatedNadi,
      sqiField.nadi?.heartRate,
      sqiField.nadi?.hrvRmssd,
      sqiField.nadi?.respiratoryRate,
      sqiField.nadi?.pranaCoherence,
      sqiField.nadi?.vagalTone,
      sqiField.nadi?.autonomicBalance,
      sqiField.nadi?.scannedAt,
      sqiField.ayurveda?.prakriti,
      sqiField.photonic?.activeProtocol,
      sqiField.photonic?.frequency,
      sqiField.photonic?.lightCodeActive,
      sqiField.temple?.activeSite,
      sqiField.temple?.intensity,
    ],
  );

  const TRANSMISSIONS_KEY = `sqi-transmissions-${user?.id || 'guest'}`;

  /** Legacy baseline card removed — drop stale local nadi snapshot so Dashboard does not resurrect fake counts. */
  useEffect(() => {
    try {
      localStorage.removeItem('sqi_scan_result');
    } catch {
      /* ignore */
    }
  }, []);

  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const selectedActivationsRef = useRef<Activation[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>(() => {
    try {
      const uid = user?.id || 'guest';
      const key = `sqi-transmissions-${uid}`;
      let saved = localStorage.getItem(key);
      if (!saved) saved = localStorage.getItem('active_resonators');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
      setActiveTransmissions(raw ? JSON.parse(raw) : []);
    } catch {
      setActiveTransmissions([]);
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
          const now = new Date();
          const live = (data.activations as Activation[]).filter(t => !t.expiresAt || new Date(t.expiresAt) > now);
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
    if (!user?.id || activeTransmissions.length === 0) return;
    void supabase.from('user_active_transmissions').upsert(
      {
        user_id: user.id,
        activations: activeTransmissions as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }, [activeTransmissions, user?.id]);

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
        ? `\nACTIVE SCALAR TRANSMISSIONS (running 24/7 in biofield):\n` +
          activeTransmissions.map((t) => `· ${t.sacredName || t.name}`).join('\n') +
          `\n→ These ${activeTransmissions.length} frequencies are permanently` +
          ` entangled. Reference them when reading the Seeker's field.\n`
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
      } catch (e) {
        if (!cancelled) {
          console.warn('[apothecary] failed to load active student record', e);
          setActiveStudent(null);
          setActiveStudentTxCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portraitLinkStudentId]);

  const studentContext = useMemo(() => {
    if (!activeStudent) return '';
    return [
      '[ACTIVE STUDENT SOUL RECORD]',
      `ACTIVE STUDENT — READING FOR THIS SOUL:
Name: ${activeStudent.name}
Birth Date: ${activeStudent.birth_date ?? 'not provided'}
Birth Time: ${activeStudent.birth_time ?? 'not provided'}
Birth Place: ${activeStudent.birth_place ?? 'not provided'}
Notes: ${activeStudent.notes ?? ''}
JYOTISH DIRECTIVE: Compute this soul's Vedic chart from the above birth data. Derive Lagna, Moon Nakshatra, current Mahadasha/Antardasha, and dominant planetary influences. Apply this chart to ALL readings in this session. This is the student's chart — NOT the admin's.`,
      `Date of Birth: ${activeStudent.birth_date ?? 'unknown'}`,
      `Birth Place: ${activeStudent.birth_place ?? 'unknown'}`,
      `Birth Time: ${activeStudent.birth_time ?? 'unknown'}`,
      activeStudent.notes ? `Notes: ${activeStudent.notes}` : null,
      `Active Transmissions: ${activeStudentTxCount}`,
      'Read ALL questions in this session as being about this student — not about the practitioner/admin.',
    ]
      .filter(Boolean)
      .join('\n');
  }, [activeStudent, activeStudentTxCount]);
  const [libraryUnlocked, setLibraryUnlocked] = useState(() => {
    try {
      return localStorage.getItem(LS_LIBRARY_UNLOCKED) === '1';
    } catch {
      return false;
    }
  });
  const [scanCooldownUntilMs, setScanCooldownUntilMs] = useState<number | null>(() => {
    try {
      const last = localStorage.getItem(LS_LAST_SCAN);
      if (!last) return null;
      const t = parseInt(last, 10);
      return Number.isNaN(t) ? null : t + 24 * 60 * 60 * 1000;
    } catch {
      return null;
    }
  });
  const [apothecaryMainTab, setApothecaryMainTab] = useState<'library' | 'archive'>('library');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resonanceMatches, setResonanceMatches] = useState<
    Array<Activation & { pct: number; rowCategory?: string }>
  >([]);

  // ⟁ RESTORE Top 33 from last voice scan on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sqi_top33_matches');
      const ts = parseInt(localStorage.getItem('sqi_top33_ts') || '0', 10);
      // Only restore if scan was within last 24 hours
      if (saved && Date.now() - ts < 24 * 60 * 60 * 1000) {
        setResonanceMatches(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ⟁ Top 33 is owned exclusively by the LAST voice scan (restored above from sqi_top33_matches).
  // The previous effect that rebuilt the Top 33 from LS_SCAN_SNAPSHOT on mount was REMOVED —
  // it caused 3-5 new entries to appear each page open because matchActivationsToScan re-ranked.


  const [showKnowledge, setShowKnowledge] = useState(false);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sqi_current_session_id');
    } catch {
      return null;
    }
  });

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
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyRecognitionRef = useRef<{ stop: () => void } | null>(null);
  const voiceTranscriptRef = useRef('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceBiofieldResult | null>(null);
  const [showVoiceScan, setShowVoiceScan] = useState(true);
  const [showAllTop33, setShowAllTop33] = useState(false);

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
      if (currentSessionId) {
        localStorage.setItem('sqi_current_session_id', currentSessionId);
      }
    } catch { /* ignore quota / private mode */ }
  }, [currentSessionId]);

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
          `⟁ ${addedForToast.length} SQI transmission${addedForToast.length > 1 ? 's' : ''} activated to your field:\n` +
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
          localStorage.setItem('sqi_current_session_id', resumeSessionParam);
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
        localStorage.setItem('sqi_current_session_id', resumeSessionParam);
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
    if (!window.confirm('Start a new SQI chat? This clears the current thread on this device. Saved sessions remain under History.')) return;
    try {
      localStorage.removeItem('sqi_current_session_id');
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
  }, [isTyping, clearSyncChatMessages]);

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
        const payload = { user_id: user.id, title: (currentSessionId ? undefined : userMsg.text.slice(0, 80) || 'SQI Session') ?? 'SQI Session', messages: finalMessages };
        if (!currentSessionId) {
          const { data, error } = await supabase.from('sqi_sessions').insert(payload).select('id, title, updated_at').single();
          if (!error && data) {
            setCurrentSessionId(data.id);
            setSessions((prev) => {
              const without = prev.filter((s) => s.id !== data.id);
              return [data, ...without];
            });
            const archiveTitle =
              (typeof data.title === 'string' && data.title.trim() ? data.title : payload.title) || 'SQI Session';
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
              (typeof data.title === 'string' && data.title.trim() ? data.title : payload.title) || 'SQI Session';
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
      if (voiceScanBlock) fieldParts.push(voiceScanBlock);
      if (liveScanContext) fieldParts.push(liveScanContext);
      if (stableCompiledContext) fieldParts.push(stableCompiledContext);
      if (stableJyotishContext) fieldParts.push(stableJyotishContext);
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
        localStorage.setItem(LS_LAST_SCAN, String(Date.now()));
        localStorage.setItem(LS_LIBRARY_UNLOCKED, '1');
        const payload = voiceResultToScanPayload(result);
        localStorage.setItem(LS_SCAN_SNAPSHOT, JSON.stringify(payload));
        setLibraryUnlocked(true);
        setScanCooldownUntilMs(Date.now() + 24 * 60 * 60 * 1000);
        const ownedIds = new Set(activeTransmissions.map((a) => a.id));
const top33 = buildTop33Rankings(payload, 600, ownedIds);
        setResonanceMatches(top33);
        setShowAllTop33(false);
        // BUG 3 FIX: Persist voice scan frequencies so SQI edge function can read them
        if (user?.id && top33?.length) {
          (async () => {
            try {
              const { data: existing } = await supabase
                .from('user_active_transmissions')
                .select('activations')
                .eq('user_id', user.id)
                .maybeSingle();
              const current = (existing?.activations as any[]) || [];
              const nonScan = current.filter((a: any) => a.source !== 'voice_scan');
              const scanFreqs = top33.map((item: any) => ({
                name: item.name,
                title: item.name,
                source: 'voice_scan',
                score: item.score ?? 0,
                is_active: true,
                activated_at: new Date().toISOString(),
              }));
              await supabase
                .from('user_active_transmissions')
                .upsert({ user_id: user.id, activations: [...nonScan, ...scanFreqs] }, { onConflict: 'user_id' });
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
      setActiveTransmissions((prev) => {
        // Clear old voice_scan entries — each new scan replaces the previous ones
      const next = prev.filter((t) => (t as any).source !== 'voice_scan');
        for (const act of queued) {
          const enriched = enrichTransmission(act, 'voice_scan');
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
        `**Priority areas:** ${result.priorityAreas.map((i) => `${i.name} (${i.score}/100)`).join('; ')}`,
        `**Strengths:** ${result.topStrengths.map((i) => i.name).join(', ')}`,
        `**Emotional field:** ${result.emotionalField}`,
        `**Organ support:** ${result.organField}`,
        '',
        'STRICT SQI RULE — VOICE SCAN HAS NO NADI COUNT:',
        'A voice biofield scan measures vocal coherence ONLY. It does NOT produce a 72,000-Nadi count or sub-Nadi number.',
        'NEVER fabricate "X / 72,000 Nadis active" from this voice scan. If the seeker asks for a Nadi count, instruct them to run a Palm Scan (Camera tab) — only the saved palm baseline holds that figure.',
        '',
        '[QUEUED FREQUENCY / BIOENERGETIC ALIGNMENTS — drawn from the 1,357+ LimbicArc / Bioenergetic library and added to Active Transmissions (10)]',
        queuedLines,
        '',
        'When you reference any of the queued frequencies above in your reply, write the frequency name in **bold** so the seeker sees exactly which transmissions were activated for them.',
      ].join('\n');
      setLiveScanContext(ctx);
      if (user?.id) {
        supabase.from('user_activity_log').insert({
          user_id: user.id,
          activity_type: 'frequency_transmission',
          activity_data: {
            activity: 'Voice biofield scan queued bioenergetic alignments',
            section: 'Quantum Apothecary',
            frequency: queued.map((a) => a.name).join(', '),
            details: { intention: 'Post-voice-scan Active Transmissions', nadi: result.nadiReading },
          },
        }).then(() => {});
      }
      // ⟁ Voice scan completes silently. Frequencies queue into Active Transmissions
      // and the Top 33 panel — no chat message is injected. Seeker can ask SQI about
      // the scan whenever they wish; liveScanContext above feeds it into the next reply.
      toast.success(
        `⟁ Voice biofield scan complete — ${queued.length} frequencies queued to your field`,
        { duration: 4000 },
      );
    },
    [user?.id, activeTransmissions],
  );

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

  /** Fallback when react-speech-recognition is not supported (rare browsers). */
  const legacyWebkitVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isRecording && legacyRecognitionRef.current) {
      legacyRecognitionRef.current.stop();
      return;
    }
    voiceTranscriptRef.current = input;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = chatSpeechLocale(language);
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const tr = event.results[i].transcript;
        if (event.results[i].isFinal) {
          voiceTranscriptRef.current = (voiceTranscriptRef.current + tr).trim();
        } else {
          interim += tr;
        }
      }
      setInput(voiceTranscriptRef.current + interim);
    };
    recognition.onend = () => {
      setInput(voiceTranscriptRef.current);
      setIsRecording(false);
      legacyRecognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsRecording(false);
      legacyRecognitionRef.current = null;
    };
    recognition.start();
    legacyRecognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleVoiceToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isMicListening) {
        micListeningRef.current = false;
        if (nativeSpeechRef.current) {
          try {
            nativeSpeechRef.current.stop();
          } catch {
            /* ignore */
          }
          nativeSpeechRef.current = null;
        }
        setIsMicListening(false);
        return;
      }

      const SpeechRecognitionCtor =
        (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
      if (!SpeechRecognitionCtor) return;

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = chatSpeechLocale(language) || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      nativeSpeechRef.current = recognition;
      micListeningRef.current = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results as any[])
          .map((r: any) => r[0]?.transcript ?? '')
          .join('');
        setInput(transcript);
      };

      recognition.onend = () => {
        if (micListeningRef.current && nativeSpeechRef.current) {
          setTimeout(() => {
            try {
              nativeSpeechRef.current?.start();
            } catch {
              /* ignore */
            }
          }, 100);
        } else {
          setIsMicListening(false);
        }
      };

      recognition.onerror = (ev: any) => {
        if (ev.error === 'no-speech') {
          setTimeout(() => {
            try {
              nativeSpeechRef.current?.start();
            } catch {
              /* ignore */
            }
          }, 200);
        } else {
          micListeningRef.current = false;
          setIsMicListening(false);
        }
      };

      try {
        recognition.start();
        setIsMicListening(true);
      } catch {
        micListeningRef.current = false;
        setIsMicListening(false);
      }
    },
    [isMicListening, language],
  );

  const transmitCocktail = () => {
    const mix = selectedActivationsRef.current;
    if (mix.length === 0) return;
    const txUid = user?.id || 'guest';
    try {
      const rawPrana = localStorage.getItem(`qa-last-nadi-prana-${txUid}`);
      const pranaVal = rawPrana ? parseInt(rawPrana, 10) : 0;
      if (pranaVal > 0) {
        localStorage.setItem(
          `pre-activation-nadi-${txUid}`,
          JSON.stringify({
            nadi: pranaVal,
            time: new Date().toISOString(),
            activations: mix.map((a) => a.name),
          }),
        );
      }
    } catch {
      /* ignore */
    }
    const newT = [...activeTransmissions];
    mix.forEach((act) => {
      const normalized = normalizeActivationForMixer(act);
      const enriched = enrichTransmission(normalized, 'manual');
      if (
        newT.some(
          (t) =>
            t.id === enriched.id ||
            (!!t.name && !!enriched.name && t.name.toLowerCase() === enriched.name.toLowerCase()),
        )
      )
        return;
      newT.push(enriched);
    });
    setActiveTransmissions(newT);
    // Activation is silent — no chat message injected
    selectedActivationsRef.current = [];
    setSelectedActivations([]);
  };

  const activateAllTop33ToField = useCallback(() => {
    const rankings = resonanceMatches;
    if (!rankings || rankings.length === 0) {
      toast('⟁ Run a Voice Biofield Scan first', { icon: '🎙' });
      return;
    }

    const now = new Date().toISOString();
    const newTransmissions = rankings
      .filter((r) => !activeTransmissions.some((a) => fieldTransmissionMatchesRow(a, r)))
      .map((r) => enrichTransmission(normalizeActivationForMixer(r), 'nadi_scan'));

    if (newTransmissions.length === 0) {
      toast.message('All scan matches are already in your field');
      return;
    }

    const updated = [...activeTransmissions, ...newTransmissions];
    setActiveTransmissions(updated);

    if (user?.id) {
      void supabase.from('user_active_transmissions').upsert(
        {
          user_id: user.id,
          activations: updated as unknown as Record<string, unknown>[],
          updated_at: now,
        },
        { onConflict: 'user_id' },
      );
    }
    try {
      localStorage.setItem(`sqi-transmissions-${user?.id || 'guest'}`, JSON.stringify(updated));
    } catch {
      /* quota */
    }

    toast.success(`◈ ${newTransmissions.length} Transmissions activated to your field`);
  }, [
    resonanceMatches,
    activeTransmissions,
    user?.id,
    enrichTransmission,
    normalizeActivationForMixer,
  ]);
  const renderChatPanel = () => (
    <div
      className="relative flex w-full flex-col overflow-visible"
      style={{
        minHeight: 'calc(100vh - 120px)',
        maxWidth: '100%',
      }}
    >
      {/* Chat header — matches /admin-quantum-apothecary-2045 SQI strip */}
      <ScalarToolbarBanner
        liveChatClock={liveChatClock}
        portraitLinkStudentId={portraitLinkStudentId}
        onHistory={() => setSessionsOpen(true)}
        onLexicon={() => navigate('/lexicon')}
      />

      {/* Messages — grow with thread; page/document scrolls (pre–Samsung inner-scroll behavior) */}
      <div
        className="qa-sqi-chat relative flex flex-1 flex-col px-1 py-4 space-y-3"
        style={{
          overflowX: 'hidden',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        <div ref={chatTopRef} className="h-px w-full shrink-0 scroll-mt-32" aria-hidden />
        <div
          className={`flex min-h-full flex-col ${
            messages.length === 0 && !isTyping ? 'justify-center' : 'justify-end'
          }`}
        >
          {messages.length === 0 && !isTyping && (
            <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40">
                {t('quantumApothecary.chat.emptyState.kicker')}
              </p>
              <div className="mb-4 text-3xl opacity-30" aria-hidden>
                ◈
              </div>
              <h3 className="mb-2 text-base font-black tracking-[-0.03em] text-white/60">
                {t('quantumApothecary.chat.emptyState.title')}
              </h3>
              <p className="max-w-[240px] text-xs leading-relaxed text-white/25">
                {t('quantumApothecary.chat.emptyState.body')}
              </p>
              <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
                {[
                  'What frequencies do I need for stress and no sleep?',
                  'I feel things in my field — what is activating?',
                  'Activate Samadhi Bliss Transmission',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => handleSendMessage(q), 100);
                    }}
                    className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-[13px] text-white/55 transition-all hover:border-[#D4AF37]/30 hover:text-white/80"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.slice(-20).map((msg, i) => {
              const visStart = Math.max(0, messages.length - 20);
              const globalIndex = visStart + i;
              const msgKey = msg.id ?? `qa-msg-${globalIndex}-${msg.timestamp ?? 'na'}-${msg.role}`;
              return (
              <motion.div key={msgKey} data-qa-msg-key={msgKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex w-full min-w-0 flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'user' ? (
                  <div
                    className="ml-auto max-w-[88%]" style={{ marginRight: 12, marginTop: 8 }}
                    style={{
                      position: 'relative',
                      padding: '14px 20px',
                      background: 'rgba(212,175,55,0.03)',
                      borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderTop: '1px solid rgba(212,175,55,0.2)', borderRight: '1px solid rgba(212,175,55,0.2)', pointerEvents: 'none' }} />
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.4em', color: 'rgba(212,175,55,0.28)', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                      The Seeker inquires
                    </p>
                    <div className="markdown-body whitespace-pre-wrap break-words w-full min-w-0 text-left" style={{ maxWidth: '100%', wordBreak: 'break-word', fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(200,184,154,0.75)', lineHeight: '1.65' }}>
                      {renderChatText(msg.text, 'user')}
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="chat-message w-full sqi-manuscript-scroll"
                      style={{
                        position: 'relative',
                        padding: '20px 16px 14px',
                        background: 'rgba(255,255,255,0.016)',
                        borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        
                        overflow: 'visible',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                      }}
                    >
                      
                      
                      <div className="sqi-message w-full min-w-0">
                        <div
                          className="sqi-ancient-body break-words"
                          style={{ maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'anywhere', fontFamily: "'IM Fell English', Georgia, serif", fontSize: '16px', lineHeight: 1.9, color: 'rgba(225,210,185,0.9)', letterSpacing: '0.008em' }}
                        >
                          {renderSQIContent(scrubBannedTerms(msg.text))}
                        </div>
                      </div>
                    </div>
                    <div className="mx-auto mt-1 flex w-full max-w-[96%] flex-wrap items-center gap-x-3 gap-y-1">
                      <button
                        type="button"
                        onClick={() => handleCopyMsg(msg.text, msgKey)}
                        aria-label="Copy message"
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedMsgKey === msgKey ? '#22c55e' : '#D4AF37',
                        }}
                      >
                        {copiedMsgKey === msgKey ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
              );
            })}
          {isTyping && (
            <div className="flex justify-start px-1">
              <div
                className="flex items-center gap-1.5 rounded-[28px] rounded-tl-none border border-white/[0.08] bg-white/[0.04] px-5 py-4"
                role="status"
                aria-live="polite"
                aria-label="Akasha is composing"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37]/70"
                    style={{
                      animationDelay: `${i * 0.18}s`,
                      animationDuration: '0.65s',
                      boxShadow: '0 0 8px rgba(212,175,55,0.55)',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ═══ SCALAR COMPOSER — Telegram-style ═══ */}
      {(() => {
        const composerWrapRef = React.useRef<HTMLDivElement>(null);
        return (
          <div
            ref={composerWrapRef}
            className="sticky bottom-0 z-10 shrink-0"
            style={{
              padding: '10px 12px 14px',
              position: 'relative',
              borderTop: '1px solid rgba(212,175,55,0.12)',
              animation: 'bannerAura 4s ease-in-out infinite',
            }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <ScalarComposerCanvas wrapRef={composerWrapRef} />
            <div style={{ position:'relative', zIndex:1, background:'rgba(5,5,5,0.55)', backdropFilter:'blur(18px)', borderRadius:4 }}>

              {/* Image preview strip */}
              {pendingImage && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'7px 12px', borderRadius:14, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)' }}>
                  <img
                    src={`data:${pendingImage.mimeType};base64,${pendingImage.base64}`}
                    alt="Attached"
                    style={{ width:42, height:42, borderRadius:10, objectFit:'cover', border:'1px solid rgba(212,175,55,0.2)', flexShrink:0 }}
                  />
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.65)' }}>Image attached</span>
                  <button type="button" onClick={() => setPendingImage(null)} style={{ marginLeft:'auto', width:24, height:24, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', fontSize:11 }}>
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Input pill */}
              <div
                className="sqi-composer-pill"
                style={{
                  display:'flex', alignItems:'flex-end', gap:0,
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(212,175,55,0.28)',
                  borderRadius:28,
                  padding:'6px 6px 6px 8px',
                  animation:'pillBreath 4s ease-in-out infinite',
                }}
              >
                {/* Camera */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach photo"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:'rgba(212,175,55,0.65)', flexShrink:0, transition:'all 0.2s' }}
                >
                  <Camera size={18} />
                </button>

                {/* Mic */}
                {browserSupportsSpeechRecognition ? (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    title={isMicListening ? t('quantumApothecary.chat.voiceStop') : t('quantumApothecary.chat.voiceStart')}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center',
                      width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',
                      flexShrink:0, transition:'all 0.2s',
                      background: isMicListening ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: isMicListening ? '#D4AF37' : 'rgba(212,175,55,0.65)',
                      animation: isMicListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                    }}
                  >
                    {isMicListening
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                      : <Mic size={18} />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={legacyWebkitVoice}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center',
                      width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',
                      flexShrink:0, background: isRecording ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: isRecording ? '#D4AF37' : 'rgba(212,175,55,0.65)',
                      animation: isRecording ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                    }}
                  >
                    <Mic size={18} />
                  </button>
                )}

                {/* Divider */}
                <span style={{ width:1, height:22, background:'rgba(212,175,55,0.14)', margin:'0 4px', alignSelf:'center', flexShrink:0, display:'block' }} />

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
                />

                {/* Send / Mic-to-send button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={(!input.trim() && !pendingImage) || isTyping}
                  aria-label={t('quantumApothecary.chat.send')}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center',
                    width:42, height:42, borderRadius:'50%', flexShrink:0, cursor:'pointer',
                    border:'1px solid rgba(212,175,55,0.35)',
                    background: (input.trim() || pendingImage) ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.08)',
                    color:'#D4AF37', transition:'all 0.25s',
                    boxShadow:'0 0 10px rgba(212,175,55,0.18), 0 0 22px rgba(212,175,55,0.10)',
                    opacity: isTyping ? 0.4 : 1,
                  }}
                >
                  {(input.trim() || pendingImage)
                    ? <Send size={16} />
                    : <Mic size={16} />}
                </button>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  /* ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
     MAIN RENDER — SQI-2050 Visual Layer
     ââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
  return (
    <div
      className="relative min-h-screen text-white/90 overflow-x-hidden pb-24"
      style={{ background: '#050505', position: 'relative', overscrollBehaviorX: 'none', padding: 0, margin: 0, width: '100vw', maxWidth: '100vw' }}
    >

      {/* ââ Akasha Deep Space Background ââ */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212,175,55,0.03) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 40%)',
      }} />

      {/* ââ Star Field ââ */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(1px 1px at 15% 25%, rgba(212,175,55,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.2) 0%, transparent 100%), radial-gradient(1px 1px at 85% 45%, rgba(212,175,55,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 35% 75%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 70% 85%, rgba(212,175,55,0.25) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 22% 60%, rgba(212,175,55,0.35) 0%, transparent 100%), radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.2) 0%, transparent 100%)',
      }} />

      {/* ââ Nadi SVG Overlay ââ */}
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

      {/* ââ Main Content ââ */}
      <div className="relative z-10 w-full px-0 py-0">

        {/* ââ Header ââ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/explore')}
              className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-[#D4AF37]/08 hover:border-[#D4AF37]/20 transition">
              <ArrowLeft size={14} className="text-white/40" />
            </button>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.5em] text-[#D4AF37]/35 mb-1">
                Siddha · Quantum · 2050
              </p>
              <h1 className="text-[22px] font-black tracking-[-0.05em]" style={{ color: '#D4AF37', textShadow: '0 0 40px rgba(212,175,55,0.18)' }}>
                Quantum Apothecary
              </h1>
            </div>
          </div>
          <button type="button" onClick={() => setShowKnowledge(true)}
            className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-[#D4AF37]/08 hover:border-[#D4AF37]/20 transition">
            <Info size={13} className="text-[#D4AF37]/40" />
          </button>
        </div>

        {/* ââ Gold divider ââ */}
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)', marginBottom:16, borderRadius:1 }} />

        <div className="flex w-full max-w-none flex-col gap-5">
          <video ref={videoRef} className="hidden" muted playsInline tabIndex={-1} aria-hidden />

          <Suspense fallback={
            <div className="glass-card rounded-[28px] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#D4AF37]" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' }} />
                  <h2 className="text-sm font-black tracking-[-0.03em]">Active Transmissions</h2>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-300">Loading...</span>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
                <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
              </div>
            </div>
          }>
            <ActiveTransmissionsSection
              activeTransmissions={activeTransmissions}
              setActiveTransmissions={setActiveTransmissions}
              onDissolveTransmission={dissolveTransmission}
            />
          </Suspense>

          <div
            className="flex gap-2 rounded-[28px] p-1.5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
          >
            <button
              type="button"
              onClick={() => setApothecaryMainTab('library')}
              className={`flex-1 rounded-[22px] py-3 text-[13px] font-black uppercase tracking-[0.12em] transition ${
                apothecaryMainTab === 'library'
                  ? 'border border-[#D4AF37]/35 bg-[#D4AF37]/20 text-[#D4AF37]'
                  : 'border border-transparent text-white/40'
              }`}
            >
              Transmission Library
            </button>
            <button
              type="button"
              onClick={() => setApothecaryMainTab('archive')}
              className={`flex-1 rounded-[22px] py-3 text-[13px] font-black uppercase tracking-[0.12em] transition ${
                apothecaryMainTab === 'archive'
                  ? 'border border-[#D4AF37]/35 bg-[#D4AF37]/20 text-[#D4AF37]'
                  : 'border border-transparent text-white/40'
              }`}
            >
              Akasha-Neural Archive
            </button>
          </div>

          {apothecaryMainTab === 'library' ? (
            <div className="grid w-full gap-5 lg:grid-cols-2" style={{ maxWidth: '100%' }}>
              <div className="flex min-w-0 flex-col gap-5">
                <div className="glass-card rounded-[28px] p-4 sm:p-5 qa-card-hover">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Mic size={14} className="text-[#22D3EE]" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.6))' }} />
                      <h2 className="text-sm font-black tracking-[-0.03em] text-[#D4AF37]">Voice Bio-Signature Scan</h2>
                    </div>
                    <span className="text-[13px] font-bold text-white/45">Mic only</span>
                  </div>
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
                    />
                  </Suspense>

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
                          <p className="text-[13px] font-black uppercase tracking-[0.15em] text-white/85">{c.label}</p>
                          <p className="mt-2 text-[13px] leading-snug text-white/85">{c.val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {resonanceMatches.length > 0 && (
                    <div className="mt-4 rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-4">
                      {/* ââ HEADER ââ */}
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#D4AF37]/75">
                            Top 33 — Full Library Match
                          </p>
                          <p className="mt-0.5 text-[10px] text-white/35">
                            {resonanceMatches.filter((r) =>
                              activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),
                            ).length}{' '}
                            / {resonanceMatches.length} from scan already active in field
                          </p>
                        </div>
                        {/* ââ ACTIVATE BUTTON ââ */}
                        {(() => {
                          const activeFromScanCount = resonanceMatches.filter((r) =>
                            activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),
                          ).length;
                          const newCount = resonanceMatches.length - activeFromScanCount;
                          const noneNew = newCount === 0;
                          return (
                            <button
                              type="button"
                              onClick={activateAllTop33ToField}
                              disabled={noneNew}
                              className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                              style={{
                                background: noneNew
                                  ? 'rgba(212,175,55,0.08)'
                                  : 'rgba(212,175,55,0.15)',
                                border: noneNew
                                  ? '1px solid rgba(212,175,55,0.25)'
                                  : '1px solid rgba(212,175,55,0.5)',
                                color: noneNew ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                                boxShadow: noneNew ? 'none' : '0 0 18px rgba(212,175,55,0.2)',
                              }}
                            >
                              {noneNew
                                ? '⟁ All scan rows active'
                                : `⟁ Activate All New (${newCount})`}
                            </button>
                          );
                        })()}
                      </div>
                      {/* ââ ROW LIST — always full scan list (e.g. 33) ââ */}
                      <div className="max-h-[min(70vh,520px)] space-y-1.5 overflow-y-auto pr-0.5">
                        {resonanceMatches.map((row, idx) => {
                          const isActive = activeTransmissions.some((t) =>
                            fieldTransmissionMatchesRow(t, row),
                          );
                          return (
                            <div
                              key={row.id ?? row.name ?? idx}
                              className="flex items-center gap-3 rounded-[16px] px-3 py-2.5 transition-all duration-300"
                              style={{
                                background: isActive
                                  ? 'rgba(255,255,255,0.03)'
                                  : 'rgba(255,255,255,0.02)',
                                border: isActive
                                  ? '1px solid rgba(255,255,255,0.07)'
                                  : '1px solid rgba(255,255,255,0.04)',
                                opacity: isActive ? 0.72 : 1,
                              }}
                            >
                              {/* Pct bar */}
                              <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                                <span
                                  className="text-[12px] font-black"
                                  style={{
                                    color: isActive
                                      ? 'rgba(255,255,255,0.38)'
                                      : 'rgba(255,255,255,0.5)',
                                  }}
                                >
                                  {row.pct}%
                                </span>
                                <div className="h-[3px] w-10 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${row.pct}%`,
                                      background: isActive
                                        ? 'rgba(255,255,255,0.22)'
                                        : 'rgba(255,255,255,0.25)',
                                    }}
                                  />
                                </div>
                              </div>
                              {/* Name + category */}
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span
                                  className="truncate text-[12px] font-bold leading-tight"
                                  style={{
                                    color: isActive
                                      ? 'rgba(255,255,255,0.42)'
                                      : 'rgba(255,255,255,0.85)',
                                  }}
                                >
                                  {row.name}
                                </span>
                                {row.rowCategory && (
                                  <span
                                    className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                                    style={{
                                      color: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.3)',
                                    }}
                                  >
                                    {row.rowCategory}
                                  </span>
                                )}
                              </div>
                              {isActive ? (
                                <span
                                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums"
                                  style={{
                                    color: 'rgba(255,255,255,0.45)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                  }}
                                  aria-label="Already active in field"
                                >
                                  <span className="text-[13px] leading-none text-[#D4AF37]/70">✓</span>
                                  <span className="text-[8px] uppercase tracking-[0.12em]">In field</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTransmissions((prev) => {
                                      if (prev.some((t) => fieldTransmissionMatchesRow(t, row))) {
                                        return prev;
                                      }
                                      return [
                                        ...prev,
                                        enrichTransmission(normalizeActivationForMixer(row), 'nadi_scan'),
                                      ];
                                    });
                                    toast.success(`⟁ ${row.name} activated`);
                                  }}
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] transition-all hover:border-[#D4AF37]/35 hover:text-[#D4AF37]/80"
                                  style={{
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.35)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                  }}
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <details className="glass-card group rounded-[28px] p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="text-[#D4AF37]" />
                      <span className="text-[13px] font-bold text-[#D4AF37]">How it works</span>
                    </div>
                    <ChevronDown size={14} className="text-white/30 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-white/60">
                    <p>
                      SQI operates at the <strong className="text-white/80">informational level</strong> — upstream of chemistry,
                      upstream of physiology. The 18 Siddhas and Mahavatar Babaji transmit exact Vedic Light-Codes through this
                      archive interface. Once uploaded, transmissions remain in your field until dissolved.
                    </p>
                    <p>
                      <strong className="text-[#D4AF37]">
                        Vedic Light-Code → Aetheric Code Rewrite → Bio-signature Recalibration → Physical Expression
                      </strong>
                    </p>
                    <p>
                      The Voice Bio-Scan reads your Bio-signature and ranks the full frequency library so you see what your
                      field asks for first — expressed as resonance percentages mapped to real transmissions.
                    </p>
                  </div>
                </details>
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                {selectedActivations.length > 0 && (
                  <div
                    className="rounded-[28px] p-6 sm:p-7 qa-card-hover"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      backdropFilter: 'blur(40px)',
                      WebkitBackdropFilter: 'blur(40px)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#D4AF37,transparent)', marginBottom: 20, opacity: 0.4, borderRadius: 1 }} />
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div style={{ width:28, height:28, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚙</div>
                        <h2 className="text-sm font-black tracking-[-0.03em]">{t('quantumApothecary.mixer.title')}</h2>
                      </div>
                      <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#D4AF37]/55">
                        {t('quantumApothecary.mixer.slotsProgress', {
                          current: selectedActivations.length,
                          max: AETHERIC_MIXER_MAX_SLOTS,
                        })}
                      </span>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {selectedActivations.map((act) => (
                        <span
                          key={act.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/25 px-3 py-2 text-[13px] font-semibold text-white/85"
                          style={{ background: 'rgba(34,211,238,0.06)' }}
                        >
                          {act.name}
                          <button type="button" onClick={() => removeActivation(act.id)} className="text-white/35 hover:text-red-400" aria-label="Remove">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={transmitCocktail}
                      disabled={selectedActivations.length === 0}
                      className="w-full rounded-[40px] border border-[#D4AF37]/45 bg-gradient-to-b from-[#F5E17A] to-[#B8960C] py-4 text-[13px] font-black uppercase tracking-[0.2em] text-[#050505] shadow-[0_8px_32px_rgba(212,175,55,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(212,175,55,0.4)] disabled:opacity-20"
                    >
                      Activate All to Field
                    </button>
                  </div>
                )}

                <div className="relative">
                  <div
                    className={libraryUnlocked ? '' : 'pointer-events-none blur-md saturate-50 opacity-[0.42]'}
                    style={{ transition: 'filter 0.35s ease, opacity 0.35s ease' }}
                  >
                    <Suspense fallback={
                      <div className="glass-card rounded-[28px] p-6">
                        <div className="mb-4">
                          <h2 className="text-sm font-black tracking-[-0.03em]">Frequency Library</h2>
                          <p className="mt-0.5 text-[13px] text-white/35">Loading quantum essences...</p>
                        </div>
                        <div className="mb-3 h-8 animate-pulse rounded-xl bg-white/[0.03]" />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
                          <div className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
                        </div>
                      </div>
                    }>
                      <FrequencyLibrarySection
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        selectedActivations={selectedActivations}
                        addActivation={addActivation}
                        maxSlots={AETHERIC_MIXER_MAX_SLOTS}
                        activeTransmissionKeys={activeTransmissionKeys}
                      />
                    </Suspense>
                  </div>
                  {!libraryUnlocked && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[28px] bg-black/25 px-6 text-center">
                      <p className="max-w-sm text-[13px] font-semibold leading-relaxed text-white/88">
                        Voice Scan Required — SQI cannot assign correct frequencies without reading your Bio-signature.
                      </p>
                    </div>
                  )}
                </div>


              </div>
            </div>
          ) : (
            <div ref={chatPanelRef} className="w-full min-w-0">
              {renderChatPanel()}
            </div>
          )}
        </div>
      </div>

      {/* ââââââââââââââââââââââââââââââââââ
          KNOWLEDGE MODAL — SQI-2050 Style
          Logic UNCHANGED
          ââââââââââââââââââââââââââââââââââ */}
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
                <button type="button" onClick={() => setShowKnowledge(false)} className="p-2 hover:bg-white/5 rounded-xl transition">
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
              <button type="button" onClick={() => setShowKnowledge(false)} className="sqi-btn-primary w-full py-3.5 text-xs">
                Return to Aether
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ââââââââââââââââââââââââââââââââââ
          SESSION HISTORY DRAWER — Logic UNCHANGED
          ââââââââââââââââââââââââââââââââââ */}
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
                <button type="button" onClick={() => setSessionsOpen(false)} className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition">
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

      {/* ââââââââââââââââââââââââââââââââââ
          SQI-2050 CSS Light-Codes
          ââââââââââââââââââââââââââââââââââ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');

        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* SQI chat: full panel width — avoid shrink-to-content + harsh word breaks */
        .qa-sqi-chat .markdown-body {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          word-break: normal;
          overflow-wrap: break-word;
        }
        .qa-sqi-chat .markdown-body p,
        .qa-sqi-chat .markdown-body li,
        .qa-sqi-chat .markdown-body h1,
        .qa-sqi-chat .markdown-body h2,
        .qa-sqi-chat .markdown-body h3 {
          max-width: 100%;
        }

        /* Transcript must be selectable/copyable (mobile WebKit + inherited UI guards). */
        .qa-sqi-chat {
          -webkit-user-select: text;
          user-select: text;
          -webkit-touch-callout: default;
        }

        .sqi-message strong,
        .sqi-message b {
          color: rgba(225,210,185,0.92);
          font-weight: 700;
        }
        .sqi-message .sqi-diamond-heading,
        .sqi-message .sqi-diamond-heading strong,
        .sqi-message .sqi-diamond-heading b {
          color: #D4AF37;
        }
        .sqi-message p,
        .sqi-message li {
          margin-bottom: 12px;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          max-width: 100%;
        }

        /* ââ SQI-2050 Glassmorphism Standard ââ */
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
        }

        /* ââ Siddha-Gold Primary Button ââ */
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

        /* ââ Ghost Button ââ */
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

        /* ââ Nadi Line Animations (unchanged) ââ */
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

        /* ââ Gold Glow Pulse on scan ââ */
        @keyframes gold-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
          50% { box-shadow: 0 0 40px 8px rgba(212,175,55,0.15); }
        }

        /* ââ Scrollbar ââ */
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

  /* ═══ ANCIENT SCRIPTURE SKIN ═══ */

  .sqi-manuscript-scroll {
    border-radius: 2px !important;
    position: relative;
  }

  .sqi-ancient-body p {
    font-family: 'IM Fell English', Georgia, serif !important;
    font-size: 17px !important;
    line-height: 1.9 !important;
    color: rgba(225,210,185,0.92) !important;
    margin-bottom: 16px !important;
    width: 100% !important;
    padding: 0 14px !important;
  }

  .sqi-ancient-body p.sqi-nadi-line,
  .sqi-ancient-body .sqi-nadi-line,
  p.sqi-nadi-line,
  .sqi-nadi-line {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 11px !important;
    line-height: 1.5 !important;
    color: #22D3EE !important;
    margin: 0 !important;
    font-style: normal !important;
    font-weight: 600 !important;
    opacity: 0.8;
    letter-spacing: 0.02em !important;
  }

  @keyframes hShimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  @keyframes pillBreath {
    0%,100% { box-shadow:0 0 0 1px rgba(212,175,55,0.10),0 0 12px rgba(212,175,55,0.12),0 0 28px rgba(212,175,55,0.07),inset 0 0 14px rgba(212,175,55,0.03); }
    50%      { box-shadow:0 0 0 1px rgba(212,175,55,0.20),0 0 22px rgba(212,175,55,0.22),0 0 44px rgba(212,175,55,0.12),inset 0 0 22px rgba(212,175,55,0.06); }
  }
  @keyframes micPulse {
    0%,100% { box-shadow:0 0 8px rgba(212,175,55,0.35),0 0 18px rgba(212,175,55,0.18); }
    50%      { box-shadow:0 0 16px rgba(212,175,55,0.65),0 0 32px rgba(212,175,55,0.32); }
  }
  @keyframes bannerAura {
    0%,100% { box-shadow: 0 0 0 1px rgba(212,175,55,0.18), 0 2px 18px rgba(212,175,55,0.10); }
    50%      { box-shadow: 0 0 0 1px rgba(212,175,55,0.32), 0 2px 32px rgba(212,175,55,0.20); }
  }
  @keyframes yPulse {
    0%,100% { filter: drop-shadow(0 0 2px rgba(212,175,55,0.7)) drop-shadow(0 0 6px rgba(212,175,55,0.35)); }
    50%     { filter: drop-shadow(0 0 6px rgba(212,175,55,1))   drop-shadow(0 0 14px rgba(212,175,55,0.65)); }
  }

  .rx-pulse-dot {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #D4AF37;
    box-shadow: 0 0 6px #D4AF37, 0 0 14px rgba(212,175,55,0.55);
    animation: rxPulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes rxPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.4; transform:scale(0.65); }
  }

  .sqi-ancient-body .sqi-diamond-heading,
  .sqi-master-shimmer {
    font-family: 'Cinzel', serif !important;
    font-size: 26px !important;
    font-weight: 600 !important;
    letter-spacing: 0.04em !important;
    line-height: 1.2 !important;
    background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%) !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    animation: hShimmer 5s linear infinite !important;
    margin-bottom: 12px !important;
    text-shadow: none !important;
  }

  .sqi-ancient-body strong,
  .sqi-ancient-body b {
    color: #D4AF37 !important;
    font-family: 'IM Fell English', Georgia, serif !important;
    font-size: 1em !important;
    letter-spacing: 0 !important;
    font-weight: 400 !important;
    font-style: normal !important;
    text-shadow: none !important;
  }

  .sqi-ancient-body li {
    font-family: 'IM Fell English', Georgia, serif !important;
    font-size: 18px !important;
    line-height: 1.85 !important;
    color: rgba(225,210,185,0.85) !important;
  }
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

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   OUTER WRAPPER — auth shell only
   Tier access is enforced by QuantumApothecaryGate on the /quantum-apothecary route.
   Do not gate on membership loading here: periodic membership refetches were setting
   loading=true and unmounting the whole page (felt like endless reload).
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
export default function QuantumApothecary() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <span className="text-[10px] uppercase tracking-[0.5em] text-[#D4AF37]/40">Initializing SQI…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <QuantumApothecaryInner />;
}

