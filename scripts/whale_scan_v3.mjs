const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TENDERLY = 'https://polygon.gateway.tenderly.co';
const ALCHEMY  = process.env.POLYGON_RPC_URL;
const DATA  = 'https://data-api.polymarket.com';
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const CONTRACTS = [
  '0xe111180000d2663c0091e4f400237545b87b996b',
  '0xe2222d279d744050d28e00520010520000310f59',
];
// CORRECTED topic hash from contract verification
const TOPIC   = '0xd543adfd945773f1a62f74f0ee55a5e3b9b1a28262980ba90b1a89f2ea84d8ee';
const DECIMALS = 1_000_000;
const MIN_SIZE = 5_000; // $5k+ to catch more insiders

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

// Decode log with correct topic structure
function decodeLog(log) {
  const raw = (log.data||'').slice(2);
  const topics = log.topics||[];
  if (topics.length < 3) return null;

  // maker is in topics[2]
  const maker = '0x' + topics[2].slice(-40).toLowerCase();
  if (/^0x0+$/.test(maker)) return null;

  // Try to decode USDC size from data
  // OrderFilled event: (bytes32 orderHash, address maker, address taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)
  let usdcSize = 0;
  if (raw.length >= 192) {
    const toNum = h => { try { return Number(BigInt('0x'+h))/DECIMALS; } catch {return 0;} };
    const v1 = toNum(raw.slice(128, 192));
    const v2 = raw.length >= 256 ? toNum(raw.slice(192, 256)) : 0;
    usdcSize = Math.max(v1, v2);
  }

  if (usdcSize < MIN_SIZE) return null;

  let tokenId = '';
  try { tokenId = BigInt('0x' + (raw.slice(0,64)||'0')).toString(); } catch{}

  return { maker, usdcSize, tokenId, block: parseInt(log.blockNumber||'0',16) };
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('  🚨 INSIDER MEGASCAN v2 — Correct Topic Hash');
console.log(`  ${new Date().toISOString()}`);
console.log(`  Min size: $${MIN_SIZE.toLocaleString()} | Topic: ${TOPIC.slice(0,18)}...`);
console.log('╚══════════════════════════════════════════════════════════╝\n');

const latest = parseInt(await rpc(ALCHEMY,'eth_blockNumber'), 16);
console.log('Latest block:', latest.toLocaleString());

// Verify topic works first with Alchemy 10-block test
const FROM_VERIFY = 87905371;
const testRes = await rpc(ALCHEMY,'eth_getLogs', [{
  fromBlock: '0x'+FROM_VERIFY.toString(16),
  toBlock:   '0x'+(FROM_VERIFY+9).toString(16),
  address: CONTRACTS[0], topics: [TOPIC],
}]);
console.log(`Topic verification (10 blocks): ${Array.isArray(testRes)?testRes.length:testRes} logs`);
if (!Array.isArray(testRes) || testRes.length === 0) {
  // Try without topic to see raw contract events
  const rawTest = await rpc(ALCHEMY,'eth_getLogs', [{
    fromBlock: '0x'+FROM_VERIFY.toString(16),
    toBlock:   '0x'+(FROM_VERIFY+9).toString(16),
    address: CONTRACTS[0],
  }]);
  console.log(`Raw logs (no topic): ${Array.isArray(rawTest)?rawTest.length:0}`);
  if (Array.isArray(rawTest) && rawTest.length > 0) {
    const uniqueTopics = [...new Set(rawTest.map(l=>l.topics[0]))];
    console.log('Actual topics:', uniqueTopics.slice(0,5).join('\n  '));
  }
}

// 30-day scan with correct topic
const DAYS = 30;
const fromBlock = latest - (DAYS * 43200);
const CHUNK = 490000;
const totalChunks = Math.ceil((latest-fromBlock)/CHUNK) * CONTRACTS.length;

console.log(`\nScanning ${DAYS} days in ${Math.ceil((latest-fromBlock)/CHUNK)} chunks × 2 contracts\n`);

const allTrades = [];
let c = 0;
for (let from = fromBlock; from < latest; from += CHUNK) {
  const to = Math.min(from + CHUNK - 1, latest);
  for (const contract of CONTRACTS) {
    c++;
    process.stdout.write(`  [${c}/${totalChunks}] ${contract.slice(0,12)} ${from.toLocaleString()}-${to.toLocaleString()} | found: ${allTrades.length}\r`);
    try {
      const logs = await rpc(TENDERLY,'eth_getLogs',[{
        fromBlock:'0x'+from.toString(16), toBlock:'0x'+to.toString(16),
        address:contract, topics:[TOPIC],
      }]);
      if (Array.isArray(logs)) {
        const decoded = logs.map(decodeLog).filter(Boolean);
        if (decoded.length > 0) {
          process.stdout.write(`\n  ✅ [${c}/${totalChunks}] ${decoded.length} trades over $${MIN_SIZE.toLocaleString()}\n`);
          allTrades.push(...decoded);
        }
      }
    } catch(e) { process.stdout.write(`\n  ⚠️ ${e.message.slice(0,50)}\n`); }
    await new Promise(r=>setTimeout(r,800));
  }
}

console.log(`\n\n✅ SCAN: ${allTrades.length} trades over $${MIN_SIZE.toLocaleString()}`);

if (allTrades.length === 0) {
  console.log('\n⚠️ Still 0 results. The event data encoding may differ from assumed.');
  console.log('Check raw log data from the verification step above.');
  process.exit(0);
}

// Aggregate + rank
const wallets = {};
for (const t of allTrades) {
  if (!wallets[t.maker]) wallets[t.maker]={addr:t.maker,count:0,maxSingle:0,totalVol:0,days:new Set()};
  wallets[t.maker].count++;
  wallets[t.maker].totalVol += t.usdcSize;
  wallets[t.maker].maxSingle = Math.max(wallets[t.maker].maxSingle, t.usdcSize);
  wallets[t.maker].days.add(Math.floor(t.block/43200));
}
const sorted = Object.values(wallets).map(w=>({...w,days:w.days.size})).sort((a,b)=>b.maxSingle-a.maxSingle);
console.log(`\nUnique wallets: ${sorted.length}`);
console.log('\nTop 30:');
sorted.slice(0,30).forEach((w,i)=>{
  const tag=w.maxSingle>=100000?'🚨🚨':w.maxSingle>=50000?'🚨':w.maxSingle>=10000?'⭐':'  ';
  console.log(`${tag} #${String(i+1).padStart(2)} ${w.addr} | max:$${w.maxSingle.toFixed(0).padStart(9)} | vol:$${w.totalVol.toFixed(0).padStart(11)} | ${w.count}t/${w.days}d`);
});

// Deep scan top 50 new wallets
const KNOWN = new Set(['0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73','0xb2a3623364c33561d8312e1edb79eb941c798510','0xed107a85a4585a381e48c7f7ca4144909e7dd2e5','0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c','0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786','0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6']);
const toScan = sorted.filter(w=>!KNOWN.has(w.addr)).slice(0,50);
console.log(`\n🔍 Deep scanning ${toScan.length} new wallets...\n`);

const results=[];
for (const w of toScan) {
  const [pos,tr]=await Promise.all([
    get(`${DATA}/positions?user=${w.addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${w.addr}&limit=200&sortBy=timestamp&sortDirection=DESC`),
  ]);
  const pArr=Array.isArray(pos)?pos:[], tArr=Array.isArray(tr)?tr:[];
  const pnl=pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
  const wins=pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
  const massiveWins=pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
  const wr=pArr.length>0?Math.round(wins.length/pArr.length*100):0;
  const topWin=Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0)));
  const titles=tArr.slice(0,30).map(t=>String(t.title||'').toLowerCase()).join(' ');
  const cat=/iran|nuclear|war|sanction|peace/.test(titles)?'GEO':/president|trump|election/.test(titles)?'POL':'MIXED';
  const tag=massiveWins.length>0?'🚨 WHALE':pnl>10000?'⭐ BIG':pnl>0?'🟢':'🔴';
  console.log(`${tag} ${w.addr.slice(0,16)} | onchain:$${w.maxSingle.toFixed(0)} ${w.count}t | pnl:$${pnl.toFixed(0)} WR:${wr}% cat:${cat}`);
  if (massiveWins.length>0) massiveWins.slice(0,3).forEach(p=>console.log(`   +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,60)}`));
  if (pnl>0||w.maxSingle>=50000) results.push({addr:w.addr,pnl,wr,wins:wins.length,total:pArr.length,massiveWins:massiveWins.length,topWin,maxOnChain:w.maxSingle,totalVol:w.totalVol,days:w.days,cat});
  await new Promise(r=>setTimeout(r,200));
}

results.sort((a,b)=>b.pnl-a.pnl);
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('  🚨 NEW INSIDER WALLETS DISCOVERED');
console.log('╚══════════════════════════════════════════════════════════╝\n');
results.forEach((r,i)=>{
  const tag=r.maxOnChain>=100000?'🚨🚨 MEGA':r.massiveWins>0?'🚨 INSIDER':r.pnl>10000?'⭐ BIG':'🟢';
  console.log(`${tag} #${i+1} ${r.addr}\n  PnL:$${r.pnl.toFixed(0)} WR:${r.wr}% Best:+$${r.topWin.toFixed(0)} OnChain:$${r.maxOnChain.toFixed(0)}/${r.days}d Cat:${r.cat}\n`);
});

let saved=0;
for (const r of results.filter(r=>r.pnl>2000||r.maxOnChain>=100000)) {
  const elite=r.pnl>5000||r.massiveWins>0||r.maxOnChain>=100000;
  const strategy=r.cat==='GEO'?'insider_geo':r.cat==='POL'?'no_machine':'mirror';
  if (await dbUpsert({address:r.addr,alias:`MEGA-${r.addr.slice(2,8).toUpperCase()}`,win_rate_30d:r.wr,roi_30d:0,total_profit:Math.max(r.pnl,0),trades_tracked:r.total,total_trades_seen:r.days,is_active:true,is_elite:elite,strategy})) saved++;
}
console.log(`Saved ${saved} new wallets to DB`);
