const ALCHEMY = process.env.POLYGON_RPC_URL;
const CONTRACT = '0xE111180000d2663C0091e4f400237545B87B996B';
const TOPIC    = '0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49';

async function rpc(url, method, params=[], timeout=12000) {
  try {
    const r = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
      signal: AbortSignal.timeout(timeout),
    });
    const d = await r.json();
    if (d.error) return {error: d.error.message || JSON.stringify(d.error)};
    return {result: d.result};
  } catch(e) {return {error: e.message};}
}

// Get latest block from Alchemy (known working)
const latestHex = (await rpc(ALCHEMY,'eth_blockNumber')).result;
const latest = parseInt(latestHex, 16);
console.log('Latest Polygon block:', latest);

// All free Polygon RPCs to test
const ENDPOINTS = [
  {name:'Polygon Official',  url:'https://polygon-rpc.com'},
  {name:'Polygon Bor 1',     url:'https://bor-mainnet.polygon.technology'},
  {name:'Polygon Bor 2',     url:'https://polygon-bor-rpc.publicnode.com'},
  {name:'PublicNode',        url:'https://polygon-bor-rpc.publicnode.com'},
  {name:'Chainstack Free',   url:'https://matic-mainnet.chainstacklabs.com'},
  {name:'Ankr Free',         url:'https://rpc.ankr.com/polygon_no_key'},
  {name:'BlockPI',           url:'https://polygon.blockpi.network/v1/rpc/public'},
  {name:'dRPC',              url:'https://polygon.drpc.org'},
  {name:'Tenderly',          url:'https://polygon.gateway.tenderly.co'},
  {name:'LlamaRPC',          url:'https://polygon.llamarpc.com'},
  {name:'Meowrpc',           url:'https://polygon.meowrpc.com'},
  {name:'NodeReal',          url:'https://polygon-mainnet.nodereal.io/v1/pub'},
  {name:'OmniaTech',         url:'https://endpoints.omniatech.io/v1/matic/mainnet/public'},
  {name:'1RPC',              url:'https://1rpc.io/matic'},
  {name:'Blast',             url:'https://polygon-mainnet.blastapi.io/public'},
];

console.log('\n=== FREE RPC PROVIDER TEST ===\n');

for (const ep of ENDPOINTS) {
  // First check if it responds
  const blkRes = await rpc(ep.url, 'eth_blockNumber', [], 8000);
  if (blkRes.error) {
    console.log(`❌ ${ep.name.padEnd(20)} | ${blkRes.error.slice(0,50)}`);
    await new Promise(r=>setTimeout(r,200));
    continue;
  }
  
  const blk = parseInt(blkRes.result, 16) || latest; // fallback to alchemy latest
  
  // Test 10k block range
  const from10k = blk - 10000;
  const res10k = await rpc(ep.url, 'eth_getLogs', [{
    fromBlock: '0x' + from10k.toString(16),
    toBlock:   '0x' + blk.toString(16),
    address: CONTRACT, topics: [TOPIC],
  }], 10000);
  
  if (res10k.error) {
    // Try 1000 blocks
    const from1k = blk - 1000;
    const res1k = await rpc(ep.url, 'eth_getLogs', [{
      fromBlock: '0x' + from1k.toString(16),
      toBlock:   '0x' + blk.toString(16),
      address: CONTRACT, topics: [TOPIC],
    }], 8000);
    
    if (res1k.error) {
      console.log(`🟡 ${ep.name.padEnd(20)} | alive but getLogs fails: ${res1k.error.slice(0,50)}`);
    } else {
      console.log(`🟡 ${ep.name.padEnd(20)} | 1k OK (${res1k.result?.length} logs) | 10k: ${res10k.error?.slice(0,40)}`);
    }
  } else {
    const logCount = res10k.result?.length || 0;
    // Try 100k blocks if 10k worked
    const from100k = blk - 100000;
    const res100k = await rpc(ep.url, 'eth_getLogs', [{
      fromBlock: '0x' + from100k.toString(16),
      toBlock:   '0x' + blk.toString(16),
      address: CONTRACT, topics: [TOPIC],
    }], 15000);
    
    if (res100k.error) {
      console.log(`✅ ${ep.name.padEnd(20)} | 10k OK (${logCount} logs) | 100k: ❌ | MAX ~10k blocks`);
    } else {
      console.log(`🚀 ${ep.name.padEnd(20)} | 10k OK | 100k OK (${res100k.result?.length} logs) | UNLIMITED RANGE!`);
    }
  }
  await new Promise(r=>setTimeout(r,400));
}
