const DATA  = 'https://data-api.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, {
      headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'},
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// The key insight: the user/profile endpoint exists
// Try every variant to find wallets by volume/profit

const TEST_ADDRS = [
  // From our previous scan - the biggest known profitable ones
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73', // +$189k
  '0xb2a3623364c33561d8312e1edb79eb941c798510', // +$120k
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5', // +$59k (1000x wallet)
];

// First: understand the profile fields
for (const addr of TEST_ADDRS) {
  console.log(`\n=== ${addr.slice(0,14)} ===`);
  
  // Get their full profile
  const profile = await get(`${DATA}/profile?user=${addr}`);
  if (profile) {
    console.log('Profile fields:', Object.keys(profile).join(', '));
    console.log('Profile:', JSON.stringify(profile).slice(0,400));
  }
  
  // Get trade history details - look for rapid large moves
  const trades = await get(`${DATA}/trades?user=${addr}&limit=500&sortBy=usdcSize&sortDirection=DESC`);
  const tArr = Array.isArray(trades) ? trades : [];
  
  if (tArr.length > 0) {
    console.log(`\nBiggest ${Math.min(tArr.length,10)} trades by size:`);
    tArr.slice(0,10).forEach(t => {
      const ts = t.timestamp ? new Date(t.timestamp*1000).toISOString().slice(0,16) : '?';
      console.log(`  $${Number(t.usdcSize||0).toFixed(0).padStart(8)} | ${ts} | ${t.side} @ ${Number(t.price||0).toFixed(3)} | ${String(t.title||'?').slice(0,40)}`);
    });
    
    // Find "30 minute" patterns - rapid large buys
    const sorted = tArr.filter(t=>t.timestamp).sort((a,b)=>b.timestamp-a.timestamp);
    const rapid = [];
    for (let i=0; i<sorted.length-1; i++) {
      const timeDiff = (sorted[i].timestamp - sorted[i+1].timestamp);
      if (timeDiff < 1800 && parseFloat(sorted[i].usdcSize||0) > 1000) { // within 30 min
        rapid.push({ t: sorted[i], gap: timeDiff });
      }
    }
    if (rapid.length > 0) {
      console.log(`\nRapid large trades (within 30 min of each other): ${rapid.length}`);
      rapid.slice(0,5).forEach(r => {
        console.log(`  $${Number(r.t.usdcSize||0).toFixed(0)} in ${r.gap}s | ${String(r.t.title||'?').slice(0,40)}`);
      });
    }
  }
  
  await new Promise(r=>setTimeout(r,500));
}

// Strategy: find wallets by querying activity on the highest-$ markets we know exist
// Use the market IDs from the events (not conditionId which doesn't work)
console.log('\n\n=== MARKET-BASED WHALE DISCOVERY ===');

// Get events with market IDs
const events = await get(`https://gamma-api.polymarket.com/events?limit=5&order=volume&ascending=false`);
if (Array.isArray(events)) {
  for (const e of events.slice(0,3)) {
    console.log(`\nEvent: ${e.title?.slice(0,50)}`);
    const mArr = Array.isArray(e.markets) ? e.markets : [];
    for (const m of mArr.slice(0,2)) {
      console.log(`  Market ID: ${m.id} | ${m.question?.slice(0,40)}`);
      
      // Try activity with market ID (not conditionId)
      const act = await get(`${DATA}/activity?market=${m.id}&limit=10&sortBy=usdcSize&sortDirection=DESC`);
      if (Array.isArray(act) && act.length > 0) {
        console.log(`  Activity (${act.length} records):`);
        act.slice(0,5).forEach(a => {
          console.log(`    $${Number(a.usdcSize||0).toFixed(0)} | ${a.proxyWallet?.slice(0,14)} | ${a.side}`);
        });
      } else {
        console.log(`  Activity: ${JSON.stringify(act)?.slice(0,100)}`);
      }
      await new Promise(r=>setTimeout(r,300));
    }
  }
}
