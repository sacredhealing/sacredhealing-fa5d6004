import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-TELEGRAM-INVITE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { email: user.email });

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const groupId = Deno.env.get("TELEGRAM_STARGATE_GROUP_ID");

    if (!botToken || !groupId) {
      throw new Error("Telegram configuration missing");
    }

    // Create an invite link for the group
    const createInviteUrl = `https://api.telegram.org/bot${botToken}/createChatInviteLink`;
    
    const inviteResponse = await fetch(createInviteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: groupId,
        member_limit: 1, // Single-use invite link
        name: `Stargate Member: ${user.email}`,
      }),
    });

    const inviteData = await inviteResponse.json();
    logStep("Telegram API response", inviteData);

    if (!inviteData.ok) {
      throw new Error(`Telegram API error: ${inviteData.description}`);
    }

    const inviteLink = inviteData.result.invite_link;
    logStep("Invite link created", { inviteLink });

    return new Response(JSON.stringify({ 
      success: true, 
      invite_link: inviteLink 
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
