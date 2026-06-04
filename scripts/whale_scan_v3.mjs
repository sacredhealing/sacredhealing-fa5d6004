/**
 * SMART INSIDER SCAN — No RPC needed
 * Uses Polymarket data-api co-trader method:
 * 1. Pull all trades from BAA2BC's known Iran markets
 * 2. Find ALL wallets who bet $5k+ in those same markets
 * 3. Deep scan each for full PnL history
 * 4. Identify geopolitical/political insiders
 * This is the correct approach — the data is already in Polymarket's API
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function get(url) {
  try {
    const r = await fetch(url, {
      headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'},
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? r.json() : null;
  } catch {return null;}
}

async function dbUpsert(d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/polymarket_whales?on_conflict=address`, {
    method:'POST',
    headers:{...SB,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
    body: JSON.stringify(d),
  });
  return r.ok;
}

async function dbGet(t, q='') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`,{headers:SB});
  return r.ok ? r.json() : [];
}

// Deep scan a wallet
async function scanWallet(addr) {
  const [pos, tr] = await Promise.all([
    get(`${DATA}/positions?user=${addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${addr}&limit=500&sortBy=usdcSize&sortDirection=DESC`),
  ]);
  const pArr = Array.isArray(pos)?pos:[];
  const tArr = Array.isArray(tr)?tr:[];
  
  const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
  const wins = pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
  const massiveWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
  const bigWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>10000);
  const wr = pArr.length>0 ? Math.round(wins.length/pArr.length*100) : 0;
  const topWin = Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0)));
  const topPos = Math.max(0,...pArr.map(p=>parseFloat(p.initialValue||0)));
  const now = Date.now()/1000;
  const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;
  const maxTrade = Math.max(0,...tArr.map(t=>parseFloat(t.usdcSize||0)));

  // Detect categories
  const titles = [...pArr.slice(0,20).map(p=>p.title||''), ...tArr.slice(0,20).map(t=>t.title||'')]
    .join(' ').toLowerCase();
  const isGeo = /iran|nuclear|enrich|sanction|peace|military|regime|war|strike/.test(titles);
  const isPol = /president|trump|election|impeach|resign|congress|vance|2028|2024/.test(titles);
  const isSports = /world cup|fifa|nba|nfl|nhl|mlb|soccer|football|basketball/.test(titles);
  const cat = isGeo?'🌍 GEO-INSIDER':isPol?'🏛 POLITICAL':isSports?'⚽ SPORTS':'🔀 MIXED';

  return { addr, pnl, wr, wins:wins.length, total:pArr.length,
    bigWins:bigWins.length, massiveWins:massiveWins.length,
    wk, topWin, topPos, maxTrade, cat, pArr, tArr };
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('  🚨 INSIDER DISCOVERY — Co-Trader Method');
console.log(`  ${new Date().toISOString()}`);
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Step 1: Get all conditionIds from known insiders
const INSIDERS = [
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73', // Iran Oracle
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5', // NO Machine  
  '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c', // World Cup
];

const allConditions = new Set();
console.log('📡 Pulling market IDs from known insiders...');
for (const addr of INSIDERS) {
  const tr = await get(`${DATA}/trades?user=${addr}&limit=500`);
  if (!Array.isArray(tr)) continue;
  tr.forEach(t => { if(t.conditionId) allConditions.add(t.conditionId); });
  console.log(`  ${addr.slice(0,14)}: ${tr.length} trades, ${[...new Set(tr.map(t=>t.conditionId).filter(Boolean))].length} markets`);
  await new Promise(r=>setTimeout(r,300));
}
console.log(`\nTotal unique markets to scan: ${allConditions.size}`);

// Step 2: For each market, get all traders with $5k+ positions
const discoveredWallets = new Map();
let mScanned = 0;

console.log('\n📡 Finding co-traders in each market...');
for (const cid of allConditions) {
  mScanned++;
  // Get activity for this market
  const activity = await get(`${DATA}/activity?conditionId=${cid}&limit=500`);
  const arr = Array.isArray(activity) ? activity : [];
  
  for (const a of arr) {
    const wallet = a.proxyWallet;
    if (!wallet || INSIDERS.includes(wallet)) continue;
    const size = parseFloat(a.usdcSize||0);
    if (size < 5000) continue; // $5k+ only
    
    if (!discoveredWallets.has(wallet)) {
      discoveredWallets.set(wallet, { addr: wallet, maxSize: 0, totalVol: 0, markets: new Set() });
    }
    const w = discoveredWallets.get(wallet);
    w.maxSize = Math.max(w.maxSize, size);
    w.totalVol += size;
    w.markets.add(cid);
  }
  
  if (mScanned % 10 === 0) {
    process.stdout.write(`  Scanned ${mScanned}/${allConditions.size} markets | ${discoveredWallets.size} wallets found\r`);
  }
  await new Promise(r=>setTimeout(r,100));
}
console.log(`\n\n✅ Co-trader discovery: ${discoveredWallets.size} wallets with $5k+ trades`);

// Also scan via gamma top events for new insider markets
console.log('\n📡 Scanning top-volume markets for large players...');
const topEvents = await get(`${GAMMA}/events?limit=30&order=volume&ascending=false`);
if (Array.isArray(topEvents)) {
  for (const e of topEvents.slice(0,15)) {
    const mArr = Array.isArray(e.markets) ? e.markets : [];
    for (const m of mArr.slice(0,2)) {
      if (!m.conditionId) continue;
      const activity = await get(`${DATA}/activity?conditionId=${m.conditionId}&limit=500`);
      if (!Array.isArray(activity)) continue;
      
      const big = activity.filter(a => parseFloat(a.usdcSize||0) >= 10000);
      if (big.length > 0) {
        console.log(`  ${e.title?.slice(0,45)} | ${big.length} trades $10k+`);
        for (const a of big) {
          const w = a.proxyWallet;
          if (!w || INSIDERS.includes(w)) continue;
          if (!discoveredWallets.has(w)) discoveredWallets.set(w, {addr:w,maxSize:0,totalVol:0,markets:new Set()});
          const wallet = discoveredWallets.get(w);
          wallet.maxSize = Math.max(wallet.maxSize, parseFloat(a.usdcSize||0));
          wallet.totalVol += parseFloat(a.usdcSize||0);
          wallet.markets.add(m.conditionId);
        }
      }
      await new Promise(r=>setTimeout(r,200));
    }
  }
}

// Sort by max single trade
const sorted = [...discoveredWallets.values()]
  .sort((a,b) => b.maxSize - a.maxSize);
console.log(`\nTotal unique wallets: ${sorted.length}`);
console.log('\nTop 20 by largest single trade:');
sorted.slice(0,20).forEach((w,i) => {
  const tag = w.maxSize>=100000?'🚨🚨':w.maxSize>=50000?'🚨':w.maxSize>=20000?'⭐':'  ';
  console.log(`  ${tag} #${String(i+1).padStart(2)} ${w.addr} | max:$${w.maxSize.toFixed(0).padStart(9)} | vol:$${w.totalVol.toFixed(0).padStart(11)} | markets:${w.markets.size}`);
});

// Known existing wallets
const KNOWN = new Set([
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73',
  '0xb2a3623364c33561d8312e1edb79eb941c798510',
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5',
  '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c',
  '0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786',
  '0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6',
  '0xd3b034d7bfb2473fb252d0414646d9786bac329e',
]);

const toScan = sorted.filter(w => !KNOWN.has(w.addr)).slice(0, 60);
console.log(`\n🔍 Deep scanning ${toScan.length} new wallets...\n`);

const results = [];
for (const w of toScan) {
  const data = await scanWallet(w.addr);
  const tag = data.massiveWins>0?'🚨 WHALE':data.bigWins>0?'⭐ BIG':data.pnl>0?'🟢':'🔴';
  process.stdout.write(
    `${tag} ${w.addr.slice(0,16)} | on-chain max:$${w.maxSize.toFixed(0)} | pnl:$${data.pnl.toFixed(0)} WR:${data.wr}% ${data.cat}\n`
  );
  if (data.massiveWins > 0) {
    data.pArr.filter(p=>parseFloat(p.cashPnl||0)>50000).slice(0,3).forEach(p =>
      console.log(`   +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,65)}`)
    );
  }
  if (data.pnl > 1000 || w.maxSize >= 50000) results.push({...data, maxOnChain:w.maxSize, sharedMarkets:w.markets.size});
  await new Promise(r=>setTimeout(r,200));
}

results.sort((a,b) => b.pnl - a.pnl);

console.log('\n\n╔═══════════════════════════════════════════════════════╗');
console.log('  🚨 NEW INSIDER WALLETS — FULL REPORT');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const profitable = results.filter(r => r.pnl > 0);
const insiderClass = results.filter(r => r.massiveWins>0 || r.maxOnChain>=100000);

profitable.forEach((r,i) => {
  const tag = r.maxOnChain>=100000?'🚨🚨 MEGA':r.massiveWins>0?'🚨 INSIDER':r.bigWins>0?'⭐ BIG PLAYER':r.pnl>5000?'🏆':'🟢';
  console.log(`${tag} #${i+1}`);
  console.log(`  Address:  ${r.addr}`);
  console.log(`  PnL:      $${r.pnl.toFixed(0)} | WR: ${r.wr}% (${r.wins}W/${r.total-r.wins}L)`);
  console.log(`  Best win: +$${r.topWin.toFixed(0)} | Biggest bet: $${r.maxOnChain.toFixed(0)}`);
  console.log(`  Category: ${r.cat} | Shared markets: ${r.sharedMarkets} | This week: ${r.wk}t`);
  if (r.massiveWins>0 || r.bigWins>0) {
    r.pArr.filter(p=>parseFloat(p.cashPnl||0)>10000).slice(0,3).forEach(p =>
      console.log(`  🏆 +$${Number(p.cashPnl).toFixed(0).padStart(8)} | ${String(p.title||'?').slice(0,65)}`)
    );
  }
  console.log('');
});

// Save to DB
let saved = 0;
for (const r of profitable.filter(r => r.pnl > 2000 || r.massiveWins > 0 || r.maxOnChain >= 50000)) {
  const strategy = r.cat.includes('GEO')?'insider_geo':r.cat.includes('POL')?'no_machine':r.cat.includes('SPORTS')?'mirror':'mirror';
  const elite = r.pnl > 5000 || r.massiveWins > 0 || r.maxOnChain >= 100000;
  const ok = await dbUpsert({
    address: r.addr,
    alias: `${elite?'🚨':'🟢'}NEW-${r.addr.slice(2,8).toUpperCase()}`,
    win_rate_30d: r.wr, roi_30d: 0,
    total_profit: Math.max(r.pnl,0),
    trades_tracked: r.total,
    total_trades_seen: r.sharedMarkets,
    is_active: true, is_elite: elite, strategy,
  });
  if (ok) saved++;
}

console.log(`━━━ SCAN COMPLETE ━━━`);
console.log(`Wallets scanned: ${toScan.length}`);
console.log(`New profitable: ${profitable.length}`);
console.log(`Classified as insiders: ${insiderClass.length}`);
console.log(`Saved to DB: ${saved}`);
