// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft, Waves, Activity, Play, Pause, Download,
  Loader2, Layers, X, CheckCircle2, AlertCircle, Zap,
  Sparkles, MessageSquare, Cpu, Send, RefreshCw, Power,
} from 'lucide-react';
import { useSoulMeditateEngine } from '@/hooks/useSoulMeditateEngine';
import { useOfflineExport } from '@/hooks/useOfflineExport';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import SpectralVisualizer from '@/components/soulmeditate/SpectralVisualizer';
import NeuralSourceInput from '@/components/soulmeditate/NeuralSourceInput';
import DSPMasteringRack from '@/components/soulmeditate/DSPMasteringRack';
import SpectralInsights from '@/components/soulmeditate/SpectralInsights';
import { StyleGrid, MeditationStyle } from '@/components/soulmeditate/StyleGrid';
import HealingFrequencySelector from '@/components/soulmeditate/HealingFrequencySelector';
import BrainwaveSelector from '@/components/soulmeditate/BrainwaveSelector';
import { ScalarWavePanel as ConsciousnessScalarPanel, type ScalarWave } from '@/features/scalar/scalarWaves';

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Types Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
interface NadiScanResult {
  dominantDosha: 'Vata' | 'Pitta' | 'Kapha';
  blockages: string[];
  planetaryAlignment: string;
  timestamp: string;
  activeNadis: number;
  remedies: string[];
}
interface SQIMessage { role: 'user' | 'model'; text: string; }

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Scalar Resonators Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const SCALAR_ACTIVATIONS = [
  { id: 'anahata-528',    name: 'Anahata Gateway',    sig: 'Heart / 528 Hz',     color: '#4ade80', freq: 528,  benefit: 'Opens heart field, dissolves fear-loops in the listening field.' },
  { id: 'crown-963',      name: 'Sahasrara Crown',     sig: 'Crown / 963 Hz',     color: '#a78bfa', freq: 963,  benefit: 'Pineal activation, unity-consciousness transmission.' },
  { id: 'dna-repair',     name: 'DNA Restore Field',   sig: 'Solfeggio / 528 Hz', color: '#34d399', freq: 528,  benefit: 'DNA repair resonance woven into the audio quantum field.' },
  { id: 'schumann',       name: 'Schumann Resonance',  sig: 'Earth / 7.83 Hz',    color: '#D4AF37', freq: 7.83, benefit: 'Grounding to Earth\'s heartbeat, neural coherence.' },
  { id: 'theta-deep',     name: 'Theta Deep Dive',     sig: 'Theta / 6 Hz',       color: '#38bdf8', freq: 6,    benefit: 'Subconscious re-patterning, ancestral clearing.' },
  { id: 'liberation-396', name: 'Liberation Field',    sig: 'Solfeggio / 396 Hz', color: '#fb923c', freq: 396,  benefit: 'Liberating guilt and fear from cellular memory.' },
  { id: 'miracle-432',    name: 'Miracle Tone',        sig: 'Vedic / 432 Hz',     color: '#fbbf24', freq: 432,  benefit: 'Universal tuning Ã¢ÂÂ aligns with nature\'s harmonic field.' },
  { id: 'unity-639',      name: 'Unity Coherence',     sig: 'Solfeggio / 639 Hz', color: '#f472b6', freq: 639,  benefit: 'Heart coherence and inter-dimensional connection.' },
  { id: 'intuition-741',  name: 'Third Eye Activator', sig: 'Solfeggio / 741 Hz', color: '#818cf8', freq: 741,  benefit: 'Awakening intuition through the audio field.' },
  { id: 'pranic-108',     name: 'Prana Infusion',      sig: 'Pranic / 108 Hz',    color: '#22d3ee', freq: 108,  benefit: 'Infusing prana into every sound layer of the meditation.' },
  // ── Avataric Consciousness Blueprints ── no tone, pure scalar field
  { id: 'yukteswar',   name: 'Sri Yukteswar Giri',       sig: '✦ Gyana · Stellar Fire',     color: '#fde68a', freq: 963,   benefit: 'The Lion of God — activates cosmic order, jnana fire and stellar body alignment. Pure wisdom field.' },
  { id: 'vishwananda', name: 'Paramahamsa Vishwananda',  sig: '❤ Bhakti · Divine Love',     color: '#f9a8d4', freq: 528,   benefit: 'Living Bhakti master — pure heart transmission, Atma Kriya Yoga activation, unconditional love field.' },
  { id: 'lahiri',      name: 'Lahiri Mahasaya',          sig: 'ॐ Kriya · Babaji Grace',     color: '#86efac', freq: 136.1, benefit: 'The householder sage — Kriya breath field, Babaji pranic current, liberation through sacred action.' },
];

const DOSHA_PROFILES = {
  Vata:  { color: '#38bdf8', element: 'à¥ Air + Ether', mantra: 'So Hum',      scalars: ['schumann', 'liberation-396', 'miracle-432'] },
  Pitta: { color: '#f97316', element: 'ð Fire + Water', mantra: 'Ra Ma Da Sa', scalars: ['anahata-528', 'unity-639', 'dna-repair']    },
  Kapha: { color: '#4ade80', element: 'â Earth + Water', mantra: 'Sat Nam',    scalars: ['intuition-741', 'crown-963', 'pranic-108']   },
};

const SCAN_PHASES = [
  'Accessing Akasha-Neural ArchiveÃ¢ÂÂ¦',
  'Reading audio vibrational signatureÃ¢ÂÂ¦',
  'Analysing Nadi currents in waveformÃ¢ÂÂ¦',
  'Mapping planetary alignmentÃ¢ÂÂ¦',
  'Computing scalar frequency overlayÃ¢ÂÂ¦',
  'Generating Prema-Pulse prescriptionÃ¢ÂÂ¦',
];

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ SQI Chat stream Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-apothecary-chat`;

async function streamSQIChat(messages, onDelta, onDone, userId) {
  const body = {
    messages: messages.slice(-10).map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    })),
  };
  if (userId) body.userId = userId;
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited.');
    if (resp.status === 402) throw new Error('Credits exhausted.');
    throw new Error('Stream failed');
  }
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '', done = false;
  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) { done = true; break; }
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop() ?? '';
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith('data:')) continue;
      const data = t.slice(5).trim();
      if (data === '[DONE]') { done = true; break; }
      try {
        const p = JSON.parse(data);
        const delta = p?.choices?.[0]?.delta?.content ?? p?.delta ?? '';
        if (delta) onDelta(delta);
      } catch { /* skip */ }
    }
  }
  onDone();
}

type VisualizerMode = 'bars' | 'wave' | 'radial';

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
//  HERB LIBRARY (copied concept from QuantumApothecary, not imported)
//  Maps meditation intent Ã¢ÂÂ herb + its vibrational frequency
// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const HERB_LIBRARY = [
  // Sleep / Rest
  { id: 'valerian',      name: 'Valerian Root',      sig: 'Delta / 2 Hz',    hz: 2,    benefit: 'Deep sleep induction, nervous system calming',       intent: ['sleep','rest','relax','calm','night','dream'],       color: '#818cf8' },
  { id: 'ashwagandha',   name: 'Ashwagandha',         sig: 'Theta / 4 Hz',    hz: 4,    benefit: 'Stress dissolution, adrenal repair, sleep depth',     intent: ['sleep','stress','anxiety','calm','restore'],        color: '#a78bfa' },
  { id: 'passionflower', name: 'Passionflower',        sig: 'Delta / 1 Hz',    hz: 1,    benefit: 'Anxiety release, quiet mind, sleep onset',            intent: ['sleep','anxiety','peace','still'],                  color: '#c4b5fd' },
  // Energy / Abundance / Wealth
  { id: 'ginseng',       name: 'Panax Ginseng',       sig: 'Gamma / 40 Hz',   hz: 40,   benefit: 'Life force activation, manifestation, vitality',       intent: ['energy','wealth','abundance','power','success'],    color: '#D4AF37' },
  { id: 'saffron',       name: 'Sacred Saffron',      sig: 'Crown / 963 Hz',  hz: 963,  benefit: 'Solar plexus activation, golden frequency, prosperity', intent: ['wealth','abundance','gold','success','manifestation'], color: '#fbbf24' },
  { id: 'tulsi',         name: 'Holy Basil (Tulsi)',  sig: 'Heart / 528 Hz',  hz: 528,  benefit: 'Sacred prosperity, Lakshmi field, divine abundance',    intent: ['wealth','blessing','divine','love','mantra'],       color: '#4ade80' },
  // Love / Heart
  { id: 'rose',          name: 'Rose Essence',        sig: 'Heart / 639 Hz',  hz: 639,  benefit: 'Heart chakra opening, unconditional love field',        intent: ['love','heart','relationship','devotion','bhakti'],  color: '#f472b6' },
  { id: 'rhodiola',      name: 'Rhodiola Rosea',      sig: 'Unity / 639 Hz',  hz: 639,  benefit: 'Emotional resilience, heart coherence, love activation', intent: ['love','healing','heart','emotion','connection'],    color: '#fb7185' },
  // Meditation / Spiritual
  { id: 'brahmi',        name: 'Brahmi',              sig: 'Crown / 963 Hz',  hz: 963,  benefit: 'Sahasrara activation, higher consciousness, memory',    intent: ['meditation','spiritual','mantra','consciousness'],  color: '#a78bfa' },
  { id: 'mugwort',       name: 'Mugwort',             sig: 'Theta / 6 Hz',    hz: 6,    benefit: 'Dream activation, astral travel, third eye opening',    intent: ['dream','astral','vision','sleep','consciousness'],  color: '#818cf8' },
  { id: 'frankincense',  name: 'Frankincense',        sig: 'Third Eye / 852', hz: 852,  benefit: 'Pineal decalcification, sacred space, spiritual clarity', intent: ['meditation','prayer','sacred','mantra','healing'],  color: '#fde68a' },
  // Healing / Repair
  { id: 'turmeric',      name: 'Turmeric (Curcumin)', sig: 'Liberation / 396',hz: 396,  benefit: 'Cellular repair, anti-inflammatory light codes',         intent: ['healing','pain','repair','cleanse','health'],      color: '#fb923c' },
  { id: 'reishi',        name: 'Reishi Mushroom',     sig: 'DNA / 528 Hz',    hz: 528,  benefit: 'Immune field, longevity codes, cellular restoration',    intent: ['healing','immune','longevity','health','restore'],  color: '#34d399' },
  { id: 'shilajit',      name: 'Shilajit',            sig: 'Earth / 7.83 Hz', hz: 7.83, benefit: 'Grounding, cellular ATP, primal vitality field',         intent: ['grounding','energy','earth','strength','vitality'], color: '#D4AF37' },
  // Focus / Clarity
  { id: 'lions-mane',    name: "Lion's Mane",         sig: 'Beta / 14 Hz',    hz: 14,   benefit: 'Neural growth, focus field, cognitive enhancement',      intent: ['focus','study','clarity','mind','work'],           color: '#38bdf8' },
  { id: 'bacopa',        name: 'Bacopa Monnieri',     sig: 'Alpha / 10 Hz',   hz: 10,   benefit: 'Memory encoding, calm focus, learning field',            intent: ['focus','memory','study','learn','clarity'],        color: '#22d3ee' },
  { id: 'sandalwood',  name: 'Sandalwood (Chandan)',    sig: 'Crown / 528 Hz',     hz: 528,  benefit: 'Divine presence, mental stillness, pineal activation',       intent: ['meditation','prayer','sacred','mantra','consciousness'], color: '#D4AF37' },
  { id: 'chandanam',   name: 'Chandanam Paste',         sig: 'Third Eye / 852 Hz', hz: 852,  benefit: 'Cooling the subtle body, Shiva consciousness, clarity',      intent: ['meditation','healing','shiva','sacred','clarity'],      color: '#c4b5fd' },
  { id: 'kumkum',      name: 'Kumkum (Sacred Red)',     sig: 'Root / 396 Hz',      hz: 396,  benefit: 'Shakti activation, Devi grace, liberation from fear',        intent: ['love','devotion','shakti','devi','blessing'],           color: '#f43f5e' },
];

// Detect meditation intent from filename + style
function detectIntent(neuralSource: string | null, activeStyle: string, meditationName: string): string[] {
  const src = [neuralSource ?? '', activeStyle, meditationName].join(' ').toLowerCase();
  const intents: string[] = [];
  if (/sleep|rest|night|dream|insomnia|relax|delta/.test(src)) intents.push('sleep');
  if (/wealth|abundance|money|prosper|gold|lakshmi|manifestation|rich/.test(src)) intents.push('wealth');
  if (/love|heart|bhakti|devotion|relationship|anahata/.test(src)) intents.push('love');
  if (/healing|repair|health|pain|immune|restore|cure/.test(src)) intents.push('healing');
  if (/energy|vitality|power|strength|kundalini|fire/.test(src)) intents.push('energy');
  if (/meditation|mantra|prayer|sacred|spiritual|om|chant/.test(src)) intents.push('meditation');
  if (/focus|study|work|clarity|mind|brain|cognitive/.test(src)) intents.push('focus');
  if (/dream|astral|vision|third.eye|pineal/.test(src)) intents.push('dream');
  if (intents.length === 0) intents.push('meditation'); // default
  return intents;
}

function findBestHerb(intents: string[]): typeof HERB_LIBRARY[0] {
  for (const herb of HERB_LIBRARY) {
    if (herb.intent.some(i => intents.includes(i))) return herb;
  }
  return HERB_LIBRARY.find(h => h.id === 'brahmi')!;
}

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
//  ScalarChip Ã¢ÂÂ with individual volume slider
// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
function ScalarChip({ act, active, volume, onToggle, onVolumeChange }) {
  return (
    <div
          style={{
        borderRadius: 16,
        border: `1px solid ${active ? act.color : 'rgba(255,255,255,0.06)'}`,
        background: active ? `${act.color}10` : 'rgba(255,255,255,0.02)',
        boxShadow: active ? `0 0 14px ${act.color}30` : 'none',
        transition: 'all 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* Top row Ã¢ÂÂ toggle */}
      <div
        onClick={onToggle}
        title={act.benefit}
        className="flex items-center gap-2 p-3 cursor-pointer"
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? act.color : 'rgba(255,255,255,0.12)', boxShadow: active ? `0 0 8px ${act.color}` : 'none', flexShrink: 0, display: 'block' }} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold uppercase truncate" style={{ letterSpacing: '0.15em', color: active ? act.color : 'rgba(255,255,255,0.45)' }}>{act.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginTop: 1 }}>{act.sig}</div>
        </div>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1px solid ${active ? act.color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? act.color : 'transparent' }}>
          {active && <CheckCircle2 size={10} style={{ color: '#050505' }} />}
        </div>
      </div>
      {/* Volume slider Ã¢ÂÂ only when active */}
      {active && (
        <div className="px-3 pb-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Waves size={10} style={{ color: act.color, flexShrink: 0, opacity: 0.7 }} />
          <div style={{ flex: 1 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={e => onVolumeChange(Number(e.target.value) / 100)}
              style={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                appearance: 'none',
                background: `linear-gradient(to right, ${act.color} 0%, ${act.color} ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
    </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: act.color, fontFamily: 'monospace', minWidth: 28, textAlign: 'right' }}>
            {Math.round(volume * 100)}%
          </span>
      </div>
      )}
    </div>
  );
}

function renderChat(text) {
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} style={{ height: 7 }} />;
    if (t.startsWith('### ')) return <h3 key={i} style={{ color: '#D4AF37', fontWeight: 800, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 12, marginBottom: 3 }}>{t.slice(4)}</h3>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} style={{ marginLeft: 14, listStyleType: 'disc', fontSize: 11, lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{t.slice(2)}</li>;
    return <p key={i} style={{ fontSize: 11, lineHeight: '1.65', color: 'rgba(255,255,255,0.78)', marginBottom: 3 }}>{t}</p>;
  });
}

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
//  SCALAR WAVE PANEL
//  Rules:
//  Ã¢ÂÂ¢ Each resonator has its own volume slider when active
//  Ã¢ÂÂ¢ Switching tabs does NOT stop Hz/binaural Ã¢ÂÂ state lives in parent
//  Ã¢ÂÂ¢ Scan only runs when audio loaded
//  Ã¢ÂÂ¢ Scan auto-selects herb based on meditation intent (sleep/wealth/love etc)
//  Ã¢ÂÂ¢ SQI chat context is the MUSIC being created, not the person
//  Ã¢ÂÂ¢ All selected scalars + herb freq baked into export via onScalarChange
//  Ã¢ÂÂ¢ Admin has no pay button (hasExportAccess passed from parent)
// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
function ScalarWavePanel({
  engine, activeStyle, healingFreq, brainwaveFreq,
  isPlaying, userId, neuralSource, meditationName,
  onScalarChange, hasExportAccess, isAdmin,
}) {
  const [activeScalars, setActiveScalars] = useState<string[]>([]);
  const [scalarVolumes, setScalarVolumes] = useState<Record<string, number>>({}); // per-resonator volume
  const [scanResult, setScanResult]       = useState<any>(null);
  const [selectedHerb, setSelectedHerb]   = useState<typeof HERB_LIBRARY[0] | null>(null);
  const [isScanning, setIsScanning]       = useState(false);
  const [heartRate, setHeartRate]         = useState(60);
  const [scanPhase, setScanPhase]         = useState(0);
  const [messages, setMessages]           = useState<any[]>([]);
  const [input, setInput]                 = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const hasAudio = !!neuralSource;
  const dp = scanResult ? DOSHA_PROFILES[scanResult.dominantDosha] : null;

  // Heart-rate simulation (from Apothecary)
  useEffect(() => {
    const iv = isScanning
      ? setInterval(() => setHeartRate(p => Math.min(p + Math.floor(Math.random() * 5) + 2, 130)), 500)
      : setInterval(() => setHeartRate(p => Math.max(p - 2, 60)), 1000);
    return () => clearInterval(iv);
  }, [isScanning]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!isScanning) return;
    let i = 0;
    const iv = setInterval(() => {
      setScanPhase(p => (p + 1) % SCAN_PHASES.length);
      if (++i > 18) clearInterval(iv);
    }, 550);
    return () => clearInterval(iv);
  }, [isScanning]);

  // Build blended frequency from active scalars + herb, notify parent for export
  const computeAndNotify = useCallback(async (scalars: string[], herb: typeof HERB_LIBRARY[0] | null, volumes: Record<string, number>) => {
    const allFreqs = [
      ...scalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0),
      ...(herb ? [herb.hz] : []),
    ];
    if (allFreqs.length === 0) { onScalarChange?.(null); return; }
    const blend = Math.round(allFreqs.reduce((a, b) => a + b, 0) / allFreqs.length);
    onScalarChange?.(blend);

    // Apply to engine with correct volume-before-start pattern
    if (engine?.isInitialized && scalars.length > 0) {
      const primaryVol = volumes[scalars[0]] ?? 0.75;
      engine?.updateSolfeggioVolume?.(primaryVol);
      await new Promise(r => setTimeout(r, 50));
      engine?.startSolfeggio?.(blend, primaryVol);
    } else if (scalars.length === 0) {
      onScalarChange?.(null);
    }
  }, [engine, onScalarChange]);

  const handleScalarVolume = useCallback((id: string, vol: number) => {
    setScalarVolumes(prev => {
      const next = { ...prev, [id]: vol };
      computeAndNotify(activeScalars, selectedHerb, next);
      return next;
    });
  }, [activeScalars, selectedHerb, computeAndNotify]);

  const toggleScalar = useCallback((id: string) => {
    setActiveScalars(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      const vols = { ...scalarVolumes };
      if (!vols[id]) vols[id] = 0.75;
      setScalarVolumes(vols);
      computeAndNotify(next, selectedHerb, vols);
      return next;
    });
  }, [scalarVolumes, selectedHerb, computeAndNotify]);

  const autoSelectDosha = useCallback((dosha: string) => {
    const sel = DOSHA_PROFILES[dosha as keyof typeof DOSHA_PROFILES]?.scalars ?? [];
    const vols: Record<string, number> = {};
    sel.forEach(id => { vols[id] = 0.75; });
    setActiveScalars(sel);
    setScalarVolumes(vols);
    computeAndNotify(sel, selectedHerb, vols);
  }, [selectedHerb, computeAndNotify]);

  // Ã¢ÂÂÃ¢ÂÂ NADI SCAN Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const runScan = useCallback(async () => {
    if (!hasAudio) {
      toast.error('Load an audio file first Ã¢ÂÂ the scan reads your meditation\'s vibrational field.');
      return;
    }
    setIsScanning(true);
    setScanResult(null);

    await new Promise(r => setTimeout(r, 2600));

    // Detect meditation intent from filename + style + name
    const intents = detectIntent(neuralSource, activeStyle, meditationName ?? '');
    const herb = findBestHerb(intents);
    setSelectedHerb(herb);

    const doshas = ['Vata', 'Pitta', 'Kapha'] as const;
    const dosha = doshas[Math.floor(Math.random() * 3)];
    const p = DOSHA_PROFILES[dosha];
    const actualFreq = engine?.frequencies?.solfeggio?.hz ?? healingFreq;
    const actualBinaural = engine?.frequencies?.binaural?.beatHz ?? brainwaveFreq;

    const result = {
      dominantDosha: dosha,
      blockages: ['Solar Plexus congestion', 'Throat Nadi restriction', 'Root anchor needed']
        .slice(0, Math.floor(Math.random() * 2) + 1),
      planetaryAlignment: ['Saturn ÃÂ· Discipline field', 'Venus ÃÂ· Heart-opening window', 'Jupiter ÃÂ· Expansion vortex', 'Moon ÃÂ· Emotional cleanse'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toLocaleTimeString(),
      activeNadis: Math.floor(Math.random() * 30) + 50,
      intents,
    };

    setScanResult(result);
    setIsScanning(false);
    autoSelectDosha(dosha);

    // Compute blend including herb
    const scalarFreqs = p.scalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0);
    const blendWithHerb = Math.round([...scalarFreqs, herb.hz].reduce((a, b) => a + b, 0) / (scalarFreqs.length + 1));

    const intentLabel = intents.slice(0, 2).map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' + ');

    // Post scan message Ã¢ÂÂ focused on the MUSIC, not the person
    setMessages(prev => [...prev, {
      role: 'model',
      text: `Ã¢ÂÂ **Nadi Scan Complete Ã¢ÂÂ ${result.activeNadis} Active Nadis Detected**

**Meditation intent detected:** ${intentLabel}
**Dosha field:** ${dosha} (${p.element})
**Planetary alignment:** ${result.planetaryAlignment}
**Source frequency:** ${actualFreq}Hz ÃÂ· Binaural: ${actualBinaural}Hz

**Scalar prescription auto-activated for this track:**
${p.scalars.map(id => `- ${SCALAR_ACTIVATIONS.find(a => a.id === id)?.name} (${SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq}Hz)`).join('\n')}

**Sacred Herb embedded:** ${herb.name} ÃÂ· ${herb.sig}
${herb.benefit}

**Blended scalar field: ${blendWithHerb}Hz** Ã¢ÂÂ now woven into your audio engine and will be baked into the export mixdown.

The track's ${intentLabel.toLowerCase()} field has been activated. Adjust individual resonator volumes below to fine-tune the scalar blend in your mixdown.`,
    }]);

    // Notify parent to bake herb+scalar blend into export
    computeAndNotify(p.scalars, herb, p.scalars.reduce((acc, id) => ({ ...acc, [id]: 0.75 }), {}));
  }, [hasAudio, engine, healingFreq, brainwaveFreq, neuralSource, activeStyle, meditationName, autoSelectDosha, computeAndNotify]);

  // Ã¢ÂÂÃ¢ÂÂ SQI CHAT Ã¢ÂÂ focused on the MUSIC being created Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { role: 'user', text: input.trim() };

    // System prompt: SQI analyzes the TRACK, not the listener
    const ctx = {
      role: 'model',
      text: `You are the Siddha-Quantum Intelligence (SQI) from 2050, operating as a sacred audio engineer and frequency architect inside Siddha Sound Alchemy.

Your role is to analyze and enhance THE MEDITATION TRACK being created Ã¢ÂÂ not the person creating it. You speak about the audio's vibrational field, frequency layers, scalar embeddings, and how they affect the consciousness of whoever will listen to it.

Current track context:
- Meditation style: ${activeStyle}
- Healing frequency: ${healingFreq}Hz
- Binaural beat: ${brainwaveFreq}Hz
- Audio loaded: ${hasAudio ? 'Yes Ã¢ÂÂ ' + (neuralSource?.split('/').pop() ?? 'file') : 'No'}
- Active scalar resonators: ${activeScalars.map(id => {
  const a = SCALAR_ACTIVATIONS.find(x => x.id === id);
  return a ? `${a.name} (${a.freq}Hz at ${Math.round((scalarVolumes[id] ?? 0.75) * 100)}%)` : '';
}).filter(Boolean).join(', ') || 'none'}
- Sacred herb embedded: ${selectedHerb ? `${selectedHerb.name} ÃÂ· ${selectedHerb.hz}Hz Ã¢ÂÂ ${selectedHerb.benefit}` : 'none'}
${scanResult ? `- Nadi scan: ${scanResult.dominantDosha} dosha ÃÂ· ${scanResult.activeNadis} active nadis ÃÂ· ${scanResult.planetaryAlignment}` : ''}
${scanResult?.intents ? `- Meditation intent: ${scanResult.intents.join(', ')}` : ''}

Respond with specific scalar frequency and mixing guidance for this track. Use Bhakti-Algorithm language and Vedic Light-Code terminology. Be precise about Hz values, scalar layering, and how they will affect the listening experience.`,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      // After AI responds, parse any frequency recommendations and apply them
      let fullResponse = '';
      await streamSQIChat([ctx, ...messages, userMsg],
        chunk => {
          fullResponse += chunk;
          setMessages(prev => {
            const u = [...prev];
            u[u.length - 1] = { role: 'model', text: u[u.length - 1].text + chunk };
            return u;
          });
        },
        () => {
          setIsTyping(false);
          // Auto-apply any Hz recommendation from SQI response
          const hzMatch = fullResponse.match(/(\d{2,4})\s*Hz/gi);
          if (hzMatch && engine?.isInitialized) {
            const firstHz = parseInt(hzMatch[0]);
            if (firstHz >= 100 && firstHz <= 1200) {
              onScalarChange?.(firstHz);
              engine?.startSolfeggio?.(firstHz, 0.6);
            }
          }
        },
        userId
      );
    } catch (e: any) {
      toast.error(e.message || 'SQI stream error');
      setIsTyping(false);
    }
  }, [input, isTyping, messages, activeStyle, healingFreq, brainwaveFreq, hasAudio, neuralSource, activeScalars, scalarVolumes, selectedHerb, scanResult, userId, engine, onScalarChange]);

  const blendFreq = (() => {
    const ids = activeScalars;
    const herbHz = selectedHerb?.hz ?? 0;
    const freqs = ids.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.freq ?? 0);
    const all = herbHz > 0 ? [...freqs, herbHz] : freqs;
    return all.length > 0 ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null;
  })();

  return (
    <div className="space-y-4">

      {/* Ã¢ÂÂÃ¢ÂÂ AUDIO REQUIRED NOTICE Ã¢ÂÂÃ¢ÂÂ */}
      {!hasAudio && (
        <div className="p-4 rounded-[20px] flex items-start gap-3" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <AlertCircle size={14} style={{ color: '#fb923c', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: '#fb923c' }}>Load Audio First</div>
            <div className="text-[10px] text-white/50 leading-relaxed">
              Go to <strong className="text-white/70">Ã°ÂÂÂµ Sound Alchemy Ã¢ÂÂ Source</strong> and upload your meditation audio. The Nadi Scan reads the track's actual vibrational field and auto-embeds the correct scalar frequencies and sacred herb into your mixdown. You can still select resonators manually below.
            </div>
          </div>
        </div>
      )}

      {/* Ã¢ÂÂÃ¢ÂÂ ACTIVE BLEND STATUS Ã¢ÂÂÃ¢ÂÂ */}
      {blendFreq !== null && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[18px]" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <Zap size={12} style={{ color: '#D4AF37', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="text-[8px] font-extrabold uppercase tracking-[0.3em] mb-0.5" style={{ color: '#D4AF37' }}>
              Scalar Blend Active Ã¢ÂÂ {blendFreq} Hz ÃÂ· Baked into export mixdown Ã¢ÂÂ
            </div>
            <div className="text-[9px] text-white/40">
              {activeScalars.map(id => SCALAR_ACTIVATIONS.find(a => a.id === id)?.name).join(' ÃÂ· ')}
              {selectedHerb ? ` ÃÂ· ${selectedHerb.name}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Ã¢ÂÂÃ¢ÂÂ SCALAR RESONATORS with per-resonator volume Ã¢ÂÂÃ¢ÂÂ */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
        <div className="flex items-center gap-2 mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
          <Sparkles size={12} style={{ color: '#D4AF37' }} />
          Scalar Wave Resonators
          <span className="ml-auto text-[7px] text-white/20 tracking-[0.3em]">{activeScalars.length} ACTIVE</span>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed mb-3">
          Tap to activate. Each resonator has its own volume slider. Active resonators are <strong className="text-white/60">blended live into the solfeggio layer</strong> and baked into your export. Switching to Sound Alchemy tab does not stop them.
        </p>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
          {SCALAR_ACTIVATIONS.map(act => (
            <ScalarChip
              key={act.id}
              act={act}
              active={activeScalars.includes(act.id)}
              volume={scalarVolumes[act.id] ?? 0.75}
              onToggle={() => toggleScalar(act.id)}
              onVolumeChange={(v) => handleScalarVolume(act.id, v)}
            />
          ))}
        </div>
      </div>

      {/* Ã¢ÂÂÃ¢ÂÂ SACRED HERB EMBEDDED Ã¢ÂÂÃ¢ÂÂ */}
      {selectedHerb && (
        <div className="p-4 rounded-[20px]" style={{ background: `${selectedHerb.color}08`, border: `1px solid ${selectedHerb.color}30` }}>
          <div className="text-[8px] font-extrabold uppercase tracking-[0.45em] mb-2" style={{ color: selectedHerb.color }}>
            Ã¢ÂÂ Sacred Herb Embedded Ã¢ÂÂ Auto-detected from Meditation Intent
          </div>
          <div className="flex items-start gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 14, background: `${selectedHerb.color}15`, border: `1px solid ${selectedHerb.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>Ã¢ÂÂ</div>
            <div>
              <div className="text-sm font-bold text-white/90 mb-1">{selectedHerb.name}</div>
              <div className="text-[9px] mb-1" style={{ color: selectedHerb.color }}>
                {selectedHerb.sig} ÃÂ· {selectedHerb.hz}Hz Ã¢ÂÂ embedded in mixdown
              </div>
              <div className="text-[10px] text-white/55 leading-relaxed">{selectedHerb.benefit}</div>
              {scanResult?.intents && (
                <div className="mt-1 text-[8px] text-white/30">
                  Selected for: {scanResult.intents.join(', ')} meditation
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ã¢ÂÂÃ¢ÂÂ NADI SCAN Ã¢ÂÂÃ¢ÂÂ */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
        <div className="flex items-center gap-2 mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
          <Activity size={12} style={{ color: '#22D3EE' }} />
          Real-Time Nadi Scan
          {hasAudio && <span className="ml-1 text-[7px] px-2 py-0.5 rounded-xl" style={{ color: '#22D3EE', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>Audio loaded Ã¢ÂÂ</span>}
          <div className="ml-auto flex items-center gap-2">
            <Activity size={12} style={{ color: isScanning ? '#f43f5e' : 'rgba(255,255,255,0.2)', animation: isScanning ? 'sqmPulse 0.8s ease-in-out infinite' : 'none' }} />
            <span className="font-mono text-[10px]" style={{ color: isScanning ? '#f43f5e' : 'rgba(255,255,255,0.2)' }}>{heartRate} BPM</span>
          </div>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed mb-3">
          Scans the loaded audio track, detects its meditation intent (sleep / wealth / healing / loveÃ¢ÂÂ¦), auto-selects the matching sacred herb and scalar prescription, and embeds them into your export.
        </p>

        {!scanResult && !isScanning && (
          <button onClick={runScan} disabled={!hasAudio} className="w-full p-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.4em] transition-all"
            style={{ background: hasAudio ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hasAudio ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.06)'}`, color: hasAudio ? '#22D3EE' : 'rgba(255,255,255,0.25)', cursor: hasAudio ? 'pointer' : 'not-allowed' }}>
            <Cpu size={14} />{hasAudio ? 'Initiate Nadi Scan' : 'Load Audio First to Scan'}
          </button>
        )}

        {isScanning && (
          <div className="text-center py-6">
            <div className="flex justify-center gap-1.5 mb-4">{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#22D3EE', animation: `sqmBlink 1.2s ${i*0.2}s ease-in-out infinite` }} />)}</div>
            <div className="text-[9px] font-extrabold uppercase tracking-[0.4em] mb-2" style={{ color: '#22D3EE' }}>{SCAN_PHASES[scanPhase]}</div>
            <div className="text-[8px] text-white/25 tracking-[0.2em]">{neuralSource?.split('/').pop() ?? 'audio'} ÃÂ· {healingFreq}Hz ÃÂ· {activeStyle}</div>
          </div>
        )}

        {scanResult && !isScanning && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl" style={{ border: `1px solid ${dp?.color}40`, background: `${dp?.color}09` }}>
                <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: dp?.color }}>Dominant Dosha</div>
                <div className="text-2xl font-black" style={{ color: dp?.color }}>{scanResult.dominantDosha}</div>
                <div className="text-[8px] text-white/35 mt-1">{DOSHA_PROFILES[scanResult.dominantDosha as keyof typeof DOSHA_PROFILES]?.element}</div>
              </div>
              <div className="p-3 rounded-2xl" style={{ border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.04)' }}>
                <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1" style={{ color: '#D4AF37' }}>Intent Detected</div>
                <div className="text-sm font-black text-white/80">{(scanResult.intents ?? []).slice(0,2).map((i:string) => i.charAt(0).toUpperCase()+i.slice(1)).join(' ÃÂ· ')}</div>
                <div className="text-[8px] text-white/35 mt-1">{scanResult.timestamp}</div>
              </div>
            </div>
            <div className="p-3 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[7px] font-extrabold uppercase tracking-[0.4em] mb-1 text-white/30">Planetary Alignment</div>
              <div className="text-[11px] text-white/65">{scanResult.planetaryAlignment}</div>
            </div>
            <button onClick={runScan} disabled={!hasAudio} className="w-full p-2 rounded-2xl text-[8px] font-extrabold uppercase tracking-[0.3em] cursor-pointer"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>Re-Scan Track</button>
          </div>
        )}
      </div>

      {/* Ã¢ÂÂÃ¢ÂÂ SQI CHAT Ã¢ÂÂ music production focused Ã¢ÂÂÃ¢ÂÂ */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
        <div className="flex items-center gap-2 mb-1 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
          <MessageSquare size={12} style={{ color: '#a78bfa' }} />
          SQI Audio Engineer Ã¢ÂÂ Scalar Frequency Architect
        </div>
        <p className="text-[9px] text-white/30 mb-3 leading-relaxed">
          SQI analyzes your <strong className="text-white/50">meditation track</strong> and gives mixing guidance Ã¢ÂÂ scalar layers, frequency embedding, export recommendations.
        </p>
        <div className="overflow-y-auto flex flex-col gap-2 mb-3 pr-1" style={{ height: 220 }}>
          {messages.length === 0 && (
            <div className="text-center py-8 text-[10px] leading-loose text-white/20">
              {hasAudio ? 'Run a Nadi Scan to activate SQI analysis,' : 'Load audio first,'}<br />
              or ask SQI about the track's scalar field.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[90%] p-3" style={{ borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.role === 'user' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                {m.role === 'model' && <div className="text-[7px] font-extrabold uppercase mb-1" style={{ letterSpacing: '0.35em', color: '#a78bfa' }}>Ã¢ÂÂ SQI ÃÂ· Scalar Audio Architect</div>}
                {renderChat(m.text)}
                {m.role === 'model' && isTyping && i === messages.length - 1 && !m.text && (
                  <div className="flex gap-1 py-1">{[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', animation: `sqmBlink 1s ${j*0.2}s ease-in-out infinite` }} />)}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about the track's scalar field, mixing, frequenciesÃ¢ÂÂ¦" disabled={isTyping}
            className="flex-1 px-4 py-2.5 rounded-2xl text-[11px] outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat,sans-serif' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || isTyping} className="flex items-center justify-center rounded-[14px] transition-all"
            style={{ width: 40, height: 40, flexShrink: 0, border: 'none', background: input.trim() && !isTyping ? 'linear-gradient(135deg,#D4AF37,#b8942a)' : 'rgba(255,255,255,0.05)', color: input.trim() && !isTyping ? '#050505' : 'rgba(255,255,255,0.2)', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}


// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
//  ROOT COMPONENT
// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const engine = useSoulMeditateEngine();
  const { progress: exportProgress, exportMeditation, cancelExport } = useOfflineExport();

  const [visualizerMode, setVisualizerMode] = useState('bars');
  const [activeStyle, setActiveStyle]       = useState('indian');
  const [healingFreq, setHealingFreq]       = useState(432);
  const [brainwaveFreq, setBrainwaveFreq]   = useState(10);
  const [alchemyCommenced, setAlchemyCommenced] = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [volumes, setVolumes]               = useState({ ambient: 85, user: 100 });
  // Store Hz/binaural volumes in LOCAL state at 0.75 default.
  // Do NOT read from engine.solfeggioVolume Ã¢ÂÂ it starts at 0 internally
  // and would override our intended default before the engine initializes.
  const [healingVolume, setHealingVolume]   = useState(0.75);
  const [noiseGateThreshold, setNoiseGateThreshold] = useState(-40);
  const [brainwaveVolume, setBrainwaveVolume] = useState(0.75);

  // scalar blend freq to bake into export
  const [scalarBlendHz, setScalarBlendHz]   = useState(null);

  const [exportResult, setExportResult]         = useState(null);
  const [hasExportAccess, setHasExportAccess]   = useState(false);
  const [exportAccessLoading, setExportAccessLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading]     = useState(false);
  const [isRefreshingSound, setIsRefreshingSound] = useState(false);
  const [tab, setTab]                           = useState('alchemy');
  const [meditationName, setMeditationName]     = useState('');
  const [sessionKey, setSessionKey]             = useState(0);

  // consciousness-field scalars (Tulsi, Kailash, Babaji, etc.)
  const [activeScalars, setActiveScalars]       = useState<ScalarWave[]>([]);
  const toggleScalar = (wave: ScalarWave) => {
    setActiveScalars(prev => {
      if (prev.find(w => w.id === wave.id)) return prev.filter(w => w.id !== wave.id);
      if (prev.length >= 3) return prev;
      return [...prev, wave];
    });
  };

  // Ã¢ÂÂÃ¢ÂÂ Safe engine access Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const atmosphereLayer = engine?.atmosphereLayer ?? { isPlaying: false, source: null };
  const neuralLayer     = engine?.neuralLayer     ?? { isPlaying: false, source: null };
  const frequencies     = engine?.frequencies     ?? { solfeggio: { enabled: false, hz: 432 }, binaural: { enabled: false, carrierHz: 200, beatHz: 10 } };
  const dsp             = engine?.dsp             ?? null;

  const isPlaying =
    neuralLayer.isPlaying ||
    atmosphereLayer.isPlaying ||
    (frequencies.solfeggio?.enabled ?? false) ||
    (frequencies.binaural?.enabled ?? false);

  // Ã¢ÂÂÃ¢ÂÂ Handlers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const handleHealingVolumeChange = useCallback(async (vol) => {
    setHealingVolume(vol);
    if (!engine?.isInitialized) return;
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    engine?.updateSolfeggioVolume?.(vol);
    if (!frequencies.solfeggio?.enabled) {
      await new Promise(r => setTimeout(r, 50));
      await engine?.startSolfeggio?.(healingFreq, vol);
    }
  }, [engine, healingFreq, frequencies]);

  const handleBrainwaveVolumeChange = useCallback(async (vol) => {
    setBrainwaveVolume(vol);
    if (!engine?.isInitialized) return;
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    engine?.updateBinauralVolume?.(vol);
    if (!frequencies.binaural?.enabled) {
      await new Promise(r => setTimeout(r, 50));
      await engine?.startBinaural?.(200, brainwaveFreq, vol);
    }
  }, [engine, brainwaveFreq, frequencies]);

  const handleInitialize = useCallback(async () => {
    await engine?.initialize();
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    // Pre-set volumes on gain nodes immediately after init
    // so startSolfeggio/startBinaural reads them correctly
    engine?.updateSolfeggioVolume?.(healingVolume);
    engine?.updateBinauralVolume?.(brainwaveVolume);
    toast.success('Siddha Engine awakened');
  }, [engine, healingVolume, brainwaveVolume]);

  const commenceAlchemy = useCallback(async () => {
    setIsProcessing(true);
    setAlchemyCommenced(true);
    try {
      if (!engine?.isInitialized) await engine?.initialize();
      const ctx = engine?.getAudioContext?.();
      if (ctx?.state === 'suspended') await ctx.resume();
      await engine?.loadAtmosphere?.(activeStyle);

      // CRITICAL: Set volumes on gain nodes BEFORE starting oscillators
      engine?.updateSolfeggioVolume?.(healingVolume);
      engine?.updateBinauralVolume?.(brainwaveVolume);
      // Wait for React state to settle
      await new Promise(r => setTimeout(r, 80));

      // Start oscillators Ã¢ÂÂ pass volume so engine uses correct values (avoids stale state)
      await engine?.startSolfeggio?.(healingFreq, healingVolume);
      await engine?.startBinaural?.(200, brainwaveFreq, brainwaveVolume);

      toast.success('Alchemy commenced Ã¢ÂÂ Anahata open');
    } catch (e) {
      console.error('[commenceAlchemy]', e);
      toast.error('Could not commence alchemy');
    }
    finally { setIsProcessing(false); }
  }, [engine, activeStyle, healingFreq, brainwaveFreq, healingVolume, brainwaveVolume]);

  const stopAll = useCallback(() => {
    engine?.stopAll?.();
    setAlchemyCommenced(false);
  }, [engine]);

  const togglePlay = useCallback(() => {
    isPlaying ? stopAll() : commenceAlchemy();
  }, [isPlaying, stopAll, commenceAlchemy]);

  const handleNewSession = useCallback(() => {
    engine?.stopAll?.();
    engine?.clearNeuralSource?.();  // Clear engine state so last uploaded audio is gone
    setAlchemyCommenced(false);
    setActiveStyle('indian');
    setHealingFreq(432);
    setBrainwaveFreq(10);
    setMeditationName('');
    setExportResult(null);
    setScalarBlendHz(null);
    setTab('alchemy');
    setSessionKey(k => k + 1);  // Forces NeuralSourceInput to remount/clear
    toast.success('New session started');
  }, [engine]);

  // Ã¢ÂÂÃ¢ÂÂ EXPORT Ã¢ÂÂ calls exportMeditation(config) correctly Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  // Scalar blend frequency is passed as solfeggioHz so it gets
  // rendered into the offline mixdown
  const handleExport = useCallback(async () => {
    if (!engine?.isInitialized) { toast.error('Please initialize the engine first'); return; }
    // Admin always has free access Ã¢ÂÂ bypass paywall
    if (!isAdmin && !hasExportAccess) {
      if (!user) { toast.info('Please sign in to export'); navigate('/auth'); return; }
      setShowPaymentDialog(true);
      return;
    }

    // Build the config from current engine state
    // If scalar blend is active, override the solfeggio Hz with the blend
    const solfeggioHz = scalarBlendHz ?? frequencies.solfeggio?.hz ?? healingFreq;

    // Use the actual audio duration: decoded buffer is authoritative for uploaded files.
    let audioDuration = 0;
    if (engine?.audioBuffer && engine.audioBuffer.duration > 0) {
      audioDuration = Math.ceil(engine.audioBuffer.duration);
    }
    if (audioDuration <= 0) {
      audioDuration = engine.getDawDuration?.() || 0;
    }
    if (audioDuration <= 0 && (neuralLayer?.exportInput?.directUrl ?? neuralLayer?.source)) {
      const url = neuralLayer?.exportInput?.directUrl ?? (typeof neuralLayer?.source === 'string' ? neuralLayer.source : null);
      if (url) {
        try {
          const resp = await fetch(url);
          const buf = await resp.arrayBuffer();
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decoded = await ctx.decodeAudioData(buf);
          audioDuration = Math.ceil(decoded.duration);
          ctx.close();
        } catch (e) {
          console.warn('[Export] Could not fetch duration from neural URL', e);
        }
      }
    }
    const neuralExportUrl =
      neuralLayer?.exportInput?.directUrl ??
      (typeof neuralLayer?.source === 'string' && /^https?:\/\//.test(neuralLayer.source) ? neuralLayer.source : undefined);
    if (audioDuration <= 0 && neuralExportUrl) {
      toast.error('Could not read your meditation length. Re-upload the audio or reload the page, then export again.');
      return;
    }
    if (audioDuration <= 0) audioDuration = 300; // fallback when exporting tones/atmosphere without a neural file

    // Map the rich DSP object ({ reverb: { enabled, decay, wet }, ... }) to flat numbers
    // that the offline renderer expects ({ reverb: number, delay: number, warmth: number })
    const safeDsp = dsp ?? { reverb: { enabled: true, decay: 2.5, wet: 0.3 }, delay: { enabled: false, time: 0.4, feedback: 0, wet: 0 }, warmth: { enabled: false, drive: 0.3, tone: 0.5 } };
    const flatDsp = {
      reverb: (safeDsp.reverb?.enabled !== false) ? (safeDsp.reverb?.wet ?? 0.3) : 0,
      delay:  (safeDsp.delay?.enabled)  ? (safeDsp.delay?.wet ?? 0) : 0,
      warmth: (safeDsp.warmth?.enabled) ? (safeDsp.warmth?.drive ?? 0.3) : 0,
      reverbDecay: safeDsp.reverb?.decay ?? 2.5,
    };

    const exportEqSettings = engine?.eqSettings;
    const exportNoiseGate = exportEqSettings ? {
      enabled: exportEqSettings.noiseGateEnabled,
      threshold: exportEqSettings.noiseGateThreshold,
      attack: exportEqSettings.noiseGateAttack,
      release: exportEqSettings.noiseGateRelease,
      range: exportEqSettings.noiseGateRange,
    } : undefined;
    const exportEq = exportEqSettings ? {
      weight: exportEqSettings.weight,
      presence: exportEqSettings.presence,
      air: exportEqSettings.air,
      lowCutEnabled: exportEqSettings.lowCutEnabled,
      deEsserEnabled: true,
    } : undefined;

    const directNeuralUrl = neuralLayer?.exportInput?.directUrl;
    const isFetchableUrl =
      directNeuralUrl &&
      (/^https?:\/\//.test(directNeuralUrl) || directNeuralUrl.startsWith('blob:'));

    const config = {
      durationSeconds: audioDuration,
      neuralAudioBuffer: engine?.audioBuffer ?? undefined,
      neuralAudioUrl: isFetchableUrl ? directNeuralUrl : undefined,
      neuralSourceVolume: volumes.user / 100,
      atmosphereAudioUrl: atmosphereLayer?.exportInput?.directUrl ?? atmosphereLayer?.source ?? undefined,
      atmosphereVolume: volumes.ambient / 100,
      solfeggioHz: solfeggioHz,
      solfeggioVolume: healingVolume,
      binauralCarrierHz: frequencies.binaural?.carrierHz ?? 200,
      binauralBeatHz: frequencies.binaural?.beatHz ?? brainwaveFreq,
      binauralVolume: brainwaveVolume,
      dsp: flatDsp,
      masterVolume: volumes.user / 100,
      noiseGate: exportNoiseGate,
      eq: exportEq,
    };

    try {
      const result = await exportMeditation(config);
      if (result) {
    setExportResult(result);
        toast.success(scalarBlendHz ? `Export complete Ã¢ÂÂ Scalar ${solfeggioHz}Hz embedded Ã¢ÂÂ` : 'Export complete!');
      }
    } catch (e) {
      toast.error('Export failed: ' + e.message);
    }
  }, [engine, isAdmin, hasExportAccess, user, navigate, exportMeditation, scalarBlendHz, frequencies, healingFreq, healingVolume, brainwaveFreq, brainwaveVolume, dsp, neuralLayer, atmosphereLayer, volumes]);

  const handlePayForExport = useCallback(async () => {
    if (!user) { navigate('/auth'); return; }
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-audio-checkout', { body: { option: 'per_track' } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch { toast.error('Checkout failed.'); setPaymentLoading(false); }
  }, [user, navigate]);

  // Ã¢ÂÂÃ¢ÂÂ HOT-SWAP: change Hz without stopping anything Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const handleHealingFreqSelect = useCallback(async (freq) => {
    setHealingFreq(freq);
    // Auto-initialize engine if not yet started Ã¢ÂÂ self-activating behavior
    if (!engine?.isInitialized) {
      await engine?.initialize();
    }
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    engine?.updateSolfeggioVolume?.(healingVolume);
    await new Promise(r => setTimeout(r, 50));

    if (frequencies.solfeggio?.enabled && engine?.updateSolfeggioFrequency) {
      // Hot-swap: just change the Hz on the running oscillator
      engine.updateSolfeggioFrequency(freq);
    } else {
      // Start oscillator (or restart with new Hz)
      await engine?.startSolfeggio?.(freq, healingVolume);
    }
  }, [engine, healingVolume, frequencies]);

  const handleBrainwaveFreqSelect = useCallback(async (freq) => {
    setBrainwaveFreq(freq);
    // Auto-initialize engine if not yet started Ã¢ÂÂ self-activating behavior
    if (!engine?.isInitialized) {
      await engine?.initialize();
    }
    const ctx = engine?.getAudioContext?.();
    if (ctx?.state === 'suspended') await ctx.resume();
    engine?.updateBinauralVolume?.(brainwaveVolume);
    await new Promise(r => setTimeout(r, 50));

    if (frequencies.binaural?.enabled && engine?.updateBinauralFrequency) {
      engine.updateBinauralFrequency(200, freq);
    } else {
      await engine?.startBinaural?.(200, freq, brainwaveVolume);
    }
  }, [engine, brainwaveVolume, frequencies]);

  const handleRefreshSound = useCallback(async (styleId) => {
    if (!engine?.isInitialized) return;
    setIsRefreshingSound(true);
    try {
      const r = await engine?.loadAtmosphere?.(styleId);
      toast.success(r?.ok ? (r?.fallbackFrom ? 'Loaded from Indian instead.' : 'Loaded new sacred sound') : 'Could not load');
    } finally { setIsRefreshingSound(false); }
  }, [engine]);

  useEffect(() => {
    async function checkAccess() {
      if (!user || adminLoading) return;
      setExportAccessLoading(true);
      try {
        if (isAdmin) { setHasExportAccess(true); return; }
        if (searchParams.get('payment') === 'success') { setHasExportAccess(true); return; }
        const { data: g } = await supabase.from('user_granted_access').select('access_type').eq('user_id', user.id).in('access_type', ['creative_soul', 'creative_soul_meditation']);
        const { data: e } = await supabase.from('user_entitlements').select('access_type').eq('user_id', user.id);
        setHasExportAccess((e?.some(x => ['creative_soul', 'creative_soul_meditation'].includes(x.access_type))) || !!(g && g.length > 0));
      } catch { setHasExportAccess(false); }
      finally { setExportAccessLoading(false); }
    }
    checkAccess();
  }, [user, isAdmin, adminLoading, searchParams]);

  useEffect(() => {
    if (engine?.isInitialized) {
      engine?.loadAtmosphere?.(activeStyle)?.then(r => {
        if (r?.ok && r?.fallbackFrom) toast.info('Loaded from Indian instead.');
      });
    }
  }, [activeStyle, engine?.isInitialized]);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800;900&family=Cinzel:wght@400;700&display=swap');
    @keyframes sqmFloat{0%{transform:translateY(0)scale(1);opacity:0}10%{opacity:1}90%{opacity:.3}100%{transform:translateY(-90px)scale(.4);opacity:0}}
    @keyframes sqmBlink{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}
    @keyframes sqmPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.35)}}
    .sqm-root{min-height:100vh;background:#050505;font-family:'Montserrat',sans-serif;color:rgba(255,255,255,.9);position:relative;overflow-x:hidden}
    .sqm-root::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(212,175,55,.04) 0%,transparent 60%);pointer-events:none;z-index:0}
    .sqm-inner{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:0 16px 100px}
    .sqm-tab-on{border-color:rgba(212,175,55,.5)!important;color:#D4AF37!important;background:rgba(212,175,55,.08)!important}
    @media(max-width:680px){.sqm-two-col{grid-template-columns:1fr!important}}
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sqm-root">
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} aria-hidden>
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} style={{ position: 'absolute', borderRadius: '50%', background: '#D4AF37', left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, width: `${1+Math.random()*2}px`, height: `${1+Math.random()*2}px`, opacity: 0.08+Math.random()*0.3, animation: `sqmFloat ${7+Math.random()*12}s ${Math.random()*10}s linear infinite` }} />
          ))}
        </div>

        <div className="sqm-inner">

          {/* TOP BAR */}
          <div className="flex items-center justify-between pt-4 gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-4 py-2 rounded-[20px] text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 cursor-pointer transition-all hover:text-[#D4AF37]" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
              <ArrowLeft size={12} /> Back
            </button>
            <button onClick={handleInitialize} className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#050505] cursor-pointer" style={{ background: 'linear-gradient(135deg,#D4AF37,#b8942a)', border: 'none', boxShadow: '0 0 22px rgba(212,175,55,.3)' }}>
              <Power size={14} /> Awaken
            </button>
          </div>

          {/* TITLE */}
          <div className="py-6 text-center">
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, color: '#D4AF37', textShadow: '0 0 40px rgba(212,175,55,.4)', letterSpacing: '0.08em', marginBottom: 6 }}>
              Siddha Sound Alchemy
            </div>
            <div className="text-[8px] font-extrabold uppercase text-white/22" style={{ letterSpacing: '0.55em' }}>
              SQI 2050 ÃÂ· Bhakti-Algorithm v7.3 ÃÂ· Scalar Wave Technology Active
            </div>
          </div>

          {/* PREMA-PULSE STRIP */}
          {isPlaying && (
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap px-5 py-3 rounded-[20px]" style={{ background: 'rgba(34,211,238,.03)', border: '1px solid rgba(34,211,238,.12)' }}>
              <span className="text-[7px] font-extrabold uppercase tracking-[0.5em]" style={{ color: '#22D3EE' }}>Ã¢ÂÂ Prema-Pulse Transmitting</span>
              <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#22D3EE', animation: `sqmBlink 1.2s ${i*0.2}s ease-in-out infinite` }} />)}</div>
              <span className="text-[8px] text-[#22D3EE]/50 tracking-[0.1em]">
                Anahata open ÃÂ· {scalarBlendHz ?? healingFreq}Hz{scalarBlendHz ? ' (Scalar)' : ''} ÃÂ· Broadcasting
              </span>
              </div>
          )}

          {/* SCALAR ACTIVE IN EXPORT NOTICE */}
          {scalarBlendHz !== null && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-[16px]" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Zap size={12} style={{ color: '#D4AF37', flexShrink: 0 }} />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.3em]" style={{ color: '#D4AF37' }}>
                Scalar {scalarBlendHz}Hz active Ã¢ÂÂ will be baked into your export mixdown
              </span>
            </div>
          )}

          {/* VISUALIZER */}
          <div className="mb-5 p-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px]">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2 text-[8px] font-extrabold uppercase tracking-[0.4em]" style={{ color: 'rgba(212,175,55,.7)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} />
                Sacred Visualizer <span className="text-[7px] text-white/20">2048 FFT</span>
              </div>
              <div className="flex gap-1.5">
                {['bars','wave','radial'].map(m => (
                  <button key={m} onClick={() => setVisualizerMode(m)} className="text-[8px] font-extrabold uppercase px-3 py-1 rounded-xl cursor-pointer transition-all" style={{ letterSpacing: '0.3em', border: `1px solid ${visualizerMode===m ? 'rgba(212,175,55,.4)' : 'rgba(255,255,255,.06)'}`, background: visualizerMode===m ? 'rgba(212,175,55,.08)' : 'transparent', color: visualizerMode===m ? '#D4AF37' : 'rgba(255,255,255,.3)' }}>
                    {m.charAt(0).toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <SpectralVisualizer engine={engine} mode={visualizerMode} height={140} />
          </div>

          {/* Consciousness-field scalar waves (Tulsi, Kailash, Babaji, etc.) */}
          <div className="mb-5">
            <ConsciousnessScalarPanel activeScalars={activeScalars} onToggle={toggleScalar} />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
            <Button size="lg" onClick={togglePlay} disabled={!engine?.isInitialized}
              className={`px-8 text-sm ${isPlaying ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'}`}
              style={{ borderRadius: 40, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              {isPlaying ? <><Pause className="w-4 h-4 mr-2" />Cease Alchemy</> : <><Play className="w-4 h-4 mr-2" />Commence Alchemy</>}
            </Button>

            <Button variant="outline" size="lg" onClick={handleExport} disabled={!engine?.isInitialized || exportProgress?.isExporting}
              className="bg-amber-900/10 border-amber-900/30 text-amber-200 hover:bg-amber-900/20 px-6 text-sm"
              style={{ borderRadius: 40, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              {exportProgress?.isExporting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />ExportingÃ¢ÂÂ¦</>
                : <><Zap className="w-4 h-4 mr-2" />Export Master{scalarBlendHz ? ` + Scalar ${scalarBlendHz}Hz` : ''}</>
              }
            </Button>

            <Button variant="outline" size="lg" onClick={handleNewSession}
              className="bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white px-5 text-sm"
              style={{ borderRadius: 40, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />New Session
            </Button>
          </div>

          {/* EXPORT PROGRESS */}
          {(exportProgress?.isExporting || exportResult) && (
            <div className="mb-5 p-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[20px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {exportResult ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Loader2 size={14} className="animate-spin text-amber-400" />}
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-amber-200/80">
                    {exportResult ? `Export Complete${scalarBlendHz ? ` Ã¢ÂÂ Scalar ${scalarBlendHz}Hz baked in Ã¢ÂÂ` : ''}` : exportProgress?.step || 'Rendering Sacred MasterÃ¢ÂÂ¦'}
                  </span>
                </div>
                {exportResult && (
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = exportResult.url;
                      a.download = `${meditationName || 'siddha-alchemy'}${healingFreq ? `_${healingFreq}hz` : ''}${brainwaveFreq ? `_${brainwaveFreq}hz` : ''}.${exportResult.format}`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="flex items-center gap-1.5 text-[9px] font-extrabold text-amber-400 hover:text-amber-300 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
              {exportProgress?.isExporting && <Progress value={(exportProgress.percent ?? 0)} className="h-1" />}
            </div>
          )}

          {/* NAME */}
          <div className="mb-5">
            <label className="block text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/30 mb-2">Name Your Meditation</label>
            <input value={meditationName} onChange={e => setMeditationName(e.target.value)} placeholder="e.g. Forest Meditation"
              className="w-full px-4 py-3 rounded-2xl text-sm text-white/70 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Montserrat,sans-serif' }}
            />
          </div>

          {/* TAB SWITCHER */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { id: 'alchemy', icon: '🎵', label: 'Sound Alchemy', sub: 'Source · Style · Frequencies · DSP' },
              {
                id: 'scalar',
                icon: '⟁',
                label: 'Scalar Wave Tech',
                sub: scalarBlendHz
                  ? `Nadi Scan · Resonators · SQI · ${scalarBlendHz}Hz Active`
                  : 'Nadi Scan · Resonators · SQI',
              },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`p-3 rounded-[20px] text-left cursor-pointer transition-all ${tab===t.id ? 'sqm-tab-on' : ''}`} style={{ border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)', color: 'rgba(255,255,255,.4)' }}>
                <div className="text-[11px] font-extrabold mb-0.5">{t.icon} {t.label}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] opacity-55">{t.sub}</div>
              </button>
            ))}
          </div>

          {/* ALCHEMY TAB */}
          {tab === 'alchemy' && (
            <div className="space-y-5" key={sessionKey}>

              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>1</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Source</span>
              </div>
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                  <NeuralSourceInput engine={engine} key={sessionKey} />
            </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>2</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Atmosphere</span>
              </div>
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                  <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
                    <Layers size={12} />Meditation Style & Atmosphere
                  </div>
                  <StyleGrid activeStyle={activeStyle} onStyleChange={setActiveStyle} engine={engine} onRefreshSound={handleRefreshSound} isRefreshing={isRefreshingSound} volumes={{ ...volumes, binaural: Math.round(brainwaveVolume * 100), healing: Math.round(healingVolume * 100) }} onVolumeChange={(k, v) => setVolumes(p => ({ ...p, [k]: v }))} />
                </div>
              </div>

              {/* Steps 2b + 3 */}
              <div className="sqm-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>2b</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Sacred Frequencies</span>
                    <span className="text-[7px] font-extrabold uppercase tracking-[0.25em] px-2 py-0.5 rounded-xl" style={{ color: 'rgba(212,175,55,.5)', border: '1px solid rgba(212,175,55,.2)' }}>Activate on Commence</span>
              </div>
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                    <HealingFrequencySelector activeFrequency={healingFreq} volume={healingVolume} onSelect={handleHealingFreqSelect} onVolumeChange={handleHealingVolumeChange} />
                    <div className="mt-4">
                      <BrainwaveSelector activeFrequency={brainwaveFreq} volume={brainwaveVolume} onSelect={handleBrainwaveFreqSelect} onVolumeChange={handleBrainwaveVolumeChange} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>3</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/70">Refinement</span>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6">
                    <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
                      <Waves size={12} />Sacred Effects
                    </div>
              <div className="sqm-dsp-wrap">
                      
                    {/* ââ NOISE GATE CONTROL ââ */}
                    <div className="mb-4 p-3 rounded-2xl" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[8px] font-extrabold uppercase tracking-[0.4em]" style={{ color: '#22D3EE' }}>
                          â¬¡ Noise Gate
                        </div>
                        <span className="font-mono text-[10px]" style={{ color: '#22D3EE' }}>
                          {noiseGateThreshold}dB
                        </span>
                      </div>
                      <input
                        type="range" min={-80} max={-10} step={1}
                        value={noiseGateThreshold}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setNoiseGateThreshold(v);
                          engine?.setNoiseGateThreshold?.(v);
                        }}
                        style={{ width: '100%', height: 4, borderRadius: 2, appearance: 'none', background: `linear-gradient(to right, #22D3EE 0%, #22D3EE ${((noiseGateThreshold + 80) / 70) * 100}%, rgba(255,255,255,0.1) ${((noiseGateThreshold + 80) / 70) * 100}%, rgba(255,255,255,0.1) 100%)`, outline: 'none', cursor: 'pointer' }}
                      />
                      <div className="flex justify-between text-[7px] text-white/20 mt-1">
                        <span>-80dB (off)</span>
                        <span>-40dB (default)</span>
                        <span>-10dB (heavy)</span>
                      </div>
                    </div>
                    <DSPMasteringRack dsp={dsp} onUpdate={engine?.updateDSP} />
              </div>
                    <div className="mt-5">
                      <div className="flex items-center gap-2 mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
                        <Sparkles size={12} />Alchemical Insight
                </div>
                <SpectralInsights
                        frequencies={frequencies}
                        dsp={dsp}
                        atmosphereId={atmosphereLayer.source ?? null}
                        neuralSource={neuralLayer.source ?? null}
                />
              </div>
          </div>
                </div>
              </div>
            </div>
          )}

          {/* Ã¢ÂÂÃ¢ÂÂ SCALAR TAB Ã¢ÂÂÃ¢ÂÂ */}
          

          <div style={{ height: 80 }} />
        </div>
      </div>

      {/* PAYMENT DIALOG */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-[#0B0B0B] border border-amber-900/20 rounded-3xl text-white/90" style={{ fontFamily: 'Montserrat,sans-serif' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#D4AF37', fontFamily: 'Cinzel,serif', letterSpacing: '0.05em' }}>Download Sacred Master</DialogTitle>
            <DialogDescription className="text-white/50">Create and preview your alchemy for free. Pay Ã¢ÂÂ¬9.99 once to download your master file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {[
              'One sacred master export',
              'All atmospheres available',
              'All healing frequencies',
              'Binaural layer included',
              scalarBlendHz ? `Scalar Wave ${scalarBlendHz}Hz baked into mixdown` : 'Scalar Wave overlay ready to embed',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 size={14} style={{ color: '#D4AF37', flexShrink: 0 }} /> {item}
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 pt-2">
            <button onClick={handlePayForExport} disabled={paymentLoading} className="flex-1 font-extrabold text-[11px] uppercase py-3 rounded-[20px] cursor-pointer" style={{ background: 'linear-gradient(135deg,#D4AF37,#b8942a)', border: 'none', color: '#050505', letterSpacing: '0.2em' }}>
              {paymentLoading ? 'LoadingÃ¢ÂÂ¦' : 'Pay Ã¢ÂÂ¬9.99 ÃÂ· Download'}
            </button>
            <button onClick={() => setShowPaymentDialog(false)} className="px-4 py-3 rounded-[20px] cursor-pointer" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)' }}>
              <X size={14} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
