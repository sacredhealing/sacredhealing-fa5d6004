import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralRequest {
  referralCode: string;
  userId?: string;
  eventType: 'click' | 'signup' | 'purchase';
  purchaseAmount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralCode, userId, eventType, purchaseAmount } = await req.json() as ReferralRequest;

    if (!referralCode) {
      throw new Error("referralCode is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the influencer partner
    const { data: partner, error: partnerError } = await supabaseClient
      .from("influencer_partners")
      .select("*")
      .eq("referral_code", referralCode)
      .eq("is_active", true)
      .single();

    if (partnerError || !partner) {
      console.log("No active partner found for code:", referralCode);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid referral code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update partner stats based on event type
    if (eventType === 'signup') {
      const { error: updateError } = await supabaseClient
        .from("influencer_partners")
        .update({ 
          total_referrals: partner.total_referrals + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", partner.id);

      if (updateError) {
        console.error("Error updating referral count:", updateError);
      }

      // Also store the affiliate relationship for commission tracking
      if (userId) {
        await supabaseClient
          .from("affiliates")
          .upsert({
            user_id: userId,
            referral_code: referralCode,
            referred_by: partner.id,
          }, { onConflict: 'user_id' });
      }
    }

    if (eventType === 'purchase' && purchaseAmount) {
      const commission = purchaseAmount * partner.commission_rate;
      
      const { error: updateError } = await supabaseClient
        .from("influencer_partners")
        .update({ 
          total_revenue: partner.total_revenue + purchaseAmount,
          updated_at: new Date().toISOString()
        })
        .eq("id", partner.id);

      if (updateError) {
        console.error("Error updating revenue:", updateError);
      }

      console.log(`Tracked purchase: €${purchaseAmount}, commission: €${commission.toFixed(2)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        partnerName: partner.name,
        eventType,
        commissionRate: partner.commission_rate
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error tracking referral:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
