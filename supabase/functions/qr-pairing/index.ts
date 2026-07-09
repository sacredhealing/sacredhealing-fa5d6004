import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[QR-PAIRING] ${step}${detailsStr}`);
};

/**
 * QR Sign-In pairing flow:
 *  1. Desktop calls action=create        -> gets { token }, renders it as a QR code
 *  2. Desktop polls action=status        -> { status: 'pending' | 'confirmed' | 'expired' }
 *  3. Phone (already logged in) opens /pair?token=... and calls action=confirm
 *     with its own Authorization header -> server marks the token confirmed and
 *     mints a one-time magic-link token_hash tied to that phone's account.
 *  4. Desktop, seeing status=confirmed, calls action=consume once -> receives the
 *     token_hash, then calls supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
 *     itself to establish its own session. The row is deleted immediately after
 *     consume so the hash can never be replayed.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, token } = await req.json();
    logStep("Request", { action, token });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Opportunistic cleanup of old rows (cheap, non-blocking best-effort)
    supabaseAdmin
      .from("qr_pairing_tokens")
      .delete()
      .lt("expires_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .then(() => {})
      .catch(() => {});

    if (action === "create") {
      const { data, error } = await supabaseAdmin
        .from("qr_pairing_tokens")
        .insert({ status: "pending" })
        .select("token, expires_at")
        .single();

      if (error) throw error;
      logStep("Created token", { token: data.token });

      return new Response(JSON.stringify({ token: data.token, expires_at: data.expires_at }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      if (!token) throw new Error("token is required");

      const { data, error } = await supabaseAdmin
        .from("qr_pairing_tokens")
        .select("status, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (error) throw error;
      if (!data || new Date(data.expires_at) < new Date()) {
        return new Response(JSON.stringify({ status: "expired" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ status: data.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "confirm") {
      if (!token) throw new Error("token is required");

      // The PHONE must be authenticated to confirm — this is what makes the
      // pairing safe. Nobody can approve a sign-in they aren't logged into.
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header provided");
      const bearerToken = authHeader.replace("Bearer ", "");

      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(bearerToken);
      if (userError || !userData.user) throw new Error("Phone is not authenticated");
      const user = userData.user;

      const { data: row, error: rowError } = await supabaseAdmin
        .from("qr_pairing_tokens")
        .select("status, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (rowError) throw rowError;
      if (!row || new Date(row.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "This QR code has expired. Refresh the page and scan the new one." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (row.status !== "pending") {
        return new Response(JSON.stringify({ error: "This QR code was already used." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!user.email) throw new Error("Account has no email on file — QR sign-in needs one.");

      // Mint a one-time magic-link the desktop will redeem exactly once.
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
      });
      if (linkError) throw linkError;

      const tokenHash = linkData.properties?.hashed_token;
      if (!tokenHash) throw new Error("Could not generate sign-in link");

      const { error: updateError } = await supabaseAdmin
        .from("qr_pairing_tokens")
        .update({ status: "confirmed", user_id: user.id, session_hash: tokenHash })
        .eq("token", token);

      if (updateError) throw updateError;
      logStep("Confirmed token", { token, userId: user.id });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "consume") {
      if (!token) throw new Error("token is required");

      const { data: row, error: rowError } = await supabaseAdmin
        .from("qr_pairing_tokens")
        .select("status, session_hash, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (rowError) throw rowError;
      if (!row || row.status !== "confirmed" || !row.session_hash) {
        return new Response(JSON.stringify({ error: "Not confirmed yet" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete immediately so this hash can never be replayed, even if the
      // desktop's verifyOtp call fails and it retries — retries get nothing.
      await supabaseAdmin.from("qr_pairing_tokens").delete().eq("token", token);

      logStep("Consumed token", { token });
      return new Response(JSON.stringify({ token_hash: row.session_hash }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    logStep("ERROR", { message: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
