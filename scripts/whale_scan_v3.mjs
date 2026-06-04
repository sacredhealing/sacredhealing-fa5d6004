/**
 * INSIDER MEGASCAN FINAL
 * Tenderly: 500k blocks per call, free, unlimited
 * Scans 30 days = ~1.3M blocks in 3 calls
 * Finds $10k+ traders, identifies gov/insider patterns
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TENDERLY = 'https://polygon.gateway.tenderly.co';
const ALCHEMY  = process.env.POLYGON_RPC_URL; // for latest block only
const DATA  = 'https://data-api.polymarket.com';
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
const TOPIC   = '0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49';
const DECIMALS = 1_000_000;
const MIN_SIZE = 10_000; // $10k+

async function rpc(url, method, params=[], timeout=25000) {
  const r = await fetch(url, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
    signal: AbortSignal.timeout(timeout),
  });
  const d = await r.json();
  if (d.error) throw new Error(JSON.stringify(d.error));
  return d.result;
}

async function get(url) {
  try {
    const r = await fetch(url, {
      headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'},
      signal: AbortSignal.timeout(12000),
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
  const raw = (log.data||'').slice(2);
  const topics = log.topics||[];
  if (topics.length < 3 || raw.length < 256) return null;
  const maker = '0x' + topics[2].slice(-40).toLowerCase();
  if (/^0x0+$/.test(maker)) return null;
  const toNum = h => { try { return Number(BigInt('0x'+h))/DECIMALS; } catch {return 0;} };
  const usdcSize = Math.max(toNum(raw.slice(128,192)), toNum(raw.slice(192,256)));
  if (usdcSize < MIN_SIZE) return null;
  let tokenId=''; try { tokenId=BigInt('0x'+raw.slice(64,128)).toString(); } catch{}
  return { maker, usdcSize, tokenId, block: parseInt(log.blockNumber,16) };
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('  🚨 INSIDER MEGASCAN — Tenderly 30-Day History');
console.log(`  ${new Date().toISOString()}`);
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Get latest block
const latest = parseInt(await rpc(ALCHEMY,'eth_blockNumber'), 16);
console.log('Latest block:', latest.toLocaleString());

// 30 days = ~1.3M blocks. Scan in 500k chunks = 3 calls per contract = 6 total
const DAYS = 30;
const fromBlock = latest - (DAYS * 43200);
const CHUNK = 490000; // safe under 500k limit

console.log(`Scanning: block ${fromBlock.toLocaleString()} → ${latest.toLocaleString()} (${DAYS} days)`);
console.log(`Chunks: ${Math.ceil((latest-fromBlock)/CHUNK)} × 2 contracts\n`);

const allTrades = [];
let chunkNum = 0;

for (let from = fromBlock; from < latest; from += CHUNK) {
  const to = Math.min(from + CHUNK - 1, latest);
  chunkNum++;

  for (const contract of CONTRACTS) {
    try {
      console.log(`  Chunk ${chunkNum} | ${contract.slice(0,12)} | blocks ${from.toLocaleString()}-${to.toLocaleString()}`);
      const logs = await rpc(TENDERLY, 'eth_getLogs', [{
        fromBlock: '0x'+from.toString(16),
        toBlock:   '0x'+to.toString(16),
        address: contract,
        topics: [TOPIC],
      }], 25000);

      if (!Array.isArray(logs)) { console.log('    ⚠️ not array'); continue; }
      const decoded = logs.map(decodeLog).filter(Boolean);
      allTrades.push(...decoded);
      console.log(`    → ${logs.length} total logs | ${decoded.length} over $${MIN_SIZE.toLocaleString()}`);
    } catch(e) {
      console.log(`    ❌ ${e.message.slice(0,60)}`);
    }
    await new Promise(r=>setTimeout(r,1000));
  }
}

console.log(`\n✅ SCAN COMPLETE: ${allTrades.length} trades over $${MIN_SIZE.toLocaleString()}\n`);

// Aggregate by wallet
const wallets = {};
for (const t of allTrades) {
  if (!wallets[t.maker]) wallets[t.maker] = { addr:t.maker, count:0, maxSingle:0, totalVol:0, days:new Set() };
  wallets[t.maker].count++;
  wallets[t.maker].totalVol += t.usdcSize;
  wallets[t.maker].maxSingle = Math.max(wallets[t.maker].maxSingle, t.usdcSize);
  wallets[t.maker].days.add(Math.floor(t.block/43200));
}

const sorted = Object.values(wallets)
  .map(w => ({...w, days: w.days.size}))
  .sort((a,b) => b.maxSingle - a.maxSingle);

console.log(`Unique wallets with $10k+ trades: ${sorted.length}`);
console.log('\nTop 30 by largest single trade:');
sorted.slice(0,30).forEach((w,i) => {
  const tag = w.maxSingle>=100000?'🚨':w.maxSingle>=50000?'⭐':'  ';
  console.log(`  ${tag} #${String(i+1).padStart(2)} ${w.addr} | max:$${w.maxSingle.toFixed(0).padStart(9)} | total:$${w.totalVol.toFixed(0).padStart(11)} | ${w.count}t/${w.days}d`);
});

// Known wallets to skip
const KNOWN = new Set([
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73',
  '0xb2a3623364c33561d8312e1edb79eb941c798510',
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5',
  '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c',
  '0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786',
  '0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6',
  '0xd3b034d7bfb2473fb252d0414646d9786bac329e',
]);

const newWallets = sorted.filter(w => !KNOWN.has(w.addr)).slice(0, 60);
console.log(`\nNew wallets to deep scan: ${newWallets.length}\n`);

// Deep scan each
console.log('🔍 Deep scanning for PnL + insider patterns...\n');
const results = [];

for (const w of newWallets) {
  const [pos, tr] = await Promise.all([
    get(`${DATA}/positions?user=${w.addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${w.addr}&limit=200&sortBy=timestamp&sortDirection=DESC`),
  ]);
  const pArr = Array.isArray(pos)?pos:[];
  const tArr = Array.isArray(tr)?tr:[];

  const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
  const wins = pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
  const bigWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>10000);
  const massiveWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
  const wr = pArr.length>0 ? Math.round(wins.length/pArr.length*100) : 0;
  const topWin = Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0)));
  const now = Date.now()/1000;
  const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;

  // Detect geopolitical/political category
  const titles = tArr.slice(0,30).map(t=>String(t.title||'').toLowerCase()).join(' ');
  const isGeo = /iran|nuclear|war|invasion|regime|military|sanction|peace|diplomat/.test(titles);
  const isPol = /president|trump|election|congress|impeach|resign/.test(titles);
  const isCrypto = /bitcoin|btc|ethereum|eth|price|pump/.test(titles);
  const category = isGeo?'GEO-INSIDER':isPol?'POLITICAL':isCrypto?'CRYPTO':'MIXED';

  const tag = massiveWins.length>0?'🚨 WHALE':bigWins.length>0?'⭐ BIG':pnl>0?'🟢':'🔴';
  process.stdout.write(`${tag} ${w.addr.slice(0,14)} onchain:$${w.maxSingle.toFixed(0)} | pnl:$${pnl.toFixed(0)} WR:${wr}% ${massiveWins.length>0?`| $50k+wins:${massiveWins.length}`:''}\n`);

  if (massiveWins.length > 0) {
    massiveWins.slice(0,3).forEach(p =>
      console.log(`   +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,60)}`)
    );
  }

  if (pnl > 0 || w.maxSingle >= 50000) {
    results.push({ addr:w.addr, pnl, wr, wins:wins.length, total:pArr.length,
      bigWins:bigWins.length, massiveWins:massiveWins.length, wk,
      topWin, maxOnChain:w.maxSingle, totalOnChainVol:w.totalVol,
      onChainDays:w.days, category });
  }
  await new Promise(r=>setTimeout(r,250));
}

results.sort((a,b) => b.pnl - a.pnl);
const profitable = results.filter(r => r.pnl > 1000);
const insiders = results.filter(r => r.massiveWins > 0 || r.maxOnChain >= 100000);

console.log('\n\n╔══════════════════════════════════════════════════════════╗');
console.log('  🚨 NEW INSIDER & WHALE WALLETS DISCOVERED');
console.log('╚══════════════════════════════════════════════════════════╝\n');

results.forEach((r,i) => {
  const tag = r.maxOnChain>=100000?'🚨🚨 MEGA':r.massiveWins>0?'🚨 INSIDER':r.bigWins>0?'⭐ BIG':'🟢';
  console.log(`${tag} #${i+1} ${r.addr}`);
  console.log(`  PnL:$${r.pnl.toFixed(0)} | WR:${r.wr}% | Best:+$${r.topWin.toFixed(0)} | OnChain max:$${r.maxOnChain.toFixed(0)} | Days:${r.onChainDays} | Cat:${r.category}`);
  if (r.massiveWins > 0) console.log(`  🚨 ${r.massiveWins} positions with $50k+ profit`);
  console.log('');
});

// Save to Supabase
let saved = 0;
for (const r of results) {
  if (r.pnl < 500 && r.maxOnChain < 50000) continue;
  const strategy = r.category==='GEO-INSIDER'?'insider_geo':r.category==='POLITICAL'?'no_machine':'mirror';
  const elite = r.pnl > 5000 || r.massiveWins > 0 || r.maxOnChain >= 100000;
  const ok = await dbUpsert({
    address: r.addr,
    alias: `${elite?'NEW-ELITE':'NEW'}-${r.addr.slice(2,8).toUpperCase()}`,
    win_rate_30d: r.wr, roi_30d: 0,
    total_profit: Math.max(r.pnl, 0),
    trades_tracked: r.total, total_trades_seen: r.onChainDays,
    is_active: true, is_elite: elite, strategy,
  });
  if (ok) saved++;
}

console.log(`━━━ MEGASCAN DONE ━━━`);
console.log(`$10k+ wallets found: ${sorted.length}`);
console.log(`New profitable: ${profitable.length}`);
console.log(`New insiders: ${insiders.length}`);
console.log(`Saved to DB: ${saved}`);
