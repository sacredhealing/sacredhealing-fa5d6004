module.exports = {
  apps: [{
    name:          'sniper-live',
    script:        '/root/sniper-worker/index.js',
    interpreter:   'node',
    interpreter_args: '--max-old-space-size=512',
    env: {
      NODE_ENV:            'production',
      PAPER_MODE:          'true',
      BRIDGE_URL:          'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/clawbot-bridge',
      BRIDGE_SECRET:       'clawbot-bridge-2026', // confirm/override from Lovable → Edge Functions → clawbot-bridge → Secrets (CLAWBOT_BRIDGE_SECRET) if this 403s
      SUPABASE_ANON_KEY:   '', // only set if BRIDGE_SECRET alone still 403s — Supabase's gateway may require it in addition
      HELIUS_API_KEY:      '',   // SET THIS — now also drives detection (WebSocket), not just price/dev-wallet reads
      GEMINI_API_KEY:      '',   // SET THIS — AI veto score, moved back here from the (now retired) edge function
      WALLET_PRIVATE_KEY:  '',   // SET THIS — dedicated sniper wallet, never Phantom/main wallet
      TELEGRAM_TOKEN:      '',   // optional alerts
      TELEGRAM_CHAT_ID:    '',   // optional alerts
      // ── v6: everything lives in THIS process now — detection, entry filter,
      //    AI veto, and exit. The v5 split (edge function did entry, this did
      //    exit) is retired; the edge function + webhook registration in the
      //    repo are no longer wired to anything live. See index.js header. ──
      BUY_AMOUNT_SOL:       '0.05',  // SOL per entry
      MAX_OPEN_POSITIONS:   '5',
      MAX_DAILY_TRADES:     '20',
      MAX_DAILY_LOSS_SOL:   '0.5',
      MIN_AI_SCORE:         '60',    // below this, AI veto rejects (fails open if Gemini errors/times out)
      AI_TIMEOUT_MS:        '350',   // hard cap on AI veto latency before failing open
      TAKE_PROFIT_X:       '3.0',   // TP1: sell 50% at 3x
      MOONBAG_X:           '10.0',  // TP2: sell 40% at 10x, 10% rides
      STOP_LOSS_PCT:       '0.35',  // hard SL -35%
      TRAILING_STOP_PCT:   '0.25',  // trail 25% from ATH
      TRAIL_ACTIVATE_PCT:  '0.20',  // trailing activates at +20% gain
      MAX_HOLD_MINUTES:    '30',
      JITO_TIP_SOL:        '0.001',
      SLIPPAGE_BPS:        '8000',
      MAX_PRICE_IMPACT_PCT:'15',    // hard cap, independent of slippage tolerance
    },
    restart_delay:    3000,
    max_restarts:     50,
    watch:            false,
    autorestart:      true,
    log_date_format:  'YYYY-MM-DD HH:mm:ss',
    out_file:         '/root/logs/sniper-out.log',
    error_file:       '/root/logs/sniper-err.log',
  }]
};
