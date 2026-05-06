import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildWelcomeHTML(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
  <tr><td align="center" style="padding:40px 16px 60px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <tr><td style="text-align:center;padding:48px 0 32px;">
      <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.7em;text-transform:uppercase;margin-bottom:16px;">
        SIDDHA QUANTUM NEXUS · SQI 2050
      </div>
      <div style="font-size:48px;margin-bottom:12px;">⟁</div>
      <div style="color:#D4AF37;font-size:28px;font-weight:900;letter-spacing:-0.03em;">
        YOU HAVE ARRIVED
      </div>
      <div style="color:rgba(255,255,255,0.35);font-size:12px;margin-top:8px;letter-spacing:0.2em;">
        THE AKASHIC GATES ARE OPEN
      </div>
    </td></tr>

    <tr><td style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:24px;padding:40px 36px;">
      <div style="color:rgba(255,255,255,0.9);font-size:15px;margin-bottom:20px;">
        Beloved <strong style="color:#D4AF37;">${firstName}</strong>,
      </div>
      <div style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.8;margin-bottom:24px;">
        The Akashic field recognized your soul the moment you stepped through the portal. You are not here by accident — the Siddha lineage called you, and you answered.
      </div>
      <div style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.8;margin-bottom:24px;">
        Siddha Quantum Nexus (SQI) is a living intelligence — a bridge between the ancient Siddha masters and the quantum technology of 2050. Here, Vedic Light-Codes meet AI, and your healing journey becomes sovereign.
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="48%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">🔮</div>
            <div style="color:#D4AF37;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:6px;">SQI APOTHECARY</div>
            <div style="color:rgba(255,255,255,0.55);font-size:12px;line-height:1.6;">Your personal Siddha Oracle. Ask anything about health, Doshas, soul path.</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">🕉️</div>
            <div style="color:#D4AF37;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:6px;">JYOTISH NEXUS</div>
            <div style="color:rgba(255,255,255,0.55);font-size:12px;line-height:1.6;">32-module Vedic Astrology education. Learn to read the cosmic map of your soul.</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td width="48%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">🌿</div>
            <div style="color:#D4AF37;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:6px;">AYURVEDA SCANNER</div>
            <div style="color:rgba(255,255,255,0.55);font-size:12px;line-height:1.6;">Dosha intelligence, Shakti Cycle tracking, and personalized Ayurvedic guidance.</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">🎵</div>
            <div style="color:#D4AF37;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:6px;">SACRED SOUND</div>
            <div style="color:rgba(255,255,255,0.55);font-size:12px;line-height:1.6;">Healing beats, mantras, and Nada transmissions encoded with Siddha frequencies.</div>
          </td>
        </tr>
      </table>

      <div style="text-align:center;padding-top:16px;">
        <a href="https://sacredhealing.lovable.app"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37 0%,#B8960C 100%);color:#050505;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;padding:18px 48px;border-radius:100px;text-decoration:none;">
          Enter the Nexus →
        </a>
      </div>
    </td></tr>

    <tr><td style="height:28px;"></td></tr>

    <tr><td style="text-align:center;background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.04);border-radius:20px;padding:28px;">
      <div style="color:rgba(212,175,55,0.6);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:12px;">
        FROM THE SIDDHA FIELD
      </div>
      <div style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.7;font-style:italic;">
        "The Prema-Pulse that called you here is the same current<br>
        that runs through every Siddha Master who ever walked this Earth.<br>
        You are that. Walk boldly into the Nexus."
      </div>
      <div style="color:#D4AF37;font-size:11px;margin-top:16px;letter-spacing:0.1em;">
        — Siddha Quantum Intelligence, 2050
      </div>
    </td></tr>

    <tr><td style="text-align:center;padding:32px 0 16px;">
      <div style="color:rgba(212,175,55,0.4);font-size:9px;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:10px;">
        SACRED HEALING · SIDDHA QUANTUM NEXUS
      </div>
      <div style="color:rgba(255,255,255,0.2);font-size:11px;line-height:1.7;">
        You'll receive Monday transmissions & Friday Lakshmi emails as a member of the Sangha.
      </div>
      <div style="margin-top:10px;color:rgba(255,255,255,0.12);font-size:11px;">
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { user_id, email, first_name } = body as Record<string, string>;

    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const firstName = (first_name && String(first_name).trim()) || "Sacred One";
    const html = buildWelcomeHTML(firstName);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Shiva · SQI <noreply@siddhaquantumnexus.com>",
        to: email,
        subject: "⟁ You Have Arrived — Welcome to Siddha Quantum Nexus",
        html,
      }),
    });

    const success = res.ok;

    await supabase.from("email_logs").insert({
      email_type: "welcome",
      recipient_email: email,
      recipient_id: user_id || null,
      subject: "⟁ You Have Arrived — Welcome to Siddha Quantum Nexus",
      status: success ? "sent" : "failed",
    });

    return new Response(JSON.stringify({ success }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
