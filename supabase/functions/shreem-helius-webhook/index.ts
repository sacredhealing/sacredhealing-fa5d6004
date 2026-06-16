/**
 * SHREEM BRZEE — Helius Webhook + Paper Trade Relay
 * Deployed to ssygukfdbtehvtndandn (Lovable Supabase).
 * Two modes:
 *   POST /shreem-helius-webhook          → called by Helius when a whale swaps
 *   POST /shreem-helius-webhook/paper    → called by Hetzner paper server to save trades/session
 *   GET  /shreem-helius-webhook/session  → paper server reads current session
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOL_MINT = 'So11111111111111111111111111111111111111112';

const WHALE_WALLETS: Record<string, string> = {
  'FnCPt5VWxHyRE6oFGLuJEf4tzmLEJPdPKXdnCumHzMQT': 'Remusofmars',
  'AzEn6PEKCiHRkKHPELwVoK2pHcUjQrAMYyNxaVkgKnwH': 'Cupsey',
  'HeyitsYoloWALLET111111111111111111111111111111': 'Heyitsyolo',
  'EVvpKxsMzn7F65fMr6qbJuBaAvuZhZr5KSbJ5gH3UW8m': 'Ansem',
  'GDfnEsia2WLAW5t8yx2X5j2mkfA74i5kwGdDuZHt7XmG': 'MustStopMurad',
  'J8dBCKrQZa3AMBJqxnpWmPJFo6KjpgFmBuJ5BW5JLCW': 'Layah',
  'BbkbCEPnvjw7cL9VTFiPnVjjJJMbbg7bwxpEb55bXGdi': 'Mando',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'SolBigBrain',
  'E8JQK5fmvdCpauX6BF6P9bMGVMnGjW3J5Cv3qSFKdMr': 'Alphakek',
  'Hk5V7mfzEbMHGjCJ9FLpxfJUDenYEuVQGHBbX7E2Pmy': 'GCR',
  'DCiJgPGCN6nBDCsHSmxHMYEtTHJ1W5EBLCN6hFsP3yr': 'Hsaka',
  'CmqJEJg6tLMV7VnXL5PvXtxBMBqVr4XJHNKEhLJHm1E': 'Cobie',
  'A3QnCniFmCGNVeJJ2aEBqZBxbv95Hm9jXGNGT3T7oEFL': 'CryptoCobain',
  'FYmEhv1CybVe3NHGiK2gPLNfBCFkc5XNhEL7J2MhMkE': 'Fiskantes',
  'BJGX4Gh6HT68MVaHpn2y7U8Y7k6TuQBdHhXJhN2KVGE': 'Kookoo',
  'GTMckXBGFT9qigrJLxUq5FBjcgbJLqh2DLZ4H7LGGEP': 'Sol_Enjoyer',
  'DpWpCsnmhzmpjfhTtdKQSVQv78MdPHhFzKWkdumzXJNS': 'CroissantEth',
  '3QsmYbFPSFAHcnEHbmcqAGqJhkYVCMSmCHPG7BLNBZEV': 'JupVol',
  'EsKxHRdVNE7GVhqJTsqYi9EJL6U9VKdvT4Hv7t4R74j': 'SmokeyTheBera',
  'FeBuYeK8PdJk3L6Z5FaYBFBpvNxBa5W5bHbCKmXvPnT': 'Blknoiz06',
  'GZcV8e8JXbnfS7J3cXbMpgqGAf3vFZJcmLFJSxMvqiY': 'Nansen_0x',
};

function cors(body: string | null, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

function parseSwap(tx: any) {
  try {
    const accountData = tx.accountData || [];
    const walletAddr = Object.keys(WHALE_WALLETS).find(w =>
      tx.feePayer === w || accountData.some((a: any) => a.account === w)
    );
    if (!walletAddr) return null;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];

    const tokenTransfer = tokenTransfers.find((t: any) =>
      t.fromUserAccount === walletAddr || t.toUserAccount === walletAddr
    );
    const solMoved = nativeTransfers.find((t: any) =>
      t.fromUserAccount === walletAddr || t.toUserAccount === walletAddr
    );

    if (!tokenTransfer) return null;

    const mint = tokenTransfer.mint;
    if (!mint || mint === SOL_MINT) return null;

    const action: 'BUY' | 'SELL' = tokenTransfer.toUserAccount === walletAddr ? 'BUY' : 'SELL';
    const amountSol = solMoved ? (solMoved.amount || 0) / 1e9 : null;
    const tokenAmount = tokenTransfer.tokenAmount || null;
    const symbol = tokenTransfer.tokenName || tokenTransfer.symbol || null;
    const isPumpFun = (tx.source || '').toLowerCase().includes('pump') ||
      (tx.instructions || []).some((ix: any) => ix.programId === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

    return { wallet: walletAddr, label: WHALE_WALLETS[walletAddr], action, mint, symbol, amountSol, tokenAmount, isPumpFun };
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return cors(null);

  const url = new URL(req.url);
  const isSession = url.pathname.endsWith('/session');
  const isPaper   = url.pathname.endsWith('/paper');

  // ── GET /session — paper server reads current session state ──────
  if (req.method === 'GET' && isSession) {
    const { data } = await sb.from('shreem_brzee_session').select('*').eq('id', 'default').single();
    return cors(JSON.stringify(data || null));
  }

  // ── POST /paper — paper server writes trade + session ────────────
  if (req.method === 'POST' && isPaper) {
    const body = await req.json();
    const { type, trade, session } = body;

    if (type === 'trade' && trade) {
      await sb.from('shreem_brzee_paper_trades').insert(trade);
    }
    if (type === 'session' && session) {
      await sb.from('shreem_brzee_session').upsert({ id: 'default', ...session, updated_at: new Date().toISOString() });
    }
    if (type === 'both' && trade && session) {
      await Promise.all([
        sb.from('shreem_brzee_paper_trades').insert(trade),
        sb.from('shreem_brzee_session').upsert({ id: 'default', ...session, updated_at: new Date().toISOString() }),
      ]);
    }
    return cors(JSON.stringify({ ok: true }));
  }

  // ── POST / — Helius enhanced webhook ─────────────────────────────
  if (req.method !== 'POST') return cors('{"error":"method"}', 405);

  let body: any;
  try { body = await req.json(); } catch { return cors('{"error":"bad json"}', 400); }

  const transactions = Array.isArray(body) ? body : [body];
  let inserted = 0, skipped = 0;

  for (const tx of transactions) {
    try {
      const swap = parseSwap(tx);
      if (!swap) { skipped++; continue; }

      const { error } = await sb.from('shreem_brzee_signals').upsert({
        sig:          tx.signature,
        wallet:       swap.wallet,
        label:        swap.label,
        action:       swap.action,
        mint:         swap.mint,
        symbol:       swap.symbol,
        amount_sol:   swap.amountSol,
        token_amount: swap.tokenAmount,
        is_pump_fun:  swap.isPumpFun,
        block_time:   tx.timestamp || null,
      }, { onConflict: 'sig' });

      if (error) { console.error('[signal] insert error:', error.message); skipped++; }
      else {
        inserted++;
        console.log(`✅ ${swap.action} ${swap.symbol || swap.mint.slice(0,8)} — ${swap.label}`);
      }
    } catch (e: any) { console.error('[signal] parse error:', e.message); skipped++; }
  }

  return cors(JSON.stringify({ ok: true, inserted, skipped }));
});
