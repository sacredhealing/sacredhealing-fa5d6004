import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["sacredhealingvibe@gmail.com", "laila.amrouche@gmail.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let authorized = token === serviceKey;
    if (!authorized) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      target_email,
      target_user_id,
      email_type,
      custom_subject,
      custom_body,
    } = await req.json() as Record<string, string | undefined>;

    let recipientEmail = target_email?.trim();
    let recipientId: string | null = target_user_id || null;
    let firstName = "Sacred One";

    if (recipientId && !recipientEmail) {
      const { data: authData } = await supabase.auth.admin.getUserById(recipientId);
      recipientEmail = authData?.user?.email ?? undefined;
    }

    if (recipientId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, full_name")
        .eq("user_id", recipientId)
        .maybeSingle();
      if (profile) {
        firstName =
          (profile.first_name && String(profile.first_name).trim()) ||
          (profile.full_name && String(profile.full_name).split(" ")[0]) ||
          firstName;
      }
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No recipient email resolved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    };

    let result: Record<string, unknown> = {};

    if (email_type === "welcome") {
      const res = await fetch(`${baseUrl}/welcome-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: recipientEmail,
          user_id: recipientId,
          first_name: firstName,
        }),
      });
      result = await res.json();

    } else if (email_type === "weekly_digest") {
      const res = await fetch(`${baseUrl}/weekly-digest`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          single_email: recipientEmail,
          single_name: firstName,
          single_user_id: recipientId,
        }),
      });
      result = await res.json();

    } else if (email_type === "lakshmi_friday") {
      const res = await fetch(`${baseUrl}/lakshmi-friday`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          single_email: recipientEmail,
          single_user_id: recipientId,
          single_name: firstName,
        }),
      });
      result = await res.json();

    } else if (email_type === "custom" && custom_subject && custom_body) {
      const html = buildCustomHTML(firstName, custom_subject, custom_body);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Shiva · SQI <noreply@siddhaquantumnexus.com>",
          to: recipientEmail,
          subject: custom_subject,
          html,
        }),
      });

      result = { success: res.ok };

      await supabase.from("email_logs").insert({
        email_type: "custom",
        recipient_email: recipientEmail,
        recipient_id: recipientId,
        subject: custom_subject,
        status: res.ok ? "sent" : "failed",
        metadata: { sent_by: "admin" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid email_type or missing custom fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, recipient: recipientEmail, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildCustomHTML(firstName: string, _subject: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
  <tr><td align="center" style="padding:40px 16px 60px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="text-align:center;padding:48px 0 32px;">
      <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.7em;text-transform:uppercase;margin-bottom:14px;">SIDDHA QUANTUM NEXUS · SQI 2050</div>
      <div style="color:#D4AF37;font-size:26px;font-weight:900;letter-spacing:-0.03em;">⟁ TRANSMISSION</div>
    </td></tr>
    <tr><td style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.14);border-radius:24px;padding:40px 36px;">
      <div style="color:rgba(255,255,255,0.9);font-size:15px;margin-bottom:20px;">Beloved <strong style="color:#D4AF37;">${firstName}</strong>,</div>
      <div style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.8;">${body.replace(/\n/g, "<br>")}</div>
      <div style="text-align:center;margin-top:32px;">
        <a href="https://sacredhealing.lovable.app"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#050505;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;padding:16px 40px;border-radius:100px;text-decoration:none;">
          Enter the Nexus →
        </a>
      </div>
    </td></tr>
    <tr><td style="text-align:center;padding:28px 0 16px;color:rgba(255,255,255,0.2);font-size:11px;">
      © 2026 Sacred Healing · sacredhealing.lovable.app
    </td></tr>
  </table></td></tr>
</table>
</body>
</html>`;
}
