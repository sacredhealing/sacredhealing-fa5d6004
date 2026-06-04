/**
 * CO-TRADER SCAN
 * Find all wallets trading the SAME markets as our 3 insiders
 * Then score them on PnL - these are the hidden whales
 */
const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: {'Accept':'application/json','User-Agent':'Mozilla/5.0'},
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// Get ALL conditionIds our 3 insiders have traded
async function getInsiderMarkets(addr, label) {
  const trades = await get(`${DATA}/trades?user=${addr}&limit=500&sortBy=timestamp&sortDirection=DESC`);
  if (!Array.isArray(trades)) return [];
  const cids = [...new Set(trades.map(t => t.conditionId).filter(Boolean))];
  console.log(`${label}: ${cids.length} unique markets traded`);
  return cids;
}

// Get all wallets who also traded in those markets
async function getCoTraders(conditionIds, label) {
  const wallets = new Map();
  let scanned = 0;
  
  for (const cid of conditionIds.slice(0, 30)) { // top 30 markets
    const activity = await get(`${DATA}/activity?conditionId=${cid}&limit=200`);
    const trades = await get(`${DATA}/trades?conditionId=${cid}&limit=200&sortBy=size&sortDirection=DESC`);
    
    const arr = Array.isArray(activity) ? activity : Array.isArray(trades) ? trades : [];
    
    for (const t of arr) {
      const addr = t.proxyWallet || t.user;
      if (!addr) continue;
      if (!wallets.has(addr)) wallets.set(addr, { addr, markets: new Set(), totalSize: 0 });
      wallets.get(addr).markets.add(cid);
      wallets.get(addr).totalSize += parseFloat(t.usdcSize || t.size || 0);
    }
    scanned++;
    if (scanned % 10 === 0) process.stdout.write(`  Scanned ${scanned}/${Math.min(conditionIds.length,30)} markets, found ${wallets.size} wallets\r`);
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n${label} co-traders found: ${wallets.size}`);
  return [...wallets.values()].sort((a,b) => b.totalSize - a.totalSize);
}

console.log('╔══════════════════════════════════════════════════════╗');
console.log('  CO-TRADER SCAN — Find hidden insiders in same markets');
console.log('╚══════════════════════════════════════════════════════╝\n');

// Our 3 known insiders
const INSIDERS = [
  { addr: '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73', label: 'BAA2BC (Iran Oracle)' },
  { addr: '0xb2a3623364c33561d8312e1edb79eb941c798510', label: 'B2A362 (Peace Whale)' },
  { addr: '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5', label: 'ED107A (NO Machine)' },
];

// Get all their markets
const allCids = new Set();
for (const ins of INSIDERS) {
  const cids = await getInsiderMarkets(ins.addr, ins.label);
  cids.forEach(c => allCids.add(c));
}
console.log(`\nTotal unique markets across all 3 insiders: ${allCids.size}`);

// Find co-traders
const coTraders = await getCoTraders([...allCids], 'All insiders');

// Exclude our known 3
const KNOWN = new Set(INSIDERS.map(i => i.addr));
const newWallets = coTraders.filter(w => !KNOWN.has(w.addr));
console.log(`New wallets to scan (excluding known insiders): ${newWallets.length}`);

// Deep scan top 40 by activity
console.log('\n🔍 Deep PnL scan on top 40 co-traders...\n');
const results = [];

for (const w of newWallets.slice(0, 40)) {
  const [pos, tr] = await Promise.all([
    get(`${DATA}/positions?user=${w.addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${w.addr}&limit=500&sortBy=timestamp&sortDirection=DESC`),
  ]);
  const pArr = Array.isArray(pos) ? pos : [];
  const tArr = Array.isArray(tr) ? tr : [];
  
  const pnl = pArr.reduce((s,p) => s+parseFloat(p.cashPnl||0), 0);
  if (pnl <= 0) continue;
  
  const wins = pArr.filter(p => parseFloat(p.cashPnl||0) > 0);
  const big  = pArr.filter(p => parseFloat(p.cashPnl||0) > 10000);
  const massive = pArr.filter(p => parseFloat(p.cashPnl||0) > 50000);
  const now = Date.now()/1000;
  const wk  = tArr.filter(t => t.timestamp && now-t.timestamp < 604800).length;
  const wr  = pArr.length > 0 ? Math.round(wins.length/pArr.length*100) : 0;
  const topWin = Math.max(0, ...pArr.map(p => parseFloat(p.cashPnl||0)));
  const topPos = Math.max(0, ...pArr.map(p => parseFloat(p.initialValue||0)));
  
  const tag = massive.length > 0 ? '🚨 WHALE' : big.length > 0 ? '⭐ INSIDER' : '🟢';
  console.log(`${tag} ${w.addr.slice(0,16)} | pnl:$${pnl.toFixed(0)} | WR:${wr}% | $50k+:${massive.length} | wk:${wk}t | markets:${w.markets.size}`);
  
  if (massive.length > 0 || big.length > 0) {
    pArr.filter(p=>parseFloat(p.cashPnl||0)>10000).slice(0,3).forEach(p => {
      console.log(`   +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,55)}`);
    });
  }
  
  results.push({ addr: w.addr, pnl, wins: wins.length, total: pArr.length, wr,
    bigWins: big.length, massiveWins: massive.length, wk, topWin, topPos,
    sharedMarkets: w.markets.size });
  
  await new Promise(r => setTimeout(r, 200));
}

results.sort((a,b) => b.pnl - a.pnl);

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('  🚨 NEW HIDDEN WHALES DISCOVERED');
console.log('╚══════════════════════════════════════════════════════╝\n');

results.forEach((r, i) => {
  const tag = r.massiveWins>0 ? '🚨' : r.bigWins>0 ? '⭐' : '🟢';
  console.log(`${tag} #${i+1} ${r.addr}`);
  console.log(`  PnL:$${r.pnl.toFixed(0)} | WR:${r.wr}% | Best:+$${r.topWin.toFixed(0)} | MaxPos:$${r.topPos.toFixed(0)} | SharedMarkets:${r.sharedMarkets} | Wk:${r.wk}t`);
  console.log('');
});

console.log(`SUMMARY: ${results.length} new profitable wallets | ${results.filter(r=>r.massiveWins>0).length} with $50k+ wins | ${results.filter(r=>r.pnl>10000).length} with $10k+ total PnL`);
