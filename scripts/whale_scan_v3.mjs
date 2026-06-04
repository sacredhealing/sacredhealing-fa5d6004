/**
 * INSIDER SCAN — Data API approach (no RPC limits)
 * Instead of scanning blocks, use Polymarket's own data-api
 * to find wallets with massive single-position profits
 * Strategy: pull top positions by cashPnl from all markets
 */
const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { Accept:'application/json','User-Agent':'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// Strategy: find the biggest single-position winners by scanning
// top-volume markets and checking who holds the largest positions

async function getTopMarkets() {
  // Get highest volume markets = where insiders bet biggest
  const markets = await get(`${GAMMA}/markets?limit=100&order=volume&ascending=false&closed=false`);
  const closedMarkets = await get(`${GAMMA}/markets?limit=100&order=volume&ascending=false&closed=true`);
  const all = [
    ...(Array.isArray(markets) ? markets : []),
    ...(Array.isArray(closedMarkets) ? closedMarkets : []),
  ];
  console.log(`Total markets fetched: ${all.length}`);
  return all;
}

async function findLargeHolders(conditionId) {
  // Get all positions in this market sorted by size
  const positions = await get(`${DATA}/positions?market=${conditionId}&limit=100&sortBy=size&sortDirection=DESC`);
  return Array.isArray(positions) ? positions : [];
}

async function scanWalletFull(addr) {
  const [pos, tr] = await Promise.all([
    get(`${DATA}/positions?user=${addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${addr}&limit=500&sortBy=timestamp&sortDirection=DESC`),
  ]);
  const pArr = Array.isArray(pos) ? pos : [];
  const tArr = Array.isArray(tr) ? tr : [];
  
  const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0), 0);
  const wins = pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
  const bigWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>10000);
  const massiveWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
  const pos100k = pArr.filter(p=>parseFloat(p.initialValue||0)>100000);
  const pos500k = pArr.filter(p=>parseFloat(p.initialValue||0)>500000);
  const now = Date.now()/1000;
  const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;
  const topWin = Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0)));
  const topPos = Math.max(0,...pArr.map(p=>parseFloat(p.initialValue||0)));
  const wr = pArr.length > 0 ? Math.round(wins.length/pArr.length*100) : 0;
  
  return { addr, pnl, wins:wins.length, total:pArr.length, wr,
    bigWins:bigWins.length, massiveWins:massiveWins.length,
    pos100k:pos100k.length, pos500k:pos500k.length,
    wk, topWin, topPos, tArr, pArr };
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('  🚨 INSIDER SCAN — Finding $500 → $250k players');
console.log(`  ${new Date().toISOString()}`);
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Step 1: Get high-volume markets
const markets = await getTopMarkets();

// Filter to markets where big money moves
const bigMarkets = markets
  .filter(m => parseFloat(m.volume||0) > 500000)
  .sort((a,b) => parseFloat(b.volume) - parseFloat(a.volume));

console.log(`High-volume markets (>$500k vol): ${bigMarkets.length}`);
bigMarkets.slice(0,10).forEach(m => {
  console.log(`  $${Number(m.volume).toLocaleString().padStart(14)} | ${m.question?.slice(0,55)}`);
});

// Step 2: For each big market, get large position holders
const discoveredWallets = new Set();
console.log('\n🔍 Scanning large position holders in top markets...');

for (const m of bigMarkets.slice(0,20)) {
  const holders = await findLargeHolders(m.conditionId);
  if (holders.length > 0) {
    const large = holders.filter(h => parseFloat(h.initialValue||h.size||0) > 50000);
    if (large.length > 0) {
      console.log(`\n  ${m.question?.slice(0,50)}`);
      large.slice(0,5).forEach(h => {
        const addr = h.proxyWallet || h.user || h.address;
        if (addr) {
          discoveredWallets.add(addr);
          console.log(`    ${addr.slice(0,16)} | pos: $${Number(h.initialValue||h.size||0).toFixed(0)} | pnl: $${Number(h.cashPnl||0).toFixed(0)}`);
        }
      });
    }
  }
  await new Promise(r=>setTimeout(r,200));
}

// Step 3: Also scan using different query — look for positions with huge cashPnl
console.log('\n🔍 Scanning for positions with $50k+ PnL...');
const bigPnlPositions = await get(`${DATA}/positions?limit=500&sortBy=cashPnl&sortDirection=DESC&sizeThreshold=1000`);
if (Array.isArray(bigPnlPositions)) {
  console.log(`Large PnL positions returned: ${bigPnlPositions.length}`);
  bigPnlPositions.filter(p=>parseFloat(p.cashPnl||0)>10000).slice(0,20).forEach(p => {
    const addr = p.proxyWallet||p.user||p.address;
    if (addr) discoveredWallets.add(addr);
    console.log(`  +$${Number(p.cashPnl).toFixed(0).padStart(10)} | ${addr?.slice(0,14)} | ${String(p.title||'?').slice(0,50)}`);
  });
}

console.log(`\nTotal wallets discovered: ${discoveredWallets.size}`);

// Step 4: Deep scan each discovered wallet
console.log('\n🔍 Deep scanning all discovered wallets...\n');
const results = [];

for (const addr of discoveredWallets) {
  const w = await scanWalletFull(addr);
  if (w.pnl <= 0) continue;
  
  const tag = w.massiveWins > 0 ? '🚨 WHALE' : w.bigWins > 0 ? '⭐ INSIDER' : '🟢';
  console.log(`${tag} ${addr.slice(0,16)} | pnl:$${w.pnl.toFixed(0)} | WR:${w.wr}% | best:+$${w.topWin.toFixed(0)} | maxPos:$${w.topPos.toFixed(0)} | wk:${w.wk}t`);
  
  if (w.massiveWins > 0) {
    w.pArr.filter(p=>parseFloat(p.cashPnl||0)>50000).slice(0,3).forEach(p => {
      console.log(`    +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,55)}`);
    });
  }
  
  results.push(w);
  await new Promise(r=>setTimeout(r,150));
}

results.sort((a,b)=>b.pnl-a.pnl);

console.log('\n\n╔═══════════════════════════════════════════════════════╗');
console.log('  FINAL RANKING — NEW INSIDER WALLETS');
console.log('╚═══════════════════════════════════════════════════════╝\n');

results.forEach((w,i) => {
  const tag = w.massiveWins>0?'🚨 WHALE':w.bigWins>0?'⭐ BIG PLAYER':w.pos100k>0?'💰 HEAVY':'🟢';
  console.log(`${tag} #${i+1} ${w.addr}`);
  console.log(`  PnL: $${w.pnl.toFixed(0)} | WR: ${w.wr}% (${w.wins}W/${w.total-w.wins}L) | This week: ${w.wk} trades`);
  console.log(`  Best trade: +$${w.topWin.toFixed(0)} | Biggest position: $${w.topPos.toFixed(0)}`);
  console.log(`  $10k+ wins: ${w.bigWins} | $50k+ wins: ${w.massiveWins} | $100k+ positions: ${w.pos100k}`);
  console.log('');
});

console.log(`Summary: ${results.length} profitable | ${results.filter(w=>w.massiveWins>0).length} with $50k+ wins | ${results.filter(w=>w.topPos>100000).length} with $100k+ positions`);
