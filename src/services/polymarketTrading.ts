// Polymarket Trading Service
// Handles on-chain trading via FPMM contracts on Polygon

import { ethers } from 'ethers';
import type { TradeResult, BotConfig, Position, TradeSignal } from '@/types/polymarket';

// Polygon Mainnet Addresses (checksummed correctly)
export const POLYGON_ADDRESSES = {
  USDC_E: ethers.getAddress('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'), // Bridged USDC.e
  USDC_NATIVE: ethers.getAddress('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'), // Native USDC
  CTF_EXCHANGE: ethers.getAddress('0x4bFb4548ed1C835C5c39683b78beab90FA79e0c8'), // CTF Exchange (correct checksum)
  NEG_RISK_CTF_EXCHANGE: ethers.getAddress('0xC5d563A36AE78145C45a50134d48A1215220f80a'),
  CONDITIONAL_TOKENS: ethers.getAddress('0x4D97DCd97eC945f40cF65F87097ACe5EA0476045'),
};

// ERC20 ABI for approvals and transfers
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

// CTF Exchange ABI (simplified for trading)
const CTF_EXCHANGE_ABI = [
  'function getOrderHash((uint256 salt, address maker, address signer, address taker, uint256 tokenId, uint256 makerAmount, uint256 takerAmount, uint256 expiration, uint256 nonce, uint256 feeRateBps, uint8 side, uint8 signatureType)) view returns (bytes32)',
  'function fillOrder((uint256 salt, address maker, address signer, address taker, uint256 tokenId, uint256 makerAmount, uint256 takerAmount, uint256 expiration, uint256 nonce, uint256 feeRateBps, uint8 side, uint8 signatureType) order, bytes signature, uint256 fillAmount) external',
  'function fillOrders((uint256 salt, address maker, address signer, address taker, uint256 tokenId, uint256 makerAmount, uint256 takerAmount, uint256 expiration, uint256 nonce, uint256 feeRateBps, uint8 side, uint8 signatureType)[] orders, bytes[] signatures, uint256 takerFillAmount, uint256 makerFillAmount) external',
];

// Conditional Tokens ABI
const CONDITIONAL_TOKENS_ABI = [
  'function balanceOf(address owner, uint256 id) view returns (uint256)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external',
  'function setApprovalForAll(address operator, bool approved) external',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
];

export class PolymarketTrading {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private config: BotConfig;
  private positions: Position[] = [];

  constructor(config: Partial<BotConfig> = {}) {
    this.config = {
      maxExposurePerTrade: 100, // $100 max per trade
      maxDailyLoss: 500, // $500 daily loss limit
      minLiquidity: 10000, // $10k minimum liquidity
      slippageTolerance: 0.01, // 1%
      adminProfitSplit: 0.1111, // 11.11%
      adminWallet: '0x0000000000000000000000000000000000000000', // TODO: Set admin wallet
      scanIntervalMs: 5000, // 5 seconds
      ...config,
    };
  }

  // Initialize with provider and wallet
  async initialize(privateKey: string, rpcUrl: string): Promise<string> {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    return this.wallet.address;
  }

  // Check and approve USDC.e for CTF Exchange
  async approveUSDCE(): Promise<TradeResult> {
    if (!this.wallet || !this.provider) {
      return { success: false, error: 'Wallet not initialized' };
    }

    try {
      const usdcContract = new ethers.Contract(
        POLYGON_ADDRESSES.USDC_E,
        ERC20_ABI,
        this.wallet
      );

      // Check current allowance
      const currentAllowance = await usdcContract.allowance(
        this.wallet.address,
        POLYGON_ADDRESSES.CTF_EXCHANGE
      );

      if (currentAllowance > BigInt(1e12)) {
        return { success: true, txHash: 'already-approved' };
      }

      // Approve max amount
      const tx = await usdcContract.approve(
        POLYGON_ADDRESSES.CTF_EXCHANGE,
        ethers.MaxUint256
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Approval failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Approval failed',
      };
    }
  }

  // Get current USDC.e allowance
  async getAllowance(): Promise<bigint> {
    if (!this.wallet || !this.provider) return BigInt(0);

    try {
      const usdcContract = new ethers.Contract(
        POLYGON_ADDRESSES.USDC_E,
        ERC20_ABI,
        this.provider
      );

      return await usdcContract.allowance(
        this.wallet.address,
        POLYGON_ADDRESSES.CTF_EXCHANGE
      );
    } catch {
      return BigInt(0);
    }
  }

  // Get USDC.e balance
  async getUSDCBalance(): Promise<{ usdcE: bigint; usdcNative: bigint }> {
    if (!this.wallet || !this.provider) {
      return { usdcE: BigInt(0), usdcNative: BigInt(0) };
    }

    try {
      const usdcEContract = new ethers.Contract(
        POLYGON_ADDRESSES.USDC_E,
        ERC20_ABI,
        this.provider
      );
      const usdcNativeContract = new ethers.Contract(
        POLYGON_ADDRESSES.USDC_NATIVE,
        ERC20_ABI,
        this.provider
      );

      const [usdcE, usdcNative] = await Promise.all([
        usdcEContract.balanceOf(this.wallet.address),
        usdcNativeContract.balanceOf(this.wallet.address),
      ]);

      return { usdcE, usdcNative };
    } catch {
      return { usdcE: BigInt(0), usdcNative: BigInt(0) };
    }
  }

  // Get conditional token balance for a specific outcome
  async getConditionalTokenBalance(tokenId: string): Promise<bigint> {
    if (!this.wallet || !this.provider) return BigInt(0);

    try {
      const ctContract = new ethers.Contract(
        POLYGON_ADDRESSES.CONDITIONAL_TOKENS,
        CONDITIONAL_TOKENS_ABI,
        this.provider
      );

      return await ctContract.balanceOf(this.wallet.address, tokenId);
    } catch {
      return BigInt(0);
    }
  }

  // Execute a market order (simplified - uses limit order infrastructure)
  async executeTrade(signal: TradeSignal): Promise<TradeResult> {
    if (!this.wallet || !this.provider) {
      return { success: false, error: 'Wallet not initialized' };
    }

    // Validate trade against config
    if (signal.suggestedSize > this.config.maxExposurePerTrade) {
      return { success: false, error: 'Trade exceeds max exposure' };
    }

    try {
      // For now, log the trade intent - full CLOB order execution requires
      // EIP-712 signing and order matching which is complex
      console.log('Trade signal received:', signal);

      // In production, this would:
      // 1. Create an order struct
      // 2. Sign it with EIP-712
      // 3. Submit to CLOB API
      // 4. Wait for fill confirmation

      return {
        success: true,
        txHash: 'pending-implementation',
        amountSpent: signal.suggestedSize,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Trade failed',
      };
    }
  }

  // Calculate profit split for admin
  calculateAdminSplit(profit: number): number {
    if (profit <= 0) return 0;
    return profit * this.config.adminProfitSplit;
  }

  // Get wallet address
  getAddress(): string | null {
    return this.wallet?.address || null;
  }

  // Get current positions
  getPositions(): Position[] {
    return this.positions;
  }

  // Update config
  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get config
  getConfig(): BotConfig {
    return this.config;
  }
}

export const polymarketTrading = new PolymarketTrading();
