#!/usr/bin/env node
// shreem_backfill.mjs v2
// Uses Helius Enhanced Transactions API with correct parsing of swap events
// Slower but reliable — 1.5s delay between calls to avoid rate limits

const HELIUS_KEY = process.env.HELIUS_KEY || '775d3d1f-6801-41de-a063-8aee4382d0f4';
const SUPA_URL   = process.env.SUPABASE_URL || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPA_KEY   = process.env.SUPABASE_SERVICE_KEY;
const PAGES      = 3; // 3×100 = 300 txs per whale = ~60-90 days
const DELAY      = 1500; // 1.5s between Helius calls

if (!SUPA_KEY) { console.error('❌ SUPABASE_SERVICE_KEY missing'); process.exit(1); }

const WHALES = [
  { label: 'Cupsey',        addr: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE' },
  { label: 'Heyitsyolo',    addr: 'Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ' },
  { label: 'Remusofmars',   addr: 'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu' },
  { label: 'Orange',        addr: '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5' },
  { label: 'Shreem Brzee',  addr: 'HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt' },
  { label: 'Lenion',        addr: 'DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm' },
  { label: 'Boredboar',     addr: 'gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw'  },
  { label: 'Hades',         addr: 'HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp' },
  { label: 'Kubera 72',     addr: 'AAvdewt71kkde2segr6gYnNemhNLfokyZpdzwwi4yDfm'  },
  { label: 'Brzee God',     addr: 'JD38n7ynKYcgPpF7k1BhXEeREu1KqptU93fVGy3S624k' },
  { label: 'GBack',         addr: '9VPozuXeRi8FACAePmg8ckdSZkbeZfTJc6SqUDcKsUKm' },
  { label: 'Tuna',          addr: 'GjK3S2ZgxTVFEkxg43JE8eC1tbztWCseBYyZ8o8sg9f'  },
  { label: 'Fireball',      addr: 'AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51' },
  { label: 'Hachjdn',       addr: 'EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS' },
  { label: 'Crypto Circle', addr: '5DzUSNro5kfNwB2dxkkTTYrPDXAi6vRnjf4mAN2an7Gc' },
  { label: 'Crocodile',     addr: '2cBedD94RXYSEhEfQJUyLaNaHB4PVoL9z7LK6Mu11sJv' },
  { label: 'Snow Spirit',   addr: '4ev7HVsESzFxKqGzQxJ5mzSM6NstGCTQXKXT8yHiaRP3' },
  { label: 'Cented',        addr: 'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o' },
  { label: 'The Grande',    addr: 'Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA' },
  { label: 'A Milly',       addr: 'Fv9w9TQnqhzUszbDGRFPPkXwu5iJWG9VytmMJTCTnjxW' },
  { label: 'J2ANNaq',       addr: 'J2ANNaq4uUk3iUGoNijKCwXTReGLyg2yQpGcAZjzyBZG' },
];

const PUMP = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Fetch one page of enhanced txs from Helius ──────────────
async function fetchPage(addr, before, retries = 3) {
  let url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=100&type=SWAP`;
  if (before) url += `&before=${before}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (r.status === 429) {
        const wait = 8000 * (attempt + 1);
        console.log(`  ⏳ 429 — waiting ${wait/1000}s (attempt ${attempt+1})`);
        await sleep(wait);
        continue;
      }
      if (r.status === 401) { console.log('  ❌ 401 — bad API key'); return []; }
      if (!r.ok) { console.log(`  ⚠ HTTP ${r.status}`); return []; }
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    } catch(e) {
      console.log(`  ⚠ attempt ${attempt+1} error: ${e.message}`);
      await sleep(3000);
    }
  }
  return [];
}

// ── Parse one Helius enhanced tx ────────────────────────────
// Helius enhanced txs have tx.events.swap with tokenInputs/tokenOutputs
function parseTx(tx, addr, label) {
  if (!tx || tx.transactionError) return null;
  const sig = tx.signature;
  if (!sig) return null;

  const ts = tx.timestamp || Math.floor(Date.now() / 1000);

  // ── Method 1: use swap event (most reliable) ──────────────
  const swap = tx.events?.swap;
  if (swap) {
    // tokenInputs = what wallet sent (SELL of token = paid tokens, got SOL)
    // tokenOutputs = what wallet received (BUY of token = paid SOL, got tokens)
    const inputs  = swap.tokenInputs  || [];
    const outputs = swap.tokenOutputs || [];

    // Find non-SOL token
    const outToken = outputs.find(t => t.mint && t.mint !== SOL_MINT && t.userAccount === addr);
    const inToken  = inputs.find(t => t.mint && t.mint !== SOL_MINT && t.userAccount === addr);

    if (outToken) {
      // BUY — received a token, paid SOL
      const solIn = inputs.find(t => (t.mint === SOL_MINT || !t.mint) && t.userAccount === addr);
      const amountSOL = solIn ? Math.abs(parseFloat(solIn.rawTokenAmount?.tokenAmount || 0)) / 1e9 : 0;
      return {
        sig, wallet: addr, label, action: 'BUY',
        mint: outToken.mint,
        symbol: outToken.symbol || outToken.mint.slice(0, 6),
        amount_sol: amountSOL,
        token_amount: Math.abs(parseFloat(outToken.rawTokenAmount?.tokenAmount || outToken.tokenAmount || 0)),
        is_pump_fun: (tx.instructions || []).some(i => i.programId === PUMP),
        block_time: ts,
        created_at: new Date(ts * 1000).toISOString(),
      };
    }
    if (inToken) {
      // SELL — sent a token, received SOL
      const solOut = outputs.find(t => (t.mint === SOL_MINT || !t.mint) && t.userAccount === addr);
      const amountSOL = solOut ? Math.abs(parseFloat(solOut.rawTokenAmount?.tokenAmount || 0)) / 1e9 : 0;
      return {
        sig, wallet: addr, label, action: 'SELL',
        mint: inToken.mint,
        symbol: inToken.symbol || inToken.mint.slice(0, 6),
        amount_sol: amountSOL,
        token_amount: Math.abs(parseFloat(inToken.rawTokenAmount?.tokenAmount || inToken.tokenAmount || 0)),
        is_pump_fun: (tx.instructions || []).some(i => i.programId === PUMP),
        block_time: ts,
        created_at: new Date(ts * 1000).toISOString(),
      };
    }
  }

  // ── Method 2: fall back to tokenTransfers ─────────────────
  const transfers = tx.tokenTransfers || [];
  let bestMint = null, bestDelta = 0, bestSymbol = null;

  for (const t of transfers) {
    if (!t.mint || t.mint === SOL_MINT) continue;
    const toUs   = t.toUserAccount   === addr ? parseFloat(t.tokenAmount || 0) : 0;
    const fromUs = t.fromUserAccount === addr ? parseFloat(t.tokenAmount || 0) : 0;
    const delta  = toUs - fromUs;
    if (Math.abs(delta) > Math.abs(bestDelta)) {
      bestDelta  = delta;
      bestMint   = t.mint;
      bestSymbol = t.symbol || null;
    }
  }

  if (!bestMint) return null;

  // Get SOL change from accountData
  const acct = (tx.accountData || []).find(a => a.account === addr);
  const solDelta = acct ? Math.abs((acct.nativeBalanceChange || 0) / 1e9) : 0;

  return {
    sig, wallet: addr, label,
    action: bestDelta > 0 ? 'BUY' : 'SELL',
    mint: bestMint,
    symbol: bestSymbol || bestMint.slice(0, 6),
    amount_sol: solDelta,
    token_amount: Math.abs(bestDelta),
    is_pump_fun: (tx.instructions || []).some(i => i.programId === PUMP),
    block_time: ts,
    created_at: new Date(ts * 1000).toISOString(),
  };
}

// ── Upsert rows into Supabase ────────────────────────────────
async function upsert(rows) {
  if (!rows.length) return 0;
  const r = await fetch(`${SUPA_URL}/rest/v1/shreem_brzee_signals`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) { console.log(`  ⚠ upsert ${r.status}: ${(await r.text()).slice(0,100)}`); return 0; }
  return rows.length;
}

// ── Main ─────────────────────────────────────────────────────
console.log('🔱 Shreem Brzee Backfill v2 — Real Solana SWAP history');
console.log(`   21 whales × up to ${PAGES*100} swaps = up to ${21*PAGES*100} rows\n`);

let totalInserted = 0;
const summary = [];

for (const whale of WHALES) {
  console.log(`\n🐋 ${whale.label}`);
  let allRows = [], before;

  for (let page = 0; page < PAGES; page++) {
    await sleep(DELAY);
    const txs = await fetchPage(whale.addr, before);
    if (!txs.length) { console.log(`   page ${page+1}: done`); break; }
    console.log(`   page ${page+1}: ${txs.length} txs`);

    for (const tx of txs) {
      const row = parseTx(tx, whale.addr, whale.label);
      if (row) allRows.push(row);
    }

    before = txs[txs.length - 1]?.signature;
    if (txs.length < 100) break;
  }

  console.log(`   parsed: ${allRows.length} swaps`);

  // Upsert in batches of 50
  let inserted = 0;
  for (let i = 0; i < allRows.length; i += 50) {
    inserted += await upsert(allRows.slice(i, i+50));
    await sleep(200);
  }
  console.log(`   ✅ inserted: ${inserted}`);
  totalInserted += inserted;
  summary.push({ label: whale.label, swaps: allRows.length, inserted });
}

console.log('\n═══════════════════════════════════');
console.log('🏆 BACKFILL COMPLETE');
console.log(`   Total inserted: ${totalInserted} rows`);
console.log('\nPer whale:');
summary.forEach(s => console.log(`  ${s.label}: ${s.swaps} swaps → ${s.inserted} inserted`));
