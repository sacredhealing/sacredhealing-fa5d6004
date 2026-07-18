// supabase/functions/_shared/current-transits.ts
// Computes TODAY's (or any given date's) planetary sidereal longitudes —
// for transit (Gochar) analysis, as opposed to birth-time positions.
//
// This is a verbatim copy of the planetary-position math from
// jyotish-ephemeris/index.ts (computeMoonLongitudeFallback,
// heliocentricXYZ, geocentricTropicalLongitude, computeAllPlanetLongitudesFallback),
// duplicated here rather than refactored into a cross-function import of
// jyotish-ephemeris itself, to avoid touching that function's working,
// already-verified birth-chart code path. Do not hand-edit the orbital
// mechanics below independently of the source — if the source is
// corrected, mirror the fix here too, or the two will silently diverge.
//
// Per jyotish-ephemeris's own comments: "Real low-precision planetary
// positions (JPL/Standish approximate Keplerian elements, valid
// ~1800-2050, ~1 arcminute accuracy for the outer planets). Verified
// against a real Swiss Ephemeris chart: every planet lands in the
// correct sign, typically within 0.2-0.3°."

export interface PlanetLongitudes {
  sun?: number; moon?: number; mars?: number; mercury?: number;
  jupiter?: number; venus?: number; saturn?: number; rahu?: number; ketu?: number;
}

function computeMoonLongitudeFallback(birthDate: string, birthTime: string, utcOffsetHours: number): number | null {
  try {
    const [yr, mo, dy] = birthDate.split('-').map(Number);
    const [hr, mn] = (birthTime || '12:00').split(':').map(Number);
    const utcHour = (hr + mn / 60) - utcOffsetHours;
    const a = Math.floor((14 - mo) / 12);
    const y = yr + 4800 - a;
    const m = mo + 12 * a - 3;
    const jdn = dy + Math.floor((153 * m + 2) / 5) + 365 * y +
                Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jd = jdn + (utcHour - 12) / 24;
    const D = jd - 2451545.0;

    const norm360 = (x: number) => ((x % 360) + 360) % 360;
    const toRad = (d: number) => d * Math.PI / 180;

    const L = norm360(218.316 + 13.176396 * D);
    const M = norm360(134.963 + 13.064993 * D);
    const Msun = norm360(357.529 + 0.98560028 * D);
    const Lsun = norm360(280.460 + 0.9856474 * D);
    const Delong = norm360(L - Lsun);

    const lon = L
      + 6.289 * Math.sin(toRad(M))
      + 1.274 * Math.sin(toRad(2 * Delong - M))
      + 0.658 * Math.sin(toRad(2 * Delong))
      - 0.186 * Math.sin(toRad(Msun))
      - 0.059 * Math.sin(toRad(2 * M - 2 * Delong))
      - 0.057 * Math.sin(toRad(M - 2 * Delong + Msun))
      + 0.053 * Math.sin(toRad(M + 2 * Delong))
      + 0.046 * Math.sin(toRad(2 * Delong - Msun))
      + 0.041 * Math.sin(toRad(M - Msun))
      - 0.035 * Math.sin(toRad(Delong))
      - 0.031 * Math.sin(toRad(M + Msun));

    const ayanamsa = 23.85 + (yr - 2000) * 0.014;
    return norm360(lon - ayanamsa);
  } catch {
    return null;
  }
}

type PlanetElementKey = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn';
const ORBITAL_ELEMENTS: Record<PlanetElementKey, { a: [number, number]; e: [number, number]; I: [number, number]; L: [number, number]; lp: [number, number]; ln: [number, number] }> = {
  mercury: { a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.25032350, 149472.67411175], lp: [77.45779628, 0.16047689], ln: [48.33076593, -0.12534081] },
  venus:   { a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], I: [3.39467605, -0.00078890], L: [181.97909950, 58517.81538729], lp: [131.60246718, 0.00268329], ln: [76.67984255, -0.27769418] },
  earth:   { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], lp: [102.93768193, 0.32327364], ln: [0.0, 0.0] },
  mars:    { a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], lp: [-23.94362959, 0.44441088], ln: [49.55953891, -0.29257343] },
  jupiter: { a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], lp: [14.72847983, 0.21252668], ln: [100.47390909, 0.20469106] },
  saturn:  { a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], lp: [92.59887831, -0.41897216], ln: [113.66242448, -0.28867794] },
};

function heliocentricXYZ(planet: PlanetElementKey, T: number): { x: number; y: number; z: number } {
  const el = ORBITAL_ELEMENTS[planet];
  const norm360 = (x: number) => ((x % 360) + 360) % 360;
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;

  const a = el.a[0] + el.a[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const I = el.I[0] + el.I[1] * T;
  const L = el.L[0] + el.L[1] * T;
  const lp = el.lp[0] + el.lp[1] * T;
  const ln = el.ln[0] + el.ln[1] * T;
  const w = lp - ln;
  let M = norm360(L - lp);
  if (M > 180) M -= 360;

  const eStarDeg = toDeg(e);
  let E = M + eStarDeg * Math.sin(toRad(M));
  for (let i = 0; i < 10; i++) {
    const dE = (M - (E - eStarDeg * Math.sin(toRad(E)))) / (1 - e * Math.cos(toRad(E)));
    E += dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  const Erad = toRad(E);
  const xp = a * (Math.cos(Erad) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(Erad);
  const wRad = toRad(w), lnRad = toRad(ln), IRad = toRad(I);
  const x = (Math.cos(wRad) * Math.cos(lnRad) - Math.sin(wRad) * Math.sin(lnRad) * Math.cos(IRad)) * xp
          + (-Math.sin(wRad) * Math.cos(lnRad) - Math.cos(wRad) * Math.sin(lnRad) * Math.cos(IRad)) * yp;
  const y = (Math.cos(wRad) * Math.sin(lnRad) + Math.sin(wRad) * Math.cos(lnRad) * Math.cos(IRad)) * xp
          + (-Math.sin(wRad) * Math.sin(lnRad) + Math.cos(wRad) * Math.cos(lnRad) * Math.cos(IRad)) * yp;
  const z = (Math.sin(wRad) * Math.sin(IRad)) * xp + (Math.cos(wRad) * Math.sin(IRad)) * yp;
  return { x, y, z };
}

function geocentricTropicalLongitude(planet: 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn', T: number): number {
  const p = heliocentricXYZ(planet, T);
  const earth = heliocentricXYZ('earth', T);
  const x = p.x - earth.x, y = p.y - earth.y;
  return ((Math.atan2(y, x) * 180 / Math.PI) % 360 + 360) % 360;
}

/** Computes real sidereal longitudes for all 9 grahas for any given date/time (UTC offset 0 = treat the time as UTC directly, which is what current-transit callers want). */
export function computeAllPlanetLongitudesFallback(
  birthDate: string, birthTime: string, utcOffsetHours: number
): PlanetLongitudes | null {
  try {
    const [yr, mo, dy] = birthDate.split('-').map(Number);
    const [hr, mn] = (birthTime || '12:00').split(':').map(Number);
    const utcHour = (hr + mn / 60) - utcOffsetHours;
    const a = Math.floor((14 - mo) / 12);
    const y = yr + 4800 - a;
    const m = mo + 12 * a - 3;
    const jdn = dy + Math.floor((153 * m + 2) / 5) + 365 * y +
                Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jd = jdn + (utcHour - 12) / 24;
    const T = (jd - 2451545.0) / 36525;
    const D = jd - 2451545.0;

    const norm360 = (x: number) => ((x % 360) + 360) % 360;
    const toRad = (d: number) => d * Math.PI / 180;
    const ayanamsa = 23.85 + (yr - 2000) * 0.014;
    const sid = (tropical: number) => norm360(tropical - ayanamsa);

    const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const Msun = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(toRad(Msun))
      + (0.019993 - 0.000101 * T) * Math.sin(toRad(2 * Msun))
      + 0.000289 * Math.sin(toRad(3 * Msun));
    const sunTropical = norm360(L0 + C);

    const moonLon = computeMoonLongitudeFallback(birthDate, birthTime, utcOffsetHours);

    const Lmoon = norm360(218.316 + 13.176396 * D);
    const Mmoon = norm360(134.963 + 13.064993 * D);
    const F = norm360(93.272 + 13.229350 * D);
    const Lsun = norm360(280.460 + 0.9856474 * D);
    const Delong = norm360(Lmoon - Lsun);
    const rahuMean = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
    const nodeCorrection =
      -1.4979 * Math.sin(toRad(2 * Delong - 2 * F))
      - 0.1500 * Math.sin(toRad(Msun))
      - 0.1226 * Math.sin(toRad(2 * Delong))
      + 0.1176 * Math.sin(toRad(2 * F))
      - 0.0801 * Math.sin(toRad(2 * Mmoon - 2 * Delong));
    const rahuTropical = norm360(rahuMean + nodeCorrection);
    const ketuTropical = norm360(rahuTropical + 180);

    return {
      sun: sid(sunTropical),
      moon: moonLon != null ? moonLon : undefined,
      mars: sid(geocentricTropicalLongitude('mars', T)),
      mercury: sid(geocentricTropicalLongitude('mercury', T)),
      jupiter: sid(geocentricTropicalLongitude('jupiter', T)),
      venus: sid(geocentricTropicalLongitude('venus', T)),
      saturn: sid(geocentricTropicalLongitude('saturn', T)),
      rahu: sid(rahuTropical),
      ketu: sid(ketuTropical),
    };
  } catch (e) {
    console.error('computeAllPlanetLongitudesFallback (current-transits) error:', e);
    return null;
  }
}

/** Convenience: today's planetary longitudes at the current UTC moment. */
export function computeCurrentTransitLongitudes(): PlanetLongitudes | null {
  const now = new Date();
  const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  return computeAllPlanetLongitudesFallback(dateStr, timeStr, 0);
}

// Retrograde detection — verbatim port of computeRetrogradeFlags from
// jyotish-ephemeris/index.ts (same function, same discipline as
// computeAllPlanetLongitudesFallback above: mirror any fix there, don't
// let the two copies drift). Samples the same fallback formula one day
// apart and checks the sign of daily motion; safe even when the primary
// chart came from a higher-precision source, since only the direction of
// motion is used, not the fallback's absolute position.
export function computeRetrogradeFlags(
  birthDate: string, birthTime: string, utcOffsetHours: number
): Record<string, boolean> | null {
  try {
    const day0 = computeAllPlanetLongitudesFallback(birthDate, birthTime, utcOffsetHours);
    if (!day0) return null;
    const [yr, mo, dy] = birthDate.split('-').map(Number);
    const next = new Date(Date.UTC(yr, mo - 1, dy + 1));
    const nextDateStr = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
    const day1 = computeAllPlanetLongitudesFallback(nextDateStr, birthTime, utcOffsetHours);
    if (!day1) return null;

    const flags: Record<string, boolean> = { rahu: true, ketu: true };
    for (const planet of ['mars', 'mercury', 'jupiter', 'venus', 'saturn'] as const) {
      const l0 = day0[planet], l1 = day1[planet];
      if (l0 == null || l1 == null) continue;
      let diff = l1 - l0;
      diff = ((diff + 180) % 360 + 360) % 360 - 180;
      flags[planet] = diff < 0;
    }
    return flags;
  } catch (e) {
    console.error('computeRetrogradeFlags error:', e);
    return null;
  }
}

// Transit (Gochar) + Sade Sati block — verbatim port of the logic used in
// bhrigu-oracle/index.ts, extracted here so ayurveda-chat and
// quantum-apothecary-chat can produce the identical block rather than a
// re-implementation that could quietly drift from it.
export function buildTransitAndSadeSatiBlock(
  lagnaSign: string | null | undefined,
  natalMoonLongitude: number | null | undefined
): string {
  const TRANSIT_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const signIdxFromLon = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
  const transitLons = computeCurrentTransitLongitudes();
  const lagnaSignIdx = lagnaSign ? TRANSIT_SIGNS.findIndex(s => s.toLowerCase() === lagnaSign.toLowerCase()) : -1;
  if (!transitLons || lagnaSignIdx === -1) return '';

  const lines: string[] = [];
  const order = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;
  for (const p of order) {
    const lon = transitLons[p];
    if (lon == null) continue;
    const signIdx = signIdxFromLon(lon);
    const house = ((signIdx - lagnaSignIdx + 12) % 12) + 1;
    lines.push(`${p.charAt(0).toUpperCase() + p.slice(1)}: transiting ${TRANSIT_SIGNS[signIdx]}, natal House ${house}`);
  }
  let sadeSatiLine = '';
  if (natalMoonLongitude != null && transitLons.saturn != null) {
    const moonSignIdx = signIdxFromLon(natalMoonLongitude);
    const saturnSignIdx = signIdxFromLon(transitLons.saturn);
    const houseFromMoon = ((saturnSignIdx - moonSignIdx + 12) % 12) + 1;
    if (houseFromMoon === 12 || houseFromMoon === 1 || houseFromMoon === 2) {
      const phase = houseFromMoon === 12 ? 'first phase (rising — House 12 from natal Moon)'
        : houseFromMoon === 1 ? 'peak phase (Saturn transiting the natal Moon sign itself — House 1 from Moon)'
        : 'final phase (setting — House 2 from natal Moon)';
      sadeSatiLine = `Sade Sati: ACTIVE — Saturn is transiting the ${phase}.`;
    } else {
      sadeSatiLine = 'Sade Sati: not currently active (Saturn is not within one sign of natal Moon).';
    }
  }
  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `── CURRENT TRANSITS (GOCHAR) — as of ${dateLabel} ──\n${lines.join('\n')}\n${sadeSatiLine}`;
}

