// supabase/functions/_shared/jyotish-deep-analysis.ts
//
// Shared deep-Jyotish analysis engine — house lordship, Jaimini Chara
// Karakas, Bhrigu Bindu, doshas (Mangal/Kaal Sarp), yogas (Raja/Dhana/
// Gajakesari/Kemadruma/Vipareeta Raja/Pancha Mahapurusha), Ashtakavarga,
// divisional charts (D9 Navamsa, D10 Dasamsa, D7 Saptamsa, D60
// Shashtiamsa), and Upapada Lagna.
//
// This is a VERBATIM extraction of buildChartAnalysisBlock from
// src/components/vedic/BhriguAkashaChat.tsx (only renamed for export),
// not a re-implementation — every formula here was individually unit-
// tested and cross-verified against classical worked examples during
// that build (see that file's git history for the verification trail:
// Ashtakavarga against B.V. Raman's published tables and checksums,
// divisional-chart formulas against hand-worked classical examples,
// Upapada Lagna against multiple independently-sourced worked examples).
// If a bug is found here, the same bug exists in BhriguAkashaChat.tsx —
// fix both, or better, extract BhriguAkashaChat.tsx's own copy to import
// from here instead, to stop the duplication going forward.
//
// Deliberately duplicated (not cross-imported) into this shared module so
// it can be called directly from server-side Deno edge functions
// (ayurveda-chat, quantum-apothecary-chat) without requiring those
// functions to depend on frontend TSX code.

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
] as const;

const GRAHA_ORDER = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;

// Classical rashi (sign) lordship — traditional 7-planet rulership, no
// outer planets, matching the rest of this system's Parashari conventions.
// Index-aligned with ZODIAC_SIGNS.
const SIGN_LORDS = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];

const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];
const DUSTHANA_HOUSES = [6, 8, 12];
const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

// Jaimini Chara Karaka labels, highest-degree-in-sign to lowest. Classical
// 7-karaka scheme (7 non-nodal planets only) — the 8-karaka variant that
// adds Rahu with a reversed-degree rule is a distinct, disputed convention
// and deliberately not used here.
const KARAKA_LABELS = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka', 'Matrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka'];
const KARAKA_MEANING: Record<string, string> = {
  Atmakaraka: 'self / soul\'s core drive', Amatyakaraka: 'career / mind',
  Bhratrikaraka: 'siblings / courage', Matrikaraka: 'mother / emotional foundation',
  Putrakaraka: 'children / intelligence', Gnatikaraka: 'obstacles / extended family',
  Darakaraka: 'spouse / partnerships',
};

const PANCHA_MAHAPURUSHA_NAMES: Record<string, string> = {
  mars: 'Ruchaka', mercury: 'Bhadra', jupiter: 'Hamsa', venus: 'Malavya', saturn: 'Sasa',
};

// Ashtakavarga (BPHS Ch. 66) benefic-places table — sourced to B.V. Raman's
// "Ashtakavarga System of Prediction", Ch. II. Verified three independent
// ways before use: (1) every planet's 8-contributor total matches its known
// constant (Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52,
// Saturn 39 — summing to 337), (2) the algorithm below reproduces the
// source's own fully worked example (B.V. Raman's Standard Horoscope) for
// both Sun's and Moon's complete 12-sign Bhinnashtakavarga exactly, and
// (3) the resulting Sarvashtakavarga (sum of all seven) matches the
// source's published 337-point grand chart sign-by-sign, exactly. This is
// classical fixed data with no formula to derive it from, so this level of
// cross-verification against a named, checkable source is what makes it
// safe to hardcode — unlike an unverified table, an error here would not
// be silent.
const ASHTAKAVARGA_TABLE: Record<string, Record<string, number[]>> = {
  sun:     { sun:[1,2,4,7,8,9,10,11], moon:[3,6,10,11], mars:[1,2,4,7,8,9,10,11], mercury:[3,5,6,9,10,11,12], jupiter:[5,6,9,11], venus:[6,7,12], saturn:[1,2,4,7,8,9,10,11], lagna:[3,4,6,10,11,12] },
  moon:    { sun:[3,6,7,8,10,11], moon:[1,3,6,7,10,11], mars:[2,3,5,6,9,10,11], mercury:[1,3,4,5,7,8,10,11], jupiter:[1,4,7,8,10,11,12], venus:[3,4,5,7,9,10,11], saturn:[3,5,6,11], lagna:[3,6,10,11] },
  mars:    { sun:[3,5,6,10,11], moon:[3,6,11], mars:[1,2,4,7,8,10,11], mercury:[3,5,6,11], jupiter:[6,10,11,12], venus:[6,8,11,12], saturn:[1,4,7,8,9,10,11], lagna:[1,3,6,10,11] },
  mercury: { sun:[5,6,9,11,12], moon:[2,4,6,8,10,11], mars:[1,2,4,7,8,9,10,11], mercury:[1,3,5,6,9,10,11,12], jupiter:[6,8,11,12], venus:[1,2,3,4,5,8,9,11], saturn:[1,2,4,7,8,9,10,11], lagna:[1,2,4,6,8,10,11] },
  jupiter: { sun:[1,2,3,4,7,8,9,10,11], moon:[2,5,7,9,11], mars:[1,2,4,7,8,10,11], mercury:[1,2,4,5,6,9,10,11], jupiter:[1,2,3,4,7,8,10,11], venus:[2,5,6,9,10,11], saturn:[3,5,6,12], lagna:[1,2,4,5,6,7,9,10,11] },
  venus:   { sun:[8,11,12], moon:[1,2,3,4,5,8,9,11,12], mars:[3,5,6,9,11,12], mercury:[3,5,6,9,11], jupiter:[5,8,9,10,11], venus:[1,2,3,4,5,8,9,10,11], saturn:[3,4,5,8,9,10,11], lagna:[1,2,3,4,5,8,9,11] },
  saturn:  { sun:[1,2,4,7,8,10,11], moon:[3,6,11], mars:[3,5,6,10,11,12], mercury:[6,8,9,10,11,12], jupiter:[5,6,11,12], venus:[6,11,12], saturn:[3,5,6,11], lagna:[1,3,4,6,10,11] },
};
const ASHTAKAVARGA_TOTALS: Record<string, number> = { sun: 48, moon: 49, mars: 39, mercury: 54, jupiter: 56, venus: 52, saturn: 39 };

// Computes one planet's Bhinnashtakavarga (12 sign bindu counts) given the
// sign index (0-11) of each of the 8 contributors (7 planets + Lagna).
function computeBhinnashtakavarga(planet: string, positionIdx: Record<string, number>): number[] {
  const bindus = new Array(12).fill(0);
  const table = ASHTAKAVARGA_TABLE[planet];
  if (!table) return bindus;
  for (const contributor of Object.keys(table)) {
    const fromIdx = positionIdx[contributor];
    if (fromIdx == null) continue;
    for (const houseOffset of table[contributor]) {
      const targetIdx = (fromIdx + houseOffset - 1) % 12;
      bindus[targetIdx]++;
    }
  }
  return bindus;
}

// Classical Parashari dignity table — sign-level (not the finer single-degree
// "deep exaltation" point, which isn't reliable to lean on from longitude
// alone). Rahu/Ketu dignity is tradition-dependent and disputed, so it's
// deliberately left out rather than asserting a contested rule as fact.
const DIGNITY: Record<string, { exalted: string; debilitated: string; own: string[]; moolatrikona?: [string, number, number] }> = {
  sun:     { exalted: 'Aries',       debilitated: 'Libra',       own: ['Leo'],                 moolatrikona: ['Leo', 0, 20] },
  moon:    { exalted: 'Taurus',      debilitated: 'Scorpio',     own: ['Cancer'],               moolatrikona: ['Taurus', 4, 30] },
  mars:    { exalted: 'Capricorn',   debilitated: 'Cancer',      own: ['Aries', 'Scorpio'],      moolatrikona: ['Aries', 0, 12] },
  mercury: { exalted: 'Virgo',       debilitated: 'Pisces',      own: ['Gemini', 'Virgo'],       moolatrikona: ['Virgo', 16, 20] },
  jupiter: { exalted: 'Cancer',      debilitated: 'Capricorn',   own: ['Sagittarius', 'Pisces'], moolatrikona: ['Sagittarius', 0, 10] },
  venus:   { exalted: 'Pisces',      debilitated: 'Virgo',       own: ['Taurus', 'Libra'],       moolatrikona: ['Libra', 0, 15] },
  saturn:  { exalted: 'Libra',       debilitated: 'Aries',       own: ['Capricorn', 'Aquarius'], moolatrikona: ['Aquarius', 0, 20] },
};

// Approximate combustion (asta) orbs from the Sun, direct-motion values.
// No retrograde data is available from the ephemeris yet, so this is a
// reasonable approximation, not exact — flagged as such in the output.
const COMBUSTION_ORB: Record<string, number> = {
  moon: 12, mars: 17, mercury: 14, jupiter: 11, venus: 10, saturn: 15,
};

function signIndexFromLongitude(lon: number): number {
  return Math.floor((((lon % 360) + 360) % 360) / 30);
}
function degreeInSign(lon: number): number {
  return (((lon % 360) + 360) % 360) % 30;
}
function angularDistance(a: number, b: number): number {
  const d = Math.abs((((a % 360) + 360) % 360) - (((b % 360) + 360) % 360));
  return Math.min(d, 360 - d);
}
// Navamsa (D9) sign — standard formula, verified equivalent to the classical
// movable/fixed/dual starting-point rule: (signIndex*9 + partIndex) % 12.
function navamsaSignIndex(lon: number): number {
  const signIdx = signIndexFromLongitude(lon);
  const partIdx = Math.floor(degreeInSign(lon) / (30 / 9));
  return (signIdx * 9 + partIdx) % 12;
}
// Dasamsa (D10, career/public life) — classical rule: odd signs (1-indexed)
// count from themselves, even signs count from the 9th sign therefrom.
// 10 divisions of 3° each. Verified against hand-worked examples.
function dasamsaSignIndex(lon: number): number {
  const signIdx = signIndexFromLongitude(lon);
  const partIdx = Math.floor(degreeInSign(lon) / 3);
  const start = signIdx % 2 === 0 ? signIdx : (signIdx + 8) % 12;
  return (start + partIdx) % 12;
}
// Saptamsa (D7, children/creative legacy) — classical rule: odd signs count
// from themselves, even signs count from the 7th sign therefrom (i.e. the
// opposite sign). 7 divisions of 30/7° each. Verified against hand-worked examples.
function saptamsaSignIndex(lon: number): number {
  const signIdx = signIndexFromLongitude(lon);
  const partIdx = Math.floor(degreeInSign(lon) / (30 / 7));
  const start = signIdx % 2 === 0 ? signIdx : (signIdx + 6) % 12;
  return (start + partIdx) % 12;
}
// Shashtiamsa (D60, fine-grained/karmic layer) — counted straight forward
// from the natal sign itself (no odd/even branching), 60 divisions of 0.5°
// each, cycling through the zodiac 5 times. NOTE: this is the least
// certain of the four vargas here — each division is only 0.5° of arc,
// meaning roughly 2 minutes of birth time can shift the result entirely.
// It's included because it was asked for, but should be treated as
// supplementary, not primary, unless birth time is confirmed precise to
// the minute.
function shashtiamsaSignIndex(lon: number): number {
  const signIdx = signIndexFromLongitude(lon);
  const partIdx = Math.floor(degreeInSign(lon) / 0.5);
  return (signIdx + partIdx) % 12;
}
function dignityLabel(planet: string, signIdx: number, deg: number): string | null {
  const d = DIGNITY[planet];
  if (!d) return null;
  const sign = ZODIAC_SIGNS[signIdx];
  if (d.moolatrikona && sign === d.moolatrikona[0] && deg >= d.moolatrikona[1] && deg < d.moolatrikona[2]) return 'Moolatrikona';
  if (sign === d.exalted) return 'Exalted (Uchcha)';
  if (sign === d.debilitated) return 'Debilitated (Neecha)';
  if (d.own.includes(sign)) return 'Own sign (Swakshetra)';
  return null;
}

// Bhrigu Bindu: midpoint of Rahu and Moon along the shorter arc between
// them (the naive average is wrong whenever they're on opposite sides of
// the 0°/360° wraparound, so the >180° case is corrected explicitly).
function bhriguBinduLongitude(moonLon: number, rahuLon: number): number {
  let mid = (moonLon + rahuLon) / 2;
  if (Math.abs(moonLon - rahuLon) > 180) mid = (mid + 180) % 360;
  return mid;
}

function forwardDistance(from: number, to: number): number {
  return (((to - from) % 360) + 360) % 360;
}

// Kaal Sarp Dosha: true if all 7 classical planets fall consistently
// within one of the two arcs bounded by Rahu and Ketu (i.e. all planets
// are "hemmed in" on one side of the nodal axis).
function isKaalSarpDosha(classicalLongitudes: number[], rahuLon: number, ketuLon: number): boolean {
  const span = forwardDistance(rahuLon, ketuLon);
  let allArc1 = true, allArc2 = true;
  for (const lon of classicalLongitudes) {
    const d = forwardDistance(rahuLon, lon);
    const inArc1 = d > 0 && d < span;
    if (!inArc1) allArc1 = false; else allArc2 = false;
  }
  return allArc1 || allArc2;
}

// Builds a full multidimensional chart-analysis text block from raw
// longitudes + Lagna: house (whole-sign), exact degree, nakshatra + pada,
// dignity, combustion, conjunctions, planetary aspects (drishti), and the
// Navamsa (D9) sign for each graha. This replaces a flat "sign + house"
// table with the layered view Bhrigu's own knowledge section claims to
// use — yogas, dasha-lord relationships, and divisional charts can't be
// judged from Lagna and dasha alone. Returns '' if there isn't enough
// real data to build any of this — never sends a half-built table.
export function buildDeepJyotishAnalysis(
  ascendantSign: string | undefined,
  planetLongitudes: Record<string, number> | null | undefined,
  ascendantLongitude?: number | null,
  retrogradeFlags?: Record<string, boolean> | null
): string {
  if (!ascendantSign || !planetLongitudes) return '';
  const lagnaIdx = ZODIAC_SIGNS.findIndex(s => s.toLowerCase() === ascendantSign.toLowerCase());
  if (lagnaIdx === -1) return '';

  type Entry = { planet: string; label: string; lon: number; signIdx: number; house: number; deg: number };
  const entries: Entry[] = [];
  for (const planet of GRAHA_ORDER) {
    const lon = planetLongitudes[planet];
    if (typeof lon !== 'number' || Number.isNaN(lon)) continue;
    const signIdx = signIndexFromLongitude(lon);
    const house = ((signIdx - lagnaIdx + 12) % 12) + 1;
    entries.push({ planet, label: planet.charAt(0).toUpperCase() + planet.slice(1), lon, signIdx, house, deg: degreeInSign(lon) });
  }
  if (!entries.length) return '';

  const sunEntry = entries.find(e => e.planet === 'sun');

  // ── Per-planet lines: sign, exact degree, house, nakshatra+pada, dignity, combustion, Navamsa ──
  const planetLines = entries.map(e => {
    const nakSpan = 360 / 27;
    const lonNorm = (((e.lon % 360) + 360) % 360);
    const nakIdx = Math.floor(lonNorm / nakSpan);
    const degInNak = lonNorm % nakSpan;
    const pada = Math.floor(degInNak / (nakSpan / 4)) + 1;
    const parts = [`${e.label}: ${ZODIAC_SIGNS[e.signIdx]} ${e.deg.toFixed(1)}°, House ${e.house}, Nakshatra ${NAKSHATRAS[nakIdx]} Pada ${pada}`];
    const dignity = dignityLabel(e.planet, e.signIdx, e.deg);
    if (dignity) parts.push(dignity);
    if (e.planet !== 'sun' && sunEntry && COMBUSTION_ORB[e.planet] !== undefined) {
      if (angularDistance(e.lon, sunEntry.lon) <= COMBUSTION_ORB[e.planet]) parts.push('Combust (orb used is the standard direct-motion figure; retrograde combustion orbs run tighter in some classical sources and are not separately applied here)');
    }
    if (retrogradeFlags && retrogradeFlags[e.planet]) parts.push('Retrograde (Vakri)');
    return parts.join(' — ');
  });

  // ── Conjunctions: planets sharing the same house ──
  const byHouse: Record<number, string[]> = {};
  for (const e of entries) (byHouse[e.house] ||= []).push(e.label);
  const conjunctions = Object.entries(byHouse)
    .filter(([, planets]) => planets.length > 1)
    .map(([house, planets]) => `House ${house}: ${planets.join(' + ')} conjunct`);

  // ── Aspects (drishti): every planet aspects the 7th house from itself;
  //    Mars additionally aspects 4th & 8th, Jupiter 5th & 9th, Saturn 3rd & 10th ──
  const aspectMap: Record<string, Set<number>> = {};
  const aspectLines: string[] = [];
  for (const e of entries) {
    const targets = new Set<number>([((e.house + 5) % 12) + 1]);
    if (e.planet === 'mars') { targets.add(((e.house + 2) % 12) + 1); targets.add(((e.house + 6) % 12) + 1); }
    if (e.planet === 'jupiter') { targets.add(((e.house + 3) % 12) + 1); targets.add(((e.house + 7) % 12) + 1); }
    if (e.planet === 'saturn') { targets.add(((e.house + 1) % 12) + 1); targets.add(((e.house + 8) % 12) + 1); }
    aspectMap[e.planet] = targets;
    aspectLines.push(`${e.label} (House ${e.house}) aspects House ${[...targets].sort((a, b) => a - b).join(', ')}`);
  }
  const byPlanet: Record<string, Entry> = {};
  for (const e of entries) byPlanet[e.planet] = e;
  // Two planets are "connected" (used for Raja/Dhana yoga detection) if
  // they're conjunct (same house) or either aspects the other's house.
  const connected = (planetA: string, planetB: string): boolean => {
    if (planetA === planetB) return false;
    const eA = byPlanet[planetA], eB = byPlanet[planetB];
    if (!eA || !eB) return false;
    if (eA.house === eB.house) return true;
    if (aspectMap[planetA]?.has(eB.house)) return true;
    if (aspectMap[planetB]?.has(eA.house)) return true;
    return false;
  };

  // ── House lordship: which planet rules each house, and where that lord
  // currently sits. This is the foundation every yoga check below depends
  // on — without it, "is the 7th lord well placed" can't be answered. ──
  const houseLords: Record<number, { sign: string; lord: string; lordHouse: number | null }> = {};
  for (let h = 1; h <= 12; h++) {
    const signIdx = (lagnaIdx + h - 1) % 12;
    const lord = SIGN_LORDS[signIdx];
    houseLords[h] = { sign: ZODIAC_SIGNS[signIdx], lord, lordHouse: byPlanet[lord]?.house ?? null };
  }
  const lordshipLines = Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
    const hl = houseLords[h];
    return `House ${h} (${hl.sign}): lord ${hl.lord.charAt(0).toUpperCase() + hl.lord.slice(1)}, sitting in House ${hl.lordHouse ?? '?'}`;
  });

  // ── Jaimini Chara Karakas: the 7 classical (non-nodal) planets ranked
  // by degree within their sign, highest to lowest. ──
  const karakaEntries = entries.filter(e => e.planet !== 'rahu' && e.planet !== 'ketu').sort((a, b) => b.deg - a.deg);
  const karakaLines = karakaEntries.map((e, i) => `${KARAKA_LABELS[i]} (${KARAKA_MEANING[KARAKA_LABELS[i]]}): ${e.label}`);

  // ── Bhrigu Bindu: midpoint of Rahu and Moon — traditionally read as an
  // especially sensitive point in the chart, fittingly Bhrigu's own. ──
  let bhriguBinduLine = '';
  if (byPlanet.moon && byPlanet.rahu) {
    const bbLon = bhriguBinduLongitude(byPlanet.moon.lon, byPlanet.rahu.lon);
    const bbSignIdx = signIndexFromLongitude(bbLon);
    const bbHouse = ((bbSignIdx - lagnaIdx + 12) % 12) + 1;
    bhriguBinduLine = `Bhrigu Bindu: ${ZODIAC_SIGNS[bbSignIdx]} ${degreeInSign(bbLon).toFixed(1)}°, House ${bbHouse}`;
  }

  // ── Doshas: computable directly from birth data (Mangal, Kaal Sarp).
  // Sade Sati requires TODAY's Saturn transit position, which isn't part
  // of this natal computation — deliberately not claimed here. ──
  const doshaLines: string[] = [];
  if (byPlanet.mars) {
    if (MANGAL_DOSHA_HOUSES.includes(byPlanet.mars.house)) {
      doshaLines.push(`Mangal Dosha (from Lagna): present — Mars in House ${byPlanet.mars.house}. Classical texts list several cancellation (Bhanga) conditions not evaluated here (e.g. Mars in own/exalted sign, mutual placement with certain benefics) — note the raw placement, don't assume automatic cancellation OR automatic full effect.`);
    }
    if (byPlanet.moon) {
      const marsFromMoon = ((byPlanet.mars.signIdx - byPlanet.moon.signIdx + 12) % 12) + 1;
      if (MANGAL_DOSHA_HOUSES.includes(marsFromMoon)) {
        doshaLines.push(`Mangal Dosha (from Moon): present — Mars in House ${marsFromMoon} counted from natal Moon.`);
      }
    }
  }
  if (byPlanet.rahu && byPlanet.ketu) {
    const classicalLons = entries.filter(e => e.planet !== 'rahu' && e.planet !== 'ketu').map(e => e.lon);
    if (isKaalSarpDosha(classicalLons, byPlanet.rahu.lon, byPlanet.ketu.lon)) {
      doshaLines.push('Kaal Sarp Dosha: present — all seven classical planets fall within one arc bounded by Rahu and Ketu.');
    }
  }

  // ── Yogas: computed from lordship + placement + dignity + aspect data
  // above. Curated to combinations that are unambiguous and classically
  // uncontested; complex/disputed cancellation rules (full Neecha Bhanga
  // conditions, etc.) are deliberately not asserted. ──
  const yogaLines: string[] = [];
  for (const kh of KENDRA_HOUSES) {
    for (const th of TRIKONA_HOUSES) {
      if (kh === th) continue;
      const lordK = houseLords[kh].lord, lordT = houseLords[th].lord;
      if (lordK !== lordT && connected(lordK, lordT)) {
        yogaLines.push(`Raja Yoga: Kendra (House ${kh}) lord ${lordK.charAt(0).toUpperCase() + lordK.slice(1)} connected with Trikona (House ${th}) lord ${lordT.charAt(0).toUpperCase() + lordT.slice(1)}`);
      }
    }
  }
  const lord1 = houseLords[1].lord, lord2 = houseLords[2].lord, lord11 = houseLords[11].lord;
  if (connected(lord2, lord11)) yogaLines.push(`Dhana Yoga: 2nd lord ${lord2.charAt(0).toUpperCase() + lord2.slice(1)} connected with 11th lord ${lord11.charAt(0).toUpperCase() + lord11.slice(1)}`);
  if (connected(lord2, lord1)) yogaLines.push(`Dhana Yoga: 2nd lord ${lord2.charAt(0).toUpperCase() + lord2.slice(1)} connected with 1st lord ${lord1.charAt(0).toUpperCase() + lord1.slice(1)}`);
  if (connected(lord11, lord1)) yogaLines.push(`Dhana Yoga: 11th lord ${lord11.charAt(0).toUpperCase() + lord11.slice(1)} connected with 1st lord ${lord1.charAt(0).toUpperCase() + lord1.slice(1)}`);
  if (byPlanet.jupiter && byPlanet.moon) {
    const jupFromMoon = ((byPlanet.jupiter.signIdx - byPlanet.moon.signIdx + 12) % 12) + 1;
    if (KENDRA_HOUSES.includes(jupFromMoon)) yogaLines.push(`Gajakesari Yoga: Jupiter in House ${jupFromMoon} from natal Moon (kendra)`);
  }
  if (byPlanet.moon) {
    const moonHouse = byPlanet.moon.house;
    const adjacent = [((moonHouse - 2 + 12) % 12) + 1, moonHouse, (moonHouse % 12) + 1];
    const support = ['mars', 'mercury', 'jupiter', 'venus', 'saturn'].some(p => byPlanet[p] && adjacent.includes(byPlanet[p].house));
    if (!support) yogaLines.push('Kemadruma Yoga: present — Moon unsupported (no planet in the houses before, with, or after it). A cautionary yoga, not a strength; name it plainly rather than softening it.');
  }
  for (const d of DUSTHANA_HOUSES) {
    const lord = houseLords[d].lord;
    const lordHouse = byPlanet[lord]?.house;
    if (lordHouse != null && DUSTHANA_HOUSES.includes(lordHouse)) {
      yogaLines.push(`Vipareeta Raja Yoga: House ${d}'s lord ${lord.charAt(0).toUpperCase() + lord.slice(1)} sits in House ${lordHouse} (also dusthana)`);
    }
  }
  for (const planet of ['mars', 'mercury', 'jupiter', 'venus', 'saturn']) {
    const e = byPlanet[planet];
    if (!e) continue;
    const dignity = dignityLabel(planet, e.signIdx, e.deg);
    const isStrong = dignity === 'Exalted (Uchcha)' || dignity === 'Own sign (Swakshetra)' || dignity === 'Moolatrikona';
    if (isStrong && KENDRA_HOUSES.includes(e.house)) {
      yogaLines.push(`${PANCHA_MAHAPURUSHA_NAMES[planet]} Yoga (Pancha Mahapurusha): ${planet.charAt(0).toUpperCase() + planet.slice(1)} ${dignity} in kendra House ${e.house}`);
    }
  }

  // ── Ashtakavarga: Bhinnashtakavarga (per-planet bindu strength across
  // all 12 signs) and Sarvashtakavarga (their sum). This is the classical
  // engine for judging transit strength and relative house support —
  // see ASHTAKAVARGA_TABLE comment for how this table was verified.
  // Reductions (Trikona/Ekadhipatya Sodhana) are deliberately not applied;
  // these are the standard unreduced figures, which is also what
  // Sarvashtakavarga always uses even after reductions exist elsewhere. ──
  let ashtakavargaBlock = '';
  {
    const positionIdx: Record<string, number> = { lagna: lagnaIdx };
    for (const p of ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']) {
      if (byPlanet[p]) positionIdx[p] = byPlanet[p].signIdx;
    }
    const haveAllSeven = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'].every(p => positionIdx[p] != null);
    if (haveAllSeven) {
      const sav = new Array(12).fill(0);
      const bavLines: string[] = [];
      for (const planet of ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']) {
        const bav = computeBhinnashtakavarga(planet, positionIdx);
        bav.forEach((v, i) => { sav[i] += v; });
        const label = planet.charAt(0).toUpperCase() + planet.slice(1);
        const total = bav.reduce((a, b) => a + b, 0);
        const houseAtBirth = bav[byPlanet[planet].signIdx];
        bavLines.push(`${label} Bhinnashtakavarga (own placement House ${byPlanet[planet].house}): ${houseAtBirth} bindus there — full 12-sign spread: ${ZODIAC_SIGNS.map((s, i) => `${s} ${bav[i]}`).join(', ')} (total ${total}, fixed constant for every chart)`);
      }
      const savByHouse = Array.from({ length: 12 }, (_, i) => sav[(lagnaIdx + i) % 12]);
      const savLines = savByHouse.map((v, i) => `House ${i + 1} (${ZODIAC_SIGNS[(lagnaIdx + i) % 12]}): ${v}${v >= 30 ? ' — strong' : v < 25 ? ' — weak' : ''}`);
      ashtakavargaBlock = `── ASHTAKAVARGA (unreduced) ──\nSarvashtakavarga by house (average is 28; 30+ strong, below 25 weak):\n${savLines.join('\n')}\n\nBhinnashtakavarga per planet (full spread across all 12 signs — use the count in whatever sign a planet is transiting or will transit to judge that transit's strength):\n${bavLines.join('\n')}`;
    }
  }

  // ── Upapada Lagna (UL / A12) — Jaimini's marriage/spouse significator,
  // the Arudha Pada of the 12th house. Formula and exception rule verified
  // against multiple independent worked examples before integration (see
  // commit history): count 12th-house-to-its-lord distance, count that
  // same distance forward from the lord's position; if the result lands
  // on the 12th house itself or the 7th sign from it (i.e. the 6th house
  // from Lagna), jump 10 signs further — the same exception rule used for
  // every classical Arudha Pada calculation (Arudha Lagna included).
  let upapadaLagnaLine = '';
  {
    const house12Idx = (lagnaIdx + 11) % 12;
    const ulLord = SIGN_LORDS[house12Idx];
    const lordEntry = byPlanet[ulLord];
    if (lordEntry) {
      const distance = ((lordEntry.signIdx - house12Idx + 12) % 12) + 1;
      let ulIdx = (lordEntry.signIdx + distance - 1) % 12;
      const oppositeOf12th = (house12Idx + 6) % 12;
      const exceptionApplied = ulIdx === house12Idx || ulIdx === oppositeOf12th;
      if (exceptionApplied) ulIdx = (ulIdx + 10) % 12;
      const ulHouse = ((ulIdx - lagnaIdx + 12) % 12) + 1;
      upapadaLagnaLine = `Upapada Lagna (UL): ${ZODIAC_SIGNS[ulIdx]}, House ${ulHouse}${exceptionApplied ? ' (Arudha exception rule applied)' : ''} — marriage/spouse significator, reads the marriage as a social institution and the spouse's visible qualities; cross-check against the Darakaraka and the 7th house rather than using any one alone.`;
    }
  }

  // ── Divisional charts (vargas) — each needs the Ascendant's own exact
  // degree to compute its own Lagna; without that we can only show which
  // sign each planet falls in, not which house, so we skip these sections
  // entirely rather than presenting a half-built varga table. ──
  const vargaSections: string[] = [];
  if (typeof ascendantLongitude === 'number' && !Number.isNaN(ascendantLongitude)) {
    const buildVarga = (
      title: string, purpose: string,
      signFn: (lon: number) => number
    ): string => {
      const vargaLagnaIdx = signFn(ascendantLongitude);
      const lines = entries.map(e => {
        const vSignIdx = signFn(e.lon);
        const vHouse = ((vSignIdx - vargaLagnaIdx + 12) % 12) + 1;
        return `${e.label}: ${ZODIAC_SIGNS[vSignIdx]}, House ${vHouse}`;
      });
      return `── ${title} — ${purpose} ──\nLagna: ${ZODIAC_SIGNS[vargaLagnaIdx]}\n${lines.join('\n')}`;
    };
    vargaSections.push(buildVarga('NAVAMSA (D9)', 'marriage, dharma, inner strength of every placement', navamsaSignIndex));
    vargaSections.push(buildVarga('DASAMSA (D10)', 'career, public standing, achievement', dasamsaSignIndex));
    vargaSections.push(buildVarga('SAPTAMSA (D7)', 'children, creative legacy', saptamsaSignIndex));
    // Shashtiamsa (D60): sign only, no house — computing a Lagna-relative
    // house on top of a 0.5°-per-division chart would compound birth-time
    // imprecision even further. Sign placement alone is already the
    // traditionally weaker, supplementary layer here.
    const d60Lines = entries.map(e => `${e.label}: ${ZODIAC_SIGNS[shashtiamsaSignIndex(e.lon)]}`);
    vargaSections.push(`── SHASHTIAMSA (D60) — fine-grained karmic layer (⚠ each division is only 0.5° of arc; treat as supplementary, not primary, unless birth time is confirmed accurate to the minute) ──\n${d60Lines.join('\n')}`);
  }

  return [
    '── PLANETARY POSITIONS (Rasi / D1) ──',
    ...planetLines,
    conjunctions.length ? '\n── CONJUNCTIONS ──\n' + conjunctions.join('\n') : '',
    '\n── ASPECTS (DRISHTI) ──\n' + aspectLines.join('\n'),
    '\n── HOUSE LORDSHIP ──\n' + lordshipLines.join('\n'),
    '\n── JAIMINI CHARA KARAKAS ──\n' + karakaLines.join('\n'),
    bhriguBinduLine ? '\n── BHRIGU BINDU ──\n' + bhriguBinduLine : '',
    doshaLines.length ? '\n── DOSHAS ──\n' + doshaLines.join('\n') : '',
    yogaLines.length ? '\n── YOGAS ──\n' + yogaLines.join('\n') : '',
    ashtakavargaBlock ? '\n' + ashtakavargaBlock : '',
    upapadaLagnaLine ? '\n── UPAPADA LAGNA (JAIMINI) ──\n' + upapadaLagnaLine : '',
    vargaSections.length ? '\n' + vargaSections.join('\n\n') : '',
  ].filter(Boolean).join('\n');
}
