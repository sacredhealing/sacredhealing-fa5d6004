#!/usr/bin/env node
/**
 * SQI-2050 Shiesty Signal Oracle — GitHub Actions Runner
 * Runs on schedule, scans Polymarket, writes trades to Supabase.
 * Strategies: Latency Arb + Volatility Scalper
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const RISK_PCT     = parseFloat(process.env.RISK_PCT || '0.05');
const GAMMA_API    = 'https://gamma-api.polymarket.com';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function dbGet(table, filter = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return r.ok ? r.json() : null;
}

async function dbInsert(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  return r.ok;
}

async function dbUpdate(table, filter, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return r.ok;
}

// ── Fetch markets ─────────────────────────────────────────────────────────────
async function fetchMarkets() {
  const r = await fetch(`${GAMMA_API}/markets?limit=50&active=true&closed=false`);
  if (!r.ok) return [];
  const data = await r.json();
  return data.map(m => {
    const names    = JSON.parse(m.outcomes      || '["Yes","No"]');
    const prices   = JSON.parse(m.outcomePrices || '[0.5,0.5]');
    const tokenIds = JSON.parse(m.clobTokenIds  || '["",""]');
    return {
      id: m.id, question: m.question,
      liquidity: parseFloat(m.liquidity) || 0,
      volume:    parseFloat(m.volume)    || 0,
      closed:    m.closed,
      outcomes:  names.map((name, i) => ({
        name, price: parseFloat(prices[i]) || 0.5, tokenId: tokenIds[i] || '',
      })),
    };
  });
}

// ── Strategies ────────────────────────────────────────────────────────────────
function latencyArb(markets) {
  const signals = [];
  for (const m of markets.filter(m => m.liquidity > 5000 && !m.closed)
                          .sort((a,b) => b.volume - a.volume).slice(0, 15)) {
    const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const no  = m.outcomes.find(o => o.name.toLowerCase() === 'no');
    if (!yes || !no) continue;
    // Use price distance from 0.5 as proxy for momentum signal
    const dist = Math.abs(yes.price - 0.5);
    if (dist < 0.08 || dist > 0.92) continue;
    const direction = yes.price < 0.5 ? 'buy' : 'buy'; // always buy underdog
    const outcome   = yes.price < 0.5 ? yes : no;
    signals.push({
      marketId: m.id, direction: 'buy',
      outcome: outcome.name, tokenId: outcome.tokenId,
      confidence: Math.min(85, 50 + dist * 200),
      reason: `[LATENCY] ${m.question.slice(0,80)}`,
      currentPrice: outcome.price,
      strategy: 'latency_arb',
    });
  }
  return signals.slice(0, 2);
}

function volScalper(markets) {
  const signals = [];
  for (const m of markets.filter(m => m.liquidity > 50000 && !m.closed).slice(0, 10)) {
    const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
    if (!yes || yes.price > 0.85 || yes.price < 0.15) continue;
    signals.push({
      marketId: m.id, direction: 'buy',
      outcome: 'Yes', tokenId: yes.tokenId,
      confidence: Math.min(80, 45 + (m.volume / 1000000) * 10),
      reason: `[SCALP] ${m.question.slice(0,80)}`,
      currentPrice: yes.price,
      strategy: 'volatility_scalp',
    });
  }
  return signals.slice(0, 1);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SQI-2050 ⚡ Shiesty Signal Oracle — GH Actions');
  console.log(`  Mode: ${PAPER_MODE ? '📋 PAPER' : '🔴 LIVE'} | Risk: ${RISK_PCT*100}%`);
  console.log('═══════════════════════════════════════════════');

  // Load balance
  const settings = await dbGet('polymarket_bot_settings', 'limit=1');
  let balance = settings?.length ? parseFloat(settings[0].paper_balance) : 10;
  console.log(`Balance: $${balance.toFixed(2)}`);

  // Fetch markets
  console.log('Fetching Polymarket markets...');
  const markets = await fetchMarkets();
  console.log(`Markets fetched: ${markets.length}`);

  if (!markets.length) {
    console.log('No markets — exiting');
    return;
  }

  // Run strategies
  const signals = [
    ...latencyArb(markets),
    ...volScalper(markets),
  ].sort((a,b) => b.confidence - a.confidence).slice(0, 3);

  console.log(`Signals found: ${signals.length}`);

  let trades = 0;
  for (const sig of signals) {
    const size = Math.min(50, Math.max(0.5, parseFloat((balance * RISK_PCT).toFixed(2))));
    const fee  = size * 0.0005;
    const cost = sig.direction === 'buy' ? size + fee : fee;

    if (sig.direction === 'buy' && cost > balance) {
      console.log(`SKIP: balance $${balance.toFixed(2)} < cost $${cost.toFixed(2)}`);
      continue;
    }

    const newBal = sig.direction === 'buy' ? balance - cost : balance + size - fee;
    const txHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id:       sig.marketId,
      market_question: sig.reason,
      outcome:         sig.outcome,
      token_id:        sig.tokenId || txHash,
      direction:       sig.direction,
      shares:          size / (sig.currentPrice || 0.5),
      entry_price:     sig.currentPrice || 0.5,
      amount_usdc:     size,
      tx_hash:         txHash,
      strategy:        sig.strategy,
      is_paper:        true,
      status:          'open',
    });

    if (ok) {
      await dbUpdate('polymarket_bot_settings', 'limit=1', {
        paper_balance: parseFloat(newBal.toFixed(4)),
      });
      balance = newBal;
      trades++;
      console.log(`✅ TRADE #${trades}: ${sig.strategy} | BUY ${sig.outcome} @ ${(sig.currentPrice*100).toFixed(1)}% | $${size.toFixed(2)} | bal $${newBal.toFixed(2)}`);
      console.log(`   ${sig.reason}`);
    }
  }

  console.log(`\nDone. Trades this run: ${trades} | Final balance: $${balance.toFixed(2)}`);
  console.log('Next run: ~15 minutes (GitHub Actions cron)');
}

main().catch(e => { console.error(e); process.exit(1); });
