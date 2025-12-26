import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SEND-SHC-P2P] Starting P2P transfer");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { recipientIdentifier, amount, note } = await req.json();

    if (!recipientIdentifier || !amount || amount <= 0) {
      throw new Error("Invalid transfer parameters");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get sender's balance
    const { data: senderBalance } = await supabaseAdmin
      .from("user_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!senderBalance || senderBalance.balance < amount) {
      throw new Error(`Insufficient balance. Available: ${senderBalance?.balance || 0} SHC`);
    }

    // Find recipient by referral code or email
    let recipientUserId: string | null = null;

    // Try to find by referral code first
    const { data: recipientByCode } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("referral_code", recipientIdentifier.toLowerCase())
      .single();

    if (recipientByCode) {
      recipientUserId = recipientByCode.user_id;
    } else {
      // Try to find by email via auth.users (using service role)
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const recipientUser = users.find(u => u.email?.toLowerCase() === recipientIdentifier.toLowerCase());
      if (recipientUser) {
        recipientUserId = recipientUser.id;
      }
    }

    if (!recipientUserId) {
      throw new Error("Recipient not found. Please check the referral code or email.");
    }

    if (recipientUserId === user.id) {
      throw new Error("Cannot send to yourself");
    }

    console.log(`[SEND-SHC-P2P] Transferring ${amount} SHC from ${user.id} to ${recipientUserId}`);

    // Deduct from sender
    await supabaseAdmin
      .from("user_balances")
      .update({
        balance: senderBalance.balance - amount,
        total_spent: (await supabaseAdmin.from("user_balances").select("total_spent").eq("user_id", user.id).single()).data?.total_spent + amount,
      })
      .eq("user_id", user.id);

    // Add to recipient
    const { data: recipientBalance } = await supabaseAdmin
      .from("user_balances")
      .select("balance, total_earned")
      .eq("user_id", recipientUserId)
      .single();

    if (recipientBalance) {
      await supabaseAdmin
        .from("user_balances")
        .update({
          balance: recipientBalance.balance + amount,
          total_earned: recipientBalance.total_earned + amount,
        })
        .eq("user_id", recipientUserId);
    } else {
      // Create balance record if doesn't exist
      await supabaseAdmin
        .from("user_balances")
        .insert({
          user_id: recipientUserId,
          balance: amount,
          total_earned: amount,
        });
    }

    // Record transactions for both parties
    await supabaseAdmin
      .from("shc_transactions")
      .insert([
        {
          user_id: user.id,
          type: "sent",
          amount: -amount,
          description: note || `Sent to user`,
          status: "completed",
        },
        {
          user_id: recipientUserId,
          type: "received",
          amount: amount,
          description: note || `Received from user`,
          status: "completed",
        },
      ]);

    console.log("[SEND-SHC-P2P] Transfer completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        amount,
        recipientId: recipientUserId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[SEND-SHC-P2P] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
