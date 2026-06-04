#!/usr/bin/env node
// Deep probe: find wallet history endpoints

const ADDR = '0x5f659bccbc4510e7be4f15b4e5b7fa54e3fd1e5e';
const DATA = 'https://data-api.polymarket.com';
const GAMMA = 'https://gamma-api.polymarket.com';

const endpoints = [
  // Data API variants
  `${DATA}/activity?user=${ADDR}&limit=20`,
  `${DATA}/activity?user=${ADDR}&limit=20&type=TRADE`,
  `${DATA}/trades?user=${ADDR}&limit=20`,
  `${DATA}/orders?user=${ADDR}&limit=20`,
  `${DATA}/pnl?user=${ADDR}`,
  `${DATA}/earnings?user=${ADDR}`,
  `${DATA}/history?user=${ADDR}&limit=20`,
  `${DATA}/user-market-trades?user=${ADDR}&limit=10`,
  // Gamma API variants  
  `${GAMMA}/activity?user=${ADDR}&limit=10`,
  `${GAMMA}/trades?makerAddress=${ADDR}&limit=10`,
  `${GAMMA}/portfolio?user=${ADDR}`,
  // CLOB
  `https://clob.polymarket.com/trades?maker_address=${ADDR}&limit=10`,
];

for (const url of endpoints) {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    const text = await r.text();
    const preview = text.slice(0, 200).replace(/\n/g,' ');
    console.log(`${r.status} | ${url.replace('https://','').slice(0,60)}`);
    if (r.ok && text.length > 5) console.log(`    → ${preview}`);
  } catch(e) {
    console.log(`ERR | ${url.replace('https://','').slice(0,60)} | ${e.message}`);
  }
}
