import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { audioId, paymentMethod } = await req.json();
    console.log("[PURCHASE-HEALING-AUDIO] Audio:", audioId, "Method:", paymentMethod);

    // Get audio details
    const { data: audio, error: audioError } = await supabaseAdmin
      .from("healing_audio")
      .select("*")
      .eq("id", audioId)
      .single();

    if (audioError || !audio) throw new Error("Audio not found");

    // Check if already purchased
    const { data: existing } = await supabaseAdmin
      .from("healing_audio_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("audio_id", audioId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyOwned: true,
        audioUrl: audio.audio_url 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (paymentMethod === "shc") {
      // Get user balance
      const { data: balance } = await supabaseAdmin
        .from("user_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!balance || balance.balance < audio.price_shc) {
        throw new Error("Insufficient SHC balance");
      }

      // Deduct balance
      await supabaseAdmin
        .from("user_balances")
        .update({
          balance: balance.balance - audio.price_shc,
          total_spent: balance.balance + audio.price_shc,
        })
        .eq("user_id", user.id);

      // Record transaction
      await supabaseAdmin.from("shc_transactions").insert({
        user_id: user.id,
        type: "spent",
        amount: audio.price_shc,
        description: `Purchased healing audio: ${audio.title}`,
        status: "completed",
      });

      // Record purchase
      await supabaseAdmin.from("healing_audio_purchases").insert({
        user_id: user.id,
        audio_id: audioId,
        payment_method: "shc",
        shc_paid: audio.price_shc,
      });

      return new Response(JSON.stringify({ 
        success: true, 
        audioUrl: audio.audio_url 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (paymentMethod === "stripe") {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }

      const origin = req.headers.get("origin") || "https://localhost:3000";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: audio.title,
                description: audio.description || "Healing audio track",
              },
              unit_amount: Math.round(audio.price_usd * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/healing?audio_success=true&audioId=${audioId}`,
        cancel_url: `${origin}/healing`,
        metadata: {
          user_id: user.id,
          audio_id: audioId,
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid payment method");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PURCHASE-HEALING-AUDIO] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
