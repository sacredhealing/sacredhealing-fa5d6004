// ── Ekadashi Calculation Engine ─────────────────────────────────────────────
// Resolves the correct calendar date(s) and Parana (fast-breaking) window for
// every Ekadashi at any location, following the classical Udaya Tithi rule
// (Smarta / householder tradition) and the Suddha Ekadashi / Arunodaya rule
// (Gaudiya Vaishnava tradition — Sri Chaitanya Mahaprabhu's lineage, as
// followed in Bhakti Marga).
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
// PARANA (FAST-BREAKING) WINDOW
// Parana must happen on Dwadashi, after LOCAL SUNRISE of that day, and after
// Hari Vasara ends. Hari Vasara is the first quarter (25%) of the Dwadashi
// tithi immediately following Ekadashi — eating during it is considered to
// spoil the fast's merit, per the Vedic Encyclopedia / Hari-bhakti-vilasa
// definition used here. Parana must also complete before Dwadashi tithi
// itself ends. All three bounds shift with your longitude/latitude (both the
// sunrise clock time AND, occasionally, which civil day counts as the
// "day after"), which is why a Delhi-calculated window is not reliable for
// Uddevalla or anywhere else — this engine computes the window fresh for the
// coordinates it's given.
//
// This computes the full classically-valid window (sunrise + Hari Vasara
// lower bound, Dwadashi-end upper bound). Some panchang sites additionally
// narrow this to a "recommended" sub-window using supplementary muhurta
// rules (e.g. avoiding midday) — this engine deliberately does not attempt
// to replicate those secondary refinements, to avoid presenting borrowed
// precision it can't independently verify. In the rare case the mandatory
// window collapses to zero or negative width (Hari Vasara runs past
// Dwadashi's end — a "Vyanjuli Mahadvadasi" configuration), that's flagged
// rather than guessed at, since it calls for a Trayodashi-day (Gauna) parana
// rule this engine does not implement.
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

const ARUNODAYA_MINUTES = 96;   // ~1h36m before sunrise
const HARI_VASARA_FRACTION = 0.25; // first quarter of Dwadashi tithi

type YMD = { y: number; m: number; d: number };

function addDays(y: number, m: number, d: number, n: number): YMD {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}
function ymdOf(iso: string): YMD {
  const d = new Date(iso);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}
function ymdOfDateStr(s: string): YMD {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}
function fmtYmd(c: YMD): string {
  return `${c.y}-${String(c.m).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`;
}
function sunriseUtc(y: number, m: number, d: number, lat: number, lon: number): Date {
  // Noon UTC seed avoids date-rollover edge cases inside suncalc's algorithm.
  return SunCalc.getTimes(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)), lat, lon).sunrise;
}

export interface ParanaWindow {
  paranaDate: string;         // YYYY-MM-DD — the Dwadashi day, local to this location
  windowStartUtc: string;     // later of (Hari Vasara end, local sunrise)
  windowEndUtc: string;       // Dwadashi tithi ends
  hariVasaraEndUtc: string;
  isEdgeCase: boolean;        // window collapsed (Hari Vasara runs past Dwadashi's end) —
                               // needs a Trayodashi/Gauna parana rule this engine doesn't cover
}

function computeParanaWindow(period: TithiPeriod, observedDate: string, lat: number, lon: number): ParanaWindow {
  const observed = ymdOfDateStr(observedDate);
  const paranaDay = addDays(observed.y, observed.m, observed.d, 1);
  const sunrise = sunriseUtc(paranaDay.y, paranaDay.m, paranaDay.d, lat, lon);

  const tithiEnd = new Date(period.tithiEndUtc);
  const dwadashiEnd = new Date(period.dwadashiEndUtc);
  const dwadashiDurationMs = dwadashiEnd.getTime() - tithiEnd.getTime();
  const hariVasaraEnd = new Date(tithiEnd.getTime() + HARI_VASARA_FRACTION * dwadashiDurationMs);

  const windowStart = new Date(Math.max(hariVasaraEnd.getTime(), sunrise.getTime()));
  const windowEnd = dwadashiEnd;

  return {
    paranaDate: fmtYmd(paranaDay),
    windowStartUtc: windowStart.toISOString(),
    windowEndUtc: windowEnd.toISOString(),
    hariVasaraEndUtc: hariVasaraEnd.toISOString(),
    isEdgeCase: windowStart >= windowEnd,
  };
}

export interface EkadashiResolution {
  name: string;
  paksha: 'Shukla' | 'Krishna';
  smartaDate: string;         // YYYY-MM-DD, householder observance
  vaishnavaDate: string;      // YYYY-MM-DD, Gaudiya Vaishnava observance
  smartaParana: ParanaWindow;
  vaishnavaParana: ParanaWindow;
  isSplit: boolean;           // true when Smarta and Vaishnava dates differ
  isEdgeCase: boolean;        // true when the tithi touches no sunrise/Arunodaya at
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
  const { y: sy, m: sm, d: sd } = ymdOf(period.tithiStartUtc);

  const candidates: { y: number; m: number; d: number; sunrise: Date }[] = [];
  for (let offset = -1; offset <= 2; offset++) {
    const { y, m, d } = addDays(sy, sm, sd, offset);
    candidates.push({ y, m, d, sunrise: sunriseUtc(y, m, d, lat, lon) });
  }

  const touchesSunrise = candidates.filter(c => c.sunrise >= start && c.sunrise <= end);

  let smarta: YMD;
  if (touchesSunrise.length >= 2) {
    // Vriddhi (tithi spans two sunrises): Ekadashi/Purnima/Amavasya use the SECOND day.
    smarta = touchesSunrise[touchesSunrise.length - 1];
  } else if (touchesSunrise.length === 1) {
    smarta = touchesSunrise[0];
  } else {
    // Lost tithi (touches no sunrise) — Tithi-Yukta fallback: the day it begins.
    smarta = { y: sy, m: sm, d: sd };
  }

  let vaishnava: YMD = smarta;
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

  const smartaDate = fmtYmd(smarta);
  const vaishnavaDate = fmtYmd(vaishnava);

  return {
    name,
    paksha: period.paksha,
    smartaDate,
    vaishnavaDate,
    smartaParana: computeParanaWindow(period, smartaDate, lat, lon),
    vaishnavaParana: computeParanaWindow(period, vaishnavaDate, lat, lon),
    isSplit: smartaDate !== vaishnavaDate,
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
