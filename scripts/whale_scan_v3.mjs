/**
 * FINAL INSIDER SCAN
 * trades?conditionId= works! Returns all wallets per market.
 * Scan all 275 markets from known insiders, find $5k+ co-traders.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function get(url) {
  try {
    const r = await fetch(url,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(12000)});
    return r.ok ? r.json() : null;
  } catch {return null;}
}
async function dbUpsert(d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/polymarket_whales?on_conflict=address`,{
    method:'POST',
    headers:{...SB,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify(d),
  });
  return r.ok;
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('  🚨 FINAL INSIDER SCAN — trades?conditionId method');
console.log(`  ${new Date().toISOString()}`);
console.log('╚═══════════════════════════════════════════════════════╝\n');

// KNOWN insiders to pull markets from
const SEED_WALLETS = [
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73', // BAA2BC Iran Oracle
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5', // ED107A NO Machine
  '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c', // A7A8C1 World Cup
  '0xb2a3623364c33561d8312e1edb79eb941c798510', // B2A362 Confirm Whale
];

const KNOWN = new Set([
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73',
  '0xb2a3623364c33561d8312e1edb79eb941c798510',
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5',
  '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c',
  '0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786',
  '0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6',
  '0xd3b034d7bfb2473fb252d0414646d9786bac329e',
]);

// Step 1: Get all conditionIds from seed wallets
const allCids = new Set();
for (const addr of SEED_WALLETS) {
  const tr = await get(`${DATA}/trades?user=${addr}&limit=500`);
  if (!Array.isArray(tr)) continue;
  tr.forEach(t=>{ if(t.conditionId) allCids.add(t.conditionId); });
  console.log(`${addr.slice(0,14)}: ${tr.length} trades → ${[...new Set(tr.map(t=>t.conditionId).filter(Boolean))].length} markets`);
  await new Promise(r=>setTimeout(r,200));
}
console.log(`\nTotal markets to scan: ${allCids.size}\n`);

// Step 2: For each market, get all traders via trades?conditionId
const walletMap = new Map();
let scanned = 0;
for (const cid of allCids) {
  scanned++;
  // Paginate: get up to 500 trades per market
  const trades = await get(`${DATA}/trades?conditionId=${cid}&limit=500`);
  if (!Array.isArray(trades)) { await new Promise(r=>setTimeout(r,100)); continue; }
  
  for (const t of trades) {
    const w = t.proxyWallet;
    if (!w || KNOWN.has(w)) continue;
    if (!walletMap.has(w)) walletMap.set(w,{addr:w,totalTrades:0,conditionIds:new Set(),maxSize:0,titles:new Set()});
    const wdata = walletMap.get(w);
    wdata.totalTrades++;
    wdata.conditionIds.add(cid);
    if (t.title) wdata.titles.add(String(t.title).slice(0,60));
    // size is in shares not USDC in this endpoint - use size field
    const size = parseFloat(t.size||0);
    wdata.maxSize = Math.max(wdata.maxSize, size);
  }
  
  if (scanned % 20 === 0) process.stdout.write(`  Scanned ${scanned}/${allCids.size} markets | ${walletMap.size} unique wallets\r`);
  await new Promise(r=>setTimeout(r,80));
}
console.log(`\n\n✅ Found ${walletMap.size} unique co-traders across ${allCids.size} markets\n`);

// Step 3: Sort by activity and deep scan top wallets
const sorted = [...walletMap.values()]
  .sort((a,b) => b.conditionIds.size - a.conditionIds.size || b.totalTrades - a.totalTrades)
  .slice(0,80);

console.log('Top 20 most active co-traders:');
sorted.slice(0,20).forEach((w,i)=>{
  console.log(`  #${String(i+1).padStart(2)} ${w.addr} | ${w.conditionIds.size} shared markets | ${w.totalTrades} trades`);
});

// Step 4: Deep PnL scan each
console.log(`\n🔍 Deep PnL scan on ${sorted.length} wallets...\n`);
const results = [];
for (const w of sorted) {
  const [pos, tr] = await Promise.all([
    get(`${DATA}/positions?user=${w.addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${w.addr}&limit=200&sortBy=usdcSize&sortDirection=DESC`),
  ]);
  const pArr = Array.isArray(pos)?pos:[];
  const tArr = Array.isArray(tr)?tr:[];
  
  const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
  const wins = pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
  const bigWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>10000);
  const massiveWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
  const wr = pArr.length>0 ? Math.round(wins.length/pArr.length*100) : 0;
  const topWin = Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0)));
  const topPos = Math.max(0,...pArr.map(p=>parseFloat(p.initialValue||0)));
  const now = Date.now()/1000;
  const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;

  const titles = [...pArr.slice(0,15).map(p=>p.title||''), ...tArr.slice(0,15).map(t=>t.title||'')]
    .join(' ').toLowerCase();
  const isGeo = /iran|nuclear|enrich|sanction|peace|military|regime|missile|strike/.test(titles);
  const isPol = /president|trump|election|impeach|resign|vance|harris|2028/.test(titles);
  const isSports = /world cup|fifa|nba|nfl|soccer|championship/.test(titles);
  const cat = isGeo?'🌍 GEO':isPol?'🏛 POL':isSports?'⚽ SPORTS':'🔀 MIXED';

  const tag = massiveWins.length>0?'🚨 WHALE':bigWins.length>0?'⭐ BIG':pnl>5000?'🏆':pnl>0?'🟢':'🔴';
  process.stdout.write(`${tag} ${w.addr.slice(0,16)} | pnl:$${pnl.toFixed(0)} WR:${wr}% ${cat} | markets:${w.conditionIds.size} trades:${w.totalTrades}${massiveWins.length>0?` 🚨${massiveWins.length}x$50k+`:''}\n`);

  if (massiveWins.length>0) {
    massiveWins.slice(0,3).forEach(p=>
      console.log(`   +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,65)}`)
    );
  }

  results.push({
    addr:w.addr, pnl, wr, wins:wins.length, total:pArr.length,
    bigWins:bigWins.length, massiveWins:massiveWins.length,
    topWin, topPos, wk, cat,
    sharedMarkets:w.conditionIds.size, totalTrades:w.totalTrades,
    allTitles:[...w.titles].slice(0,5),
  });
  await new Promise(r=>setTimeout(r,150));
}

results.sort((a,b)=>b.pnl-a.pnl);
const profitable = results.filter(r=>r.pnl>0);
const insiders = results.filter(r=>r.massiveWins>0||r.topPos>=100000);

console.log('\n\n╔═══════════════════════════════════════════════════════╗');
console.log('  🚨 NEW INSIDER & WHALE WALLETS DISCOVERED');
console.log('╚═══════════════════════════════════════════════════════╝\n');

profitable.forEach((r,i)=>{
  const tag = r.massiveWins>0?'🚨🚨 INSIDER':r.bigWins>0?'🚨 BIG PLAYER':r.pnl>5000?'🏆 ELITE':'🟢 PROFITABLE';
  console.log(`${tag} #${i+1}`);
  console.log(`  ${r.addr}`);
  console.log(`  PnL: $${r.pnl.toFixed(0)} | WR: ${r.wr}% (${r.wins}W/${r.total-r.wins}L) | ${r.cat}`);
  console.log(`  Best: +$${r.topWin.toFixed(0)} | Max pos: $${r.topPos.toFixed(0)} | Shared markets: ${r.sharedMarkets} | Wk: ${r.wk}t`);
  if (r.allTitles.length>0) console.log(`  Trades: ${r.allTitles.slice(0,2).join(' | ')}`);
  if (r.massiveWins>0||r.bigWins>0) {
    // show top wins inline
  }
  console.log('');
});

// Save
let saved=0;
for (const r of profitable.filter(r=>r.pnl>2000||r.massiveWins>0||r.topPos>=100000)) {
  const strategy = r.cat.includes('GEO')?'insider_geo':r.cat.includes('POL')?'no_machine':r.cat.includes('SPORTS')?'mirror':'mirror';
  const elite = r.pnl>5000||r.massiveWins>0||r.topPos>=100000;
  if (await dbUpsert({
    address:r.addr, alias:`${elite?'NEW-INSIDER':'NEW-PROFIT'}-${r.addr.slice(2,8).toUpperCase()}`,
    win_rate_30d:r.wr, roi_30d:0, total_profit:Math.max(r.pnl,0),
    trades_tracked:r.total, total_trades_seen:r.sharedMarkets,
    is_active:true, is_elite:elite, strategy,
  })) saved++;
}

console.log(`━━━ COMPLETE ━━━`);
console.log(`Co-traders found: ${walletMap.size}`);
console.log(`Profitable: ${profitable.length}`);
console.log(`Insiders/Whales: ${insiders.length}`);
console.log(`Saved to DB: ${saved}`);
