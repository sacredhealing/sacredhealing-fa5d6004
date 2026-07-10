// ── Ekadashi Calculation Engine ─────────────────────────────────────────────
// Resolves the correct calendar date(s) for every Ekadashi at any location,
// following the classical Udaya Tithi rule (Smarta / householder tradition)
// and the Suddha Ekadashi / Arunodaya rule (Gaudiya Vaishnava tradition —
// Sri Chaitanya Mahaprabhu's lineage, as followed in Bhakti Marga).
//
// WHY TWO DATES CAN DIFFER
// A tithi (lunar day) is defined by a fixed 12° step in Moon–Sun angular
// separation, NOT a fixed 24h span — it varies ~21–26h depending on orbital
// speed. Because it drifts out of phase with the solar (sunrise-to-sunrise)
// day, which ritual day a tithi "belongs to" has to be assigned by rule
// rather than read off a clock:
//
//   • Smarta rule (Udaya Tithi): whichever tithi is present at LOCAL SUNRISE
//     governs that day. If Ekadashi touches no sunrise at all in a given
//     cycle (a "lost" tithi), the Tithi-Yukta fallback is used: the day the
//     tithi begins.
//   • Vaishnava rule (Suddha Ekadashi): Ekadashi must already be the active
//     tithi by ARUNODAYA — the pre-dawn window ~96 minutes before sunrise —
//     to avoid any contact with the preceding Dashami tithi ("Dashami
//     Vedha"). The Vaishnava day is the earliest day whose Arunodaya falls
//     inside the Ekadashi tithi window. It is never earlier than Smarta's.
//
// Tithi boundaries are location-independent (pure geocentric angle), so the
// precomputed EKADASHI_TITHI_TABLE (UTC timestamps, verified against Drik
// Panchang to within ~2 minutes — see scripts/generate-ekadashi-table.py) is
// combined here with a precise per-location sunrise (via `suncalc`, a
// standard NOAA-based solar position library).

import * as SunCalc from 'suncalc';
import { EKADASHI_TITHI_TABLE, TithiPeriod } from '@/data/ekadashiTithiTable';

const EKADASHI_NAMES: string[] = [
  'Shattila Ekadashi', 'Jaya Ekadashi', 'Vijaya Ekadashi', 'Amalaki Ekadashi',
  'Papmochani Ekadashi', 'Kamada Ekadashi', 'Varuthini Ekadashi', 'Mohini Ekadashi',
  'Apara Ekadashi', 'Nirjala Ekadashi', 'Yogini Ekadashi', 'Devshayani Ekadashi',
  'Kamika Ekadashi', 'Shravana Putrada Ekadashi', 'Aja Ekadashi', 'Parsva Ekadashi',
  'Indira Ekadashi', 'Papankusha Ekadashi', 'Rama Ekadashi', 'Devutthana Ekadashi',
  'Utpanna Ekadashi', 'Mokshada Ekadashi', 'Saphala Ekadashi', 'Putrada Ekadashi',
];

const ARUNODAYA_MINUTES = 96; // ~1h36m before sunrise

function addDays(y: number, m: number, d: number, n: number): [number, number, number] {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
}
function ymdOf(iso: string): [number, number, number] {
  const d = new Date(iso);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}
function sunriseUtc(y: number, m: number, d: number, lat: number, lon: number): Date {
  // Noon UTC seed avoids date-rollover edge cases inside suncalc's algorithm.
  return SunCalc.getTimes(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)), lat, lon).sunrise;
}

export interface EkadashiResolution {
  name: string;
  paksha: 'Shukla' | 'Krishna';
  smartaDate: string;     // YYYY-MM-DD, householder observance
  vaishnavaDate: string;  // YYYY-MM-DD, Gaudiya Vaishnava observance
  paranaStartUtc: string; // Dwadashi begins — earliest safe fast-breaking moment
  paranaEndUtc: string;   // Dwadashi ends
  isSplit: boolean;       // true when Smarta and Vaishnava dates differ
  isEdgeCase: boolean;    // true when the tithi touches no sunrise/Arunodaya at
                          // this location at all (classical "lost tithi" /
                          // Mahadvadasi territory) — rare, flagged rather than
                          // silently guessed. Recommend checking a local panchang.
}

export function resolveEkadashi(
  period: TithiPeriod,
  lat: number,
  lon: number,
  name: string
): EkadashiResolution {
  const start = new Date(period.tithiStartUtc);
  const end = new Date(period.tithiEndUtc);
  const [sy, sm, sd] = ymdOf(period.tithiStartUtc);

  const candidates: { y: number; m: number; d: number; sunrise: Date }[] = [];
  for (let offset = -1; offset <= 2; offset++) {
    const [y, m, d] = addDays(sy, sm, sd, offset);
    candidates.push({ y, m, d, sunrise: sunriseUtc(y, m, d, lat, lon) });
  }

  const touchesSunrise = candidates.filter(c => c.sunrise >= start && c.sunrise <= end);

  let smarta: { y: number; m: number; d: number };
  if (touchesSunrise.length >= 2) {
    // Vriddhi (tithi spans two sunrises): Ekadashi/Purnima/Amavasya use the SECOND day.
    smarta = touchesSunrise[touchesSunrise.length - 1];
  } else if (touchesSunrise.length === 1) {
    smarta = touchesSunrise[0];
  } else {
    // Lost tithi (touches no sunrise) — Tithi-Yukta fallback: the day it begins.
    smarta = { y: sy, m: sm, d: sd };
  }

  let vaishnava = smarta;
  let arunodayaMatched = false;
  for (const c of candidates) {
    const arunodaya = new Date(c.sunrise.getTime() - ARUNODAYA_MINUTES * 60000);
    if (arunodaya >= start && arunodaya <= end) {
      vaishnava = { y: c.y, m: c.m, d: c.d };
      arunodayaMatched = true;
      break;
    }
  }
  // Safety clamp: Vaishnava observance is never earlier than Smarta's.
  const smartaTime = Date.UTC(smarta.y, smarta.m - 1, smarta.d);
  const vaishnavaTime = Date.UTC(vaishnava.y, vaishnava.m - 1, vaishnava.d);
  if (vaishnavaTime < smartaTime) vaishnava = smarta;

  const fmt = (c: { y: number; m: number; d: number }) =>
    `${c.y}-${String(c.m).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`;

  return {
    name,
    paksha: period.paksha,
    smartaDate: fmt(smarta),
    vaishnavaDate: fmt(vaishnava),
    paranaStartUtc: period.tithiEndUtc,
    paranaEndUtc: period.dwadashiEndUtc,
    isSplit: fmt(smarta) !== fmt(vaishnava),
    isEdgeCase: touchesSunrise.length === 0 && !arunodayaMatched,
  };
}

export function getUpcomingEkadashis(
  lat: number,
  lon: number,
  fromDate: Date = new Date(),
  count = 6
): EkadashiResolution[] {
  const results: EkadashiResolution[] = [];
  const cutoff = new Date(fromDate.getTime() - 3 * 86400000); // 3-day lookback so "today"/"tomorrow" still resolve
  let nameIdx = 0;
  for (const period of EKADASHI_TITHI_TABLE) {
    if (new Date(period.tithiEndUtc) < cutoff) { nameIdx++; continue; }
    const name = EKADASHI_NAMES[nameIdx % EKADASHI_NAMES.length];
    nameIdx++;
    results.push(resolveEkadashi(period, lat, lon, name));
    if (results.length >= count) break;
  }
  return results;
}
