#!/usr/bin/env node
/**
 * Real Whale Performance Scanner
 * - Pulls top addresses from polymarket_seen_trades (most active)
 * - Queries data-api for each wallet's trade history
 * - Calculates 6mo + 12mo win rate and ROI
 * - Updates polymarket_whales with real scores
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const DATA = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';

async function dbGet(t, q = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`, { headers: SB });
  return r.ok ? r.json() : [];
}
async function dbUpsert(t, d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?on_conflict=address`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(d),
  });
  return r.ok;
}
async function dbPatch(t, id, d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`, {
    method: 'PATCH', headers: { ...SB, 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
  return r.ok;
}
async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

function scoreWallet(trades) {
  if (!trades || trades.length === 0) return null;

  const now = Date.now();
  const SIX_MO  = now - 180 * 86400000;
  const ONE_YEAR = now - 365 * 86400000;

  // trades from data-api have: type, outcome, cashPnl, size, timestamp, marketQuestion
  const resolved = trades.filter(t => t.type === 'TRADE' && t.cashPnl !== undefined && t.cashPnl !== null);
  const recent6mo = resolved.filter(t => new Date(t.timestamp || t.createdAt).getTime() > SIX_MO);
  const recent12mo = resolved.filter(t => new Date(t.timestamp || t.createdAt).getTime() > ONE_YEAR);

  const calcStats = (arr) => {
    if (arr.length === 0) return { wr: 0, roi: 0, count: 0, totalPnl: 0 };
    const wins = arr.filter(t => parseFloat(t.cashPnl) > 0).length;
    const totalPnl = arr.reduce((s, t) => s + parseFloat(t.cashPnl || 0), 0);
    const totalIn = arr.reduce((s, t) => s + Math.abs(parseFloat(t.size || t.amount || 1)), 0);
    return {
      wr: Math.round((wins / arr.length) * 100),
      roi: totalIn > 0 ? Math.round((totalPnl / totalIn) * 100) : 0,
      count: arr.length,
      totalPnl: parseFloat(totalPnl.toFixed(2)),
    };
  };

  return {
    stats6mo: calcStats(recent6mo),
    stats12mo: calcStats(recent12mo),
    statsAll: calcStats(resolved),
    totalTrades: trades.length,
  };
}

async function analyzeWallet(address) {
  // Pull full trade history
  const activity = await get(`${DATA}/activity?user=${address}&limit=500&sortBy=timestamp&sortDirection=DESC`);
  const trades   = await get(`${DATA}/trades?user=${address}&limit=500`);
  const positions = await get(`${DATA}/positions?user=${address}&limit=200&sortBy=cashPnl&sortDirection=DESC`);

  const activityData = Array.isArray(activity) ? activity : [];
  const tradesData   = Array.isArray(trades)   ? trades   : [];
  const posData      = Array.isArray(positions) ? positions : [];

  // Use whichever has more data
  const bestData = tradesData.length >= activityData.length ? tradesData : activityData;
  const score = scoreWallet(bestData);

  // Total PnL from positions
  const totalPosPnl = posData.reduce((s, p) => s + parseFloat(p.cashPnl || p.profit || 0), 0);

  return {
    address,
    activityCount: activityData.length,
    tradesCount: tradesData.length,
    positionsCount: posData.length,
    totalPosPnl: parseFloat(totalPosPnl.toFixed(2)),
    score,
    sampleTrade: bestData[0] || null,
  };
}

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  SQI WHALE HISTORY DEEP SCAN');
  console.log(`  ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════');

  // Pull top addresses from seen_trades (most frequently seen = most active)
  const seen = await dbGet('polymarket_seen_trades', 'limit=5000&order=detected_at.desc');
  
  // Count by address
  const freq = {};
  for (const row of seen) {
    const a = row.whale_address;
    if (a) freq[a] = (freq[a] || 0) + 1;
  }

  // Sort by frequency, take top 20
  const topAddrs = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([addr, count]) => ({ addr, count }));

  console.log(`\n📊 Top ${topAddrs.length} most-seen wallets from ${seen.length} trade records:`);
  topAddrs.forEach(({ addr, count }) => console.log(`  ${addr.slice(0,14)}... seen ${count}x`));

  // Also get existing whales
  const existingWhales = await dbGet('polymarket_whales', 'order=win_rate_30d.desc');
  const existingAddrs = new Set(existingWhales.map(w => w.address.toLowerCase()));

  // Merge: scan top-seen + existing whales
  const toScan = [...new Set([
    ...topAddrs.map(t => t.addr),
    ...existingWhales.slice(0, 10).map(w => w.address),
  ])].slice(0, 25);

  console.log(`\n🔍 Deep scanning ${toScan.length} wallets for 6mo + 12mo performance...\n`);

  const results = [];
  for (const address of toScan) {
    process.stdout.write(`  Scanning ${address.slice(0,14)}... `);
    const analysis = await analyzeWallet(address);
    results.push(analysis);
    
    const s = analysis.score;
    if (s) {
      console.log(`trades:${analysis.tradesCount} | 6mo: ${s.stats6mo.wr}%WR +${s.stats6mo.roi}%ROI (${s.stats6mo.count}t) | 12mo: ${s.stats12mo.wr}%WR +${s.stats12mo.roi}%ROI (${s.stats12mo.count}t) | PnL: $${analysis.totalPosPnl}`);
    } else {
      console.log(`no resolved trade data (${analysis.activityCount} activity, ${analysis.tradesCount} trades)`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  // Find ELITE candidates: 6mo win rate >= 55%, >= 10 trades, positive ROI
  const elites = results.filter(r => {
    const s = r.score;
    return s && (
      (s.stats6mo.wr >= 55 && s.stats6mo.count >= 10 && s.stats6mo.roi > 0) ||
      (s.stats12mo.wr >= 55 && s.stats12mo.count >= 20 && s.stats12mo.roi > 0)
    );
  });

  console.log(`\n\n🏆 ELITE CANDIDATES FOUND: ${elites.length}`);
  for (const e of elites) {
    const s = e.score;
    console.log(`\n  ✅ ${e.address}`);
    console.log(`     6mo:  ${s.stats6mo.wr}%WR | +${s.stats6mo.roi}%ROI | ${s.stats6mo.count} trades | PnL $${s.stats6mo.totalPnl}`);
    console.log(`     12mo: ${s.stats12mo.wr}%WR | +${s.stats12mo.roi}%ROI | ${s.stats12mo.count} trades`);
    console.log(`     Total PnL from positions: $${e.totalPosPnl}`);
  }

  // Update DB: set real stats for all scanned wallets
  for (const r of results) {
    const s = r.score;
    if (!s) continue;

    const isElite = (s.stats6mo.wr >= 55 && s.stats6mo.count >= 10 && s.stats6mo.roi > 0) ||
                    (s.stats12mo.wr >= 55 && s.stats12mo.count >= 20 && s.stats12mo.roi > 0);

    const freqCount = freq[r.address] || 0;
    const alias = isElite 
      ? `🏆${r.address.slice(2,8).toUpperCase()}` 
      : `🦈${r.address.slice(2,8).toUpperCase()}`;

    await dbUpsert('polymarket_whales', {
      address: r.address,
      alias,
      win_rate_30d: s.stats6mo.wr || s.stats12mo.wr || 0,
      roi_30d: s.stats6mo.roi || s.stats12mo.roi || 0,
      total_profit: r.totalPosPnl,
      total_trades_seen: freqCount,
      trades_tracked: s.statsAll.count,
      is_active: true,
      is_elite: isElite,
      last_checked: new Date().toISOString(),
    });
  }

  console.log('\n\n━━━ SCAN COMPLETE ━━━');
  console.log(`Scanned: ${results.length} | Elite found: ${elites.length}`);
  
  // Print sample trade structure for debug
  const withTrades = results.find(r => r.tradesCount > 0);
  if (withTrades?.sampleTrade) {
    console.log('\nSample trade fields:', Object.keys(withTrades.sampleTrade).join(', '));
    console.log('Sample:', JSON.stringify(withTrades.sampleTrade).slice(0,300));
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
