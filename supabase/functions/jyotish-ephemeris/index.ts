import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { userId, birthDate, birthTime, birthPlace, lat, lng, timezone } =
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
        "moon_nakshatra, moon_longitude, nakshatra_progress, ephemeris_data, dasha_data, ephemeris_confirmed, birth_date, ascendant, sun_sign, mars_sign"
      )
      .eq("user_id", userId)
      .single();

    const cacheValid = existing?.ephemeris_confirmed && existing?.moon_nakshatra
      && existing?.birth_date === birthDate && !forceRefresh
      && existing?.mars_sign; // re-fetch if mars_sign missing (legacy cache)

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
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── VedAstro API call ──
    const [year, month, day] = birthDate.split("-");
    const timeStr = birthTime || "00:00";
    const tzStr = timezone || "+00:00";
    const vedastroTime = `${timeStr}/${day}/${month}/${year}/${tzStr}`;
    const locationStr = birthPlace
      ? encodeURIComponent(birthPlace)
      : `${lat || 0},${lng || 0}`;

    let moonNakshatra = "";
    let moonLongitude = 0;
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
      let marsSign = '';
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
        const hour = hr + mn / 60;

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

        // Local Sidereal Time — use birthPlace lat/lng if available
        // Default to rough timezone offset from birthTime timezone string
        const tzMatch = (birthTime || '').match(/([+-]\d{2}):?(\d{2})$/) ||
                        ['', '+05', '30']; // default IST
        const tzHr = parseInt(tzMatch[1] || '+05') + parseInt(tzMatch[2] || '30') / 60;
        const lng = tzHr * 15; // rough longitude from timezone
        const lst = (gst + lng + 360) % 360;

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
