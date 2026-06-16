#!/usr/bin/env node
// shreem_backfill.mjs
// Fetches real on-chain SWAP history for all 21 shreem whale wallets
// via Helius Enhanced Transactions API, then upserts into shreem_brzee_signals
// on the live Supabase: ssygukfdbtehvtndandn

const HELIUS_KEY  = process.env.HELIUS_KEY  || '775d3d1f-6801-41de-a063-8aee4382d0f4';
const SUPA_URL    = process.env.SUPABASE_URL || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPA_KEY    = process.env.SUPABASE_SERVICE_KEY;
const SOL_MINT    = 'So11111111111111111111111111111111111111112';
const DELAY_MS    = 220;   // gentle rate limit between calls
const PAGES       = 5;     // 5 × 100 = 500 txs per wallet → ~90 days of activity

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Helius Enhanced Transactions for one wallet page ────────
async function fetchPage(addr, before) {
  let url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=100&type=SWAP`;
  if (before) url += `&before=${before}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (r.status === 429) { console.log('  ⏳ rate limit — sleeping 5s'); await sleep(5000); return []; }
    if (!r.ok) { console.log(`  ⚠ HTTP ${r.status} for ${addr.slice(0,8)}`); return []; }
    return await r.json();
  } catch(e) { console.log(`  ⚠ fetch error: ${e.message}`); return []; }
}

// ── Parse a Helius enhanced tx into a signal row ────────────
function parseTx(tx, addr, label) {
  if (!tx || tx.transactionError) return null;

  // tokenTransfers gives us clean in/out per address
  const transfers = tx.tokenTransfers || [];
  const nativeDelta = (() => {
    // accountData has pre/post native balances per account
    const acct = (tx.accountData || []).find(a => a.account === addr);
    if (!acct) return 0;
    return (acct.nativeBalanceChange || 0) / 1e9; // lamports → SOL
  })();

  // Find the biggest non-SOL token movement for this wallet
  let bestMint = null, bestDelta = 0, bestSymbol = null;
  for (const t of transfers) {
    const isSOL = t.mint === SOL_MINT;
    if (isSOL) continue;
    // Net token change for our wallet
    const toUs   = t.toUserAccount === addr ? parseFloat(t.tokenAmount || 0) : 0;
    const fromUs = t.fromUserAccount === addr ? parseFloat(t.tokenAmount || 0) : 0;
    const delta  = toUs - fromUs;
    if (Math.abs(delta) > Math.abs(bestDelta)) {
      bestDelta  = delta;
      bestMint   = t.mint;
      bestSymbol = t.symbol || null;
    }
  }

  if (!bestMint || bestDelta === 0) return null;

  const action    = bestDelta > 0 ? 'BUY' : 'SELL';
  const amountSOL = Math.abs(nativeDelta);
  const isPumpFun = (tx.instructions || []).some(i =>
    i.programId === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
  );

  return {
    sig:          tx.signature,
    wallet:       addr,
    label,
    action,
    mint:         bestMint,
    symbol:       bestSymbol || bestMint.slice(0, 6),
    amount_sol:   amountSOL,
    token_amount: Math.abs(bestDelta),
    is_pump_fun:  isPumpFun,
    block_time:   tx.timestamp || Math.floor(Date.now() / 1000),
    // created_at will be derived from block_time so history is accurate
    created_at:   new Date((tx.timestamp || Math.floor(Date.now()/1000)) * 1000).toISOString(),
  };
}

// ── Upsert batch into Supabase ───────────────────────────────
async function upsert(rows) {
  if (rows.length === 0) return 0;
  const r = await fetch(
    `${SUPA_URL}/rest/v1/shreem_brzee_signals`,
    {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal', // ignore on conflict sig UNIQUE
      },
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(30000),
    }
  );
  if (!r.ok) {
    const t = await r.text();
    console.log(`  ⚠ upsert error ${r.status}: ${t.slice(0, 120)}`);
    return 0;
  }
  return rows.length;
}

// ── Count existing rows per wallet ──────────────────────────
async function existingCount(addr) {
  const r = await fetch(
    `${SUPA_URL}/rest/v1/shreem_brzee_signals?wallet=eq.${addr}&select=id`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Prefer: 'count=exact', Range: '0-0' } }
  );
  const count = r.headers.get('content-range');
  if (!count) return 0;
  const m = count.match(/\/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

// ── Main ─────────────────────────────────────────────────────
console.log('🔱 Shreem Brzee Backfill — Solana on-chain SWAP history');
console.log(`   Supabase: ssygukfdbtehvtndandn`);
console.log(`   Wallets: ${WHALES.length}`);
console.log(`   Pages per wallet: ${PAGES} (up to ${PAGES * 100} swaps each)\n`);

let totalInserted = 0;

for (const whale of WHALES) {
  console.log(`\n🐋 ${whale.label} (${whale.addr.slice(0,8)}…)`);

  const existing = await existingCount(whale.addr);
  console.log(`   Already in DB: ${existing} rows`);

  let before = undefined;
  let whaleTotal = 0;
  let allRows = [];

  for (let page = 0; page < PAGES; page++) {
    const txs = await fetchPage(whale.addr, before);
    if (!txs || txs.length === 0) { console.log(`   Page ${page+1}: no more data`); break; }

    console.log(`   Page ${page+1}: ${txs.length} txs fetched`);

    const rows = [];
    for (const tx of txs) {
      const row = parseTx(tx, whale.addr, whale.label);
      if (row) rows.push(row);
    }

    console.log(`   Page ${page+1}: ${rows.length} swaps parsed`);
    allRows = allRows.concat(rows);

    // Cursor for next page
    before = txs[txs.length - 1]?.signature;
    if (txs.length < 100) break; // last page

    await sleep(DELAY_MS);
  }

  // Upsert in batches of 50
  const BATCH = 50;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const inserted = await upsert(batch);
    whaleTotal += inserted;
    await sleep(100);
  }

  console.log(`   ✅ ${whaleTotal} rows upserted for ${whale.label}`);
  totalInserted += whaleTotal;

  await sleep(DELAY_MS * 2); // extra pause between wallets
}

console.log(`\n🏆 DONE — ${totalInserted} total rows inserted into shreem_brzee_signals`);
console.log('   Data now available for Daily / Weekly / Monthly / Yearly views');
