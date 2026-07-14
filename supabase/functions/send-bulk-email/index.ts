import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function wrapInTemplate(text: string): string {
  const paragraphs = text.split(/\n\n+/).map(p =>
    `<p style="margin:0 0 16px;line-height:1.6;color:#333333;">${p.replace(/\n/g, '<br/>')}</p>`
  ).join('');
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f1ec;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
<div style="background:linear-gradient(135deg,#8B5E3C,#A0522D);padding:30px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:normal;letter-spacing:1px;">Siddha Quantum Nexus</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.5px;">Kritagya Das &amp; Karaveera Nivasini Dasi</p>
</div>
<div style="padding:30px 35px;">${paragraphs}</div>
<div style="background:#f4f1ec;padding:20px;text-align:center;font-size:12px;color:#999;">
<p style="margin:0;">Siddha Quantum Nexus &bull; Kritagya Das &amp; Karaveera Nivasini Dasi</p>
</div></div></body></html>`;
}

interface BulkEmailRequest {
  subject: string;
  plainText?: string;
  htmlContent?: string;
  testEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── Auth gate: admin only ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.split(" ")[1]);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabaseClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, plainText, htmlContent, testEmail }: BulkEmailRequest = await req.json();

    if (!subject || (!plainText && !htmlContent)) {
      throw new Error("Subject and content are required");
    }

    // Use plainText wrapped in template, or fall back to raw htmlContent
    const finalHtml = plainText ? wrapInTemplate(plainText) : htmlContent!;

    // Test mode: send exactly one email, never touch the real subscriber list.
    if (testEmail) {
      console.log(`Sending TEST email to ${testEmail} only (real subscribers untouched)`);
      const personalizedHtml = finalHtml
        .replace(/{{name}}/g, "Test")
        .replace(/{{email}}/g, testEmail);

      // IMPORTANT: resend-node does NOT throw on API failure — it returns
      // { data, error }. A try/catch here would silently miss real failures
      // (bad API key, unverified domain, invalid recipient, etc).
      const { data: sendData, error: sendError } = await resend.emails.send({
        from: "Kritagya Das & Karaveera Nivasini Dasi | Siddha Quantum Nexus <noreply@mail.siddhaquantumnexus.com>",
        to: [testEmail],
        subject,
        html: personalizedHtml,
      });

      if (sendError) {
        console.error("Test send failed:", sendError);
        return new Response(
          JSON.stringify({ success: false, error: sendError.message ?? JSON.stringify(sendError) }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Test send succeeded, Resend id:", sendData?.id);
      return new Response(
        JSON.stringify({ success: true, sent: 1, test: true, resendId: sendData?.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Fetching active subscribers...");

    const { data: subscribers, error: fetchError } = await supabaseClient
      .from("email_subscribers")
      .select("email, name")
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching subscribers:", fetchError);
      throw new Error("Failed to fetch subscribers");
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active subscribers" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending emails to ${subscribers.length} subscribers...`);

    const batchSize = 10;
    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const emailPromises = batch.map(async (subscriber) => {
        const personalizedHtml = finalHtml
          .replace(/{{name}}/g, subscriber.name || "Friend")
          .replace(/{{email}}/g, subscriber.email);

        // IMPORTANT: resend-node does NOT throw on API failure — it returns
        // { data, error }. The previous version of this code wrapped this in
        // try/catch and never actually checked `error`, so every send was
        // counted as successful even if Resend rejected it (unverified
        // domain, bad recipient, rate limit, etc). Fixed to check explicitly.
        try {
          const { error: sendError } = await resend.emails.send({
            from: "Kritagya Das & Karaveera Nivasini Dasi | Siddha Quantum Nexus <noreply@mail.siddhaquantumnexus.com>",
            to: [subscriber.email],
            subject: subject,
            html: personalizedHtml,
          });

          if (sendError) {
            errorCount++;
            const errorMsg = sendError.message ?? JSON.stringify(sendError);
            errors.push(`${subscriber.email}: ${errorMsg}`);
            console.error(`Resend rejected send to ${subscriber.email}:`, sendError);
            return;
          }

          sentCount++;
          console.log(`Email sent to: ${subscriber.email}`);
        } catch (err) {
          // Still keep this for genuinely unexpected errors (network, etc).
          errorCount++;
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`${subscriber.email}: ${errorMsg}`);
          console.error(`Unexpected error sending to ${subscriber.email}:`, err);
        }
      });

      await Promise.all(emailPromises);

      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Bulk email complete. Sent: ${sentCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
