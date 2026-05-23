#!/usr/bin/env node
/**
 * SQI-2050 CLAWBOT v5 — Fixed V2 Decoder + File Output
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLYGON_RPC  = process.env.POLYGON_RPC_URL;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_USDC     = parseFloat(process.env.MIN_TRADE_USDC || '200');
const fs           = await import('fs');

if (!SUPABASE_URL || !SUPABASE_KEY || !POLYGON_RPC) {
  console.error('FATAL: missing env vars'); process.exit(1);
}

const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
const GAMMA = 'https://gamma-api.polymarket.com';
const SB    = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const MAX_USDC = 10_000_000; // cap at $10M to filter overflows
const PUSED_DECIMALS = 1e6;  // pUSD = 6 decimals

async function rpc(method, params = []) {
  const r = await fetch(POLYGON_RPC, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.result;
}

async function dbGet(table, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: SB });
  if (!r.ok) return [];
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
    method: 'PATCH', headers: { ...SB, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.ok;
}

// Safe BigInt to number with overflow protection
function safeNum(hexStr) {
  try {
    const b = BigInt('0x' + hexStr);
    // If > 1e13 (10 trillion pUSD micro-units = $10M), it's not an amount
    if (b > BigInt('10000000000000')) return null;
    return Number(b) / PUSED_DECIMALS;
  } catch { return null; }
}

const toAddr = h => '0x' + h.slice(-40).toLowerCase();

// Decode V2 OrderFilled event
// topics: [eventSig, orderHash(indexed), maker(indexed), taker(indexed)]  
// data: tokenId(32 bytes) + makerAmtFilled(32) + takerAmtFilled(32) + fee(32)
function decodeLog(log) {
  const topics = log.topics || [];
  const raw    = (log.data || '').slice(2);

  // Need at least 4 topics + 4 data words
  if (topics.length < 3 || raw.length < 256) return null;

  const maker   = toAddr(topics[2]);
  if (!maker || maker === '0x' + '0'.repeat(40)) return null;

  // data layout for V2 OrderFilled:
  // word 0 (0..63):   tokenId
  // word 1 (64..127): makerAmountFilled
  // word 2 (128..191): takerAmountFilled
  // word 3 (192..255): fee
  const tokenIdHex      = raw.slice(0, 64);
  const makerAmtHex     = raw.slice(64, 128);
  const takerAmtHex     = raw.slice(128, 192);

  const makerAmt = safeNum(makerAmtHex);
  const takerAmt = safeNum(takerAmtHex);

  // At least one side must be a valid USDC amount
  if (makerAmt === null && takerAmt === null) return null;

  const usdcSize = Math.max(makerAmt ?? 0, takerAmt ?? 0);
  if (usdcSize < MIN_USDC || usdcSize > MAX_USDC) return null;

  // TokenId is a large uint256 — keep as string
  let tokenId = '0';
  try { tokenId = BigInt('0x' + tokenIdHex).toString(); } catch {}

  return {
    txHash:   log.transactionHash,
    block:    parseInt(log.blockNumber, 16),
    maker,
    usdcSize,
    tokenId,
    makerAmt: makerAmt ?? 0,
    takerAmt: takerAmt ?? 0,
  };
}

async function scanContract(contract, fromBlock, toBlock) {
  const trades = [];
  const CHUNK  = 9;
  let totalLogs = 0, rawSamples = [];

  for (let b = fromBlock; b <= toBlock; b += CHUNK) {
    const end = Math.min(b + CHUNK - 1, toBlock);
    try {
      const logs = await rpc('eth_getLogs', [{
        fromBlock: '0x' + b.toString(16),
        toBlock:   '0x' + end.toString(16),
        address:   contract,
      }]);
      totalLogs += logs.length;

      // Save first few logs as samples for debugging
      if (rawSamples.length < 2) rawSamples.push(...logs.slice(0, 2));

      for (const log of logs) {
        const trade = decodeLog(log);
        if (trade) trades.push(trade);
      }
    } catch {}
    await new Promise(r => setTimeout(r, 60));
  }
  return { trades, totalLogs, rawSamples };
}

async function getMarket(tokenId) {
  if (!tokenId || tokenId === '0' || tokenId === '1') return null;
  try {
    const r = await fetch(`${GAMMA}/markets?clob_token_ids=${tokenId}&limit=1`);
    if (!r.ok) return null;
    const arr = await r.json();
    const m   = Array.isArray(arr) ? arr[0] : null;
    if (!m) return null;
    let prices = [0.5, 0.5], names = ['Yes','No'], tids = ['',''];
    try { prices = JSON.parse(m.outcomePrices); } catch {}
    try { names  = JSON.parse(m.outcomes);      } catch {}
    try { tids   = JSON.parse(m.clobTokenIds);  } catch {}
    const idx = tids.indexOf(tokenId);
    return {
      id: m.id, question: m.question,
      price:   idx >= 0 ? parseFloat(prices[idx]) : 0.5,
      outcome: idx >= 0 ? names[idx] : 'Yes',
    };
  } catch { return null; }
}

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT v5 — Fixed V2 Decoder');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
  console.log(`  Min: $${MIN_USDC} | Max: $${MAX_USDC}`);
  console.log('══════════════════════════════════════════════════════');

  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1');
  if (!settings) { console.error('No settings'); process.exit(1); }
  let balance = parseFloat(settings.paper_balance);
  console.log(`Balance: $${balance.toFixed(2)}`);

  const seenRows = await dbGet('polymarket_seen_trades', 'limit=2000&order=detected_at.desc');
  const seenTx   = new Set(seenRows.map(r => r.trade_id));

  const latestHex = await rpc('eth_blockNumber', []);
  const latest    = parseInt(latestHex, 16);
  const fromBlock = latest - 450;
  console.log(`\n🔍 Blocks ${fromBlock.toLocaleString()} → ${latest.toLocaleString()}`);

  const allTrades = [];
  let allSamples  = [];

  for (const contract of CONTRACTS) {
    console.log(`\n  Contract: ${contract.slice(0,12)}...`);
    const { trades, totalLogs, rawSamples } = await scanContract(contract, fromBlock, latest);
    allSamples.push(...rawSamples);
    console.log(`  Logs: ${totalLogs} | Valid whale trades: ${trades.length}`);
    allTrades.push(...trades);
  }

  // Debug: show raw sample decode
  if (allSamples.length > 0) {
    console.log('\n📋 Raw log sample decode:');
    const s = allSamples[0];
    const raw = (s.data || '').slice(2);
    console.log('  topics:', s.topics?.slice(0,4));
    console.log('  data words:');
    for (let i = 0; i < Math.min(4, Math.floor(raw.length/64)); i++) {
      const hex = raw.slice(i*64, i*64+64);
      const num = safeNum ? safeNum(hex) : '?';
      console.log(`    [${i}] 0x${hex.slice(0,16)}... = ${num !== null ? '$'+num?.toFixed(2) : 'OVERFLOW/token'}`);
    }
  }

  allTrades.sort((a, b) => b.usdcSize - a.usdcSize);

  if (allTrades.length > 0) {
    console.log(`\n📊 Top ${Math.min(8, allTrades.length)} whale trades:`);
    allTrades.slice(0, 8).forEach(t =>
      console.log(`  $${t.usdcSize.toFixed(0).padStart(8)} | ${t.maker.slice(0,12)} | tokenId ${t.tokenId.slice(0,15)}`)
    );
  } else {
    console.log('\n  No valid whale trades decoded in this window.');
    console.log('  (amounts either too small, overflow, or tokenId=0/1)');
  }

  const newTrades = allTrades.filter(t => !seenTx.has(t.txHash));
  console.log(`\nNew trades: ${newTrades.length}`);

  let mirrored = 0;
  for (const trade of newTrades.slice(0, 5)) {
    await dbInsert('polymarket_seen_trades', { trade_id: trade.txHash, whale_address: trade.maker });

    const market  = await getMarket(trade.tokenId);
    const price   = market?.price   || 0.5;
    const outcome = market?.outcome || 'Yes';
    const question= market?.question|| `Token ${trade.tokenId.slice(0,12)}`;

    if (price < 0.04 || price > 0.96) continue;
    if (balance < 0.20) break;

    const whales  = await dbGet('polymarket_whales', `address=eq.${trade.maker}&limit=1`);
    let whale     = whales[0];
    if (!whale) {
      await dbInsert('polymarket_whales', {
        address: trade.maker, alias: `🦈${trade.maker.slice(2,8).toUpperCase()}`,
        win_rate_30d: 0, roi_30d: 0, is_active: true,
      });
    }

    const alias  = whale?.alias || `🦈${trade.maker.slice(2,8).toUpperCase()}`;
    const wr     = whale?.win_rate_30d || 0;
    const size   = parseFloat(Math.min(1.00, balance * 0.05).toFixed(4));
    const newBal = parseFloat((balance - size).toFixed(4));
    const txHash = `clawbot-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

    const reason = `[🦈CLAWBOT] ${alias} (${wr}%WR) BUY ${outcome} @ $${price.toFixed(3)} | Whale: $${trade.usdcSize.toFixed(0)} | ${question.slice(0,65)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id: market?.id || trade.txHash.slice(0,20),
      market_question: reason, outcome,
      token_id: trade.tokenId.slice(0, 50),
      direction: 'buy', shares: parseFloat((size/price).toFixed(4)),
      entry_price: price, amount_usdc: size, tx_hash: txHash,
      strategy: 'clawbot_v5', is_paper: true, status: 'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settings.id, {
        paper_balance: newBal, updated_at: new Date().toISOString(),
      });
      balance = newBal; mirrored++;
      console.log(`\n  ✅ MIRRORED #${mirrored}: ${alias}`);
      console.log(`     $${trade.usdcSize.toFixed(0)} whale → $${size} mirror | BUY ${outcome} @ ${(price*100).toFixed(1)}%`);
      console.log(`     ${question.slice(0,80)}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n━━━ CLAWBOT v5: ${mirrored} mirrored | Bal $${balance.toFixed(4)} ━━━`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
