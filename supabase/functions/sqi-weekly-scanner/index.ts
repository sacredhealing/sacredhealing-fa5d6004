import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (msg: string, d?: unknown) =>
  console.log(`[SQI-SCANNER] ${msg}${d ? ` — ${JSON.stringify(d)}` : ""}`);

// ── File path → human feature name ─────────────────────────────
const FILE_MAP: Record<string, { title: string; type: string; tier: string }> = {
  "QuantumApothecary": { title: "Quantum Apothecary", type: "feature", tier: "free" },
  "JyotishChamber": { title: "Jyotish Chamber", type: "feature", tier: "siddha-quantum" },
  "JyotishVidya": { title: "Jyotish Vidya", type: "course", tier: "siddha-quantum" },
  "SoulScan": { title: "SoulScan", type: "feature", tier: "free" },
  "NadiScannerPage": { title: "Nadi Scanner", type: "feature", tier: "free" },
  "Mantras": { title: "Mantras", type: "mantra", tier: "free" },
  "MantraAcademy": { title: "Mantra Academy", type: "course", tier: "prana-flow" },
  "Meditations": { title: "Meditations", type: "meditation", tier: "free" },
  "AgastyarAcademy": { title: "Agastya Academy", type: "course", tier: "siddha-quantum" },
  "SiddhaMedicineAcademy": { title: "Siddha Medicine Academy", type: "course", tier: "siddha-quantum" },
  "KriyaYogaMastery": { title: "Kriya Yoga Mastery", type: "course", tier: "prana-flow" },
  "YoganandaCodex": { title: "Yogananda Codex", type: "course", tier: "prana-flow" },
  "AkashicCodex": { title: "Akashic Codex", type: "tool", tier: "siddha-quantum" },
  "PalmOracle": { title: "Palm Oracle", type: "tool", tier: "prana-flow" },
  "VirtualPilgrimage": { title: "Virtual Pilgrimage", type: "feature", tier: "free" },
  "SiddhaPortal": { title: "Siddha Portal", type: "feature", tier: "free" },
  "TempleHome": { title: "Temple Home", type: "feature", tier: "free" },
  "SacredGeometry": { title: "Sacred Geometry", type: "course", tier: "prana-flow" },
  "HanumanCodex": { title: "Hanuman Codex", type: "course", tier: "prana-flow" },
  "ThirumoolarPranayama": { title: "Thirumoolar Pranayama", type: "course", tier: "siddha-quantum" },
  "MudraAcademy": { title: "Mudra Academy", type: "course", tier: "prana-flow" },
  "BrahmaMuhurta": { title: "Brahma Muhurta", type: "feature", tier: "free" },
  "OjasRasayanaAcademy": { title: "Ojas Rasayana Academy", type: "course", tier: "siddha-quantum" },
  "SovereignHormonalAlchemy": { title: "Shakti Cycle Intelligence", type: "feature", tier: "siddha-quantum" },
  "SiddhaFastingAcademy": { title: "Siddha Fasting Academy", type: "course", tier: "siddha-quantum" },
  "Ayurveda": { title: "Ayurveda Consultation", type: "feature", tier: "free" },
  "SiddhaSoundAlchemy": { title: "Siddha Sound Alchemy", type: "feature", tier: "siddha-quantum" },
  "Music": { title: "Sacred Music Library", type: "song", tier: "free" },
  "Healing": { title: "Healing Transmissions", type: "meditation", tier: "prana-flow" },
  "Journal": { title: "Practice Journal", type: "feature", tier: "free" },
  "DailyRitual": { title: "Daily Ritual", type: "feature", tier: "free" },
  "SriYantraShield": { title: "Sri Yantra Shield", type: "tool", tier: "siddha-quantum" },
  "SiddhaPhotonicRegeneration": { title: "Siddha Photonic Regeneration", type: "feature", tier: "akasha-infinity" },
  "VajraSkyBreaker": { title: "Vajra Sky Breaker", type: "feature", tier: "akasha-infinity" },
  "SiddhaMediumshipAcademy": { title: "Siddha Mediumship Academy", type: "course", tier: "akasha-infinity" },
  "KayakalpaAcademy": { title: "Kayakalpa Academy", type: "course", tier: "akasha-infinity" },
  "PolymarketBot": { title: "Polymarket Oracle Bot", type: "feature", tier: "akasha-infinity" },
  "Profile": { title: "Profile & Membership", type: "feature", tier: "free" },
  "Dashboard": { title: "Dashboard", type: "feature", tier: "free" },
};

// ── Commit message → relevance classifier ───────────────────────
function isUserFacingChange(msg: string, files: string[]): boolean {
  const lower = msg.toLowerCase();
  // Skip pure infra/bot/data commits
  const skip = ["clawbot", "shreem backfill", "backfill", "sniper", "delta-arb",
    "railway", "hetzner", "cron secret", "migrations only", "trigger rebuild",
    "force vercel", "chore:", "ci:", "revert:", "data:"];
  if (skip.some(s => lower.includes(s))) return false;
  // Must touch src/pages, src/components, or supabase/functions (not infra)
  const hasUserFile = files.some(f =>
    (f.includes("src/pages/") || f.includes("src/components/") ||
     (f.includes("supabase/functions/") && !f.includes("deploy") && !f.includes("clawbot") && !f.includes("shreem")))
    && !f.includes("Admin") && !f.includes("email") && !f.includes("webhook")
  );
  return hasUserFile || msg.startsWith("feat:") || msg.startsWith("fix:");
}

// ── Extract feature name from changed files ──────────────────────
function extractFeature(files: string[]): { title: string; type: string; tier: string } | null {
  for (const file of files) {
    const base = file.split("/").pop()?.replace(".tsx", "").replace(".ts", "") || "";
    for (const [key, val] of Object.entries(FILE_MAP)) {
      if (base.includes(key) || file.includes(key)) return val;
    }
  }
  return null;
}

// ── Call Gemini to write the digest description ─────────────────
async function describeChange(
  featureTitle: string,
  commitMessages: string[],
  changedFiles: string[],
  geminiKey: string
): Promise<string> {
  const prompt = `You are writing the "What's New in the Nexus" section of a weekly email from Kritagya Das and Laila at Siddha Quantum Nexus — a Vedic spiritual intelligence platform. Your tone is personal, deep, and grounded in the actual Siddha tradition. Never use the word "AI". Never say "feature" or "update" or "improvement". Write as if you are describing something sacred that was prepared for the seeker.

The platform feature that changed this week: ${featureTitle}
Commit messages (technical): ${commitMessages.slice(0, 3).join(" | ")}
Files changed: ${changedFiles.slice(0, 3).join(", ")}

Write ONE sentence (max 25 words) that describes what changed in ${featureTitle} this week, in the voice of Kritagya writing to a seeker. Focus on what the seeker can now experience or do differently. Do not start with "I" or "We". Start with the feature name or what the seeker can now do. No quotes around the sentence.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 80 },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return text.replace(/^["']|["']$/g, "").trim();
  } catch {
    return `${featureTitle} has been deepened this week.`;
  }
}

// ── Main scanner ────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const ghToken = Deno.env.get("GH_TOKEN");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!ghToken || !geminiKey) throw new Error("Missing GH_TOKEN or GEMINI_API_KEY");

    // ── Time window: past 7 days ──────────────────────────────
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    log(`Scanning commits since ${since.slice(0, 10)}`);

    // ── Fetch commits from GitHub ─────────────────────────────
    const commitsRes = await fetch(
      `https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/commits?per_page=100&since=${since}`,
      { headers: { Authorization: `token ${ghToken}`, "User-Agent": "SQI-Scanner" } }
    );
    const commits: any[] = await commitsRes.json();
    log(`Total commits this week: ${commits.length}`);

    // ── Get changed files for each commit ─────────────────────
    const featureSeen = new Set<string>();
    const discoveries: Array<{ title: string; type: string; tier: string; msgs: string[]; files: string[] }> = [];

    for (const commit of commits.slice(0, 40)) {
      const msg = commit.commit.message.split("\n")[0];
      const sha = commit.sha;

      // Fetch the commit detail (files changed)
      const detailRes = await fetch(
        `https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/commits/${sha}`,
        { headers: { Authorization: `token ${ghToken}`, "User-Agent": "SQI-Scanner" } }
      );
      const detail = await detailRes.json();
      const files: string[] = (detail.files || []).map((f: any) => f.filename);

      if (!isUserFacingChange(msg, files)) continue;

      const feature = extractFeature(files);
      if (!feature) continue;
      if (featureSeen.has(feature.title)) {
        // Add the message but don't duplicate
        const existing = discoveries.find(d => d.title === feature.title);
        if (existing) existing.msgs.push(msg);
        continue;
      }

      featureSeen.add(feature.title);
      discoveries.push({ ...feature, msgs: [msg], files });
      log(`Found: ${feature.title}`, { type: feature.type, tier: feature.tier });

      // Avoid GitHub rate limit
      await new Promise(r => setTimeout(r, 300));
    }

    // ── Also scan Supabase for new mantras/meditations/courses ─
    const tables = [
      { table: "mantras", titleCol: "title", type: "mantra", tier: "free" },
      { table: "meditations", titleCol: "title", type: "meditation", tier: "free" },
      { table: "healing_audios", titleCol: "title", type: "meditation", tier: "free" },
    ];

    for (const { table, titleCol, type, tier } of tables) {
      try {
        const { data } = await supabase
          .from(table)
          .select(`id, ${titleCol}, created_at`)
          .gte("created_at", since)
          .limit(5);

        for (const row of data || []) {
          const title = row[titleCol];
          if (title && !featureSeen.has(title)) {
            featureSeen.add(title);
            discoveries.push({ title, type, tier, msgs: [`New ${type}: ${title}`], files: [table] });
          }
        }
      } catch {
        // table may not exist — skip silently
      }
    }

    log(`Total user-facing discoveries: ${discoveries.length}`);

    if (discoveries.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No user-facing changes found this week", scanned: commits.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check what's already in content_changelog this week ───
    const { data: existing } = await supabase
      .from("content_changelog")
      .select("content_title")
      .gte("created_at", since);
    const existingTitles = new Set((existing || []).map((r: any) => r.content_title));

    // ── Write new discoveries to content_changelog ────────────
    let written = 0;
    const results: string[] = [];

    for (const item of discoveries.slice(0, 6)) {
      if (existingTitles.has(item.title)) {
        log(`Already logged: ${item.title}`);
        continue;
      }

      // Gemini writes the description
      const description = await describeChange(item.title, item.msgs, item.files, geminiKey);

      const { error } = await supabase.from("content_changelog").insert({
        content_title: item.title,
        content_type: item.type,
        content_description: description,
        tier_required: item.tier,
        auto_announced: false,
        included_in_digest: false,
      });

      if (!error) {
        written++;
        results.push(`${item.title}: ${description}`);
        log(`Logged: ${item.title}`);
      } else {
        log(`Failed to log: ${item.title}`, error);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanned: commits.length,
        discovered: discoveries.length,
        written,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[SQI-SCANNER] Fatal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
