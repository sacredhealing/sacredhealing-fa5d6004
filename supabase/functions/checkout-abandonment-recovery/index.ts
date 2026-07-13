// Checkout abandonment recovery.
// Scheduled via pg_cron every 30 minutes. Finds checkout sessions created
// 90+ minutes ago that never completed and haven't already gotten a
// recovery email, sends exactly one, and marks it sent. Links directly
// back to the original Stripe checkout session (valid ~24h by default),
// so the person can complete the exact purchase they started, not a
// generic pricing page.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildRecoveryHTML(firstName: string, tierName: string, priceLabel: string, sessionUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
<tr><td align="center" style="padding:40px 16px 60px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr><td style="text-align:center;padding:40px 0 24px;">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.6em;text-transform:uppercase;margin-bottom:12px;">SIDDHA QUANTUM NEXUS</div>
    <div style="font-size:36px;color:#D4AF37;margin-bottom:6px;">◈</div>
  </td></tr>
  <tr><td>
    <div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:24px;padding:32px 28px;">
      <p style="font-size:16px;color:rgba(255,255,255,0.9);margin:0 0 16px;">Hi <strong style="color:#D4AF37;">${firstName}</strong>,</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;margin:0 0 16px;">You started activating <strong style="color:#D4AF37;">${tierName}</strong> but didn't finish checkout. No pressure at all — just didn't want it to slip away if it was simply an interrupted moment.</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;margin:0 0 24px;">Your checkout is still open and ready — same price, same details, right where you left it.</p>
      <div style="text-align:center;">
        <a href="${sessionUrl}" style="display:inline-block;padding:16px 36px;background:#D4AF37;color:#050505;border-radius:100px;font-size:12px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">◈ Finish Activating · ${priceLabel}</a>
      </div>
      <p style="font-size:12px;color:rgba(255,255,255,0.35);text-align:center;margin:20px 0 0;">If you changed your mind, no worries — just ignore this. Reply if you had any trouble at checkout, we read every message.</p>
    </div>
  </td></tr>
  <tr><td style="text-align:center;padding:24px 0 0;">
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0;">With light, Kritagya Das &amp; Karaveera Nivasini Dasi</p>
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:16px 0 0;">Sacred Healing · Siddha Quantum Nexus</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const cutoff = new Date(Date.now() - 90 * 60 * 1000).toISOString();

    const { data: pending, error } = await supabase
      .from("checkout_abandonment_log")
      .select("*")
      .is("recovered_at", null)
      .is("recovery_email_sent_at", null)
      .lte("created_at", cutoff)
      .limit(50);

    if (error) throw error;

    let sent = 0;
    const errors: string[] = [];

    for (const row of pending ?? []) {
      try {
        // Re-check recovered_at right before sending — covers the race where
        // someone completed checkout in between the query and this send.
        const { data: fresh } = await supabase
          .from("checkout_abandonment_log")
          .select("recovered_at")
          .eq("id", row.id)
          .maybeSingle();
        if (fresh?.recovered_at) continue;

        const { data: prof } = await supabase.from("profiles").select("birth_name").eq("user_id", row.user_id).maybeSingle();
        const firstName = (prof?.birth_name || "there").split(" ")[0];

        const html = buildRecoveryHTML(firstName, row.display_name || row.tier_slug, row.price_label || "", row.session_url || "https://siddhaquantumnexus.com/membership");

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Kritagya Das & Karaveera Nivasini Dasi · SQI <noreply@siddhaquantumnexus.com>",
            to: row.email,
            subject: `Your ${row.display_name || row.tier_slug} checkout is still open`,
            html,
          }),
        });

        if (res.ok) {
          await supabase.from("checkout_abandonment_log").update({ recovery_email_sent_at: new Date().toISOString() }).eq("id", row.id);
          sent++;
        } else {
          errors.push(`${row.email}: ${await res.text()}`);
        }
      } catch (e) {
        errors.push(`${row.email}: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify({ checked: pending?.length ?? 0, sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
