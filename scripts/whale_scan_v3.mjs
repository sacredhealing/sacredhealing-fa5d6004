const POLYGON_RPC = process.env.POLYGON_RPC_URL;
const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];

async function rpc(method, params=[]) {
  const r = await fetch(POLYGON_RPC, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({id:1, jsonrpc:'2.0', method, params}),
  });
  const d = await r.json();
  return d.result;
}

const latest = parseInt(await rpc('eth_blockNumber'), 16);
const from = latest - 500;

console.log(`Scanning blocks ${from} → ${latest}`);

// Try with NO topic filter first to see what events exist
for (const contract of CONTRACTS) {
  const logs = await rpc('eth_getLogs', [{
    fromBlock: '0x' + from.toString(16),
    toBlock: '0x' + latest.toString(16),
    address: contract,
  }]);
  
  if (!Array.isArray(logs)) { console.log(`${contract}: no logs`); continue; }
  console.log(`\n${contract}: ${logs.length} total logs`);
  
  // Show unique topic[0] values
  const topics = {};
  for (const log of logs) {
    const t = log.topics?.[0];
    if (t) topics[t] = (topics[t]||0) + 1;
  }
  console.log('Unique event topics:');
  Object.entries(topics).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([t,c]) => {
    console.log(`  ${t} (${c} events)`);
  });
  
  // Show a sample log with data
  if (logs.length > 0) {
    const sample = logs.find(l => l.data && l.data.length > 100) || logs[0];
    console.log('\nSample log:');
    console.log('  topics:', sample.topics);
    console.log('  data len:', sample.data?.length);
    console.log('  data preview:', sample.data?.slice(0,130));
  }
}
