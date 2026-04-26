// ============================================================================
// SHIESTY POLYMARKET BOT — Railway Worker
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { ClobClient, Side } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import { runSafetyGuards, recordTradeOutcome } from './safety.js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  POLYGON_RPC_URL,
  BOT_PRIVATE_KEY,
  BOT_USER_ID,
  CLOB_API_URL = 'https://clob.polymarket.com',
} = process.env;

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'POLYGON_RPC_URL', 'BOT_PRIVATE_KEY', 'BOT_USER_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env: ${key}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
const clob = new ClobClient(CLOB_API_URL, 137, wallet);

console.log('🟡 Shiesty Worker booted');
console.log('🟡 Wallet:', wallet.address);

function sid(signal) {
  return String(signal.id).slice(0, 8);
}

async function handleSignal(signal) {
  const log = (msg) => console.log(`[${sid(signal)}] ${msg}`);
  log(`📡 Signal received: ${signal.strategy} ${signal.side} ${signal.size_usdc} USDC @ ${signal.entry_price}`);

  const { error: lockErr } = await supabase
    .from('bot_trade_signals')
    .update({ status: 'executing' })
    .eq('id', signal.id)
    .eq('status', 'pending');

  if (lockErr) {
    log(`⚠️ Lock failed: ${lockErr.message}`);
    return;
  }

  const guardResult = await runSafetyGuards(supabase, signal);
  if (!guardResult.passed) {
    log(`🛑 GUARD BLOCKED: ${guardResult.reason}`);
    await supabase
      .from('bot_trade_signals')
      .update({
        status: 'rejected_by_guard',
        rejection_reason: guardResult.reason,
      })
      .eq('id', signal.id);
    return;
  }

  if (signal.mode === 'paper') {
    const simFill = Number(signal.entry_price) * (1 + (Math.random() - 0.5) * 0.005);
    log(`📄 PAPER fill @ ${simFill.toFixed(4)}`);
    const now = new Date().toISOString();
    await supabase
      .from('bot_trade_signals')
      .update({
        status: 'filled',
        tx_hash: `paper_${Date.now()}`,
        executed_at: now,
        exited_at: now,
      })
      .eq('id', signal.id);
    await recordTradeOutcome(supabase, signal, simFill, 0);
    return;
  }

  try {
    log(`💰 LIVE execution starting`);

    const order = await clob.createOrder({
      tokenID: signal.market_id,
      price: signal.entry_price,
      side: signal.side === 'YES' ? Side.BUY : Side.SELL,
      size: signal.size_usdc,
      feeRateBps: 0,
    });

    const resp = await clob.postOrder(order);
    if (!resp.success) throw new Error(`CLOB rejected: ${resp.errorMsg || 'unknown'}`);

    log(`✅ Filled. orderID=${resp.orderID}`);
    await supabase
      .from('bot_trade_signals')
      .update({
        status: 'filled',
        tx_hash: resp.orderID,
        executed_at: new Date().toISOString(),
      })
      .eq('id', signal.id);

    await recordTradeOutcome(supabase, signal, Number(signal.entry_price), 0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`❌ Execution failed: ${msg}`);
    await supabase
      .from('bot_trade_signals')
      .update({
        status: 'failed',
        rejection_reason: msg.slice(0, 500),
      })
      .eq('id', signal.id);
  }
}

const channel = supabase
  .channel('shiesty-signals')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'bot_trade_signals',
      filter: `user_id=eq.${BOT_USER_ID}`,
    },
    (payload) => {
      if (payload.new.status === 'pending') handleSignal(payload.new);
    }
  )
  .subscribe((status) => {
    console.log(`🟡 Realtime status: ${status}`);
  });

setInterval(() => {
  console.log(`💚 alive | ${new Date().toISOString()}`);
}, 60_000);

process.on('SIGTERM', async () => {
  console.log('🟡 SIGTERM — closing channel');
  await channel.unsubscribe();
  process.exit(0);
});
