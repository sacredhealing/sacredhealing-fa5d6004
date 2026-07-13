// Cancellation win-back sequence. Scheduled via pg_cron, once daily.
// Stage 1: 7 days after access actually ends (not cancellation date) — a
//   warm check-in with one real teaching from the existing pool, not a
//   discount pitch. Stage 2: 30 days after — what's new since they left,
//   with a resubscribe link.
// Both stages skip anyone who already resubscribed (checked fresh right
// before sending, closing the same race condition handled in the
// abandonment-recovery function).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_LABELS: Record<string, string> = {
  "prana-flow": "Prana-Flow",
  "siddha-quantum": "Siddha-Quantum",
  "akasha-infinity": "Akasha-Infinity",
};

function buildStage1HTML(firstName: string, tierLabel: string, teaching: { title: string; body_text: string } | null): string {
  const teachingBlock = teaching ? `
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-left:2px solid #D4AF37;border-radius:16px;padding:22px 24px;margin-bottom:24px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.6);margin-bottom:10px;">${teaching.title}</div>
      <p style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.85;margin:0;font-style:italic;">${teaching.body_text}</p>
    </div>` : "";

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
<tr><td align="center" style="padding:40px 16px 60px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr><td style="text-align:center;padding:40px 0 24px;">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.6em;text-transform:uppercase;margin-bottom:12px;">SIDDHA QUANTUM NEXUS</div>
  </td></tr>
  <tr><td>
    <div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:24px;padding:32px 28px;">
      <p style="font-size:16px;color:rgba(255,255,255,0.9);margin:0 0 16px;">Hi <strong style="color:#D4AF37;">${firstName}</strong>,</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;margin:0 0 24px;">It's been about a week since your ${tierLabel} access ended. No sales pitch here — just wanted to share something real with you, the way we would if you were still practicing with us.</p>
      ${teachingBlock}
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;margin:0 0 24px;">If you ever want to come back, everything's exactly where you left it. If not, we're genuinely glad you spent time with us at all.</p>
      <div style="text-align:center;">
        <a href="https://siddhaquantumnexus.com/membership" style="display:inline-block;padding:14px 32px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.4);border-radius:100px;color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">See Membership</a>
      </div>
    </div>
  </td></tr>
  <tr><td style="text-align:center;padding:24px 0 0;">
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0;">With light, Kritagya Das &amp; Karaveera Nivasini Dasi</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function buildStage2HTML(firstName: string, tierLabel: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
<tr><td align="center" style="padding:40px 16px 60px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr><td style="text-align:center;padding:40px 0 24px;">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.6em;text-transform:uppercase;margin-bottom:12px;">SIDDHA QUANTUM NEXUS</div>
  </td></tr>
  <tr><td>
    <div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:24px;padding:32px 28px;">
      <p style="font-size:16px;color:rgba(255,255,255,0.9);margin:0 0 16px;">Hi <strong style="color:#D4AF37;">${firstName}</strong>,</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;margin:0 0 24px;">It's been a month since your ${tierLabel} access ended. The Siddha Portal keeps growing — new academy content, new teachings, new tools — since you left. If it's the right time to come back, your account and progress are exactly where you left them.</p>
      <div style="text-align:center;">
        <a href="https://siddhaquantumnexus.com/membership" style="display:inline-block;padding:16px 36px;background:#D4AF37;color:#050505;border-radius:100px;font-size:12px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">◈ See What's New</a>
      </div>
    </div>
  </td></tr>
  <tr><td style="text-align:center;padding:24px 0 0;">
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0;">With light, Kritagya Das &amp; Karaveera Nivasini Dasi</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail(RESEND_API_KEY: string, to: string, subject: string, html: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Kritagya Das & Karaveera Nivasini Dasi · SQI <noreply@siddhaquantumnexus.com>",
      to,
      subject,
      html,
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const now = Date.now();
    const stage1Cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const stage2Cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    let stage1Sent = 0, stage2Sent = 0;
    const errors: string[] = [];

    // Stage 1
    const { data: stage1Rows } = await supabase
      .from("cancellation_winback_log")
      .select("*")
      .is("resubscribed_at", null)
      .is("stage1_sent_at", null)
      .lte("access_until", stage1Cutoff)
      .limit(50);

    for (const row of stage1Rows ?? []) {
      try {
        const { data: fresh } = await supabase.from("cancellation_winback_log").select("resubscribed_at").eq("id", row.id).maybeSingle();
        if (fresh?.resubscribed_at) continue;

        const { data: prof } = await supabase.from("profiles").select("birth_name").eq("user_id", row.user_id).maybeSingle();
        const firstName = (prof?.birth_name || "there").split(" ")[0];
        const tierLabel = TIER_LABELS[row.tier_slug] || row.tier_slug;

        const { data: teachingRows } = await supabase.rpc("get_next_teaching", { p_user_id: row.user_id, p_theme: null });
        const teaching = teachingRows?.[0] ?? null;

        const html = buildStage1HTML(firstName, tierLabel, teaching);
        const res = await sendEmail(RESEND_API_KEY, row.email, "A thought for you", html);

        if (res.ok) {
          await supabase.from("cancellation_winback_log").update({ stage1_sent_at: new Date().toISOString() }).eq("id", row.id);
          if (teaching?.id) {
            await supabase.rpc("log_teaching_sent", { p_user_id: row.user_id, p_teaching_id: teaching.id, p_context: "winback_stage1" });
          }
          stage1Sent++;
        } else {
          errors.push(`stage1 ${row.email}: ${await res.text()}`);
        }
      } catch (e) {
        errors.push(`stage1 ${row.email}: ${(e as Error).message}`);
      }
    }

    // Stage 2
    const { data: stage2Rows } = await supabase
      .from("cancellation_winback_log")
      .select("*")
      .is("resubscribed_at", null)
      .is("stage2_sent_at", null)
      .lte("access_until", stage2Cutoff)
      .limit(50);

    for (const row of stage2Rows ?? []) {
      try {
        const { data: fresh } = await supabase.from("cancellation_winback_log").select("resubscribed_at").eq("id", row.id).maybeSingle();
        if (fresh?.resubscribed_at) continue;

        const { data: prof } = await supabase.from("profiles").select("birth_name").eq("user_id", row.user_id).maybeSingle();
        const firstName = (prof?.birth_name || "there").split(" ")[0];
        const tierLabel = TIER_LABELS[row.tier_slug] || row.tier_slug;

        const html = buildStage2HTML(firstName, tierLabel);
        const res = await sendEmail(RESEND_API_KEY, row.email, "What's new since you left", html);

        if (res.ok) {
          await supabase.from("cancellation_winback_log").update({ stage2_sent_at: new Date().toISOString() }).eq("id", row.id);
          stage2Sent++;
        } else {
          errors.push(`stage2 ${row.email}: ${await res.text()}`);
        }
      } catch (e) {
        errors.push(`stage2 ${row.email}: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify({ stage1Sent, stage2Sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
