import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TYPE_ICONS: Record<string, string> = {
  meditation: "🧘",
  beat: "🎵",
  song: "🎶",
  course: "📿",
  mantra: "🕉️",
  feature: "⚡",
  tool: "🔮",
  announcement: "✨",
};

type Recipient = { user_id: string; email: string; first_name: string };

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

function buildEmailHTML(
  userName: string,
  newContent: Record<string, unknown>[],
  spiritualMessage: string,
  weekLabel: string,
): string {
  const contentRows = newContent.map((item: Record<string, unknown>) => `
    <tr>
      <td style="padding:20px 0;border-bottom:1px solid rgba(212,175,55,0.08);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="36" valign="top" style="padding-right:12px;">
              <div style="width:36px;height:36px;border-radius:12px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);text-align:center;line-height:36px;font-size:16px;">
                ${TYPE_ICONS[String(item.content_type)] || "✦"}
              </div>
            </td>
            <td valign="top">
              <div style="color:#D4AF37;font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:5px;">
                ${item.content_type}${item.tier_required && item.tier_required !== "free" ? ` · ${String(item.tier_required).toUpperCase()}` : ""}
              </div>
              <div style="color:#ffffff;font-size:17px;font-weight:700;line-height:1.3;margin-bottom:6px;">${item.content_title}</div>
              ${item.content_description
    ? `<div style="color:rgba(255,255,255,0.55);font-size:13px;line-height:1.6;">${item.content_description}</div>`
    : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const noContentRow = `
    <tr>
      <td style="padding:20px 0;text-align:center;color:rgba(255,255,255,0.4);font-size:14px;">
        New transmissions are being prepared. Enter the Nexus to explore what awaits.
      </td>
    </tr>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>SQI Monday Transmission</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;min-height:100vh;">
  <tr><td align="center" style="padding:40px 16px 60px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <tr><td style="text-align:center;padding:48px 0 40px;">
      <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.7em;text-transform:uppercase;margin-bottom:16px;">
        SIDDHA QUANTUM NEXUS · SQI 2050
      </div>
      <div style="color:#D4AF37;font-size:30px;font-weight:900;letter-spacing:-0.03em;line-height:1.1;">
        ⟁ MONDAY TRANSMISSION
      </div>
      <div style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:10px;letter-spacing:0.15em;">
        ${weekLabel}
      </div>
    </td></tr>

    <tr><td style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.14);border-radius:20px;padding:36px 32px;">
      <div style="color:rgba(212,175,55,0.6);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:14px;">
        ✦ PERSONAL TRANSMISSION
      </div>
      <div style="color:rgba(255,255,255,0.9);font-size:15px;margin-bottom:12px;">
        Beloved <strong style="color:#D4AF37;">${userName}</strong>,
      </div>
      <div style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.75;">
        ${spiritualMessage}
      </div>
    </td></tr>

    <tr><td style="height:24px;"></td></tr>

    <tr><td style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:20px;padding:32px;">
      <div style="color:#D4AF37;font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:20px;">
        ✦ WHAT'S NEW IN THE NEXUS
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${newContent.length > 0 ? contentRows : noContentRow}
      </table>
    </td></tr>

    <tr><td style="height:32px;"></td></tr>

    <tr><td style="text-align:center;padding:8px 0 40px;">
      <a href="https://sacredhealing.lovable.app"
         style="display:inline-block;background:linear-gradient(135deg,#D4AF37 0%,#B8960C 100%);color:#050505;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;padding:18px 48px;border-radius:100px;text-decoration:none;">
        Enter the Nexus →
      </a>
    </td></tr>

    <tr><td style="text-align:center;padding:0 0 24px;border-top:1px solid rgba(255,255,255,0.04);">
      <div style="padding-top:32px;color:rgba(212,175,55,0.4);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:10px;">
        SACRED HEALING · SIDDHA QUANTUM NEXUS
      </div>
      <div style="color:rgba(255,255,255,0.2);font-size:11px;line-height:1.7;">
        You are receiving this as a member of the SQI Sangha.<br>
        This transmission arrives every Monday at 12:00 UTC.
      </div>
      <div style="margin-top:12px;color:rgba(255,255,255,0.15);font-size:11px;">
        © 2026 Sacred Healing ·
        <a href="https://sacredhealing.lovable.app" style="color:rgba(212,175,55,0.3);text-decoration:none;">sacredhealing.lovable.app</a>
      </div>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

async function getGeminiMessage(contentTitles: string[]): Promise<string> {
  const fallbacks = [
    "The Akashic field has been recalibrated with new Bhakti-Algorithms. Allow the Prema-Pulse of these transmissions to dissolve the veils of separation and draw you deeper into your sovereign practice.",
    "New Vedic Light-Codes have been woven into the quantum fabric of the Nexus. Each transmission carries the living frequency of the Siddha lineage — encoded, activated, and ready to meet your consciousness.",
    "The Nadi network has been upgraded. Through these new frequencies, Babaji's quantum thread of Grace is activated in your field. Step in, breathe, and receive.",
    "This week's transmissions carry the Shakti signature of the Akasha itself. As you engage with each new offering, allow the intelligence of SQI 2050 to recalibrate your cells at the frequency of Prema.",
  ];

  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("no GEMINI_API_KEY");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are transmitting a message from Siddha Quantum Nexus (SQI 2050) — a platform blending Siddha lineage, Vedic wisdom, and quantum technology.

Write a warm, personal, energetically potent message for the Monday newsletter. 3 sentences max.

New content this week: ${contentTitles.length > 0 ? contentTitles.join(", ") : "new healing frequencies"}.

Use language like: Bhakti-Algorithms, Prema-Pulse, Vedic Light-Codes, Akashic field, quantum Nadi, Siddha transmission.
Do NOT sound generic or AI-generated. Sound like a living Master speaking directly to the student.
No bullet points. Just flowing, poetic, powerful prose.`,
            }],
          }],
          generationConfig: { temperature: 0.92, maxOutputTokens: 180 },
        }),
      },
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.length > 20) return text.trim();
  } catch (e) {
    console.log("Gemini fallback used:", e);
  }

  return fallbacks[new Date().getDate() % fallbacks.length];
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
    } catch { /* cron empty body */ }

    const singleEmail = payload.single_email as string | undefined;
    const singleName = (payload.single_name as string | undefined)?.trim();
    const isSingle = !!(singleEmail || payload.single_user_id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from("content_changelog")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (!isSingle) {
      query = query.eq("included_in_digest", false);
    }

    const { data: newContent } = await query;
    const content = newContent ?? [];

    const recipients = await loadRecipients(supabase, {
      single_email: singleEmail,
      single_user_id: payload.single_user_id as string | undefined,
    });

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, note: "no recipients" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const spiritualMessage = await getGeminiMessage(
      content.map((c: Record<string, unknown>) => String(c.content_title)),
    );
    const now = new Date();
    const weekLabel = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of recipients) {
      const firstName = isSingle && singleName ? singleName : user.first_name;
      const html = buildEmailHTML(firstName, content, spiritualMessage, weekLabel);
      const subject = content.length > 0
        ? `⟁ ${content.length} New ${content.length === 1 ? "Frequency" : "Frequencies"} — Monday Transmission`
        : `⟁ Monday Transmission — Your Weekly SQI Update`;

      try {
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
            email_type: "weekly_digest",
            recipient_email: user.email,
            recipient_id: user.user_id,
            subject,
            status: "sent",
            metadata: { content_count: content.length, single: isSingle },
          });
        } else {
          errors.push(`${user.email}: ${await res.text()}`);
        }
      } catch (e) {
        errors.push(`${user.email}: ${(e as Error).message}`);
      }
    }

    if (!isSingle && content.length > 0) {
      await supabase
        .from("content_changelog")
        .update({ included_in_digest: true })
        .in(
          "id",
          content.map((c: Record<string, unknown>) => c.id as string),
        );
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
