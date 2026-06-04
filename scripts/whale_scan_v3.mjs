import { createRequire } from 'module';
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const D = 'https://data-api.polymarket.com';

async function get(u) {
  try { const r=await fetch(u,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)}); return r.ok?r.json():null; } catch{return null;}
}

// Step 1: Get all real addresses from seen_trades
console.log('Fetching seen_trades from Supabase...');
const res = await fetch(`${SUPA_URL}/rest/v1/polymarket_seen_trades?select=whale_address&limit=5000`,{headers:H});
const rows = await res.json();
console.log('Rows returned:', Array.isArray(rows)?rows.length:'ERROR: '+JSON.stringify(rows).slice(0,200));

const freq = {};
if (Array.isArray(rows)) {
  for (const row of rows) { if (row.whale_address) freq[row.whale_address]=(freq[row.whale_address]||0)+1; }
}

const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
console.log(`\nUnique addresses found: ${sorted.length}`);
sorted.slice(0,30).forEach(([a,c])=>console.log(`  ${c}x | ${a}`));

// Step 2: PnL scan
const results = [];
for (const [addr] of sorted) {
  const pos = await get(`${D}/positions?user=${addr}&limit=500`);
  const pArr = Array.isArray(pos)?pos:[];
  const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
  const tr = await get(`${D}/trades?user=${addr}&limit=500`);
  const tArr = Array.isArray(tr)?tr:[];
  const now=Date.now()/1000;
  const wk=tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;
  const mo=tArr.filter(t=>t.timestamp&&now-t.timestamp<2592000).length;
  results.push({addr,pnl,t:tArr.length,p:pArr.length,wk,mo,seen:freq[addr]});
  console.log(`${pnl>=0?'🟢':'🔴'} $${pnl.toFixed(0).padStart(10)} | ${addr} | tr:${tArr.length} wk:${wk} mo:${mo} seen:${freq[addr]}x`);
  await new Promise(r=>setTimeout(r,150));
}

results.sort((a,b)=>b.pnl-a.pnl);
console.log('\n=== FINAL RANKING ===');
for (const r of results) {
  const tag=r.pnl>10000?'🏆':r.pnl>0?'🟢':'🔴';
  console.log(`${tag} ${r.addr} | pnl:$${r.pnl.toFixed(0)} | t:${r.t} wk:${r.wk}/mo:${r.mo} seen:${r.seen}x`);
}
