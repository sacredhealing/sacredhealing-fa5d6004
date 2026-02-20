import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AkashicPurchaseEmailRequest {
  userEmail: string;
  userName: string;
  remedy: string;
  archetype: string;
  appOrigin?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, remedy, archetype, appOrigin }: AkashicPurchaseEmailRequest = await req.json();

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "userEmail is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const mantraLink = appOrigin ? `${appOrigin}/mantras` : "https://sacredhealing.app/mantras";

    await resend.emails.send({
      from: "Sacred Healing <hello@sacredhealing.app>",
      to: [userEmail],
      subject: `Your Akashic Record — ${archetype} | Sacred Healing`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 20px; background-color: #0a0a0a; color: #e5e5e5;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a0a2e 0%, #0d0a06 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(212,175,55,0.3);">
    <div style="background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(139,92,246,0.2) 100%); padding: 40px 30px; text-align: center;">
      <p style="font-size: 48px; margin: 0;">ॐ</p>
      <h1 style="color: #D4AF37; margin: 16px 0 0; font-size: 22px; letter-spacing: 0.1em;">Your Akashic Record</h1>
      <p style="color: rgba(212,175,55,0.9); margin: 8px 0 0; font-size: 14px; letter-spacing: 0.2em;">A Siddha Transmission</p>
    </div>
    <div style="padding: 30px;">
      <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">Dear ${userName || 'Sacred Soul'},</p>
      <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">Your Certificate of Origin — <strong>${archetype}</strong> — is now available in the app. Download your 15-page Soul Manuscript anytime from <strong>My Records</strong>.</p>
      <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">Your Bhrigu Remedy Mantra is the <strong>${remedy}</strong>. Begin your practice with this sacred frequency:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${mantraLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #D4AF37, #b8860b); color: #0a0a0a; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 0.1em; border-radius: 8px;">Listen to Your Remedy Mantra →</a>
      </div>
      <p style="color: rgba(229,229,229,0.8); font-size: 14px; line-height: 1.6;">With love,<br>Sacred Healing</p>
    </div>
  </div>
</body>
</html>`,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Akashic purchase email sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-akashic-purchase-email] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
