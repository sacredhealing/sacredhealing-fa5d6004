#!/usr/bin/env node
// shreem_backfill.mjs v3 — 5s delays, SUPABASE_SERVICE_ROLE_KEY, correct Helius parsing

const HELIUS_KEY = process.env.HELIUS_KEY || '775d3d1f-6801-41de-a063-8aee4382d0f4';
const SUPA_URL   = process.env.SUPABASE_URL || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPA_KEY   = process.env.SUPABASE_SERVICE_KEY;
const PAGES      = 5;   // 5 × 100 = 500 txs per whale
const DELAY      = 5000; // 5s between calls — stays well under Helius 10 req/s

if (!SUPA_KEY) { console.error('❌ SUPABASE_SERVICE_KEY env var missing'); process.exit(1); }

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

const PUMP    = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const SOL_M   = 'So11111111111111111111111111111111111111112';
const sleep   = ms => new Promise(r => setTimeout(r, ms));

async function fetchPage(addr, before, attempt = 0) {
  let url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=100&type=SWAP`;
  if (before) url += `&before=${before}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (r.status === 429) {
      if (attempt >= 4) { console.log('  ⚠ max retries hit'); return []; }
      const wait = 10000 * (attempt + 1);
      console.log(`  ⏳ 429 — waiting ${wait/1000}s`);
      await sleep(wait);
      return fetchPage(addr, before, attempt + 1);
    }
    if (!r.ok) { console.log(`  ⚠ HTTP ${r.status}`); return []; }
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch(e) {
    if (attempt < 2) { await sleep(5000); return fetchPage(addr, before, attempt + 1); }
    console.log(`  ⚠ error: ${e.message}`);
    return [];
  }
}

function parseTx(tx, addr, label) {
  if (!tx || tx.transactionError) return null;
  const sig = tx.signature;
  if (!sig) return null;
  const ts = tx.timestamp || Math.floor(Date.now() / 1000);

  // Approach 1: Helius swap event (cleanest)
  const swap = tx.events?.swap;
  if (swap) {
    const ins  = swap.tokenInputs  || [];
    const outs = swap.tokenOutputs || [];
    const outTok = outs.find(t => t.mint && t.mint !== SOL_M && t.userAccount === addr);
    const inTok  = ins.find(t => t.mint && t.mint !== SOL_M && t.userAccount === addr);
    if (outTok || inTok) {
      const tok     = outTok || inTok;
      const action  = outTok ? 'BUY' : 'SELL';
      const solSide = action === 'BUY'
        ? ins.find(t => (t.mint === SOL_M || !t.mint) && t.userAccount === addr)
        : outs.find(t => (t.mint === SOL_M || !t.mint) && t.userAccount === addr);
      const rawAmt  = solSide?.rawTokenAmount?.tokenAmount || '0';
      const amtSOL  = Math.abs(parseFloat(rawAmt)) / 1e9;
      const tokAmt  = Math.abs(parseFloat(tok.rawTokenAmount?.tokenAmount || tok.tokenAmount || 0));
      return {
        sig, wallet: addr, label, action,
        mint: tok.mint, symbol: tok.symbol || tok.mint.slice(0,6),
        amount_sol: amtSOL, token_amount: tokAmt,
        is_pump_fun: (tx.instructions||[]).some(i => i.programId === PUMP),
        block_time: ts,
        created_at: new Date(ts * 1000).toISOString(),
      };
    }
  }

  // Approach 2: tokenTransfers fallback
  const transfers = tx.tokenTransfers || [];
  let bestMint = null, bestDelta = 0, bestSym = null;
  for (const t of transfers) {
    if (!t.mint || t.mint === SOL_M) continue;
    const toUs   = t.toUserAccount   === addr ? parseFloat(t.tokenAmount || 0) : 0;
    const fromUs = t.fromUserAccount === addr ? parseFloat(t.tokenAmount || 0) : 0;
    const delta  = toUs - fromUs;
    if (Math.abs(delta) > Math.abs(bestDelta)) {
      bestDelta = delta; bestMint = t.mint; bestSym = t.symbol || null;
    }
  }
  if (!bestMint) return null;
  const acct   = (tx.accountData||[]).find(a => a.account === addr);
  const solAmt = acct ? Math.abs((acct.nativeBalanceChange||0)/1e9) : 0;
  return {
    sig, wallet: addr, label,
    action: bestDelta > 0 ? 'BUY' : 'SELL',
    mint: bestMint, symbol: bestSym || bestMint.slice(0,6),
    amount_sol: solAmt, token_amount: Math.abs(bestDelta),
    is_pump_fun: (tx.instructions||[]).some(i => i.programId === PUMP),
    block_time: ts,
    created_at: new Date(ts * 1000).toISOString(),
  };
}

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
  if (!r.ok) {
    const t = await r.text();
    console.log(`  ⚠ upsert ${r.status}: ${t.slice(0,150)}`);
    return 0;
  }
  return rows.length;
}

// ── Main ────────────────────────────────────────────────────
console.log('🔱 Shreem Brzee Backfill v3');
console.log(`   SUPA_URL: ${SUPA_URL}`);
console.log(`   SUPA_KEY: ${SUPA_KEY ? SUPA_KEY.slice(0,20)+'...' : 'MISSING'}\n`);

let total = 0;
const summary = [];

for (const w of WHALES) {
  console.log(`\n🐋 ${w.label} (${w.addr.slice(0,8)}…)`);
  let rows = [], before;

  for (let p = 0; p < PAGES; p++) {
    await sleep(DELAY);
    const txs = await fetchPage(w.addr, before);
    if (!txs.length) { console.log(`   p${p+1}: done`); break; }
    console.log(`   p${p+1}: ${txs.length} txs fetched`);
    for (const tx of txs) { const r = parseTx(tx, w.addr, w.label); if (r) rows.push(r); }
    before = txs[txs.length - 1]?.signature;
    if (txs.length < 100) break;
  }

  console.log(`   parsed: ${rows.length} swaps`);
  let ins = 0;
  for (let i = 0; i < rows.length; i += 50) {
    ins += await upsert(rows.slice(i, i+50));
    await sleep(300);
  }
  console.log(`   ✅ inserted: ${ins}`);
  total += ins;
  summary.push({ label: w.label, swaps: rows.length, inserted: ins });
}

console.log('\n═══════════════════════════════════');
console.log(`🏆 DONE — ${total} rows inserted`);
summary.forEach(s => console.log(`  ${s.label}: ${s.swaps} swaps → ${s.inserted} inserted`));
