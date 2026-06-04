// Verify correct Polymarket contract addresses and topic using Alchemy (10-block works)
const ALCHEMY = process.env.POLYGON_RPC_URL;
const TENDERLY = 'https://polygon.gateway.tenderly.co';

async function rpc(url, method, params=[]) {
  const r = await fetch(url, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json();
  return d.error ? {error:d.error.message} : {result:d.result};
}

// The oracle last run found 77k logs at block 87,905,371-87,905,821
// Let's scan those EXACT blocks with no filter to see what's there
const FROM = 87905371;
const TO   = 87905821; // 450 blocks where clawbot found 77k logs

console.log('=== Verifying at known active range (87905371-87905821) ===');

// Get all logs with NO filter first
const all = await rpc(ALCHEMY, 'eth_getLogs', [{
  fromBlock: '0x' + FROM.toString(16),
  toBlock:   '0x' + (FROM+9).toString(16), // just 10 blocks
}]);
console.log('All logs (10 blocks, no filter):', Array.isArray(all.result)?all.result.length:'ERR:'+all.error);
if (Array.isArray(all.result) && all.result.length > 0) {
  // Show unique addresses and topics
  const addrs = {}, topics = {};
  for (const log of all.result) {
    addrs[log.address] = (addrs[log.address]||0)+1;
    const t = log.topics?.[0];
    if (t) topics[t] = (topics[t]||0)+1;
  }
  console.log('Contract addresses:');
  Object.entries(addrs).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([a,c])=>console.log(`  ${a}: ${c} logs`));
  console.log('Topic[0] values:');
  Object.entries(topics).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([t,c])=>console.log(`  ${t}: ${c} logs`));
}

// Now check with our contract addresses
const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
for (const c of CONTRACTS) {
  const res = await rpc(ALCHEMY, 'eth_getLogs', [{
    fromBlock: '0x' + FROM.toString(16),
    toBlock:   '0x' + (FROM+9).toString(16),
    address: c,
  }]);
  console.log(`\n${c} (10 blocks):`, Array.isArray(res.result)?`${res.result.length} logs`:'ERR:'+res.error);
  if (Array.isArray(res.result) && res.result.length > 0) {
    console.log('Sample:', JSON.stringify(res.result[0]).slice(0,300));
  }
}

// Test the exact clawbot params 
const TOPIC = '0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49';
for (const c of CONTRACTS) {
  const res = await rpc(ALCHEMY, 'eth_getLogs', [{
    fromBlock: '0x' + FROM.toString(16),
    toBlock:   '0x' + (FROM+9).toString(16),
    address: c,
    topics: [TOPIC],
  }]);
  console.log(`\n${c} WITH TOPIC (10 blocks):`, Array.isArray(res.result)?`${res.result.length} logs`:'ERR:'+res.error);
}

// Now test on Tenderly - same 10 blocks, no filter
console.log('\n=== Tenderly same range ===');
const tAll = await rpc(TENDERLY, 'eth_getLogs', [{
  fromBlock: '0x' + FROM.toString(16),
  toBlock:   '0x' + (FROM+9).toString(16),
}]);
console.log('Tenderly all logs (10 blocks):', Array.isArray(tAll.result)?tAll.result.length:'ERR:'+tAll.error);
