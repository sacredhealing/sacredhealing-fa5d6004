// Whale Mirror Trading Strategy
// Watches the NEG_RISK CTF Exchange for fills from whitelisted whale wallets.

import { ethers } from 'ethers';
import type { TradeSignal, PolymarketMarket } from '@/types/polymarket';

export const WHALE_TARGETS = {
  '0x8dxd': '0x63ce342161250d705dc0b16df89036c8e5f9ba9a',
};

const NEG_RISK_CTF_EXCHANGE = '0xC5d563A36AE78145C45a50134d48A1215220f80a';

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
  maxMirrorSize: number;
  mirrorPercentage: number;
  delayMs: number;
  whitelistedWhales: string[];
}

export class WhaleMirrorService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private isMonitoring = false;
  private config: MirrorConfig;
  private pendingTxs: Map<string, WhaleTransaction> = new Map();
  private onSignalCallback: ((signal: TradeSignal, whale: WhaleTransaction) => void) | null = null;

  private tokenIndex: Map<
    string,
    { marketId: string; outcomeName: string; price: number }
  > = new Map();

  constructor(config: Partial<MirrorConfig> = {}) {
    this.config = {
      enabled: true,
      maxMirrorSize: 5,
      mirrorPercentage: 0.01,
      delayMs: 100,
      whitelistedWhales: Object.values(WHALE_TARGETS),
      ...config,
    };
  }

  async initialize(privateKey: string, rpcUrl: string): Promise<void> {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    console.log('[WhaleMirror] Initialized (live) with wallet:', this.wallet.address);
  }

  initializeReadOnly(rpcUrl: string): void {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
    this.wallet = null;
    console.log('[WhaleMirror] Initialized (read-only / paper)');
  }

  onMirrorSignal(callback: (signal: TradeSignal, whale: WhaleTransaction) => void): void {
    this.onSignalCallback = callback;
  }

  updateMarketIndex(markets: PolymarketMarket[]): void {
    this.tokenIndex.clear();
    for (const m of markets) {
      for (const o of m.outcomes) {
        if (o.tokenId) {
          this.tokenIndex.set(o.tokenId, {
            marketId: m.id,
            outcomeName: o.name,
            price: o.price,
          });
        }
      }
    }
  }

  async startMonitoring(): Promise<void> {
    if (!this.provider || this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('[WhaleMirror] Starting mempool + block monitoring...');

    try {
      this.provider.on('pending', async (txHash: string) => {
        try {
          await this.processPendingTx(txHash);
        } catch {
          /* many pending txs fail to fetch */
        }
      });
    } catch {
      console.warn('[WhaleMirror] Pending tx subscription unavailable on this RPC');
    }

    this.provider.on('block', async (blockNumber: number) => {
      try {
        await this.processBlock(blockNumber);
      } catch (err) {
        console.error('[WhaleMirror] Block processing error:', err);
      }
    });
  }

  private isWhaleSender(addr: string | null | undefined): boolean {
    if (!addr) return false;
    const lower = addr.toLowerCase();
    return this.config.whitelistedWhales.some((w) => w.toLowerCase() === lower);
  }

  private isExchangeTarget(addr: string | null | undefined): boolean {
    if (!addr) return false;
    return addr.toLowerCase() === NEG_RISK_CTF_EXCHANGE.toLowerCase();
  }

  private async processPendingTx(txHash: string): Promise<void> {
    if (!this.provider) return;
    const tx = await this.provider.getTransaction(txHash);
    if (!tx) return;
    if (!this.isWhaleSender(tx.from)) return;
    if (!this.isExchangeTarget(tx.to)) return;

    console.log('[WhaleMirror] Detected whale tx:', txHash);
    const whaleTx = await this.parseWhaleTrade(tx);
    if (whaleTx) {
      this.pendingTxs.set(txHash, whaleTx);
      await this.executeMirror(whaleTx);
    }
  }

  private async processBlock(blockNumber: number): Promise<void> {
    if (!this.provider) return;
    const block = await this.provider.getBlock(blockNumber, true);
    if (!block || !block.prefetchedTransactions) return;

    for (const tx of block.prefetchedTransactions) {
      if (!this.isWhaleSender(tx.from)) continue;
      if (!this.isExchangeTarget(tx.to)) continue;
      if (this.pendingTxs.has(tx.hash)) continue;

      const whaleTx = await this.parseWhaleTrade(tx);
      if (whaleTx) {
        console.log('[WhaleMirror] Found whale trade in block:', blockNumber);
        await this.executeMirror(whaleTx);
      }
    }
  }

  private async parseWhaleTrade(
    tx: ethers.TransactionResponse
  ): Promise<WhaleTransaction | null> {
    try {
      const iface = new ethers.Interface([
        'function fillOrder((uint256 salt, address maker, address signer, address taker, uint256 tokenId, uint256 makerAmount, uint256 takerAmount, uint256 expiration, uint256 nonce, uint256 feeRateBps, uint8 side, uint8 signatureType) order, bytes signature, uint256 fillAmount)',
      ]);

      const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      if (!decoded) return null;

      const order = decoded.args[0];
      const fillAmount = decoded.args[2];

      const tokenIdStr = order.tokenId.toString();
      const indexed = this.tokenIndex.get(tokenIdStr);

      const direction: 'buy' | 'sell' = order.side === 0 ? 'buy' : 'sell';

      const makerN = Number(order.makerAmount);
      const takerN = Number(order.takerAmount);
      let price = 0;
      if (direction === 'buy' && takerN > 0) {
        price = makerN / takerN;
      } else if (direction === 'sell' && makerN > 0) {
        price = takerN / makerN;
      }

      return {
        whaleAddress: tx.from,
        txHash: tx.hash,
        marketId: indexed?.marketId || '',
        tokenId: tokenIdStr,
        direction,
        amount: BigInt(fillAmount),
        price: price > 0 && price < 1 ? price : indexed?.price ?? 0.5,
        blockNumber: tx.blockNumber || 0,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  private async executeMirror(whaleTx: WhaleTransaction): Promise<void> {
    if (!this.config.enabled || !this.onSignalCallback) return;

    if (!whaleTx.marketId || !whaleTx.tokenId) {
      console.log('[WhaleMirror] Skipping unresolved whale tx (no marketId)');
      return;
    }

    const whaleAmountUSDC = Number(whaleTx.amount) / 1e6;
    const mirrorAmount = Math.min(
      whaleAmountUSDC * this.config.mirrorPercentage,
      this.config.maxMirrorSize
    );

    if (mirrorAmount < 0.5) return;

    if (this.config.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.config.delayMs));
    }

    const indexed = this.tokenIndex.get(whaleTx.tokenId);
    const outcomeName = indexed?.outcomeName || (whaleTx.direction === 'buy' ? 'Yes' : 'No');
    const currentPrice = indexed?.price ?? whaleTx.price;

    const signal: TradeSignal = {
      marketId: whaleTx.marketId,
      direction: whaleTx.direction,
      outcome: outcomeName,
      tokenId: whaleTx.tokenId,
      confidence: 95,
      reason: `Mirror whale ${whaleTx.whaleAddress.slice(0, 8)}…`,
      suggestedSize: mirrorAmount,
      currentPrice,
      targetPrice:
        whaleTx.direction === 'buy'
          ? Math.min(currentPrice * 1.05, 0.95)
          : Math.max(currentPrice * 0.95, 0.05),
    };

    console.log('[WhaleMirror] Mirror signal:', signal);
    this.onSignalCallback(signal, whaleTx);
  }

  stopMonitoring(): void {
    if (this.provider) {
      this.provider.removeAllListeners();
    }
    this.isMonitoring = false;
    console.log('[WhaleMirror] Monitoring stopped');
  }

  updateConfig(newConfig: Partial<MirrorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MirrorConfig {
    return this.config;
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}

export const whaleMirrorService = new WhaleMirrorService();
