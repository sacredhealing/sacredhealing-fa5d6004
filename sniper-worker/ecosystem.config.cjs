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
      HELIUS_API_KEY:      '',   // SET THIS
      CHAINSTACK_ENDPOINT: '',   // SET AFTER buying Chainstack Growth plan
      CHAINSTACK_TOKEN:    '',   // SET AFTER buying Chainstack
      GEMINI_API_KEY:      'AIzaAb8RN6I1pEG3CwLRQUrouoAGdXVOb--n9niPBfnCdu_OCQnkJw',
      WALLET_PRIVATE_KEY:  '',   // base58 private key of dedicated sniper wallet
      TELEGRAM_TOKEN:      '',   // optional alerts
      TELEGRAM_CHAT_ID:    '',   // optional alerts
      // ── Position sizing: 5% of balance per trade ──
      // Set BUY_AMOUNT_SOL dynamically or use fixed:
      BUY_AMOUNT_SOL:      '0.05',  // ~5% of 1 SOL
      MAX_OPEN_POSITIONS:  '5',
      MAX_DAILY_TRADES:    '20',
      MAX_DAILY_LOSS_SOL:  '0.5',
      // ── Exit strategy ──
      TAKE_PROFIT_X:       '3.0',   // TP1: sell 50% at 3x
      MOONBAG_X:           '10.0',  // TP2: sell 40% at 10x, 10% rides
      STOP_LOSS_PCT:       '0.35',  // hard SL -35%
      TRAILING_STOP_PCT:   '0.25',  // trail 25% from ATH
      TRAIL_ACTIVATE_PCT:  '0.20',  // trailing activates at +20% gain
      MAX_HOLD_MINUTES:    '30',
      MIN_AI_SCORE:        '60',
      JITO_TIP_SOL:        '0.001',
      SLIPPAGE_BPS:        '8000',
      MAX_PRICE_IMPACT_PCT:'15',    // hard cap, independent of slippage tolerance
      AI_TIMEOUT_MS:       '350',   // AI veto must respond within this or it's ignored (fail-open)
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
