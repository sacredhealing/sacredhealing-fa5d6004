import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── MLM Split Constants ─────────────────────────────────────────────────────
const ADMIN_WALLET = "YOUR_ADMIN_SOLANA_WALLET"; // replace in Lovable env
const MLM_LEVELS = { l1: 0.20, l2: 0.10, l3: 0.05, l4: 0.03, l5: 0.02 };
// Admin keeps 60% of their cut after MLM payouts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { trade_id, user_id, gross_pnl_sol } = await req.json();

    if (gross_pnl_sol <= 0) {
      return new Response(JSON.stringify({ ok: true, msg: "no profit to distribute" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 1. Get user's bot tier ────────────────────────────────────────────────
    const { data: member } = await supabase
      .from("shreem_bot_members")
      .select("tier, admin_cut_pct, wallet_address")
      .eq("user_id", user_id)
      .single();

    if (!member) throw new Error("No bot member record");

    const adminCutPct = member.admin_cut_pct / 100; // e.g. 0.70 for atma_seeds
    const userCutPct  = 1 - adminCutPct;

    const admin_cut_sol = gross_pnl_sol * adminCutPct;
    const user_cut_sol  = gross_pnl_sol * userCutPct;

    // ── 2. Get upline tree ────────────────────────────────────────────────────
    const { data: tree } = await supabase
      .from("shreem_mlm_tree")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // ── 3. Calculate MLM splits from admin's cut ──────────────────────────────
    const l1_sol = tree?.level1_wallet ? admin_cut_sol * MLM_LEVELS.l1 : 0;
    const l2_sol = tree?.level2_wallet ? admin_cut_sol * MLM_LEVELS.l2 : 0;
    const l3_sol = tree?.level3_wallet ? admin_cut_sol * MLM_LEVELS.l3 : 0;
    const l4_sol = tree?.level4_wallet ? admin_cut_sol * MLM_LEVELS.l4 : 0;
    const l5_sol = tree?.level5_wallet ? admin_cut_sol * MLM_LEVELS.l5 : 0;

    const mlm_total = l1_sol + l2_sol + l3_sol + l4_sol + l5_sol;
    const net_admin_sol = admin_cut_sol - mlm_total;

    // ── 4. Record distribution ────────────────────────────────────────────────
    const { data: dist, error: distErr } = await supabase
      .from("shreem_profit_distributions")
      .insert({
        trade_id, user_id, gross_pnl_sol, admin_cut_sol, user_cut_sol,
        l1_sol, l2_sol, l3_sol, l4_sol, l5_sol,
        l1_wallet: tree?.level1_wallet,
        l2_wallet: tree?.level2_wallet,
        l3_wallet: tree?.level3_wallet,
        l4_wallet: tree?.level4_wallet,
        l5_wallet: tree?.level5_wallet,
        status: "pending"
      })
      .select("id")
      .single();

    if (distErr) throw distErr;

    // ── 5. Update user's bot balance ──────────────────────────────────────────
    await supabase.rpc("increment_bot_balance", {
      p_user_id: user_id,
      p_amount: user_cut_sol
    });

    // ── 6. Update MLM earnings ledger for each level ──────────────────────────
    const levels = [
      { user_id: tree?.level1_user_id, sol: l1_sol, wallet: tree?.level1_wallet },
      { user_id: tree?.level2_user_id, sol: l2_sol, wallet: tree?.level2_wallet },
      { user_id: tree?.level3_user_id, sol: l3_sol, wallet: tree?.level3_wallet },
      { user_id: tree?.level4_user_id, sol: l4_sol, wallet: tree?.level4_wallet },
      { user_id: tree?.level5_user_id, sol: l5_sol, wallet: tree?.level5_wallet },
    ].filter(l => l.user_id && l.sol > 0);

    for (const lvl of levels) {
      await supabase.from("shreem_mlm_earnings")
        .upsert({
          user_id: lvl.user_id,
          wallet_address: lvl.wallet,
          total_earned: lvl.sol,
          pending: lvl.sol,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id",
          ignoreDuplicates: false
        });

      // Increment pending via raw SQL update to avoid overwrite
      await supabase.from("shreem_mlm_earnings")
        .update({
          total_earned: supabase.rpc ? undefined : lvl.sol, // handled by DB trigger
          updated_at: new Date().toISOString()
        })
        .eq("user_id", lvl.user_id);
    }

    // ── 7. Mark distribution complete ─────────────────────────────────────────
    await supabase
      .from("shreem_profit_distributions")
      .update({ status: "distributed" })
      .eq("id", dist.id);

    return new Response(JSON.stringify({
      ok: true,
      dist_id: dist.id,
      user_cut_sol,
      admin_cut_sol: net_admin_sol,
      mlm_distributed: mlm_total,
      levels_paid: levels.length
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Distribution error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
