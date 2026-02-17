import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

type Lang = "sv" | "en";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SOUL_SYNC_V1] ${step}${detailsStr}`);
};

// Chaldean order (Saturn → ... → Moon), used for planetary hour sequence
const CHALDEAN_ORDER = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"] as const;

function weekdayRuler(weekday: number) {
  // 0=Sun ... 6=Sat
  switch (weekday) {
    case 0:
      return "sun";
    case 1:
      return "moon";
    case 2:
      return "mars";
    case 3:
      return "mercury";
    case 4:
      return "jupiter";
    case 5:
      return "venus";
    case 6:
    default:
      return "saturn";
  }
}

/**
 * Approx planetary hour (UTC) for automation.
 * Real Hora uses local sunrise; here we approximate with day start 06:00 UTC.
 */
function planetaryHourAt(date: Date) {
  const d = new Date(date);
  const weekday = d.getUTCDay();
  const ruler = weekdayRuler(weekday);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 6, 0, 0));
  const hoursSince = Math.floor((d.getTime() - start.getTime()) / (60 * 60 * 1000));
  const hourIndex = ((hoursSince % 24) + 24) % 24;
  const startIdx = CHALDEAN_ORDER.indexOf(ruler as any);
  const planet = CHALDEAN_ORDER[(startIdx + hourIndex) % CHALDEAN_ORDER.length];
  return { ruler, hourIndex, planet };
}

function renderFollowup({
  lang,
  name,
  planetHour,
  practiceMinutes,
}: {
  lang: Lang;
  name: string;
  planetHour: ReturnType<typeof planetaryHourAt>;
  practiceMinutes: number;
}) {
  const isSv = lang === "sv";
  const subj = isSv
    ? "En mjuk vägledning från din praktik"
    : "A gentle guidance from your practice";

  const planet = planetHour.planet;
  const planetLabel =
    planet === "sun"
      ? isSv
        ? "Solen"
        : "the Sun"
      : isSv
      ? planet.charAt(0).toUpperCase() + planet.slice(1)
      : planet.charAt(0).toUpperCase() + planet.slice(1);

  // “Soft upsell” language: invitation, not sales
  const solarInvite = isSv
    ? "Om du vill fördjupa detta ljus, finns Stargate Solar-modulen som en stilla förlängning av samma väg."
    : "If you feel called to deepen that light, the Stargate Solar module exists as a quiet continuation of the same path.";

  const bodyText = isSv
    ? `Hej ${name},\n\nJag såg att du har praktiserat med Solens mantran. Det är en vacker rytm — särskilt under ${planetLabel}-timmarna.\n\nDen här veckan: cirka ${practiceMinutes} minuter av närvaro.\n\n${solarInvite}\n\nMed värme,\nSacred Healing`
    : `Hi ${name},\n\nI noticed you’ve been practicing with Sun mantras. It’s a beautiful rhythm — especially during ${planetLabel} hours.\n\nThis week: about ${practiceMinutes} minutes of presence.\n\n${solarInvite}\n\nWith warmth,\nSacred Healing`;

  const bodyHtml = bodyText
    .split("\n")
    .map((l) => (l.trim() ? `<p>${l.replace(/</g, "&lt;")}</p>` : "<br/>"))
    .join("");

  return { subject: subj, text: bodyText, html: bodyHtml };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);

    logStep("Starting scan", { dryRun });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, preferred_language");
    if (profilesError) throw new Error(`Failed to fetch profiles: ${profilesError.message}`);

    const profilesWithEmail = await Promise.all(
      (profiles ?? []).map(async (p: any) => {
        let email = p.email;
        if (!email) {
          const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id);
          email = authUser?.user?.email ?? null;
        }
        const lang: Lang = p.preferred_language === "sv" ? "sv" : "en";
        return { ...p, email, lang };
      }),
    );

    const valid = profilesWithEmail.filter((p: any) => p.email);

    // Stargate members (manual list; buyers are also auto-added via webhook)
    const { data: stargateMembers } = await supabase.from("stargate_community_members").select("user_id");
    const stargateSet = new Set((stargateMembers ?? []).map((m: any) => m.user_id));

    // Recent mantra completions
    const { data: completions } = await supabase
      .from("mantra_completions")
      .select("user_id, mantra_id, completed_at")
      .gte("completed_at", oneWeekAgo.toISOString());

    // Mantra metadata
    const { data: mantras } = await supabase
      .from("mantras")
      .select("id, category, planet_type, duration_minutes, duration_seconds");
    const mantraMap = new Map((mantras ?? []).map((m: any) => [m.id, m]));

    const perUserPlanetCounts = new Map<string, Map<string, number>>();
    const perUserMinutes = new Map<string, number>();
    const perUserLast = new Map<string, Date>();

    (completions ?? []).forEach((c: any) => {
      const m = mantraMap.get(c.mantra_id);
      if (!m) return;
      const userId = c.user_id;
      const planet = (m.planet_type || "").toString().toLowerCase();
      if (!planet) return;

      const byPlanet = perUserPlanetCounts.get(userId) ?? new Map<string, number>();
      byPlanet.set(planet, (byPlanet.get(planet) ?? 0) + 1);
      perUserPlanetCounts.set(userId, byPlanet);

      const minutes =
        (m.duration_minutes ?? null) !== null
          ? Number(m.duration_minutes)
          : Math.max(1, Math.ceil(Number(m.duration_seconds ?? 180) / 60));
      perUserMinutes.set(userId, (perUserMinutes.get(userId) ?? 0) + minutes);

      const when = new Date(c.completed_at);
      const prev = perUserLast.get(userId);
      if (!prev || when > prev) perUserLast.set(userId, when);
    });

    // Get admin user id for DMs
    const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
    const adminUserId = adminRoles?.[0]?.user_id ?? null;

    let scanned = 0;
    let sentEmails = 0;
    let sentDMs = 0;

    for (const p of valid) {
      const userId = p.user_id as string;
      const planets = perUserPlanetCounts.get(userId);
      if (!planets) continue;

      scanned++;

      // Focus: Sun mantra practitioners who are not Stargate members
      const sunCount = planets.get("sun") ?? 0;
      if (sunCount <= 0) continue;
      if (stargateSet.has(userId)) continue;

      const practiceMinutes = Math.round(perUserMinutes.get(userId) ?? 0);
      const last = perUserLast.get(userId) ?? new Date();
      const hora = planetaryHourAt(last);

      const name = (p.full_name as string | null) ?? (p.lang === "sv" ? "vän" : "friend");
      const content = renderFollowup({
        lang: p.lang as Lang,
        name,
        planetHour: hora,
        practiceMinutes: practiceMinutes || 0,
      });

      logStep("Prepared follow-up", { userId, email: p.email, sunCount, practiceMinutes, hora });

      if (dryRun) continue;

      // Email
      await resend.emails.send({
        from: "Sacred Healing <onboarding@resend.dev>",
        to: [p.email],
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
      sentEmails++;

      // DM
      if (adminUserId) {
        await supabase.from("private_messages").insert({
          sender_id: adminUserId,
          receiver_id: userId,
          content: content.text,
          message_type: "text",
          status: "sent",
        });
        sentDMs++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, dryRun, usersScanned: scanned, emailsSent: sentEmails, dmsSent: sentDMs }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

