// scripts/register-sniper-webhook.js
//
// Registers (or re-registers) the Helius webhook that feeds
// sniper-helius-webhook. Run this once after deploying the edge function,
// and again any time you rotate HELIUS_API_KEY or SNIPER_WEBHOOK_AUTH.
//
// Usage:
//   HELIUS_API_KEY=... SNIPER_WEBHOOK_AUTH=... node scripts/register-sniper-webhook.js
//
// Both env vars are required on purpose — this script does NOT hardcode a
// key the way the existing register-helius-webhook.js does (that file has
// a key embedded in it that doesn't match your current active Helius key;
// worth deleting or rewriting the same way once this is confirmed working).

const https = require('https');

const KEY        = process.env.HELIUS_API_KEY;
const AUTH        = process.env.SNIPER_WEBHOOK_AUTH;
const EDGE_URL    = process.env.EDGE_URL || 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/sniper-helius-webhook';
const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'; // verified — see prior audit

if (!KEY)  { console.error('Set HELIUS_API_KEY'); process.exit(1); }
if (!AUTH) { console.error('Set SNIPER_WEBHOOK_AUTH — pick any random string, it must match the SNIPER_WEBHOOK_AUTH secret on the edge function'); process.exit(1); }

const call = (method, path, body) => new Promise((res, rej) => {
  const b = body ? JSON.stringify(body) : null;
  const req = https.request(
    { hostname: 'api.helius.xyz', path: `${path}?api-key=${KEY}`, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': b ? Buffer.byteLength(b) : 0 } },
    (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res({ s: r.statusCode, d: JSON.parse(d) }); } catch { res({ s: r.statusCode, d }); } }); }
  );
  req.on('error', rej);
  if (b) req.write(b);
  req.end();
});

(async () => {
  console.log('Listing existing webhooks...');
  const list = await call('GET', '/v0/webhooks');
  const hooks = Array.isArray(list.d) ? list.d : [];
  console.log('Found', hooks.length, 'webhooks total.');

  const existing = hooks.find((h) => h.webhookURL === EDGE_URL);
  if (existing) {
    console.log('Deleting previous sniper webhook', existing.webhookID, '...');
    await call('DELETE', `/v0/webhooks/${existing.webhookID}`);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('Registering RAW webhook on the pump.fun program...');
  const reg = await call('POST', '/v0/webhooks', {
    webhookURL: EDGE_URL,
    transactionTypes: ['ANY'],
    accountAddresses: [PUMP_PROGRAM],
    webhookType: 'raw',       // lower latency than 'enhanced' — see SKILL notes in sniper-helius-webhook
    authHeader: AUTH,
    txnStatus: 'success',
  });

  if (reg.s === 200 || reg.s === 201) {
    console.log('SUCCESS — webhookID:', reg.d.webhookID);
    console.log('');
    console.log('IMPORTANT: this fires on EVERY successful pump.fun transaction, not just');
    console.log('creates — the edge function filters down to creates itself. Watch your');
    console.log('Helius credit usage for the first hour after registering; pump.fun is a');
    console.log('very high-volume program and this is a different cost profile than');
    console.log('watching 2-3 specific wallets the way shreem-helius-webhook does.');
  } else {
    console.log('FAILED:', reg.s, JSON.stringify(reg.d).slice(0, 300));
    process.exit(1);
  }
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
