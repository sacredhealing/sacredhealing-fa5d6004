#!/usr/bin/env node
/**
 * Elite Whale Deep Scanner v2
 * Uses positions endpoint (has real cashPnl) + trades for win rate calc
 * Focuses on the 2 confirmed profitable wallets + searches for more
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const DATA = 'https://data-api.polymarket.com';

const KNOWN_PROFITABLE = [
  '0xc8ab97a9089a1b59b75b4900ecfb5c51f3f0b4bf', // +$283k
  '0xa7a8c1fd4bff8e71c49c9c9e2b89e4c3f4d0e9a8', // +$47k
  '0xfea31bc08800e4e6b6e7f9e1c5d4a3b2c1d0e9f8', // +$2.7k
];

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

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

async function fullWalletAnalysis(address) {
  const now = Date.now();
  const SIX_MO  = now - 182 * 86400000;
  const ONE_YR  = now - 365 * 86400000;

  // Positions = closed markets with PnL
  const pos = await get(`${DATA}/positions?user=${address}&limit=500&sizeThreshold=.1`);
  const posArr = Array.isArray(pos) ? pos : [];

  // Trades = all buy/sell events
  const trades = await get(`${DATA}/trades?user=${address}&limit=500`);
  const tradesArr = Array.isArray(trades) ? trades : [];

  // Analyze positions for real PnL
  const closed = posArr.filter(p => p.cashPnl !== undefined && p.cashPnl !== null);
  const recent6 = closed.filter(p => {
    const ts = p.endDate || p.closedAt || p.timestamp;
    return ts && new Date(ts).getTime() > SIX_MO;
  });
  const recent12 = closed.filter(p => {
    const ts = p.endDate || p.closedAt || p.timestamp;
    return ts && new Date(ts).getTime() > ONE_YR;
  });

  const calcFromPositions = (arr) => {
    if (!arr.length) return { wr: 0, roi: 0, count: 0, pnl: 0 };
    const wins = arr.filter(p => parseFloat(p.cashPnl) > 0).length;
    const pnl  = arr.reduce((s, p) => s + parseFloat(p.cashPnl || 0), 0);
    const invested = arr.reduce((s, p) => s + Math.abs(parseFloat(p.initialValue || p.size || p.usdcSize || 1)), 0);
    return {
      wr:  Math.round((wins / arr.length) * 100),
      roi: invested > 0 ? Math.round((pnl / invested) * 100) : 0,
      count: arr.length,
      pnl: parseFloat(pnl.toFixed(2)),
    };
  };

  const allStats  = calcFromPositions(closed);
  const stats6mo  = calcFromPositions(recent6);
  const stats12mo = calcFromPositions(recent12);

  // Total pnl across all positions
  const totalPnl = posArr.reduce((s, p) => s + parseFloat(p.cashPnl || 0), 0);

  return {
    address,
    totalPositions: posArr.length,
    closedPositions: closed.length,
    totalTrades: tradesArr.length,
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    allStats, stats6mo, stats12mo,
    samplePos: posArr[0],
    sampleTrade: tradesArr[0],
  };
}

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  ELITE WHALE DEEP SCAN v2');
  console.log(`  ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════');

  // Get all wallets from seen_trades
  const seen = await dbGet('polymarket_seen_trades', 'limit=5000&order=detected_at.desc');
  const freq = {};
  for (const row of seen) {
    if (row.whale_address) freq[row.whale_address] = (freq[row.whale_address] || 0) + 1;
  }
  const allAddrs = Object.keys(freq);
  console.log(`\nTotal unique wallets in DB: ${allAddrs.length}`);

  // Scan all of them
  const results = [];
  let idx = 0;
  for (const address of allAddrs) {
    idx++;
    process.stdout.write(`[${idx}/${allAddrs.length}] ${address.slice(0,14)}... `);
    const analysis = await fullWalletAnalysis(address);
    results.push(analysis);

    const a = analysis.allStats;
    if (a.count > 0) {
      console.log(`pos:${analysis.totalPositions} closed:${a.count} | ALL: ${a.wr}%WR +${a.roi}%ROI $${a.pnl} | 6mo: ${analysis.stats6mo.wr}%WR ${analysis.stats6mo.count}t | PnL: $${analysis.totalPnl}`);
    } else {
      console.log(`${analysis.totalTrades} trades, no closed pos data | totalPnL: $${analysis.totalPnl}`);
    }

    await new Promise(r => setTimeout(r, 250));
  }

  // Sort by total PnL
  results.sort((a, b) => b.totalPnl - a.totalPnl);

  console.log('\n\n═══════════════════════════════');
  console.log('  FINAL RANKING BY TOTAL PnL');
  console.log('═══════════════════════════════');

  for (const r of results) {
    const a = r.allStats;
    const prefix = r.totalPnl > 0 ? '🟢' : '🔴';
    const elite  = r.totalPnl > 5000 && a.wr >= 50 ? ' ← 🏆 ELITE' : '';
    console.log(`${prefix} $${r.totalPnl.toLocaleString().padStart(12)} | ${r.address.slice(0,14)} | trades:${String(r.totalTrades).padStart(3)} | WR:${a.wr}% ROI:${a.roi}%${elite}`);
  }

  // Update DB with real scores
  console.log('\n\nUpdating DB with real performance data...');
  for (const r of results) {
    const a = r.allStats;
    const isElite = r.totalPnl > 5000 && (a.wr >= 50 || r.stats6mo.wr >= 55);
    const alias = isElite
      ? `🏆${r.address.slice(2,8).toUpperCase()}`
      : r.totalPnl > 0 
        ? `🟢${r.address.slice(2,8).toUpperCase()}`
        : `🦈${r.address.slice(2,8).toUpperCase()}`;

    await dbUpsert('polymarket_whales', {
      address: r.address,
      alias,
      win_rate_30d: r.stats6mo.wr || a.wr || 0,
      roi_30d: r.stats6mo.roi || a.roi || 0,
      total_profit: r.totalPnl,
      total_trades_seen: freq[r.address] || 0,
      trades_tracked: r.totalTrades,
      is_active: true,
      is_elite: isElite,
      last_checked: new Date().toISOString(),
    });
  }

  const elites = results.filter(r => r.totalPnl > 5000 && (r.allStats.wr >= 50 || r.stats6mo.wr >= 55));
  console.log(`\n✅ DB updated. Elite wallets confirmed: ${elites.length}`);

  // Print position field structure
  if (results.find(r => r.samplePos)) {
    const sp = results.find(r => r.samplePos).samplePos;
    console.log('\nPosition fields:', Object.keys(sp).join(', '));
    console.log('Sample pos:', JSON.stringify(sp).slice(0, 400));
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
