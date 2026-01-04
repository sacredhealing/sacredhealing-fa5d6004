import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[START-FREE-TRIAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Check if user already has an active trial
    const { data: existingTrial, error: trialCheckError } = await supabaseClient
      .from("free_trials")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingTrial) {
      logStep("User already has a trial", { trialId: existingTrial.id });
      return new Response(JSON.stringify({
        success: false,
        error: "You have already used your free trial",
        trial: existingTrial
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if user already has an active membership
    const { data: existingMembership } = await supabaseClient
      .from("user_memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (existingMembership) {
      logStep("User already has active membership");
      return new Response(JSON.stringify({
        success: false,
        error: "You already have an active membership"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create 14-day free trial
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 14);

    const { data: newTrial, error: insertError } = await supabaseClient
      .from("free_trials")
      .insert({
        user_id: userId,
        started_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        trial_tier: "premium"
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error creating trial", { error: insertError.message });
      throw new Error(insertError.message);
    }

    logStep("Trial created successfully", { trialId: newTrial.id, endsAt: endsAt.toISOString() });

    return new Response(JSON.stringify({
      success: true,
      trial: newTrial,
      message: "Your 14-day free trial has started!"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
