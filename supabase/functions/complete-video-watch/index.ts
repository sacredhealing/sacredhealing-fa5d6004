import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHC_REWARD = 100;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { videoId, videoTitle } = await req.json();
    if (!videoId) throw new Error("Video ID required");

    console.log("[COMPLETE-VIDEO] User:", user.id, "Video:", videoId);

    // Check if already watched
    const { data: existing } = await supabaseAdmin
      .from("video_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyWatched: true,
        message: "You've already earned SHC for this video" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record completion
    await supabaseAdmin.from("video_completions").insert({
      user_id: user.id,
      video_id: videoId,
      video_title: videoTitle,
      shc_earned: SHC_REWARD,
    });

    // Update user balance
    const { data: balance } = await supabaseAdmin
      .from("user_balances")
      .select("balance, total_earned")
      .eq("user_id", user.id)
      .single();

    if (balance) {
      await supabaseAdmin
        .from("user_balances")
        .update({
          balance: balance.balance + SHC_REWARD,
          total_earned: balance.total_earned + SHC_REWARD,
        })
        .eq("user_id", user.id);
    }

    // Record transaction
    await supabaseAdmin.from("shc_transactions").insert({
      user_id: user.id,
      type: "earned",
      amount: SHC_REWARD,
      description: `Watched video: ${videoTitle || videoId}`,
      status: "completed",
    });

    console.log("[COMPLETE-VIDEO] Rewarded", SHC_REWARD, "SHC");

    return new Response(JSON.stringify({ 
      success: true,
      shcEarned: SHC_REWARD,
      message: `You earned ${SHC_REWARD} SHC!` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[COMPLETE-VIDEO] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});