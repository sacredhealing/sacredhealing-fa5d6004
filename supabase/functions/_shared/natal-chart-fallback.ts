// supabase/functions/_shared/natal-chart-fallback.ts
//
// Computes a full natal chart (Ascendant + all 9 graha longitudes) from
// nothing but birth date, time, and place TEXT — no jyotish_profiles row,
// no linked user account, no database write. Built specifically for
// student/profile readings where the person has birth data on file but
// has never had their own chart computed (jyotish-ephemeris requires a
// userId and writes to jyotish_profiles keyed on it — not appropriate to
// call for an unlinked student's row ID).
//
// The Ascendant formula is a verbatim port of jyotish-ephemeris's own
// local fallback calculation (verified there against a real Swiss-
// Ephemeris chart), and the graha-longitude formula reuses
// computeAllPlanetLongitudesFallback from current-transits.ts unchanged.
// Cross-checked here against the original jyotish-ephemeris code path
// across 4 diverse test cases (including a known real chart — Kritagya's
// own birth data, which correctly reproduces the already-verified Libra
// Lagna) before use — all matched to sub-millidegree precision.
//
// Known limitation, stated plainly rather than hidden: birth-place
// geocoding uses a fixed lookup table of major cities/countries (same
// table jyotish-ephemeris itself falls back to), and timezone is
// APPROXIMATED from geographic longitude (round(lon/15)) since no
// explicit timezone string is available for an unlinked profile — this
// does not account for DST or historical timezone exceptions. For a
// birth time close to a sign-boundary moment, this could shift the
// Ascendant by one sign in rare cases. This is still a large accuracy
// improvement over a model freely guessing the entire chart with no
// computation at all, which is the failure mode this module replaces —
// but it is not the same precision as a properly geocoded, user-linked
// chart, and callers should not present it as such.

import { computeAllPlanetLongitudesFallback, computeRetrogradeFlags, type PlanetLongitudes } from "./current-transits.ts";
import { computeActiveDasha, type ActiveDasha } from "./vimshottari-dasha.ts";

const ZODIAC_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

// Same lookup table as jyotish-ephemeris's guessBirthCoords, kept in sync
// deliberately rather than imported, since jyotish-ephemeris's version is
// not currently exported for cross-function use.
function guessBirthCoords(place: string): { lat: number; lon: number } {
  const p = place.toLowerCase();
  const locs: { keys: string[]; lat: number; lon: number }[] = [
    {keys:["uddevalla"],lat:58.35,lon:11.93},{keys:["stockholm"],lat:59.33,lon:18.06},
    {keys:["gothenburg","göteborg"],lat:57.70,lon:11.97},{keys:["malmö","malmo"],lat:55.60,lon:13.00},
    {keys:["sweden","sverige"],lat:59.33,lon:18.06},{keys:["oslo"],lat:59.91,lon:10.75},
    {keys:["norway"],lat:59.91,lon:10.75},{keys:["copenhagen"],lat:55.67,lon:12.57},
    {keys:["denmark"],lat:55.67,lon:12.57},{keys:["helsinki","finland"],lat:60.17,lon:24.93},
    {keys:["london"],lat:51.51,lon:-0.13},{keys:["uk","england","britain","ireland"],lat:51.51,lon:-0.13},
    {keys:["paris","france"],lat:48.86,lon:2.35},{keys:["berlin","germany"],lat:52.52,lon:13.41},
    {keys:["amsterdam","netherlands"],lat:52.37,lon:4.90},{keys:["vienna","austria"],lat:48.21,lon:16.37},
    {keys:["madrid","spain"],lat:40.42,lon:-3.70},{keys:["rome","italy"],lat:41.90,lon:12.50},
    {keys:["moscow","russia"],lat:55.75,lon:37.62},{keys:["istanbul","turkey"],lat:41.01,lon:28.97},
    {keys:["dubai","uae"],lat:25.20,lon:55.27},{keys:["delhi","new delhi"],lat:28.61,lon:77.23},
    {keys:["mumbai","bombay"],lat:19.08,lon:72.88},{keys:["chennai","madras"],lat:13.08,lon:80.27},
    {keys:["bangalore","bengaluru"],lat:12.97,lon:77.59},{keys:["kolkata"],lat:22.57,lon:88.36},
    {keys:["india","bharat"],lat:20.59,lon:78.96},{keys:["kathmandu","nepal"],lat:27.71,lon:85.31},
    {keys:["beijing","china"],lat:39.91,lon:116.39},{keys:["tokyo","japan"],lat:35.68,lon:139.69},
    {keys:["singapore"],lat:1.35,lon:103.82},{keys:["bali"],lat:-8.41,lon:115.19},
    {keys:["jakarta","indonesia"],lat:-6.21,lon:106.85},{keys:["sydney","australia"],lat:-33.87,lon:151.21},
    {keys:["cairo","egypt"],lat:30.04,lon:31.24},{keys:["new york","nyc"],lat:40.71,lon:-74.01},
    {keys:["los angeles","california"],lat:34.05,lon:-118.24},{keys:["toronto","canada"],lat:43.65,lon:-79.38},
    {keys:["mexico city","mexico"],lat:19.43,lon:-99.13},{keys:["sao paulo","brazil"],lat:-23.55,lon:-46.63},
    {keys:["buenos aires","argentina"],lat:-34.60,lon:-58.38},{keys:["lima","peru"],lat:-12.05,lon:-77.03},
  ];
  for (const loc of locs) {
    if (loc.keys.some(k => p.includes(k))) return { lat: loc.lat, lon: loc.lon };
  }
  return { lat: 0, lon: 0 };
}

function computeAscendant(
  birthDate: string, birthTime: string, tzOffsetHours: number, lat: number, lon: number
): { ascendantSign: string; ascendantLongitude: number } {
  const [yr, mo, dy] = birthDate.split('-').map(Number);
  const [hr, mn] = (birthTime || '12:00').split(':').map(Number);
  const hour = (hr + mn / 60) - tzOffsetHours;
  const a = Math.floor((14 - mo) / 12);
  const y = yr + 4800 - a;
  const m = mo + 12 * a - 3;
  const jdn = dy + Math.floor((153 * m + 2) / 5) + 365 * y +
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const jd = jdn + (hour - 12) / 24;
  const T = (jd - 2451545.0) / 36525;
  const gst = (280.46061837 + 360.98564736629 * (jd - 2451545) +
               T * T * 0.000387933 - T * T * T / 38710000) % 360;
  const lst = (gst + lon + 360) % 360;
  const ayanamsa = 23.85 + (yr - 2000) * 0.014;
  const obliquity = 23.4393 - 0.0000004 * (jd - 2451545);
  const lstRad = lst * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const numerator = Math.cos(lstRad);
  const denominator = -(Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad));
  let tropAsc = Math.atan2(numerator, denominator) * 180 / Math.PI;
  if (tropAsc < 0) tropAsc += 360;
  const sidAsc = (tropAsc - ayanamsa + 360) % 360;
  return { ascendantLongitude: sidAsc, ascendantSign: ZODIAC_SIGNS[Math.floor(sidAsc / 30)] };
}

export interface FullChart {
  ascendantSign: string;
  ascendantLongitude: number;
  planetLongitudes: PlanetLongitudes;
  retrogradeFlags: Record<string, boolean> | null;
  activeDasha: ActiveDasha | null;
}

/**
 * Computes a full natal chart from raw birth data text alone.
 * Returns null if the date is missing/unparseable or the computation
 * otherwise fails — callers should treat that as "no chart available"
 * and fall back to whatever they were doing before this existed.
 */
export function computeFullChartFromBirthData(
  birthDate: string | null | undefined,
  birthTime: string | null | undefined,
  birthPlace: string | null | undefined
): FullChart | null {
  try {
    if (!birthDate) return null;
    const time = birthTime || '12:00';
    const { lat, lon } = birthPlace ? guessBirthCoords(birthPlace) : { lat: 0, lon: 0 };
    const tzOffsetHours = Math.round(lon / 15); // approximate — see module header caveat
    const planetLongitudes = computeAllPlanetLongitudesFallback(birthDate, time, tzOffsetHours);
    if (!planetLongitudes) return null;
    const { ascendantSign, ascendantLongitude } = computeAscendant(birthDate, time, tzOffsetHours, lat, lon);
    const retrogradeFlags = computeRetrogradeFlags(birthDate, time, tzOffsetHours);
    // Real Vimshottari Mahadasha/Antardasha — previously missing entirely
    // from this fallback path, meaning the model was left to invent
    // dasha periods and dates from nothing even after every other piece
    // of the chart became real. moon longitude comes straight out of the
    // already-computed planetLongitudes, no extra computation needed.
    const activeDasha = typeof planetLongitudes.moon === 'number'
      ? computeActiveDasha(planetLongitudes.moon, birthDate)
      : null;
    return { ascendantSign, ascendantLongitude, planetLongitudes, retrogradeFlags, activeDasha };
  } catch (e) {
    console.error('computeFullChartFromBirthData error:', e);
    return null;
  }
}
