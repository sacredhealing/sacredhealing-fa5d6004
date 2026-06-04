const TENDERLY = 'https://polygon.gateway.tenderly.co';
const ALCHEMY  = process.env.POLYGON_RPC_URL;
const CONTRACT = '0xe111180000d2663c0091e4f400237545b87b996b';
const TOPIC    = '0xd543adfd945773f1a62f74f0ee55a5e3b9b1a28262980ba90b1a89f2ea84d8ee';
const FROM_BASE = 87905371; // known active block

async function rpc(url, method, params=[], timeout=20000) {
  try {
    const r = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
      signal: AbortSignal.timeout(timeout),
    });
    const d = await r.json();
    return d.error ? {error:JSON.stringify(d.error)} : {result:d.result};
  } catch(e) {return {error:e.message};}
}

const latest = parseInt((await rpc(ALCHEMY,'eth_blockNumber')).result,16);
console.log('Latest:', latest);

// Test Tenderly WITH topic at different ranges
console.log('\n=== Tenderly WITH topic filter ===');
for (const range of [1000,5000,10000,50000,100000,200000]) {
  const from = latest - range;
  const res = await rpc(TENDERLY,'eth_getLogs',[{
    fromBlock:'0x'+from.toString(16), toBlock:'0x'+latest.toString(16),
    address:CONTRACT, topics:[TOPIC],
  }],15000);
  if (res.error) console.log(`Range ${String(range).padStart(7)}: ❌ ${res.error.slice(0,70)}`);
  else console.log(`Range ${String(range).padStart(7)}: ✅ ${res.result?.length||0} logs`);
  await new Promise(r=>setTimeout(r,500));
}

// Use known active range to scan properly via Alchemy 10-block chunks
// 10 blocks at a time but multiple calls = still gets the job done
// 30 days = 1.3M blocks / 10 = 130,000 Alchemy calls
// Free tier: 30M CU / 60 CU per getLogs = 500,000 calls available
// So 130,000 calls is within free tier! Just takes time.

// Test: how fast can we do 10-block chunks?
console.log('\n=== Alchemy 10-block speed test ===');
const t0 = Date.now();
let total = 0;
for (let i=0; i<10; i++) {
  const from = FROM_BASE + i*10;
  const res = await rpc(ALCHEMY,'eth_getLogs',[{
    fromBlock:'0x'+from.toString(16),
    toBlock:'0x'+(from+9).toString(16),
    address:CONTRACT, topics:[TOPIC],
  }]);
  if (Array.isArray(res.result)) total += res.result.length;
}
const elapsed = Date.now() - t0;
console.log(`10 calls in ${elapsed}ms = ${(elapsed/10).toFixed(0)}ms/call`);
console.log(`Sample logs found: ${total}`);
console.log(`\nEstimate for 30 days:`);
console.log(`  1.3M blocks / 10 = 130,000 calls`);
console.log(`  At ${(elapsed/10).toFixed(0)}ms/call = ${(130000*(elapsed/10)/1000/3600).toFixed(1)} hours`);
console.log(`  Too slow for GitHub Actions (6 min limit)`);
console.log(`\nBest approach: Use Tenderly WITHOUT topic, filter in JS`);

// Test Tenderly without topic at large range
console.log('\n=== Tenderly WITHOUT topic (larger range test) ===');
for (const range of [10000,50000,100000,300000,500000]) {
  const from = latest - range;
  const res = await rpc(TENDERLY,'eth_getLogs',[{
    fromBlock:'0x'+from.toString(16),
    toBlock:'0x'+latest.toString(16),
    address:CONTRACT, // no topic
  }],20000);
  if (res.error) console.log(`Range ${String(range).padStart(7)} (no topic): ❌ ${res.error.slice(0,70)}`);
  else console.log(`Range ${String(range).padStart(7)} (no topic): ✅ ${res.result?.length||0} logs`);
  await new Promise(r=>setTimeout(r,1000));
}
