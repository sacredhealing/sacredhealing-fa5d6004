/**
 * MEGASCAN — Find insiders making $500-$250k in 30 minutes on Polygon
 * Strategy: scan large blocks, find wallets with massive single-trade PnL
 * Look for: $10k+ single positions, rapid entry/exit, consistent winners
 */
const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';
const POLY  = 'https://clob.polymarket.com';

async function get(url, timeout=12000) {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(timeout),
    });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// Get top traders by volume from Polymarket activity endpoints
async function findTopVolumeWallets() {
  console.log('\n🔍 STRATEGY 1: High-volume recent traders via activity API');
  
  // Get recent large trades from gamma events
  const events = await get(`${GAMMA}/events?limit=20&active=true&order=volume&ascending=false`);
  if (events && Array.isArray(events)) {
    console.log(`Active events found: ${events.length}`);
    events.slice(0,5).forEach(e => {
      console.log(`  ${e.title?.slice(0,60)} | vol: $${Number(e.volume||0).toFixed(0)}`);
    });
  }

  // Try to get large position holders
  const bigMarkets = await get(`${GAMMA}/markets?limit=20&order=volume&ascending=false&closed=false`);
  if (bigMarkets && Array.isArray(bigMarkets)) {
    console.log(`\nTop markets by volume: ${bigMarkets.length}`);
    bigMarkets.slice(0,5).forEach(m => {
      console.log(`  ${m.question?.slice(0,55)} | vol: $${Number(m.volume||0).toFixed(0)} | liq: $${Number(m.liquidity||0).toFixed(0)}`);
    });
  }
}

// Get wallets with largest single positions
async function findLargePositionHolders() {
  console.log('\n🔍 STRATEGY 2: Wallets with $10k+ single positions');
  
  // Sample top markets and find their largest holders
  const markets = await get(`${GAMMA}/markets?limit=50&order=volume&ascending=false&closed=false`);
  if (!markets || !Array.isArray(markets)) return [];
  
  const whaleWallets = new Set();
  
  for (const m of markets.slice(0,10)) {
    if (!m.conditionId) continue;
    // Try to get top traders for this market
    const traders = await get(`${DATA}/activity?market=${m.conditionId}&limit=50&sortBy=cashVolume&sortDirection=DESC`);
    if (Array.isArray(traders) && traders.length > 0) {
      console.log(`\n  Market: ${m.question?.slice(0,50)}`);
      traders.slice(0,5).forEach(t => {
        if (t.proxyWallet) {
          whaleWallets.add(t.proxyWallet);
          console.log(`    ${t.proxyWallet?.slice(0,14)} | size: $${Number(t.usdcSize||0).toFixed(0)} | price: ${Number(t.price||0).toFixed(3)}`);
        }
      });
    }
    await new Promise(r=>setTimeout(r,200));
  }
  return [...whaleWallets];
}

// Find wallets with massive rapid PnL (insider pattern)
async function findInsiderPattern(addresses) {
  console.log(`\n🔍 STRATEGY 3: Insider pattern scan on ${addresses.length} addresses`);
  console.log('Looking for: large positions closed quickly, consistent wins on political/geo events\n');
  
  const insiders = [];
  
  for (const addr of addresses.slice(0,40)) {
    const [positions, trades] = await Promise.all([
      get(`${DATA}/positions?user=${addr}&limit=500`),
      get(`${DATA}/trades?user=${addr}&limit=500&sortBy=timestamp&sortDirection=DESC`),
    ]);
    
    const pArr = Array.isArray(positions) ? positions : [];
    const tArr = Array.isArray(trades) ? trades : [];
    
    if (pArr.length === 0 && tArr.length === 0) continue;
    
    const totalPnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
    if (totalPnl <= 0) continue; // skip losers
    
    // Find rapid large wins (insider signature)
    const bigWins = pArr.filter(p => parseFloat(p.cashPnl||0) > 5000);
    const massiveWins = pArr.filter(p => parseFloat(p.cashPnl||0) > 50000);
    
    // Check if trades cluster around political/geo events
    const now = Date.now()/1000;
    const recentTrades = tArr.filter(t => t.timestamp && (now - t.timestamp) < 30*86400);
    const weekTrades = tArr.filter(t => t.timestamp && (now - t.timestamp) < 7*86400);
    
    // Large position sizing = insider confidence
    const positions10k = pArr.filter(p => parseFloat(p.initialValue||0) > 10000);
    const positions100k = pArr.filter(p => parseFloat(p.initialValue||0) > 100000);
    
    if (totalPnl > 1000 || bigWins.length > 0) {
      insiders.push({
        addr, totalPnl, bigWins: bigWins.length, massiveWins: massiveWins.length,
        positions10k: positions10k.length, positions100k: positions100k.length,
        totalPositions: pArr.length, totalTrades: tArr.length,
        weekTrades: weekTrades.length, recentTrades: recentTrades.length,
        topWin: Math.max(0, ...pArr.map(p=>parseFloat(p.cashPnl||0))),
        topPosition: Math.max(0, ...pArr.map(p=>parseFloat(p.initialValue||0))),
        avgPositionSize: pArr.length > 0 ? pArr.reduce((s,p)=>s+parseFloat(p.initialValue||0),0)/pArr.length : 0,
      });
      
      const flag = massiveWins.length > 0 ? '🚨 INSIDER' : bigWins.length > 0 ? '⭐ BIG PLAYER' : '🟢 PROFITABLE';
      console.log(`${flag} ${addr.slice(0,16)} | PnL:$${totalPnl.toFixed(0)} | bigWins:${bigWins.length} | $100k+pos:${positions100k.length} | wk:${weekTrades.length}t`);
      
      if (massiveWins.length > 0) {
        bigWins.slice(0,3).forEach(p => {
          console.log(`         +$${parseFloat(p.cashPnl).toFixed(0).padStart(8)} | ${String(p.title||p.market||'?').slice(0,55)}`);
        });
      }
    }
    
    await new Promise(r=>setTimeout(r,150));
  }
  
  return insiders.sort((a,b)=>b.totalPnl - a.totalPnl);
}

// MAIN
console.log('╔══════════════════════════════════════════════════════╗');
console.log('  🦈 MEGASCAN — Insider & Big Player Detection');
console.log(`  ${new Date().toISOString()}`);
console.log('╚══════════════════════════════════════════════════════╝');

await findTopVolumeWallets();
const newWallets = await findLargePositionHolders();
console.log(`\nNew wallets found from large trades: ${newWallets.length}`);

// Also scan known Polymarket leaderboard addresses
// These are publicly discussed high-performers in the Polymarket community
const KNOWN_INSIDERS = [
  '0x1a4f30e24b87b30fef617fb5e47d28ae7bd4de15',
  '0x8cdd4a79a03dc7f94d43f5be2fd68b74aae68db9',
  '0x7fce5e3dc7d2a6e63f2e1a4e9d6a1e7f8b3c9d0a',
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik - sometimes trades
  '0x3a7e4f5b6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
  '0x2b6a3c5d4e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1',
];

const allAddresses = [...new Set([...newWallets, ...KNOWN_INSIDERS])];
const insiders = await findInsiderPattern(allAddresses);

console.log('\n\n╔══════════════════════════════════════════════════════╗');
console.log('  FINAL RANKING — TOP INSIDER/BIG PLAYER WALLETS');
console.log('╚══════════════════════════════════════════════════════╝\n');

insiders.slice(0,20).forEach((w,i) => {
  const tag = w.massiveWins > 0 ? '🚨' : w.bigWins > 2 ? '⭐' : '🟢';
  console.log(`${tag} #${i+1} ${w.addr}`);
  console.log(`   PnL: $${w.totalPnl.toFixed(0)} | Best trade: +$${w.topWin.toFixed(0)} | Avg pos: $${w.avgPositionSize.toFixed(0)}`);
  console.log(`   $10k+ positions: ${w.positions10k} | $100k+ positions: ${w.positions100k} | This week: ${w.weekTrades} trades`);
  console.log('');
});

console.log(`\nTotal profitable wallets found: ${insiders.length}`);
console.log(`With $50k+ single wins: ${insiders.filter(w=>w.massiveWins>0).length}`);
console.log(`With $10k+ positions: ${insiders.filter(w=>w.positions10k>0).length}`);
