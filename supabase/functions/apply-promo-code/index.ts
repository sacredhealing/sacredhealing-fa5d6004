import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPLY-PROMO-CODE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { code, tier_slug } = await req.json();
    
    if (!code) {
      throw new Error("Promo code is required");
    }

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
    logStep("User authenticated", { userId, code: code.toUpperCase() });

    // Find the promo code
    const { data: offer, error: offerError } = await supabaseClient
      .from("promotional_offers")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (offerError || !offer) {
      logStep("Promo code not found", { code });
      return new Response(JSON.stringify({
        valid: false,
        error: "Invalid promo code"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if code has expired
    if (offer.valid_until && new Date(offer.valid_until) < new Date()) {
      logStep("Promo code expired", { validUntil: offer.valid_until });
      return new Response(JSON.stringify({
        valid: false,
        error: "This promo code has expired"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if code has reached max uses
    if (offer.max_uses && offer.current_uses >= offer.max_uses) {
      logStep("Promo code max uses reached", { maxUses: offer.max_uses, currentUses: offer.current_uses });
      return new Response(JSON.stringify({
        valid: false,
        error: "This promo code has reached its usage limit"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if tier is applicable
    if (tier_slug && offer.applicable_tiers && !offer.applicable_tiers.includes(tier_slug)) {
      logStep("Promo code not applicable to tier", { tierSlug: tier_slug, applicableTiers: offer.applicable_tiers });
      return new Response(JSON.stringify({
        valid: false,
        error: "This promo code is not valid for this plan"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if user has already used this code
    const { data: existingUserOffer } = await supabaseClient
      .from("user_offers")
      .select("*")
      .eq("user_id", userId)
      .eq("offer_id", offer.id)
      .single();

    if (existingUserOffer?.redeemed_at) {
      logStep("User already redeemed this code");
      return new Response(JSON.stringify({
        valid: false,
        error: "You have already used this promo code"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Save the user offer if not exists
    if (!existingUserOffer) {
      await supabaseClient
        .from("user_offers")
        .insert({
          user_id: userId,
          offer_id: offer.id,
          expires_at: offer.valid_until
        });
    }

    logStep("Promo code validated successfully", {
      offerId: offer.id,
      discountType: offer.discount_type,
      discountValue: offer.discount_value
    });

    return new Response(JSON.stringify({
      valid: true,
      offer: {
        id: offer.id,
        name: offer.name,
        code: offer.code,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        applicable_tiers: offer.applicable_tiers
      }
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
