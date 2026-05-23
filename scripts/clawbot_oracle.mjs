#!/usr/bin/env node
/**
 * SQI-2050 CLAWBOT v2 — Real On-Chain Whale Tracker
 * Scans Polymarket's CLOB contract on Polygon for large trades
 * Identifies whale wallets, mirrors their positions in paper mode
 * Same infrastructure as Shiesty Finance's "Prediction Shark"
 */

const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY;
const POLYGON_RPC    = process.env.POLYGON_RPC_URL;
const PAPER_MODE     = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_USDC       = parseFloat(process.env.MIN_TRADE_USDC || '300'); // min $300 = whale signal

if (!SUPABASE_URL || !SUPABASE_KEY || !POLYGON_RPC) {
  console.error('FATAL: missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or POLYGON_RPC_URL');
  process.exit(1);
}

// ── Polymarket contract addresses on Polygon ──────────────────────────────────
const CLOB_CONTRACT  = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982'; // CTF Exchange
const CLOB_V2        = '0xC5d563A36AE78145C45a50134d48A1215220f80a'; // Neg Risk Exchange
const USDC_POLYGON   = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // USDC.e (6 decimals)
const USDC_NATIVE    = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // Native USDC

// OrderFilled(bytes32,address,address,uint256,uint256,uint256,uint256,uint256)
const ORDER_FILLED_TOPIC = '0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c6e6d8e2e2e2a1b3c5d7f9a1b3';

const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const GAMMA = 'https://gamma-api.polymarket.com';

// ── Polygon RPC call ─────────────────────────────────────────────────────────
async function rpc(method, params = []) {
  const r = await fetch(POLYGON_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
  });
  const d = await r.json();
  if (d.error) throw new Error(`RPC error: ${JSON.stringify(d.error)}`);
  return d.result;
}

// ── Supabase helpers ─────────────────────────────────────────────────────────
async function dbGet(table, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: SB });
  const t = await r.text();
  if (!r.ok) { console.error(`GET ${table}: ${r.status}`); return []; }
  return JSON.parse(t);
}
async function dbInsert(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  });
  if (!r.ok && r.status !== 409) console.error(`INSERT ${table}: ${r.status} ${(await r.text()).slice(0,150)}`);
  return r.ok || r.status === 409;
}
async function dbPatch(table, id, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...SB, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.ok;
}

// ── Decode hex to address ────────────────────────────────────────────────────
const toAddr  = hex => '0x' + hex.slice(-40).toLowerCase();
const hexToN  = hex => BigInt(hex);
const usdcAmt = wei => Number(hexToN(wei)) / 1e6; // USDC has 6 decimals

// ── Get Polymarket market info from token ID ─────────────────────────────────
async function getMarketByToken(tokenId) {
  try {
    const r = await fetch(`${GAMMA}/markets?clob_token_ids=${tokenId}&limit=1`);
    if (!r.ok) return null;
    const [m] = await r.json();
    if (!m) return null;
    let prices = [0.5, 0.5], names = ['Yes', 'No'];
    try { prices = JSON.parse(m.outcomePrices); } catch {}
    try { names  = JSON.parse(m.outcomes); } catch {}
    let tokenIds = ['', ''];
    try { tokenIds = JSON.parse(m.clobTokenIds); } catch {}
    const idx = tokenIds.indexOf(tokenId);
    const price = idx >= 0 ? parseFloat(prices[idx]) : 0.5;
    const outcome = idx >= 0 ? names[idx] : 'Yes';
    return {
      id: m.id, question: m.question, price, outcome,
      liquidity: parseFloat(m.liquidity) || 0,
      volume: parseFloat(m.volume) || 0,
    };
  } catch { return null; }
}

// ── Scan Polygon blocks for large Polymarket trades ──────────────────────────
async function scanRecentTrades() {
  const latestHex  = await rpc('eth_blockNumber');
  const latest     = parseInt(latestHex, 16);
  // ~15 min of Polygon blocks (2s/block = ~450 blocks)
  const fromBlock  = latest - 450;

  console.log(`\nScanning blocks ${fromBlock.toLocaleString()} → ${latest.toLocaleString()} (~15 min)`);

  const trades = [];

  for (const contract of [CLOB_CONTRACT, CLOB_V2]) {
    let logs;
    try {
      logs = await rpc('eth_getLogs', [{
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock:   latestHex,
        address:   contract,
        // Get all events — we'll filter by size
      }]);
    } catch(e) {
      console.log(`  ${contract.slice(0,10)} getLogs error: ${e.message}`);
      continue;
    }

    console.log(`  ${contract.slice(0,10)}: ${logs.length} events`);

    for (const log of logs) {
      try {
        const topics = log.topics || [];
        const data   = log.data || '0x';

        // Extract addresses from topics (maker is topics[2], taker is topics[3])
        const maker = topics[2] ? toAddr(topics[2]) : null;
        if (!maker) continue;

        // Parse data field — contains amounts
        // data layout: makerAssetId(32) + takerAssetId(32) + makerAmt(32) + takerAmt(32) + fee(32)
        const raw = data.slice(2); // remove 0x
        if (raw.length < 320) continue; // need at least 5 x 32 bytes

        const makerAmt = usdcAmt('0x' + raw.slice(128, 192)); // bytes 64-96
        const takerAmt = usdcAmt('0x' + raw.slice(192, 256)); // bytes 96-128

        // The larger of the two amounts is the USDC side
        const usdcSize = Math.max(makerAmt, takerAmt);

        if (usdcSize < MIN_USDC) continue; // skip small trades

        // Token ID is one of the asset IDs
        const makerAssetId = '0x' + raw.slice(0, 64);
        const tokenId = BigInt(makerAssetId).toString();

        trades.push({
          txHash:  log.transactionHash,
          block:   parseInt(log.blockNumber, 16),
          maker,
          usdcSize,
          tokenId,
          contract,
        });
      } catch {}
    }
  }

  // Sort by size descending
  return trades.sort((a, b) => b.usdcSize - a.usdcSize);
}

// ── Track wallet win rate ────────────────────────────────────────────────────
async function getOrCreateWhale(address) {
  const existing = await dbGet('polymarket_whales', `address=eq.${address}&limit=1`);
  if (existing.length > 0) return existing[0];

  // New whale discovered on-chain — insert with 0 stats (will build over time)
  await dbInsert('polymarket_whales', {
    address,
    alias: `OnChain-${address.slice(2,8).toUpperCase()}`,
    win_rate_30d: 0,
    roi_30d: 0,
    is_active: true,
  });
  const [whale] = await dbGet('polymarket_whales', `address=eq.${address}&limit=1`);
  return whale;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT v2 — On-Chain Whale Scanner');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
  console.log(`  Min trade size: $${MIN_USDC} USDC`);
  console.log('══════════════════════════════════════════════════════');

  // Load settings
  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1');
  if (!settings) { console.error('No settings row'); process.exit(1); }
  let balance = parseFloat(settings.paper_balance);
  console.log(`Balance: $${balance.toFixed(2)}`);

  // Load seen trade hashes
  const seenRows = await dbGet('polymarket_seen_trades', 'limit=1000&order=detected_at.desc');
  const seenTx   = new Set(seenRows.map(r => r.trade_id));
  console.log(`Already seen: ${seenTx.size} trades`);

  // Scan on-chain
  console.log('\n🔍 Scanning Polygon blockchain...');
  let rawTrades;
  try {
    rawTrades = await scanRecentTrades();
  } catch(e) {
    console.error('Scan failed:', e.message);
    process.exit(1);
  }

  console.log(`\nLarge trades found (>$${MIN_USDC}): ${rawTrades.length}`);
  rawTrades.slice(0, 5).forEach(t =>
    console.log(`  $${t.usdcSize.toFixed(0)} | ${t.maker.slice(0,10)} | tx ${t.txHash.slice(0,12)}`)
  );

  // Process new trades only
  const newTrades = rawTrades.filter(t => !seenTx.has(t.txHash));
  console.log(`New (unseen) trades: ${newTrades.length}`);

  let mirrored = 0;

  for (const trade of newTrades.slice(0, 10)) {
    // Mark as seen immediately (prevent double-processing)
    await dbInsert('polymarket_seen_trades', {
      trade_id: trade.txHash,
      whale_address: trade.maker,
    });
    seenTx.add(trade.txHash);

    // Get/create whale record
    const whale = await getOrCreateWhale(trade.maker);

    // Fetch market info from Gamma API
    const market = await getMarketByToken(trade.tokenId);

    const question = market?.question || `Market token ${trade.tokenId.slice(0,12)}`;
    const price    = market?.price    || 0.5;
    const outcome  = market?.outcome  || 'Yes';

    // Only mirror if price is in tradeable zone (not already resolved)
    if (price < 0.05 || price > 0.95) {
      console.log(`\n  SKIP (price ${(price*100).toFixed(0)}% near resolution): ${question.slice(0,50)}`);
      continue;
    }

    if (balance < 0.25) {
      console.log('  SKIP: balance too low');
      continue;
    }

    const size   = parseFloat(Math.min(1.00, balance * 0.05).toFixed(4));
    const newBal = parseFloat((balance - size).toFixed(4));
    const txHash = `clawbot-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const wr     = whale?.win_rate_30d || 0;
    const roi    = whale?.roi_30d || 0;

    const reason = `[🦈CLAWBOT] ${whale?.alias || trade.maker.slice(0,10)} (${wr}%WR|+${roi}%ROI) BUY ${outcome} @ $${price.toFixed(3)} | Whale: $${trade.usdcSize.toFixed(0)} USDC | ${question.slice(0,70)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id:       market?.id || trade.tokenId.slice(0,20),
      market_question: reason,
      outcome,
      token_id:        trade.tokenId.slice(0,50),
      direction:       'buy',
      shares:          parseFloat((size / price).toFixed(4)),
      entry_price:     price,
      amount_usdc:     size,
      tx_hash:         txHash,
      strategy:        'clawbot_onchain',
      is_paper:        true,
      status:          'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settings.id, {
        paper_balance: newBal,
        updated_at: new Date().toISOString(),
      });
      balance = newBal;
      mirrored++;

      console.log(`\n  ✅ MIRRORED WHALE TRADE #${mirrored}`);
      console.log(`     Wallet: ${trade.maker.slice(0,10)}... | Whale size: $${trade.usdcSize.toFixed(0)}`);
      console.log(`     BUY ${outcome} @ ${(price*100).toFixed(1)}% | Mirror: $${size} | Bal: $${newBal}`);
      console.log(`     ${question.slice(0,80)}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n━━━ CLAWBOT v2 Complete ━━━`);
  console.log(`  On-chain trades scanned: ${rawTrades.length}`);
  console.log(`  New trades processed: ${newTrades.length}`);
  console.log(`  Mirrored: ${mirrored}`);
  console.log(`  Balance: $${balance.toFixed(4)}`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
