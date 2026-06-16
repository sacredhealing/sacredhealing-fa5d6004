import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Known voice signatures (seeded from real posts, updated by scanner) ──────
const KRITAGYA_VOICE_SEED = [
  "pleasure to walk with this incredible talented soul — we are coming with a new song soon",
  "#sacredhealingmusic #vaishnava #hindurap #harekrishna #vishwananda",
  "Jai Gurudev! I have been on the spiritual path for over 20 years",
  "I was born in Sweden as Adam. When I became a devotee of my Satguru I was given the name Kritagya Das",
  "Together with my wife we have created The Sacred Healing Music",
  "I am also a father of 3 children that we bring up in a joyful spiritual environment on the west coast of Sweden",
  "This page will be about everything we do in life. I hope it will bring joy and inspiration to your heart",
];

const LAILA_VOICE_SEED = [
  "Sahaja: Total surrender to uninhibited, fluid movement, allowing the body to organically ride the rhythm and dissolve any tension",
  "Come to my DanceYoga Thursdays 16.30 and try it out!",
  "Welcome to online morning yoga! Mondays 07.00 – 07.30. Comment yoga for the invite",
  "Singing Healer for Transformation — listen with your Heart and Remember YOU",
  "Tools to master your mind, strengthen...",
];

// ── Fetch recent IG captions via public scraper ───────────────────────────────
async function fetchInstagramCaptions(handle: string, ghToken: string): Promise<string[]> {
  try {
    // Use Bibliogram-style public endpoint or Instagram's public JSON
    const url = `https://www.instagram.com/${handle}/?__a=1&__d=dis`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      }
    });

    if (!res.ok) throw new Error(`IG returned ${res.status}`);
    const data = await res.json();

    const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
    const captions: string[] = [];

    for (const edge of edges.slice(0, 12)) {
      const captionEdges = edge?.node?.edge_media_to_caption?.edges || [];
      for (const cap of captionEdges) {
        const text = cap?.node?.text;
        if (text && text.length > 20 && text.length < 500) {
          // Strip hashtag-only lines, keep meaningful text
          const cleaned = text.split('\n')
            .filter((line: string) => !line.trim().startsWith('#') && line.trim().length > 10)
            .join(' ')
            .trim();
          if (cleaned.length > 20) captions.push(cleaned);
        }
      }
    }
    return captions;
  } catch (e) {
    console.log(`[VOICE] IG scrape failed for ${handle}: ${e} — using seed voice`);
    return [];
  }
}

// ── Build voice profile for Gemini ───────────────────────────────────────────
function buildVoiceProfile(
  name: string,
  seedVoice: string[],
  recentCaptions: string[]
): string {
  const allSamples = [...recentCaptions.slice(0, 8), ...seedVoice].slice(0, 10);
  return `${name}'s real writing voice (from their actual social media posts):\n${allSamples.map((s, i) => `${i + 1}. "${s}"`).join('\n')}`;
}

// ── Generate Monday email with Kritagya's real voice ─────────────────────────
async function generateMondayEmail(
  kritagyaCaptions: string[],
  contentItems: Array<{ title: string; type: string; tier: string; description: string }>,
  weekDate: string,
  geminiKey: string
): Promise<{ subject: string; personalOpening: string; contentIntro: string; closing: string }> {

  const voiceProfile = buildVoiceProfile("Kritagya Das", KRITAGYA_VOICE_SEED, kritagyaCaptions);

  const contentList = contentItems.length > 0
    ? contentItems.map(c => `- ${c.title} (${c.type}): ${c.description}`).join('\n')
    : "General improvements to the Nexus platform this week";

  const prompt = `You are writing this week's Monday email from Kritagya Das to the members of Siddha Quantum Nexus.

${voiceProfile}

Key facts about Kritagya:
- Born in Sweden as Adam, Spanish father, took the name Kritagya Das from his Satguru
- Devotee of Paramahamsa Vishwananda, on the Bhakti path for 20+ years
- Father of 3 children, lives in Uddevalla on the west coast of Sweden
- Musician and healer, makes sacred healing music with his wife Laila
- Never writes performatively — always honest, warm, direct
- Sometimes uses Jai Gurudev, mentions Vishwananda naturally
- English with occasional warmth from Swedish life

Week date: ${weekDate}
New content/updates in the app this week:
${contentList}

Write the following sections. Each must sound EXACTLY like the real Kritagya — not like a spiritual newsletter, not like marketing. Like a real person writing from their life:

1. SUBJECT LINE (max 8 words, personal, not clickbait)
2. PERSONAL OPENING (3-4 sentences. Start from a real moment — where he is, what's happening in his life or practice this week in Uddevalla. Ground it before mentioning the app at all.)
3. CONTENT INTRO (2-3 sentences bridging from his personal world to what's new in the Nexus this week. Reference the actual content items above. Do not list them — weave them in naturally.)
4. CLOSING (2 sentences. Warm, direct. Sign as Kritagya.)

Format your response as JSON:
{"subject": "...", "personalOpening": "...", "contentIntro": "...", "closing": "..."}
Return only the JSON, nothing else.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 600 },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("[VOICE] Monday generation failed:", e);
    return {
      subject: "Monday — what's new in the Nexus",
      personalOpening: "Writing to you from Uddevalla this Monday morning. The week is beginning quietly here.",
      contentIntro: "We have been working on the Nexus this week.",
      closing: "With love, Kritagya"
    };
  }
}

// ── Generate Friday email with Laila's real voice ─────────────────────────────
async function generateFridayEmail(
  lailaCaptions: string[],
  userSegmentSummary: { consistent: number; returning: number; dormant: number; newSeeker: number },
  weekDate: string,
  geminiKey: string
): Promise<{ subject: string; lailaOpening: string; lailaBody: string; lailaClosing: string; kritagyaAddition: string }> {

  const voiceProfile = buildVoiceProfile("Laila Amrouche", LAILA_VOICE_SEED, lailaCaptions);

  const prompt = `You are writing this week's Friday email from Laila Amrouche to the members of Siddha Quantum Nexus.

${voiceProfile}

Key facts about Laila:
- Singing healer for transformation
- Runs DanceYoga classes, online morning yoga on Mondays
- Warm, embodied, practical — writes to people like they are in the room with her
- Lives in Uddevalla, Sweden with Kritagya and their 3 children
- Connected to Bhakti path through Kritagya but her voice is her own — more feminine, grounded
- Does NOT write in spiritual jargon — writes like a real woman talking to real people
- Her tagline: "listen with your Heart and Remember YOU"

Week date: ${weekDate}
This week's user engagement snapshot:
- ${userSegmentSummary.consistent} members had a strong practice week (3+ sessions)
- ${userSegmentSummary.returning} members are returning after a gap
- ${userSegmentSummary.dormant} members have been away for 2+ weeks
- ${userSegmentSummary.newSeeker} new members joined this week

Friday is Shukra/Venus day in the Vedic tradition. Laila writes knowing this.

Write the following sections in Laila's REAL voice — warm, direct, embodied, like she is actually sitting and writing this:

1. SUBJECT LINE (max 8 words, from Laila, personal)
2. LAILA OPENING (2-3 sentences. Something real from her week or her body or her practice. Not spiritual performance — a real moment.)
3. LAILA BODY (3-4 sentences. She speaks to whoever in the community needs it most this week — the ones struggling, the ones returning, the ones who are new. She doesn't name segments, she speaks to the feeling. References the Mantras, SoulScan, or Jyotish Chamber naturally if relevant.)
4. LAILA CLOSING (1-2 sentences. Her goodbye. Personal.)
5. KRITAGYA ADDITION (1-2 sentences from Kritagya added at the bottom — he always adds a line when Laila writes. Short. Real. Like a husband adding a note.)

Format as JSON:
{"subject": "...", "lailaOpening": "...", "lailaBody": "...", "lailaClosing": "...", "kritagyaAddition": "..."}
Return only the JSON, nothing else.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 600 },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("[VOICE] Friday generation failed:", e);
    return {
      subject: "Friday — from Laila",
      lailaOpening: "Writing to you from our home in Uddevalla.",
      lailaBody: "Friday is here. Wherever you are, I hope you can feel the softness of this day.",
      lailaClosing: "With love, Laila",
      kritagyaAddition: "Jai Gurudev — Kritagya"
    };
  }
}

// ── Main serve ────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const {
      contentItems = [],
      userSegmentSummary = { consistent: 0, returning: 0, dormant: 0, newSeeker: 0 },
      emailType = "both", // "monday", "friday", or "both"
    } = body;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const ghToken = Deno.env.get("GH_TOKEN");
    if (!geminiKey) throw new Error("GEMINI_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const weekDate = new Date().toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    // ── Try to fetch fresh IG captions (graceful fallback to seeds) ──
    const [kritagyaCaptions, lailaCaptions] = await Promise.all([
      ghToken ? fetchInstagramCaptions("kritagya_das", ghToken) : Promise.resolve([]),
      ghToken ? fetchInstagramCaptions("sacredhealingvibration", ghToken) : Promise.resolve([]),
    ]);

    console.log(`[VOICE] Kritagya fresh captions: ${kritagyaCaptions.length}`);
    console.log(`[VOICE] Laila fresh captions: ${lailaCaptions.length}`);

    const result: Record<string, unknown> = { success: true, weekDate };

    // ── Generate Monday email ──
    if (emailType === "monday" || emailType === "both") {
      const monday = await generateMondayEmail(
        kritagyaCaptions, contentItems, weekDate, geminiKey
      );
      result.monday = monday;

      // Store in Supabase for the weekly-digest function to use
      await supabase.from("weekly_email_content").upsert({
        week_start: new Date().toISOString().slice(0, 10),
        email_type: "monday",
        subject: monday.subject,
        personal_opening: monday.personalOpening,
        content_intro: monday.contentIntro,
        closing: monday.closing,
        generated_at: new Date().toISOString(),
      }, { onConflict: "week_start,email_type" });
    }

    // ── Generate Friday email ──
    if (emailType === "friday" || emailType === "both") {
      const friday = await generateFridayEmail(
        lailaCaptions, userSegmentSummary, weekDate, geminiKey
      );
      result.friday = friday;

      await supabase.from("weekly_email_content").upsert({
        week_start: new Date().toISOString().slice(0, 10),
        email_type: "friday",
        subject: friday.subject,
        laila_opening: friday.lailaOpening,
        laila_body: friday.lailaBody,
        laila_closing: friday.lailaClosing,
        kritagya_addition: friday.kritagyaAddition,
        generated_at: new Date().toISOString(),
      }, { onConflict: "week_start,email_type" });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[VOICE-COMPOSER] Fatal:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
