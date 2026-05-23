#!/usr/bin/env node
/**
 * SQI-2050 CLAWBOT — Whale Wallet Tracker
 * Mirrors Shiesty Finance's "Prediction Shark" strategy:
 * Track profitable whale wallets, copy their Polymarket trades
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const MIN_TRADE_SIZE = parseFloat(process.env.MIN_TRADE_SIZE || '500'); // min USDC to mirror
const GAMMA        = 'https://gamma-api.polymarket.com';
const DATA_API     = 'https://data-api.polymarket.com';

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('FATAL: missing env vars'); process.exit(1); }

const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function dbGet(table, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: SB });
  const t = await r.text();
  if (!r.ok) { console.error(`GET ${table}: ${r.status} ${t.slice(0,150)}`); return []; }
  return JSON.parse(t);
}

async function dbInsert(table, data, upsert = false) {
  const prefer = upsert ? 'resolution=merge-duplicates' : 'return=minimal';
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: prefer },
    body: JSON.stringify(data),
  });
  if (!r.ok && r.status !== 409) {
    const t = await r.text();
    if (!t.includes('duplicate')) console.error(`INSERT ${table}: ${r.status} ${t.slice(0,150)}`);
  }
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

// ── Fetch whale's recent trades from Polymarket ──────────────────────────────
async function fetchWhaleTrades(address) {
  try {
    // Try Data API first
    const r = await fetch(`${DATA_API}/activity?user=${address}&limit=20`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }
    });
    if (r.ok) {
      const data = await r.json();
      return Array.isArray(data) ? data : (data.data || data.results || []);
    }
    
    // Fallback: CLOB trades endpoint
    const r2 = await fetch(`https://clob.polymarket.com/trades?maker_address=${address}&limit=20`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }
    });
    if (r2.ok) {
      const d2 = await r2.json();
      return Array.isArray(d2) ? d2 : (d2.data || []);
    }

    console.log(`  [${address.slice(0,8)}] API returned ${r.status}/${r2.status}`);
    return [];
  } catch(e) {
    console.error(`  fetchWhaleTrades error: ${e.message}`);
    return [];
  }
}

// ── Discover top wallets from Polymarket leaderboard ────────────────────────
async function discoverTopWallets() {
  const endpoints = [
    `${DATA_API}/leaderboard?limit=50&by=profit`,
    `${DATA_API}/top-traders?limit=50`,
    `${GAMMA}/leaderboard?limit=50`,
  ];
  
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (r.ok) {
        const d = await r.json();
        const wallets = Array.isArray(d) ? d : (d.data || d.results || []);
        if (wallets.length > 0) {
          console.log(`  Discovered ${wallets.length} wallets from ${url}`);
          return wallets;
        }
      }
    } catch(e) {}
  }
  return [];
}

// ── Normalize trade from any API format ─────────────────────────────────────
function normalizeTrade(t, whaleAddress) {
  // Handle various API response shapes
  const id = t.id || t.trade_id || t.transactionHash || t.tx_hash || 
             `${whaleAddress}-${t.timestamp || Date.now()}`;
  const size = parseFloat(t.amount || t.usdcAmount || t.size || t.value || 0);
  const price = parseFloat(t.price || t.avgPrice || t.average_price || 0.5);
  const outcome = t.outcome || t.side || (t.type === 'BUY' ? 'Yes' : 'No');
  const marketId = t.market || t.marketId || t.conditionId || '';
  const question = t.title || t.question || t.market_question || marketId;
  const side = (t.type || t.side || t.direction || 'BUY').toUpperCase();
  const tokenId = t.asset || t.tokenId || t.outcome_index || '';
  
  return { id, size, price, outcome, marketId, question, side, tokenId };
}

// ── Main CLAWBOT loop ────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT — Prediction Shark Tracker');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);
  console.log(`  Min trade size to mirror: $${MIN_TRADE_SIZE}`);
  console.log('══════════════════════════════════════════════════');

  // Load settings + balance
  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1');
  if (!settings) { console.error('No settings row'); process.exit(1); }
  let balance = parseFloat(settings.paper_balance);
  console.log(`\nBalance: $${balance.toFixed(2)}`);

  // Load active whale wallets
  let whales = await dbGet('polymarket_whales', 'is_active=eq.true&order=roi_30d.desc');
  console.log(`\nTracking ${whales.length} whale wallets`);

  // Also try to discover new top wallets
  console.log('\nDiscovering top wallets from Polymarket leaderboard...');
  const discovered = await discoverTopWallets();
  if (discovered.length > 0) {
    for (const w of discovered.slice(0, 10)) {
      const addr = w.address || w.wallet || w.user || w.proxyWallet;
      if (addr && addr.startsWith('0x')) {
        await dbInsert('polymarket_whales', {
          address: addr.toLowerCase(),
          alias: `Auto-${addr.slice(2,8)}`,
          win_rate_30d: parseFloat(w.winRate || w.win_rate || 0),
          roi_30d: parseFloat(w.roi || w.returnRate || 0),
          total_profit: parseFloat(w.profit || w.pnl || 0),
        }, true);
      }
    }
    // Reload with discovered wallets
    whales = await dbGet('polymarket_whales', 'is_active=eq.true&order=roi_30d.desc');
    console.log(`  Total wallets now: ${whales.length}`);
  }

  // Load already-seen trade IDs
  const seenRows = await dbGet('polymarket_seen_trades', 'limit=500&order=detected_at.desc');
  const seenIds  = new Set(seenRows.map(r => r.trade_id));
  console.log(`  Already seen: ${seenIds.size} trades`);

  let totalSignals = 0;
  let totalTrades  = 0;

  // Scan each whale wallet
  for (const whale of whales) {
    console.log(`\n🦈 Scanning ${whale.alias || whale.address.slice(0,10)} (${whale.win_rate_30d}% WR | +${whale.roi_30d}% ROI)...`);
    
    const rawTrades = await fetchWhaleTrades(whale.address);
    console.log(`  Raw trades fetched: ${rawTrades.length}`);

    const newTrades = [];
    for (const t of rawTrades) {
      const norm = normalizeTrade(t, whale.address);
      if (!seenIds.has(norm.id) && norm.size >= MIN_TRADE_SIZE) {
        newTrades.push(norm);
        seenIds.add(norm.id);
      }
    }

    console.log(`  New large trades: ${newTrades.length}`);
    totalSignals += newTrades.length;

    // Paper-mirror each new whale trade
    for (const trade of newTrades.slice(0, 2)) { // max 2 per whale per run
      if (balance < 0.50) {
        console.log('  SKIP: insufficient balance');
        continue;
      }

      // Mirror at 1% of whale size (whale does $3000, we do $30 paper)
      const mirrorSize = parseFloat(Math.min(2.00, Math.max(0.10, balance * 0.05)).toFixed(4));
      const newBal = parseFloat((balance - mirrorSize).toFixed(4));

      const txHash = `clawbot-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      const reason = `[CLAWBOT🦈] ${whale.alias} (${whale.win_rate_30d}%WR) ${trade.side} ${trade.outcome} @ $${trade.price.toFixed(3)} | Whale size: $${trade.size.toFixed(0)} | ${trade.question.slice(0,60)}`;

      const ok = await dbInsert('polymarket_trades', {
        market_id:       trade.marketId || `whale-${whale.address.slice(0,8)}`,
        market_question: reason,
        outcome:         trade.outcome || 'Yes',
        token_id:        trade.tokenId || txHash,
        direction:       trade.side === 'BUY' ? 'buy' : 'sell',
        shares:          parseFloat((mirrorSize / (trade.price || 0.5)).toFixed(4)),
        entry_price:     trade.price || 0.5,
        amount_usdc:     mirrorSize,
        tx_hash:         txHash,
        strategy:        'clawbot_whale',
        is_paper:        true,
        status:          'open',
      });

      if (ok) {
        // Mark trade as seen
        await dbInsert('polymarket_seen_trades', {
          trade_id:      trade.id,
          whale_address: whale.address,
        });

        await dbPatch('polymarket_bot_settings', settings.id, {
          paper_balance: newBal,
          updated_at: new Date().toISOString(),
        });
        balance = newBal;
        totalTrades++;
        
        console.log(`\n  ✅ MIRRORED: ${trade.side} ${trade.outcome} @ $${trade.price.toFixed(3)}`);
        console.log(`     Whale: $${trade.size.toFixed(0)} | Mirror: $${mirrorSize} | Bal: $${newBal}`);
        console.log(`     ${trade.question.slice(0,80)}`);
      }

      // Update whale last_checked
      await dbPatch('polymarket_whales', whale.id, {
        trades_tracked: (whale.trades_tracked || 0) + newTrades.length,
        last_checked: new Date().toISOString(),
      });
    }

    // Small delay between wallets
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n━━━ CLAWBOT Run Complete ━━━`);
  console.log(`  Signals found: ${totalSignals}`);
  console.log(`  Trades mirrored: ${totalTrades}`);
  console.log(`  Balance: $${balance.toFixed(4)}`);
  console.log('  Next run: ~15 min (cron)');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
