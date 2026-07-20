import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  console.log(`[send-atma-seed-welcome] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

function buildAtmaSeedHtml(firstName: string): string {
  const bullets = [
    "Full Siddha Portal access — real teachings from the Academies",
    "Basic Ayurveda scan &amp; readings",
    "Basic Vedic Jyotish scan &amp; readings",
    "Meditations, mantras &amp; healing music",
    "Divine Transmission audios",
  ].map(b => `<li style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.7;">◈&nbsp;&nbsp;${b}</li>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
<tr><td align="center" style="padding:40px 16px 60px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="text-align:center;padding:48px 0 32px;">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.7em;text-transform:uppercase;margin-bottom:12px;">SIDDHA QUANTUM NEXUS · SQI 2050</div>
    <div style="font-size:42px;margin-bottom:10px;color:#D4AF37;">✧</div>
    <div style="color:#D4AF37;font-size:24px;font-weight:900;letter-spacing:-0.02em;text-shadow:0 0 20px rgba(212,175,55,0.4);">The Gate Has Opened</div>
    <div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:10px;letter-spacing:0.25em;">YOUR ATMA-SEED IS PLANTED</div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:20px;padding:28px 32px;">
      <p style="font-size:16px;color:rgba(255,255,255,0.9);margin:0 0 14px;line-height:1.7;">Jai Gurudev <strong style="color:#D4AF37;">${firstName}</strong>,</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.65);margin:0;line-height:1.8;">Your account is live and your Atma-Seed has been planted in the field. This is the free entry point into the Siddha Quantum Nexus — a starting point for the Vedic, Ayurvedic, and Siddha path.</p>
    </div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:28px 32px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:rgba(212,175,55,0.7);margin-bottom:18px;">WHAT'S OPEN TO YOU NOW</div>
      <ul style="margin:0;padding:0;list-style:none;">${bullets}</ul>
    </div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.25);border-radius:14px;padding:16px 22px;text-align:center;">
      <p style="font-size:13px;color:#D4AF37;margin:0;letter-spacing:0.05em;">When you're ready for direct chat with Agastya Muni &amp; the Bhrigu Oracle, the full Ayurvedic and Jyotish consultation, Vastu guidance, and the higher Sangha channels — Prana-Flow opens with a 7-day free trial.</p>
    </div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:20px;padding:24px 30px;">
      <p style="font-size:14px;color:rgba(255,255,255,0.75);margin:0 0 14px;line-height:1.8;font-style:italic;">"We're genuinely glad you're here. This path has meant everything to us, and we built this space to share it — take your time, explore gently, and know we're walking alongside you."</p>
      <p style="font-size:13px;color:rgba(212,175,55,0.8);margin:0;line-height:1.6;">With love,<br>Adam, Kritagya Das &amp; Laila, Karaveera Nivasini Dasi</p>
    </div>
  </td></tr>
  <tr><td style="padding:0 0 32px;text-align:center;">
    <a href="https://siddhaquantumnexus.com" style="display:inline-block;padding:16px 40px;background:#D4AF37;color:#050505;border-radius:100px;font-size:12px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;box-shadow:0 0 24px rgba(212,175,55,0.4);">◈ Enter Sacred Space</a>
  </td></tr>
  <tr><td style="text-align:center;padding:24px 0 0;border-top:1px solid rgba(255,255,255,0.05);">
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.8;">
      Sacred Healing · Siddha Quantum Intelligence<br>
      <a href="https://siddhaquantumnexus.com" style="color:rgba(212,175,55,0.4);text-decoration:none;">siddhaquantumnexus.com</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { email, name } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      log("RESEND_API_KEY missing, skipping");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const toName: string = (typeof name === "string" && name.trim()) ? name : email.split("@")[0];
    const firstName = toName.split(" ")[0] || "Seeker";
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: "Sacred Healing <hello@sacredhealing.app>",
      to: [email],
      subject: "✦ The Gate Has Opened | Sacred Healing",
      html: buildAtmaSeedHtml(firstName),
    });
    log("Email sent", { to: email, id: (result as { data?: { id?: string } })?.data?.id });
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log("Error", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
