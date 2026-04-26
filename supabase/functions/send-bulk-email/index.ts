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
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:normal;letter-spacing:1px;">Sacred Healing</h1>
</div>
<div style="padding:30px 35px;">${paragraphs}</div>
<div style="background:#f4f1ec;padding:20px;text-align:center;font-size:12px;color:#999;">
<p style="margin:0;">Sacred Healing &bull; Spiritual Growth &amp; Wellness</p>
</div></div></body></html>`;
}

interface BulkEmailRequest {
  subject: string;
  plainText?: string;
  htmlContent?: string;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { subject, plainText, htmlContent }: BulkEmailRequest = await req.json();

    if (!subject || (!plainText && !htmlContent)) {
      throw new Error("Subject and content are required");
    }

    // Use plainText wrapped in template, or fall back to raw htmlContent
    const finalHtml = plainText ? wrapInTemplate(plainText) : htmlContent!;

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
        try {
          const personalizedHtml = finalHtml
            .replace(/{{name}}/g, subscriber.name || "Friend")
            .replace(/{{email}}/g, subscriber.email);

          await resend.emails.send({
            from: "Sacred Healing <noreply@mail.siddhaquantumnexus.com>",
            to: [subscriber.email],
            subject: subject,
            html: personalizedHtml,
          });

          sentCount++;
          console.log(`Email sent to: ${subscriber.email}`);
        } catch (err) {
          errorCount++;
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`${subscriber.email}: ${errorMsg}`);
          console.error(`Failed to send to ${subscriber.email}:`, err);
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
