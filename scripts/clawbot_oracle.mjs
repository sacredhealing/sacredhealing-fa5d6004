#!/usr/bin/env node
/**
 * SQI-2050 CLAWBOT v4 — Polymarket V2 On-Chain Whale Scanner
 * Uses correct V2 Exchange contracts (live April 28, 2026)
 * CTF V2: 0xE111180000d2663C0091e4f400237545B87B996B
 * Neg Risk V2: 0xe2222d279d744050d28e00520010520000310F59
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLYGON_RPC  = process.env.POLYGON_RPC_URL;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_USDC     = parseFloat(process.env.MIN_TRADE_USDC || '200');

if (!SUPABASE_URL || !SUPABASE_KEY || !POLYGON_RPC) {
  console.error('FATAL: missing env vars'); process.exit(1);
}

// ── Polymarket V2 contracts (live April 28 2026) ─────────────────────────────
const CONTRACTS_V2 = [
  '0xE111180000d2663C0091e4f400237545B87B996B', // CTF Exchange V2
  '0xe2222d279d744050d28e00520010520000310F59', // Neg Risk Exchange V2
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

// Decode pUSD amount (6 decimals like USDC)
const toUSDC  = hexVal => {
  try { return Number(BigInt(hexVal || '0x0')) / 1e6; } catch { return 0; }
};

// Fetch market info by tokenId
async function getMarket(tokenId) {
  try {
    const id = BigInt(tokenId).toString();
    const r  = await fetch(`${GAMMA}/markets?clob_token_ids=${id}&limit=1`);
    if (!r.ok) return null;
    const arr = await r.json();
    const m   = Array.isArray(arr) ? arr[0] : null;
    if (!m) return null;
    let prices = [0.5, 0.5], names = ['Yes','No'], tids = ['',''];
    try { prices = JSON.parse(m.outcomePrices); } catch {}
    try { names  = JSON.parse(m.outcomes);      } catch {}
    try { tids   = JSON.parse(m.clobTokenIds);  } catch {}
    const idx = tids.indexOf(id);
    return {
      id: m.id, question: m.question,
      price:   idx >= 0 ? parseFloat(prices[idx]) : 0.5,
      outcome: idx >= 0 ? names[idx] : 'Yes',
    };
  } catch { return null; }
}

// Scan one contract in 9-block chunks (Alchemy free tier limit = 10 blocks)
async function scanContract(contract, fromBlock, toBlock) {
  const trades = [];
  const CHUNK  = 9;
  let totalLogs = 0;

  for (let b = fromBlock; b <= toBlock; b += CHUNK) {
    const end = Math.min(b + CHUNK - 1, toBlock);
    try {
      const logs = await rpc('eth_getLogs', [{
        fromBlock: '0x' + b.toString(16),
        toBlock:   '0x' + end.toString(16),
        address:   contract,
      }]);
      totalLogs += logs.length;

      for (const log of logs) {
        try {
          const topics = log.topics || [];
          const data   = (log.data || '').slice(2);
          if (data.length < 192) continue;

          // maker is topics[2] (indexed address)
          const maker = topics[2] ? toAddr(topics[2]) : null;
          if (!maker) continue;

          // Parse data: V2 OrderFilled event
          // makerAmount @ offset 64, takerAmount @ offset 128
          const makerAmt = toUSDC('0x' + data.slice(64, 128));
          const takerAmt = toUSDC('0x' + data.slice(128, 192));
          const usdcSize = Math.max(makerAmt, takerAmt);

          if (usdcSize < MIN_USDC) continue;

          // tokenId from topics[4] or data offset 0
          const tokenId  = BigInt('0x' + data.slice(0, 64)).toString();

          trades.push({
            txHash:   log.transactionHash,
            block:    parseInt(log.blockNumber, 16),
            maker,
            usdcSize,
            tokenId,
          });
        } catch {}
      }
    } catch {}
    await new Promise(r => setTimeout(r, 60)); // rate limit
  }

  return { trades, totalLogs };
}

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT v4 — Polymarket V2 Scanner');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
  console.log(`  Min whale: $${MIN_USDC} | V2 Contracts`);
  console.log('══════════════════════════════════════════════════════');

  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1');
  if (!settings) { console.error('No settings row'); process.exit(1); }
  let balance = parseFloat(settings.paper_balance);
  console.log(`Balance: $${balance.toFixed(2)}`);

  const seenRows = await dbGet('polymarket_seen_trades', 'limit=2000&order=detected_at.desc');
  const seenTx   = new Set(seenRows.map(r => r.trade_id));

  const latestHex = await rpc('eth_blockNumber');
  const latest    = parseInt(latestHex, 16);
  const fromBlock = latest - 450;

  console.log(`\n🔍 Blocks ${fromBlock.toLocaleString()} → ${latest.toLocaleString()} (~15 min)`);

  const allTrades = [];

  for (const contract of CONTRACTS_V2) {
    console.log(`\n  Scanning V2 contract: ${contract.slice(0,12)}...`);
    const { trades, totalLogs } = await scanContract(contract, fromBlock, latest);
    console.log(`  Total logs: ${totalLogs} | Whale trades (>$${MIN_USDC}): ${trades.length}`);
    allTrades.push(...trades);
  }

  allTrades.sort((a, b) => b.usdcSize - a.usdcSize);

  if (allTrades.length > 0) {
    console.log(`\n📊 Top whale trades:`);
    allTrades.slice(0, 8).forEach(t =>
      console.log(`  $${t.usdcSize.toFixed(0).padStart(8)} USDC | ${t.maker.slice(0,12)} | tx ${t.txHash.slice(0,12)}`)
    );
  } else {
    console.log('\n  No large trades found in this window.');
  }

  const newTrades = allTrades.filter(t => !seenTx.has(t.txHash));
  console.log(`\nNew trades: ${newTrades.length}`);

  let mirrored = 0;

  for (const trade of newTrades.slice(0, 5)) {
    await dbInsert('polymarket_seen_trades', {
      trade_id: trade.txHash,
      whale_address: trade.maker,
    });

    const whales = await dbGet('polymarket_whales', `address=eq.${trade.maker}&limit=1`);
    let whale = whales[0];
    if (!whale) {
      await dbInsert('polymarket_whales', {
        address: trade.maker,
        alias:   `🦈${trade.maker.slice(2,8).toUpperCase()}`,
        win_rate_30d: 0, roi_30d: 0, is_active: true,
      });
      const [w] = await dbGet('polymarket_whales', `address=eq.${trade.maker}&limit=1`);
      whale = w;
    }

    const market  = await getMarket(trade.tokenId);
    const price   = market?.price   || 0.5;
    const outcome = market?.outcome || 'Yes';
    const question= market?.question|| `Token ${trade.tokenId.slice(0,12)}`;

    if (price < 0.04 || price > 0.96) {
      console.log(`\n  ⏭ SKIP near-resolved (${(price*100).toFixed(0)}%): ${question.slice(0,50)}`);
      continue;
    }
    if (balance < 0.20) { console.log('  ⏭ balance too low'); break; }

    const alias  = whale?.alias || `🦈${trade.maker.slice(2,8).toUpperCase()}`;
    const wr     = whale?.win_rate_30d || 0;
    const roi    = whale?.roi_30d || 0;
    const size   = parseFloat(Math.min(1.00, balance * 0.05).toFixed(4));
    const newBal = parseFloat((balance - size).toFixed(4));
    const txHash = `clawbot-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

    const reason = `[🦈CLAWBOT] ${alias} (${wr}%WR|+${roi}%ROI) BUY ${outcome} @ $${price.toFixed(3)} | Whale: $${trade.usdcSize.toFixed(0)} pUSD | ${question.slice(0,65)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id:       market?.id || trade.txHash.slice(0,20),
      market_question: reason,
      outcome, token_id: trade.tokenId.slice(0,50),
      direction: 'buy', shares: parseFloat((size/price).toFixed(4)),
      entry_price: price, amount_usdc: size, tx_hash: txHash,
      strategy: 'clawbot_v4', is_paper: true, status: 'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settings.id, {
        paper_balance: newBal, updated_at: new Date().toISOString(),
      });
      balance = newBal;
      mirrored++;
      console.log(`\n  ✅ MIRRORED #${mirrored}: ${alias}`);
      console.log(`     Whale: $${trade.usdcSize.toFixed(0)} pUSD | Mirror: $${size} | Bal: $${newBal}`);
      console.log(`     BUY ${outcome} @ ${(price*100).toFixed(1)}% | ${question.slice(0,70)}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n━━━ CLAWBOT v4 Done: ${mirrored} mirrored | Bal $${balance.toFixed(4)} ━━━`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
