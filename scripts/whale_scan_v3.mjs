/**
 * MEGASCAN v2 — Scan Polygon for $10k+ trades, find insider wallets
 * Uses: eth_getLogs on large block ranges + Polymarket positions API
 */
const DATA = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';
const POLYGON_RPC = process.env.POLYGON_RPC_URL;
const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
const DECIMALS = 1_000_000;

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function rpc(method, params=[]) {
  const r = await fetch(POLYGON_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id:1, jsonrpc:'2.0', method, params }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.result;
}

const toAddr = h => '0x' + h.slice(-40).toLowerCase();

function decodeLog(log) {
  const topics = log.topics || [];
  const raw = (log.data || '').slice(2);
  if (topics.length < 3 || raw.length < 256) return null;
  const maker = toAddr(topics[2]);
  if (maker.slice(2) === '0'.repeat(40)) return null;
  const makerAmtHex = raw.slice(128, 192);
  const takerAmtHex = raw.slice(192, 256);
  const toNum = hex => { try { return Number(BigInt('0x'+hex)) / DECIMALS; } catch { return 0; } };
  const usdcSize = Math.max(toNum(makerAmtHex), toNum(takerAmtHex));
  if (usdcSize < 10000) return null; // $10k+ only
  const tokenIdHex = raw.slice(64, 128);
  let tokenId = '';
  try { tokenId = BigInt('0x'+tokenIdHex).toString(); } catch {}
  return { tx: log.transactionHash, block: parseInt(log.blockNumber,16), maker, usdcSize, tokenId };
}

// Scan last 30 days of blocks for $10k+ trades
async function scanForBigTrades() {
  console.log('🔍 Scanning Polygon for $10k+ trades (last 7 days)...');
  const latest = parseInt(await rpc('eth_blockNumber',[]), 16);
  // ~7 days = 7 * 24 * 60 * 4 = ~40,320 blocks (Polygon ~2s blocks)
  const DAYS = 7;
  const BLOCKS_PER_DAY = 43200;
  const fromBlock = latest - (DAYS * BLOCKS_PER_DAY);
  
  console.log(`Scanning blocks ${fromBlock.toLocaleString()} → ${latest.toLocaleString()} (~${DAYS} days)`);
  
  const bigTrades = [];
  const CHUNK = 3000; // scan in chunks
  
  for (let from = fromBlock; from < latest; from += CHUNK) {
    const to = Math.min(from + CHUNK - 1, latest);
    for (const contract of CONTRACTS) {
      try {
        const logs = await rpc('eth_getLogs', [{
          fromBlock: '0x' + from.toString(16),
          toBlock:   '0x' + to.toString(16),
          address: contract,
          topics: ['0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49'],
        }]);
        if (!Array.isArray(logs)) continue;
        const decoded = logs.map(decodeLog).filter(Boolean);
        bigTrades.push(...decoded);
        if (decoded.length > 0) {
          process.stdout.write(`  Block ${from.toLocaleString()}: ${decoded.length} big trades found (${bigTrades.length} total)\r`);
        }
      } catch(e) { /* skip */ }
    }
    await new Promise(r=>setTimeout(r,100));
  }
  
  console.log(`\n\nTotal $10k+ trades found: ${bigTrades.length}`);
  return bigTrades;
}

async function analyzeInsiders(bigTrades) {
  // Aggregate by wallet
  const wallets = {};
  for (const t of bigTrades) {
    if (!wallets[t.maker]) wallets[t.maker] = { addr: t.maker, trades: [], totalVolume: 0, maxSingle: 0 };
    wallets[t.maker].trades.push(t);
    wallets[t.maker].totalVolume += t.usdcSize;
    wallets[t.maker].maxSingle = Math.max(wallets[t.maker].maxSingle, t.usdcSize);
  }
  
  // Sort by max single trade (insiders bet big once)
  const sorted = Object.values(wallets).sort((a,b) => b.maxSingle - a.maxSingle);
  
  console.log(`\nUnique wallets making $10k+ trades: ${sorted.length}`);
  console.log('\nTop 30 by largest single trade:');
  sorted.slice(0,30).forEach((w,i) => {
    console.log(`  #${String(i+1).padStart(2)} ${w.addr} | max: $${w.maxSingle.toFixed(0).padStart(9)} | vol: $${w.totalVolume.toFixed(0).padStart(10)} | trades: ${w.trades.length}`);
  });
  
  return sorted;
}

async function deepScanInsiders(wallets) {
  console.log(`\n🔍 Deep PnL scan on top ${Math.min(wallets.length,30)} big-trade wallets...`);
  
  const results = [];
  for (const w of wallets.slice(0,30)) {
    const [pos, tr] = await Promise.all([
      get(`${DATA}/positions?user=${w.addr}&limit=500`),
      get(`${DATA}/trades?user=${w.addr}&limit=500&sortBy=timestamp&sortDirection=DESC`),
    ]);
    
    const pArr = Array.isArray(pos) ? pos : [];
    const tArr = Array.isArray(tr) ? tr : [];
    const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
    const wins = pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
    const bigWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>10000);
    const massiveWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
    const now = Date.now()/1000;
    const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;
    
    const tag = pnl > 100000 ? '🚨 WHALE' : pnl > 10000 ? '⭐ BIG' : pnl > 0 ? '🟢' : '🔴';
    console.log(`${tag} $${pnl.toFixed(0).padStart(10)} | ${w.addr} | onchain_vol:$${w.totalVolume.toFixed(0)} | wins:${wins.length}/${pArr.length} | $50k+:${massiveWins.length} | wk:${wk}t`);
    
    if (massiveWins.length > 0) {
      massiveWins.slice(0,3).forEach(p => {
        console.log(`              +$${parseFloat(p.cashPnl).toFixed(0).padStart(8)} | ${String(p.title||'?').slice(0,55)}`);
      });
    }
    
    if (pnl > 0) {
      results.push({
        addr: w.addr, pnl, wins: wins.length, total: pArr.length,
        bigWins: bigWins.length, massiveWins: massiveWins.length,
        onchainVol: w.totalVolume, maxSingleTrade: w.maxSingle,
        wkTrades: wk, wr: pArr.length > 0 ? Math.round(wins.length/pArr.length*100) : 0,
        topWin: Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0))),
      });
    }
    await new Promise(r=>setTimeout(r,200));
  }
  
  results.sort((a,b)=>b.pnl-a.pnl);
  
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('  🚨 FINAL: NEW INSIDER WALLETS DISCOVERED');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  
  results.forEach((r,i) => {
    const tag = r.pnl > 100000 ? '🚨 WHALE' : r.pnl > 10000 ? '⭐ BIG PLAYER' : '🟢 PROFITABLE';
    console.log(`${tag} #${i+1}`);
    console.log(`  Address: ${r.addr}`);
    console.log(`  Total PnL: $${r.pnl.toFixed(0)} | WR: ${r.wr}% (${r.wins}W/${r.total-r.wins}L)`);
    console.log(`  Best single trade: +$${r.topWin.toFixed(0)}`);
    console.log(`  On-chain volume: $${r.onchainVol.toFixed(0)} | Largest bet: $${r.maxSingleTrade.toFixed(0)}`);
    console.log(`  $50k+ wins: ${r.massiveWins} | Active this week: ${r.wkTrades} trades`);
    console.log('');
  });
  
  return results;
}

// RUN
const bigTrades = await scanForBigTrades();
if (bigTrades.length > 0) {
  const walletList = await analyzeInsiders(bigTrades);
  await deepScanInsiders(walletList);
} else {
  console.log('No $10k+ trades found in scan window. Try extending range.');
}
