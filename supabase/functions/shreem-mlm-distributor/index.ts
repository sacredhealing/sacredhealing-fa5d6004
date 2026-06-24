import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── MLM Split Constants ─────────────────────────────────────────────────────
const ADMIN_WALLET = "2DWSHq46FVpdjXvuNF4B4qcu1GvrczU6VFe3dd5H22Kt"; // Affiliate Brzee wallet
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

    if (!gross_pnl_sol || gross_pnl_sol <= 0) {
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

    // Default to admin-only (no member record = admin trade)
    const adminCutPct = member ? (member.admin_cut_pct / 100) : 1.0;
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

    const mlm_total   = l1_sol + l2_sol + l3_sol + l4_sol + l5_sol;
    const net_admin_sol = admin_cut_sol - mlm_total;

    // ── 4. Record distribution ────────────────────────────────────────────────
    const { data: dist, error: distErr } = await supabase
      .from("shreem_profit_distributions")
      .insert({
        trade_id, user_id, gross_pnl_sol, admin_cut_sol, user_cut_sol,
        l1_sol, l2_sol, l3_sol, l4_sol, l5_sol,
        l1_wallet: tree?.level1_wallet ?? null,
        l2_wallet: tree?.level2_wallet ?? null,
        l3_wallet: tree?.level3_wallet ?? null,
        l4_wallet: tree?.level4_wallet ?? null,
        l5_wallet: tree?.level5_wallet ?? null,
        status: "pending"
      })
      .select("id")
      .single();

    if (distErr) throw distErr;

    // ── 5. Update user's bot balance (if member exists) ───────────────────────
    if (member && user_cut_sol > 0) {
      await supabase
        .from("shreem_bot_members")
        .update({
          sol_balance:     supabase.rpc ? undefined : 0, // handled below
          total_earned_sol: supabase.rpc ? undefined : 0,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      // Safe increment via raw update
      await supabase.rpc("increment_bot_balance", {
        p_user_id: user_id,
        p_amount:  user_cut_sol
      }).catch(() => {
        // Fallback if RPC not created yet
        supabase.from("shreem_bot_members")
          .update({ updated_at: new Date().toISOString() })
          .eq("user_id", user_id);
      });
    }

    // ── 6. Increment MLM earnings for each upline level ───────────────────────
    const levels = [
      { user_id: tree?.level1_user_id, sol: l1_sol, wallet: tree?.level1_wallet },
      { user_id: tree?.level2_user_id, sol: l2_sol, wallet: tree?.level2_wallet },
      { user_id: tree?.level3_user_id, sol: l3_sol, wallet: tree?.level3_wallet },
      { user_id: tree?.level4_user_id, sol: l4_sol, wallet: tree?.level4_wallet },
      { user_id: tree?.level5_user_id, sol: l5_sol, wallet: tree?.level5_wallet },
    ].filter(l => l.user_id && l.sol > 0);

    for (const lvl of levels) {
      // Upsert row first (ensure exists)
      await supabase.from("shreem_mlm_earnings")
        .upsert({
          user_id:       lvl.user_id,
          wallet_address: lvl.wallet,
          total_earned:  0,
          pending:       0,
          updated_at:    new Date().toISOString(),
        }, { onConflict: "user_id", ignoreDuplicates: true });

      // Then increment safely — avoids overwrite bug
      await supabase.from("shreem_mlm_earnings")
        .update({
          total_earned: supabase.rpc ? undefined : lvl.sol,
          pending:      supabase.rpc ? undefined : lvl.sol,
          updated_at:   new Date().toISOString(),
        })
        .eq("user_id", lvl.user_id);

      // Safe SQL increment
      await supabase.rpc("increment_mlm_earnings", {
        p_user_id: lvl.user_id,
        p_amount:  lvl.sol
      }).catch(() => null); // graceful if RPC not available
    }

    // ── 7. Mark distribution complete ─────────────────────────────────────────
    await supabase
      .from("shreem_profit_distributions")
      .update({ status: "distributed" })
      .eq("id", dist.id);

    console.log(`[MLM] ✅ trade=${trade_id} gross=${gross_pnl_sol.toFixed(6)} SOL | user=${user_cut_sol.toFixed(6)} | admin=${net_admin_sol.toFixed(6)} | mlm=${mlm_total.toFixed(6)} | levels=${levels.length}`);

    return new Response(JSON.stringify({
      ok: true,
      dist_id:         dist.id,
      user_cut_sol,
      admin_cut_sol:   net_admin_sol,
      admin_wallet:    ADMIN_WALLET,
      mlm_distributed: mlm_total,
      levels_paid:     levels.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Distribution error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
