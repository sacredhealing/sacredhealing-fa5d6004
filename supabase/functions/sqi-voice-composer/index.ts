import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ══════════════════════════════════════════════════════════════════
// PERMANENT DEEP VOICE PROFILES
// Built from direct observation: YouTube bio, Instagram captions,
// post patterns, and the way they communicate in real life
// ══════════════════════════════════════════════════════════════════

const KRITAGYA_DEEP_PROFILE = `
KRITAGYA DAS — PERMANENT VOICE PROFILE
Built from: YouTube about page, Instagram captions, post patterns observed June 2026

WHO HE IS:
- Born in Sweden as Adam, Spanish father. Given the name Kritagya Das by his Satguru Paramahamsa Vishwananda
- On the Bhakti path for over 20 years. Father of 3 children raised in Uddevalla on the west coast of Sweden
- Makes Sacred Healing Music with his wife Laila. Has produced music since age 19
- Devoted to the path of Bhakti. Greets with "Jai Gurudev" naturally, not performatively
- Instagram: @kritagya_das — 19.9k followers, 1,368 posts. Mostly reels, almost no long captions
- Bio: "✦ Structural Light Integrity · Siddha Nada · Vedic Light-Codes · Quantum Interface · Recalibrating Your Original Blueprint"

HOW HE ACTUALLY WRITES (real captions and words observed):
- "pleasure to walk with this incredible talented soul — we are coming with a new song soon 🧡🙏⚡⚡"
- "Jai Gurudev! Welcome to my Youtube page! I have been on the spiritual path for over 20 years and I am sharing my experiences to inspire and uplift spiritual seekers across the world."
- "I was born in Sweden as Adam with a Spanish father. When I became a devotee of my beloved Satguru I was given the name Kritagya Das"
- "Life led me to become a healer and a guide for people who feel the call in their hearts."
- "Since a teenager I always felt a deep relationship with music"
- "Together with my wife we have created The Sacred Healing Music. Healing music with mantras, beats, and deeper inspirations that we share with the world."
- "I am also a father of 3 children that we bring up in a joyful spiritual enviroment in the west coast of Sweden"
- "This page will be about everything we do in life. I hope it will bring joy and inspiration to your heart."
- His hashtags: #sacredhealingmusic #vaishnava #hindurap #harekrishna #harerama #vishwananda #paramahamsavishwananda #svgpn #pranayama #selassie #siddhaquantumnexus #mpcx #studioone #gayatrimantra #gayatri

HIS CONTENT CATEGORIES (from grid observation):
- Sacred geometry artwork (Astra-Ghosha 432Hz, Indigo & Gold Scalar Waves, Prema Pulses)
- Face-to-camera reels from his home/studio in Uddevalla — personal and direct
- Music production shots (MPC, studio equipment)
- Devotional content — Nataraja altar, Krishna, Vishwananda teachings
- App development screenshots (Siddha Quantum Nexus)
- Group photos from workshops and retreats

VOICE RULES (critical):
- Does NOT write long spiritual essays. Short, warm, direct.
- Never performative. Never marketing language.
- Often writes in English with warmth from Swedish life
- References his family, his music, his practice as real things — not as content
- When he writes to his community: honest, personal, like talking to people he knows
- He trusts silence — often lets music/video speak instead of captions
- "Sometime agoo" overlaid on a group photo is his style — simple, nostalgic
`;

const LAILA_DEEP_PROFILE = `
LAILA AMROUCHE — PERMANENT VOICE PROFILE
Built from: Instagram @sacredhealingvibration, captions observed June 2026

WHO SHE IS:
- Laila Amrouche. Kritagya's wife. Lives in Uddevalla, Sweden
- Instagram: @sacredhealingvibration — 8,687 followers, 1,921 posts
- Bio: "Singing Healer for Transformation — listen with your Heart and Remember YOU. Tools to master your mind, strengthen..."
- Spotify link in bio — releases music
- Highlights: Podcast, Bhagavad Gita, Grounding, My Music, Home Detox, Life

HOW SHE ACTUALLY WRITES (real captions observed):
- "Sahaja: Total surrender to uninhibited, fluid movement, allowing the body to organically ride the rhythm and dissolve any tension. Come to my DanceYoga Thursdays 16.30 and try it out!"
- "Welcome to online morning yoga! Mondays 07.00 – 07.30. Comment yoga for the invite"
- (Both observed as recent posts June 2026)
- She writes with warmth and practical information mixed. Not vague spiritual talk.
- Short, clear, embodied. She describes WHAT things feel like in the body.
- Uses words like: rhythm, dissolve, tension, surrender, fluid, movement
- Practical details: "Thursdays 16.30", "Mondays 07.00", "Comment yoga for the invite"

HER CONTENT CATEGORIES (from grid observation):
- Face-to-camera — smiling, present, natural
- DanceYoga and movement classes
- Outdoor photos — nature, fresh air
- Family life — photos with Kritagya and children
- Music releases
- Spiritual life mixed with everyday life

VOICE RULES (critical):
- Never writes like a wellness brand. Writes like a PERSON.
- Warm but direct. Gets to the point fast.
- Uses body language in her writing — references feeling, movement, the physical
- Practical + spiritual in the same breath ("come to my DanceYoga Thursdays" is spiritual AND logistical)
- Her tagline captures everything: "listen with your Heart and Remember YOU"
- Does not use spiritual jargon. Uses real language about real experiences.
`;

// ── Generate Monday email from Kritagya ───────────────────────────────────────
async function generateMondayEmail(
  contentItems: Array<{ title: string; type: string; description: string }>,
  weekDate: string,
  geminiKey: string
): Promise<{ subject: string; opening: string; body: string; closing: string }> {

  const contentSection = contentItems.length > 0
    ? `What was worked on / released in the Siddha Quantum Nexus this week:\n${contentItems.map(c => `- ${c.title}: ${c.description}`).join('\n')}`
    : `No major new features this week — general improvements to the Nexus.`;

  const prompt = `${KRITAGYA_DEEP_PROFILE}

TASK: Write this week's Monday email from Kritagya Das to the Siddha Quantum Nexus community.

Week of: ${weekDate}
${contentSection}

CRITICAL RULES:
- Write EXACTLY like Kritagya — warm, short sentences, personal, no marketing language
- Start from somewhere real in his life in Uddevalla — his morning, his practice, his children, his music — before mentioning the app
- Reference actual content/features naturally when relevant — never as a list
- He might mention Vishwananda or "Jai Gurudev" naturally, never forcedly
- Keep it human. Not a newsletter. A letter from a real person.
- Total length: 150-220 words across all sections combined

Write exactly these four sections:

SUBJECT: (6-9 words, personal, from Kritagya, no hype)
OPENING: (2-3 sentences — a real moment from his week, his life, Uddevalla)
BODY: (3-4 sentences — bridges from his personal world to the Nexus, weaves in the content naturally)
CLOSING: (1-2 sentences — warm goodbye, his name)

Respond ONLY as valid JSON:
{"subject":"...","opening":"...","body":"...","closing":"..."}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.2, maxOutputTokens: 700 },
        }),
      }
    );
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("[VOICE] Monday generation failed:", e);
    return {
      subject: "Monday from Uddevalla",
      opening: "Jai Gurudev. Writing to you from home this Monday morning.",
      body: "We have been working in the Nexus this week. Some things have shifted.",
      closing: "With love — Kritagya"
    };
  }
}

// ── Generate Friday email from Laila ─────────────────────────────────────────
async function generateFridayEmail(
  segmentSummary: { consistent: number; returning: number; dormant: number; newSeeker: number },
  weekDate: string,
  geminiKey: string
): Promise<{ subject: string; lailaLetter: string; kritagyaNote: string }> {

  const prompt = `${LAILA_DEEP_PROFILE}

TASK: Write this week's Friday email from Laila Amrouche to the Siddha Quantum Nexus community.

Week of: ${weekDate}
Community this week:
- ${segmentSummary.consistent} members practiced consistently (strong week)
- ${segmentSummary.returning} members are returning after a gap
- ${segmentSummary.dormant} members haven't opened the app in 2+ weeks
- ${segmentSummary.newSeeker} new members joined

CRITICAL RULES:
- Write EXACTLY like Laila — embodied, direct, practical-spiritual, never jargon
- Start from a real physical/personal moment — something in her body, her day, her week in Uddevalla
- Speak to how people are actually feeling this week — without labelling them by segment
- She can reference the Mantras, SoulScan, or Jyotish Chamber naturally if it fits
- Friday is Venus/Shukra day — she knows this and it might come through naturally
- Total: 120-180 words for Laila's letter. 1-2 sentences for Kritagya's addition.
- Kritagya always adds a short note when Laila writes — something real, simple, from him

Write exactly these three sections:

SUBJECT: (6-8 words, from Laila, human, not spiritual-performance)
LAILA_LETTER: (Laila's full letter — 120-180 words)
KRITAGYA_NOTE: (1-2 sentences — Kritagya adding a line at the bottom, signed "Kritagya" or "Jai Gurudev — Kritagya")

Respond ONLY as valid JSON:
{"subject":"...","lailaLetter":"...","kritagyaNote":"..."}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.2, maxOutputTokens: 600 },
        }),
      }
    );
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("[VOICE] Friday generation failed:", e);
    return {
      subject: "Friday — from Laila",
      lailaLetter: "Writing to you from Uddevalla on this Friday. I hope the week has been kind to your body.",
      kritagyaNote: "Jai Gurudev — Kritagya"
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
      emailType = "both",
    } = body;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const weekDate = now.toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const result: Record<string, unknown> = { success: true, weekDate };

    if (emailType === "monday" || emailType === "both") {
      console.log("[VOICE] Generating Monday email from Kritagya...");
      const monday = await generateMondayEmail(contentItems, weekDate, geminiKey);
      result.monday = monday;

      await supabase.from("weekly_email_content").upsert({
        week_start: weekStartStr,
        email_type: "monday",
        subject: monday.subject,
        personal_opening: monday.opening,
        content_intro: monday.body,
        closing: monday.closing,
        generated_at: now.toISOString(),
      }, { onConflict: "week_start,email_type" });

      console.log("[VOICE] Monday subject:", monday.subject);
    }

    if (emailType === "friday" || emailType === "both") {
      console.log("[VOICE] Generating Friday email from Laila...");
      const friday = await generateFridayEmail(userSegmentSummary, weekDate, geminiKey);
      result.friday = friday;

      await supabase.from("weekly_email_content").upsert({
        week_start: weekStartStr,
        email_type: "friday",
        subject: friday.subject,
        laila_opening: friday.lailaLetter,
        kritagya_addition: friday.kritagyaNote,
        generated_at: now.toISOString(),
      }, { onConflict: "week_start,email_type" });

      console.log("[VOICE] Friday subject:", friday.subject);
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
