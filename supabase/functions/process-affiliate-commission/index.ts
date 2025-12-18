import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AFFILIATE-COMMISSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { userId, purchaseType, purchaseAmount, purchaseId } = await req.json();
    
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId');
    }
    if (typeof purchaseAmount !== 'number' || purchaseAmount <= 0) {
      throw new Error('Invalid purchase amount');
    }
    if (purchaseAmount > 100000) {
      throw new Error('Purchase amount exceeds maximum');
    }
    const allowedTypes = ['course', 'membership', 'healing', 'music', 'healing_audio', 'meditation', 'transformation', 'session'];
    if (!allowedTypes.includes(purchaseType)) {
      throw new Error('Invalid purchase type');
    }
    
    // Check for duplicate processing
    if (purchaseId) {
      const { data: existing } = await supabaseAdmin
        .from('affiliate_earnings')
        .select('id')
        .eq('purchase_id', purchaseId)
        .maybeSingle();
      if (existing) {
        logStep("Commission already processed for this purchase", { purchaseId });
        return new Response(JSON.stringify({ success: true, message: "Commission already processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }
    
    logStep("Processing affiliate commission", { userId, purchaseType, purchaseAmount });

    // Get user's profile to check if they were referred
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('referred_by')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.referred_by) {
      logStep("User has no referrer, skipping commission");
      return new Response(JSON.stringify({ success: true, message: "No referrer found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const referrerId = profile.referred_by;
    logStep("Found referrer", { referrerId });

    // Calculate commission (30%)
    const commissionRate = 0.30;
    const commissionSHC = Math.floor(purchaseAmount * commissionRate);

    logStep("Calculated commission", { commissionRate, commissionSHC });

    // Create affiliate earning record
    const { error: earningError } = await supabaseAdmin
      .from('affiliate_earnings')
      .insert({
        affiliate_user_id: referrerId,
        referred_user_id: userId,
        purchase_type: purchaseType,
        purchase_amount: purchaseAmount,
        purchase_id: purchaseId || null,
        commission_rate: commissionRate,
        commission_shc: commissionSHC,
        status: 'pending',
      });

    if (earningError) {
      logStep("Error creating earning record", earningError);
      throw earningError;
    }

    // Update referrer's total affiliate earnings in profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        total_affiliate_earnings: supabaseAdmin.rpc('increment', { 
          row_id: referrerId, 
          table_name: 'profiles', 
          column_name: 'total_affiliate_earnings', 
          increment_value: commissionSHC 
        })
      })
      .eq('user_id', referrerId);

    // Actually, let's do a simpler approach - fetch and update
    const { data: referrerProfile } = await supabaseAdmin
      .from('profiles')
      .select('total_affiliate_earnings')
      .eq('user_id', referrerId)
      .single();

    if (referrerProfile) {
      await supabaseAdmin
        .from('profiles')
        .update({
          total_affiliate_earnings: Number(referrerProfile.total_affiliate_earnings || 0) + commissionSHC
        })
        .eq('user_id', referrerId);
    }

    // Credit the SHC to the referrer's balance
    const { data: referrerBalance } = await supabaseAdmin
      .from('user_balances')
      .select('balance, total_earned')
      .eq('user_id', referrerId)
      .single();

    if (referrerBalance) {
      await supabaseAdmin
        .from('user_balances')
        .update({
          balance: Number(referrerBalance.balance) + commissionSHC,
          total_earned: Number(referrerBalance.total_earned) + commissionSHC
        })
        .eq('user_id', referrerId);

      // Record the transaction
      await supabaseAdmin
        .from('shc_transactions')
        .insert({
          user_id: referrerId,
          type: 'earned',
          amount: commissionSHC,
          description: `Affiliate commission from ${purchaseType}`,
          status: 'completed'
        });

      // Mark the earning as paid since we credited immediately
      await supabaseAdmin
        .from('affiliate_earnings')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('affiliate_user_id', referrerId)
        .eq('purchase_id', purchaseId)
        .eq('status', 'pending');
    }

    logStep("Commission processed successfully", { referrerId, commissionSHC });

    return new Response(JSON.stringify({ 
      success: true, 
      commissionSHC,
      referrerId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
