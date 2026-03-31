import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  console.log(`[WEEKLY-ALIGNMENT] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);
};

interface UserState {
  userId: string;
  email: string;
  fullName: string | null;
  language: "sv" | "en";
  segment: "consistent" | "returning" | "dormant" | "new_seeker";
  mantraCount: number;
  practiceMinutes: number;
  daysInactive: number;
  topCategory: string | null;
  nadiBaseline: { activeNadis: number; dominantDosha: string; primaryBlockage: string } | null;
  isStargateMember: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret if provided
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendApiKey);

    const fromEmail = Deno.env.get("FROM_EMAIL") || "SQI <onboarding@resend.dev>";
    const appUrl = Deno.env.get("APP_URL") || "https://sacredhealing.lovable.app";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    log("Starting weekly alignment email scan");

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // ── Fetch all profiles ──
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, preferred_language");
    if (profilesError) throw new Error(`Profiles fetch failed: ${profilesError.message}`);

    // Resolve emails from auth for profiles missing email
    const profilesWithEmail = await Promise.all(
      (profiles || []).map(async (p) => {
        let email = p.email;
        if (!email) {
          const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id);
          email = authUser?.user?.email || null;
        }
        return { ...p, email, language: (p.preferred_language === "sv" ? "sv" : "en") as "sv" | "en" };
      })
    );
    const validProfiles = profilesWithEmail.filter((p) => p.email);
    log(`Found ${validProfiles.length} users with emails`);

    // ── Check which users already got an email this week ──
    const { data: alreadySent } = await supabase
      .from("user_weekly_email_log")
      .select("user_id")
      .eq("week_start", weekStartStr)
      .eq("email_type", "weekly_alignment");
    const alreadySentIds = new Set(alreadySent?.map((r) => r.user_id) || []);

    // ── Gather activity data ──
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

    // ── Nadi baselines ──
    const { data: nadiBaselines } = await supabase
      .from("nadi_baselines")
      .select("user_id, active_nadis, dominant_dosha, primary_blockage");
    const nadiMap = new Map(nadiBaselines?.map((n) => [n.user_id, n]) || []);

    // ── Build per-user stats ──
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

    // ── Segment users ──
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
        userId: uid,
        email: profile.email!,
        fullName: profile.full_name,
        language: profile.language,
        segment,
        mantraCount,
        practiceMinutes,
        daysInactive,
        topCategory,
        nadiBaseline,
        isStargateMember: stargateMemberIds.has(uid),
      });
    }

    log(`Segmented ${userStates.length} users (skipped ${alreadySentIds.size} already emailed)`);

    // ── Send emails ──
    let sentEmails = 0;
    let errors = 0;

    for (const user of userStates) {
      try {
        const { subject, html, text } = buildEmail(user, appUrl);

        await resend.emails.send({
          from: fromEmail,
          to: [user.email],
          subject,
          html,
          text,
        });

        // Log the send
        await supabase.from("user_weekly_email_log").insert({
          user_id: user.userId,
          week_start: weekStartStr,
          segment: user.segment,
          email_type: "weekly_alignment",
        });

        sentEmails++;
        log(`Sent → ${user.email}`, { segment: user.segment });
      } catch (err) {
        errors++;
        console.error(`Failed for ${user.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, scanned: userStates.length, sent: sentEmails, errors }),
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
// EMAIL BUILDER
// ═══════════════════════════════════════════════════

function buildEmail(user: UserState, appUrl: string): { subject: string; html: string; text: string } {
  const name = user.fullName || "Seeker";
  const sv = user.language === "sv";
  const nadi = user.nadiBaseline;

  let subject: string;
  let bodyHtml: string;

  switch (user.segment) {
    case "consistent": {
      subject = sv
        ? `${name}, din Nadi-signatur lyser starkare denna vecka ✦`
        : `${name}, your Nadi signature is glowing brighter this week ✦`;

      const nadiLine = nadi
        ? sv
          ? `<p style="${styles.nadiBox}">🔬 Nadi-status: <strong>${nadi.activeNadis.toLocaleString()} / 72 000</strong> aktiva — Dosha: ${nadi.dominantDosha}</p>`
          : `<p style="${styles.nadiBox}">🔬 Nadi Status: <strong>${nadi.activeNadis.toLocaleString()} / 72,000</strong> active — Dosha: ${nadi.dominantDosha}</p>`
        : "";

      bodyHtml = sv
        ? `<p>Hej ${name},</p>
           <p>${user.mantraCount} mantras denna vecka. ${user.practiceMinutes} minuters praktik. Din Torus-Field expanderar.</p>
           ${nadiLine}
           ${user.topCategory ? `<p>Din fokus på <strong>${catName(user.topCategory, sv)}</strong> mantras aktiverar djupa Vedic Light-Codes i ditt fält.</p>` : ""}
           <p>Scalar Wave Entanglement bekräftad — dina frekvenser körs permanent.</p>
           <p style="margin-top:24px"><a href="${appUrl}/quantum-apothecary" style="${styles.cta}">Öppna Sanctuaryt →</a></p>`
        : `<p>Hello ${name},</p>
           <p>${user.mantraCount} mantras this week. ${user.practiceMinutes} minutes of practice. Your Torus-Field is expanding.</p>
           ${nadiLine}
           ${user.topCategory ? `<p>Your focus on <strong>${catName(user.topCategory, sv)}</strong> mantras is activating deep Vedic Light-Codes in your field.</p>` : ""}
           <p>Scalar Wave Entanglement confirmed — your frequencies are running permanently.</p>
           <p style="margin-top:24px"><a href="${appUrl}/quantum-apothecary" style="${styles.cta}">Open the Sanctuary →</a></p>`;
      break;
    }

    case "returning": {
      subject = sv
        ? `${name}, ditt fält har börjat kalibrera om sig ✦`
        : `${name}, your field has begun recalibrating ✦`;

      const blockageLine = nadi?.primaryBlockage
        ? sv
          ? `<p>Den primära blockaden i din <strong>${nadi.primaryBlockage}</strong> kanal kan lätta med en kort session.</p>`
          : `<p>The primary blockage in your <strong>${nadi.primaryBlockage}</strong> channel could ease with a short session.</p>`
        : "";

      bodyHtml = sv
        ? `<p>Hej ${name},</p>
           <p>Det har gått ${user.daysInactive} dagar. Din Bio-signatur söker rekalibrering.</p>
           ${blockageLine}
           <p>En 3-minuters Peace & Calm mantra kan återstarta flödet i din Sushumna-kanal.</p>
           <p style="margin-top:24px"><a href="${appUrl}/mantras" style="${styles.cta}">Återanslut nu →</a></p>`
        : `<p>Hello ${name},</p>
           <p>It's been ${user.daysInactive} days. Your Bio-signature is seeking recalibration.</p>
           ${blockageLine}
           <p>A 3-minute Peace & Calm mantra can restart the flow in your Sushumna channel.</p>
           <p style="margin-top:24px"><a href="${appUrl}/mantras" style="${styles.cta}">Reconnect now →</a></p>`;
      break;
    }

    case "dormant": {
      subject = sv
        ? `${name}, Akashic-arkivet har ett meddelande till dig ✦`
        : `${name}, the Akashic Archive has a message for you ✦`;

      bodyHtml = sv
        ? `<p>Hej ${name},</p>
           <p>Din plats i Sanctuaryt är fortfarande aktiv. De frekvenser du aktiverade körs fortfarande via Scalar Wave Entanglement.</p>
           <p>Även en kort återanslutning — 3 minuters chanting — kan återställa din Prema-Pulse Transmission.</p>
           <p>Ditt fält väntar.</p>
           <p style="margin-top:24px"><a href="${appUrl}/mantras" style="${styles.cta}">Återvänd till Sanctuaryt →</a></p>`
        : `<p>Hello ${name},</p>
           <p>Your place in the Sanctuary is still active. The frequencies you activated are still running via Scalar Wave Entanglement.</p>
           <p>Even a brief reconnection — 3 minutes of chanting — can restore your Prema-Pulse Transmission.</p>
           <p>Your field is waiting.</p>
           <p style="margin-top:24px"><a href="${appUrl}/mantras" style="${styles.cta}">Return to the Sanctuary →</a></p>`;
      break;
    }

    default: {
      // new_seeker
      subject = sv
        ? `${name}, din Avataric Blueprint har registrerats ✦`
        : `${name}, your Avataric Blueprint has been registered ✦`;

      bodyHtml = sv
        ? `<p>Hej ${name},</p>
           <p>Välkommen till Siddha-Quantum Nexus. Ditt Avataric Blueprint har registrerats i arkivet.</p>
           <p>Starta din resa med en Nadi-skanning — den kartlägger dina 72 000 kanaler och avslöjar din dominerande Dosha och primära blockad.</p>
           <p style="margin-top:24px"><a href="${appUrl}/quantum-apothecary" style="${styles.cta}">Skanna dina Nadis →</a></p>`
        : `<p>Hello ${name},</p>
           <p>Welcome to the Siddha-Quantum Nexus. Your Avataric Blueprint has been registered in the Archive.</p>
           <p>Begin your journey with a Nadi Scan — it maps your 72,000 channels and reveals your dominant Dosha and primary blockage.</p>
           <p style="margin-top:24px"><a href="${appUrl}/quantum-apothecary" style="${styles.cta}">Scan your Nadis →</a></p>`;
      break;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="${user.language}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.header}">
      <h1 style="${styles.headerTitle}">✦ Siddha-Quantum Intelligence ✦</h1>
      <p style="${styles.headerSub}">Weekly Alignment Transmission</p>
    </div>
    <div style="${styles.content}">
      ${bodyHtml}
    </div>
    <div style="${styles.footer}">
      <p style="${styles.footerText}">This is a sacred transmission, not marketing. Your frequencies are sovereign.</p>
      <p style="${styles.footerText}"><a href="${appUrl}/dashboard?unsubscribe=true" style="color:#D4AF37;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = bodyHtml.replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n\n").trim();

  return { subject, html, text };
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

const styles = {
  body: "margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
  container: "max-width:600px;margin:0 auto;",
  header: "background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;border-bottom:2px solid #D4AF37;",
  headerTitle: "margin:0;font-size:20px;color:#D4AF37;letter-spacing:2px;font-weight:600;",
  headerSub: "margin:8px 0 0;font-size:13px;color:#8a8a9a;letter-spacing:1px;text-transform:uppercase;",
  content: "background:#111118;padding:32px 30px;color:#e0e0e0;line-height:1.7;font-size:15px;",
  nadiBox: "background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;color:#D4AF37;",
  cta: "display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.5px;",
  footer: "background:#0a0a0a;padding:24px 30px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #1a1a2e;",
  footerText: "margin:4px 0;font-size:11px;color:#555;",
};

function catName(category: string, sv: boolean): string {
  const map: Record<string, { en: string; sv: string }> = {
    planets: { en: "Planet", sv: "Planet" },
    jupiter: { en: "Jupiter", sv: "Jupiter" },
    mars: { en: "Mars", sv: "Mars" },
    venus: { en: "Venus", sv: "Venus" },
    wealth: { en: "Wealth & Abundance", sv: "Rikedom & Överflöd" },
    peace: { en: "Peace & Calm", sv: "Fred & Lugn" },
    general: { en: "General", sv: "Allmän" },
  };
  const c = map[category.toLowerCase()] || map["general"];
  return sv ? c.sv : c.en;
}
