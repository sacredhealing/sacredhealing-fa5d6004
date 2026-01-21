// Polymarket Trading Engine - Central Export
// Three-pillar HFT strategy: Mirror, Latency Arbitrage, Volatility Scalping

export { whaleMirrorService, WhaleMirrorService, WHALE_TARGETS } from './whaleMirror';
export type { WhaleTransaction, MirrorConfig } from './whaleMirror';

export { latencyArbitrageService, LatencyArbitrageService } from './latencyArbitrage';

export { volatilityScalperService, VolatilityScalperService } from './volatilityScalper';

export { clobTradingService, ClobTradingService } from './clobTrading';

export { paperTradingService, PaperTradingService } from './paperTrading';
export type { PaperTrade, PaperPosition, BotSettings } from './paperTrading';

// Strategy names for UI
export const STRATEGY_NAMES = {
  WHALE_MIRROR: 'Atomic Mirror Trading',
  LATENCY_ARB: 'Neural Latency Arbitrage', 
  VOLATILITY_SCALP: 'Volatility Scalping',
};

// Strategy descriptions
export const STRATEGY_DESCRIPTIONS = {
  WHALE_MIRROR: 'Monitors 0x8dxd whale wallet and mirrors trades atomically in same block',
  LATENCY_ARB: 'Uses Gemini 3 Flash to detect breaking news and trade before market reacts',
  VOLATILITY_SCALP: 'Places laddered limit orders to capture micro-dips in volatile markets',
};
