#!/usr/bin/env node
/**
 * SQI-2050 🦈 CLAWBOT v9.1 — 18 Elite Wallets, All Strategies
 * ═══════════════════════════════════════════════════════════
 * STRATEGY 1: INSIDER_GEO — Mirror BAA2BC + E9076A
 *   Copy any new position immediately. These wallets have
 *   advance intel on geopolitical events. Entry at 10-30¢.
 *
 * STRATEGY 2: CONFIRMATION — Mirror B2A362 style
 *   Only mirror positions priced 65-95¢ (near-certain YES).
 *   Large conviction bets on outcomes already trending to resolve.
 *
 * STRATEGY 3: NO_MACHINE — Mirror ED107A style
 *   Buy NO on obvious extreme events at 1-8¢.
 *   "Will X happen by June 30?" where X is clearly impossible.
 *   Near-zero risk, 10-99x return when resolved.
 *
 * All strategies: 2% balance per trade, max 10/day, paper mode.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLYGON_RPC  = process.env.POLYGON_RPC_URL;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_USDC     = parseFloat(process.env.MIN_TRADE_USDC || '100');
const MAX_USDC     = 10_000_000;
const DECIMALS     = 1_000_000;

// Strategy price gates
const INSIDER_MIN  = 0.05;  // insider_geo: enter 5-60¢
const INSIDER_MAX  = 0.70;
const CONFIRM_MIN  = 0.65;  // confirmation: near-certain YES
const CONFIRM_MAX  = 0.95;
const NO_MIN       = 0.01;  // no_machine: buy NO at 1-8¢
const NO_MAX       = 0.08;

const MAX_MIRRORS_RUN = 5;
const MAX_MIRRORS_DAY = 10;

const CONTRACTS = [
  '0xE111180000d2663C0091e4f400237545B87B996B',
  '0xe2222d279d744050d28e00520010520000310F59',
];
const GAMMA = 'https://gamma-api.polymarket.com';
const DATA  = 'https://data-api.polymarket.com';
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
  return { txHash: log.transactionHash, maker, tokenId, usdcSize };
}

async function scanContract(addr, fromBlock, toBlock) {
  try {
    const logs = await rpc('eth_getLogs', [{ 
      fromBlock: '0x' + fromBlock.toString(16), 
      toBlock: '0x' + toBlock.toString(16), 
      address: addr, 
      topics: ['0xd0a08e8007ade4223bedd3e7afd46de87a15c21ab0b8a5b2a17f1ace4f9a9c49'] 
    }]);
    if (!Array.isArray(logs)) return { trades: [], total: 0 };
    return { trades: logs.map(decodeLog).filter(Boolean), total: logs.length };
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
    return { 
      id: m.id, question: m.question || '', 
      price: parseFloat(tok?.price || 0.5), 
      outcome: tok?.outcome || 'Yes',
      closeDate: m.end_date_iso || '',
    };
  } catch { return null; }
}

// Check if a market is an "obvious NO" candidate for Strategy 3
function isObviousNo(question, price) {
  if (price > NO_MAX) return false;
  const q = question.toLowerCase();
  // Patterns for near-impossible events
  const impossiblePatterns = [
    'impeach', 'resign', 'arrested', 'dies', 'collapse',
    'nuclear war', 'world war', 'invade', 'assassin',
    'out as president', 'out as', 'removed from',
    'xi jinping out', 'putin out', 'kim jong',
  ];
  return impossiblePatterns.some(p => q.includes(p));
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT v9.1 — 18 Elite Wallets Active');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
  console.log('  S1:InsiderGeo  S2:Confirmation  S3:NoMachine');
  console.log('══════════════════════════════════════════════════════════════');

  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1');
  if (!settings) { console.error('No settings'); process.exit(1); }
  let balance = parseFloat(settings.paper_balance);
  if (balance < 0.20) { console.log('Balance too low. Reset required.'); process.exit(0); }

  // Load elite whales WITH strategy tags
  const allWhales = await dbGet('polymarket_whales', 'is_elite=eq.true&is_active=eq.true');
  const whaleMap = {};
  for (const w of allWhales) whaleMap[w.address.toLowerCase()] = w;

  const insiderGeoAddrs = allWhales.filter(w => w.strategy === 'insider_geo').map(w => w.address.toLowerCase());
  const confirmAddrs    = allWhales.filter(w => w.strategy === 'confirmation').map(w => w.address.toLowerCase());
  const noMachineAddrs  = allWhales.filter(w => w.strategy === 'no_machine').map(w => w.address.toLowerCase());
  const mirrorAddrs     = allWhales.filter(w => w.strategy === 'mirror' || !w.strategy).map(w => w.address.toLowerCase());

  console.log(`\nStrategy roster:`);
  console.log(`  S1 InsiderGeo:   ${insiderGeoAddrs.length} wallets (${insiderGeoAddrs.map(a=>a.slice(2,8).toUpperCase()).join(', ')})`);
  console.log(`  S2 Confirmation: ${confirmAddrs.length} wallets`);
  console.log(`  S3 NoMachine:    ${noMachineAddrs.length} wallets`);
  console.log(`  Standard Mirror: ${mirrorAddrs.length} wallets`);
  console.log(`\nBalance: $${balance.toFixed(2)}`);

  // Daily cap check
  const today = new Date(); today.setHours(0,0,0,0);
  const todayTrades = await dbGet('polymarket_trades', `is_paper=eq.true&created_at=gte.${today.toISOString()}&select=id`);
  const todayCount = Array.isArray(todayTrades) ? todayTrades.length : 0;
  console.log(`Today: ${todayCount}/${MAX_MIRRORS_DAY} mirrors used`);
  if (todayCount >= MAX_MIRRORS_DAY) { console.log('Daily cap reached.'); process.exit(0); }

  const seenRows = await dbGet('polymarket_seen_trades', 'limit=5000&order=detected_at.desc');
  const seenTx   = new Set(seenRows.map(r => r.trade_id));

  const latest    = parseInt(await rpc('eth_blockNumber', []), 16);
  const fromBlock = latest - 450;
  console.log(`\n🔍 Scanning ${fromBlock.toLocaleString()} → ${latest.toLocaleString()}`);

  const allTrades = [];
  for (const c of CONTRACTS) {
    const { trades, total } = await scanContract(c, fromBlock, latest);
    console.log(`  ${c.slice(0,12)}: ${total} logs → ${trades.length} trades ($${MIN_USDC}+)`);
    allTrades.push(...trades);
  }

  allTrades.sort((a, b) => b.usdcSize - a.usdcSize);
  const newTrades = allTrades.filter(t => !seenTx.has(t.txHash));
  console.log(`\nTotal: ${allTrades.length} | New: ${newTrades.length}`);

  // Also check Strategy 3: scan data-api for new ED107A activity (NO positions)
  console.log('\n🎯 S3: Checking NO Machine (ED107A) for new activity...');
  for (const addr of noMachineAddrs) {
    const recent = await (async () => {
      try {
        const r = await fetch(`${DATA}/trades?user=${addr}&limit=20&sortBy=timestamp&sortDirection=DESC`, 
          { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
        return r.ok ? r.json() : [];
      } catch { return []; }
    })();
    
    if (!Array.isArray(recent)) continue;
    const cutoff = Date.now()/1000 - 900; // last 15 minutes
    const fresh = recent.filter(t => t.timestamp && t.timestamp > cutoff && t.side === 'BUY');
    
    if (fresh.length > 0) {
      console.log(`  🚨 ${addr.slice(2,8).toUpperCase()} has ${fresh.length} NEW buys in last 15 min!`);
      for (const t of fresh.slice(0,3)) {
        const price = parseFloat(t.price || 0);
        const q = String(t.title || '');
        console.log(`    ${t.side} @ ${price.toFixed(3)} | ${q.slice(0,55)}`);
        
        // If it's a NO play at 1-8 cents, record it
        if (price <= NO_MAX && todayCount + 1 <= MAX_MIRRORS_DAY && balance >= 0.20) {
          const size = parseFloat((balance * 0.02).toFixed(4));
          const newBal = parseFloat((balance - size).toFixed(4));
          const txHash = `clawbot-v9-no-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
          const reason = `[🎯S3:NO] ${addr.slice(2,8).toUpperCase()} BUY ${t.side} @ $${price.toFixed(3)} | ${q.slice(0,70)}`;
          
          const ok = await dbIns('polymarket_trades', {
            market_id: t.conditionId || txHash.slice(0,20),
            market_question: reason, outcome: 'No',
            token_id: (t.asset || txHash).slice(0,50),
            direction: 'buy', shares: parseFloat((size/Math.max(price,0.001)).toFixed(4)),
            entry_price: price, amount_usdc: size, tx_hash: txHash,
            strategy: 'clawbot_v9_no', is_paper: true, status: 'open',
          });
          if (ok) {
            await dbPatch('polymarket_bot_settings', settings.id, { paper_balance: newBal, updated_at: new Date().toISOString() });
            balance = newBal;
            console.log(`  ✅ S3 MIRRORED: NO @ ${price.toFixed(3)} | $${size} | ${q.slice(0,50)}`);
          }
        }
      }
    } else {
      console.log(`  ${addr.slice(2,8).toUpperCase()}: no recent activity`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  let mirrored = 0;
  let observed = 0;
  const processed = new Set();
  const remaining = Math.min(MAX_MIRRORS_DAY - todayCount, MAX_MIRRORS_RUN);

  for (const trade of newTrades) {
    if (mirrored >= remaining) break;
    if (processed.has(trade.txHash + trade.tokenId)) continue;
    processed.add(trade.txHash + trade.tokenId);

    await dbIns('polymarket_seen_trades', { trade_id: trade.txHash, whale_address: trade.maker });

    const whale = whaleMap[trade.maker];
    
    // New wallet - observe, don't mirror
    if (!whale) {
      observed++;
      const existing = await dbGet('polymarket_whales', `address=eq.${trade.maker}&limit=1`);
      if (existing.length === 0) {
        await dbIns('polymarket_whales', {
          address: trade.maker, alias: `🔭${trade.maker.slice(2,8).toUpperCase()}`,
          win_rate_30d: 0, roi_30d: 0, is_active: true, is_elite: false, strategy: 'mirror',
        });
      }
      continue;
    }

    // Get market data
    const market = await getMarket(trade.tokenId);
    const price   = market?.price   ?? 0.5;
    const outcome = market?.outcome ?? 'Yes';
    const question= market?.question ?? `Token ${trade.tokenId.slice(0,16)}`;

    // Determine strategy
    const strategy = whale.strategy || 'mirror';
    let shouldMirror = false;
    let stratLabel = '';

    if (strategy === 'insider_geo') {
      // S1: mirror any entry in 5-60¢ range — they have intel
      shouldMirror = price >= INSIDER_MIN && price <= INSIDER_MAX;
      stratLabel = `S1:InsiderGeo`;
    } else if (strategy === 'confirmation') {
      // S2: only near-certain YES at 65-95¢
      shouldMirror = price >= CONFIRM_MIN && price <= CONFIRM_MAX && outcome === 'Yes';
      stratLabel = `S2:Confirm`;
    } else if (strategy === 'no_machine') {
      // S3 on-chain: buy NO at 1-8¢ on obvious non-events
      const noPrice = 1 - price; // price of NO = 1 - price of YES
      shouldMirror = noPrice >= NO_MIN && noPrice <= NO_MAX;
      stratLabel = `S3:NoMachine`;
    } else {
      // Standard mirror: 50%+ WR gate, 5-95¢ range (lowered for more signals)
      shouldMirror = (whale.win_rate_30d || 0) >= 50 && 
                     price >= 0.05 && price <= 0.95;
      stratLabel = `S0:Mirror`;
    }

    if (!shouldMirror) {
      console.log(`\n⏭ SKIP ${whale.alias} [${stratLabel}]: price ${(price*100).toFixed(1)}¢ out of range`);
      continue;
    }

    // For NO machine on-chain, flip to buy the NO token
    const mirrorOutcome = (strategy === 'no_machine') ? 'No' : outcome;
    const mirrorPrice   = (strategy === 'no_machine') ? (1 - price) : price;

    const size   = parseFloat((balance * 0.02).toFixed(4));
    const newBal = parseFloat((balance - size).toFixed(4));
    const txHash = `clawbot-v9-${strategy.slice(0,4)}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const reason = `[🦈${stratLabel}] ${whale.alias} BUY ${mirrorOutcome} @ $${mirrorPrice.toFixed(3)} | Whale:$${trade.usdcSize.toFixed(0)} | ${question.slice(0,60)}`;

    const ok = await dbIns('polymarket_trades', {
      market_id: market?.id || trade.txHash.slice(0,20),
      market_question: reason, outcome: mirrorOutcome,
      token_id: trade.tokenId.slice(0,50),
      direction: 'buy', shares: parseFloat((size/Math.max(mirrorPrice,0.001)).toFixed(4)),
      entry_price: mirrorPrice, amount_usdc: size, tx_hash: txHash,
      strategy: `clawbot_v9_${strategy}`, is_paper: true, status: 'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settings.id, {
        paper_balance: newBal, updated_at: new Date().toISOString(),
      });
      balance = newBal; mirrored++;
      console.log(`\n✅ MIRRORED [${stratLabel}] #${mirrored}: ${whale.alias}`);
      console.log(`   ${mirrorOutcome} @ ${(mirrorPrice*100).toFixed(1)}¢ | Whale $${trade.usdcSize.toFixed(0)} → Mirror $${size}`);
      console.log(`   ${question.slice(0,75)}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n━━━ CLAWBOT v9: ${mirrored} mirrored | ${observed} observed | Bal $${balance.toFixed(4)} ━━━`);
  console.log(`    S1:InsiderGeo | S2:Confirmation | S3:NoMachine | S0:Mirror`);
  console.log(`    Daily: ${todayCount + mirrored}/${MAX_MIRRORS_DAY}`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

