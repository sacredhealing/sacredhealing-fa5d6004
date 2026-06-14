import type { Activation } from './types';
import type { VoiceBiofieldResult } from '@/components/VoiceBiofieldScanner';
import {
  ALL_ACTIVATIONS,
  matchActivationsToScan,
  mapBioLibraryToActivation,
} from './constants';

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

  return {
    ...act,
    activatedAt,
    expiresAt,
    source,
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
