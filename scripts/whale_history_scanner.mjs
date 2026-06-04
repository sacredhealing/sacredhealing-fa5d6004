#!/usr/bin/env node

const ADDR = '0x5f659bccbc4510e7be4f15b4e5b7fa54e3fd1e5e';
const DATA = 'https://data-api.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// Get full activity history
console.log('=== ACTIVITY ===');
const activity = await get(`${DATA}/activity?user=${ADDR}&limit=100&sortBy=timestamp&sortDirection=DESC`);
console.log(JSON.stringify(activity, null, 2).slice(0, 3000));

console.log('\n=== TRADES ===');
const trades = await get(`${DATA}/trades?user=${ADDR}&limit=50`);
console.log(JSON.stringify(trades, null, 2).slice(0, 3000));

console.log('\n=== POSITIONS ===');
const pos = await get(`${DATA}/positions?user=${ADDR}&limit=50`);
console.log(JSON.stringify(pos, null, 2).slice(0, 2000));
