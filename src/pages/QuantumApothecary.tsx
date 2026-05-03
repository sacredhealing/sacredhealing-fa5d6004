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
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  Plus, Trash2, Send, Cpu, Globe,
  Info, X, ArrowLeft, Camera, Mic, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Activation, Message } from '@/features/quantum-apothecary/types';
import {
  ALL_ACTIVATIONS,
  matchScanToActivations,
  matchActivationsToScan,
  mapBioLibraryToActivation,
} from '@/features/quantum-apothecary/constants';
import { streamChatWithSQI } from '@/features/quantum-apothecary/chatService';
import { chatSpeechLocale } from '@/lib/chatSpeechLocale';
import { useSpeechRecognition } from 'react-speech-recognition';
import { useTranslation } from '@/hooks/useTranslation';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { NadiReading } from '@/components/NadiScanner';
import type { VoiceBiofieldResult } from '@/components/VoiceBiofieldScanner';
import { useSQIFieldContext } from '@/hooks/useSQIFieldContext';
import { StudentSelector } from '@/components/codex/StudentSelector';
import { getActiveStudentId } from '@/lib/codex/students';
import { curateTransmission } from '@/lib/codex/curatorClient';
import { syncPendingTransmissionsOnce } from '@/lib/codex/codexSync';

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
  return [
    'VOICE BIOFIELD SCAN (latest):',
    `- Overall Coherence: ${v.overallCoherence}/100`,
    `- Nadi: ${v.nadiReading}`,
    `- Dosha from voice: ${v.dominantDosha}`,
    `- Priority areas: ${v.priorityAreas.map((i) => i.name).join(', ')}`,
    `- Strengths: ${v.topStrengths.map((i) => i.name).join(', ')}`,
    `- Emotional field: ${v.emotionalField}`,
    `- Organ support: ${v.organField}`,
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

function pickTenActivationsForVoiceResult(result: VoiceBiofieldResult): Activation[] {
  // Use the FULL bioenergetic library (1,357+ frequencies) — voice-driven scoring
  // across dosha, nadi, chakra, emotional & organ fields. Same engine as LimbicArc.
  const doshaKey = String(result.dominantDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';
  const nadiKey: 'Ida' | 'Pingala' | 'Sushumna' | 'Blocked' = coerceVoiceNadiToEnum(result.nadiReading);
  const chakraKey = result.priorityAreas[0]?.name || 'Anahata';

  const matched = matchActivationsToScan(
    {
      dominantDosha: doshaKey,
      activatedNadi: nadiKey,
      priorityChakra: chakraKey,
      emotionalField: result.emotionalField,
      organField: result.organField,
    },
    10,
  ).map(mapBioLibraryToActivation);

  // Dedup by id and cap at 10
  const seen = new Set<string>();
  const out: Activation[] = [];
  for (const a of matched) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
    if (out.length >= 10) break;
  }
  return out;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showKnowledge, setShowKnowledge] = useState(false);
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
  const streamAccumRef = useRef('');
  const streamingMsgIdRef = useRef('');
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyRecognitionRef = useRef<{ stop: () => void } | null>(null);
  const voiceTranscriptRef = useRef('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceBiofieldResult | null>(null);
  const [scanRecommendedActivations, setScanRecommendedActivations] = useState<Activation[]>([]);
  const [showActivationSuggestions, setShowActivationSuggestions] = useState(false);
  const [showVoiceScan, setShowVoiceScan] = useState(() => {
    try {
      return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(QA_VOICE_TAB_KEY) === '1';
    } catch {
      return false;
    }
  });

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

  /** Hydrate chat from localStorage once; drop legacy model welcome with embedded calendar date. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sqi_chat_messages');
      if (!saved) return;
      const parsed = JSON.parse(saved) as Message[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const isStaleDatedWelcome = (text: string) => {
        const s = text.toLowerCase();
        return (
          (s.includes('accessing akasha-neural archive') || s.includes('accessing akasha')) &&
          (s.includes('syncing with the') || s.includes('syncing with')) &&
          /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(s)
        );
      };
      const filtered = parsed.filter((m) => {
        if (m.role !== 'model') return true;
        return !isStaleDatedWelcome(m.text || '');
      });
      if (filtered.length !== parsed.length) {
        try {
          if (filtered.length > 0) {
            localStorage.setItem('sqi_chat_messages', JSON.stringify(filtered.slice(-SQI_PERSIST_MSG_CAP)));
          } else {
            localStorage.removeItem('sqi_chat_messages');
          }
        } catch {
          /* ignore */
        }
      }
      setMessages(filtered);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Scroll: single effect, only when a new message is appended ──
  const prevMsgCountRef = useRef(messages.length);

  const flushSqiLocalStorage = useCallback(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('sqi_chat_messages', JSON.stringify(messages.slice(-SQI_PERSIST_MSG_CAP)));
      }
      if (currentSessionId) {
        localStorage.setItem('sqi_current_session_id', currentSessionId);
      }
    } catch { /* ignore quota / private mode */ }
  }, [messages, currentSessionId]);

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
        return ['Deep Sleep Harmonic', 'Neural Calm Sync', 'Melatonin', 'Phosphatidylserine', 'Magnesium (Ionic)'];
      }
      if (/(energy|vitality|depleted)/i.test(text)) {
        return ['NMN + Resveratrol Cellular Battery', 'CoQ10', 'NAD+', 'Urolithin A', 'Primordial Earth Grounding'];
      }
      if (/(meditation|kriya|kundalini)/i.test(text)) {
        return ['Neural Fluidity Protocol', 'Cognitive Super-Structure', 'Brahmi Code', 'Single-Point Focus', 'Gotu Kola Synapse'];
      }
      if (/(heart|love|anahata|bhakti)/i.test(text)) {
        return ['Heart-Bloom Radiance', 'Original Source Nourishment', 'Ashwagandha Resonance', 'Shatavari Flow', 'Rose Heart Bloom'];
      }
      if (/(past life|past-life|karma|akasha)/i.test(text)) {
        return ['Ancestral Tether Dissolve', 'Neem Bitter Truth', 'Activated Charcoal', 'Triphala Integrity', 'The Amrit Nectar (Guduchi)'];
      }
      return ['Biofield Purification', 'Structural Light Integrity', 'Crystalline Thought Flow', 'Zinc', 'Microbiome Harmony'];
    };

    const names = pickNames();
    const toAdd = names
      .map((n) => ALL_ACTIVATIONS.find((a) => a.name === n))
      .filter(Boolean) as Activation[];

    const sacredMentioned = ALL_ACTIVATIONS.filter((a) => {
      const sn = (a.sacredName || '').toLowerCase();
      const first = sn.split(/\s+/)[0] || '';
      return (
        (a.name && text.includes(a.name.toLowerCase())) ||
        (first.length > 2 && text.includes(first))
      );
    }).slice(0, 8);
    if (sacredMentioned.length > 0) {
      setScanRecommendedActivations(sacredMentioned);
      setShowActivationSuggestions(true);
    }

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
    setCurrentSessionId(null);
    setInput('');
    setPendingImage(null);
    setIsTyping(false);
    setMessages([]);
    prevMsgCountRef.current = 0;
    setSessionsOpen(false);
  }, [isTyping]);

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
          if (!error && data) { setCurrentSessionId(data.id); setSessions(prev => { const without = prev.filter(s => s.id !== data.id); return [data, ...without]; }); }
        } else {
          const { data, error } = await supabase.from('sqi_sessions').update({ title: payload.title ?? undefined, messages: finalMessages, updated_at: new Date().toISOString() }).eq('id', currentSessionId).select('id, title, updated_at').single();
          if (!error && data) { setSessions(prev => { const without = prev.filter(s => s.id !== data.id); return [data, ...without]; }); }
        }
      } catch (err) { console.error('Failed to persist SQI session', err); }
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

      const voiceBlock =
        opts?.voiceSnapshot != null ? buildVoiceFieldContext(opts.voiceSnapshot) : voiceContextBlock;
      const fieldParts: string[] = [sqiSourceDirective, answerRulesDirective, liveContext];
      if (voiceBlock) fieldParts.push(voiceBlock);
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
        canonicalActivationNameLines,
        enrichedJyotishContext,
        appLocale,
      );
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: t('quantumApothecary.chat.transmissionError'), timestamp: Date.now() }]);
      setIsTyping(false);
    }
  };

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
      const doshaKey = String(result.dominantDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';
      const voiceMatched = matchScanToActivations(
        {
          dominantDosha: doshaKey,
          activatedNadi: result.nadiReading,
          priorityChakra: result.priorityAreas[0]?.name || 'Anahata',
          emotionalField: result.emotionalField,
          organField: result.organField,
        },
        10,
      );
      setScanRecommendedActivations((prev) => {
        const combined = [...prev, ...voiceMatched];
        const seen = new Set<string>();
        return combined
          .filter((a) => {
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
          })
          .slice(0, 10);
      });
      setShowActivationSuggestions(true);
      const mixerNadi = coerceVoiceNadiToEnum(result.nadiReading);
      const mixerDosha = String(result.dominantDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';
      matchActivationsToScan(
        {
          dominantDosha: mixerDosha,
          activatedNadi: mixerNadi,
          priorityChakra: result.priorityAreas[0]?.name || 'Anahata',
          emotionalField: result.emotionalField,
          organField: result.organField,
        },
        5,
      )
        .map(mapBioLibraryToActivation)
        .forEach((a) => addActivation(a));
      const queued = pickTenActivationsForVoiceResult(result);
      setActiveTransmissions((prev) => {
        const next = [...prev];
        for (const act of queued) {
          if (!next.some((x) => x.id === act.id)) next.push(act);
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
    [user?.id, t, handleSendMessage, addActivation],
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
      if (!newT.find((t) => t.id === act.id)) newT.push(act);
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

  /* ══════════════════════════════════════════════════════
     CHAT PANEL — Logic 100% preserved, UI upgraded to SQI-2050
     ══════════════════════════════════════════════════════ */
  const renderChatPanel = () => (
    <div
      className="glass-card relative flex min-h-0 w-full flex-1 flex-col overflow-hidden"
      style={{ maxWidth: '100%' }}
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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

      {/* Messages */}
      <div
        className="qa-sqi-chat custom-scrollbar relative flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
        ref={scrollContainerCallbackRef}
      >
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
            </div>
          )}
          {messages.slice(-20).map((msg, i) => {
              const ts =
                typeof msg.timestamp === 'number'
                  ? new Date(msg.timestamp).toLocaleTimeString(appLocale, { hour: '2-digit', minute: '2-digit' })
                  : null;
              return (
              <motion.div key={msg.id ?? `qa-msg-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex w-full min-w-0 flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'user' ? (
                  <>
                    <div
                      className="ml-auto max-w-[85%] rounded-[20px] px-5 py-4"
                      style={{
                        background: 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.08))',
                        border: '1px solid rgba(212,175,55,0.25)',
                      }}
                    >
                      <div className="markdown-body text-[15px] leading-[1.75] text-white/95 whitespace-pre-wrap break-words w-full min-w-0 text-left" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                        {renderChatText(msg.text, 'user')}
                      </div>
                    </div>
                    {ts && (
                      <p className="text-[10px] text-white/25 mt-1 text-right max-w-[85%]">{ts}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      className="w-full max-w-[96%] mx-auto rounded-[20px] px-5 py-4"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'visible',
                      }}
                    >
                      <div className="sqi-message w-full min-w-0">
                        <div className="text-[15px] leading-[1.75] text-white/85 break-words [overflow-wrap:anywhere] w-full min-w-0" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                          {renderSQIContent(msg.text)}
                        </div>
                      </div>
                    </div>
                    {ts && (
                      <p className="text-[10px] text-white/25 mt-1 text-right w-full max-w-[96%] mx-auto">{ts}</p>
                    )}
                  </>
                )}
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
          type="button"
          onClick={scrollChatToBottom}
          className="absolute right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#0a0a0a]/90 text-[#D4AF37] shadow-[0_0_22px_rgba(212,175,55,0.22)] backdrop-blur-sm transition hover:bg-[#D4AF37]/15 hover:shadow-[0_0_28px_rgba(212,175,55,0.28)]"
          style={{ bottom: 90 }}
          aria-label={t('quantumApothecary.chat.scrollToBottom')}
          title={t('quantumApothecary.chat.scrollToBottom')}
        >
          <ChevronDown size={18} className="drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]" />
        </button>
      )}

      {/* Chat input — sticky bottom */}
      <div
        className="sticky bottom-0 border-t border-white/[0.06] bg-[#050505]/80 p-4 backdrop-blur-xl sm:p-6"
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
      className="flex h-[100dvh] w-full flex-col relative text-white/90 overflow-x-hidden pb-24"
      style={{ background: '#050505', position: 'relative' }}
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
      <div className="relative z-10 flex h-screen w-full max-w-[430px] flex-col mx-auto overflow-x-hidden px-2 sm:px-6 py-6">

        <div className="shrink-0">
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

        {/* ── Two-column grid ── */}
        {/* ── Gold divider ── */}
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)', marginBottom:16, borderRadius:1 }} />

        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto w-full max-w-none" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>

          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-5">

            {/* ── Biometric Nadi Scanner — rPPG real vitals · Voice biofield (mic only) ── */}
            <div className="glass-card p-4 sm:p-5 qa-card-hover">
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowVoiceScan(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 20,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: !showVoiceScan ? 'rgba(212,175,55,.15)' : 'rgba(255,255,255,.02)',
                    border: !showVoiceScan ? '1px solid rgba(212,175,55,.4)' : '1px solid rgba(255,255,255,.06)',
                    color: !showVoiceScan ? '#D4AF37' : 'rgba(255,255,255,.4)',
                  }}
                >
                  {t('quantumApothecary.scan.cameraMode')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVoiceScan(true)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 20,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: showVoiceScan ? 'rgba(34,211,238,.12)' : 'rgba(255,255,255,.02)',
                    border: showVoiceScan ? '1px solid rgba(34,211,238,.4)' : '1px solid rgba(255,255,255,.06)',
                    color: showVoiceScan ? '#22D3EE' : 'rgba(255,255,255,.4)',
                  }}
                >
                  {t('quantumApothecary.scan.voiceMode')}
                </button>
              </div>
              {!showVoiceScan && (
              <Suspense fallback={ScannerSuspenseFallback}>
              <NadiScanner
                userName={seekerName || 'Seeker'}
                jyotishContext={{
                  mahadasha: jyotish?.mahadasha,
                  nakshatra: jyotish?.nakshatra,
                  primaryDosha: jyotish?.primaryDosha,
                }}
                onScanComplete={(reading) => {
                  // Use the FULL bioenergetic library (1,357+ frequencies) — same engine as voice scan & LimbicArc
                  const doshaForQueue =
                    String(jyotish?.primaryDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';
                  const queued = matchActivationsToScan(
                    {
                      dominantDosha: doshaForQueue,
                      activatedNadi: reading.activatedNadi,
                      priorityChakra: reading.chakraState,
                      heartRate: reading.rawVitals.heart_rate,
                      hrv: reading.rawVitals.hrv_rmssd ?? undefined,
                    },
                    10,
                  ).map(mapBioLibraryToActivation);
                  setActiveTransmissions((prev) => {
                    const next = [...prev];
                    for (const act of queued) {
                      if (!next.some((x) => x.id === act.id)) next.push(act);
                    }
                    return next;
                  });
                  const queuedLines = queued.map((a) => `• ${a.name} (${a.type})`).join('\n');
                  const ctx = [
                    '[LIVE BIOMETRIC NADI SCAN — rPPG + Face Mesh + Voice + Motion]',
                    `Active Nadi: ${reading.activatedNadi}`,
                    `Prana coherence index: ${reading.activeNadis} (field metric; not a literal channel count)`,
                    `Heart rate: ${reading.rawVitals.heart_rate} BPM`,
                    `HRV RMSSD: ${reading.rawVitals.hrv_rmssd ?? 'not measured'} ms`,
                    `HRV LF/HF: ${reading.rawVitals.hrv_lfhf ?? 'not measured'}`,
                    `Respiratory rate: ${reading.rawVitals.respiratory_rate} RPM`,
                    `Vagal tone: ${reading.vagalTone}`,
                    `Autonomic state: ${reading.autonomicBalance}`,
                    `Chakra field: ${reading.chakraState}`,
                    `Blockage focus: ${reading.blockageLocation}`,
                    `Scan confidence: ${Math.round(reading.rawVitals.confidence * 100)}%`,
                    '',
                    '[BIOENERGETIC PRESCRIPTION — from scan engine]',
                    `Mantra: ${reading.prescription.mantra}`,
                    `Frequency: ${reading.prescription.frequency}`,
                    `Breathwork: ${reading.prescription.breathwork}`,
                    `Mudra: ${reading.prescription.mudra}`,
                    '',
                    '[QUEUED FREQUENCY / BIOENERGETIC ALIGNMENTS — added to Active Transmissions]',
                    queuedLines,
                  ].join('\n');
                  setLiveScanContext(ctx);
                  const doshaHint =
                    String(jyotish?.primaryDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';
                  const cameraMatched = matchScanToActivations(
                    {
                      dominantDosha: doshaHint,
                      activatedNadi: reading.activatedNadi,
                      priorityChakra: reading.chakraState,
                      heartRate: reading.rawVitals.heart_rate,
                      hrv: reading.rawVitals.hrv_rmssd ?? undefined,
                    },
                    10,
                  );
                  setScanRecommendedActivations(cameraMatched);
                  matchActivationsToScan(
                    {
                      dominantDosha: doshaHint,
                      activatedNadi: reading.activatedNadi,
                      priorityChakra: reading.chakraState,
                      heartRate: reading.rawVitals.heart_rate,
                      hrv: reading.rawVitals.hrv_rmssd ?? undefined,
                    },
                    5,
                  )
                    .map(mapBioLibraryToActivation)
                    .forEach((a) => addActivation(a));
                  setShowActivationSuggestions(true);
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
                  try {
                    (window as unknown as { __sqiLastScan?: Record<string, unknown> }).__sqiLastScan = {
                      activeNadis: reading.activeNadis,
                      activeSubNadis: 0,
                      blockagePercentage: reading.activatedNadi === 'Blocked' ? 40 : 15,
                    };
                  } catch {
                    /* ignore */
                  }
                  if (user?.id) {
                    supabase.from('user_activity_log').insert({
                      user_id: user.id,
                      activity_type: 'frequency_transmission',
                      activity_data: {
                        activity: 'Nadi scan queued bioenergetic alignments',
                        section: 'Quantum Apothecary',
                        frequency: queued.map((a) => a.name).join(', '),
                        details: { intention: 'Post-scan Active Transmissions', nadi: reading.activatedNadi },
                      },
                    }).then(() => {});
                  }
                  const scanMessage = `◈ NADI SCAN COMPLETE
Active Nadi: ${reading.activatedNadi} · Prana index: ${reading.activeNadis}
Vitals: HR ${reading.rawVitals.heart_rate} BPM · RR ${reading.rawVitals.respiratory_rate} · HRV ${reading.rawVitals.hrv_rmssd ?? '—'} ms
Prescription: ${reading.prescription.mantra} · ${reading.prescription.breathwork}
Queued transmissions: ${queued.map((a) => a.name).join(', ')}

SQI — integrate this scan with my natal chart; cite each chart fact once; use LIVE SYSTEM TIME only for “today”.`;
                  setInput(scanMessage);
                  setTimeout(() => {
                    handleSendMessage(scanMessage);
                    setInput('');
                    if (chatInputRef.current) chatInputRef.current.style.height = 'auto';
                  }, 300);
                }}
              />
              </Suspense>
              )}
              {showVoiceScan && (
                <Suspense fallback={ScannerSuspenseFallback}>
                <VoiceBiofieldScanner
                  userName={seekerName || 'Seeker'}
                  jyotishContext={{
                    mahadasha: jyotish?.mahadasha,
                    nakshatra: jyotish?.nakshatra,
                    primaryDosha: jyotish?.primaryDosha,
                  }}
                  onScanComplete={handleVoiceBiofieldComplete}
                />
                </Suspense>
              )}
            </div>

            {showActivationSuggestions && scanRecommendedActivations.length > 0 && (
              <div
                className="glass-card qa-card-hover"
                style={{
                  padding: 16,
                  borderRadius: 20,
                  marginTop: 0,
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.18)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '.3em',
                      textTransform: 'uppercase',
                      color: 'rgba(212,175,55,0.6)',
                      margin: 0,
                    }}
                  >
                    {t('quantumApothecary.scanMatched.title')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      scanRecommendedActivations.forEach((a) => addActivation(a));
                      setScanRecommendedActivations([]);
                      setShowActivationSuggestions(false);
                    }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '.15em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      background: 'rgba(212,175,55,0.12)',
                      border: '1px solid rgba(212,175,55,0.35)',
                      color: '#D4AF37',
                      fontFamily: 'inherit',
                    }}
                  >
                    {t('quantumApothecary.scanMatched.addAll')}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '.28em',
                    textTransform: 'uppercase',
                    color: 'rgba(212,175,55,0.55)',
                    margin: '0 0 10px',
                  }}
                >
                  {t('quantumApothecary.scanMatched.bioFieldTitle')}
                </p>
                {scanRecommendedActivations.slice(0, 3).map((act) => (
                  <div
                    key={`bio-pick-${act.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.8)',
                          margin: 0,
                        }}
                      >
                        {act.sacredName || act.name}
                      </p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
                        {act.benefit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addActivation(act)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '.15em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: '#D4AF37',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t('quantumApothecary.scanMatched.add')}
                    </button>
                  </div>
                ))}
                {scanRecommendedActivations.length > 3 && (
                  <p
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: '.25em',
                      textTransform: 'uppercase',
                      color: 'rgba(212,175,55,0.45)',
                      margin: '14px 0 8px',
                    }}
                  >
                    {t('quantumApothecary.scanMatched.fullListKicker')}
                  </p>
                )}
                {scanRecommendedActivations.slice(3).map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 0',
                      borderBottom: '1px solid rgba(255,255,255,.04)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.8)', margin: 0 }}>
                        {act.sacredName || act.name}
                      </p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', margin: '4px 0 0' }}>
                        {(act.category || act.type) + ' · ' + (act.vibrationalSignature || '')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addActivation(act)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: '.15em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: 'rgba(212,175,55,0.08)',
                        border: '1px solid rgba(212,175,55,0.25)',
                        color: '#D4AF37',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t('quantumApothecary.scanMatched.add')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Akasha Neural Archive banner removed — context is loaded automatically */}

            {/* ── Aetheric Mixer ── */}
            <div className="glass-card p-6 sm:p-7 qa-card-hover">
              <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#D4AF37,transparent)', marginBottom: 20, opacity: 0.4, borderRadius: 1 }} />
              <div className="flex justify-between items-center mb-4">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚗</div>
                  <h2 className="text-sm font-black tracking-[-0.03em]">{t('quantumApothecary.mixer.title')}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]/50">
                    {t('quantumApothecary.mixer.slotsProgress', {
                      current: selectedActivations.length,
                      max: AETHERIC_MIXER_MAX_SLOTS,
                    })}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 200 }}>
                    {Array.from({ length: AETHERIC_MIXER_MAX_SLOTS }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: i < selectedActivations.length ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                          boxShadow: i < selectedActivations.length ? '0 0 6px #D4AF37' : 'none',
                          transition: 'all 0.3s',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="min-h-[64px] rounded-2xl bg-white/[0.02] border border-dashed border-[#D4AF37]/15 p-3 mb-4">
                {selectedActivations.length === 0 ? (
                  <div className="flex items-center gap-2 justify-center text-white/20 py-2">
                    <Plus size={14} className="text-[#D4AF37]/30" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('quantumApothecary.mixer.selectFromLibrary')}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedActivations.map(act => (
                      <div key={act.id} className="flex items-center justify-between group px-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: act.color, boxShadow: `0 0 6px ${act.color}` }} />
                          <span className="text-xs font-bold text-white/80">{act.name}</span>
                        </div>
                        <button type="button" onClick={() => removeActivation(act.id)}
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
              <ActiveTransmissionsSection
                activeTransmissions={activeTransmissions}
                setActiveTransmissions={setActiveTransmissions}
                onDissolveTransmission={dissolveTransmission}
              />
            </Suspense>
          </div>

          {/* ════ RIGHT COLUMN — chat first on mobile for readable full-width thread ════ */}
          <div className="flex min-h-0 flex-1 flex-col gap-5">
            {/* ── Chat Panel (first on small screens) ── */}
            <div ref={chatPanelRef} className="order-1 flex min-h-0 flex-1 flex-col w-full min-w-0 lg:order-2">
              {renderChatPanel()}
            </div>

            <div className="order-2 w-full min-w-0 flex flex-col gap-5 lg:order-1">
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
              <FrequencyLibrarySection
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                selectedActivations={selectedActivations}
                addActivation={addActivation}
                maxSlots={AETHERIC_MIXER_MAX_SLOTS}
              />
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
      type="button"
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
