// ============================================================================
// SHIESTY POLYMARKET BOT — Safety Guard Module
// File: railway-worker/safety.js
// ============================================================================

/**
 * Run all safety guards before allowing a trade to execute.
 * @returns {{ passed: boolean, reason?: string }}
 */
export async function runSafetyGuards(supabase, signal) {
  const { data: cfg, error } = await supabase
    .from('bot_guard_config')
    .select('*')
    .eq('user_id', signal.user_id)
    .maybeSingle();

  if (error || !cfg) return { passed: false, reason: 'No guard config found' };

  if (!cfg.enabled) return { passed: false, reason: 'Bot is disabled (master switch off)' };

  if (cfg.paper_mode_only && signal.mode === 'live') {
    return { passed: false, reason: 'Paper-mode-only flag is active' };
  }

  if (Number(signal.size_usdc) > Number(cfg.max_position_usdc)) {
    return {
      passed: false,
      reason: `Position ${signal.size_usdc} exceeds max ${cfg.max_position_usdc}`,
    };
  }

  if (signal.strategy === 'whale_mirror' && signal.source_wallet) {
    const whitelisted = (cfg.whitelisted_whales || []).map((w) => w.toLowerCase());
    if (!whitelisted.includes(String(signal.source_wallet).toLowerCase())) {
      return { passed: false, reason: `Whale ${signal.source_wallet} not whitelisted` };
    }
  }

  let concurrentQ = supabase
    .from('bot_trade_signals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', signal.user_id)
    .eq('mode', signal.mode)
    .in('status', ['executing', 'filled'])
    .is('exited_at', null);
  if (signal.id) concurrentQ = concurrentQ.neq('id', signal.id);
  const { count: openCount } = await concurrentQ;

  if ((openCount ?? 0) >= cfg.max_concurrent_positions) {
    return {
      passed: false,
      reason: `${openCount} concurrent positions (max ${cfg.max_concurrent_positions})`,
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from('bot_polymarket_executions')
    .select('pnl_usdc')
    .eq('user_id', signal.user_id)
    .eq('mode', signal.mode)
    .not('closed_at', 'is', null)
    .gte('closed_at', since);

  const dailyPnl = (recent || []).reduce((s, t) => s + Number(t.pnl_usdc || 0), 0);
  if (dailyPnl <= -Number(cfg.max_daily_loss_usdc)) {
    return {
      passed: false,
      reason: `Daily loss ${dailyPnl.toFixed(2)} hit limit ${-cfg.max_daily_loss_usdc}`,
    };
  }

  const { data: lastN } = await supabase
    .from('bot_polymarket_executions')
    .select('pnl_usdc')
    .eq('user_id', signal.user_id)
    .eq('mode', signal.mode)
    .not('closed_at', 'is', null)
    .order('closed_at', { ascending: false })
    .limit(cfg.max_consecutive_losses);

  if (lastN && lastN.length >= cfg.max_consecutive_losses) {
    const allLosses = lastN.every((t) => Number(t.pnl_usdc) < 0);
    if (allLosses) {
      return { passed: false, reason: `${cfg.max_consecutive_losses} consecutive losses — cooling off` };
    }
  }

  return { passed: true };
}

/**
 * Log fill to bot_polymarket_executions (separate from SQI BTC bot_trades).
 */
export async function recordTradeOutcome(supabase, signal, fillPrice, pnl) {
  await supabase.from('bot_polymarket_executions').insert({
    user_id: signal.user_id,
    signal_id: signal.id,
    market_id: signal.market_id,
    market_question: signal.market_question,
    side: signal.side,
    size_usdc: signal.size_usdc,
    entry_price: signal.entry_price,
    fill_price: fillPrice,
    strategy: signal.strategy,
    mode: signal.mode,
    pnl_usdc: pnl,
    closed_at: new Date().toISOString(),
  });
}
