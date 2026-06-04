const DATA = 'https://data-api.polymarket.com';

// Test what params the activity endpoint accepts
const tests = [
  `${DATA}/activity?conditionId=0x9d3f02264a94bafc676afd7add8b11442e6ec72dabaa69cefef835f0672275c7&limit=10`,
  `${DATA}/activity?market=0x9d3f02264a94bafc676afd7add8b11442e6ec72dabaa69cefef835f0672275c7&limit=10`,
  `${DATA}/trades?conditionId=0x9d3f02264a94bafc676afd7add8b11442e6ec72dabaa69cefef835f0672275c7&limit=10`,
  `${DATA}/activity?user=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73&limit=10`,
  `${DATA}/trades?user=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73&limit=5`,
];

for (const url of tests) {
  try {
    const r = await fetch(url, {headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
    const text = await r.text();
    const preview = text.slice(0,200).replace(/\n/g,' ');
    console.log(`\n${r.status} ${url.replace('https://data-api.polymarket.com','')}`);
    if (r.ok) console.log(`  → ${preview}`);
  } catch(e) {console.log(`ERR ${url.slice(30,80)}: ${e.message}`);}
  await new Promise(r=>setTimeout(r,300));
}

// Check what conditionId BAA2BC trades in - get FULL trade with conditionId
const trades = await fetch(`${DATA}/trades?user=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73&limit=3`, {headers:{Accept:'application/json'}});
const t = await trades.json();
if (Array.isArray(t) && t.length > 0) {
  console.log('\nBAA2BC trade fields:', Object.keys(t[0]).join(', '));
  console.log('conditionId:', t[0].conditionId);
  console.log('Full sample:', JSON.stringify(t[0]).slice(0,400));
  
  // Now try querying by that conditionId
  const cid = t[0].conditionId;
  if (cid) {
    const byMarket = await fetch(`${DATA}/trades?conditionId=${cid}&limit=20`, {headers:{Accept:'application/json'}});
    const bm = await byMarket.json();
    console.log(`\nTrades by conditionId ${cid.slice(0,20)}...:`, Array.isArray(bm)?bm.length:'not array - '+JSON.stringify(bm).slice(0,100));
    if (Array.isArray(bm) && bm.length > 0) {
      console.log('Sample trader:', bm[0].proxyWallet, 'size:', bm[0].usdcSize);
      const wallets = [...new Set(bm.map(t=>t.proxyWallet).filter(Boolean))];
      console.log('Unique wallets in this market:', wallets.length, wallets.slice(0,5).join(', '));
    }
  }
}
