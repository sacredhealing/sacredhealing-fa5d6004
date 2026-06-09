import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// All 21 tracked whale wallets
const WALLET_MAP: Record<string, string> = {
  "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE": "Cupsey",
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5": "Orange",
  "HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt": "Shreem Brzee",
  "Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ": "Heyitsyolo",
  "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm": "Lenion",
  "gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw":  "Boredboar",
  "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp": "Hades",
  "AAvdewt71kkde2segr6gYnNemhNLfokyZpdzwwi4yDfm": "Kubera 72",
  "JD38n7ynKYcgPpF7k1BhXEeREu1KqptU93fVGy3S624k": "Brzee God",
  "9VPozuXeRi8FACAePmg8ckdSZkbeZfTJc6SqUDcKsUKm": "GBack",
  "GjK3S2ZgxTVFEkxg43JE8eC1tbztWCseBYyZ8o8sg9f":  "Tuna",
  "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51": "Fireball",
  "EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS": "Hachjdn",
  "5DzUSNro5kfNwB2dxkkTTYrPDXAi6vRnjf4mAN2an7Gc": "Crypto Circle",
  "2cBedD94RXYSEhEfQJUyLaNaHB4PVoL9z7LK6Mu11sJv": "Crocodile",
  "4ev7HVsESzFxKqGzQxJ5mzSM6NstGCTQXKXT8yHiaRP3": "Snow Spirit",
  "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o": "Cented",
  "Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA": "The Grande",
  "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu": "Remusofmars",
  "Fv9w9TQnqhzUszbDGRFPPkXwu5iJWG9VytmMJTCTnjxW": "A Milly",
  "J2ANNaq4uUk3iUGoNijKCwXTReGLyg2yQpGcAZjzyBZG": "J2ANNaq",
};

const PUMP_FUN = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const SOL_MINT = "So11111111111111111111111111111111111111112";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify webhook secret if set
  const secret = process.env.HELIUS_WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers["authorization"];
    if (auth !== secret) return res.status(401).json({ error: "unauthorized" });
  }

  if (req.method !== "POST") return res.status(405).end();

  const transactions: any[] = Array.isArray(req.body) ? req.body : [req.body];
  const inserted: string[] = [];

  for (const tx of transactions) {
    try {
      const sig       = tx.signature;
      const feePayer  = tx.feePayer;
      const label     = WALLET_MAP[feePayer];
      if (!label || !sig) continue;
      if (tx.transactionError) continue;

      // Parse token transfers from Helius enhanced format
      const transfers: any[] = tx.tokenTransfers || [];
      const accountKeys: string[] = (tx.accountData || []).map((a: any) => a.account);
      const isPumpFun = accountKeys.includes(PUMP_FUN);

      for (const t of transfers) {
        const fromOwner = t.fromUserAccount;
        const toOwner   = t.toUserAccount;
        const mint      = t.mint;

        if (!mint || mint === SOL_MINT) continue;

        const action = toOwner === feePayer ? "BUY" : fromOwner === feePayer ? "SELL" : null;
        if (!action) continue;

        // SOL amount from native transfers
        const nativeTransfers: any[] = tx.nativeTransfers || [];
        let amountSol = 0;
        for (const nt of nativeTransfers) {
          if (action === "BUY" && nt.fromUserAccount === feePayer) amountSol += nt.amount / 1e9;
          if (action === "SELL" && nt.toUserAccount === feePayer) amountSol += nt.amount / 1e9;
        }

        const { error } = await supabase.from("shreem_brzee_signals").upsert({
          sig,
          wallet: feePayer,
          label,
          action,
          mint,
          symbol: t.tokenSymbol || null,
          amount_sol: amountSol || null,
          token_amount: t.tokenAmount || null,
          is_pump_fun: isPumpFun,
          block_time: tx.timestamp || null,
        }, { onConflict: "sig" });

        if (!error) inserted.push(sig);
        break; // one signal per tx
      }
    } catch (e: any) {
      console.error("webhook parse error:", e.message);
    }
  }

  console.log(`[shreem-webhook] processed ${transactions.length} txs, inserted ${inserted.length} signals`);
  return res.status(200).json({ ok: true, inserted: inserted.length });
}
