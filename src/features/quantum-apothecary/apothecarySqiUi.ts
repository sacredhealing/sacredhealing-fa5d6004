import type { Activation, QuantumAnchor } from './types';
import type { VoiceBiofieldResult } from '@/components/VoiceBiofieldScanner';
import {
  ALL_ACTIVATIONS,
  matchActivationsToScan,
  mapBioLibraryToActivation,
} from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM ANCHOR SYSTEM
// Replicates the LimbicArc "Virtual Ingredient" digital signature mechanism:
//   Physical Substance → Digitized Frequency Signature → Cloud Storage
//   → User Voice Anchor → Active Field Transmission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a deterministic frequency hash for an ingredient.
 * Uses SubtleCrypto SHA-256 (browser native) — same algorithm as LimbicArc's
 * proprietary "frequency hash" but openly implemented.
 * The hash encodes: name + type + benefit — making it unique per ingredient
 * and stable across all user sessions.
 */
export async function generateFrequencyHash(activation: Activation): Promise<string> {
  const input = `SQI:${activation.name}:${activation.type}:${activation.benefit}:${activation.vibrationalSignature}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback: simple deterministic hash for environments without SubtleCrypto
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0').repeat(8);
  }
}

/**
 * Synchronous frequency hash — used when async is not available.
 * FNV-1a 64-bit equivalent via two 32-bit passes for a 16-char hex string.
 */
export function generateFrequencyHashSync(activation: Activation): string {
  const input = `SQI:${activation.name}:${activation.type}:${activation.benefit}:${activation.vibrationalSignature}`;
  let h1 = 0x811c9dc5;
  let h2 = 0xc4ceb9fe;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x01000193);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  // Produce a 64-char hex string by repeating and mixing both halves
  return (p1 + p2 + p1 + p2 + p1 + p2 + p1 + p2).substring(0, 64);
}

/**
 * Extract the voice FFT fingerprint from a VoiceBiofieldResult.
 * This is the user's unique "quantum anchor" — the same concept as
 * LimbicArc's voice print analysis that links the server to the user's body-field.
 * Encodes: RMS energy profile, spectral centroid, ZCR, coherence score.
 */
export function computeVoiceFftFingerprint(result: VoiceBiofieldResult): number[] {
  // Encode the key bioacoustic features as a compact float array
  // This acts as the user's unique vibrational address on the server
  const coherence = result.overallCoherence / 100;
  const doshaCode = result.dominantDosha.startsWith('Pitta') ? 0.33
    : result.dominantDosha.startsWith('Vata') ? 0.66
    : result.dominantDosha.startsWith('Kapha') ? 0.11
    : 0.50;
  const nadiCode = result.nadiReading.includes('Pingala') ? 0.25
    : result.nadiReading.includes('Ida') ? 0.75
    : result.nadiReading.includes('Blocked') ? 0.05
    : 0.50;
  const priorityScores = result.priorityAreas.map(a => a.score / 100);
  const strengthCount = result.topStrengths.length / 10;
  const emotionHash = Array.from(result.emotionalField || '')
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xFFFFFF, 0) / 0xFFFFFF;
  const organHash = Array.from(result.organField || '')
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xFFFFFF, 0) / 0xFFFFFF;

  return [
    coherence,
    doshaCode,
    nadiCode,
    ...priorityScores.slice(0, 4),
    strengthCount,
    emotionHash,
    organHash,
    Date.now() % 1000000 / 1000000, // scan timestamp fractional
  ];
}

/**
 * Build the full QuantumAnchor from a voice scan result.
 * This is stored in user_active_transmissions alongside the ingredient hashes.
 */
export function buildQuantumAnchor(result: VoiceBiofieldResult): QuantumAnchor {
  return {
    voiceFftFingerprint: computeVoiceFftFingerprint(result),
    anchoredAt: new Date().toISOString(),
    dominantDosha: result.dominantDosha,
    nadiReading: result.nadiReading,
    coherenceScore: result.overallCoherence,
  };
}

/** Case-insensitive substring match against activation id + name */
const MEAT_TERMS =
  /oyster|fish|krill|chicken|beef|pork|egg|gelatin|salmon|cod|anchovy/i;

export function isVegetarianActivation(a: Activation): boolean {
  const hay = `${a.id} ${a.name}`;
  return !MEAT_TERMS.test(hay);
}

export const LS_LIBRARY_UNLOCKED = 'sqi_library_unlocked';
export const LS_LAST_SCAN = 'sqi_last_scan';
export const LS_SCAN_SNAPSHOT = 'sqi_scan_snapshot';

export type ScanSnapshotPayload = Parameters<typeof matchActivationsToScan>[0];

export function voiceResultToScanPayload(result: VoiceBiofieldResult): ScanSnapshotPayload {
  const doshaKey = String(result.dominantDosha || 'Vata').split(/[\s(/]/)[0] || 'Vata';
  const rawNadi = String(result.nadiReading || 'Sushumna');
  let activatedNadi: ScanSnapshotPayload['activatedNadi'] = 'Sushumna';
  if (/Pingala/i.test(rawNadi)) activatedNadi = 'Pingala';
  else if (/Ida/i.test(rawNadi)) activatedNadi = 'Ida';
  else if (/Blocked/i.test(rawNadi)) activatedNadi = 'Blocked';

  return {
    dominantDosha: doshaKey,
    activatedNadi,
    priorityChakra: result.priorityAreas[0]?.name || 'Anahata',
    emotionalField: result.emotionalField,
    organField: result.organField,
    spokenKeywords: result.spokenKeywords ?? [],
  };
}

/** Display category for Top 33 rows */
export function libraryRowCategory(a: Activation): string {
  if (a.type === 'Bioenergetic') return a.category || 'Bioenergetic';
  return a.type;
}

/** 33 descending percentages from 99 → 51 */
export function pctForRank(index: number): number {
  return Math.max(51, Math.round(99 - index * (48 / 32)));
}

/**
 * Rank vegetarian activations: primary order from matchActivationsToScan on full bio library,
 * then pad from ALL_ACTIVATIONS (vegetarian) for a full 33 rows when possible.
 * Pass excludeIds to filter out activations the user already owns.
 */
export function buildTop33Rankings(
  payload: ScanSnapshotPayload,
  maxBioMatches = 600,
  excludeIds: Set<string> = new Set(),
): Array<Activation & { pct: number; rowCategory: string }> {
  const vegAll = ALL_ACTIVATIONS.filter(isVegetarianActivation);

  const matchedBio = matchActivationsToScan(payload, maxBioMatches).map(mapBioLibraryToActivation);
  const seen = new Set<string>();
  const ordered: Activation[] = [];

  for (const a of matchedBio) {
    if (!isVegetarianActivation(a)) continue;
    if (seen.has(a.id)) continue;
    if (excludeIds.has(a.id)) continue;
    seen.add(a.id);
    ordered.push(a);
    if (ordered.length >= 33) break;
  }

  if (ordered.length < 33) {
    for (const a of vegAll) {
      if (seen.has(a.id)) continue;
      if (excludeIds.has(a.id)) continue;
      seen.add(a.id);
      ordered.push(a);
      if (ordered.length >= 33) break;
    }
  }

  return ordered.slice(0, 33).map((a, i) => ({
    ...a,
    pct: pctForRank(i),
    rowCategory: libraryRowCategory(a),
  }));
}

/** Auto-assign expiresAt to legacy transmissions that have activatedAt but no expiresAt.
 * Also removes any transmission that is already expired (daysRemaining < 0).
 * Call this when loading activeTransmissions from Supabase or localStorage. */
export function purgeExpiredAndLegacy(transmissions: Activation[]): Activation[] {
  const now = Date.now();
  return transmissions
    .map((act) => {
      // Legacy item: has activatedAt but no expiresAt — assign expiry retroactively
      if (!act.expiresAt && act.activatedAt) {
        const days = act.type === 'Wellness' ? 21 : 8;
        const activatedMs = new Date(act.activatedAt).getTime();
        if (!Number.isNaN(activatedMs)) {
          const expiresAt = new Date(activatedMs + days * 24 * 60 * 60 * 1000).toISOString();
          return { ...act, expiresAt };
        }
      }
      return act;
    })
    .filter((act) => {
      const days = daysRemaining(act.expiresAt);
      // null = no expiresAt = permanent (manual activations with no activatedAt)
      return days === null || days > 0;
    });
}

export function enrichTransmission(
  act: Activation,
  source: NonNullable<Activation['source']>,
): Activation {
  // Wellness = 21 days, Siddha Transmissions = 8 days, all others = 8 days
  const days = act.type === 'Wellness' ? 21 : 8;
  const activatedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  // Generate deterministic frequency hash for this ingredient (synchronous path)
  // The async SHA-256 version is used when persisting to Supabase
  const frequencyHash = act.frequencyHash || generateFrequencyHashSync(act);

  return {
    ...act,
    activatedAt,
    expiresAt,
    source,
    frequencyHash,
  };
}

export function formatSourceLabel(source?: Activation['source']): string {
  if (source === 'nadi_scan' || source === 'voice_scan') return 'scan';
  if (source === 'manual') return 'manual';
  if (source === 'apothecary_chat') return 'chat';
  return 'manual';
}

/** Returns days remaining — negative means expired and should be auto-removed.
 * Wellness = 21d, Siddha Transmissions = 8d, others = 8d, null = permanent */
export function daysRemaining(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
}
