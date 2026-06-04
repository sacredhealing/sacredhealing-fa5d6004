/**
 * INSIDER MEGASCAN — Using Tenderly free (unlimited block range)
 * Scans 30 days of Polygon history for $10k+ trades
 * Finds government/insider wallets connected to major events
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TENDERLY = 'https://polygon.gateway.tenderly.co';
const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
const TOPIC   = '0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49';
const DECIMALS = 1_000_000;

// Thresholds for "insider" classification
const BIG_TRADE    = 10_000;   // $10k single trade
const MASSIVE_TRADE = 50_000;  // $50k single trade  
const INSIDER_TRADE = 100_000; // $100k+ = likely insider/institution

async function rpc(method, params=[]) {
  const r = await fetch(TENDERLY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
    signal: AbortSignal.timeout(30000),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  return d.result;
}

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

function decodeLog(log) {
  const topics = log.topics||[];
  const raw = (log.data||'').slice(2);
  if (topics.length < 3 || raw.length < 256) return null;
  const maker = '0x' + topics[2].slice(-40).toLowerCase();
  if (maker.slice(2) === '0'.repeat(40)) return null;
  const toNum = hex => { try { return Number(BigInt('0x'+hex))/DECIMALS; } catch {return 0;} };
  const usdcSize = Math.max(toNum(raw.slice(128,192)), toNum(raw.slice(192,256)));
  if (usdcSize < BIG_TRADE) return null;
  let tokenId='';
  try { tokenId=BigInt('0x'+raw.slice(64,128)).toString(); } catch{}
  return { tx:log.transactionHash, block:parseInt(log.blockNumber,16), maker, usdcSize, tokenId };
}

// SCAN POLYGON — 30 days, chunked in 50k block segments
async function scanAllBigTrades(latest) {
  const DAYS = 30;
  const BLOCKS_PER_DAY = 43200; // ~2s blocks on Polygon
  const TOTAL_BLOCKS = DAYS * BLOCKS_PER_DAY; // ~1.3M blocks
  const CHUNK = 50000; // Tenderly handles large ranges
  const fromBlock = latest - TOTAL_BLOCKS;

  console.log(`\n📡 Scanning ${TOTAL_BLOCKS.toLocaleString()} blocks (${DAYS} days)`);
  console.log(`   From: ${fromBlock.toLocaleString()} → ${latest.toLocaleString()}`);
  console.log(`   Looking for: $${BIG_TRADE.toLocaleString()}+ single trades\n`);

  const bigTrades = [];
  let chunksScanned = 0;
  const totalChunks = Math.ceil(TOTAL_BLOCKS / CHUNK);

  for (let from = fromBlock; from < latest; from += CHUNK) {
    const to = Math.min(from + CHUNK - 1, latest);
    chunksScanned++;
    process.stdout.write(`  Chunk ${chunksScanned}/${totalChunks} | blocks ${from.toLocaleString()}-${to.toLocaleString()} | found: ${bigTrades.length}\r`);

    for (const contract of CONTRACTS) {
      try {
        const logs = await rpc('eth_getLogs', [{
          fromBlock: '0x' + from.toString(16),
          toBlock:   '0x' + to.toString(16),
          address: contract,
          topics: [TOPIC],
        }]);
        if (!Array.isArray(logs)) continue;
        const decoded = logs.map(decodeLog).filter(Boolean);
        bigTrades.push(...decoded);
      } catch(e) {
        process.stdout.write(`\n  ⚠️ Chunk error: ${e.message.slice(0,50)}\n`);
      }
    }
    await new Promise(r=>setTimeout(r,200));
  }

  console.log(`\n\n✅ Scan complete: ${bigTrades.length} trades over $${BIG_TRADE.toLocaleString()}`);
  return bigTrades;
}

// Aggregate by wallet
function aggregateWallets(trades) {
  const w = {};
  for (const t of trades) {
    if (!w[t.maker]) w[t.maker] = {addr:t.maker, trades:[], maxSingle:0, totalVol:0, days:new Set()};
    w[t.maker].trades.push(t);
    w[t.maker].totalVol += t.usdcSize;
    w[t.maker].maxSingle = Math.max(w[t.maker].maxSingle, t.usdcSize);
    // Track which days they traded (block/43200 = approximate day)
    w[t.maker].days.add(Math.floor(t.block / 43200));
  }
  return Object.values(w)
    .map(w => ({...w, days: w.days.size, tradeCount: w.trades.length}))
    .sort((a,b) => b.maxSingle - a.maxSingle);
}

// Deep scan promising wallets against data-api
async function deepScanInsiders(wallets) {
  console.log(`\n🔍 Deep scanning ${wallets.length} wallets for insider patterns...\n`);
  const results = [];

  for (const w of wallets) {
    const [pos, tr] = await Promise.all([
      get(`${DATA}/positions?user=${w.addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
      get(`${DATA}/trades?user=${w.addr}&limit=500&sortBy=timestamp&sortDirection=DESC`),
    ]);
    const pArr = Array.isArray(pos)?pos:[];
    const tArr = Array.isArray(tr)?tr:[];

    const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
    const wins = pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
    const massiveWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
    const wr = pArr.length>0 ? Math.round(wins.length/pArr.length*100) : 0;
    const topWin = Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0)));
    const topPos = Math.max(0,...pArr.map(p=>parseFloat(p.initialValue||0)));
    const now = Date.now()/1000;
    const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;

    // INSIDER PATTERNS:
    // 1. Large positions ($100k+) entered BEFORE news
    // 2. Consistent wins across political/geo markets
    // 3. Multiple massive single trades
    // 4. Active across many days (not one lucky bet)
    
    const isInsider = (
      w.maxSingle >= INSIDER_TRADE ||        // single $100k+ bet
      (pnl > 50000 && wr >= 60) ||           // $50k+ profit, 60%+ WR
      massiveWins.length >= 2 ||             // multiple $50k+ wins
      (w.totalVol > 500000 && pnl > 0) ||   // $500k+ volume, profitable
      (w.days >= 10 && w.maxSingle >= MASSIVE_TRADE) // consistent + large
    );

    // Detect market categories (geopolitical, political, etc.)
    const categories = {};
    const geo_keywords = ['iran','nuclear','war','invasion','regime','military','sanction','peace deal'];
    const pol_keywords = ['president','election','trump','biden','congress','senate','impeach'];
    const crypto_keywords = ['bitcoin','ethereum','btc','eth','price','token'];
    
    for (const t of tArr.slice(0,50)) {
      const title = String(t.title||'').toLowerCase();
      if (geo_keywords.some(k=>title.includes(k))) categories.geo = (categories.geo||0)+1;
      if (pol_keywords.some(k=>title.includes(k))) categories.political = (categories.political||0)+1;
      if (crypto_keywords.some(k=>title.includes(k))) categories.crypto = (categories.crypto||0)+1;
    }

    const topCat = Object.entries(categories).sort((a,b)=>b[1]-a[1])[0];
    const catLabel = topCat ? `${topCat[0]}(${topCat[1]}t)` : 'mixed';

    const tag = w.maxSingle >= INSIDER_TRADE ? '🚨🚨 MEGA' :
                isInsider ? '🚨 INSIDER' :
                pnl > 10000 ? '⭐ BIG' : pnl > 0 ? '🟢' : '🔴';

    console.log(`${tag} ${w.addr.slice(0,16)} | on-chain: $${w.maxSingle.toFixed(0)} max / ${w.tradeCount}t / ${w.days}d | pnl:$${pnl.toFixed(0)} WR:${wr}% | cat:${catLabel}`);

    if (massiveWins.length > 0) {
      massiveWins.slice(0,3).forEach(p => {
        const ts = p.endDate ? new Date(p.endDate).toISOString().slice(0,10) : '?';
        console.log(`   +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,60)}`);
      });
    }

    results.push({
      addr: w.addr, pnl, wins:wins.length, total:pArr.length, wr,
      massiveWins:massiveWins.length, wk, topWin, topPos,
      maxOnChain: w.maxSingle, totalOnChainVol: w.totalVol,
      onChainTrades: w.tradeCount, activeDays: w.days,
      isInsider, catLabel,
    });
    await new Promise(r=>setTimeout(r,200));
  }
  return results.sort((a,b)=>b.pnl-a.pnl);
}

// MAIN
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('  🚨 INSIDER MEGASCAN — Tenderly Free / 30-Day History');
console.log(`  ${new Date().toISOString()}`);
console.log('╚══════════════════════════════════════════════════════════╝');

// Get latest block via Tenderly
const latestHex = await rpc('eth_blockNumber');
const latest = parseInt(latestHex, 16);
console.log(`\nTenderly confirmed. Latest block: ${latest.toLocaleString()}`);

// Scan 30 days
const bigTrades = await scanAllBigTrades(latest);

// Aggregate
const wallets = aggregateWallets(bigTrades);
console.log(`\nUnique wallets with $10k+ trades: ${wallets.length}`);

// Show top 20 by single trade size
console.log('\n📊 Top 20 by largest single trade:');
wallets.slice(0,20).forEach((w,i) => {
  const tag = w.maxSingle>=INSIDER_TRADE?'🚨':w.maxSingle>=MASSIVE_TRADE?'⭐':'  ';
  console.log(`  ${tag} #${String(i+1).padStart(2)} ${w.addr} | max:$${w.maxSingle.toFixed(0).padStart(9)} | vol:$${w.totalVol.toFixed(0).padStart(11)} | trades:${w.tradeCount} | days:${w.days}`);
});

// Deep scan top 50 wallets
const knownAddrs = new Set([
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73',
  '0xb2a3623364c33561d8312e1edb79eb941c798510',
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5',
  '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c',
  '0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786',
  '0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6',
]);

const toScan = wallets.filter(w => !knownAddrs.has(w.addr)).slice(0, 50);
console.log(`\nScanning ${toScan.length} NEW wallets (excluding known 15)...`);

const results = await deepScanInsiders(toScan);
const newInsiders = results.filter(r => r.isInsider);
const newProfitable = results.filter(r => r.pnl > 0);

console.log('\n\n╔══════════════════════════════════════════════════════════╗');
console.log('  🚨 NEW INSIDER WALLETS DISCOVERED');
console.log('╚══════════════════════════════════════════════════════════╝\n');

newInsiders.forEach((r,i) => {
  const tag = r.maxOnChain>=INSIDER_TRADE?'🚨🚨 MEGA INSIDER':r.massiveWins>0?'🚨 INSIDER':'⭐ BIG PLAYER';
  console.log(`${tag} #${i+1}`);
  console.log(`  ${r.addr}`);
  console.log(`  PnL: $${r.pnl.toFixed(0)} | WR: ${r.wr}% | Biggest single bet: $${r.maxOnChain.toFixed(0)}`);
  console.log(`  On-chain volume: $${r.totalOnChainVol.toFixed(0)} | ${r.onChainTrades} trades over ${r.activeDays} days`);
  console.log(`  Best position: +$${r.topWin.toFixed(0)} | Category: ${r.catLabel}`);
  console.log('');
});

// Save new discoveries to Supabase
for (const r of newInsiders) {
  const strategy = r.catLabel.includes('geo') ? 'insider_geo' : 
                   r.catLabel.includes('political') ? 'no_machine' : 'mirror';
  await dbUpsert({
    address: r.addr,
    alias: `NEW-${r.addr.slice(2,8).toUpperCase()}`,
    win_rate_30d: r.wr, roi_30d: 0,
    total_profit: r.pnl, trades_tracked: r.onChainTrades,
    total_trades_seen: r.onChainTrades,
    is_active: true, is_elite: true, strategy,
  });
  console.log(`✅ Saved ${r.addr.slice(0,14)} to DB`);
}

console.log(`\n━━━ MEGASCAN COMPLETE ━━━`);
console.log(`Total $10k+ wallets: ${wallets.length}`);
console.log(`New insiders found: ${newInsiders.length}`);
console.log(`New profitable: ${newProfitable.length}`);
console.log(`Saved to DB: ${newInsiders.length}`);
