#!/usr/bin/env node
/**
 * SQI-2050 🦈 WHALE HISTORY SCANNER
 * Queries Polymarket Gamma API + Data API for wallet performance history
 * Scores wallets on: 12-month ROI, 6-month ROI, win rate, volume, consistency
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const GAMMA   = 'https://gamma-api.polymarket.com';
const DATA_API = 'https://data-api.polymarket.com';
const CLOB    = 'https://clob.polymarket.com';

async function dbGet(t, q = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`, { headers: SB });
  return r.ok ? r.json() : [];
}
async function dbPatch(t, id, d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`, {
    method: 'PATCH', headers: { ...SB, 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
  return r.ok;
}
async function dbUpsert(t, d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?on_conflict=address`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(d),
  });
  return r.ok;
}

async function fetchJSON(url) {
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// Get wallet activity from Polymarket data API
async function getWalletProfile(address) {
  const addr = address.toLowerCase();
  
  // Try data API - profile endpoint
  const profile = await fetchJSON(`${DATA_API}/profile?user=${addr}`);
  
  // Try data API - positions
  const positions = await fetchJSON(`${DATA_API}/positions?user=${addr}&limit=100&sortBy=cashPnl&sortDirection=DESC`);
  
  // Try gamma API
  const gammaProfile = await fetchJSON(`${GAMMA}/profiles?address=${addr}`);
  
  return { profile, positions, gammaProfile };
}

// Get top traders from Polymarket leaderboard
async function getTopTraders() {
  const results = [];
  
  // Try leaderboard endpoints
  const lb1 = await fetchJSON(`${DATA_API}/leaderboard?interval=1m&limit=50`);
  const lb6 = await fetchJSON(`${DATA_API}/leaderboard?interval=6m&limit=50`);
  const lb12 = await fetchJSON(`${DATA_API}/leaderboard?interval=1y&limit=50`);
  
  // Try activity-based discovery
  const topActivity = await fetchJSON(`${DATA_API}/activity?limit=50&side=BUY&sortBy=cashVolume&sortDirection=DESC`);
  
  return { lb1, lb6, lb12, topActivity };
}

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  SQI WHALE HISTORY SCANNER');
  console.log(`  ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════');

  // 1. Get top traders from Polymarket APIs
  console.log('\n📡 Querying Polymarket leaderboards...');
  const topData = await getTopTraders();
  
  console.log('Leaderboard 1m:', topData.lb1 ? JSON.stringify(topData.lb1).slice(0,200) : 'null');
  console.log('Leaderboard 6m:', topData.lb6 ? JSON.stringify(topData.lb6).slice(0,200) : 'null');
  console.log('Leaderboard 1y:', topData.lb12 ? JSON.stringify(topData.lb12).slice(0,200) : 'null');
  console.log('Top Activity:', topData.topActivity ? JSON.stringify(topData.topActivity).slice(0,300) : 'null');

  // 2. Check our existing elite wallets
  const whales = await dbGet('polymarket_whales', 'is_elite=eq.true');
  console.log(`\n🦈 Checking ${whales.length} elite wallets...`);

  for (const whale of whales) {
    console.log(`\n--- ${whale.alias} | ${whale.address} ---`);
    const data = await getWalletProfile(whale.address);
    console.log('Profile:', data.profile ? JSON.stringify(data.profile).slice(0,300) : 'null');
    console.log('Positions:', data.positions ? JSON.stringify(data.positions).slice(0,300) : 'null');
    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
