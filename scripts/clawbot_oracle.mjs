#!/usr/bin/env node
/**
 * SQI-2050 🦈 CLAWBOT v8 — Elite Whale Only
 * Only mirrors wallets with PROVEN performance:
 *   - Must have win_rate_30d >= 60%
 *   - Must have total_trades_seen >= 10 (earned trust over time)
 *   - OR be a manually seeded ELITE wallet (is_elite = true)
 * New wallets are observed/tracked but NEVER mirrored until they earn it.
 * Max 2 mirrors per run. Max 10 per day. Balance protected.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLYGON_RPC  = process.env.POLYGON_RPC_URL;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_USDC     = parseFloat(process.env.MIN_TRADE_USDC || '500'); // Raised: $500 min whale size
const MAX_USDC     = 10_000_000;
const DECIMALS     = 1_000_000;
const MIN_PRICE    = 0.08;
const MAX_PRICE    = 0.92;

// Elite thresholds
const MIN_WIN_RATE   = 60;   // must have >= 60% win rate
const MIN_TRADES_SEEN = 10;  // must have been seen >= 10 times
const MAX_MIRRORS_RUN = 2;   // max mirrors per 15min run
const MAX_MIRRORS_DAY = 10;  // max mirrors per day (safety cap)

const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
const GAMMA = 'https://gamma-api.polymarket.com';
const SB    = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

if (!SUPABASE_URL || !SUPABASE_KEY || !POLYGON_RPC) { process.exit(1); }

async function rpc(m, p = []) {
  const r = await fetch(POLYGON_RPC, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: m, params: p }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.result;
}

async function dbGet(t, q = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`, { headers: SB });
  return r.ok ? r.json() : [];
}
async function dbIns(t, d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(d),
  });
  return r.ok || r.status === 409;
}
async function dbPatch(t, id, d) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`, {
    method: 'PATCH', headers: { ...SB, 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
  return r.ok;
}
async function dbUpsert(t, d, onConflict) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(d),
  });
  return r.ok || r.status === 409;
}

const toAddr = h => '0x' + h.slice(-40).toLowerCase();
function safeUSDC(hex) {
  try {
    const b = BigInt('0x' + hex);
    return b > BigInt(MAX_USDC * DECIMALS) ? null : Number(b) / DECIMALS;
  } catch { return null; }
}

function decodeLog(log) {
  const topics = log.topics || [];
  const raw    = (log.data || '').slice(2);
  if (topics.length < 3 || raw.length < 256) return null;
  const maker = toAddr(topics[2]);
  if (!maker || maker.slice(2) === '0'.repeat(40)) return null;

  const tokenIdHex  = raw.slice(64, 128);
  const makerAmtHex = raw.slice(128, 192);
  const takerAmtHex = raw.slice(192, 256);

  const makerAmt = safeUSDC(makerAmtHex);
  const takerAmt = safeUSDC(takerAmtHex);
  const usdcSize = Math.max(makerAmt ?? 0, takerAmt ?? 0);
  if (usdcSize < MIN_USDC || usdcSize > MAX_USDC) return null;

  let tokenId = '';
  try { tokenId = BigInt('0x' + tokenIdHex).toString(); } catch {}
  if (!tokenId || tokenId.length < 5) return null;

  return { txHash: log.transactionHash, blockNum: parseInt(log.blockNumber, 16), maker, tokenId, usdcSize };
}

async function scanContract(addr, fromBlock, toBlock) {
  const params = [{ fromBlock: '0x' + fromBlock.toString(16), toBlock: '0x' + toBlock.toString(16), address: addr, topics: ['0x' + 'd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49'] }];
  try {
    const logs = await rpc('eth_getLogs', params);
    if (!Array.isArray(logs)) return { trades: [], total: 0 };
    const trades = logs.map(decodeLog).filter(Boolean);
    return { trades, total: logs.length };
  } catch { return { trades: [], total: 0 }; }
}

async function getMarket(tokenId) {
  try {
    const r = await fetch(`${GAMMA}/markets?clob_token_ids=${tokenId}&limit=1`);
    if (!r.ok) return null;
    const arr = await r.json();
    const m = Array.isArray(arr) ? arr[0] : null;
    if (!m) return null;
    const tokens = m.tokens || [];
    const tok = tokens.find(t => t.token_id === tokenId) || tokens[0];
    return { id: m.id, question: m.question || '', price: parseFloat(tok?.price || 0.5), outcome: tok?.outcome || 'Yes' };
  } catch { return null; }
}

async function countTodayMirrors(settings_id) {
  const since = new Date();
  since.setHours(0,0,0,0);
  const rows = await dbGet('polymarket_trades', `strategy=eq.clawbot_v8&is_paper=eq.true&created_at=gte.${since.toISOString()}&select=id`);
  return Array.isArray(rows) ? rows.length : 0;
}

async function updateWhaleStats(address, outcome_correct) {
  const [whale] = await dbGet('polymarket_whales', `address=eq.${address}&limit=1`);
  if (!whale) return;
  
  const seen = (whale.total_trades_seen || 0) + 1;
  // Rolling win rate update (simple running average)
  const currentWins = Math.round((whale.win_rate_30d / 100) * (whale.total_trades_seen || 0));
  const newWins = outcome_correct ? currentWins + 1 : currentWins;
  const newWR = seen > 0 ? Math.round((newWins / seen) * 100) : 0;
  
  await dbPatch('polymarket_whales', whale.id, {
    total_trades_seen: seen,
    win_rate_30d: newWR,
    last_checked: new Date().toISOString(),
  });
}

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT v8 — Elite Whale Filter');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
  console.log(`  Min whale: $${MIN_USDC} | WR gate: ${MIN_WIN_RATE}% | Min trades: ${MIN_TRADES_SEEN}`);
  console.log('══════════════════════════════════════════════════════');

  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1');
  if (!settings) { console.error('No settings'); process.exit(1); }
  let balance = parseFloat(settings.paper_balance);
  console.log(`Balance: $${balance.toFixed(2)}`);

  if (balance < 0.50) { console.log('Balance too low ($0.50 minimum). Reset required.'); process.exit(0); }

  // Check daily mirror cap
  const todayMirrors = await countTodayMirrors(settings.id);
  console.log(`Today's mirrors: ${todayMirrors}/${MAX_MIRRORS_DAY}`);
  if (todayMirrors >= MAX_MIRRORS_DAY) {
    console.log('Daily mirror cap reached. Resting until tomorrow.');
    process.exit(0);
  }

  const seenRows = await dbGet('polymarket_seen_trades', 'limit=5000&order=detected_at.desc');
  const seenTx   = new Set(seenRows.map(r => r.trade_id));

  const latest    = parseInt(await rpc('eth_blockNumber', []), 16);
  const fromBlock = latest - 450;
  console.log(`\n🔍 Scanning ${fromBlock.toLocaleString()} → ${latest.toLocaleString()}`);

  const allTrades = [];
  for (const c of CONTRACTS) {
    const { trades, total } = await scanContract(c, fromBlock, latest);
    console.log(`  ${c.slice(0,12)}: ${total} logs → ${trades.length} large trades ($${MIN_USDC}+)`);
    allTrades.push(...trades);
  }

  allTrades.sort((a, b) => b.usdcSize - a.usdcSize);
  const newTrades = allTrades.filter(t => !seenTx.has(t.txHash));
  console.log(`\nTotal: ${allTrades.length} | New: ${newTrades.length}`);

  if (allTrades.length > 0) {
    console.log('\n📊 Top whale trades detected:');
    allTrades.slice(0, 5).forEach(t =>
      console.log(`  $${t.usdcSize.toFixed(0).padStart(8)} | ${t.maker.slice(0,12)} | ${t.tokenId.slice(0,12)}...`)
    );
  }

  let mirrored = 0;
  let observed = 0;
  const processed = new Set();
  const remainingDaily = MAX_MIRRORS_DAY - todayMirrors;

  for (const trade of newTrades) {
    if (processed.has(trade.txHash + trade.tokenId)) continue;
    processed.add(trade.txHash + trade.tokenId);

    // Always record the sighting
    await dbIns('polymarket_seen_trades', { trade_id: trade.txHash, whale_address: trade.maker });

    // Look up this wallet
    const [whale] = await dbGet('polymarket_whales', `address=eq.${trade.maker}&limit=1`);
    
    const tradesSeen  = whale?.total_trades_seen || 0;
    const winRate     = whale?.win_rate_30d || 0;
    const isElite     = whale?.is_elite || false;

    // If unknown wallet — add to tracking list but DO NOT mirror
    if (!whale) {
      await dbIns('polymarket_whales', {
        address: trade.maker,
        alias: `🔭${trade.maker.slice(2,8).toUpperCase()}`, // telescope = watching, not confirmed
        win_rate_30d: 0, roi_30d: 0,
        total_trades_seen: 1,
        last_trade_size: trade.usdcSize,
        is_active: true,
        is_elite: false,
      });
      observed++;
      console.log(`\n🔭 OBSERVING new wallet: ${trade.maker.slice(0,14)} ($${trade.usdcSize.toFixed(0)}) — building track record`);
      continue;
    }

    // Update trade count for known wallets
    await dbPatch('polymarket_whales', whale.id, {
      total_trades_seen: tradesSeen + 1,
      last_trade_size: trade.usdcSize,
      last_checked: new Date().toISOString(),
    });

    // ELITE GATE: only mirror proven wallets
    const qualifies = isElite || (winRate >= MIN_WIN_RATE && tradesSeen >= MIN_TRADES_SEEN);
    
    if (!qualifies) {
      console.log(`\n⏳ SKIP ${whale.alias}: WR ${winRate}% / ${tradesSeen} trades seen (needs ${MIN_WIN_RATE}%WR + ${MIN_TRADES_SEEN} trades)`);
      continue;
    }

    // Check market validity
    const market = await getMarket(trade.tokenId);
    const price   = market?.price   ?? 0.5;
    const outcome = market?.outcome ?? 'Yes';
    const question= market?.question ?? `Token ${trade.tokenId.slice(0,16)}`;

    if (price < MIN_PRICE || price > MAX_PRICE) {
      console.log(`\n⚡ SKIP entry zone: ${(price*100).toFixed(1)}% (outside ${MIN_PRICE*100}%-${MAX_PRICE*100}%)`);
      continue;
    }

    if (mirrored >= MAX_MIRRORS_RUN || mirrored >= remainingDaily) break;

    const size   = parseFloat((balance * 0.02).toFixed(4)); // 2% of balance (e.g. $10 &rarr; $0.20, $100 &rarr; $2.00)
    const newBal = parseFloat((balance - size).toFixed(4));
    const txHash = `clawbot-v8-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const reason = `[🦈ELITE] ${whale.alias} (${winRate}%WR / ${tradesSeen} seen) BUY ${outcome} @ $${price.toFixed(3)} | Whale: $${trade.usdcSize.toFixed(0)} | ${question.slice(0,60)}`;

    const ok = await dbIns('polymarket_trades', {
      market_id: market?.id || trade.txHash.slice(0,20),
      market_question: reason, outcome,
      token_id: trade.tokenId.slice(0,50),
      direction: 'buy', shares: parseFloat((size/price).toFixed(4)),
      entry_price: price, amount_usdc: size, tx_hash: txHash,
      strategy: 'clawbot_v8', is_paper: true, status: 'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settings.id, {
        paper_balance: newBal, updated_at: new Date().toISOString(),
      });
      balance = newBal; mirrored++;
      console.log(`\n✅ MIRRORED ELITE #${mirrored}: ${whale.alias}`);
      console.log(`   WR: ${winRate}% | Seen: ${tradesSeen}x | Whale: $${trade.usdcSize.toFixed(0)} → Mirror: $${size}`);
      console.log(`   ${outcome} @ ${(price*100).toFixed(1)}% | ${question.slice(0,70)}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n━━━ CLAWBOT v8: ${mirrored} mirrored | ${observed} new wallets observed | Bal $${balance.toFixed(4)} ━━━`);
  console.log(`    Daily total: ${todayMirrors + mirrored}/${MAX_MIRRORS_DAY}`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

