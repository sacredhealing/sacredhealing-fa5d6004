/**
 * Probe Polymarket CLOB API for public endpoints
 * that expose large traders without auth
 */
const CLOB = 'https://clob.polymarket.com';
const DATA = 'https://data-api.polymarket.com';

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    return { status: r.status, body: text.slice(0, 300) };
  } catch(e) { return { status: 0, body: e.message }; }
}

const endpoints = [
  // CLOB public endpoints
  `${CLOB}/trades?limit=10`,
  `${CLOB}/trades?limit=10&maker_address=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73`,
  `${CLOB}/trades?limit=10&taker_address=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73`,
  `${CLOB}/books?token_id=21742633143463906290569050155826241533067272736897614950488156847949938836455`,
  `${CLOB}/last-trade-price?token_id=21742633143463906290569050155826241533067272736897614950488156847949938836455`,
  `${CLOB}/tick-size?token_id=21742633143463906290569050155826241533067272736897614950488156847949938836455`,
  `${CLOB}/sampling-markets?limit=5`,
  `${CLOB}/sampling-simplified-markets?limit=5`,
  // Data API - undiscovered endpoints
  `${DATA}/trades?user=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73&limit=5&sortBy=timestamp&sortDirection=DESC`,
  `${DATA}/positions?user=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73&limit=5&sortBy=cashPnl&sortDirection=DESC`,
  // Gamma public
  `https://gamma-api.polymarket.com/profiles?address=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73`,
  `https://gamma-api.polymarket.com/profiles?id=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73`,
];

console.log('=== CLOB API Public Endpoint Probe ===\n');
for (const url of endpoints) {
  const r = await get(url);
  const label = r.status === 200 ? '✅' : r.status === 401 ? '🔑' : r.status === 404 ? '❌' : `${r.status}`;
  console.log(`${label} ${url.replace('https://','').slice(0,65)}`);
  if (r.status === 200) console.log(`   → ${r.body}`);
  await new Promise(r=>setTimeout(r,150));
}

// Check auth requirements
console.log('\n=== Auth requirement check ===');
const authCheck = await get(`${CLOB}/auth/type?address=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73`);
console.log('Auth type:', authCheck.status, authCheck.body.slice(0,200));

// Check if CLOB trades endpoint works without auth for reading
const clobTrades = await get(`${CLOB}/trades?maker_address=0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73&limit=20`);
console.log('\nCLOB trades (BAA2BC):', clobTrades.status, clobTrades.body.slice(0,400));

const clobTrades2 = await get(`${CLOB}/trades?taker_address=0xb2a3623364c33561d8312e1edb79eb941c798510&limit=20`);
console.log('\nCLOB trades (B2A362):', clobTrades2.status, clobTrades2.body.slice(0,400));
