module.exports = {
  apps: [{
    name:          'sniper-live',
    script:        '/root/sniper-worker/index.js',
    interpreter:   'node',
    interpreter_args: '--max-old-space-size=512',
    env: {
      NODE_ENV:            'production',
      PAPER_MODE:          'true',
      SUPABASE_URL:        'https://ssygukfdbtehvtndandn.supabase.co',
      SUPABASE_SERVICE_KEY:'',   // SET THIS
      HELIUS_API_KEY:      '',   // SET THIS — used for price/dev-wallet RPC reads, not detection anymore
      WALLET_PRIVATE_KEY:  '',   // SET THIS — same dedicated wallet the edge function buys with
      TELEGRAM_TOKEN:      '',   // optional alerts
      TELEGRAM_CHAT_ID:    '',   // optional alerts
      // ── Exit strategy — this is the ONLY thing this process decides.
      //    Entry config (BUY_AMOUNT_SOL, MAX_OPEN_POSITIONS, MAX_DAILY_TRADES,
      //    MAX_DAILY_LOSS_SOL, MIN_AI_SCORE, AI_TIMEOUT_MS, GEMINI_API_KEY) now
      //    lives in the sniper-helius-webhook edge function's Supabase secrets,
      //    not here — detection and entry happen there, not on Hetzner. ──
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
