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
      HELIUS_API_KEY:      '',   // SET THIS — keep as fallback
      CHAINSTACK_ENDPOINT: '',   // SET AFTER buying Chainstack
      CHAINSTACK_TOKEN:    '',   // SET AFTER buying Chainstack
      GEMINI_API_KEY:      'AIzaAb8RN6I1pEG3CwLRQUrouoAGdXVOb--n9niPBfnCdu_OCQnkJw',
      WALLET_PRIVATE_KEY:  '',   // SET FOR LIVE MODE
      TELEGRAM_TOKEN:      '',   // optional
      TELEGRAM_CHAT_ID:    '',   // optional
      BUY_AMOUNT_SOL:      '0.05',
      MAX_OPEN_POSITIONS:  '5',
      MAX_DAILY_TRADES:    '20',
      MAX_DAILY_LOSS_SOL:  '0.5',
      TAKE_PROFIT_X:       '3.0',
      MOONBAG_X:           '10.0',
      STOP_LOSS_PCT:       '0.35',
      TRAILING_STOP_PCT:   '0.25',
      MAX_HOLD_MINUTES:    '30',
      MIN_AI_SCORE:        '60',
      JITO_TIP_SOL:        '0.001',
      SLIPPAGE_BPS:        '8000',
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
