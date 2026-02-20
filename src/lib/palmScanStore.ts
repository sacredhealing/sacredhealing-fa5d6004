/**
 * Palm scan result store — syncs with Bhrigu Remedy / Mantras (e.g. Heart Line Leak → Anahata highlight).
 */

const STORAGE_KEY = 'sh:palmScan';

export interface VataPittaKapha {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface PalmScanResult {
  /** When the scan was completed (ISO string) */
  scannedAt: string;
  /** Heart line shows karmic leak → recommend 432Hz Heart-Healing (Anahata) Mantra */
  heartLineLeak: boolean;
  /** Dosha balance from hand texture/color (0–100 each, normalized) */
  vataPittaKapha: VataPittaKapha;
  /** Seed used for deterministic analysis */
  seed?: string;
}

export function getPalmScanResult(): PalmScanResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PalmScanResult;
  } catch {
    return null;
  }
}

export function setPalmScanResult(result: PalmScanResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // ignore quota
  }
}

export function clearPalmScanResult(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
