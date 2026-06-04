const TENDERLY = 'https://polygon.gateway.tenderly.co';
const ALCHEMY = process.env.POLYGON_RPC_URL;
const CONTRACT = '0xE111180000d2663C0091e4f400237545B87B996B';
const TOPIC = '0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49';

async function rpc(url, method, params=[], timeout=20000) {
  try {
    const r = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
      signal: AbortSignal.timeout(timeout),
    });
    const d = await r.json();
    if (d.error) return {error:d.error.message||JSON.stringify(d.error)};
    return {result:d.result};
  } catch(e) {return {error:e.message};}
}

const latestHex = (await rpc(ALCHEMY,'eth_blockNumber')).result;
const latest = parseInt(latestHex,16);
console.log('Latest block:', latest);

// Calibrate Tenderly max range
console.log('\n=== Tenderly block range calibration ===');
for (const range of [1000, 5000, 10000, 50000, 100000, 200000, 500000]) {
  const from = latest - range;
  const t0 = Date.now();
  const res = await rpc(TENDERLY, 'eth_getLogs', [{
    fromBlock: '0x'+from.toString(16),
    toBlock: '0x'+latest.toString(16),
    address: CONTRACT, topics: [TOPIC],
  }], 25000);
  const ms = Date.now() - t0;
  if (res.error) {
    console.log(`Range ${String(range).padStart(7)}: ❌ ${res.error.slice(0,60)}`);
    if (res.error.includes('timeout') || res.error.includes('abort')) break;
  } else {
    console.log(`Range ${String(range).padStart(7)}: ✅ ${res.result?.length||0} logs in ${ms}ms`);
  }
  await new Promise(r=>setTimeout(r,500));
}

// Also check publicnode which had timeout before
console.log('\n=== PublicNode calibration ===');
for (const range of [1000, 10000, 50000]) {
  const from = latest - range;
  const res = await rpc('https://polygon-bor-rpc.publicnode.com', 'eth_getLogs', [{
    fromBlock: '0x'+from.toString(16),
    toBlock: '0x'+latest.toString(16),
    address: CONTRACT, topics: [TOPIC],
  }], 20000);
  if (res.error) {
    console.log(`Range ${range}: ❌ ${res.error.slice(0,60)}`);
  } else {
    console.log(`Range ${range}: ✅ ${res.result?.length||0} logs`);
  }
  await new Promise(r=>setTimeout(r,500));
}
