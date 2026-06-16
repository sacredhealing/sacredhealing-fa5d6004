/**
 * SHREEM BRZEE — Helius Enhanced Webhook Receiver
 * Edge function deployed to Supabase.
 * Helius calls this URL every time a tracked whale wallet transacts.
 * We parse the swap, write to shreem_brzee_signals.
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_AUTH  = Deno.env.get('HELIUS_WEBHOOK_AUTH') ?? ''; // optional secret

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 21 Elite whale wallets — Solana addresses
const WHALE_WALLETS: Record<string, string> = {
  'FnCPt5VWxHyRE6oFGLuJEf4tzmLEJPdPKXdnCumHzMQT': 'Remusofmars',
  'AzEn6PEKCiHRkKHPELwVoK2pHcUjQrAMYyNxaVkgKnwH': 'Cupsey',
  'HeyitsYoloXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX': 'Heyitsyolo',
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

// SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';

function findTokenSwap(tx: any): { action: 'BUY' | 'SELL'; mint: string; symbol?: string; amountSol?: number; tokenAmount?: number; isPumpFun: boolean } | null {
  try {
    // Look for token transfers in the enhanced transaction
    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];
    
    // Find the wallet that triggered this webhook
    const accountData = tx.accountData || [];
    const walletAddr = Object.keys(WHALE_WALLETS).find(w => 
      tx.feePayer === w || 
      accountData.some((a: any) => a.account === w)
    );
    
    if (!walletAddr) return null;
    
    // Detect buy: whale sends SOL, receives token
    // Detect sell: whale sends token, receives SOL
    let mint = '';
    let action: 'BUY' | 'SELL' = 'BUY';
    let amountSol = 0;
    let tokenAmount = 0;
    let symbol = '';
    
    // Parse native SOL movement for the whale
    const solMoved = nativeTransfers.find((t: any) => 
      t.fromUserAccount === walletAddr || t.toUserAccount === walletAddr
    );
    
    // Find the token involved (not SOL)
    const tokenTransfer = tokenTransfers.find((t: any) =>
      t.fromUserAccount === walletAddr || t.toUserAccount === walletAddr
    );
    
    if (tokenTransfer) {
      mint = tokenTransfer.mint;
      symbol = tokenTransfer.tokenName || tokenTransfer.symbol || '';
      tokenAmount = tokenTransfer.tokenAmount || 0;
      
      if (tokenTransfer.toUserAccount === walletAddr) {
        action = 'BUY'; // whale received token
      } else {
        action = 'SELL'; // whale sent token
      }
    }
    
    if (solMoved) {
      amountSol = (solMoved.amount || 0) / 1e9;
    }
    
    // Fallback: parse from instructions if swap detected
    if (!mint) {
      const type = tx.type?.toUpperCase() || '';
      if (!type.includes('SWAP') && !type.includes('TRANSFER')) return null;
      
      // Try to get mint from the description
      const desc = tx.description || '';
      const mintMatch = desc.match(/[A-Za-z0-9]{32,44}/g);
      if (mintMatch) {
        mint = mintMatch.find((m: string) => m !== walletAddr) || '';
      }
    }
    
    if (!mint || mint === SOL_MINT) return null;
    
    // Detect pump.fun
    const isPumpFun = (tx.source || '').toLowerCase().includes('pump') ||
      (tx.instructions || []).some((ix: any) => ix.programId === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
    
    return { action, mint, symbol, amountSol, tokenAmount, isPumpFun };
  } catch {
    return null;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }
    });
  }
  
  // Validate Helius auth header if configured
  if (WEBHOOK_AUTH) {
    const authHeader = req.headers.get('authorization') || req.headers.get('x-webhook-secret') || '';
    if (!authHeader.includes(WEBHOOK_AUTH)) {
      console.warn('[webhook] Unauthorized request');
      return new Response('Unauthorized', { status: 401 });
    }
  }
  
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  
  // Helius sends an array of enhanced transactions
  const transactions = Array.isArray(body) ? body : [body];
  
  let inserted = 0;
  let skipped  = 0;
  
  for (const tx of transactions) {
    try {
      // Find which whale wallet triggered this
      const accountData = tx.accountData || [];
      const walletAddr = Object.keys(WHALE_WALLETS).find(w => 
        tx.feePayer === w ||
        accountData.some((a: any) => a.account === w)
      );
      
      if (!walletAddr) { skipped++; continue; }
      
      const swap = findTokenSwap(tx);
      if (!swap) { skipped++; continue; }
      
      const sig = tx.signature;
      
      // Upsert — deduplicate by signature
      const { error } = await supabase
        .from('shreem_brzee_signals')
        .upsert({
          sig,
          wallet:       walletAddr,
          label:        WHALE_WALLETS[walletAddr],
          action:       swap.action,
          mint:         swap.mint,
          symbol:       swap.symbol || null,
          amount_sol:   swap.amountSol || null,
          token_amount: swap.tokenAmount || null,
          is_pump_fun:  swap.isPumpFun,
          block_time:   tx.timestamp || null,
        }, { onConflict: 'sig' });
      
      if (error) {
        console.error('[webhook] insert error:', error.message, '| sig:', sig);
        skipped++;
      } else {
        inserted++;
        console.log(`[webhook] ✅ ${swap.action} ${swap.symbol || swap.mint.slice(0,8)} — ${WHALE_WALLETS[walletAddr]} — ${(swap.amountSol || 0).toFixed(4)} SOL`);
      }
    } catch (e: any) {
      console.error('[webhook] tx parse error:', e.message);
      skipped++;
    }
  }
  
  return new Response(JSON.stringify({ ok: true, inserted, skipped }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
