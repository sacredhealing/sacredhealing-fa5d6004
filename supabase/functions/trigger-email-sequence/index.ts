import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriggerRequest {
  userId: string;
  triggerType: string;
  email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, triggerType, email } = await req.json() as TriggerRequest;

    if (!userId || !triggerType) {
      throw new Error("userId and triggerType are required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find active sequence for this trigger type
    const { data: sequence, error: seqError } = await supabaseClient
      .from("email_sequences")
      .select("*")
      .eq("trigger_type", triggerType)
      .eq("is_active", true)
      .single();

    if (seqError || !sequence) {
      console.log("No active sequence found for trigger:", triggerType);
      return new Response(
        JSON.stringify({ success: true, message: "No sequence found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all steps for this sequence
    const { data: steps, error: stepsError } = await supabaseClient
      .from("email_sequence_steps")
      .select("*")
      .eq("sequence_id", sequence.id)
      .order("step_order");

    if (stepsError || !steps?.length) {
      console.log("No steps found for sequence:", sequence.id);
      return new Response(
        JSON.stringify({ success: true, message: "No steps in sequence" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Queue all steps with appropriate delays
    const now = new Date();
    const queueEntries = steps.map((step) => ({
      user_id: userId,
      sequence_id: sequence.id,
      step_id: step.id,
      scheduled_for: new Date(now.getTime() + step.delay_hours * 60 * 60 * 1000).toISOString(),
      status: "pending",
    }));

    const { error: insertError } = await supabaseClient
      .from("user_email_queue")
      .insert(queueEntries);

    if (insertError) {
      throw insertError;
    }

    console.log(`Queued ${queueEntries.length} emails for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        queued: queueEntries.length,
        sequenceName: sequence.name 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error triggering sequence:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
