/**
 * Deep Research: Top 5 profitable wallets
 * - Full trade history breakdown
 * - Monthly PnL trend (are they CURRENTLY winning?)
 * - Best markets / categories they trade
 * - Avg position size, hold time
 * - Win/loss streaks
 */
const DATA = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';

const TOP5 = [
  { alias: 'BAA2BC', addr: '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73', pnl: 189819 },
  { alias: 'B2A362', addr: '0xb2a3623364c33561d8312e1edb79eb941c798510', pnl: 120021 },
  { alias: 'ED107A', addr: '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5', pnl: 58958  },
  { alias: 'A7A8C1', addr: '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c', pnl: 47413  },
  { alias: 'F49CE4', addr: '0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786', pnl: 44654  },
];

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

function monthKey(ts) {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

async function deepAnalyze(w) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🏆 ${w.alias} | Known PnL: $${w.pnl.toLocaleString()}`);
  console.log(`  ${w.addr}`);
  console.log('═'.repeat(60));

  // Pull max trades
  const [trades, positions] = await Promise.all([
    get(`${DATA}/trades?user=${w.addr}&limit=500&sortBy=timestamp&sortDirection=ASC`),
    get(`${DATA}/positions?user=${w.addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
  ]);

  const tArr = Array.isArray(trades) ? trades : [];
  const pArr = Array.isArray(positions) ? positions : [];

  console.log(`\nTrades: ${tArr.length} | Positions: ${pArr.length}`);

  // --- DATE RANGE ---
  if (tArr.length > 0) {
    const ts = tArr.map(t => t.timestamp).filter(Boolean);
    const oldest = new Date(Math.min(...ts)*1000).toISOString().slice(0,10);
    const newest = new Date(Math.max(...ts)*1000).toISOString().slice(0,10);
    console.log(`Active since: ${oldest} → ${newest}`);
  }

  // --- POSITION ANALYSIS ---
  if (pArr.length > 0) {
    const withPnl = pArr.filter(p => p.cashPnl != null);
    const wins = withPnl.filter(p => parseFloat(p.cashPnl) > 0);
    const losses = withPnl.filter(p => parseFloat(p.cashPnl) < 0);
    const totalPnl = withPnl.reduce((s,p) => s + parseFloat(p.cashPnl), 0);

    console.log(`\nClosed positions: ${withPnl.length}`);
    console.log(`Win/Loss: ${wins.length}W / ${losses.length}L = ${Math.round(wins.length/withPnl.length*100)}% WR`);

    if (wins.length > 0) {
      const avgWin = wins.reduce((s,p)=>s+parseFloat(p.cashPnl),0)/wins.length;
      const maxWin = Math.max(...wins.map(p=>parseFloat(p.cashPnl)));
      console.log(`Avg win: +$${avgWin.toFixed(0)} | Best single trade: +$${maxWin.toFixed(0)}`);
    }
    if (losses.length > 0) {
      const avgLoss = losses.reduce((s,p)=>s+parseFloat(p.cashPnl),0)/losses.length;
      const maxLoss = Math.min(...losses.map(p=>parseFloat(p.cashPnl)));
      console.log(`Avg loss: -$${Math.abs(avgLoss).toFixed(0)} | Worst trade: -$${Math.abs(maxLoss).toFixed(0)}`);
    }

    // Position size distribution
    const sizes = pArr.map(p => parseFloat(p.initialValue || p.size || p.usdcSize || 0)).filter(x=>x>0);
    if (sizes.length > 0) {
      const avg = sizes.reduce((s,x)=>s+x,0)/sizes.length;
      console.log(`Avg position size: $${avg.toFixed(0)} | Max: $${Math.max(...sizes).toFixed(0)} | Min: $${Math.min(...sizes).toFixed(0)}`);
    }

    // Top winning markets
    console.log(`\nTop 5 winning positions:`);
    wins.slice(0,5).forEach(p => {
      const title = p.title || p.market || p.conditionId?.slice(0,20) || '?';
      console.log(`  +$${parseFloat(p.cashPnl).toFixed(0).padStart(8)} | ${String(title).slice(0,60)}`);
    });

    // ALL position fields
    if (pArr[0]) {
      console.log(`\nPosition fields: ${Object.keys(pArr[0]).join(', ')}`);
      console.log(`Sample: ${JSON.stringify(pArr[0]).slice(0,400)}`);
    }
  }

  // --- MONTHLY TREND (from trades timestamps + positions) ---
  if (tArr.length > 0) {
    const byMonth = {};
    for (const t of tArr) {
      if (!t.timestamp) continue;
      const mk = monthKey(t.timestamp);
      if (!byMonth[mk]) byMonth[mk] = { count: 0, vol: 0 };
      byMonth[mk].count++;
      byMonth[mk].vol += parseFloat(t.usdcSize || 0);
    }
    console.log(`\nMonthly trade activity:`);
    Object.entries(byMonth).sort().slice(-8).forEach(([m, d]) =>
      console.log(`  ${m}: ${d.count} trades | $${d.vol.toFixed(0)} volume`)
    );
  }

  await new Promise(r => setTimeout(r, 500));
}

for (const w of TOP5) {
  await deepAnalyze(w);
}

console.log('\n\n══════════════════════════════════════');
console.log('  MARKET CATEGORY ANALYSIS');
console.log('══════════════════════════════════════');
// Check what categories the top wallet trades
const topPos = await get(`${DATA}/positions?user=${TOP5[0].addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`);
if (Array.isArray(topPos) && topPos.length > 0) {
  const cats = {};
  for (const p of topPos) {
    const title = String(p.title || p.market || '');
    // Extract category keywords
    const kws = ['election','bitcoin','crypto','nba','nfl','sports','price','fed','trump','ai','tech'];
    for (const kw of kws) {
      if (title.toLowerCase().includes(kw)) {
        cats[kw] = (cats[kw]||0) + 1;
        break;
      }
    }
  }
  console.log('Top wallet market categories:', JSON.stringify(cats));
}
