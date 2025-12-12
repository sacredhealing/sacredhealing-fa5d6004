import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the authorization header to verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { subject, htmlContent, textContent }: BulkEmailRequest = await req.json();

    if (!subject || !htmlContent) {
      throw new Error("Subject and HTML content are required");
    }

    console.log("Fetching active subscribers...");

    // Get all active subscribers
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

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (subscriber) => {
        try {
          const personalizedHtml = htmlContent
            .replace(/{{name}}/g, subscriber.name || "Friend")
            .replace(/{{email}}/g, subscriber.email);

          await resend.emails.send({
            from: "Sacred Healing <onboarding@resend.dev>",
            to: [subscriber.email],
            subject: subject,
            html: personalizedHtml,
            text: textContent || undefined,
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

      // Small delay between batches to avoid rate limiting
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
