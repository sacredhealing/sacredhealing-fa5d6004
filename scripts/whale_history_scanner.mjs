#!/usr/bin/env node
// Probe every known Polymarket endpoint to find what's reachable

const endpoints = [
  'https://gamma-api.polymarket.com/events?limit=1',
  'https://gamma-api.polymarket.com/markets?limit=1',
  'https://gamma-api.polymarket.com/profiles?address=0x5f659bccbc4510e7be4f15b4e5b7fa54e3fd1e5e',
  'https://clob.polymarket.com/markets?limit=1',
  'https://clob.polymarket.com/sampling-markets?limit=1',
  'https://data-api.polymarket.com/leaderboard?interval=1y&limit=5',
  'https://data-api.polymarket.com/activity?limit=5',
  'https://data-api.polymarket.com/positions?user=0x5f659bccbc4510e7be4f15b4e5b7fa54e3fd1e5e',
  'https://data-api.polymarket.com/profit?user=0x5f659bccbc4510e7be4f15b4e5b7fa54e3fd1e5e',
  'https://polymarket.com/api/leaderboard?interval=all&limit=5',
  'https://polymarket.com/api/profile/0x5f659bccbc4510e7be4f15b4e5b7fa54e3fd1e5e',
  'https://lb.polymarket.com/v2/leaderboard?window=all&limit=50',
  'https://lb.polymarket.com/leaderboard?window=all&limit=50',
  'https://user-data.polymarket.com/positions?user=0x5f659bccbc4510e7be4f15b4e5b7fa54e3fd1e5e',
];

for (const url of endpoints) {
  try {
    const r = await fetch(url, { 
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000)
    });
    const text = await r.text();
    console.log(`\n✅ ${r.status} | ${url}`);
    console.log(`   ${text.slice(0,150)}`);
  } catch(e) {
    console.log(`❌ FAIL | ${url} | ${e.message}`);
  }
}
