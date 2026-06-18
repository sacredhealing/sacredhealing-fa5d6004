// ═══════════════════════════════════════════════════════════════
// SHREEM BRZEE — Profit Distribution Patch
// Add this function to railway/shreem-brzee-bot/src/index.ts
// Call distributeProfit() after every successful paper/live trade
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY!;

// ── MLM tier config (mirrors DB) ─────────────────────────────────────────────
const TIER_CUTS: Record<string, number> = {
  atma_seeds:      70,
  prana_flow:      50,
  siddha_quantum:  25,
  akasha_infinity: 10,
  lifetime:         0,
};

const MLM_PCTS = { l1: 0.20, l2: 0.10, l3: 0.05, l4: 0.03, l5: 0.02 };

// ── Call after every profitable closed trade ──────────────────────────────────
export async function distributeProfit(params: {
  trade_id:     number;
  user_id:      string;
  gross_pnl_sol: number;
}) {
  if (params.gross_pnl_sol <= 0) return; // only on profit

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/shreem-mlm-distributor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify(params),
      }
    );
    const result = await res.json();
    if (result.ok) {
      console.log(
        `[MLM] Distributed ${params.gross_pnl_sol.toFixed(6)} SOL | ` +
        `User: ${result.user_cut_sol?.toFixed(6)} SOL | ` +
        `MLM: ${result.mlm_distributed?.toFixed(6)} SOL | ` +
        `Admin: ${result.admin_cut_sol?.toFixed(6)} SOL`
      );
    } else {
      console.error("[MLM] Distribution failed:", result.error);
    }
  } catch (err) {
    console.error("[MLM] Distribution error:", err);
  }
}

// ── Integration point (example usage in your existing bot close logic) ────────
// After you record a trade close in Supabase:
//
// const { data: trade } = await supabase
//   .from("shreem_brzee_paper_trades")
//   .insert({ ... })
//   .select("id")
//   .single();
//
// await distributeProfit({
//   trade_id: trade.id,
//   user_id: "MASTER_USER_ID",   // your admin UUID for now; per-user in Phase 2
//   gross_pnl_sol: pnlSol,
// });
