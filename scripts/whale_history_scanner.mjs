const DATA = 'https://data-api.polymarket.com';
async function get(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    return r.json();
  } catch(e) { return null; }
}
const wallets = [
  { alias: 'Apex-C8AB97', address: '0xc8ab97a9089a1b59b75b4900ecfb5c51f3f0b4bf', knownPnl: 283246 },
  { alias: 'Apex-A7A8C1', address: '0xa7a8c1fd4bff8e71c49c9c9e2b89e4c3f4d0e9a8', knownPnl: 47554 },
];
for (const w of wallets) {
  console.log(`\n${'='.repeat(55)}\n  ${w.alias}\n  Known PnL: $${w.knownPnl.toLocaleString()}\n${'='.repeat(55)}`);
  const trades = await get(`${DATA}/trades?user=${w.address}&limit=500&sortBy=timestamp&sortDirection=DESC`);
  const tArr = Array.isArray(trades) ? trades : [];
  console.log(`Trades: ${tArr.length}`);
  if (tArr.length > 0) {
    const t0 = tArr[0];
    console.log('Fields:', Object.keys(t0).join(', '));
    console.log('Sample:', JSON.stringify(t0).slice(0,400));
    const ts = tArr.map(t => t.timestamp).filter(Boolean).sort();
    if (ts.length) console.log(`Range: ${new Date(ts[0]*1000).toISOString().slice(0,10)} -> ${new Date(ts[ts.length-1]*1000).toISOString().slice(0,10)}`);
    const sizes = tArr.map(t => parseFloat(t.usdcSize||0)).filter(x=>x>0);
    if (sizes.length) {
      const tot = sizes.reduce((s,x)=>s+x,0);
      console.log(`Size: min=$${Math.min(...sizes).toFixed(0)} avg=$${(tot/sizes.length).toFixed(0)} max=$${Math.max(...sizes).toFixed(0)} vol=$${tot.toFixed(0)}`);
    }
    const now = Date.now()/1000;
    console.log(`Freq: ${tArr.filter(t=>t.timestamp&&now-t.timestamp<7*86400).length}/wk ${tArr.filter(t=>t.timestamp&&now-t.timestamp<30*86400).length}/mo`);
  }
  const pos = await get(`${DATA}/positions?user=${w.address}&limit=500`);
  const pArr = Array.isArray(pos) ? pos : [];
  console.log(`Positions: ${pArr.length}`);
  if (pArr.length > 0) {
    console.log('Pos fields:', Object.keys(pArr[0]).join(', '));
    console.log('Sample pos:', JSON.stringify(pArr[0]).slice(0,600));
    const wp = pArr.filter(p=>p.cashPnl!=null);
    if (wp.length) {
      const wins = wp.filter(p=>parseFloat(p.cashPnl)>0).length;
      const pnl = wp.reduce((s,p)=>s+parseFloat(p.cashPnl),0);
      const avgW = wp.filter(p=>parseFloat(p.cashPnl)>0).reduce((s,p)=>s+parseFloat(p.cashPnl),0)/(wins||1);
      const avgL = wp.filter(p=>parseFloat(p.cashPnl)<0).reduce((s,p)=>s+parseFloat(p.cashPnl),0)/((wp.length-wins)||1);
      console.log(`WR: ${wins}/${wp.length} = ${Math.round(wins/wp.length*100)}% | avgW:+$${avgW.toFixed(0)} avgL:-$${Math.abs(avgL).toFixed(0)} | pnl:$${pnl.toFixed(0)}`);
    }
  }
  await new Promise(r=>setTimeout(r,1000));
}
