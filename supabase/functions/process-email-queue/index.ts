import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get pending emails that are due
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from("user_email_queue")
      .select(`
        *,
        step:email_sequence_steps(*)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingEmails?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No pending emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingEmails.length} pending emails`);

    let successCount = 0;
    let failCount = 0;

    for (const queueItem of pendingEmails) {
      try {
        // Get user email from profiles
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email, display_name")
          .eq("id", queueItem.user_id)
          .single();

        if (!profile?.email) {
          // Try to get from auth.users via a different method
          const { data: { user } } = await supabaseClient.auth.admin.getUserById(queueItem.user_id);
          
          if (!user?.email) {
            console.log(`No email found for user ${queueItem.user_id}`);
            await supabaseClient
              .from("user_email_queue")
              .update({ status: "failed", error_message: "No email found" })
              .eq("id", queueItem.id);
            failCount++;
            continue;
          }

          // Personalize the email
          const step = queueItem.step as any;
          const personalizedHtml = step.html_template
            .replace(/{{name}}/g, user.user_metadata?.display_name || "Friend")
            .replace(/{{email}}/g, user.email);

          // Send via Resend
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Sacred Healing <hello@sacredhealing.app>",
              to: [user.email],
              subject: step.subject,
              html: personalizedHtml,
            }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Resend error: ${errorData}`);
          }

          // Mark as sent
          await supabaseClient
            .from("user_email_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", queueItem.id);

          successCount++;
        } else {
          // Use profile email
          const step = queueItem.step as any;
          const personalizedHtml = step.html_template
            .replace(/{{name}}/g, profile.display_name || "Friend")
            .replace(/{{email}}/g, profile.email);

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Sacred Healing <hello@sacredhealing.app>",
              to: [profile.email],
              subject: step.subject,
              html: personalizedHtml,
            }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Resend error: ${errorData}`);
          }

          await supabaseClient
            .from("user_email_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", queueItem.id);

          successCount++;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing email ${queueItem.id}:`, error);
        await supabaseClient
          .from("user_email_queue")
          .update({ 
            status: "failed", 
            error_message: errorMessage
          })
          .eq("id", queueItem.id);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: pendingEmails.length,
        sent: successCount,
        failed: failCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error processing email queue:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
