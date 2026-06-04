const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const DATA = 'https://data-api.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    return r.json();
  } catch(e) { return null; }
}

// Get all unique full addresses from seen_trades
const r = await fetch(`${SUPABASE_URL}/rest/v1/polymarket_seen_trades?select=whale_address&limit=5000`, { headers: SB });
const rows = await r.json();
const freq = {};
for (const row of rows) {
  if (row.whale_address) freq[row.whale_address] = (freq[row.whale_address]||0)+1;
}

// Sort by frequency
const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
console.log(`\nAll ${sorted.length} unique full addresses (most seen first):`);
sorted.forEach(([addr, count]) => console.log(`  ${count}x | ${addr}`));

// Now scan ALL of them for PnL
console.log('\n\n=== PnL SCAN ===');
const results = [];
for (const [addr] of sorted) {
  const pos = await get(`${DATA}/positions?user=${addr}&limit=500`);
  const pArr = Array.isArray(pos) ? pos : [];
  const totalPnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
  const trades = await get(`${DATA}/trades?user=${addr}&limit=500`);
  const tArr = Array.isArray(trades) ? trades : [];
  const now = Date.now()/1000;
  const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<7*86400).length;
  const mo = tArr.filter(t=>t.timestamp&&now-t.timestamp<30*86400).length;
  results.push({ addr, pnl: totalPnl, trades: tArr.length, positions: pArr.length, wk, mo, seen: freq[addr] });
  console.log(`${totalPnl>=0?'🟢':'🔴'} $${totalPnl.toFixed(0).padStart(10)} | ${addr} | t:${tArr.length} wk:${wk} mo:${mo}`);
  await new Promise(r=>setTimeout(r,200));
}

results.sort((a,b)=>b.pnl-a.pnl);
console.log('\n\n=== FINAL RANKING ===');
results.forEach(r => {
  const tag = r.pnl > 10000 ? '🏆' : r.pnl > 0 ? '🟢' : '🔴';
  console.log(`${tag} $${r.pnl.toFixed(0).padStart(10)} | ${r.addr} | trades:${r.trades} wk:${r.wk}/mo:${r.mo} seen:${r.seen}x`);
});
