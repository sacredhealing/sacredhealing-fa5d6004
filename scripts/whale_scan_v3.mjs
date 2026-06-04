/**
 * Pull real trade frequency + avg entry price + avg return for all 18 wallets
 */
const DATA = 'https://data-api.polymarket.com';

const WALLETS = [
  { alias: 'BAA2BC — Iran Insider',    addr: '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73', pnl: 191503, wr: 83, strategy: 'insider_geo' },
  { alias: 'CryptoOracle-06DC51',      addr: '0x06dc51826bc524d9a83770e7de9dd7e005b04524', pnl: 131298, wr: 78, strategy: 'mirror' },
  { alias: 'B2A362 — Confirm Whale',   addr: '0xb2a3623364c33561d8312e1edb79eb941c798510', pnl: 125453, wr: 75, strategy: 'confirmation' },
  { alias: 'SportsWhale-84CFFF',       addr: '0x84cfffc3f16dcc353094de30d4a45226eccd2f63', pnl: 60730,  wr: 30, strategy: 'mirror' },
  { alias: 'ED107A — NO Machine',      addr: '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5', pnl: 58947,  wr: 89, strategy: 'no_machine' },
  { alias: 'A7A8C1 — World Cup',       addr: '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c', pnl: 47554,  wr: 87, strategy: 'mirror' },
  { alias: 'F49CE4 — High Freq',       addr: '0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786', pnl: 41975,  wr: 52, strategy: 'mirror' },
  { alias: 'E9076A — Co-Trader',       addr: '0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6', pnl: 30103,  wr: 83, strategy: 'mirror' },
  { alias: 'PerfectWR-204F72',         addr: '0x204f72f35326db932158cba6adff0b9a1da95e14', pnl: 25928,  wr: 100, strategy: 'mirror' },
  { alias: 'GeoWatch-84AD9C',          addr: '0x84ad9c5c547a82ec9a08547b94bd922446e5bfb7', pnl: 16633,  wr: 18, strategy: 'mirror' },
  { alias: 'Elite-D3B034',             addr: '0xd3b034d7bfb2473fb252d0414646d9786bac329e', pnl: 14882,  wr: 54, strategy: 'mirror' },
  { alias: 'EED588',                   addr: '0xeed588bab0b0df73a9a6def7a59e512e9ede1a33', pnl: 11740,  wr: 67, strategy: 'mirror' },
  { alias: '000D25',                   addr: '0x000d257d2dc7616feaef4ae0f14600fdf50a758e', pnl: 8017,   wr: 51, strategy: 'mirror' },
  { alias: '335592',                   addr: '0x335592400e402c26583ce8b56d12605e9548a126', pnl: 7499,   wr: 100, strategy: 'mirror' },
  { alias: 'E52C0A',                   addr: '0xe52c0a1327a12edc7bd54ea6f37ce00a4ca96924', pnl: 6943,   wr: 69, strategy: 'mirror' },
  { alias: 'A77105',                   addr: '0xa77105bb4d2d4d200b0133a2036222353831162d', pnl: 6136,   wr: 78, strategy: 'mirror' },
  { alias: '93511D',                   addr: '0x93511d72d294f1478739bc38f578bf0306fd9e4d', pnl: 3322,   wr: 80, strategy: 'mirror' },
  { alias: 'Elite-FEA31B',             addr: '0xfea31bc088000ff909be1dfd8d0e3f2c7ef2d227', pnl: 2151,   wr: 75, strategy: 'mirror' },
];

async function get(url) {
  try {
    const r = await fetch(url, {
      headers:{'Accept':'application/json'},
      signal: AbortSignal.timeout(12000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

const results = [];

for (const w of WALLETS) {
  const [pos, tr] = await Promise.all([
    get(`${DATA}/positions?user=${w.addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${w.addr}&limit=500&sortBy=timestamp&sortDirection=DESC`),
  ]);
  
  const pArr = Array.isArray(pos) ? pos : [];
  const tArr = Array.isArray(tr)  ? tr  : [];
  
  // Trade frequency
  const now = Date.now()/1000;
  const wk  = tArr.filter(t => t.timestamp && now - t.timestamp < 604800).length;
  const mo  = tArr.filter(t => t.timestamp && now - t.timestamp < 2592000).length;
  
  // Average entry price
  const prices = tArr.map(t => parseFloat(t.price||0)).filter(p => p > 0.01 && p < 0.99);
  const avgEntry = prices.length ? prices.reduce((s,p)=>s+p,0)/prices.length : 0;
  
  // Avg return per WINNING position
  const wins  = pArr.filter(p => parseFloat(p.cashPnl||0) > 0);
  const loses = pArr.filter(p => parseFloat(p.cashPnl||0) < 0);
  const avgWinPnl  = wins.length  ? wins.reduce((s,p)=>s+parseFloat(p.cashPnl),0)  / wins.length  : 0;
  const avgLossPnl = loses.length ? loses.reduce((s,p)=>s+parseFloat(p.cashPnl),0) / loses.length : 0;
  const avgWinSize = wins.length  ? wins.reduce((s,p)=>s+parseFloat(p.initialValue||0),0) / wins.length : 0;
  
  // Return multiple (how much they get back vs invested)
  const avgMultiple = avgWinSize > 0 ? (avgWinSize + avgWinPnl) / avgWinSize : 0;
  
  // Best + worst position
  const topWin  = pArr.length ? Math.max(...pArr.map(p=>parseFloat(p.cashPnl||0))) : 0;
  const topLoss = pArr.length ? Math.min(...pArr.map(p=>parseFloat(p.cashPnl||0))) : 0;
  
  results.push({
    ...w, wk, mo,
    avgEntry: parseFloat(avgEntry.toFixed(3)),
    avgWinPnl: parseFloat(avgWinPnl.toFixed(2)),
    avgLossPnl: parseFloat(avgLossPnl.toFixed(2)),
    avgWinSize: parseFloat(avgWinSize.toFixed(2)),
    avgMultiple: parseFloat(avgMultiple.toFixed(2)),
    topWin: parseFloat(topWin.toFixed(2)),
    topLoss: parseFloat(topLoss.toFixed(2)),
    totalPositions: pArr.length,
  });
  
  await new Promise(r => setTimeout(r, 200));
}

// Output for calculation
console.log('=== RAW DATA ===');
console.log(JSON.stringify(results, null, 2));
