const POLYGON_RPC = process.env.POLYGON_RPC_URL;

async function rpc(method, params=[]) {
  const r = await fetch(POLYGON_RPC, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id:1,jsonrpc:'2.0',method,params}),
  });
  return (await r.json()).result;
}

const latest = parseInt(await rpc('eth_blockNumber'), 16);
console.log('Latest block:', latest);

// Try a wider scan with no address filter to find active contracts
const from = latest - 200;
const logs = await rpc('eth_getLogs', [{
  fromBlock: '0x' + from.toString(16),
  toBlock:   '0x' + latest.toString(16),
}]);
console.log('Total logs in 200 blocks (no filter):', Array.isArray(logs) ? logs.length : 'error: '+JSON.stringify(logs)?.slice(0,100));

// Now check the specific contracts from clawbot
const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];

for (const c of CONTRACTS) {
  // Check if contract has any code (is it real?)
  const code = await rpc('eth_getCode', [c, 'latest']);
  console.log(`\n${c}`);
  console.log(`  Code length: ${code ? code.length : 0} chars (${code && code.length > 4 ? 'HAS CODE ✅' : 'EMPTY ❌'})`);
}

// Try the block range where oracle DID find trades (87905371 - 87905821)
console.log('\n--- Testing known active range ---');
for (const c of CONTRACTS) {
  const logs2 = await rpc('eth_getLogs', [{
    fromBlock: '0x' + (87905371).toString(16),
    toBlock:   '0x' + (87905821).toString(16),
    address: c,
  }]);
  console.log(`${c.slice(0,12)}: ${Array.isArray(logs2) ? logs2.length : JSON.stringify(logs2)?.slice(0,80)} logs`);
}
