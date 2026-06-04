/**
 * Test QuickNode free tier block range limits on Polygon
 * Then scan for government/insider wallets
 */
const QN_FREE = 'https://polygon-mainnet.quiknode.pro/'; // placeholder - need actual endpoint
const ALCHEMY = process.env.POLYGON_RPC_URL;

async function rpc(url, method, params=[]) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
    });
    const d = await r.json();
    if (d.error) return { error: d.error.message };
    return { result: d.result };
  } catch(e) { return { error: e.message }; }
}

// Test Alchemy with progressively larger block ranges to find the real limit
console.log('=== Testing Alchemy block range limits on Polygon ===\n');
const latest = parseInt((await rpc(ALCHEMY,'eth_blockNumber')).result, 16);
console.log('Latest block:', latest);

const CONTRACT = '0xE111180000d2663C0091e4f400237545B87B996B';
const TOPIC    = '0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49';

for (const range of [10, 50, 100, 500, 1000, 2000, 5000]) {
  const from = latest - range;
  const res = await rpc(ALCHEMY, 'eth_getLogs', [{
    fromBlock: '0x' + from.toString(16),
    toBlock:   '0x' + latest.toString(16),
    address: CONTRACT,
    topics: [TOPIC],
  }]);
  if (res.error) {
    console.log(`Range ${range}: ❌ ERROR — ${res.error}`);
  } else {
    console.log(`Range ${range}: ✅ ${res.result?.length || 0} logs`);
  }
  await new Promise(r=>setTimeout(r,300));
}

// Now test QuickNode public endpoint
console.log('\n=== Testing QuickNode free public endpoints ===');
const QN_ENDPOINTS = [
  'https://polygon-mainnet.quiknode.pro/',
  'https://rpc.ankr.com/polygon',
  'https://polygon-rpc.com',
  'https://rpc-mainnet.matic.network',
  'https://matic-mainnet.chainstacklabs.com',
  'https://polygon.llamarpc.com',
  'https://1rpc.io/matic',
  'https://polygon.rpc.blxrbdn.com',
];

for (const url of QN_ENDPOINTS) {
  const blockRes = await rpc(url, 'eth_blockNumber');
  if (blockRes.error) {
    console.log(`❌ ${url.slice(0,45)} | ${blockRes.error?.slice(0,40)}`);
    continue;
  }
  const blk = parseInt(blockRes.result, 16);
  console.log(`✅ ${url.slice(0,45)} | block: ${blk}`);
  
  // Test getLogs range
  const from = blk - 1000;
  const logsRes = await rpc(url, 'eth_getLogs', [{
    fromBlock: '0x' + from.toString(16),
    toBlock:   '0x' + blk.toString(16),
    address: CONTRACT,
    topics: [TOPIC],
  }]);
  if (logsRes.error) {
    console.log(`   getLogs 1000 blocks: ❌ ${logsRes.error?.slice(0,60)}`);
  } else {
    console.log(`   getLogs 1000 blocks: ✅ ${logsRes.result?.length || 0} logs`);
    // Try 10000 blocks
    const from2 = blk - 10000;
    const big = await rpc(url, 'eth_getLogs', [{
      fromBlock: '0x' + from2.toString(16),
      toBlock:   '0x' + blk.toString(16),
      address: CONTRACT, topics: [TOPIC],
    }]);
    if (big.error) {
      console.log(`   getLogs 10k blocks:  ❌ ${big.error?.slice(0,60)}`);
    } else {
      console.log(`   getLogs 10k blocks:  ✅ ${big.result?.length || 0} logs — FREE RANGE UNLOCKED`);
    }
  }
  await new Promise(r=>setTimeout(r,500));
}
