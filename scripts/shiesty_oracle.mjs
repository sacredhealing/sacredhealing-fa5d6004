#!/usr/bin/env node
/**
 * SQI-2050 Shiesty Signal Oracle — GitHub Actions 24/7
 * Fixed: looser signal thresholds + correct balance row targeting
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const RISK_PCT     = parseFloat(process.env.RISK_PCT || '0.05');
const GAMMA_API    = 'https://gamma-api.polymarket.com';

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('FATAL: missing env vars'); process.exit(1); }

// ── Supabase REST helpers ─────────────────────────────────────────────────────
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
  if (!r.ok) console.error(`INSERT ${table} ${r.status}:`, (await r.text()).slice(0,200));
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

// ── Fetch markets ─────────────────────────────────────────────────────────────
async function fetchMarkets() {
  try {
    const r = await fetch(`${GAMMA_API}/markets?limit=100&active=true&closed=false`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    console.log(`  Raw markets from API: ${data.length}`);
    return data.map(m => {
      let names = ['Yes','No'], prices = [0.5,0.5], tokenIds = ['',''];
      try { names    = JSON.parse(m.outcomes      || '["Yes","No"]'); } catch {}
      try { prices   = JSON.parse(m.outcomePrices || '[0.5,0.5]');    } catch {}
      try { tokenIds = JSON.parse(m.clobTokenIds  || '["",""]');      } catch {}
      return {
        id:        m.id,
        question:  m.question || '',
        liquidity: parseFloat(m.liquidity) || 0,
        volume:    parseFloat(m.volume)    || 0,
        closed:    m.closed || false,
        outcomes:  names.map((name, i) => ({
          name,
          price:   parseFloat(prices[i])   || 0.5,
          tokenId: tokenIds[i]             || '',
        })),
      };
    });
  } catch(e) { console.error('fetchMarkets error:', e.message); return []; }
}

// ── Strategies ────────────────────────────────────────────────────────────────
function generateSignals(markets) {
  const signals = [];

  // Filter: any active, non-closed market with any liquidity
  const active = markets.filter(m => !m.closed && m.liquidity >= 0);
  console.log(`  Active markets: ${active.length}`);

  // Sort by volume desc, take top 50
  const top = active.sort((a, b) => b.volume - a.volume).slice(0, 50);
  console.log(`  Top 50 by volume. Top 3 vol: ${top.slice(0,3).map(m=>'$'+Math.round(m.volume/1000)+'k').join(', ')}`);

  for (const m of top) {
    const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const no  = m.outcomes.find(o => o.name.toLowerCase() === 'no');
    if (!yes) continue;

    const p = yes.price;

    // Strategy 1: Mid-range momentum — most tradeable zone
    if (p >= 0.25 && p <= 0.75) {
      const side    = p < 0.5 ? yes : no;   // buy whichever is below 50%
      const outcome = p < 0.5 ? 'Yes' : 'No';
      const price   = p < 0.5 ? p : (no ? no.price : 1 - p);
      signals.push({
        marketId:     m.id,
        direction:    'buy',
        outcome,
        tokenId:      side?.tokenId || '',
        currentPrice: price,
        confidence:   65 + Math.round(m.volume / 100000),
        reason:       `[MID] ${m.question.slice(0,90)}`,
        strategy:     'mid_momentum',
      });
      continue;
    }

    // Strategy 2: High-conviction YES (75-92%) — trending markets
    if (p >= 0.75 && p <= 0.92 && m.volume > 10000) {
      signals.push({
        marketId:     m.id,
        direction:    'buy',
        outcome:      'Yes',
        tokenId:      yes.tokenId || '',
        currentPrice: p,
        confidence:   70 + Math.round((p - 0.75) * 100),
        reason:       `[TREND] ${m.question.slice(0,90)}`,
        strategy:     'trend_follow',
      });
      continue;
    }

    // Strategy 3: Contrarian NO — overpriced YES (>92%)
    if (p > 0.92 && no && no.price < 0.08 && m.liquidity > 5000) {
      signals.push({
        marketId:     m.id,
        direction:    'buy',
        outcome:      'No',
        tokenId:      no.tokenId || '',
        currentPrice: no.price,
        confidence:   60,
        reason:       `[CONTRA] ${m.question.slice(0,90)}`,
        strategy:     'contrarian',
      });
    }
  }

  // Sort by confidence, cap at 3 trades per run
  const sorted = signals.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  console.log(`  Signals generated: ${signals.length} → top ${sorted.length} selected`);
  return sorted;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date().toISOString();
  console.log('══════════════════════════════════════════════════');
  console.log('  SQI-2050 ⚡ Shiesty Signal Oracle');
  console.log(`  ${now} | ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Risk ${RISK_PCT*100}%`);
  console.log('══════════════════════════════════════════════════');

  // Load settings (get row ID for targeted update)
  const settings = await dbGet('polymarket_bot_settings', 'limit=1');
  console.log(`Settings: ${JSON.stringify(settings)}`);
  if (!settings.length) { console.error('No settings row — re-run seed'); process.exit(1); }

  const settingsId = settings[0].id;
  let balance = parseFloat(settings[0].paper_balance);
  console.log(`Balance: $${balance.toFixed(2)} | Settings ID: ${settingsId}`);

  // Fetch + score markets
  console.log('\nFetching markets...');
  const markets = await fetchMarkets();
  if (!markets.length) { console.log('No markets. Exiting.'); return; }

  const signals = generateSignals(markets);
  if (!signals.length) { console.log('No signals this run.'); return; }

  // Execute paper trades
  let trades = 0;
  for (const sig of signals) {
    const size = parseFloat(Math.min(2.00, Math.max(0.10, balance * RISK_PCT)).toFixed(4));
    if (size > balance) { console.log(`SKIP: balance $${balance} < size $${size}`); continue; }

    const txHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const shares  = parseFloat((size / sig.currentPrice).toFixed(4));
    const newBal  = parseFloat((balance - size).toFixed(4));

    const ok = await dbInsert('polymarket_trades', {
      market_id:       sig.marketId,
      market_question: sig.reason,
      outcome:         sig.outcome,
      token_id:        sig.tokenId || txHash,
      direction:       sig.direction,
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
        updated_at:    new Date().toISOString(),
      });
      balance = newBal;
      trades++;
      console.log(`\n✅ TRADE #${trades}: ${sig.strategy}`);
      console.log(`   ${sig.direction.toUpperCase()} ${sig.outcome} @ ${(sig.currentPrice*100).toFixed(1)}% | $${size} | bal $${newBal}`);
      console.log(`   ${sig.reason}`);
    }
  }

  console.log(`\n━━━ Run complete: ${trades} trade(s) | Balance $${balance.toFixed(4)} ━━━`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
