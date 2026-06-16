/**
 * SHREEM BRZEE — Helius Webhook + Paper Trade Relay
 * Deployed to: ssygukfdbtehvtndandn (Lovable/live Supabase)
 * 
 * Routes:
 *   POST /                  → Helius enhanced webhook (whale swap detected)
 *   POST /paper             → Hetzner paper server saves trade/session
 *   GET  /session           → Hetzner paper server reads session state
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const WSOL_MINT = 'So11111111111111111111111111111111111111112';

// 21 verified elite Solana whale wallets
const WHALE_WALLETS: Record<string, string> = {
  'HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp': 'GMGN-TopPNL',
  'H72yLkhTnoBfhBTXXaj1RBXuirm8s8G5fcVh2XpQLggM': 'GMGN-SmartDegen',
  '4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t': 'Axiom-100x',
  '7x6qE3DRMW2ZCgT1YQuBLePiheEWw7qjH6rYjj6GDtEd': 'WalletMaster-ROI',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Dune-BrainrotMeta',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh': 'Birdeye-Migrator',
  'GHoTTNFnSBFBbZvBZNvwNz7jtJz1TBNBqkS9vGPnm7Dv': 'KolScan-Top20',
  '5tzFkiKscXHK5ZXCGbGuPbCLNqLJnEUPs3EBGzSdAFkF': 'Remusofmars',
  'BU9EFBu2DSPwvbMpPjiFf46jqNiPDuvBkEbBBBDJUHBg': 'Cupsey',
  '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWagsenfzNnvk': 'Heyitsyolo',
  'Gr5mNBC5GnBZBQMm3MdVU9vEFpNSR1pGbTc8o1BvUCNh': 'SolBigBrain',
  'ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ': 'Ansem',
  '2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm': 'Murad',
  'Dt4GEBcpsSCB2B1kSsRobF26TvBVVcfKAGR6pXPJSFfA': 'GCR',
  'EVvpKxsMzn7F65fMr6qbJuBaAvuZhZr5KSbJ5gH3UW8m': 'Hsaka',
  'CmqJEJg6tLMV7VnXL5PvXtxBMBqVr4XJHNKEhLJHm1E': 'Cobie',
  '8GFzKBLyFGDQRBMFhNKHMuq9MeFEWAT6c6E1a6HYpump': 'Alphakek',
  'FYmEhv1CybVe3NHGiK2gPLNfBCFkc5XNhEL7J2MhMkE': 'Fiskantes',
  '3QsmYbFPSFAHcnEHbmcqAGqJhkYVCMSmCHPG7BLNBZEV': 'JupVol',
  'DpWpCsnmhzmpjfhTtdKQSVQv78MdPHhFzKWkdumzXJNS': 'Blknoiz06',
  'GTMckXBGFT9qigrJLxUq5FBjcgbJLqh2DLZ4H7LGGEP': 'Nansen0x',
};

const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));

function headers(status = 200) {
  return new Response(null, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    },
  });
}

function findWhaleInTx(tx: any): string | null {
  // Check feePayer first
  if (tx.feePayer && WHALE_ADDRS.has(tx.feePayer)) return tx.feePayer;
  // Check accountData
  for (const a of (tx.accountData || [])) {
    if (WHALE_ADDRS.has(a.account)) return a.account;
  }
  // Check nativeTransfers
  for (const t of (tx.nativeTransfers || [])) {
    if (WHALE_ADDRS.has(t.fromUserAccount)) return t.fromUserAccount;
    if (WHALE_ADDRS.has(t.toUserAccount)) return t.toUserAccount;
  }
  // Check tokenTransfers
  for (const t of (tx.tokenTransfers || [])) {
    if (WHALE_ADDRS.has(t.fromUserAccount)) return t.fromUserAccount;
    if (WHALE_ADDRS.has(t.toUserAccount)) return t.toUserAccount;
  }
  return null;
}

function parseSwap(tx: any, walletAddr: string): {
  action: 'BUY' | 'SELL'; mint: string; symbol: string | null;
  amountSol: number | null; tokenAmount: number | null; isPumpFun: boolean;
} | null {
  const tokenTransfers = tx.tokenTransfers || [];
  const nativeTransfers = tx.nativeTransfers || [];

  // Find which token the whale interacted with (not SOL/WSOL)
  const tokenTx = tokenTransfers.find((t: any) =>
    (t.fromUserAccount === walletAddr || t.toUserAccount === walletAddr) &&
    t.mint !== SOL_MINT && t.mint !== WSOL_MINT
  );

  if (!tokenTx) {
    // No token transfer found — skip (not a swap we care about)
    return null;
  }

  const mint = tokenTx.mint;
  const symbol = tokenTx.tokenName || tokenTx.symbol || null;
  const tokenAmount = tokenTx.tokenAmount || null;

  // Direction: if whale received the token → BUY; if whale sent → SELL
  const action: 'BUY' | 'SELL' = tokenTx.toUserAccount === walletAddr ? 'BUY' : 'SELL';

  // Find SOL amount from native transfers
  const solTx = nativeTransfers.find((t: any) =>
    t.fromUserAccount === walletAddr || t.toUserAccount === walletAddr
  );
  const amountSol = solTx ? (solTx.amount || 0) / 1_000_000_000 : null;

  // Detect pump.fun
  const isPumpFun =
    (tx.source || '').toLowerCase().includes('pump') ||
    (tx.instructions || []).some((ix: any) =>
      ix.programId === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
    );

  return { action, mint, symbol, amountSol, tokenAmount, isPumpFun };
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return headers(200);

  const url = new URL(req.url);
  const path = url.pathname;

  // ── GET /session — paper server reads state ───────────────────────
  if (req.method === 'GET' && path.endsWith('/session')) {
    const { data, error } = await sb
      .from('shreem_brzee_session')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[session] read error:', error.message);
      return json({ error: error.message }, 500);
    }
    return json(data || null);
  }

  // ── POST /paper — Hetzner paper server writes ─────────────────────
  if (req.method === 'POST' && path.endsWith('/paper')) {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

    const { type, trade, session } = body;

    try {
      if ((type === 'trade' || type === 'both') && trade) {
        const { error } = await sb.from('shreem_brzee_paper_trades').insert(trade);
        if (error) console.error('[paper] trade insert error:', error.message);
      }
      if ((type === 'session' || type === 'both') && session) {
        const { error } = await sb.from('shreem_brzee_session').upsert({
          id: 'default',
          ...session,
          updated_at: new Date().toISOString(),
        });
        if (error) console.error('[paper] session upsert error:', error.message);
      }
    } catch (e: any) {
      console.error('[paper] error:', e.message);
      return json({ error: e.message }, 500);
    }

    return json({ ok: true });
  }

  // ── POST / — Helius enhanced webhook ─────────────────────────────
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

  const transactions = Array.isArray(body) ? body : [body];
  let inserted = 0;
  let skipped = 0;

  for (const tx of transactions) {
    try {
      const sig = tx.signature;
      if (!sig) { skipped++; continue; }

      const walletAddr = findWhaleInTx(tx);
      if (!walletAddr) { skipped++; continue; }

      const swap = parseSwap(tx, walletAddr);
      if (!swap) { skipped++; continue; }

      const { error } = await sb.from('shreem_brzee_signals').upsert(
        {
          sig,
          wallet:       walletAddr,
          label:        WHALE_WALLETS[walletAddr],
          action:       swap.action,
          mint:         swap.mint,
          symbol:       swap.symbol,
          amount_sol:   swap.amountSol,
          token_amount: swap.tokenAmount,
          is_pump_fun:  swap.isPumpFun,
          block_time:   tx.timestamp || null,
        },
        { onConflict: 'sig' }
      );

      if (error) {
        console.error(`[signal] insert error sig=${sig}:`, error.message);
        skipped++;
      } else {
        inserted++;
        console.log(
          `✅ ${swap.action} ${swap.symbol || swap.mint.slice(0, 8)} ` +
          `— ${WHALE_WALLETS[walletAddr]} — ` +
          `${(swap.amountSol || 0).toFixed(4)} SOL`
        );
      }
    } catch (e: any) {
      console.error('[signal] parse error:', e.message);
      skipped++;
    }
  }

  return json({ ok: true, inserted, skipped });
});
