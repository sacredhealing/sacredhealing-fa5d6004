#!/usr/bin/env node
/**
 * SQI-2050 Shiesty Signal Oracle — GitHub Actions 24/7
 * Strategy: Best-value across ALL price ranges, log top market prices
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const RISK_PCT     = parseFloat(process.env.RISK_PCT || '0.05');
const GAMMA_API    = 'https://gamma-api.polymarket.com';

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('FATAL: missing env vars'); process.exit(1); }

const SB = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function dbGet(table, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: SB });
  const text = await r.text();
  if (!r.ok) { console.error(`GET ${table} ${r.status}:`, text.slice(0,200)); return []; }
  return JSON.parse(text);
}

async function dbInsert(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  });
  if (!r.ok) console.error(`INSERT ${table} ${r.status}:`, (await r.text()).slice(0,300));
  return r.ok;
}

async function dbPatch(table, id, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...SB, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) console.error(`PATCH ${table} ${r.status}:`, (await r.text()).slice(0,200));
  return r.ok;
}

async function fetchMarkets() {
  try {
    const r = await fetch(`${GAMMA_API}/markets?limit=100&active=true&closed=false`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    console.log(`  API returned: ${data.length} markets`);
    return data.map(m => {
      let names = ['Yes','No'], prices = [0.5,0.5], tokenIds = ['',''];
      try { names    = JSON.parse(m.outcomes      || '["Yes","No"]'); } catch {}
      try { prices   = JSON.parse(m.outcomePrices || '[0.5,0.5]');    } catch {}
      try { tokenIds = JSON.parse(m.clobTokenIds  || '["",""]');      } catch {}
      return {
        id:        m.id,
        question:  (m.question || '').slice(0, 100),
        liquidity: parseFloat(m.liquidity) || 0,
        volume:    parseFloat(m.volume)    || 0,
        closed:    m.closed || false,
        outcomes:  names.map((name, i) => ({
          name,
          price:   parseFloat(prices[i]) || 0,
          tokenId: tokenIds[i] || '',
        })),
      };
    });
  } catch(e) { console.error('fetchMarkets error:', e.message); return []; }
}

function scoredSignals(markets) {
  const signals = [];

  // All active markets, sorted by volume
  const active = markets
    .filter(m => !m.closed && m.outcomes.length >= 2)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 50);

  console.log(`\n  Top 10 markets by volume:`);
  active.slice(0, 10).forEach(m => {
    const prices = m.outcomes.map(o => `${o.name}=${(o.price*100).toFixed(0)}%`).join(', ');
    console.log(`    $${Math.round(m.volume/1000)}k vol | ${prices} | ${m.question}`);
  });

  for (const m of active) {
    // Pick the best value outcome: highest expected value = price furthest from extremes
    // i.e., price closest to 0.50 gives most upside room
    const candidates = m.outcomes
      .filter(o => o.price > 0.03 && o.price < 0.97) // exclude nearly-resolved
      .map(o => ({ ...o, ev: 1 - Math.abs(o.price - 0.5) * 2 })) // EV score 0-1
      .sort((a, b) => b.ev - a.ev);

    if (!candidates.length) continue;

    const best = candidates[0];

    // Only trade if there's meaningful volume (> $1k) and some uncertainty
    if (m.volume < 1000) continue;
    if (best.price < 0.05 || best.price > 0.95) continue;

    const confidence = Math.min(90, Math.round(
      50
      + (m.volume / 500000) * 20     // volume bonus
      + (m.liquidity / 100000) * 10  // liquidity bonus
      + best.ev * 20                  // uncertainty bonus
    ));

    signals.push({
      marketId:     m.id,
      direction:    'buy',
      outcome:      best.name,
      tokenId:      best.tokenId || '',
      currentPrice: best.price,
      confidence,
      reason:       `[ORACLE] ${m.question} | ${best.name}@${(best.price*100).toFixed(0)}% | vol $${Math.round(m.volume/1000)}k`,
      strategy:     'value_ev',
    });
  }

  const top = signals.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  console.log(`\n  Signals found: ${signals.length} total → top ${top.length} selected`);
  top.forEach(s => console.log(`    [${s.confidence}] ${s.reason}`));
  return top;
}

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  SQI-2050 ⚡ Shiesty Signal Oracle');
  console.log(`  ${new Date().toISOString()} | ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Risk ${RISK_PCT*100}%`);
  console.log('══════════════════════════════════════════════════');

  const [settings] = await dbGet('polymarket_bot_settings', 'limit=1') || [];
  if (!settings) { console.error('No settings row'); process.exit(1); }
  const settingsId = settings.id;
  let balance = parseFloat(settings.paper_balance);
  console.log(`Balance: $${balance.toFixed(4)} | Row: ${settingsId}`);

  console.log('\nFetching Polymarket...');
  const markets = await fetchMarkets();
  if (!markets.length) { console.log('No markets.'); return; }

  const signals = scoredSignals(markets);
  if (!signals.length) { console.log('\nNo signals this run.'); return; }

  let trades = 0;
  console.log('\nExecuting trades...');
  for (const sig of signals) {
    const size   = parseFloat(Math.min(1.00, Math.max(0.10, balance * RISK_PCT)).toFixed(4));
    const shares = parseFloat((size / sig.currentPrice).toFixed(6));
    const newBal = parseFloat((balance - size).toFixed(6));

    if (size > balance) { console.log(`SKIP ${sig.outcome}: balance $${balance} < $${size}`); continue; }

    const txHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id:       sig.marketId,
      market_question: sig.reason,
      outcome:         sig.outcome,
      token_id:        sig.tokenId || txHash,
      direction:       'buy',
      shares,
      entry_price:     sig.currentPrice,
      amount_usdc:     size,
      tx_hash:         txHash,
      strategy:        sig.strategy,
      is_paper:        true,
      status:          'open',
    });

    if (ok) {
      await dbPatch('polymarket_bot_settings', settingsId, {
        paper_balance: newBal,
        updated_at: new Date().toISOString(),
      });
      balance = newBal;
      trades++;
      console.log(`  ✅ #${trades} BUY ${sig.outcome} @ ${(sig.currentPrice*100).toFixed(1)}% | $${size} → bal $${newBal}`);
    }
  }

  console.log(`\n━━━ Done: ${trades} trade(s) | Final bal $${balance.toFixed(4)} ━━━`);
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
