// Polymarket Types

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  liquidity: number;
  volume: number;
  outcomes: PolymarketOutcome[];
  category: string;
  active: boolean;
  closed: boolean;
}

export interface PolymarketOutcome {
  id: string;
  name: string;
  price: number; // 0-1 representing probability
  tokenId: string;
}

export interface TradeSignal {
  marketId: string;
  direction: 'buy' | 'sell';
  outcome: string;
  tokenId: string;
  confidence: number;
  reason: string;
  suggestedSize: number;
  currentPrice: number;
  targetPrice: number;
}

export interface Position {
  marketId: string;
  marketQuestion: string;
  outcome: string;
  tokenId: string;
  shares: bigint;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  entryTime: Date;
}

export interface TradeResult {
  success: boolean;
  txHash?: string;
  sharesReceived?: bigint;
  amountSpent?: number;
  error?: string;
}

export interface BotConfig {
  maxExposurePerTrade: number; // in USDC
  maxDailyLoss: number; // in USDC
  minLiquidity: number; // minimum market liquidity
  slippageTolerance: number; // 0.01 = 1%
  adminProfitSplit: number; // 0.1111 = 11.11%
  adminWallet: string;
  scanIntervalMs: number;
}

export interface BotState {
  isRunning: boolean;
  currentPnL: number;
  dailyPnL: number;
  totalTrades: number;
  winRate: number;
  positions: Position[];
  lastScan: Date | null;
  status: 'idle' | 'scanning' | 'trading' | 'error';
}

export interface LogEntry {
  id: string;
  msg: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'trade' | 'debug';
  time: string;
}
