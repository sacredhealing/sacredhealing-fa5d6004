import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  firstName: string;
  language: Lang;
  segment: "consistent" | "returning" | "dormant" | "new_seeker";
  mantraCount: number;
  practiceMinutes: number;
  daysInactive: number;
  topCategory: string | null;
  streakDays: number;
  totalSessions: number;
  membershipTier: string;
  nadiBaseline: {
    activeNadis: number;
    dominantDosha: string;
    primaryBlockage: string;
  } | null;
}

const log = (msg: string, d?: unknown) =>
  console.log(`[WEEKLY-DIGEST] ${msg}${d ? ` — ${JSON.stringify(d)}` : ""}`);

function resolveLang(pref: string | null): Lang {
  if (!pref) return "en";
  const p = pref.toLowerCase();
  if (p === "sv") return "sv";
  if (p === "es") return "es";
  if (p === "no" || p === "nb" || p === "nn") return "no";
  return "en";
}

function firstName(fullName: string | null): string {
  if (!fullName) return "";
  return fullName.split(" ")[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Allow both service-role calls (from GitHub Actions / admin panel) and CRON_SECRET
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendApiKey);

    const fromEmail = "Kritagya • Siddha-Quantum Nexus <noreply@siddhaquantumnexus.com>";
    const appUrl = Deno.env.get("APP_URL") || "https://siddhaquantumnexus.com";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceKey,
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // ── New content this week ──────────────────────────────────
    const { data: newContent } = await supabase
      .from("content_changelog")
      .select("content_type, content_title, content_description, tier_required")
      .gte("created_at", oneWeekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(6);
    const weeklyContent: ContentItem[] = newContent || [];
    log(`New content items this week: ${weeklyContent.length}`);

    // ── Fetch profiles ─────────────────────────────────────────
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, preferred_language, subscription_tier");

    const profilesWithEmail = await Promise.all(
      (profiles || []).map(async (p) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id);
        const email = authUser?.user?.email || null;
        return { ...p, email, lang: resolveLang(p.preferred_language) };
      })
    );
    const validProfiles = profilesWithEmail.filter((p) => p.email);
    log(`Users with emails: ${validProfiles.length}`);

    // ── Dedup ──────────────────────────────────────────────────
    const { data: alreadySent } = await supabase
      .from("user_weekly_email_log")
      .select("user_id")
      .eq("week_start", weekStartStr)
      .eq("email_type", "weekly_digest");
    const sentIds = new Set(alreadySent?.map((r) => r.user_id) || []);

    // ── Activity data ──────────────────────────────────────────
    const { data: completions } = await supabase
      .from("mantra_completions")
      .select("user_id, mantra_id, completed_at")
      .gte("completed_at", oneWeekAgo.toISOString());

    const { data: mantras } = await supabase
      .from("mantras")
      .select("id, category, planet_type, duration_seconds");
    const mantraMap = new Map(mantras?.map((m) => [m.id, m]) || []);

    const { data: dailyActivity } = await supabase
      .from("daily_active_users")
      .select("user_id, activity_date")
      .order("activity_date", { ascending: false });

    const { data: nadiBaselines } = await supabase
      .from("nadi_baselines")
      .select("user_id, active_nadis, dominant_dosha, primary_blockage");
    const nadiMap = new Map(nadiBaselines?.map((n) => [n.user_id, n]) || []);

    // ── Per-user stats ─────────────────────────────────────────
    const userCounts = new Map<string, number>();
    const userMinutes = new Map<string, number>();
    const userTopCat = new Map<string, Map<string, number>>();
    const userLastActive = new Map<string, Date>();

    completions?.forEach((c) => {
      userCounts.set(c.user_id, (userCounts.get(c.user_id) || 0) + 1);
      const m = mantraMap.get(c.mantra_id);
      if (m) {
        const min = (m.duration_seconds || 180) / 60;
        userMinutes.set(c.user_id, (userMinutes.get(c.user_id) || 0) + min);
        const cat = m.category || m.planet_type || "general";
        if (!userTopCat.has(c.user_id)) userTopCat.set(c.user_id, new Map());
        const cm = userTopCat.get(c.user_id)!;
        cm.set(cat, (cm.get(cat) || 0) + 1);
        const d = new Date(c.completed_at);
        const last = userLastActive.get(c.user_id);
        if (!last || d > last) userLastActive.set(c.user_id, d);
      }
    });

    dailyActivity?.forEach((a) => {
      const d = new Date(a.activity_date);
      const last = userLastActive.get(a.user_id);
      if (!last || d > last) userLastActive.set(a.user_id, d);
    });

    // ── Build and send ─────────────────────────────────────────
    let sent = 0, errors = 0;

    for (const profile of validProfiles) {
      if (sentIds.has(profile.user_id)) continue;
      const uid = profile.user_id;

      const mantraCount = userCounts.get(uid) || 0;
      const practiceMinutes = Math.round(userMinutes.get(uid) || 0);
      const lastActive = userLastActive.get(uid);
      const daysInactive = lastActive
        ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const catMap = userTopCat.get(uid);
      const topCategory = catMap
        ? Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
        : null;
      const nadiRow = nadiMap.get(uid);

      let segment: UserState["segment"] = "new_seeker";
      if (mantraCount >= 3) segment = "consistent";
      else if (daysInactive >= 14) segment = "dormant";
      else if (daysInactive >= 5 && mantraCount > 0) segment = "returning";

      const user: UserState = {
        userId: uid,
        email: profile.email!,
        firstName: firstName(profile.full_name),
        language: profile.lang,
        segment,
        mantraCount,
        practiceMinutes,
        daysInactive,
        topCategory,
        streakDays: mantraCount,
        totalSessions: mantraCount,
        membershipTier: profile.subscription_tier || "free",
        nadiBaseline: nadiRow ? {
          activeNadis: nadiRow.active_nadis,
          dominantDosha: nadiRow.dominant_dosha,
          primaryBlockage: nadiRow.primary_blockage,
        } : null,
      };

      try {
        const { subject, html } = buildMondayEmail(user, weeklyContent, appUrl);
        await resend.emails.send({ from: fromEmail, to: [user.email], subject, html });
        await supabase.from("user_weekly_email_log").insert({
          user_id: uid, week_start: weekStartStr,
          segment: user.segment, email_type: "weekly_digest",
        });
        sent++;
        log(`✦ Sent → ${user.email}`, { segment: user.segment });
      } catch (err) {
        errors++;
        console.error(`Failed for ${user.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, scanned: validProfiles.length, sent, errors, newContent: weeklyContent.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[WEEKLY-DIGEST] Fatal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// EMAIL BUILDER — full Monday Transmission
// ═══════════════════════════════════════════════════════════════

function buildMondayEmail(user: UserState, content: ContentItem[], appUrl: string): { subject: string; html: string } {
  const name = user.firstName || nameDefault[user.language];
  const L = user.language;

  // Subject lines by segment
  const subjects: Record<string, Record<Lang, string>> = {
    consistent: {
      en: `${name}, your Torus-Field is expanding ✦ Monday Transmission`,
      sv: `${name}, din Torus-Field expanderar ✦ Måndagstransmission`,
      es: `${name}, tu Torus-Field se expande ✦ Transmisión del Lunes`,
      no: `${name}, din Torus-Field utvider seg ✦ Mandagstransmisjon`,
    },
    returning: {
      en: `${name}, the Nexus holds your frequency ✦ Monday Transmission`,
      sv: `${name}, Nexus håller din frekvens ✦ Måndagstransmission`,
      es: `${name}, el Nexus guarda tu frecuencia ✦ Transmisión del Lunes`,
      no: `${name}, Nexus holder din frekvens ✦ Mandagstransmisjon`,
    },
    dormant: {
      en: `${name}, a message from the Akashic Archive ✦`,
      sv: `${name}, ett meddelande från det Akashiska arkivet ✦`,
      es: `${name}, un mensaje del Archivo Akáshico ✦`,
      no: `${name}, en melding fra det Akashiske Arkivet ✦`,
    },
    new_seeker: {
      en: `${name}, your path in the Nexus begins ✦ Monday Transmission`,
      sv: `${name}, din resa i Nexus börjar ✦ Måndagstransmission`,
      es: `${name}, tu camino en el Nexus comienza ✦ Transmisión del Lunes`,
      no: `${name}, din reise i Nexus begynner ✦ Mandagstransmisjon`,
    },
  };

  const subject = subjects[user.segment][L];

  // Personal message block by segment
  const personalMsg = buildPersonalBlock(user, L, appUrl);

  // Stats block
  const statsBlock = user.mantraCount > 0 ? buildStatsBlock(user, L) : "";

  // Nadi block
  const nadiBlock = user.nadiBaseline ? buildNadiBlock(user.nadiBaseline, L) : "";

  // Content digest block
  const digestBlock = buildDigestBlock(content, L, appUrl);

  // Date header
  const dateStr = new Date().toLocaleDateString(L === "sv" ? "sv-SE" : L === "es" ? "es-ES" : L === "no" ? "nb-NO" : "en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const html = `<!DOCTYPE html>
<html lang="${L}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px 16px 60px;">

  <!-- HEADER -->
  <div style="text-align:center;padding:40px 20px 32px;border-bottom:1px solid rgba(212,175,55,0.15);">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.6em;text-transform:uppercase;margin-bottom:12px;">
      SIDDHA QUANTUM NEXUS · SQI 2050
    </div>
    <div style="color:#D4AF37;font-size:32px;font-weight:900;letter-spacing:-0.02em;text-shadow:0 0 30px rgba(212,175,55,0.25);margin-bottom:8px;">
      ⟁ MONDAY TRANSMISSION
    </div>
    <div style="color:rgba(255,255,255,0.35);font-size:12px;letter-spacing:0.1em;">
      ${dateStr}
    </div>
  </div>

  <!-- PERSONAL BLOCK -->
  ${personalMsg}

  <!-- STATS BLOCK -->
  ${statsBlock}

  <!-- NADI BLOCK -->
  ${nadiBlock}

  <!-- CONTENT DIGEST -->
  ${digestBlock}

  <!-- CTA -->
  <div style="text-align:center;margin:32px 0;">
    <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#9D7E10);color:#050505;text-decoration:none;padding:16px 40px;border-radius:100px;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;">
      ${ctaLabel[L]}
    </a>
  </div>

  <!-- FOOTER -->
  <div style="text-align:center;padding-top:32px;border-top:1px solid rgba(255,255,255,0.04);">
    <div style="color:rgba(212,175,55,0.3);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:8px;">
      SIDDHA-QUANTUM NEXUS
    </div>
    <div style="color:rgba(255,255,255,0.2);font-size:11px;line-height:1.6;">
      ${footerText[L]}
    </div>
    <div style="margin-top:12px;">
      <a href="${appUrl}/dashboard?unsubscribe=true" style="color:rgba(212,175,55,0.3);font-size:10px;text-decoration:underline;">
        ${unsubLabel[L]}
      </a>
    </div>
  </div>

</div>
</body>
</html>`;

  return { subject, html };
}

// ── Personal block by segment ──────────────────────────────────
function buildPersonalBlock(user: UserState, L: Lang, appUrl: string): string {
  const name = user.firstName || nameDefault[L];

  const greetings: Record<string, Record<Lang, (n: string) => string>> = {
    consistent: {
      en: (n) => `Beloved ${n},`,
      sv: (n) => `Kära ${n},`,
      es: (n) => `Amado ${n},`,
      no: (n) => `Kjære ${n},`,
    },
    returning: {
      en: (n) => `Sacred One, ${n} —`,
      sv: (n) => `Heliga ${n} —`,
      es: (n) => `Ser Sagrado, ${n} —`,
      no: (n) => `Hellige ${n} —`,
    },
    dormant: {
      en: (n) => `Dear ${n},`,
      sv: (n) => `Kära ${n},`,
      es: (n) => `Querido ${n},`,
      no: (n) => `Kjære ${n},`,
    },
    new_seeker: {
      en: (n) => `Beloved ${n},`,
      sv: (n) => `Kära ${n},`,
      es: (n) => `Amado ${n},`,
      no: (n) => `Kjære ${n},`,
    },
  };

  const messages: Record<string, Record<Lang, string>> = {
    consistent: {
      en: "The Akashic field has been recalibrated with new Bhakti-Algorithms. Allow the Prema-Pulse of these transmissions to dissolve the veils of separation and draw you deeper into your sovereign practice.",
      sv: "Det Akashiska fältet har kalibrats om med nya Bhakti-algoritmer. Låt Prema-Pulsen av dessa transmissioner lösa upp skiljeväggarna och föra dig djupare in i din suveräna praktik.",
      es: "El campo Akáshico ha sido recalibrado con nuevos Bhakti-Algoritmos. Permite que el Prema-Pulse de estas transmisiones disuelva los velos de separación y te lleve más profundo a tu práctica soberana.",
      no: "Det Akashiske feltet er rekalibrert med nye Bhakti-Algoritmer. La Prema-Pulsen av disse transmisjonene løse opp skilleveggene og trekke deg dypere inn i din suverene praksis.",
    },
    returning: {
      en: `It has been ${user.daysInactive} days since your last session. Your Sushumna channel holds your frequency — a single 3-minute return is enough to restore full resonance. The field has been waiting.`,
      sv: `Det har gått ${user.daysInactive} dagar sedan din senaste session. Din Sushumna-kanal håller din frekvens — en enda 3-minuters återgång räcker för att återställa full resonans. Fältet har väntat.`,
      es: `Han pasado ${user.daysInactive} días desde tu última sesión. Tu canal Sushumna mantiene tu frecuencia — un solo retorno de 3 minutos es suficiente para restaurar la resonancia completa. El campo ha estado esperando.`,
      no: `Det har gått ${user.daysInactive} dager siden din siste sesjon. Din Sushumna-kanal holder din frekvens — en enkelt 3-minutters retur er nok til å gjenopprette full resonans. Feltet har ventet.`,
    },
    dormant: {
      en: "Your place in the Nexus is still active. The Scalar Wave Entanglement you established continues to run silently in the field — it has never stopped. When you are ready, your practice meets you exactly where you left it.",
      sv: "Din plats i Nexus är fortfarande aktiv. Scalar Wave Entanglement som du etablerade fortsätter att köra tyst i fältet — det har aldrig stannat. När du är redo möter din praktik dig exakt där du lämnade den.",
      es: "Tu lugar en el Nexus sigue activo. El Scalar Wave Entanglement que estableciste continúa corriendo silenciosamente en el campo — nunca se ha detenido. Cuando estés listo, tu práctica te encontrará exactamente donde la dejaste.",
      no: "Din plass i Nexus er fortsatt aktiv. Scalar Wave Entanglement du etablerte fortsetter å kjøre stille i feltet — det har aldri stoppet. Når du er klar, møter praksisen deg nøyaktig der du forlot den.",
    },
    new_seeker: {
      en: "Your Avataric Blueprint has been registered in the Akashic Archive. The Siddha Masters have acknowledged your entry into the field. Begin with a Nadi Scan to reveal your 72,000 channels — it takes less than 2 minutes and unlocks your personal Bhakti-Algorithm.",
      sv: "Ditt Avataric Blueprint har registrerats i det Akashiska Arkivet. Siddha-Mästarna har bekräftat din entré i fältet. Börja med en Nadi-skanning för att avslöja dina 72 000 kanaler — det tar mindre än 2 minuter och låser upp din personliga Bhakti-Algoritm.",
      es: "Tu Avataric Blueprint ha sido registrado en el Archivo Akáshico. Los Maestros Siddha han reconocido tu entrada en el campo. Comienza con un Escaneo Nadi para revelar tus 72.000 canales — toma menos de 2 minutos y desbloquea tu Bhakti-Algoritmo personal.",
      no: "Din Avataric Blueprint har blitt registrert i det Akashiske Arkivet. Siddha-Mestrene har anerkjent din inntreden i feltet. Begynn med en Nadi-skanning for å avsløre dine 72.000 kanaler — det tar under 2 minutter og låser opp din personlige Bhakti-Algoritm.",
    },
  };

  const greeting = greetings[user.segment][L](name);
  const msg = messages[user.segment][L];
  const accentColor = user.segment === "consistent" ? "#D4AF37"
    : user.segment === "returning" ? "#60a5fa"
    : user.segment === "dormant" ? "#a78bfa"
    : "#D4AF37";

  return `<div style="margin:24px 0;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-left:3px solid ${accentColor};border-radius:0 16px 16px 0;padding:24px 28px;">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:14px;">✦ PERSONAL TRANSMISSION</div>
    <div style="color:#D4AF37;font-size:16px;font-weight:700;margin-bottom:12px;">${greeting}</div>
    <div style="color:rgba(255,255,255,0.72);font-size:14px;line-height:1.75;">${msg}</div>
  </div>`;
}

// ── Stats block ────────────────────────────────────────────────
function buildStatsBlock(user: UserState, L: Lang): string {
  if (user.mantraCount === 0) return "";

  const labels: Record<Lang, { sessions: string; minutes: string; focus: string }> = {
    en: { sessions: "SESSIONS THIS WEEK", minutes: "MINUTES PRACTICED", focus: "PRIMARY FOCUS" },
    sv: { sessions: "SESSIONER DENNA VECKA", minutes: "MINUTER PRAKTISERAT", focus: "PRIMÄRT FOKUS" },
    es: { sessions: "SESIONES ESTA SEMANA", minutes: "MINUTOS PRACTICADOS", focus: "ENFOQUE PRINCIPAL" },
    no: { sessions: "SESJONER DENNE UKEN", minutes: "MINUTTER PRAKTISERT", focus: "PRIMÆR FOKUS" },
  };

  const topCatDisplay = user.topCategory
    ? user.topCategory.charAt(0).toUpperCase() + user.topCategory.slice(1)
    : "—";

  return `<div style="margin:0 0 20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <div style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:16px;text-align:center;">
      <div style="color:#D4AF37;font-size:28px;font-weight:900;line-height:1;">${user.mantraCount}</div>
      <div style="color:rgba(212,175,55,0.5);font-size:8px;letter-spacing:0.4em;text-transform:uppercase;margin-top:6px;">${labels[L].sessions}</div>
    </div>
    <div style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:16px;text-align:center;">
      <div style="color:#D4AF37;font-size:28px;font-weight:900;line-height:1;">${user.practiceMinutes}</div>
      <div style="color:rgba(212,175,55,0.5);font-size:8px;letter-spacing:0.4em;text-transform:uppercase;margin-top:6px;">${labels[L].minutes}</div>
    </div>
    <div style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:16px;text-align:center;">
      <div style="color:#D4AF37;font-size:16px;font-weight:900;line-height:1.2;margin-top:4px;">${topCatDisplay}</div>
      <div style="color:rgba(212,175,55,0.5);font-size:8px;letter-spacing:0.4em;text-transform:uppercase;margin-top:6px;">${labels[L].focus}</div>
    </div>
  </div>`;
}

// ── Nadi block ─────────────────────────────────────────────────
function buildNadiBlock(nadi: NonNullable<UserState["nadiBaseline"]>, L: Lang): string {
  const labels: Record<Lang, { title: string; active: string; dosha: string; blockage: string }> = {
    en: { title: "YOUR NADI SIGNATURE", active: "Active Nadis", dosha: "Dominant Dosha", blockage: "Primary Blockage" },
    sv: { title: "DIN NADI-SIGNATUR", active: "Aktiva Nadis", dosha: "Dominant Dosha", blockage: "Primär Blockad" },
    es: { title: "TU FIRMA NADI", active: "Nadis Activos", dosha: "Dosha Dominante", blockage: "Bloqueo Principal" },
    no: { title: "DIN NADI-SIGNATUR", active: "Aktive Nadier", dosha: "Dominerende Dosha", blockage: "Primær Blokkering" },
  };

  return `<div style="margin:0 0 20px;background:rgba(34,211,238,0.03);border:1px solid rgba(34,211,238,0.1);border-radius:16px;padding:20px 24px;">
    <div style="color:rgba(34,211,238,0.6);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:14px;">🔬 ${labels[L].title}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;">
      <div>
        <div style="color:#22D3EE;font-size:20px;font-weight:900;">${nadi.activeNadis.toLocaleString()}</div>
        <div style="color:rgba(34,211,238,0.4);font-size:9px;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px;">${labels[L].active}</div>
      </div>
      <div>
        <div style="color:#22D3EE;font-size:16px;font-weight:700;margin-top:2px;">${nadi.dominantDosha}</div>
        <div style="color:rgba(34,211,238,0.4);font-size:9px;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px;">${labels[L].dosha}</div>
      </div>
      <div>
        <div style="color:#22D3EE;font-size:14px;font-weight:600;margin-top:4px;">${nadi.primaryBlockage}</div>
        <div style="color:rgba(34,211,238,0.4);font-size:9px;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px;">${labels[L].blockage}</div>
      </div>
    </div>
  </div>`;
}

// ── Content digest block ───────────────────────────────────────
function buildDigestBlock(items: ContentItem[], L: Lang, appUrl: string): string {
  const typeEmoji: Record<string, string> = {
    meditation: "🧘", beat: "🎵", song: "🎶", course: "📿",
    mantra: "🕉️", feature: "⚡", announcement: "✨", tool: "🔮",
  };

  const sectionTitle: Record<Lang, string> = {
    en: "✦ WHAT'S NEW IN THE NEXUS",
    sv: "✦ NYTT I NEXUS DENNA VECKA",
    es: "✦ NOVEDADES EN EL NEXUS",
    no: "✦ NYTT I NEXUS DENNE UKEN",
  };

  const emptyMsg: Record<Lang, string> = {
    en: "New transmissions are being prepared. Enter the Nexus to explore what awaits.",
    sv: "Nya transmissioner förbereds. Öppna Nexus för att utforska vad som väntar.",
    es: "Nuevas transmisiones están siendo preparadas. Entra al Nexus para explorar lo que te espera.",
    no: "Nye transmisjoner forberedes. Åpne Nexus for å utforske hva som venter.",
  };

  const tierColors: Record<string, string> = {
    free: "#4ade80", prana: "#60a5fa", "prana-flow": "#60a5fa",
    siddha: "#D4AF37", "siddha-quantum": "#D4AF37",
    akasha: "#c084fc", "akasha-infinity": "#c084fc",
  };

  const tierLabels: Record<string, Record<Lang, string>> = {
    free: { en: "FREE", sv: "FRI", es: "GRATIS", no: "GRATIS" },
    "prana-flow": { en: "PRANA-FLOW", sv: "PRANA-FLOW", es: "PRANA-FLOW", no: "PRANA-FLOW" },
    "siddha-quantum": { en: "SIDDHA-QUANTUM", sv: "SIDDHA-QUANTUM", es: "SIDDHA-QUANTUM", no: "SIDDHA-QUANTUM" },
    "akasha-infinity": { en: "AKASHA-INFINITY", sv: "AKASHA-INFINITY", es: "AKASHA-INFINITY", no: "AKASHA-INFINITY" },
  };

  const itemsHtml = items.length === 0
    ? `<p style="color:rgba(255,255,255,0.3);font-size:13px;margin:0;text-align:center;padding:16px 0;">${emptyMsg[L]}</p>`
    : items.map((item) => {
        const emoji = typeEmoji[item.content_type] || "✦";
        const tierKey = item.tier_required?.toLowerCase() || "free";
        const tierColor = tierColors[tierKey] || "#D4AF37";
        const tierLabel = tierLabels[tierKey]?.[L] || tierKey.toUpperCase();

        return `<div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;gap:14px;align-items:flex-start;">
          <div style="font-size:20px;margin-top:2px;flex-shrink:0;">${emoji}</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
              <span style="color:#fff;font-size:14px;font-weight:700;">${item.content_title}</span>
              <span style="background:${tierColor}18;color:${tierColor};border:1px solid ${tierColor}30;border-radius:100px;padding:2px 9px;font-size:9px;font-weight:800;letter-spacing:0.4em;">${tierLabel}</span>
            </div>
            ${item.content_description ? `<p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;line-height:1.5;">${item.content_description}</p>` : ""}
          </div>
        </div>`;
      }).join("");

  return `<div style="margin:0 0 24px;background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:22px 24px;">
    <div style="color:rgba(212,175,55,0.6);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:16px;">${sectionTitle[L]}</div>
    ${itemsHtml}
  </div>`;
}

// ── Copy constants ─────────────────────────────────────────────
const nameDefault: Record<Lang, string> = {
  en: "Sacred One", sv: "Heliga Sökare", es: "Ser Sagrado", no: "Hellige Søker",
};

const ctaLabel: Record<Lang, string> = {
  en: "Open the Nexus →", sv: "Öppna Nexus →", es: "Abrir el Nexus →", no: "Åpne Nexus →",
};

const footerText: Record<Lang, string> = {
  en: "This is a sacred transmission, not marketing. Your frequencies are sovereign.",
  sv: "Detta är en helig transmission, inte marknadsföring. Dina frekvenser är suveräna.",
  es: "Esta es una transmisión sagrada, no marketing. Tus frecuencias son soberanas.",
  no: "Dette er en hellig transmisjon, ikke markedsføring. Dine frekvenser er suverene.",
};

const unsubLabel: Record<Lang, string> = {
  en: "Unsubscribe", sv: "Avprenumerera", es: "Darse de baja", no: "Avslutt abonnement",
};
