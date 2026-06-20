
const https = require('https');
const KEY = '7de253c3-49e2-42be-9672-23a761260f86';
const EDGE_URL = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';
const WALLETS = ["GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", "Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ", "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu", "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5", "HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt", "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm", "gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw", "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp", "AAvdewt71kkde2segr6gYnNemhNLfokyZpdzwwi4yDfm", "JD38n7ynKYcgPpF7k1BhXEeREu1KqptU93fVGy3S624k", "9VPozuXeRi8FACAePmg8ckdSZkbeZfTJc6SqUDcKsUKm", "GjK3S2ZgxTVFEkxg43JE8eC1tbztWCseBYyZ8o8sg9f", "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51", "EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS", "5DzUSNro5kfNwB2dxkkTTYrPDXAi6vRnjf4mAN2an7Gc", "2cBedD94RXYSEhEfQJUyLaNaHB4PVoL9z7LK6Mu11sJv", "4ev7HVsESzFxKqGzQxJ5mzSM6NstGCTQXKXT8yHiaRP3", "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o", "Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA"];

const call = (method, path, body) => new Promise((res, rej) => {
  const b = body ? JSON.stringify(body) : null;
  const req = https.request(
    { hostname:'api.helius.xyz', path:`${path}?api-key=${KEY}`, method,
      headers:{'Content-Type':'application/json','Content-Length': b ? Buffer.byteLength(b) : 0} },
    (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res({s:r.statusCode,d:JSON.parse(d)});}catch{res({s:r.statusCode,d});} }); }
  );
  req.on('error', rej);
  if (b) req.write(b);
  req.end();
});

(async()=>{
  console.log('Listing existing webhooks...');
  const list = await call('GET','/v0/webhooks');
  const hooks = Array.isArray(list.d) ? list.d : [];
  console.log('Found', hooks.length, 'webhooks');
  for(const h of hooks) {
    const del = await call('DELETE',`/v0/webhooks/${h.webhookID}`);
    console.log('Deleted', h.webhookID, ':', del.s);
    await new Promise(r=>setTimeout(r,300));
  }
  console.log('Registering', WALLETS.length, 'whale wallets...');
  const reg = await call('POST','/v0/webhooks',{
    webhookURL: EDGE_URL,
    transactionTypes: ['SWAP'],
    accountAddresses: WALLETS,
    webhookType: 'enhanced',
    txnStatus: 'success'
  });
  if(reg.s===200||reg.s===201) {
    console.log('SUCCESS webhookID:', reg.d.webhookID, 'wallets:', reg.d.accountAddresses?.length);
  } else {
    console.log('FAILED:', reg.s, JSON.stringify(reg.d).slice(0,300));
    process.exit(1);
  }
})().catch(e=>{console.error('ERROR:',e.message);process.exit(1);});
