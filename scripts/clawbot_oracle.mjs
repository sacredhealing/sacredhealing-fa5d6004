#!/usr/bin/env node
/**
 * SQI-2050 CLAWBOT v6 — Correct V2 Offsets
 * From decoded log sample:
 * data[0..63]   = small value (makerAssetId or side indicator)
 * data[64..127] = tokenId (LARGE uint256 - the actual market token)
 * data[128..191]= makerAmountFilled (pUSD, 6 decimals)
 * data[192..255]= takerAmountFilled (pUSD, 6 decimals)
 * data[256..319]= fee
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLYGON_RPC  = process.env.POLYGON_RPC_URL;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_USDC     = parseFloat(process.env.MIN_TRADE_USDC || '200');
const MAX_USDC     = 10_000_000;
const DECIMALS     = 1_000_000; // pUSD = 6 decimals

const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
const GAMMA = 'https://gamma-api.polymarket.com';
const SB    = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

if (!SUPABASE_URL || !SUPABASE_KEY || !POLYGON_RPC) {
  console.error('FATAL: missing env vars'); process.exit(1);
}

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

const toAddr = h => '0x' + h.slice(-40).toLowerCase();

function safeUSDC(hexWord) {
  try {
    const b = BigInt('0x' + hexWord);
    if (b > BigInt(MAX_USDC * DECIMALS)) return null; // overflow
    return Number(b) / DECIMALS;
  } catch { return null; }
}

function decodeLog(log) {
  const topics = log.topics || [];
  const raw    = (log.data || '').slice(2);
  if (topics.length < 3 || raw.length < 256) return null;

  const maker = toAddr(topics[2]);
  if (!maker || maker.slice(2) === '0'.repeat(40)) return null;

  // Correct offsets (confirmed from decoded sample):
  // word[0] = makerAssetId / small indicator
  // word[1] = tokenId (LARGE - the real market token ID)
  // word[2] = makerAmountFilled
  // word[3] = takerAmountFilled
  const tokenIdHex   = raw.slice(64, 128);   // word[1]
  const makerAmtHex  = raw.slice(128, 192);  // word[2]
  const takerAmtHex  = raw.slice(192, 256);  // word[3]

  const makerAmt = safeUSDC(makerAmtHex);
  const takerAmt = safeUSDC(takerAmtHex);
  if (makerAmt === null && takerAmt === null) return null;

  const usdcSize = Math.max(makerAmt ?? 0, takerAmt ?? 0);
  if (usdcSize < MIN_USDC) return null;

  // TokenId as decimal string (77+ digits for Polymarket tokens)
  let tokenId = '';
  try { tokenId = BigInt('0x' + tokenIdHex).toString(); } catch {}
  if (!tokenId || tokenId === '0' || tokenId === '1') return null;

  return { txHash: log.transactionHash, block: parseInt(log.blockNumber, 16), maker, usdcSize, tokenId };
}

async function scanContract(contract, fromBlock, toBlock) {
  const trades = []; let totalLogs = 0;
  const CHUNK  = 9;
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
        const t = decodeLog(log);
        if (t) trades.push(t);
      }
    } catch {}
    await new Promise(r => setTimeout(r, 60));
  }
  return { trades, totalLogs };
}

async function getMarket(tokenId) {
  try {
    const r = await fetch(`${GAMMA}/markets?clob_token_ids=${tokenId}&limit=1`);
    if (!r.ok) return null;
    const arr = await r.json();
    const m   = Array.isArray(arr) ? arr[0] : null;
    if (!m) return null;
    let prices = [0.5,0.5], names = ['Yes','No'], tids = ['',''];
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
  console.log('  SQI-2050 🦈 CLAWBOT v6 — Real Whale Positions');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
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
  for (const contract of CONTRACTS) {
    console.log(`\n  ${contract.slice(0,12)}...`);
    const { trades, totalLogs } = await scanContract(contract, fromBlock, latest);
    console.log(`  Logs: ${totalLogs} | Valid whale trades: ${trades.length}`);
    allTrades.push(...trades);
  }

  allTrades.sort((a, b) => b.usdcSize - a.usdcSize);

  if (allTrades.length > 0) {
    console.log(`\n📊 Top whale trades:`);
    allTrades.slice(0, 8).forEach(t =>
      console.log(`  $${t.usdcSize.toFixed(0).padStart(8)} | ${t.maker.slice(0,12)} | token ${t.tokenId.slice(0,15)}...`)
    );
  } else {
    console.log('\n  No whale trades with valid token IDs found.');
  }

  const newTrades = allTrades.filter(t => !seenTx.has(t.txHash));
  console.log(`New unseen: ${newTrades.length}`);

  let mirrored = 0;
  for (const trade of newTrades.slice(0, 5)) {
    await dbInsert('polymarket_seen_trades', { trade_id: trade.txHash, whale_address: trade.maker });

    const market  = await getMarket(trade.tokenId);
    const price   = market?.price   || 0.5;
    const outcome = market?.outcome || 'Yes';
    const question= market?.question|| `Token ${trade.tokenId.slice(0,16)}...`;

    console.log(`\n  Processing: $${trade.usdcSize.toFixed(0)} | ${question.slice(0,60)}`);

    if (price < 0.04 || price > 0.96) {
      console.log(`  ⏭ SKIP: price ${(price*100).toFixed(0)}% near resolved`); continue;
    }
    if (balance < 0.20) { console.log('  ⏭ balance too low'); break; }

    // Auto-register whale
    const [whale] = await dbGet('polymarket_whales', `address=eq.${trade.maker}&limit=1`);
    if (!whale) await dbInsert('polymarket_whales', {
      address: trade.maker, alias: `🦈${trade.maker.slice(2,8).toUpperCase()}`,
      win_rate_30d: 0, roi_30d: 0, is_active: true,
    });

    const alias  = whale?.alias || `🦈${trade.maker.slice(2,8).toUpperCase()}`;
    const wr     = whale?.win_rate_30d || 0;
    const size   = parseFloat(Math.min(1.00, balance * 0.05).toFixed(4));
    const newBal = parseFloat((balance - size).toFixed(4));
    const txHash = `clawbot-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

    const reason = `[🦈CLAWBOT] ${alias} (${wr}%WR) BUY ${outcome} @ $${price.toFixed(3)} | Whale: $${trade.usdcSize.toFixed(0)} pUSD | ${question.slice(0,65)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id: market?.id || trade.txHash.slice(0,20),
      market_question: reason, outcome,
      token_id: trade.tokenId.slice(0,50),
      direction: 'buy', shares: parseFloat((size/price).toFixed(4)),
      entry_price: price, amount_usdc: size, tx_hash: txHash,
      strategy: 'clawbot_v6', is_paper: true, status: 'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settings.id, {
        paper_balance: newBal, updated_at: new Date().toISOString(),
      });
      balance = newBal; mirrored++;
      console.log(`  ✅ MIRRORED: ${alias} $${trade.usdcSize.toFixed(0)} → $${size} | BUY ${outcome} @ ${(price*100).toFixed(1)}%`);
      console.log(`     ${question.slice(0,80)}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n━━━ CLAWBOT v6: ${mirrored} mirrored | Bal $${balance.toFixed(4)} ━━━`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
