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

    // Check cache
    const { data: existing } = await supabase
      .from("jyotish_profiles")
      .select(
        "moon_nakshatra, moon_longitude, nakshatra_progress, ephemeris_data, dasha_data, ephemeris_confirmed"
      )
      .eq("user_id", userId)
      .single();

    if (existing?.ephemeris_confirmed && existing?.moon_nakshatra) {
      return new Response(
        JSON.stringify({
          source: "cache",
          moonNakshatra: existing.moon_nakshatra,
          moonLongitude: existing.moon_longitude,
          nakshatraProgress: existing.nakshatra_progress,
          dashaData: existing.dasha_data,
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
    let nakProgress = 0.5;

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

      // Alternative: try flat structure
      if (!moonNakshatra && payload?.MoonNakshatra) {
        moonNakshatra = normalizeNakshatra(String(payload.MoonNakshatra));
      }
      if (!moonLongitude && payload?.MoonLongitude) {
        moonLongitude = parseFloat(payload.MoonLongitude);
      }

      // Compute nakshatra progress from longitude
      if (moonLongitude > 0) {
        const nakDeg = moonLongitude % 13.3333333;
        nakProgress = nakDeg / 13.3333333;
      }
    } catch (apiErr) {
      console.error("VedAstro API error:", apiErr);
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
