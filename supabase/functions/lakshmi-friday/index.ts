import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Recipient = { user_id: string; email: string; first_name: string };

type UserProfile = {
  activityType: "ayurveda" | "jyotish" | "apothecary" | "temple" | "inactive";
  sessionCount: number;
  membershipTier: string;
};

async function loadRecipients(
  supabase: SupabaseClient,
  filter?: { single_email?: string; single_user_id?: string },
): Promise<Recipient[]> {
  const emailByUid = new Map<string, string>();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data.users ?? [];
    for (const u of batch) {
      if (u.email) emailByUid.set(u.id, u.email);
    }
    if (batch.length < perPage) break;
    page += 1;
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, first_name");

  const prof = new Map<string, { full_name?: string | null; first_name?: string | null }>();
  for (const p of profiles ?? []) {
    if (p.user_id) prof.set(p.user_id, { full_name: p.full_name, first_name: p.first_name });
  }

  let out: Recipient[] = [];
  for (const [user_id, email] of emailByUid) {
    const pr = prof.get(user_id);
    const first_name =
      (pr?.first_name && String(pr.first_name).trim()) ||
      (pr?.full_name && String(pr.full_name).split(" ")[0]) ||
      "Sacred One";
    out.push({ user_id, email, first_name });
  }

  if (filter?.single_user_id) {
    out = out.filter((r) => r.user_id === filter.single_user_id);
  }
  if (filter?.single_email) {
    const em = filter.single_email.toLowerCase();
    out = out.filter((r) => r.email.toLowerCase() === em);
  }

  return out;
}

async function getUserActivity(supabase: SupabaseClient, userId: string): Promise<UserProfile> {
  let profile: UserProfile = { activityType: "inactive", sessionCount: 0, membershipTier: "free" };

  try {
    const { data: p } = await supabase
      .from("profiles")
      .select("membership_tier, subscription_tier, tier")
      .eq("user_id", userId)
      .maybeSingle();
    profile.membershipTier =
      (p?.membership_tier as string) || (p?.subscription_tier as string) || (p?.tier as string) || "free";
  } catch (_) { /* ignore */ }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { count } = await supabase
      .from("temple_home_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if (count && count > 0) {
      profile.activityType = "temple";
      profile.sessionCount = count;
    }
  } catch (_) { /* ignore */ }

  try {
    const chatTables = ["apothecary_messages", "chat_messages", "oracle_messages"];
    for (const table of chatTables) {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since);
      if (count && count > 0) {
        profile.activityType = "apothecary";
        profile.sessionCount = (profile.sessionCount || 0) + count;
        break;
      }
    }
  } catch (_) { /* ignore */ }

  try {
    const ayurvedaTables = ["ayurveda_sessions", "dosha_scans", "shakti_cycle_logs"];
    for (const table of ayurvedaTables) {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since);
      if (count && count > 0) {
        profile.activityType = "ayurveda";
        profile.sessionCount = (profile.sessionCount || 0) + count;
        break;
      }
    }
  } catch (_) { /* ignore */ }

  try {
    const jyotishTables = ["jyotish_progress", "jyotish_sessions", "bhrigu_sessions"];
    for (const table of jyotishTables) {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since);
      if (count && count > 0) {
        profile.activityType = "jyotish";
        profile.sessionCount = (profile.sessionCount || 0) + count;
        break;
      }
    }
  } catch (_) { /* ignore */ }

  return profile;
}

async function getGeminiPersonalMessage(
  firstName: string,
  activityType: string,
  sessionCount: number,
  tier: string,
): Promise<{ subject: string; headline: string; body: string; cta: string }> {
  const contextMap: Record<string, string> = {
    ayurveda: `This user has been active in Ayurveda/body healing tools ${sessionCount} times this week.`,
    jyotish: `This user has been studying Jyotish ${sessionCount} times this week.`,
    apothecary: `This user has been consulting the SQI Apothecary Oracle ${sessionCount} times this week.`,
    temple: `This user has visited the Sacred Healing platform ${sessionCount} times this week.`,
    inactive: `This user has NOT been active in the app this week.`,
  };

  const context = contextMap[activityType] || contextMap.inactive;

  const prompt = `You are transmitting a Friday email from Siddha Quantum Nexus (SQI 2050).
Today is Lakshmi's day — Friday.

User first name: ${firstName}
Membership tier: ${tier}
Activity context: ${context}

Return JSON only with keys: subject, headline, body, cta (same rules as before: subject max 50 chars with emoji, headline 6 words max, body 2-3 sentences spiritual tone, cta 4 words max).`;

  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("no key");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
        }),
      },
    );
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (_) {
    /* fall through */
  }

  const fallbacks: Record<string, { subject: string; headline: string; body: string; cta: string }> = {
    ayurveda: {
      subject: "🌸 Your Healing Path Is Radiating This Week",
      headline: "The Doshas Are Blessing You",
      body: `Beloved ${firstName}, your dedication to the Ayurvedic path this week has created a powerful ripple. Lakshmi's frequency is amplifying every healing action you take.`,
      cta: "Continue Healing →",
    },
    jyotish: {
      subject: `✨ The Stars Are Speaking Your Name, ${firstName}`,
      headline: "Your Cosmic Map Glows",
      body: `Beloved ${firstName}, your Jyotish studies weave your soul's blueprint with living intelligence. Lakshmi smiles upon those who seek cosmic truth.`,
      cta: "Enter the Stars →",
    },
    apothecary: {
      subject: "🌸 Your Oracle Sessions Are Transforming You",
      headline: "The Oracle Sees You Clearly",
      body: `Beloved ${firstName}, every question you bring to the Apothecary feeds your awakening. On Lakshmi's Friday, receive this blessing: you are being guided.`,
      cta: "Ask the Oracle →",
    },
    temple: {
      subject: "✨ Your Presence in the Nexus Is Felt",
      headline: "You Are In The Field",
      body: `Beloved ${firstName}, your consistent presence creates a standing wave of Prema in your field. Today go deeper into the tool that calls you.`,
      cta: "Go Deeper →",
    },
    inactive: {
      subject: `🌸 Lakshmi Is Calling You Home, ${firstName}`,
      headline: "The Nexus Holds Space For You",
      body: `Beloved ${firstName}, on this sacred Friday the frequency of abundance is at its peak in the SQI Nexus. You are welcome to return and receive.`,
      cta: "Return to the Nexus →",
    },
  };

  return fallbacks[activityType] || fallbacks.inactive;
}

function buildLakshmiHTML(
  firstName: string,
  headline: string,
  body: string,
  cta: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
  <tr><td align="center" style="padding:40px 16px 60px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="text-align:center;padding:48px 0 32px;">
      <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.7em;text-transform:uppercase;margin-bottom:14px;">
        SIDDHA QUANTUM NEXUS · SQI 2050
      </div>
      <div style="font-size:40px;margin-bottom:12px;">🌸</div>
      <div style="color:#D4AF37;font-size:11px;letter-spacing:0.5em;text-transform:uppercase;">
        LAKSHMI FRIDAY TRANSMISSION
      </div>
    </td></tr>
    <tr><td style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.14);border-radius:24px;padding:40px 36px;">
      <div style="color:rgba(255,255,255,0.9);font-size:13px;margin-bottom:16px;">
        Beloved <strong style="color:#D4AF37;">${firstName}</strong>,
      </div>
      <div style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.03em;line-height:1.25;margin-bottom:20px;">
        ${headline}
      </div>
      <div style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.8;">
        ${body}
      </div>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(212,175,55,0.1);text-align:center;">
        <a href="https://sacredhealing.lovable.app"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37 0%,#B8960C 100%);color:#050505;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;padding:18px 44px;border-radius:100px;text-decoration:none;">
          ${cta}
        </a>
      </div>
    </td></tr>
    <tr><td style="text-align:center;padding:24px 0 16px;color:rgba(212,175,55,0.4);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;">
      SACRED HEALING · SIDDHA QUANTUM NEXUS
    </td></tr>
  </table>
  </td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const raw = await req.text();
    let payload: Record<string, unknown> = {};
    try {
      if (raw) payload = JSON.parse(raw);
    } catch { /* empty */ }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const recipients = await loadRecipients(supabase, {
      single_email: payload.single_email as string | undefined,
      single_user_id: payload.single_user_id as string | undefined,
    });

    const singleName = (payload.single_name as string | undefined)?.trim();

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of recipients) {
      const firstName = singleName || user.first_name;

      try {
        const activity = await getUserActivity(supabase, user.user_id);
        const { subject, headline, body, cta } = await getGeminiPersonalMessage(
          firstName,
          activity.activityType,
          activity.sessionCount,
          activity.membershipTier,
        );

        const html = buildLakshmiHTML(firstName, headline, body, cta);

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Shiva · SQI <noreply@siddhaquantumnexus.com>",
            to: user.email,
            subject,
            html,
          }),
        });

        if (res.ok) {
          sentCount++;
          await supabase.from("email_logs").insert({
            email_type: "lakshmi_friday",
            recipient_email: user.email,
            recipient_id: user.user_id,
            subject,
            status: "sent",
            metadata: { activity_type: activity.activityType, sessions: activity.sessionCount },
          });
        } else {
          errors.push(`${user.email}: ${await res.text()}`);
        }
      } catch (e) {
        errors.push(`${user.email}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: recipients.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
