const POLYGON_RPC = process.env.POLYGON_RPC_URL;
console.log('RPC URL:', POLYGON_RPC ? POLYGON_RPC.slice(0,40)+'...' : 'MISSING');

async function rpc(method, params=[]) {
  const r = await fetch(POLYGON_RPC, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
  });
  const d = await r.json();
  if (d.error) console.log('RPC ERROR:', d.error);
  return d.result;
}

// Basic test
const blockHex = await rpc('eth_blockNumber');
const latest = parseInt(blockHex, 16);
console.log('Latest block:', latest, '(hex:', blockHex, ')');

// Test eth_getLogs with EXACT clawbot parameters (tiny range)
const from = latest - 10;
const result = await rpc('eth_getLogs', [{
  fromBlock: '0x' + from.toString(16),
  toBlock:   '0x' + latest.toString(16),
  address: '0xE111180000d2663C0091e4f400237545B87B996B',
  topics:  ['0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49'],
}]);
console.log('getLogs result type:', typeof result, Array.isArray(result) ? `array[${result.length}]` : JSON.stringify(result)?.slice(0,100));

// Try WITHOUT topic filter
const result2 = await rpc('eth_getLogs', [{
  fromBlock: '0x' + from.toString(16),
  toBlock:   '0x' + latest.toString(16),
  address: '0xE111180000d2663C0091e4f400237545B87B996B',
}]);
console.log('getLogs (no topic) result:', typeof result2, Array.isArray(result2) ? `array[${result2.length}]` : JSON.stringify(result2)?.slice(0,100));

// Try block range where oracle found 77k logs
const result3 = await rpc('eth_getLogs', [{
  fromBlock: '0x' + (87905371).toString(16),
  toBlock:   '0x' + (87905400).toString(16),
  address: '0xE111180000d2663C0091e4f400237545B87B996B',
  topics: ['0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49'],
}]);
console.log('Known active range result:', typeof result3, Array.isArray(result3) ? `array[${result3.length}]` : JSON.stringify(result3)?.slice(0,100));
