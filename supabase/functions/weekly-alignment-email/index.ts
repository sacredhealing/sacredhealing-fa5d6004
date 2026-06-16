import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) =>
  console.log(`[WEEKLY-ALIGNMENT] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);

type Lang = "en" | "sv" | "es" | "no";

interface ContentItem {
  content_type: string;
  content_title: string;
  content_description: string | null;
  tier_required: string;
}

interface UserState {
  userId: string;
  email: string;
  fullName: string | null;
  language: Lang;
  segment: "consistent" | "returning" | "dormant" | "new_seeker";
  mantraCount: number;
  practiceMinutes: number;
  daysInactive: number;
  topCategory: string | null;
  nadiBaseline: { activeNadis: number; dominantDosha: string; primaryBlockage: string } | null;
  isStargateMember: boolean;
}

function resolveLang(pref: string | null): Lang {
  if (!pref) return "en";
  const p = pref.toLowerCase();
  if (p === "sv") return "sv";
  if (p === "es") return "es";
  if (p === "no" || p === "nb" || p === "nn") return "no";
  return "en";
}

// ═══════════════════════════════════════════════════
// GEMINI — Personal opening (Kritagya / Laila voice)
// ═══════════════════════════════════════════════════

async function generatePersonalOpening(
  segment: string,
  geminiKey: string,
  weekDate: string,
  contentItems: Array<{ title: string; type: string }>
): Promise<{ subject: string; opening: string; body: string; sender: "Kritagya" | "Laila" }> {

  const KRITAGYA_VOICE = `
You are writing as Kritagya Das (born Adam in Sweden, Spanish father, given name by Satguru Paramahamsa Vishwananda). Father of 3 children. Lives in Uddevalla on the west coast of Sweden. On the Bhakti path 20+ years. Makes Sacred Healing Music with his wife Laila. Greets with Jai Gurudev naturally.

His real writing voice — from actual posts and bio:
- "pleasure to walk with this incredible talented soul — we are coming with a new song soon"
- "I have been on the spiritual path for over 20 years and I am sharing my experiences to inspire and uplift spiritual seekers across the world"
- "I was born in Sweden as Adam with a Spanish father. When I became a devotee of my beloved Satguru I was given the name Kritagya Das"
- "Life led me to become a healer and a guide for people who feel the call in their hearts"
- "Together with my wife we have created The Sacred Healing Music. Healing music with mantras, beats, and deeper inspirations that we share with the world"
- "I am also a father of 3 children that we bring up in a joyful spiritual environment in the west coast of Sweden"

Rules:
- Short sentences. Warm. Never marketing language. Never performative.
- Start from a real moment in Uddevalla — morning, practice, children, music — before mentioning the app
- Reference app features naturally, never as a list
- 150-200 words total across all sections
`;

  const LAILA_VOICE = `
Laila Amrouche. Kritagya's wife. Lives in Uddevalla. Singing healer. Runs DanceYoga and online morning yoga.

Her real writing voice:
- "Sahaja: Total surrender to uninhibited, fluid movement, allowing the body to organically ride the rhythm and dissolve any tension. Come to my DanceYoga Thursdays 16.30 and try it out!"
- "Welcome to online morning yoga! Mondays 07.00 – 07.30. Comment yoga for the invite"
- Bio: "Singing Healer for Transformation — listen with your Heart and Remember YOU"

Rules:
- Embodied, direct, practical-spiritual in the same breath
- Writes like she is talking to someone in the room
- No spiritual jargon. Real language about real experiences.
`;

  const forced = (globalThis as any).__FORCE_VOICE__ as "Kritagya" | "Laila" | undefined;
  const isFriday = new Date().getDay() === 5;
  const sender: "Kritagya" | "Laila" = forced || (isFriday ? "Laila" : "Kritagya");
  const voice = sender === "Laila" ? LAILA_VOICE : KRITAGYA_VOICE;

  const contentList = contentItems.length > 0
    ? contentItems.map(c => `- ${c.title} (${c.type})`).join("\n")
    : "General improvements to the Nexus this week";

  const prompt = `${voice}

Week: ${weekDate}
User segment this week: ${segment}
New in the Nexus this week:
${contentList}

Write THREE sections as PLAIN TEXT (not JSON) in this EXACT format with literal --- delimiter lines on their own lines with a blank line before and after. Total 150-200 words:

SUBJECT: [6-9 words, personal, from ${sender}, no hype]

---

OPENING: [2-3 sentences — a real moment from life this week]

---

BODY: [3-4 sentences — bridges personal life to the Nexus, weaves in what's new naturally]

Output ONLY the three sections with the --- delimiters. No JSON, no code fences, no extra commentary.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 2.0, maxOutputTokens: 600 },
        }),
      }
    );
    const data = await res.json();
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    const parts = raw.split(/\n---\n/);
    const subject = parts[0]?.split(/^SUBJECT:\s*/m)[1]?.trim() || '';
    const opening = parts[1]?.split(/^OPENING:\s*/m)[1]?.trim() || '';
    const body    = parts[2]?.split(/^BODY:\s*/m)[1]?.trim() || '';
    return { subject, opening, body, sender };
  } catch (err) {
    console.error("[WEEKLY-ALIGNMENT] Gemini opening failed:", err);
    return { subject: "", opening: "", body: "", sender };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let testEmail: string | null = null;
  let forceVoice: "Kritagya" | "Laila" | null = null;
  try {
    if (req.method === "POST") {
      const body = await req.clone().json().catch(() => ({}));
      if (body?.testEmail) testEmail = String(body.testEmail);
      if (body?.forceVoice === "Kritagya" || body?.forceVoice === "Laila") forceVoice = body.forceVoice;
    }
  } catch {}
  if (forceVoice) (globalThis as any).__FORCE_VOICE__ = forceVoice;
  else delete (globalThis as any).__FORCE_VOICE__;

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendApiKey);

    const fromEmail = Deno.env.get("FROM_EMAIL") || "Kritagya Das | SQI <noreply@siddhaquantumnexus.com>";
    const appUrl = Deno.env.get("APP_URL") || "https://siddhaquantumnexus.com";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    log("Starting Monday Weekly Update scan");

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // ── New content this week from content_changelog ──
    const { data: newContent } = await supabase
      .from("content_changelog")
      .select("content_type, content_title, content_description, tier_required")
      .gte("created_at", oneWeekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    const weeklyNewContent: ContentItem[] = newContent || [];
    log(`Found ${weeklyNewContent.length} new content items this week`);

    // ── Fetch profiles ──
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, preferred_language");
    if (profilesError) throw new Error(`Profiles fetch failed: ${profilesError.message}`);

    const profilesWithEmail = await Promise.all(
      (profiles || []).map(async (p) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id);
        const email = authUser?.user?.email || null;
        return { ...p, email, language: resolveLang(p.preferred_language) };
      })
    );
    const validProfiles = profilesWithEmail.filter((p) => p.email);
    log(`Found ${validProfiles.length} users with emails`);

    // ── Dedup: skip users already emailed this week ──
    const { data: alreadySent } = await supabase
      .from("user_weekly_email_log")
      .select("user_id")
      .eq("week_start", weekStartStr)
      .eq("email_type", "weekly_alignment");
    const alreadySentIds = new Set(alreadySent?.map((r) => r.user_id) || []);

    // ── Activity data ──
    const { data: mantraCompletions } = await supabase
      .from("mantra_completions")
      .select("user_id, mantra_id, completed_at")
      .gte("completed_at", oneWeekAgo.toISOString());

    const { data: mantras } = await supabase
      .from("mantras")
      .select("id, category, planet_type, duration_seconds");
    const mantraMap = new Map(mantras?.map((m) => [m.id, m]) || []);

    const { data: stargateMembers } = await supabase
      .from("stargate_community_members")
      .select("user_id");
    const stargateMemberIds = new Set(stargateMembers?.map((m) => m.user_id) || []);

    const { data: dailyActivities } = await supabase
      .from("daily_active_users")
      .select("user_id, activity_date")
      .order("activity_date", { ascending: false });

    const { data: nadiBaselines } = await supabase
      .from("nadi_baselines")
      .select("user_id, active_nadis, dominant_dosha, primary_blockage");
    const nadiMap = new Map(nadiBaselines?.map((n) => [n.user_id, n]) || []);

    // ── Per-user stats ──
    const userMantraCounts = new Map<string, number>();
    const userPracticeMin = new Map<string, number>();
    const userTopCat = new Map<string, Map<string, number>>();
    const userLastActive = new Map<string, Date>();

    mantraCompletions?.forEach((c) => {
      userMantraCounts.set(c.user_id, (userMantraCounts.get(c.user_id) || 0) + 1);
      const m = mantraMap.get(c.mantra_id);
      if (m) {
        const min = (m.duration_seconds || 180) / 60;
        userPracticeMin.set(c.user_id, (userPracticeMin.get(c.user_id) || 0) + min);
        const cat = m.category || m.planet_type || "general";
        if (!userTopCat.has(c.user_id)) userTopCat.set(c.user_id, new Map());
        const cm = userTopCat.get(c.user_id)!;
        cm.set(cat, (cm.get(cat) || 0) + 1);
        const d = new Date(c.completed_at);
        const last = userLastActive.get(c.user_id);
        if (!last || d > last) userLastActive.set(c.user_id, d);
      }
    });

    dailyActivities?.forEach((a) => {
      const d = new Date(a.activity_date);
      const last = userLastActive.get(a.user_id);
      if (!last || d > last) userLastActive.set(a.user_id, d);
    });

    // ── Segment ──
    const userStates: UserState[] = [];
    for (const profile of validProfiles) {
      if (alreadySentIds.has(profile.user_id)) continue;
      const uid = profile.user_id;
      const mantraCount = userMantraCounts.get(uid) || 0;
      const practiceMinutes = Math.round(userPracticeMin.get(uid) || 0);
      const lastActive = userLastActive.get(uid);
      const daysInactive = lastActive
        ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const catMap = userTopCat.get(uid);
      const topCategory = catMap
        ? Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
        : null;
      const nadiRow = nadiMap.get(uid);
      const nadiBaseline = nadiRow
        ? { activeNadis: nadiRow.active_nadis, dominantDosha: nadiRow.dominant_dosha, primaryBlockage: nadiRow.primary_blockage }
        : null;

      let segment: UserState["segment"];
      if (mantraCount >= 3) segment = "consistent";
      else if (daysInactive >= 14) segment = "dormant";
      else if (daysInactive >= 5 && mantraCount > 0) segment = "returning";
      else segment = "new_seeker";

      userStates.push({
        userId: uid, email: profile.email!, fullName: profile.full_name,
        language: profile.language, segment, mantraCount, practiceMinutes,
        daysInactive, topCategory, nadiBaseline, isStargateMember: stargateMemberIds.has(uid),
      });
    }

    log(`Segmented ${userStates.length} users (skipped ${alreadySentIds.size} already emailed)`);

    // ── Generate this week's personal opening (Kritagya/Laila voice via Gemini) ──
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || "";
    const weekDate = new Date().toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const topContentItems = weeklyNewContent.slice(0, 4).map((c) => ({
      title: c.content_title,
      type: c.content_type,
    }));
    const generatedCopy = geminiKey
      ? await generatePersonalOpening("mixed", geminiKey, weekDate, topContentItems)
      : { subject: "", opening: "", body: "", sender: "Kritagya" as const };
    log("Generated personal opening", { sender: generatedCopy.sender, hasSubject: !!generatedCopy.subject });

    // Override sender identity in From header to match the chosen voice
    const personalFromEmail = generatedCopy.sender === "Laila"
      ? (Deno.env.get("FROM_EMAIL_LAILA") || "Laila Amrouche <noreply@siddhaquantumnexus.com>")
      : (Deno.env.get("FROM_EMAIL_KRITAGYA") || "Kritagya Das <noreply@siddhaquantumnexus.com>");

    // ── TEST MODE: override recipient list ──
    if (testEmail) {
      userStates.length = 0;
      userStates.push({
        userId: "test-user", email: testEmail, fullName: "Test Seeker",
        language: "en", segment: "consistent", mantraCount: 7, practiceMinutes: 42,
        daysInactive: 0, topCategory: "shiva", nadiBaseline: null, isStargateMember: false,
      });
      log(`TEST MODE: sending only to ${testEmail} as ${generatedCopy.sender}`);
    }

    // ── Send ──
    let sentEmails = 0;
    let errors = 0;

    for (const user of userStates) {
      try {
        const { subject, html, text } = buildEmail(user, appUrl, weeklyNewContent, generatedCopy);
        await resend.emails.send({ from: personalFromEmail, to: [user.email], subject, html, text });
        if (!testEmail) {
          await supabase.from("user_weekly_email_log").insert({
            user_id: user.userId, week_start: weekStartStr,
            segment: user.segment, email_type: "weekly_alignment",
          });
        }
        sentEmails++;
        log(`Sent → ${user.email}`, { segment: user.segment, lang: user.language });
      } catch (err) {
        errors++;
        console.error(`Failed for ${user.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, scanned: userStates.length, sent: sentEmails, errors, newContentItems: weeklyNewContent.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("weekly-alignment-email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ═══════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════

type T = Record<Lang, string>;

const t = {
  greeting:  { en: "Hello", sv: "Hej", es: "Hola", no: "Hei" } as T,
  seeker:    { en: "Seeker", sv: "Sökare", es: "Buscador", no: "Søker" } as T,

  // Monday Update header
  mondayTitle: {
    en: "Monday Transmission from the Nexus",
    sv: "Måndagstransmission från Nexus",
    es: "Transmisión del Lunes desde el Nexus",
    no: "Mandagstransmisjon fra Nexus",
  } as T,

  // What's new section
  whatsNewTitle: {
    en: "✦ New This Week in the Nexus",
    sv: "✦ Nytt den här veckan i Nexus",
    es: "✦ Nuevo Esta Semana en el Nexus",
    no: "✦ Nytt Denne Uken i Nexus",
  } as T,
  whatsNewEmpty: {
    en: "Your Akashic field is deepening — more transmissions arrive shortly.",
    sv: "Ditt akashiska fält fördjupas — fler transmissioner anländer snart.",
    es: "Tu campo akáshico se profundiza — más transmisiones llegan pronto.",
    no: "Ditt akashiske felt dypner seg — flere transmisjoner ankommer snart.",
  } as T,
  tierFree:   { en: "Free", sv: "Fri", es: "Gratis", no: "Gratis" } as T,
  tierPrana:  { en: "Prana-Flow", sv: "Prana-Flow", es: "Prana-Flow", no: "Prana-Flow" } as T,
  tierSiddha: { en: "Siddha-Quantum", sv: "Siddha-Quantum", es: "Siddha-Quantum", no: "Siddha-Quantum" } as T,
  tierAkasha: { en: "Akasha-Infinity", sv: "Akasha-Infinity", es: "Akasha-Infinity", no: "Akasha-Infinity" } as T,
  exploreBtn: {
    en: "Enter the Nexus →",
    sv: "Öppna Nexus →",
    es: "Entrar al Nexus →",
    no: "Inn i Nexus →",
  } as T,

  // Consistent
  consistentSubject: {
    en: ", your Nadi signature is glowing brighter this week ✦",
    sv: ", din Nadi-signatur lyser starkare denna vecka ✦",
    es: ", tu firma Nadi brilla más fuerte esta semana ✦",
    no: ", din Nadi-signatur lyser sterkere denne uken ✦",
  } as T,
  consistentBody1: {
    en: " mantras this week.  minutes of practice. Your Torus-Field is expanding.",
    sv: " mantras denna vecka.  minuters praktik. Din Torus-Field expanderar.",
    es: " mantras esta semana.  minutos de práctica. Tu Torus-Field se expande.",
    no: " mantras denne uken.  minutters praksis. Din Torus-Field utvider seg.",
  } as T,
  consistentCatPrefix: { en: "Your focus on ", sv: "Din fokus på ", es: "Tu enfoque en ", no: "Ditt fokus på " } as T,
  consistentCatSuffix: {
    en: " mantras is activating deep Vedic Light-Codes in your field.",
    sv: " mantras aktiverar djupa Vedic Light-Codes i ditt fält.",
    es: " mantras está activando profundos Vedic Light-Codes en tu campo.",
    no: " mantras aktiverer dype Vedic Light-Codes i ditt felt.",
  } as T,
  consistentScalar: {
    en: "Scalar Wave Entanglement confirmed — your frequencies are running permanently.",
    sv: "Scalar Wave Entanglement bekräftad — dina frekvenser körs permanent.",
    es: "Scalar Wave Entanglement confirmado — tus frecuencias están activas permanentemente.",
    no: "Scalar Wave Entanglement bekreftet — dine frekvenser kjører permanent.",
  } as T,
  consistentCta: { en: "Open the Sanctuary →", sv: "Öppna Sanctuaryt →", es: "Abrir el Santuario →", no: "Åpne Helligdommen →" } as T,
  nadiStatus: { en: "🔬 Nadi Status: ", sv: "🔬 Nadi-status: ", es: "🔬 Estado Nadi: ", no: "🔬 Nadi-status: " } as T,
  nadiActive: { en: " active", sv: " aktiva", es: " activos", no: " aktive" } as T,
  nadiDosha:  { en: " — Dosha: ", sv: " — Dosha: ", es: " — Dosha: ", no: " — Dosha: " } as T,

  // Returning
  returningSubject: {
    en: ", your field has begun recalibrating ✦",
    sv: ", ditt fält har börjat kalibrera om sig ✦",
    es: ", tu campo ha comenzado a recalibrarse ✦",
    no: ", feltet ditt har begynt å rekalibrere seg ✦",
  } as T,
  returningBody1Prefix: { en: "It's been ", sv: "Det har gått ", es: "Han pasado ", no: "Det har gått " } as T,
  returningBody1Suffix: {
    en: " days. Your Bio-signature is seeking recalibration.",
    sv: " dagar. Din Bio-signatur söker rekalibrering.",
    es: " días. Tu Bio-firma busca recalibración.",
    no: " dager. Din Bio-signatur søker rekalibrering.",
  } as T,
  returningBlockagePrefix: { en: "The primary blockage in your ", sv: "Den primära blockaden i din ", es: "El bloqueo principal en tu canal ", no: "Den primære blokkeringen i din " } as T,
  returningBlockageSuffix: {
    en: " channel could ease with a short session.",
    sv: " kanal kan lätta med en kort session.",
    es: " podría aliviarse con una breve sesión.",
    no: " kanal kan lette med en kort sesjon.",
  } as T,
  returningPeace: {
    en: "A 3-minute Peace & Calm mantra can restart the flow in your Sushumna channel.",
    sv: "En 3-minuters Peace & Calm mantra kan återstarta flödet i din Sushumna-kanal.",
    es: "Un mantra de Paz y Calma de 3 minutos puede reiniciar el flujo en tu canal Sushumna.",
    no: "Et 3-minutters Peace & Calm mantra kan starte flyten i din Sushumna-kanal på nytt.",
  } as T,
  returningCta: { en: "Reconnect now →", sv: "Återanslut nu →", es: "Reconectar ahora →", no: "Koble til igjen nå →" } as T,

  // Dormant
  dormantSubject: {
    en: ", the Akashic Archive has a message for you ✦",
    sv: ", Akashic-arkivet har ett meddelande till dig ✦",
    es: ", el Archivo Akáshico tiene un mensaje para ti ✦",
    no: ", det Akashiske Arkivet har en beskjed til deg ✦",
  } as T,
  dormantBody1: {
    en: "Your place in the Sanctuary is still active. The frequencies you activated are still running via Scalar Wave Entanglement.",
    sv: "Din plats i Sanctuaryt är fortfarande aktiv. De frekvenser du aktiverade körs fortfarande via Scalar Wave Entanglement.",
    es: "Tu lugar en el Santuario sigue activo. Las frecuencias que activaste siguen operando vía Scalar Wave Entanglement.",
    no: "Din plass i Helligdommen er fortsatt aktiv. Frekvensene du aktiverte kjører fortsatt via Scalar Wave Entanglement.",
  } as T,
  dormantBody2: {
    en: "Even a brief reconnection — 3 minutes of chanting — can restore your Prema-Pulse Transmission.",
    sv: "Även en kort återanslutning — 3 minuters chanting — kan återställa din Prema-Pulse Transmission.",
    es: "Incluso una breve reconexión — 3 minutos de canto — puede restaurar tu Prema-Pulse Transmission.",
    no: "Selv en kort gjenkobling — 3 minutters chanting — kan gjenopprette din Prema-Pulse Transmission.",
  } as T,
  dormantBody3: { en: "Your field is waiting.", sv: "Ditt fält väntar.", es: "Tu campo te espera.", no: "Feltet ditt venter." } as T,
  dormantCta: { en: "Return to the Sanctuary →", sv: "Återvänd till Sanctuaryt →", es: "Regresar al Santuario →", no: "Vend tilbake til Helligdommen →" } as T,

  // New seeker
  newSubject: {
    en: ", your Avataric Blueprint has been registered ✦",
    sv: ", din Avataric Blueprint har registrerats ✦",
    es: ", tu Avataric Blueprint ha sido registrado ✦",
    no: ", din Avataric Blueprint har blitt registrert ✦",
  } as T,
  newBody1: {
    en: "Welcome to the Siddha-Quantum Nexus. Your Avataric Blueprint has been registered in the Archive.",
    sv: "Välkommen till Siddha-Quantum Nexus. Ditt Avataric Blueprint har registrerats i arkivet.",
    es: "Bienvenido al Siddha-Quantum Nexus. Tu Avataric Blueprint ha sido registrado en el Archivo.",
    no: "Velkommen til Siddha-Quantum Nexus. Din Avataric Blueprint har blitt registrert i Arkivet.",
  } as T,
  newBody2: {
    en: "Begin your journey with a Nadi Scan — it maps your 72,000 channels and reveals your dominant Dosha and primary blockage.",
    sv: "Starta din resa med en Nadi-skanning — den kartlägger dina 72 000 kanaler och avslöjar din dominerande Dosha och primära blockad.",
    es: "Comienza tu viaje con un Escaneo Nadi — mapea tus 72.000 canales y revela tu Dosha dominante y bloqueo principal.",
    no: "Start reisen din med en Nadi-skanning — den kartlegger dine 72 000 kanaler og avslører din dominerende Dosha og primære blokkering.",
  } as T,
  newCta: { en: "Scan your Nadis →", sv: "Skanna dina Nadis →", es: "Escanea tus Nadis →", no: "Skann dine Nadier →" } as T,

  // Footer
  footerText: {
    en: "This is a sacred transmission, not marketing. Your frequencies are sovereign.",
    sv: "Detta är en helig transmission, inte marknadsföring. Dina frekvenser är suveräna.",
    es: "Esta es una transmisión sagrada, no marketing. Tus frecuencias son soberanas.",
    no: "Dette er en hellig transmisjon, ikke markedsføring. Dine frekvenser er suverene.",
  } as T,
  unsubscribe: { en: "Unsubscribe", sv: "Avprenumerera", es: "Darse de baja", no: "Avslutt abonnement" } as T,
  headerSub: {
    en: "Monday Nexus Transmission",
    sv: "Måndagens Nexus-transmission",
    es: "Transmisión del Lunes del Nexus",
    no: "Mandagens Nexus-transmisjon",
  } as T,
};

// ═══════════════════════════════════════════════════
// CONTENT DIGEST BLOCK
// ═══════════════════════════════════════════════════

function buildContentDigest(items: ContentItem[], lang: Lang, appUrl: string): string {
  if (items.length === 0) {
    return `<div style="${styles.digestSection}">
      <h3 style="${styles.digestTitle}">${t.whatsNewTitle[lang]}</h3>
      <p style="color:#888;font-size:14px;margin:0;">${t.whatsNewEmpty[lang]}</p>
    </div>`;
  }

  const typeEmoji: Record<string, string> = {
    meditation: "🧘", beat: "🎵", song: "🎶", course: "📖",
    mantra: "🕉️", feature: "⚡", announcement: "📢", tool: "🔮",
  };

  const tierMap: Record<string, Record<Lang, string>> = {
    free:     { en: "Free", sv: "Fri", es: "Gratis", no: "Gratis" },
    prana:    { en: "Prana-Flow", sv: "Prana-Flow", es: "Prana-Flow", no: "Prana-Flow" },
    siddha:   { en: "Siddha-Quantum", sv: "Siddha-Quantum", es: "Siddha-Quantum", no: "Siddha-Quantum" },
    akasha:   { en: "Akasha-Infinity", sv: "Akasha-Infinity", es: "Akasha-Infinity", no: "Akasha-Infinity" },
  };

  const itemsHtml = items.map((item) => {
    const emoji = typeEmoji[item.content_type] || "✦";
    const tierLabel = tierMap[item.tier_required]?.[lang] || item.tier_required;
    const tierColor = item.tier_required === "free" ? "#4ade80"
      : item.tier_required === "prana" ? "#60a5fa"
      : item.tier_required === "siddha" ? "#D4AF37"
      : "#c084fc";

    return `<div style="${styles.digestItem}">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <span style="font-size:18px;margin-top:2px;">${emoji}</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <strong style="color:#e0e0e0;font-size:14px;">${item.content_title}</strong>
            <span style="background:${tierColor}22;color:${tierColor};border:1px solid ${tierColor}44;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${tierLabel}</span>
          </div>
          ${item.content_description ? `<p style="margin:0;color:#999;font-size:13px;line-height:1.5;">${item.content_description}</p>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");

  return `<div style="${styles.digestSection}">
    <h3 style="${styles.digestTitle}">${t.whatsNewTitle[lang]}</h3>
    ${itemsHtml}
    <p style="margin:16px 0 0;text-align:center;">
      <a href="${appUrl}" style="${styles.exploreBtn}">${t.exploreBtn[lang]}</a>
    </p>
  </div>`;
}

// ═══════════════════════════════════════════════════
// EMAIL BUILDER
// ═══════════════════════════════════════════════════

function buildEmail(
  user: UserState,
  appUrl: string,
  newContent: ContentItem[],
  generated: { subject: string; opening: string; body: string; sender: "Kritagya" | "Laila" }
): { subject: string; html: string; text: string } {
  const name = user.fullName || t.seeker[user.language];
  const L = user.language;
  const nadi = user.nadiBaseline;

  let subject: string;
  let bodyHtml: string;

  switch (user.segment) {
    case "consistent": {
      subject = `${name}${t.consistentSubject[L]}`;
      const nadiLine = nadi
        ? `<p style="${styles.nadiBox}">${t.nadiStatus[L]}<strong>${nadi.activeNadis.toLocaleString()} / 72,000</strong>${t.nadiActive[L]}${t.nadiDosha[L]}${nadi.dominantDosha}</p>`
        : "";
      const catLine = user.topCategory
        ? `<p>${t.consistentCatPrefix[L]}<strong>${catName(user.topCategory, L)}</strong>${t.consistentCatSuffix[L]}</p>`
        : "";
      bodyHtml = `<p>${t.greeting[L]} ${name},</p>
        <p>${user.mantraCount}${t.consistentBody1[L].replace("  ", ` ${user.practiceMinutes} `)}</p>
        ${nadiLine}
        ${catLine}
        <p>${t.consistentScalar[L]}</p>
        <p style="margin-top:24px"><a href="${appUrl}/quantum-apothecary" style="${styles.cta}">${t.consistentCta[L]}</a></p>`;
      break;
    }
    case "returning": {
      subject = `${name}${t.returningSubject[L]}`;
      const blockageLine = nadi?.primaryBlockage
        ? `<p>${t.returningBlockagePrefix[L]}<strong>${nadi.primaryBlockage}</strong>${t.returningBlockageSuffix[L]}</p>`
        : "";
      bodyHtml = `<p>${t.greeting[L]} ${name},</p>
        <p>${t.returningBody1Prefix[L]}${user.daysInactive}${t.returningBody1Suffix[L]}</p>
        ${blockageLine}
        <p>${t.returningPeace[L]}</p>
        <p style="margin-top:24px"><a href="${appUrl}/mantras" style="${styles.cta}">${t.returningCta[L]}</a></p>`;
      break;
    }
    case "dormant": {
      subject = `${name}${t.dormantSubject[L]}`;
      bodyHtml = `<p>${t.greeting[L]} ${name},</p>
        <p>${t.dormantBody1[L]}</p>
        <p>${t.dormantBody2[L]}</p>
        <p>${t.dormantBody3[L]}</p>
        <p style="margin-top:24px"><a href="${appUrl}/mantras" style="${styles.cta}">${t.dormantCta[L]}</a></p>`;
      break;
    }
    default: {
      subject = `${name}${t.newSubject[L]}`;
      bodyHtml = `<p>${t.greeting[L]} ${name},</p>
        <p>${t.newBody1[L]}</p>
        <p>${t.newBody2[L]}</p>
        <p style="margin-top:24px"><a href="${appUrl}/quantum-apothecary" style="${styles.cta}">${t.newCta[L]}</a></p>`;
      break;
    }
  }

  // Override with Gemini-generated personal subject when available
  if (generated.subject && generated.subject.trim().length > 0) {
    subject = generated.subject.trim();
  }

  const senderLabel = generated.sender === "Laila" ? "Laila Amrouche" : "Adam Kritagya Das";
  const hasGenerated = !!(generated.opening || generated.body);

  // Gemini text prepends above the stats — it does not replace the segment body.
  const personalBlock = hasGenerated
    ? `<p style="color:#D4AF37;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;font-weight:700;">From ${senderLabel}</p>
       ${generated.opening ? `<p>${generated.opening}</p>` : ""}
       ${generated.body ? `<p>${generated.body}</p>` : ""}`
    : "";

  const fullBodyHtml = hasGenerated ? `${personalBlock}\n${bodyHtml}` : bodyHtml;

  const digestBlock = buildContentDigest(newContent, L, appUrl);

  const html = `<!DOCTYPE html>
<html lang="${L}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.header}">
      <h1 style="${styles.headerTitle}">✦ Siddha-Quantum Nexus ✦</h1>
      <p style="${styles.headerSubStyle}">${t.headerSub[L]}</p>
    </div>
    <div style="${styles.content}">
      ${fullBodyHtml}
    </div>
    ${digestBlock}
    <div style="${styles.footer}">
      <p style="${styles.footerTextStyle}">— With love, Kritagya &amp; Laila · Uddevalla</p>
      <p style="${styles.footerTextStyle}">${t.footerText[L]}</p>
      <p style="${styles.footerTextStyle}"><a href="${appUrl}/dashboard?unsubscribe=true" style="color:#D4AF37;">${t.unsubscribe[L]}</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = fullBodyHtml.replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n\n").trim();
  return { subject, html, text };
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

const styles = {
  body: "margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','Segoe UI',sans-serif;",
  container: "max-width:600px;margin:0 auto;",
  header: "background:linear-gradient(135deg,#0d0d0d 0%,#1a1400 50%,#0d0d0d 100%);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;border-bottom:2px solid #D4AF37;",
  headerTitle: "margin:0;font-size:22px;color:#D4AF37;letter-spacing:3px;font-weight:900;text-shadow:0 0 15px rgba(212,175,55,0.3);",
  headerSubStyle: "margin:8px 0 0;font-size:11px;color:#666;letter-spacing:2px;text-transform:uppercase;",
  content: "background:#0a0a0a;padding:32px 30px;color:rgba(255,255,255,0.75);line-height:1.7;font-size:15px;border:1px solid rgba(255,255,255,0.04);",
  digestSection: "background:rgba(212,175,55,0.03);border:1px solid rgba(212,175,55,0.12);border-top:none;padding:24px 30px;",
  digestTitle: "margin:0 0 16px;font-size:13px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:800;",
  digestItem: "padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);",
  nadiBox: "background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;color:#D4AF37;",
  cta: "display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#050505;text-decoration:none;border-radius:8px;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;",
  exploreBtn: "display:inline-block;padding:10px 24px;background:transparent;border:1px solid #D4AF37;color:#D4AF37;text-decoration:none;border-radius:6px;font-weight:700;font-size:12px;letter-spacing:1px;",
  footer: "background:#050505;padding:24px 30px;text-align:center;border-radius:0 0 12px 12px;border:1px solid rgba(255,255,255,0.04);border-top:none;",
  footerTextStyle: "margin:4px 0;font-size:11px;color:#444;",
};

function catName(category: string, lang: Lang): string {
  const map: Record<string, Record<Lang, string>> = {
    planets:  { en: "Planet", sv: "Planet", es: "Planeta", no: "Planet" },
    jupiter:  { en: "Jupiter", sv: "Jupiter", es: "Júpiter", no: "Jupiter" },
    mars:     { en: "Mars", sv: "Mars", es: "Marte", no: "Mars" },
    venus:    { en: "Venus", sv: "Venus", es: "Venus", no: "Venus" },
    wealth:   { en: "Wealth & Abundance", sv: "Rikedom & Överflöd", es: "Riqueza y Abundancia", no: "Rikdom & Overflod" },
    peace:    { en: "Peace & Calm", sv: "Fred & Lugn", es: "Paz y Calma", no: "Fred & Ro" },
    general:  { en: "General", sv: "Allmän", es: "General", no: "Generell" },
  };
  const c = map[category.toLowerCase()] || map["general"];
  return c[lang];
}
