#!/usr/bin/env node
/**
 * SQI-2050 CLAWBOT v3 — Polygon Whale Scanner (10-block pagination)
 * Alchemy free tier: max 10 blocks per eth_getLogs call
 * We paginate: 45 calls × 10 blocks = 450 blocks (~15 min of Polygon)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLYGON_RPC  = process.env.POLYGON_RPC_URL;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_USDC     = parseFloat(process.env.MIN_TRADE_USDC || '300');

if (!SUPABASE_URL || !SUPABASE_KEY || !POLYGON_RPC) {
  console.error('FATAL: missing env vars'); process.exit(1);
}

// Polymarket CLOB contracts on Polygon
const CONTRACTS = [
  '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982',
  '0xC5d563A36AE78145C45a50134d48A1215220f80a',
];
const GAMMA = 'https://gamma-api.polymarket.com';
const SB    = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function rpc(method, params = []) {
  const r = await fetch(POLYGON_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
  return d.result;
}

async function dbGet(table, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: SB });
  if (!r.ok) { console.error(`GET ${table}: ${r.status}`); return []; }
  return r.json();
}
async function dbInsert(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  });
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

const toAddr  = h => '0x' + h.slice(-40).toLowerCase();
const hexToN  = h => BigInt(h || '0x0');
const usdcAmt = h => Number(hexToN(h)) / 1e6;

async function getMarketByToken(tokenId) {
  try {
    const tid = BigInt(tokenId).toString();
    const r = await fetch(`${GAMMA}/markets?clob_token_ids=${tid}&limit=1`);
    if (!r.ok) return null;
    const data = await r.json();
    const m = Array.isArray(data) ? data[0] : null;
    if (!m) return null;
    let prices = [0.5, 0.5], names = ['Yes', 'No'], tokenIds = ['', ''];
    try { prices   = JSON.parse(m.outcomePrices); } catch {}
    try { names    = JSON.parse(m.outcomes);      } catch {}
    try { tokenIds = JSON.parse(m.clobTokenIds);  } catch {}
    const numTid = tid;
    const idx    = tokenIds.indexOf(numTid);
    return {
      id: m.id, question: m.question,
      price:   idx >= 0 ? parseFloat(prices[idx])  : 0.5,
      outcome: idx >= 0 ? names[idx]               : 'Yes',
    };
  } catch { return null; }
}

// Paginated log scan — 10 blocks at a time
async function scanLogs(fromBlock, toBlock, contract) {
  const allLogs = [];
  const CHUNK   = 9; // stay under 10-block limit

  for (let b = fromBlock; b <= toBlock; b += CHUNK) {
    const end = Math.min(b + CHUNK - 1, toBlock);
    try {
      const logs = await rpc('eth_getLogs', [{
        fromBlock: '0x' + b.toString(16),
        toBlock:   '0x' + end.toString(16),
        address:   contract,
      }]);
      allLogs.push(...logs);
    } catch(e) {
      // Skip bad chunk silently
    }
    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 50));
  }
  return allLogs;
}

function parseTrade(log, contract) {
  const topics = log.topics || [];
  const data   = (log.data || '').slice(2);
  if (data.length < 320) return null;

  const maker = topics[2] ? toAddr(topics[2]) : null;
  if (!maker) return null;

  // Parse 5 uint256 values from data
  const chunks = [];
  for (let i = 0; i < 5; i++) chunks.push('0x' + data.slice(i * 64, i * 64 + 64));

  const makerAssetId  = chunks[0]; // token ID or USDC
  const takerAssetId  = chunks[1];
  const makerAmtFill  = usdcAmt(chunks[2]);
  const takerAmtFill  = usdcAmt(chunks[3]);

  // One side is USDC (6 dec), other is shares — USDC amount is the cost
  const usdcSize = Math.max(makerAmtFill, takerAmtFill);

  if (usdcSize < MIN_USDC) return null;

  // Token ID: use whichever assetId is NOT a round power-of-2 (USDC tokenId pattern)
  let tokenId = BigInt(makerAssetId).toString();

  return {
    txHash:   log.transactionHash,
    block:    parseInt(log.blockNumber, 16),
    maker,
    usdcSize,
    tokenId,
    contract,
  };
}

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT v3 — On-Chain Whale Tracker');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
  console.log(`  Min whale trade: $${MIN_USDC} USDC`);
  console.log('══════════════════════════════════════════════════════');

  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1');
  if (!settings) { console.error('No settings'); process.exit(1); }
  let balance = parseFloat(settings.paper_balance);
  console.log(`Balance: $${balance.toFixed(2)}`);

  const seenRows = await dbGet('polymarket_seen_trades', 'limit=2000&order=detected_at.desc');
  const seenTx   = new Set(seenRows.map(r => r.trade_id));

  // Get latest block
  const latestHex = await rpc('eth_blockNumber');
  const latest    = parseInt(latestHex, 16);
  const fromBlock = latest - 450; // ~15 min

  console.log(`\n🔍 Scanning ${fromBlock.toLocaleString()} → ${latest.toLocaleString()} (450 blocks)`);
  console.log(`  Using 10-block chunks (${Math.ceil(450/9)} API calls per contract)`);

  const allTrades = [];

  for (const contract of CONTRACTS) {
    console.log(`\n  Contract: ${contract.slice(0,12)}...`);
    const logs = await scanLogs(fromBlock, latest, contract);
    console.log(`  Total logs: ${logs.length}`);

    let parsed = 0;
    for (const log of logs) {
      const trade = parseTrade(log, contract);
      if (trade) { allTrades.push(trade); parsed++; }
    }
    console.log(`  Whale trades (>$${MIN_USDC}): ${parsed}`);
  }

  // Sort by size
  allTrades.sort((a, b) => b.usdcSize - a.usdcSize);

  console.log(`\n📊 Top whale trades this window:`);
  allTrades.slice(0, 10).forEach(t =>
    console.log(`  $${t.usdcSize.toFixed(0).padStart(8)} | ${t.maker.slice(0,12)} | block ${t.block}`)
  );

  const newTrades = allTrades.filter(t => !seenTx.has(t.txHash));
  console.log(`\nNew trades to process: ${newTrades.length}`);

  let mirrored = 0;

  for (const trade of newTrades.slice(0, 5)) {
    await dbInsert('polymarket_seen_trades', {
      trade_id: trade.txHash,
      whale_address: trade.maker,
    });

    // Get whale stats
    const whales = await dbGet('polymarket_whales', `address=eq.${trade.maker}&limit=1`);
    const whale  = whales[0];

    // Auto-register new whale wallets
    if (!whale) {
      await dbInsert('polymarket_whales', {
        address: trade.maker,
        alias:   `🦈${trade.maker.slice(2,8).toUpperCase()}`,
        win_rate_30d: 0, roi_30d: 0, is_active: true,
      });
    }

    const wr  = whale?.win_rate_30d || 0;
    const roi = whale?.roi_30d || 0;
    const alias = whale?.alias || `🦈${trade.maker.slice(2,8).toUpperCase()}`;

    // Fetch market info
    const market  = await getMarketByToken(trade.tokenId);
    const question= market?.question || `Unknown market`;
    const price   = market?.price    || 0.5;
    const outcome = market?.outcome  || 'Yes';

    // Skip near-resolved markets
    if (price < 0.05 || price > 0.95) {
      console.log(`\n  ⏭ SKIP near-resolved (${(price*100).toFixed(0)}%): ${question.slice(0,50)}`);
      continue;
    }

    if (balance < 0.25) { console.log('  ⏭ SKIP: balance too low'); break; }

    const size   = parseFloat(Math.min(1.00, balance * 0.05).toFixed(4));
    const newBal = parseFloat((balance - size).toFixed(4));
    const txHash = `clawbot-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

    const reason = `[🦈CLAWBOT] ${alias} (${wr}%WR|+${roi}%ROI) BUY ${outcome} @ $${price.toFixed(3)} | Whale: $${trade.usdcSize.toFixed(0)} | ${question.slice(0,70)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id:       market?.id || trade.txHash.slice(0,20),
      market_question: reason,
      outcome, token_id: trade.tokenId.slice(0,50),
      direction: 'buy',
      shares:    parseFloat((size / price).toFixed(4)),
      entry_price: price,
      amount_usdc: size,
      tx_hash:   txHash,
      strategy:  'clawbot_onchain',
      is_paper:  true,
      status:    'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settings.id, {
        paper_balance: newBal,
        updated_at: new Date().toISOString(),
      });
      balance = newBal;
      mirrored++;
      console.log(`\n  ✅ MIRRORED #${mirrored}`);
      console.log(`     ${alias} | Whale: $${trade.usdcSize.toFixed(0)} → Mirror: $${size}`);
      console.log(`     BUY ${outcome} @ ${(price*100).toFixed(1)}% | Bal: $${newBal}`);
      console.log(`     ${question.slice(0,80)}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n━━━ CLAWBOT v3 Done: ${mirrored} mirrored | Bal $${balance.toFixed(4)} ━━━`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
