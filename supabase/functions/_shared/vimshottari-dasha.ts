// supabase/functions/_shared/vimshottari-dasha.ts
//
// Real Vimshottari Mahadasha/Antardasha calculation from Moon's exact
// birth longitude — verbatim port of calcVimshottari from
// jyotish-ephemeris/index.ts, not a re-implementation. Built to close a
// real gap: computeFullChartFromBirthData (natal-chart-fallback.ts)
// computes Lagna, planets, yogas, and Ashtakavarga for unlinked student
// profiles, but never computed Dasha — the model was left to freely
// invent Mahadasha/Antardasha periods and exact dates, exactly as before
// any of this session's other fixes, while the surrounding data was now
// genuinely computed. That mismatch (real data next to an invented
// dasha) is worse than a uniformly-ungrounded reading, because the
// invented dates now sit beside real ones and read as equally credible.
//
// Same discipline as every other module in this build: verify against
// the original before use, not just "looks reasonable."

const VIMSHOTTARI = [
  { p: "Ketu", y: 7 }, { p: "Venus", y: 20 }, { p: "Sun", y: 6 },
  { p: "Moon", y: 10 }, { p: "Mars", y: 7 }, { p: "Rahu", y: 18 },
  { p: "Jupiter", y: 16 }, { p: "Saturn", y: 19 }, { p: "Mercury", y: 17 },
] as const;

const NAKSHATRA_LORD: Record<string, string> = {
  Ashwini: "Ketu", Bharani: "Venus", Krittika: "Sun", Rohini: "Moon",
  Mrigashira: "Mars", Ardra: "Rahu", Punarvasu: "Jupiter", Pushya: "Saturn",
  Ashlesha: "Mercury", Magha: "Ketu", "Purva Phalguni": "Venus",
  "Uttara Phalguni": "Sun", Hasta: "Moon", Chitra: "Mars", Swati: "Rahu",
  Vishakha: "Jupiter", Anuradha: "Saturn", Jyeshtha: "Mercury", Mula: "Ketu",
  "Purva Ashadha": "Venus", "Uttara Ashadha": "Sun", Shravana: "Moon",
  Dhanishtha: "Mars", Shatabhisha: "Rahu", "Purva Bhadrapada": "Jupiter",
  "Uttara Bhadrapada": "Saturn", Revati: "Mercury",
};

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
  "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
  "Revati",
];

export interface DashaPeriod {
  planet: string;
  years: number;
  start: string;
  end: string;
  active: boolean;
  antardashas: { planet: string; start: string; end: string; active: boolean }[];
}

/** Given Moon's exact sidereal longitude, returns its nakshatra name and progress through it (0-1). */
export function nakshatraFromMoonLongitude(moonLongitude: number): { nakshatra: string; progressInNak: number } {
  const norm = ((moonLongitude % 360) + 360) % 360;
  const span = 360 / 27; // 13.3333...
  const idx = Math.floor(norm / span);
  const nakDeg = norm % span;
  return { nakshatra: NAKSHATRA_NAMES[idx], progressInNak: nakDeg / span };
}

// Verbatim port of calcVimshottari from jyotish-ephemeris/index.ts.
function calcVimshottari(nakshatra: string, progressInNak: number, birthDateStr: string) {
  const lord = NAKSHATRA_LORD[nakshatra];
  if (!lord || !birthDateStr) return null;
  const MS = 365.25 * 86400 * 1000;
  const startIdx = VIMSHOTTARI.findIndex((d) => d.p === lord);
  if (startIdx < 0) return null;
  const elapsedAtBirth = progressInNak * VIMSHOTTARI[startIdx].y;
  let cursor = new Date(birthDateStr).getTime() - elapsedAtBirth * MS;
  const now = Date.now();
  const dashaTree: DashaPeriod[] = [];

  for (let i = 0; i < 9; i++) {
    const maha = VIMSHOTTARI[(startIdx + i) % 9];
    const mahaStart = cursor;
    const mahaEnd = cursor + maha.y * MS;
    const antardashas: DashaPeriod["antardashas"] = [];
    let sub = mahaStart;
    for (let j = 0; j < 9; j++) {
      const antar = VIMSHOTTARI[(startIdx + i + j) % 9];
      const subYears = (maha.y * antar.y) / 120;
      const subEnd = sub + subYears * MS;
      antardashas.push({
        planet: antar.p,
        start: new Date(sub).toISOString().split("T")[0],
        end: new Date(subEnd).toISOString().split("T")[0],
        active: sub <= now && now < subEnd,
      });
      sub = subEnd;
    }
    dashaTree.push({
      planet: maha.p, years: maha.y,
      start: new Date(mahaStart).toISOString().split("T")[0],
      end: new Date(mahaEnd).toISOString().split("T")[0],
      active: mahaStart <= now && now < mahaEnd,
      antardashas,
    });
    cursor = mahaEnd;
  }

  const activeMaha = dashaTree.find((d) => d.active) ?? null;
  const activeAntar = activeMaha?.antardashas.find((a) => a.active) ?? null;
  return { dashaTree, activeMaha, activeAntar };
}

export interface ActiveDasha {
  mahadasha: string; mahadashaStart: string; mahadashaEnd: string;
  antardasha: string | null; antardashaStart: string | null; antardashaEnd: string | null;
}

/** Computes the currently active Mahadasha/Antardasha from Moon's exact birth longitude and birth date. */
export function computeActiveDasha(moonLongitude: number, birthDate: string): ActiveDasha | null {
  try {
    const { nakshatra, progressInNak } = nakshatraFromMoonLongitude(moonLongitude);
    const result = calcVimshottari(nakshatra, progressInNak, birthDate);
    if (!result?.activeMaha) return null;
    return {
      mahadasha: result.activeMaha.planet,
      mahadashaStart: result.activeMaha.start,
      mahadashaEnd: result.activeMaha.end,
      antardasha: result.activeAntar?.planet ?? null,
      antardashaStart: result.activeAntar?.start ?? null,
      antardashaEnd: result.activeAntar?.end ?? null,
    };
  } catch (e) {
    console.error('computeActiveDasha error:', e);
    return null;
  }
}
