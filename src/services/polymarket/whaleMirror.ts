// Whale Mirror Trading Strategy
// Monitors and mirrors trades from top-tier Polymarket whales like 0x8dxd

import { ethers } from 'ethers';
import type { TradeSignal } from '@/types/polymarket';

// Target whale wallets to monitor
export const WHALE_TARGETS = {
  '0x8dxd': '0x8dXd0fd6Fb4c7B1c5E3f5f6f8f9f0f1f2f3f4f5f6', // Placeholder - need real address
  // Add more whales here
};

// Polymarket CTF contract events
const CTF_EXCHANGE_ABI = [
  'event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled)',
  'event TakerAssetFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled)',
];

// Polygon block time is ~2 seconds
const MEMPOOL_SCAN_INTERVAL = 500; // 500ms for near-atomic execution

export interface WhaleTransaction {
  whaleAddress: string;
  txHash: string;
  marketId: string;
  tokenId: string;
  direction: 'buy' | 'sell';
  amount: bigint;
  price: number;
  blockNumber: number;
  timestamp: number;
}

export interface MirrorConfig {
  enabled: boolean;
  maxMirrorSize: number; // Max USDC to mirror per trade
  mirrorPercentage: number; // % of whale trade to mirror (0.1 = 10%)
  delayMs: number; // Delay before mirroring (for safety)
  whitelistedWhales: string[];
}

export class WhaleMirrorService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private isMonitoring = false;
  private config: MirrorConfig;
  private pendingTxs: Map<string, WhaleTransaction> = new Map();
  private onSignalCallback: ((signal: TradeSignal, whale: WhaleTransaction) => void) | null = null;

  constructor(config: Partial<MirrorConfig> = {}) {
    this.config = {
      enabled: true,
      maxMirrorSize: 50, // $50 max per mirror
      mirrorPercentage: 0.05, // Mirror 5% of whale trades
      delayMs: 100, // 100ms delay for safety
      whitelistedWhales: Object.values(WHALE_TARGETS),
      ...config,
    };
  }

  async initialize(privateKey: string, rpcUrl: string): Promise<void> {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    console.log('[WhaleMirror] Initialized with wallet:', this.wallet.address);
  }

  // Set callback for when a mirror signal is detected
  onMirrorSignal(callback: (signal: TradeSignal, whale: WhaleTransaction) => void): void {
    this.onSignalCallback = callback;
  }

  // Start monitoring mempool for whale transactions
  async startMonitoring(): Promise<void> {
    if (!this.provider || this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('[WhaleMirror] Starting mempool monitoring...');

    // Subscribe to pending transactions (mempool)
    this.provider.on('pending', async (txHash: string) => {
      try {
        await this.processPendingTx(txHash);
      } catch (err) {
        // Silently ignore - many pending txs will fail to fetch
      }
    });

    // Also listen for confirmed blocks to catch what we missed
    this.provider.on('block', async (blockNumber: number) => {
      try {
        await this.processBlock(blockNumber);
      } catch (err) {
        console.error('[WhaleMirror] Block processing error:', err);
      }
    });
  }

  // Process a pending transaction from mempool
  private async processPendingTx(txHash: string): Promise<void> {
    if (!this.provider) return;

    const tx = await this.provider.getTransaction(txHash);
    if (!tx) return;

    // Check if transaction is from a whale
    const isWhale = this.config.whitelistedWhales.some(
      whale => whale.toLowerCase() === tx.from?.toLowerCase()
    );

    if (!isWhale) return;

    // Check if it's a Polymarket trade (CTF Exchange interaction)
    const CTF_EXCHANGE = '0x4bFb41d9539d67a68D6FB09be3c29aE0dC14dc3a';
    if (tx.to?.toLowerCase() !== CTF_EXCHANGE.toLowerCase()) return;

    console.log('[WhaleMirror] Detected whale transaction:', txHash);

    // Parse the transaction data
    const whaleTx = await this.parseWhaleTrade(tx);
    if (whaleTx) {
      this.pendingTxs.set(txHash, whaleTx);
      await this.executeMirror(whaleTx);
    }
  }

  // Process a confirmed block for whale transactions we might have missed
  private async processBlock(blockNumber: number): Promise<void> {
    if (!this.provider) return;

    const block = await this.provider.getBlock(blockNumber, true);
    if (!block || !block.prefetchedTransactions) return;

    for (const tx of block.prefetchedTransactions) {
      const isWhale = this.config.whitelistedWhales.some(
        whale => whale.toLowerCase() === tx.from?.toLowerCase()
      );

      if (isWhale && tx.to?.toLowerCase() === '0x4bFb41d9539d67a68D6FB09be3c29aE0dC14dc3a'.toLowerCase()) {
        const whaleTx = await this.parseWhaleTrade(tx);
        if (whaleTx && !this.pendingTxs.has(tx.hash)) {
          console.log('[WhaleMirror] Found whale trade in block:', blockNumber);
          await this.executeMirror(whaleTx);
        }
      }
    }
  }

  // Parse a whale trade transaction
  private async parseWhaleTrade(tx: ethers.TransactionResponse): Promise<WhaleTransaction | null> {
    try {
      // Decode the transaction input data
      // This is a simplified version - full implementation needs CTF ABI decoding
      const iface = new ethers.Interface([
        'function fillOrder((uint256 salt, address maker, address signer, address taker, uint256 tokenId, uint256 makerAmount, uint256 takerAmount, uint256 expiration, uint256 nonce, uint256 feeRateBps, uint8 side, uint8 signatureType) order, bytes signature, uint256 fillAmount)',
      ]);

      const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      if (!decoded) return null;

      const order = decoded.args[0];
      const fillAmount = decoded.args[2];

      return {
        whaleAddress: tx.from,
        txHash: tx.hash,
        marketId: '', // Need to map tokenId to market
        tokenId: order.tokenId.toString(),
        direction: order.side === 0 ? 'buy' : 'sell',
        amount: BigInt(fillAmount),
        price: Number(order.takerAmount) / Number(order.makerAmount),
        blockNumber: tx.blockNumber || 0,
        timestamp: Date.now(),
      };
    } catch (err) {
      // Transaction might not be a fillOrder call
      return null;
    }
  }

  // Execute a mirror trade
  private async executeMirror(whaleTx: WhaleTransaction): Promise<void> {
    if (!this.config.enabled || !this.onSignalCallback) return;

    // Calculate mirror size
    const whaleAmountUSDC = Number(whaleTx.amount) / 1e6;
    const mirrorAmount = Math.min(
      whaleAmountUSDC * this.config.mirrorPercentage,
      this.config.maxMirrorSize
    );

    if (mirrorAmount < 1) return; // Skip tiny trades

    // Add configured delay
    await new Promise(r => setTimeout(r, this.config.delayMs));

    // Create trade signal
    const signal: TradeSignal = {
      marketId: whaleTx.marketId,
      direction: whaleTx.direction,
      outcome: whaleTx.direction === 'buy' ? 'Yes' : 'No',
      tokenId: whaleTx.tokenId,
      confidence: 95, // High confidence for whale mirror
      reason: `Mirroring whale ${whaleTx.whaleAddress.slice(0, 8)}... trade`,
      suggestedSize: mirrorAmount,
      currentPrice: whaleTx.price,
      targetPrice: whaleTx.direction === 'buy' ? whaleTx.price * 1.05 : whaleTx.price * 0.95,
    };

    console.log('[WhaleMirror] Generating mirror signal:', signal);
    this.onSignalCallback(signal, whaleTx);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.provider) {
      this.provider.removeAllListeners();
    }
    this.isMonitoring = false;
    console.log('[WhaleMirror] Monitoring stopped');
  }

  // Update configuration
  updateConfig(newConfig: Partial<MirrorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current config
  getConfig(): MirrorConfig {
    return this.config;
  }

  // Check if monitoring is active
  isActive(): boolean {
    return this.isMonitoring;
  }
}

export const whaleMirrorService = new WhaleMirrorService();
