/**
 * Weekly alignment email — invoke weekly via pg_cron + net.http_post.
 * Headers: Authorization: Bearer ${CRON_SECRET}
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto), RESEND_API_KEY,
 *          FROM_EMAIL, APP_URL, CRON_SECRET
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function weekKeyISO(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!cronSecret || token !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY")!;
  const fromEmail = Deno.env.get("FROM_EMAIL")!;
  const appUrl = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const week = weekKeyISO(new Date());
  let page = 1;
  const perPage = 200;
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (;;) {
    const { data: authData, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (listError) {
      console.error("listUsers:", listError);
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const users = authData?.users ?? [];
    if (users.length === 0) break;

    for (const u of users) {
      const email = u.email?.trim();
      if (!email) {
        skipped++;
        continue;
      }

      const { data: existing } = await admin
        .from("user_weekly_email_log")
        .select("id")
        .eq("user_id", u.id)
        .eq("week_key", week)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const first =
        (u.user_metadata?.full_name as string | undefined)?.split(/\s+/)[0] ??
        (u.user_metadata?.name as string | undefined)?.split(/\s+/)[0] ??
        "there";

      const dashboardUrl = appUrl ? `${appUrl}/dashboard#weekly-alignment` : "#";
      const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto;padding:24px;">
<p>Hi ${first},</p>
<p>Your <strong>Weekly Alignment</strong> is ready — open the app to reflect on your Sacred Healing journey.</p>
<p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 20px;background:#2d5a4a;color:#fff;text-decoration:none;border-radius:8px;">Open Weekly Alignment</a></p>
<p>If the button doesn't work, copy this link:<br/><a href="${dashboardUrl}">${dashboardUrl}</a></p>
<p style="font-size:12px;color:#888;">Sacred Healing — you're doing meaningful work.</p>
</body></html>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Your weekly alignment is ready ✨",
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Resend error:", res.status, errText);
        errors++;
        continue;
      }

      const { error: insErr } = await admin.from("user_weekly_email_log").insert({
        user_id: u.id,
        week_key: week,
        recipient_email: email,
      });

      if (insErr) {
        console.error("insert log:", insErr);
        errors++;
      } else {
        sent++;
      }
    }

    if (users.length < perPage) break;
    page++;
  }

  return new Response(
    JSON.stringify({ ok: true, week, sent, skipped, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
