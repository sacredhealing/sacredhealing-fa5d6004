const DATA  = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, {
      headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'},
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// Known high-volume condition IDs from previous scan
const TOP_MARKETS = [
  { name: 'Trump win 2024', cid: '0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917' },
  { name: 'World Cup Winner Spain', cid: '0x7976b8dbacf9077eb1453a62bcefd6ab2df199acd28aad276ff0d920d6992892' },
  { name: 'NBA Finals 2025 Clippers', cid: '0x4e2dd28f54a645ac62743a49116dfae0b6fd22ef4187ee2a340d1346ca612bcf' },
  { name: 'Dem Nominee 2028 Stephen A', cid: '0xc8f1cf5d4f26e0fd9c8fe89f2a7b3263b902cf14fde7bfccef525753bb492e47' },
  { name: 'Iran regime fall June 30', cid: '0xcb82cb90cc08d0f3a1c49a6e2e7b90eff4b0e39e1d1c35d2e7f9a3b5c8d2e1f' },
];

// Also get fresh top markets
const events = await get(`${GAMMA}/events?limit=20&order=volume&ascending=false`);
const freshCids = [];
if (Array.isArray(events)) {
  for (const e of events.slice(0,10)) {
    if (e.markets) {
      const mArr = Array.isArray(e.markets) ? e.markets : JSON.parse(e.markets||'[]');
      for (const m of mArr.slice(0,2)) {
        if (m.conditionId) freshCids.push({ name: m.question?.slice(0,40), cid: m.conditionId });
      }
    }
  }
}

const allMarkets = [...TOP_MARKETS, ...freshCids.slice(0,20)];
console.log(`Scanning ${allMarkets.length} top markets for big traders...\n`);

const foundWallets = new Map(); // addr -> best trade info

for (const m of allMarkets) {
  // Get all activity for this market
  const acts = await get(`${DATA}/activity?user=all&conditionId=${m.cid}&limit=500&sortBy=usdcSize&sortDirection=DESC`);
  const byUser = await get(`${DATA}/activity?conditionId=${m.cid}&limit=200&sortBy=timestamp&sortDirection=DESC`);
  
  const arr = Array.isArray(acts) ? acts : Array.isArray(byUser) ? byUser : [];
  
  if (arr.length === 0) {
    // Try trades endpoint
    const trades = await get(`${DATA}/trades?conditionId=${m.cid}&limit=200&sortBy=size&sortDirection=DESC`);
    if (Array.isArray(trades) && trades.length > 0) {
      console.log(`\n✅ ${m.name}: ${trades.length} trades via trades endpoint`);
      trades.filter(t=>parseFloat(t.usdcSize||t.size||0)>5000).slice(0,5).forEach(t => {
        const addr = t.proxyWallet || t.trader || t.user;
        const sz = parseFloat(t.usdcSize||t.size||0);
        if (addr) {
          if (!foundWallets.has(addr) || foundWallets.get(addr).size < sz) {
            foundWallets.set(addr, { addr, size: sz, market: m.name, price: t.price });
          }
          console.log(`  $${sz.toFixed(0).padStart(8)} | ${addr.slice(0,14)} @ ${Number(t.price||0).toFixed(3)}`);
        }
      });
    }
    continue;
  }
  
  const bigOnes = arr.filter(t => parseFloat(t.usdcSize||0) > 5000);
  if (bigOnes.length > 0) {
    console.log(`\n✅ ${m.name}: ${bigOnes.length} big trades ($5k+)`);
    bigOnes.slice(0,5).forEach(t => {
      const addr = t.proxyWallet;
      const sz = parseFloat(t.usdcSize||0);
      if (addr) {
        if (!foundWallets.has(addr) || foundWallets.get(addr).size < sz) {
          foundWallets.set(addr, { addr, size: sz, market: m.name });
        }
        console.log(`  $${sz.toFixed(0).padStart(8)} | ${addr.slice(0,14)} | ${t.title?.slice(0,40)||'?'}`);
      }
    });
  }
  await new Promise(r=>setTimeout(r,300));
}

console.log(`\n\nDiscovered ${foundWallets.size} wallets with $5k+ single trades`);

// Now deep scan each one
console.log('\n🔍 Deep PnL scan...\n');
const results = [];

for (const [addr, info] of foundWallets) {
  const [pos, tr] = await Promise.all([
    get(`${DATA}/positions?user=${addr}&limit=500&sortBy=cashPnl&sortDirection=DESC`),
    get(`${DATA}/trades?user=${addr}&limit=500&sortBy=timestamp&sortDirection=DESC`),
  ]);
  const pArr = Array.isArray(pos)?pos:[];
  const tArr = Array.isArray(tr)?tr:[];
  const pnl = pArr.reduce((s,p)=>s+parseFloat(p.cashPnl||0),0);
  const wins = pArr.filter(p=>parseFloat(p.cashPnl||0)>0);
  const bigWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>10000);
  const massiveWins = pArr.filter(p=>parseFloat(p.cashPnl||0)>50000);
  const now = Date.now()/1000;
  const wk = tArr.filter(t=>t.timestamp&&now-t.timestamp<604800).length;
  const wr = pArr.length > 0 ? Math.round(wins.length/pArr.length*100) : 0;
  const topWin = Math.max(0,...pArr.map(p=>parseFloat(p.cashPnl||0)));
  const topPos = Math.max(0,...pArr.map(p=>parseFloat(p.initialValue||0)));
  
  const tag = pnl>100000?'🚨 WHALE':pnl>10000?'⭐ BIG':pnl>0?'🟢':'🔴';
  console.log(`${tag} ${addr.slice(0,16)} | pnl:$${pnl.toFixed(0)} | WR:${wr}% | $50k+wins:${massiveWins.length} | seen via: ${info.market} ($${info.size.toFixed(0)})`);
  
  if (massiveWins.length > 0) {
    massiveWins.slice(0,3).forEach(p => {
      console.log(`    +$${Number(p.cashPnl).toFixed(0).padStart(9)} | ${String(p.title||'?').slice(0,55)}`);
    });
  }
  
  results.push({ addr, pnl, wins:wins.length, total:pArr.length, wr,
    bigWins:bigWins.length, massiveWins:massiveWins.length,
    wk, topWin, topPos, foundVia: info.market, foundSize: info.size });
  await new Promise(r=>setTimeout(r,200));
}

results.sort((a,b)=>b.pnl-a.pnl);
const profitable = results.filter(r=>r.pnl>0);

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('  🚨 NEW INSIDERS + WHALES DISCOVERED');
console.log('╚═══════════════════════════════════════════════════════╝\n');

profitable.forEach((w,i) => {
  const tag = w.massiveWins>0?'🚨 WHALE':w.bigWins>0?'⭐ INSIDER':w.topPos>100000?'💰 HEAVY':'🟢';
  console.log(`${tag} #${i+1} ${w.addr}`);
  console.log(`  PnL: $${w.pnl.toFixed(0)} | WR: ${w.wr}% | Best: +$${w.topWin.toFixed(0)} | Max pos: $${w.topPos.toFixed(0)}`);
  console.log(`  $10k+ wins: ${w.bigWins} | $50k+ wins: ${w.massiveWins} | This week: ${w.wk} trades`);
  console.log(`  Discovered via: ${w.foundVia} (single trade: $${w.foundSize.toFixed(0)})`);
  console.log('');
});

console.log(`TOTAL NEW: ${profitable.length} profitable | ${profitable.filter(w=>w.massiveWins>0).length} whales | ${profitable.filter(w=>w.bigWins>0).length} insiders`);
