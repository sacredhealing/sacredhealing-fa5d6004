import { createClient } from "@supabase/supabase-js";

// All 21 tracked whale wallets
const WALLET_MAP: Record<string, string> = {
  "Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB": "Euris",
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

// Vercel serverless handler — no @vercel/node dependency needed
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let transactions: any[];
  try {
    const body = await req.json();
    transactions = Array.isArray(body) ? body : [body];
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  let inserted = 0;

  for (const tx of transactions) {
    try {
      // Helius enhanced transaction format
      const sig        = tx.signature;
      const feePayer   = tx.feePayer;
      const timestamp  = tx.timestamp;
      const type       = tx.type; // "SWAP"

      if (!sig || !feePayer) continue;
      if (tx.transactionError) continue;

      // Match wallet
      const label = WALLET_MAP[feePayer];
      if (!label) {
        // feePayer not in our list — check all accountData addresses
        const allAccounts: string[] = (tx.accountData || []).map((a: any) => a.account);
        const matched = allAccounts.find((addr: string) => WALLET_MAP[addr]);
        if (!matched) continue;
      }

      const walletAddr = WALLET_MAP[feePayer] ? feePayer : 
        (tx.accountData || []).map((a: any) => a.account).find((addr: string) => WALLET_MAP[addr]);
      if (!walletAddr) continue;
      const walletLabel = WALLET_MAP[walletAddr];

      // Detect pump.fun
      const allAccounts: string[] = (tx.accountData || []).map((a: any) => a.account);
      const isPumpFun = allAccounts.includes(PUMP_FUN);

      // Parse token transfers
      const tokenTransfers: any[] = tx.tokenTransfers || [];
      if (!tokenTransfers.length) continue;

      // Find the transfer involving our wallet
      for (const transfer of tokenTransfers) {
        const mint = transfer.mint;
        if (!mint || mint === SOL_MINT) continue;

        const isBuy  = transfer.toUserAccount === walletAddr;
        const isSell = transfer.fromUserAccount === walletAddr;
        if (!isBuy && !isSell) continue;

        const action = isBuy ? "BUY" : "SELL";

        // Calculate SOL amount from native transfers
        const nativeTransfers: any[] = tx.nativeTransfers || [];
        let amountSol = 0;
        for (const nt of nativeTransfers) {
          if (action === "BUY"  && nt.fromUserAccount === walletAddr) amountSol += (nt.amount || 0) / 1e9;
          if (action === "SELL" && nt.toUserAccount   === walletAddr) amountSol += (nt.amount || 0) / 1e9;
        }

        const { error } = await supabase.from("shreem_brzee_signals").upsert({
          sig,
          wallet:       walletAddr,
          label:        walletLabel,
          action,
          mint,
          symbol:       transfer.tokenSymbol || null,
          amount_sol:   amountSol > 0 ? amountSol : null,
          token_amount: transfer.tokenAmount || null,
          is_pump_fun:  isPumpFun,
          block_time:   timestamp || null,
        }, { onConflict: "sig" });

        if (!error) inserted++;
        break; // one signal per transaction
      }
    } catch (e: any) {
      console.error("[helius-webhook] parse error:", e?.message);
    }
  }

  console.log(`[helius-webhook] ${transactions.length} txs received, ${inserted} signals inserted`);
  return new Response(JSON.stringify({ ok: true, inserted }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
