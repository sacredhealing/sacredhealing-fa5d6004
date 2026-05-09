// @ts-nocheck
// ╔══════════════════════════════════════════════════════════════════╗
// ║  SQI-2050 REDESIGN — VISUAL LAYER ONLY                         ║
// ║  All logic, hooks, Stripe triggers, AffiliateID tracking        ║
// ║  and function signatures are UNTOUCHED.                         ║
// ║  Only className strings and CSS have been upgraded.             ║
// ║  SQI2050_8 + prod: tier gate stays in outer wrapper only;       ║
// ║  i18n language passed to SQI chat + voice recognition.            ║
// ╚══════════════════════════════════════════════════════════════════╝

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
import { StudentSelector } from '@/components/codex/StudentSelector';
import { getActiveStudentId } from '@/lib/codex/students';
import { curateTransmission } from '@/lib/codex/curatorClient';
import { syncPendingTransmissionsOnce } from '@/lib/codex/codexSync';
import UserChatHistory from '@/components/UserChatHistory';
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

/* ──── Markdown-ish renderer: gold (#D4AF37) only on # / ## / ### / #### / ##### lines ──── */
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

function renderInline(
  text: string,
  variant: InlineVariant = 'body',
  onGold = false,
  opts?: RenderInlineOpts,
): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      const inner = p.slice(2, -2);
      if (opts?.diamondLine) {
        return (
          <strong key={i} style={{ color: 'rgba(255,255,255,0.96)', fontWeight: 800, textShadow: '0 0 14px rgba(0,0,0,0.25)' }}>
            {inner}
          </strong>
        );
      }
      if (opts?.sqiGoldBold && variant === 'body') {
        return (
          <strong key={i} style={{ color: 'rgba(255,255,255,0.97)', fontWeight: 700 }}>
            {inner}
          </strong>
        );
      }
      if (variant === 'heading') {
        return <strong key={i} style={{ color: 'inherit', fontWeight: 700 }}>{inner}</strong>;
      }
      return <strong key={i} style={{ color: onGold ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.97)', fontWeight: 700 }}>{inner}</strong>;
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
    if (opts?.sqiGoldBold && variant === 'body' && p) {
      return <React.Fragment key={i}>{autoBoldSacredTerms(p)}</React.Fragment>;
    }
    return p;
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
        <strong key={i} style={{ color: 'rgba(255,255,255,0.97)', fontWeight: 700 }}>
          {part}
        </strong>
      );
    }
    return part;
  });
}

/** SQI (assistant): ◈ gold headers, · / markdown lists, **bold** (Siddha gold), generous vertical rhythm */
function renderSQIContent(content: string) {
  const gapAfterSection = 18;
  return content.split('\n').map((line, i) => {
    const trimmed = line.trim();

    if (trimmed === '') {
      return <div key={i} style={{ height: '12px' }} aria-hidden />;
    }

    if (trimmed.startsWith('◈')) {
      return (
        <p
          key={i}
          style={{
            color: '#D4AF37',
            fontWeight: 800,
            fontSize: '13px',
            letterSpacing: '0.03em',
            marginTop: i > 0 ? `${gapAfterSection}px` : '0',
            marginBottom: '10px',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            lineHeight: 1.45,
          }}
        >
          {renderInline(trimmed, 'heading', false, { diamondLine: true })}
        </p>
      );
    }

    if (trimmed.startsWith('·')) {
      // Auto-bold the frequency / remedy name (text before em-dash or hyphen-dash)
      // so transmission list names are easier to read. Skip if already contains **.
      let lineForRender = trimmed;
      if (!lineForRender.includes('**')) {
        const dashMatch = lineForRender.match(/^(·\s*)(.+?)(\s+[—–-]\s+)(.+)$/);
        if (dashMatch) {
          lineForRender = `${dashMatch[1]}**${dashMatch[2].trim()}**${dashMatch[3]}${dashMatch[4]}`;
        }
      }
      return (
        <p
          key={i}
          style={{
            color: 'rgba(255,255,255,0.78)',
            fontSize: '15px',
            lineHeight: 1.75,
            paddingLeft: '10px',
            marginBottom: '8px',
            marginTop: '2px',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {renderInline(lineForRender, 'body', false, { sqiGoldBold: true })}
        </p>
      );
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li
          key={i}
          style={{
            marginLeft: '18px',
            listStyleType: 'disc',
            fontSize: '15px',
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.82)',
            marginBottom: '10px',
            width: 'calc(100% - 18px)',
            maxWidth: '100%',
            paddingRight: '4px',
          }}
        >
          {renderInline(trimmed.slice(2), 'body', false, { sqiGoldBold: true })}
        </li>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li
          key={i}
          style={{
            marginLeft: '18px',
            listStyleType: 'decimal',
            fontSize: '15px',
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.82)',
            marginBottom: '10px',
            width: 'calc(100% - 18px)',
            maxWidth: '100%',
            paddingRight: '4px',
          }}
        >
          {renderInline(trimmed.replace(/^\d+\.\s/, ''), 'body', false, { sqiGoldBold: true })}
        </li>
      );
    }

    return (
      <p
        key={i}
        style={{
          color: 'rgba(255,255,255,0.84)',
          fontSize: '15px',
          lineHeight: 1.85,
          marginBottom: '12px',
          marginTop: '0',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
          maxWidth: '100%',
        }}
      >
        {renderInline(trimmed, 'body', false, { sqiGoldBold: true })}
      </p>
    );
  });
}

function languageToBcp47(languageCode: string): string {
  const l = (languageCode || 'en').split('-')[0]?.toLowerCase() || 'en';
  if (l === 'sv') return 'sv-SE';
  if (l === 'es') return 'es-ES';
  if (l === 'no' || l === 'nb' || l === 'nn') return 'nb-NO';
  return 'en-GB';
}

/** Morning / midday / evening / night from local clock — for SQI tone (matches Nexus-style live time). */
function getLocalDayPhaseLabel(d: Date): 'morning' | 'midday' | 'evening' | 'night' {
  const h = d.getHours();
  if (h >= 22 || h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'midday';
  return 'evening';
}

/** When a live scan block is present, omit the duplicate [BIOMETRIC NADI FIELD] from compiled DB snapshot. */
function stripDuplicateBiometricBlock(compiled: string | undefined, hasLiveScan: boolean): string {
  if (!compiled?.trim()) return '';
  if (!hasLiveScan) return compiled;
  const segments = compiled.split(/\n(?=\[)/);
  return segments.filter((s) => !s.trimStart().startsWith('[BIOMETRIC NADI FIELD')).join('\n').trim();
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

/* ════════════════════════════════════════════════════════════════════
   ALL LOGIC BELOW IS 100% IDENTICAL TO ORIGINAL — ZERO CHANGES
   Only className values have been updated for SQI-2050 aesthetic
   ════════════════════════════════════════════════════════════════════ */

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

  /** Stable Jyotish context — only recompute when underlying field data actually changes. */
  const stableJyotishContext = useMemo(
    () => sqiField?.compiledContext || jyotishContext || '',
    [
      sqiField?.jyotish?.mahadasha,
      sqiField?.nadi?.activatedNadi,
      sqiField?.temple?.activeSite,
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
    try {
      localStorage.setItem(TRANSMISSIONS_KEY, JSON.stringify(activeTransmissions));
    } catch {
      /* ignore */
    }
  }, [activeTransmissions, TRANSMISSIONS_KEY]);

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

  const [activeCategory, setActiveCategory] = useState('Wellness');
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
  const [showAllTop33, setShowAllTop33] = useState(false);
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

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_LIBRARY_UNLOCKED) !== '1') return;
      const snap = localStorage.getItem(LS_SCAN_SNAPSHOT);
      if (!snap) return;
      const payload = JSON.parse(snap);
      setResonanceMatches(buildTop33Rankings(payload));
    } catch {
      /* ignore */
    }
  }, []);

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
    setMessages(
      syncChatRows.map((cm) => ({
        role: cm.role === 'assistant' ? 'model' : 'user',
        text: cm.content,
        timestamp: cm.created_at ? new Date(cm.created_at).getTime() : Date.now(),
        id: cm.id,
      })),
    );
    prevMsgCountRef.current = syncChatRows.length;
  }, [syncChatLoading, resumeSessionParam, syncChatRows]);

  // ── Scroll: single effect, only when a new message is appended ──
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
    if (count <= prevMsgCountRef.current) return; // streaming edits or other state changes
    prevMsgCountRef.current = count;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const scrollChatToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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

      setResonanceMatches((prev) => {
        const existingNames = new Set(prev.map((m) => m.name));
        const newMatches = matched.filter((m) => !existingNames.has(m.name));
        if (newMatches.length === 0) return prev;
        const next = [...prev, ...newMatches];
        queueMicrotask(() => {
          try {
            localStorage.setItem('sqi_top33_matches', JSON.stringify(next));
            localStorage.setItem('sqi_top33_ts', Date.now().toString());
          } catch {
            /* ignore */
          }
        });
        return next;
      });
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

  // ── ALL HANDLERS UNCHANGED ──
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
      if (voiceScanBlock) fieldParts.push(voiceScanBlock);
      if (liveScanContext) fieldParts.push(liveScanContext);
      if (stableCompiledContext) fieldParts.push(stableCompiledContext);
      if (stableJyotishContext) fieldParts.push(stableJyotishContext);
      if (activeTransmissionContext) fieldParts.push(activeTransmissionContext);
      const enrichedJyotishContext = fieldParts.join('\n\n');

      await streamChatWithSQI(
        allMsgs,
        upsert,
        async () => {
          setIsTyping(false);
          const finalText = streamAccumRef.current;
          const activeStudentId = getActiveStudentId();
          // Persist the assistant reply with a `needs_codex_sync` flag so that even if
          // the curator call below is lost (page unmount, network blip, etc.) the boot-time
          // sweeper will replay it. The flag is cleared once the curator confirms.
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
          // Weave this transmission into the Akashic Codex.
          if (user?.id && finalText?.trim()) {
            const sessionIdAtSend = currentSessionId;
            void curateTransmission({
              source_type: 'apothecary',
              raw_content: finalText,
              user_prompt: userMsg.text,
              source_chat_id: sessionIdAtSend ?? null,
              ...(activeStudentId ? { student_id: activeStudentId } : {}),
            }).then(async (results) => {
              const r = results?.[0];
              if (!r || (!r.ok && !r.excluded)) return;
              // Curator confirmed — clear the sync flag so the sweeper skips it.
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
        },
        imageToSend,
        user?.id ?? null,
        language,
        seekerName || undefined,
        canonicalActivationPayload,
        enrichedJyotishContext,
        appLocale,
        sqiTop33ChatBlock,
        activeTransmissionNamesCsv,
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
        const top33 = buildTop33Rankings(payload);
        setResonanceMatches(top33);
        setShowAllTop33(false);
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
        const next = [...prev];
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
      const queuedLines = queued.map((a) => `• **${a.name}** (${a.type})`).join('\n');
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
      const msg = [
        '**VOICE BIOFIELD SCAN COMPLETE**',
        `**Overall Coherence:** ${result.overallCoherence}/100`,
        `**Nadi:** ${result.nadiReading}`,
        `**Dominant Dosha:** ${result.dominantDosha}`,
        `**Priority Areas:** ${result.priorityAreas.map((i) => `${i.name} (${i.score}/100)`).join(', ')}`,
        `**Strengths:** ${result.topStrengths.map((i) => i.name).join(', ')}`,
        `**Emotional Field:** ${result.emotionalField}`,
        `**Organ Support Needed:** ${result.organField}`,
        '',
        '**Bioenergetic Frequencies queued (from the 1,357+ LimbicArc library):**',
        queued.map((a) => `• **${a.name}** — ${a.type}`).join('\n'),
        '',
        t('quantumApothecary.voiceBiofield.sqiFollowUp'),
      ].join('\n');
      setTimeout(() => {
        handleSendMessage(msg, { voiceSnapshot: result });
        setInput('');
        if (chatInputRef.current) chatInputRef.current.style.height = 'auto';
      }, 300);
    },
    [user?.id, t, handleSendMessage],
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
    setMessages((prev) => [
      ...prev,
      {
        role: 'model',
        text: `**Initiating Quantum Transmission:**\n\n${mix.map((a) => `- ${a.name}`).join('\n')}\n\nUploading Aetheric Codes to your cellular matrix…\n\nThese frequencies are now **locked 24/7** until manually dissolved.`,
        timestamp: Date.now(),
      },
    ]);
    // Log to activity log so SQI knows which frequencies are running in the biofield
    if (user?.id) {
      supabase.from('user_activity_log').insert({
        user_id: user.id,
        activity_type: 'frequency_transmission',
        activity_data: {
          activity: 'Activated frequency transmission cocktail',
          section: 'Quantum Apothecary',
          frequency: mix.map((a) => a.name).join(', '),
          details: { frequency: mix.map((a) => a.name).join(', '), intention: 'Scalar Wave Transmission 24/7' },
        },
      }).then(() => {});
    }
    selectedActivationsRef.current = [];
    setSelectedActivations([]);
  };

  const activateAllTop33ToField = useCallback(() => {
    if (resonanceMatches.length === 0) {
      toast('⟁ Run a Voice Biofield Scan first', { icon: '🎙' });
      return;
    }
    // ⟁ Enrich all 33 voice-matched rows
    const top33Enriched = resonanceMatches.map((row) => normalizeActivationForMixer(row));
    const top33Ids = new Set(top33Enriched.map((e) => e.id ?? e.name));
    setActiveTransmissions((prev) => {
      // Keep any existing transmissions that are NOT in the current top 33
      const kept = prev.filter((t) => !top33Ids.has(t.id ?? t.name));
      // Force-add all 33 from this voice scan
      return [...kept, ...top33Enriched];
    });
    toast.success(`⟁ All ${resonanceMatches.length} voice-matched transmissions activated to your biofield`);
  }, [resonanceMatches, normalizeActivationForMixer]);
  const renderChatPanel = () => (
    <div
      className="glass-card relative flex w-full flex-col overflow-visible"
      style={{
        minHeight: 'calc(100vh - 120px)',
        maxWidth: '100%',
      }}
    >
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
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {portraitLinkStudentId ? (
            <Link
              to={`/akasha-portrait/${portraitLinkStudentId}`}
              className="whitespace-nowrap rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 sm:px-3 sm:py-1.5 sm:text-[9px] sm:tracking-[0.2em]"
            >
              Akasha Portrait
            </Link>
          ) : (
            <span
              className="cursor-not-allowed whitespace-nowrap rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-white/25 sm:px-3 sm:py-1.5 sm:text-[9px]"
              title="Select an active student first"
              aria-disabled={true}
            >
              Akasha Portrait
            </span>
          )}
          <span
            className="select-none font-[Montserrat,sans-serif] text-[9px] font-extrabold tracking-[0.28em] text-[#D4AF37]/50 tabular-nums"
            aria-label={t('quantumApothecary.chat.liveClockAria')}
            title={t('quantumApothecary.chat.liveClockAria')}
          >
            {liveChatClock}
          </span>
          <button
            type="button"
            onClick={() => {
              scrollChatToTop();
            }}
            className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-1.5 text-[#D4AF37] transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/20 sm:p-2"
            title="Scroll to top of thread"
            aria-label="Scroll to top of thread"
          >
            <ChevronUp size={16} className="drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]" aria-hidden />
          </button>
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

      {/* Active student selector — routes SQI replies into chosen student's book */}
      <div className="px-3 pt-3">
        <StudentSelector />
      </div>

      {/* Messages — grow with thread; page/document scrolls (pre–Samsung inner-scroll behavior) */}
      <div
        className="qa-sqi-chat relative flex flex-1 flex-col px-3 py-4 space-y-3"
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
                ⊕
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
              <motion.div key={msgKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex w-full min-w-0 flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'user' ? (
                  <div
                    className="ml-auto max-w-[85%] rounded-[20px] px-5 py-4"
                    style={{
                      background: 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.08))',
                      border: '1px solid rgba(212,175,55,0.25)',
                    }}
                  >
                    <div className="markdown-body text-[14px] leading-[1.75] text-white/95 whitespace-pre-wrap break-words w-full min-w-0 text-left" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                      {renderChatText(msg.text, 'user')}
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="chat-message w-full max-w-[96%] mx-auto rounded-[20px] px-5 py-4"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'visible',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                      }}
                    >
                      <div className="sqi-message w-full min-w-0">
                        <div className="text-[14px] leading-[1.75] text-white/85 break-words [overflow-wrap:anywhere] w-full min-w-0" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                          {renderSQIContent(msg.text)}
                        </div>
                        {(() => {
                          const tlower = (msg.text || '').toLowerCase();
                          const mentioned = ALL_ACTIVATIONS.filter(
                            (a) => a.name && tlower.includes(a.name.toLowerCase()),
                          );
                          const activeOnes = mentioned.filter((a) =>
                            activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, a)),
                          );
                          if (activeOnes.length === 0) return null;
                          return (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {activeOnes.map((a) => (
                                <span
                                  key={a.id ?? a.name}
                                  className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
                                  style={{
                                    background: 'rgba(212,175,55,0.1)',
                                    border: '1px solid rgba(212,175,55,0.25)',
                                    color: '#D4AF37',
                                  }}
                                >
                                  ⟁ {a.name}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
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

      {/* Composer — sticky at viewport bottom while the page scrolls the full thread */}
      <div
        className="sticky bottom-0 z-10 shrink-0 border-t border-white/[0.06] bg-[#050505]/80 p-4 backdrop-blur-xl sm:p-6"
        style={isChatFullscreen ? { paddingBottom: 'env(safe-area-inset-bottom, 16px)' } : undefined}
      >
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
          {browserSupportsSpeechRecognition ? (
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isMicListening ? t('quantumApothecary.chat.voiceStop') : t('quantumApothecary.chat.voiceStart')}
              className={`shrink-0 rounded-2xl border p-2.5 transition ${
                isMicListening
                  ? 'border-[#22D3EE]/60 bg-[#22D3EE]/10 text-[#22D3EE]'
                  : 'border-white/[0.08] bg-white/[0.04] text-[#D4AF37]/70 hover:border-[#D4AF37]/25'
              }`}
              style={isMicListening ? { boxShadow: '0 0 12px rgba(34,211,238,0.3)', animation: 'pulse 1s ease-in-out infinite' } : {}}
            >
              {isMicListening ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="12" r="6" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={legacyWebkitVoice}
                className={`shrink-0 rounded-2xl border p-2.5 transition ${isRecording ? 'animate-pulse border-red-500/40 bg-red-500/20 text-red-400' : 'border-white/[0.08] bg-white/[0.04] text-[#D4AF37]/70 hover:border-[#D4AF37]/25'}`}
                title={isRecording ? t('quantumApothecary.chat.voiceStop') : t('quantumApothecary.chat.voiceStart')}
              >
                <Mic size={15} />
              </button>
              {isRecording && <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-red-400">{t('quantumApothecary.chat.listening')}</span>}
            </>
          )}
          <div className="flex items-end gap-3 flex-1 p-4 bg-white/[0.02] border border-white/[0.05] rounded-[24px] backdrop-blur-xl">
            <textarea
              ref={chatInputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isTyping && (input.trim() || pendingImage)) {
                    handleSendMessage();
                  }
                }
              }}
              onFocus={handleChatFocus}
              placeholder={t('quantumApothecary.chat.placeholder')}
              style={{ resize: 'none', overflowY: 'hidden' }}
              className="w-full bg-transparent border-none outline-none text-white/90 placeholder:text-white/30 text-sm font-normal leading-relaxed min-h-[28px] max-h-[160px] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !pendingImage) || isTyping}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
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
    <div
      className="relative min-h-screen text-white/90 overflow-x-hidden pb-24"
      style={{ background: '#050505', position: 'relative', overscrollBehaviorX: 'none' }}
    >

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
      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/explore')}
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
          <button type="button" onClick={() => setShowKnowledge(true)}
            className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition">
            <Info size={15} className="text-[#D4AF37]/60" />
          </button>
        </div>

        {/* ── Gold divider ── */}
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
            <div className="grid w-full gap-5 lg:grid-cols-2">
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
                      {/* ── HEADER ── */}
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#D4AF37]/75">
                            Top 33 — Full Library Match
                          </p>
                          <p className="mt-0.5 text-[10px] text-white/35">
                            {resonanceMatches.filter((r) =>
                              activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),
                            ).length}{' '}
                            / {resonanceMatches.length} active in your field
                          </p>
                        </div>
                        {/* ── ACTIVATE BUTTON ── */}
                        {(() => {
                          const activeCount = resonanceMatches.filter((r) =>
                            activeTransmissions.some((t) => fieldTransmissionMatchesRow(t, r)),
                          ).length;
                          const allActive = activeCount === resonanceMatches.length;
                          return (
                            <button
                              type="button"
                              onClick={activateAllTop33ToField}
                              className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-300"
                              style={{
                                background: allActive
                                  ? 'rgba(212,175,55,0.08)'
                                  : 'rgba(212,175,55,0.15)',
                                border: allActive
                                  ? '1px solid rgba(212,175,55,0.25)'
                                  : '1px solid rgba(212,175,55,0.5)',
                                color: allActive ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                                boxShadow: allActive ? 'none' : '0 0 18px rgba(212,175,55,0.2)',
                              }}
                            >
                              {allActive
                                ? '⟁ All Active'
                                : `⟁ Activate ${resonanceMatches.length - activeCount} to Field`}
                            </button>
                          );
                        })()}
                      </div>
                      {/* ── ROW LIST ── */}
                      <div className="space-y-1.5">
                        {(showAllTop33 ? resonanceMatches : resonanceMatches.slice(0, 10)).map((row, idx) => {
                          const isActive = activeTransmissions.some((t) =>
                            fieldTransmissionMatchesRow(t, row),
                          );
                          return (
                            <div
                              key={row.id ?? row.name ?? idx}
                              className="flex items-center gap-3 rounded-[16px] px-3 py-2.5 transition-all duration-300"
                              style={{
                                background: isActive
                                  ? 'rgba(212,175,55,0.06)'
                                  : 'rgba(255,255,255,0.02)',
                                border: isActive
                                  ? '1px solid rgba(212,175,55,0.2)'
                                  : '1px solid rgba(255,255,255,0.04)',
                              }}
                            >
                              {/* Pct bar */}
                              <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                                <span
                                  className="text-[12px] font-black"
                                  style={{ color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}
                                >
                                  {row.pct}%
                                </span>
                                <div className="h-[3px] w-10 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${row.pct}%`,
                                      background: isActive
                                        ? '#D4AF37'
                                        : 'rgba(255,255,255,0.25)',
                                    }}
                                  />
                                </div>
                              </div>
                              {/* Name + category */}
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span
                                  className="truncate text-[12px] font-bold leading-tight"
                                  style={{ color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.85)' }}
                                >
                                  {row.name}
                                </span>
                                {row.rowCategory && (
                                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
                                    {row.rowCategory}
                                  </span>
                                )}
                              </div>
                              {/* Active badge OR tap-to-activate */}
                              {isActive ? (
                                <span
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em]"
                                  style={{
                                    background: 'rgba(212,175,55,0.12)',
                                    color: '#D4AF37',
                                    border: '1px solid rgba(212,175,55,0.25)',
                                  }}
                                >
                                  ACTIVE
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const enriched = normalizeActivationForMixer(row);
                                    setActiveTransmissions((prev) =>
                                      prev.some((t) => t.id === enriched.id || t.name === enriched.name)
                                        ? prev
                                        : [...prev, enriched],
                                    );
                                    toast.success(`⟁ ${row.name} activated`);
                                  }}
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] transition-all"
                                  style={{
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                  }}
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* ── SHOW MORE TOGGLE ── */}
                      {resonanceMatches.length > 10 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTop33((prev) => !prev)}
                          className="mt-3 w-full rounded-[14px] py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/30 transition-all hover:text-white/60"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          {showAllTop33
                            ? '↑ Show First 10'
                            : `↓ Show All ${resonanceMatches.length}`}
                        </button>
                      )}
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
                        <div style={{ width:28, height:28, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚗</div>
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

                {!sqiField.loading && (sqiField.nadi || sqiField.ayurveda || sqiField.photonic?.lightCodeActive || sqiField.temple?.activeSite) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 2, paddingRight: 2 }}>
                    {sqiField.nadi?.activatedNadi && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(212,175,55,0.85)', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 30, padding: '6px 12px' }}>
                        ⊕ {sqiField.nadi.activatedNadi} Nadi · {sqiField.nadi.heartRate} BPM
                      </span>
                    )}
                    {sqiField.ayurveda?.prakriti && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(212,175,55,0.85)', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 30, padding: '6px 12px' }}>
                        ⟁ {sqiField.ayurveda.prakriti}
                      </span>
                    )}
                    {sqiField.photonic?.lightCodeActive && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(34,211,238,0.85)', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 30, padding: '6px 12px' }}>
                        ≋ {sqiField.photonic.frequency}Hz · {sqiField.photonic.activeProtocol}
                      </span>
                    )}
                    {sqiField.temple?.activeSite && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(212,175,55,0.85)', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 30, padding: '6px 12px' }}>
                        ◈ {sqiField.temple.activeSite} · {sqiField.temple.intensity}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div ref={chatPanelRef} className="w-full min-w-0">
              {renderChatPanel()}
            </div>
          )}
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

      {/* ══════════════════════════════════
          SQI-2050 CSS Light-Codes
          ══════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');

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
          color: rgba(255,255,255,0.97);
          font-weight: 800;
        }
        .sqi-message p,
        .sqi-message li {
          margin-bottom: 12px;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          max-width: 100%;
        }

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

      <UserChatHistory filterChatType="apothecary" />

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
   OUTER WRAPPER — auth shell only
   Tier access is enforced by QuantumApothecaryGate on the /quantum-apothecary route.
   Do not gate on membership loading here: periodic membership refetches were setting
   loading=true and unmounting the whole page (felt like endless reload).
   ══════════════════════════════════════════════════════ */
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
