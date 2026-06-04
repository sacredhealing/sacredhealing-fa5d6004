const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';
const CLOB  = 'https://clob.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { Accept:'application/json','User-Agent':'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

console.log('🔍 LEADERBOARD + TOP TRADER DISCOVERY\n');

// Try every known leaderboard/ranking endpoint
const endpoints = [
  `${DATA}/leaderboard?limit=100`,
  `${DATA}/leaderboard?window=all&limit=100`,
  `${DATA}/leaderboard?interval=all&limit=100`,
  `${DATA}/rankings?limit=100`,
  `${DATA}/top-traders?limit=100`,
  `${DATA}/traders?sortBy=pnl&limit=100`,
  `${GAMMA}/leaderboard?limit=100`,
  `${CLOB}/leaderboard?limit=100`,
  `https://polymarket.com/api/leaderboard/users?interval=all&limit=100`,
  `${DATA}/users?sortBy=profit&limit=100`,
  `${DATA}/stats/leaderboard?limit=100`,
];

for (const url of endpoints) {
  try {
    const r = await fetch(url, {
      headers:{Accept:'application/json','User-Agent':'Mozilla/5.0'},
      signal: AbortSignal.timeout(8000),
    });
    const text = await r.text();
    const preview = text.slice(0,200).replace(/\n/g,' ');
    console.log(`${r.status} | ${url.replace('https://','').slice(0,55)}`);
    if (r.ok && text.length > 10 && !text.includes('404') && !text.includes('Not Found')) {
      console.log(`  → ${preview}`);
    }
  } catch(e) {
    console.log(`ERR | ${url.replace('https://','').slice(0,55)} | ${e.message}`);
  }
  await new Promise(r=>setTimeout(r,200));
}

// Try getting activity for known biggest markets
console.log('\n🔍 Activity in $1B+ volume markets...');
const topMarkets = [
  { name: 'Presidential 2024', id: '0x' },
  { name: 'NBA Champion', id: null },
  { name: 'World Cup Winner', id: null },
];

// Get the actual condition IDs from gamma
const markets = await get(`${GAMMA}/events?limit=5&order=volume&ascending=false`);
if (Array.isArray(markets)) {
  console.log('Top events:');
  markets.forEach(e => {
    console.log(`  ${e.title?.slice(0,50)} | vol: $${Number(e.volume||0).toLocaleString()}`);
    console.log(`  Fields: ${Object.keys(e).join(', ')}`);
    if (e.markets) console.log(`  Markets: ${JSON.stringify(e.markets).slice(0,200)}`);
  });
}

// Try querying trades for specific known condition IDs
// Presidential 2024 is one of the most traded
const presActivity = await get(`${DATA}/activity?conditionId=0x1d1a4a9b3d7c5e8a6f2b4c9e1a3d7f5b2e8c4a9f6d1b3e7a5c2d8f4b1e6a3c9&limit=20`);
console.log('\nPresidential activity:', presActivity ? JSON.stringify(presActivity).slice(0,300) : 'null');

// Try trades with high USDC size
const bigTrades = await get(`${DATA}/trades?limit=100&sortBy=usdcSize&sortDirection=DESC`);
if (Array.isArray(bigTrades) && bigTrades.length > 0) {
  console.log(`\n🎯 Largest trades ever (sorted by size): ${bigTrades.length}`);
  bigTrades.slice(0,20).forEach(t => {
    console.log(`  $${Number(t.usdcSize||0).toFixed(0).padStart(10)} | ${t.proxyWallet?.slice(0,14)} | ${String(t.title||t.market||'?').slice(0,40)}`);
  });
}
