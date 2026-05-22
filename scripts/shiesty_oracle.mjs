#!/usr/bin/env node
/**
 * SQI-2050 Shiesty Signal Oracle — GitHub Actions 24/7
 * Single-snapshot strategies (no price history needed)
 * Runs every 15 min via cron schedule
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAPER_MODE   = (process.env.PAPER_MODE ?? 'true') === 'true';
const RISK_PCT     = parseFloat(process.env.RISK_PCT || '0.05');
const GAMMA_API    = 'https://gamma-api.polymarket.com';

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('FATAL: missing env vars'); process.exit(1); }

async function dbGet(table, filter = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) { console.error(`dbGet ${table} failed: ${r.status} ${await r.text()}`); return null; }
  return r.json();
}

async function dbInsert(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  });
  if (!r.ok) console.error(`dbInsert ${table} failed: ${r.status} ${await r.text()}`);
  return r.ok;
}

async function dbUpdate(table, filter, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.ok;
}

async function fetchMarkets() {
  try {
    const r = await fetch(`${GAMMA_API}/markets?limit=100&active=true&closed=false`);
    if (!r.ok) { console.error('Markets fetch failed:', r.status); return []; }
    const data = await r.json();
    console.log(`Raw markets from API: ${data.length}`);
    return data.map(m => {
      let names, prices, tokenIds;
      try { names = JSON.parse(m.outcomes || '["Yes","No"]'); } catch { names = ['Yes','No']; }
      try { prices = JSON.parse(m.outcomePrices || '[0.5,0.5]'); } catch { prices = [0.5,0.5]; }
      try { tokenIds = JSON.parse(m.clobTokenIds || '["",""]'); } catch { tokenIds = ['','']; }
      return {
        id: m.id, question: m.question,
        liquidity: parseFloat(m.liquidity) || 0,
        volume:    parseFloat(m.volume)    || 0,
        closed:    m.closed || false,
        outcomes:  names.map((name, i) => ({
          name, price: parseFloat(prices[i]) || 0.5, tokenId: tokenIds[i] || '',
        })),
      };
    });
  } catch(e) { console.error('fetchMarkets error:', e.message); return []; }
}

// Strategy 1: Price Momentum — buy markets with strong directional prices + liquidity
function momentumSignals(markets) {
  const signals = [];
  const active = markets.filter(m => !m.closed && m.liquidity > 1000)
                        .sort((a,b) => b.volume - a.volume)
                        .slice(0, 30);
  
  console.log(`Momentum: scanning ${active.length} active markets with liquidity>1000`);
  
  for (const m of active) {
    const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const no  = m.outcomes.find(o => o.name.toLowerCase() === 'no');
    if (!yes || !no) continue;
    
    // Strong YES momentum: 60-80% range (not too extreme, good value)
    if (yes.price >= 0.60 && yes.price <= 0.80 && m.volume > 5000) {
      signals.push({
        marketId: m.id, direction: 'buy', outcome: 'Yes',
        tokenId: yes.tokenId, currentPrice: yes.price,
        confidence: Math.min(85, 60 + (yes.price - 0.5) * 100),
        reason: `[MOMENTUM] ${m.question.slice(0,80)} | YES@${(yes.price*100).toFixed(0)}%`,
        strategy: 'momentum',
      });
    }
    // Contrarian NO: YES is overpriced (85-95%), buy NO cheap
    else if (yes.price >= 0.85 && yes.price <= 0.95 && no.price <= 0.15 && m.volume > 10000) {
      signals.push({
        marketId: m.id, direction: 'buy', outcome: 'No',
        tokenId: no.tokenId, currentPrice: no.price,
        confidence: Math.min(75, 50 + (1 - yes.price) * 200),
        reason: `[CONTRARIAN] ${m.question.slice(0,80)} | NO@${(no.price*100).toFixed(0)}%`,
        strategy: 'contrarian',
      });
    }
  }
  return signals;
}

// Strategy 2: High Volume Value — high volume + fair price = smart money signal
function valueSignals(markets) {
  const signals = [];
  const sorted = markets.filter(m => !m.closed && m.volume > 50000 && m.liquidity > 5000)
                        .sort((a,b) => b.volume - a.volume)
                        .slice(0, 10);

  console.log(`Value: ${sorted.length} high-volume markets (vol>50k)`);

  for (const m of sorted) {
    const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
    if (!yes) continue;
    if (yes.price < 0.20 || yes.price > 0.80) continue; // skip extremes
    signals.push({
      marketId: m.id, direction: 'buy', outcome: 'Yes',
      tokenId: yes.tokenId, currentPrice: yes.price,
      confidence: Math.min(80, 55 + (m.volume / 1000000) * 5),
      reason: `[VALUE] ${m.question.slice(0,80)} | vol=$${(m.volume/1000).toFixed(0)}k`,
      strategy: 'value',
    });
  }
  return signals.slice(0, 2);
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SQI-2050 ⚡ Shiesty Signal Oracle');
  console.log(`  Mode: ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Risk: ${RISK_PCT*100}%`);
  console.log('═══════════════════════════════════════════════════');

  const settings = await dbGet('polymarket_bot_settings', 'limit=1');
  console.log('Settings:', JSON.stringify(settings));
  let balance = (settings?.length) ? parseFloat(settings[0].paper_balance) : 10;
  console.log(`Balance: $${balance.toFixed(2)}`);

  const markets = await fetchMarkets();
  console.log(`Markets loaded: ${markets.length}`);
  if (!markets.length) { console.log('No markets. Exiting.'); return; }

  const allSignals = [
    ...momentumSignals(markets),
    ...valueSignals(markets),
  ].sort((a,b) => b.confidence - a.confidence).slice(0, 3);

  console.log(`\nSignals generated: ${allSignals.length}`);

  let trades = 0;
  for (const sig of allSignals) {
    const size = Math.min(50, Math.max(0.5, parseFloat((balance * RISK_PCT).toFixed(2))));
    const fee  = size * 0.0005;
    const cost = size + fee;

    if (cost > balance) { console.log(`SKIP: insufficient balance`); continue; }

    const newBal = balance - cost;
    const txHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    const ok = await dbInsert('polymarket_trades', {
      market_id:       sig.marketId,
      market_question: sig.reason,
      outcome:         sig.outcome,
      token_id:        sig.tokenId || txHash,
      direction:       sig.direction,
      shares:          size / sig.currentPrice,
      entry_price:     sig.currentPrice,
      amount_usdc:     size,
      tx_hash:         txHash,
      strategy:        sig.strategy,
      is_paper:        true,
      status:          'open',
    });

    if (ok) {
      await dbUpdate('polymarket_bot_settings', 'limit=1',
        { paper_balance: parseFloat(newBal.toFixed(4)) });
      balance = newBal;
      trades++;
      console.log(`✅ TRADE: ${sig.strategy} | BUY ${sig.outcome} @ ${(sig.currentPrice*100).toFixed(1)}% | $${size.toFixed(2)} | bal $${newBal.toFixed(2)}`);
      console.log(`   ${sig.reason}`);
    }
  }

  console.log(`\n✅ Done. Trades: ${trades} | Balance: $${balance.toFixed(2)}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
