import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import tzlookup from "https://esm.sh/tz-lookup@6.1.25";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VIMSHOTTARI = [
  { p: "Ketu", y: 7 },
  { p: "Venus", y: 20 },
  { p: "Sun", y: 6 },
  { p: "Moon", y: 10 },
  { p: "Mars", y: 7 },
  { p: "Rahu", y: 18 },
  { p: "Jupiter", y: 16 },
  { p: "Saturn", y: 19 },
  { p: "Mercury", y: 17 },
] as const;


// ════════════════════════════════════════════════════════════════
// BHUMI ORACLE — ACG Line Calculator (36 true angular lines)
// ════════════════════════════════════════════════════════════════

const PLANET_COLORS: Record<string, string> = {
  sun:"#F59E0B", moon:"#C0C8E8", mars:"#EF4444", mercury:"#10B981",
  jupiter:"#D4AF37", venus:"#EC4899", saturn:"#6366F1", rahu:"#8B5CF6", ketu:"#F97316",
};

const ANGLE_MEANINGS: Record<string, Record<string, string>> = {
  ASC: {
    sun:"Identity and leadership radiate from you here. Seen as radiant and authoritative. Best for personal brand.",
    moon:"Deep emotional intelligence is your public face. Healing and nurturing roles come naturally.",
    mars:"Bold and energised presence. Physical vitality peaks. Channel Agni consciously.",
    mercury:"Sharp intellect defines you. Teaching, writing, and business thrive here.",
    jupiter:"Guru energy radiates from you. Wisdom and dharma are your identity. Expansion in all areas.",
    venus:"Beauty and charm become your signature. Love and artistic creation flow. Most magnetic zone.",
    saturn:"Disciplined and serious persona. Life demands hard work but rewards mastery.",
    rahu:"Foreign, innovative, boundary-breaking identity. Fame possible — use ambition with awareness.",
    ketu:"Spiritual and mystical presence. Past-life gifts surface. Others sense your otherworldly wisdom.",
  },
  MC: {
    sun:"Career and public reputation peak. Government favour, recognition, and authority.",
    moon:"Career in healing, hospitality, or public service. Public emotional intelligence.",
    mars:"Driven professional energy. Leadership and engineering success. Ambition amplified.",
    mercury:"Communication and intellect define career. Writing, teaching, business intelligence peaks.",
    jupiter:"Most auspicious MC. Career in dharma, education, law, or spiritual work. Wealth through wisdom.",
    venus:"Artistic career peaks. Fame in beauty, arts, luxury. Love life public and beautiful.",
    saturn:"Career requires discipline. Slow but permanent gains. Authority through mastery over time.",
    rahu:"Unconventional fame. Technology, foreign career, or media success.",
    ketu:"Spiritual vocation becomes public. Renunciation respected. Moksha-related career.",
  },
  DSC: {
    sun:"Powerful and authoritative partners appear. Marriage to someone solar and commanding.",
    moon:"Deeply nurturing partnerships. Emotional bonds heal. Marriage is the sanctuary.",
    mars:"Passionate and intense partnerships. Magnetic but requires conscious channeling.",
    mercury:"Intellectual partnerships. Communication is the bond. Business partnerships sharp.",
    jupiter:"Most auspicious for marriage. Wise, dharmic, expansive partners appear here.",
    venus:"Zone of love and romance. Marriage prospects peak. Beautiful partnerships blossom.",
    saturn:"Karmic partnerships. Long-lasting but requiring work and patience.",
    rahu:"Foreign or unusual partnerships. Intense attraction with karmic undercurrent.",
    ketu:"Past-life partnerships resurface. Spiritually significant bonds. Detachment from identity.",
  },
  IC: {
    sun:"Ancestral solar power. Rootedness in identity. Family as foundation of authority.",
    moon:"Deepest emotional home. Most nurturing zone. Ideal for family life and inner peace.",
    mars:"Intense home environment. Property acquisition possible. Active domestic life.",
    mercury:"Intellectual home life. Study and writing in private. Family of thinkers.",
    jupiter:"Home as temple. Most auspicious IC — filled with dharma, learning, and expansion.",
    venus:"Beautiful and harmonious home. Artistic domestic environment. Joy in private life.",
    saturn:"Home as place of discipline. Ancestral duties. Long-term stability through effort.",
    rahu:"Foreign or unusual home. Restless roots. Innovation in private life.",
    ketu:"Home as ashram. Deep spiritual private life. Ancestor karma resolves.",
  },
};

interface PlanetLongitudes {
  sun?: number; moon?: number; mars?: number; mercury?: number;
  jupiter?: number; venus?: number; saturn?: number; rahu?: number; ketu?: number;
}

interface ACGLine {
  planet: string;
  planetName: string;
  angle: string;
  color: string;
  points: { lon: number; lat: number }[];
  meaning: string;
  isBenefic: boolean;
}

interface ParanPoint {
  planet1: string; planet2: string;
  angle1: string; angle2: string;
  lat: number; lon: number; meaning: string;
}

function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }

function calcGMST(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let g = 280.46061837 + 360.98564736629*(jd-2451545.0) + 0.000387933*T*T - T*T*T/38710000.0;
  return ((g % 360) + 360) % 360;
}

function birthToJD(birthDate: string, birthTime: string, birthLon: number): number {
  const [yr,mo,dy] = birthDate.split("-").map(Number);
  const [hr,mn] = (birthTime||"12:00").split(":").map(Number);
  const tzOffset = birthLon / 15;
  const utcHr = hr + mn/60 - tzOffset;
  const a = Math.floor((14-mo)/12);
  const y = yr+4800-a;
  const m = mo+12*a-3;
  const jdn = dy+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  return jdn + (utcHr-12)/24;
}

function extractPlanetLongitudes(payload: Record<string, unknown>): PlanetLongitudes {
  const apd = (payload?.AllPlanetData || payload) as Record<string, unknown>;
  const lons: PlanetLongitudes = {};
  const keyMap: Record<string, keyof PlanetLongitudes> = {
    Sun:"sun",Moon:"moon",Mars:"mars",Mercury:"mercury",Jupiter:"jupiter",
    Venus:"venus",Saturn:"saturn",Rahu:"rahu",NorthNode:"rahu",Ketu:"ketu",SouthNode:"ketu",
  };
  for (const [apiKey, ourKey] of Object.entries(keyMap)) {
    const pData = apd[apiKey] as Record<string, unknown>|undefined;
    if (pData?.Longitude != null) lons[ourKey] = parseFloat(String(pData.Longitude));
  }
  return lons;
}

/** Geocode a free-text birth place to coordinates via Open-Meteo (no API key required). */
async function geocodePlace(place: string): Promise<{ lat: number; lon: number } | null> {
  if (!place?.trim()) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const r = data?.results?.[0];
    if (r?.latitude != null && r?.longitude != null) {
      return { lat: parseFloat(r.latitude), lon: parseFloat(r.longitude) };
    }
  } catch (e) {
    console.error("Geocode error:", e);
  }
  return null;
}

/**
 * Given coordinates + a birth date/time, return the exact UTC offset in minutes
 * for that IANA timezone ON THAT DATE (correctly handles DST/historical changes),
 * instead of guessing a fixed offset.
 */
function resolveUtcOffsetMinutes(lat: number, lon: number, birthDate: string, birthTime: string): number | null {
  try {
    const ianaZone = tzlookup(lat, lon);
    const [y, m, d] = birthDate.split("-").map(Number);
    const [hh, mm] = (birthTime || "12:00").split(":").map(Number);
    // Treat the wall-clock birth time as a UTC instant, then read what that
    // instant looks like in the target zone; the delta is the zone's offset.
    const utcGuess = new Date(Date.UTC(y, m - 1, d, hh, mm));
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = fmt.formatToParts(utcGuess).reduce((acc, p) => {
      acc[p.type] = p.value; return acc;
    }, {} as Record<string, string>);
    const asIfUtc = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) === 24 ? 0 : Number(parts.hour), Number(parts.minute), Number(parts.second)
    );
    return Math.round((asIfUtc - utcGuess.getTime()) / 60000);
  } catch (e) {
    console.error("Timezone resolution error:", e);
    return null;
  }
}

function offsetMinutesToString(mins: number): string {
  const sign = mins < 0 ? "-" : "+";
  const abs = Math.abs(mins);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

/**
 * Resolves the real lat/lng and DST-aware UTC offset for a birth record.
 * Uses supplied lat/lng if present; otherwise geocodes birthPlace. Falls back
 * to the coarse keyword lookup only if live geocoding fails outright.
 */
async function resolveBirthLocation(
  birthDate: string, birthTime: string, birthPlace: string,
  suppliedLat?: number | string, suppliedLng?: number | string
): Promise<{ lat: number; lon: number; timezone: string }> {
  let lat = suppliedLat != null ? parseFloat(String(suppliedLat)) : NaN;
  let lon = suppliedLng != null ? parseFloat(String(suppliedLng)) : NaN;

  if ((Number.isNaN(lat) || Number.isNaN(lon)) && birthPlace) {
    const geo = await geocodePlace(birthPlace);
    if (geo) { lat = geo.lat; lon = geo.lon; }
  }
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    const guess = guessBirthCoords(birthPlace || "");
    lat = guess.lat; lon = guess.lon;
  }

  const offsetMin = resolveUtcOffsetMinutes(lat, lon, birthDate, birthTime);
  const timezone = offsetMin != null ? offsetMinutesToString(offsetMin) : "+00:00";
  return { lat, lon, timezone };
}

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
    if (loc.keys.some(k => p.includes(k))) return {lat:loc.lat,lon:loc.lon};
  }
  return {lat:0,lon:0};
}

function computeACGLines(
  planetLons: PlanetLongitudes, birthDate: string, birthTime: string,
  birthLat: number, birthLon: number
): { acgLines: ACGLine[]; parans: ParanPoint[] } {
  const jd   = birthToJD(birthDate, birthTime, birthLon);
  const gmst = calcGMST(jd);
  const eps  = 23.44;

  const PLANET_DISPLAY: Record<string, string> = {
    sun:"Surya",moon:"Chandra",mars:"Mangala",mercury:"Budha",
    jupiter:"Guru",venus:"Shukra",saturn:"Shani",rahu:"Rāhu",ketu:"Ketu",
  };
  const BENEFIC = new Set(["jupiter","venus","moon","mercury"]);
  const acgLines: ACGLine[] = [];

  for (const [pid, pname] of Object.entries(PLANET_DISPLAY)) {
    const lon = planetLons[pid as keyof PlanetLongitudes];
    if (lon == null) continue;

    const eLon = toRad(lon);
    const epsR = toRad(eps);
    const ra   = toDeg(Math.atan2(Math.sin(eLon)*Math.cos(epsR), Math.cos(eLon)));
    const raPos= ((ra%360)+360)%360;
    const dec  = toDeg(Math.asin(Math.sin(eLon)*Math.sin(epsR)));
    const tanDec = Math.tan(toRad(dec));

    // MC line (vertical, at fixed longitude)
    const mcLon = ((raPos - gmst + 180 + 360) % 360) - 180;
    const mcPts = [];
    for (let lat=-80;lat<=80;lat+=4) mcPts.push({lon:mcLon,lat});
    acgLines.push({planet:pid,planetName:pname,angle:"MC",color:PLANET_COLORS[pid],points:mcPts,meaning:ANGLE_MEANINGS.MC[pid]??"",isBenefic:BENEFIC.has(pid)});

    // IC line (opposite MC)
    const icLon = ((mcLon+180+360)%360)-180;
    const icPts = [];
    for (let lat=-80;lat<=80;lat+=4) icPts.push({lon:icLon,lat});
    acgLines.push({planet:pid,planetName:pname,angle:"IC",color:PLANET_COLORS[pid],points:icPts,meaning:ANGLE_MEANINGS.IC[pid]??"",isBenefic:BENEFIC.has(pid)});

    // ASC + DSC lines (curved great circles)
    if (Math.abs(tanDec) > 0.001) {
      const ascPts: {lon:number;lat:number}[] = [];
      const dscPts: {lon:number;lat:number}[] = [];
      for (let gLon=-180;gLon<=180;gLon+=3) {
        const lst = ((gmst+gLon+360)%360);
        const H  = toRad(((lst-raPos+360)%360));
        const latR = Math.atan(-Math.cos(H)/tanDec);
        const lat  = toDeg(latR);
        if (lat>=-80&&lat<=80) ascPts.push({lon:gLon,lat:Math.round(lat*10)/10});
        const H2 = toRad(((lst-raPos+180+360)%360));
        const latR2 = Math.atan(-Math.cos(H2)/tanDec);
        const lat2  = toDeg(latR2);
        if (lat2>=-80&&lat2<=80) dscPts.push({lon:gLon,lat:Math.round(lat2*10)/10});
      }
      if (ascPts.length>2) acgLines.push({planet:pid,planetName:pname,angle:"ASC",color:PLANET_COLORS[pid],points:ascPts,meaning:ANGLE_MEANINGS.ASC[pid]??"",isBenefic:BENEFIC.has(pid)});
      if (dscPts.length>2) acgLines.push({planet:pid,planetName:pname,angle:"DSC",color:PLANET_COLORS[pid],points:dscPts,meaning:ANGLE_MEANINGS.DSC[pid]??"",isBenefic:BENEFIC.has(pid)});
    }
  }

  // Parans: MC lines within 5° longitude
  const mcLines = acgLines.filter(l=>l.angle==="MC");
  const parans: ParanPoint[] = [];
  for (let i=0;i<mcLines.length;i++) {
    for (let j=i+1;j<mcLines.length;j++) {
      const l1=mcLines[i],l2=mcLines[j];
      if (!l1.points[0]||!l2.points[0]) continue;
      const diff = Math.abs(l1.points[0].lon-l2.points[0].lon);
      if (diff<=5||diff>=355) {
        parans.push({planet1:l1.planet,planet2:l2.planet,angle1:"MC",angle2:"MC",lat:0,
          lon:(l1.points[0].lon+l2.points[0].lon)/2,
          meaning:`${l1.planetName} × ${l2.planetName} paran — blended energies intensify this zone.`});
      }
    }
  }
  return {acgLines,parans};
}

const NAKSHATRA_LORD: Record<string, string> = {
  Ashwini: "Ketu",
  Bharani: "Venus",
  Krittika: "Sun",
  Rohini: "Moon",
  Mrigashira: "Mars",
  Ardra: "Rahu",
  Punarvasu: "Jupiter",
  Pushya: "Saturn",
  Ashlesha: "Mercury",
  Magha: "Ketu",
  "Purva Phalguni": "Venus",
  "Uttara Phalguni": "Sun",
  Hasta: "Moon",
  Chitra: "Mars",
  Swati: "Rahu",
  Vishakha: "Jupiter",
  Anuradha: "Saturn",
  Jyeshtha: "Mercury",
  Mula: "Ketu",
  "Purva Ashadha": "Venus",
  "Uttara Ashadha": "Sun",
  Shravana: "Moon",
  Dhanishtha: "Mars",
  Shatabhisha: "Rahu",
  "Purva Bhadrapada": "Jupiter",
  "Uttara Bhadrapada": "Saturn",
  Revati: "Mercury",
};

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
  "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
  "Revati",
];

interface DashaPeriod {
  planet: string;
  years: number;
  start: string;
  end: string;
  active: boolean;
  antardashas: {
    planet: string;
    start: string;
    end: string;
    active: boolean;
  }[];
}

function calcVimshottari(
  nakshatra: string,
  progressInNak: number,
  birthDateStr: string
) {
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
      planet: maha.p,
      years: maha.y,
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

/** Normalize VedAstro nakshatra name to our canonical list */
function normalizeNakshatra(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/\s*nakshatra.*/i, "").trim();
  // Exact match
  const exact = NAKSHATRA_NAMES.find(
    (n) => n.toLowerCase() === cleaned.toLowerCase()
  );
  if (exact) return exact;
  // Partial match
  const partial = NAKSHATRA_NAMES.find(
    (n) =>
      cleaned.toLowerCase().includes(n.toLowerCase()) ||
      n.toLowerCase().includes(cleaned.toLowerCase())
  );
  return partial || cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { userId, birthDate, birthTime, birthPlace, lat, lng, timezone, forceRefresh } =
      body;

    if (!userId || !birthDate) {
      return new Response(
        JSON.stringify({ error: "userId and birthDate required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check cache — but only use if birth_date matches
    const { data: existing } = await supabase
      .from("jyotish_profiles")
      .select(
        "moon_nakshatra, moon_longitude, nakshatra_progress, ephemeris_data, dasha_data, ephemeris_confirmed, birth_date, ascendant, sun_sign, mars_sign, planet_longitudes"
      )
      .eq("user_id", userId)
      .single();

    const cacheValid = existing?.ephemeris_confirmed && existing?.moon_nakshatra
      && existing?.birth_date === birthDate && !forceRefresh
      && existing?.mars_sign // re-fetch if mars_sign missing (legacy cache)
      && existing?.planet_longitudes; // re-fetch if full graha data missing (pre-Rasi-chart cache)

    if (cacheValid) {
      return new Response(
        JSON.stringify({
          source: "cache",
          moonNakshatra: existing.moon_nakshatra,
          moonLongitude: existing.moon_longitude,
          nakshatraProgress: existing.nakshatra_progress,
          dashaData: existing.dasha_data,
          ascendantSign: existing.ascendant || '',
          sunSign: existing.sun_sign || '',
          marsSign: existing.mars_sign || '',
          ephemerisData: existing.ephemeris_data,
          planetLongitudes: existing.planet_longitudes || {},
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Resolve REAL birth location + DST-aware UTC offset ──
    // The frontend currently sends a hardcoded '+00:00' and no lat/lng at all,
    // which silently broke every chart for anyone not born at UTC+0/lon 0.
    // Geocode + timezone-lookup here so this is correct regardless of what
    // (if anything) the caller supplies.
    const resolvedLoc = await resolveBirthLocation(birthDate, birthTime, birthPlace, lat, lng);

    // ── VedAstro API call ──
    const [year, month, day] = birthDate.split("-");
    const timeStr = birthTime || "00:00";
    const tzStr = resolvedLoc.timezone;
    const vedastroTime = `${timeStr}/${day}/${month}/${year}/${tzStr}`;
    const locationStr = birthPlace
      ? encodeURIComponent(birthPlace)
      : `${resolvedLoc.lat},${resolvedLoc.lon}`;

    let moonNakshatra = "";
    let moonLongitude = 0;
    let planetLongitudes: PlanetLongitudes = {};
    let ascendantSign = "";
    let sunSign = "";
    let nakProgress = 0.5;
    let marsSign = "";

    try {
      // VedAstro v2 API for all planets
      const calcUrl =
        `https://vedastroapi.azurewebsites.net/api/Calculate/AllPlanetData/` +
        `Location/${locationStr}/Time/${encodeURIComponent(vedastroTime)}/Ayanamsa/LAHIRI`;

      console.log("VedAstro URL:", calcUrl);

      const vedRes = await fetch(calcUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      const vedData = await vedRes.json();

      // Try extracting Moon nakshatra from response
      const payload = vedData?.Payload || vedData?.payload || vedData;

      // VedAstro returns data in various structures; try common paths
      if (payload?.AllPlanetData?.Moon) {
        const moonData = payload.AllPlanetData.Moon;
        if (moonData.Nakshatra)
          moonNakshatra = normalizeNakshatra(String(moonData.Nakshatra));
        if (moonData.Longitude != null)
          moonLongitude = parseFloat(moonData.Longitude);
      }

      // Extract Ascendant (Lagna) — try multiple VedAstro field names
      const ascData = payload?.AllPlanetData?.Ascendant
        || payload?.AllPlanetData?.Lagna
        || payload?.AllPlanetData?.Rising
        || payload?.AllPlanetData?.['House 1']
        || payload?.Ascendant
        || null;
      if (ascData) {
        ascendantSign = String(ascData.Sign || ascData.Rashi || ascData.ZodiacSign || '').trim();
        if (!ascendantSign && ascData.Longitude != null) {
          // Derive sign from longitude (0-360 → 12 signs of 30° each)
          const signIdx = Math.floor(parseFloat(ascData.Longitude) / 30) % 12;
          const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                         'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
          ascendantSign = SIGNS[signIdx] || '';
        }
      }

      // Extract Sun sign for complete natal context
      const sunData = payload?.AllPlanetData?.Sun || null;
      if (sunData) {
        sunSign = String(sunData.Sign || sunData.Rashi || sunData.ZodiacSign || '').trim();
        if (!sunSign && sunData.Longitude != null) {
          const signIdx = Math.floor(parseFloat(sunData.Longitude) / 30) % 12;
          const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                         'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
          sunSign = SIGNS[signIdx] || '';
        }
      }

      // Extract Mars sign
      // marsSign already declared in outer scope
      const marsData = payload?.AllPlanetData?.Mars || null;
      if (marsData) {
        marsSign = String(marsData.Sign || marsData.Rashi || marsData.ZodiacSign || '').trim();
        if (!marsSign && marsData.Longitude != null) {
          const signIdx = Math.floor(parseFloat(marsData.Longitude) / 30) % 12;
          const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                         'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
          marsSign = SIGNS[signIdx] || '';
        }
      }

      // Alternative: try flat structure
      if (!moonNakshatra && payload?.MoonNakshatra) {
        moonNakshatra = normalizeNakshatra(String(payload.MoonNakshatra));
      }
      if (!moonLongitude && payload?.MoonLongitude) {
        moonLongitude = parseFloat(payload.MoonLongitude);
      }

      // Flat-structure fallbacks for ascendant
      if (!ascendantSign && payload?.AscendantSign) ascendantSign = String(payload.AscendantSign).trim();
      if (!ascendantSign && payload?.Ascendant) ascendantSign = String(payload.Ascendant?.Sign || payload.Ascendant).trim();
      if (!ascendantSign && payload?.LagnaSign) ascendantSign = String(payload.LagnaSign).trim();

      // Try extracting from AllPlanetData with different casing
      if (!ascendantSign) {
        const keys = Object.keys(payload?.AllPlanetData || {});
        const ascKey = keys.find(k => /asc|lagna|rising/i.test(k));
        if (ascKey) {
          const asc = payload.AllPlanetData[ascKey];
          ascendantSign = String(asc?.Sign || asc?.Rashi || asc?.ZodiacSign || '').trim();
          if (!ascendantSign && asc?.Longitude != null) {
            const si = Math.floor(parseFloat(asc.Longitude) / 30) % 12;
            const SG = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
            ascendantSign = SG[si] || '';
          }
        }
      }

      // Mars flat-structure fallbacks
      if (!marsSign && payload?.MarsSign) marsSign = String(payload.MarsSign).trim();

      // Extract ALL planet longitudes for ACG
      planetLongitudes = extractPlanetLongitudes(payload as Record<string, unknown>);
      if (!marsSign) {
        const keys = Object.keys(payload?.AllPlanetData || {});
        const marsKey = keys.find(k => /^mars$/i.test(k));
        if (marsKey) {
          const m = payload.AllPlanetData[marsKey];
          marsSign = String(m?.Sign || m?.Rashi || m?.ZodiacSign || '').trim();
          if (!marsSign && m?.Longitude != null) {
            const si = Math.floor(parseFloat(m.Longitude) / 30) % 12;
            const SG = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
            marsSign = SG[si] || '';
          }
        }
      }

      // Compute nakshatra progress from longitude
      if (moonLongitude > 0) {
        const nakDeg = moonLongitude % 13.3333333;
        nakProgress = nakDeg / 13.3333333;
      }
    } catch (apiErr) {
      console.error("VedAstro API error:", apiErr);
    }

    // ── Compute Lagna (Ascendant) if VedAstro didn't return it ─────────
    if (!ascendantSign && birthDate && birthTime) {
      try {
        // Sidereal Lagna calculation (Lahiri ayanamsa approximation)
        const [yr, mo, dy] = birthDate.split('-').map(Number);
        const [hr, mn] = (birthTime || '12:00').split(':').map(Number);

        // GST/JD math requires Universal Time, not local clock time — convert
        // using the real, geocoded UTC offset for this birth (DST-aware).
        const tzOffsetMatch = resolvedLoc.timezone.match(/([+-])(\d{2}):?(\d{2})/);
        const tzOffsetHours = tzOffsetMatch
          ? (tzOffsetMatch[1] === '-' ? -1 : 1) *
            (parseInt(tzOffsetMatch[2]) + parseInt(tzOffsetMatch[3]) / 60)
          : 0;
        const hour = (hr + mn / 60) - tzOffsetHours;

        // Julian Day Number
        const a = Math.floor((14 - mo) / 12);
        const y = yr + 4800 - a;
        const m = mo + 12 * a - 3;
        const jdn = dy + Math.floor((153 * m + 2) / 5) + 365 * y +
                    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        const jd = jdn + (hour - 12) / 24;

        // Greenwich Sidereal Time
        const T = (jd - 2451545.0) / 36525;
        const gst = (280.46061837 + 360.98564736629 * (jd - 2451545) +
                     T * T * 0.000387933 - T * T * T / 38710000) % 360;

        // Local Sidereal Time — use the actual birth longitude when we have it.
        // Only fall back to deriving longitude from the UTC offset (never IST by default)
        // if no lat/lng was supplied for this birth record.
        let ascLng: number;
        if (!Number.isNaN(resolvedLoc.lon)) {
          ascLng = resolvedLoc.lon;
        } else {
          ascLng = tzOffsetHours * 15; // last-resort rough longitude from offset
        }
        const lst = (gst + ascLng + 360) % 360;

        // Lahiri ayanamsa (approx)
        const ayanamsa = 23.85 + (yr - 2000) * 0.014;

        // RAMC to Ascendant (simplified, assumes equatorial latitude)
        // For tropical ascendant then subtract ayanamsa
        const obliquity = 23.4393 - 0.0000004 * (jd - 2451545);
        const lstRad = lst * Math.PI / 180;
        const oblRad = obliquity * Math.PI / 180;
        const tanAsc = Math.cos(lstRad) / (-Math.sin(lstRad) * Math.cos(oblRad));
        let tropAsc = Math.atan(tanAsc) * 180 / Math.PI;
        // Quadrant correction
        if (Math.sin(lstRad) > 0) tropAsc += 180;
        if (tropAsc < 0) tropAsc += 360;
        // Sidereal ascendant
        const sidAsc = (tropAsc - ayanamsa + 360) % 360;
        const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                       'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
        ascendantSign = SIGNS[Math.floor(sidAsc / 30)] || '';
      } catch (lagnaErr) {
        console.error('Lagna calc error:', lagnaErr);
      }
    }

    // ── Compute Mars sign if VedAstro didn't return it ────────────────────
    if (!marsSign && birthDate) {
      try {
        // Mars orbital period ~686.97 days, synodic ~779.9 days
        // Known reference: Mars in Aries on 2024-01-01 (approx longitude 350°)
        const refDate = new Date('2024-01-01');
        const birthDt = new Date(birthDate);
        const daysDiff = (birthDt.getTime() - refDate.getTime()) / 86400000;
        const marsDailyMotion = 360 / 686.97; // degrees per day
        const ayanamsa = 23.85 + (new Date(birthDate).getFullYear() - 2000) * 0.014;
        const marsLng = ((350 + daysDiff * marsDailyMotion) % 360 + 360) % 360;
        const sidMars = (marsLng - ayanamsa + 360) % 360;
        const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                       'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
        marsSign = SIGNS[Math.floor(sidMars / 30)] || '';
      } catch(e) { console.error('Mars calc error:', e); }
    }

    // Fallback: derive nakshatra from longitude
    if (!moonNakshatra && moonLongitude > 0) {
      const nakIdx = Math.floor((moonLongitude / 360) * 27);
      moonNakshatra = NAKSHATRA_NAMES[nakIdx] || "";
    }

    // If still no data, use the client-side approximation as last resort
    if (!moonNakshatra) {
      // Approximate from birth date (same logic as client-side fallback)
      const bd = new Date(birthDate);
      if (!isNaN(bd.getTime())) {
        const dayOfYear = Math.floor(
          (bd.getTime() - new Date(bd.getFullYear(), 0, 0).getTime()) /
            86400000
        );
        const nakIdx = dayOfYear % 27;
        moonNakshatra = NAKSHATRA_NAMES[nakIdx] || "";
        console.log(
          "Using date-based fallback nakshatra:",
          moonNakshatra
        );
      }
    }

    if (!moonNakshatra) {
      return new Response(
        JSON.stringify({
          error: "Could not calculate Moon Nakshatra. Check birth data.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Vimshottari Dasha ──
    const dashaResult = calcVimshottari(moonNakshatra, nakProgress, birthDate);

    // ── Bhumi Oracle: Compute real ACG lines ──
    let acgLines: ACGLine[] = [];
    let parans: ParanPoint[] = [];
    if (Object.keys(planetLongitudes).length >= 4 && birthDate && birthTime) {
      try {
        const acgResult = computeACGLines(planetLongitudes, birthDate, birthTime, resolvedLoc.lat, resolvedLoc.lon);
        acgLines = acgResult.acgLines;
        parans   = acgResult.parans;
        console.log("ACG lines computed:", acgLines.length, "parans:", parans.length);
      } catch (acgErr) {
        console.error("ACG error:", acgErr);
      }
    }

    const ephemerisData = {
      source: moonLongitude > 0 ? "vedastro_swiss_ephemeris" : "date_fallback",
      calculatedAt: new Date().toISOString(),
      moonNakshatra,
      moonLongitude,
      nakProgress,
      ayanamsa: "LAHIRI",
    };

    // ── Store in DB ──
    await supabase.from("jyotish_profiles").upsert(
      {
        user_id: userId,
        moon_nakshatra: moonNakshatra,
        moon_longitude: moonLongitude,
        nakshatra_progress: nakProgress,
        ephemeris_data: ephemerisData,
        dasha_data: dashaResult,
        ephemeris_confirmed: moonLongitude > 0,
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_place: birthPlace || null,
        ascendant: ascendantSign || null,
        sun_sign: sunSign || null,
        mars_sign: marsSign || null,
        planet_longitudes: planetLongitudes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return new Response(
      JSON.stringify({
        source: moonLongitude > 0 ? "ephemeris_fresh" : "date_fallback",
        moonNakshatra,
        moonLongitude,
        nakshatraProgress: nakProgress,
        dashaData: dashaResult,
        ascendantSign,
        sunSign,
        marsSign,
        ephemerisData: ephemerisData,
        acgLines,
        parans,
        planetLongitudes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("jyotish-ephemeris error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
