// Polymarket CLOB Trading Service
// Handles real order execution via EIP-712 signing and CLOB API

import { ethers } from 'ethers';
import type { TradeResult, TradeSignal } from '@/types/polymarket';

const CLOB_API = 'https://clob.polymarket.com';
const CTF_EXCHANGE = '0x4bFb41d9539d67a68D6FB09be3c29aE0dC14dc3a';

// EIP-712 domain for Polymarket orders
const EIP712_DOMAIN = {
  name: 'Polymarket CTF Exchange',
  version: '1',
  chainId: 137, // Polygon
  verifyingContract: CTF_EXCHANGE,
};

// Order type for EIP-712 signing
const ORDER_TYPES = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'signer', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'expiration', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'feeRateBps', type: 'uint256' },
    { name: 'side', type: 'uint8' },
    { name: 'signatureType', type: 'uint8' },
  ],
};

// ClobAuth type for L1 authentication
const CLOB_AUTH_TYPES = {
  ClobAuth: [
    { name: 'address', type: 'address' },
    { name: 'timestamp', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'message', type: 'string' },
  ],
};

const CLOB_AUTH_DOMAIN = {
  name: 'ClobAuthDomain',
  version: '1',
  chainId: 137,
};

interface OrderStruct {
  salt: bigint;
  maker: string;
  signer: string;
  taker: string;
  tokenId: bigint;
  makerAmount: bigint;
  takerAmount: bigint;
  expiration: bigint;
  nonce: bigint;
  feeRateBps: bigint;
  side: number; // 0 = buy, 1 = sell
  signatureType: number; // 0 = EOA
}

export class ClobTradingService {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private nonce = 0n;

  async initialize(privateKey: string, rpcUrl: string): Promise<string> {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    console.log('[CLOB] Initialized with wallet:', this.wallet.address);
    return this.wallet.address;
  }

  // Generate L1 authentication headers for CLOB API
  private async generateAuthHeaders(): Promise<Record<string, string>> {
    if (!this.wallet) throw new Error('Wallet not initialized');

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.nonce++;

    const authData = {
      address: this.wallet.address,
      timestamp,
      nonce,
      message: 'This message attests that I control the given wallet',
    };

    const signature = await this.wallet.signTypedData(
      CLOB_AUTH_DOMAIN,
      CLOB_AUTH_TYPES,
      authData
    );

    return {
      'POLY_ADDRESS': this.wallet.address,
      'POLY_SIGNATURE': signature,
      'POLY_TIMESTAMP': timestamp,
      'POLY_NONCE': nonce.toString(),
    };
  }

  // Create and sign an order
  async createSignedOrder(
    tokenId: string,
    side: 'buy' | 'sell',
    price: number, // 0-1
    sizeUSDC: number
  ): Promise<{ order: OrderStruct; signature: string }> {
    if (!this.wallet) throw new Error('Wallet not initialized');

    // Calculate amounts (6 decimals for USDC)
    const makerAmount = BigInt(Math.floor(sizeUSDC * 1e6));
    const takerAmount = BigInt(Math.floor((sizeUSDC / price) * 1e6));

    const order: OrderStruct = {
      salt: BigInt(Math.floor(Math.random() * 1e18)),
      maker: this.wallet.address,
      signer: this.wallet.address,
      taker: ethers.ZeroAddress, // Anyone can take
      tokenId: BigInt(tokenId),
      makerAmount,
      takerAmount,
      expiration: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
      nonce: this.nonce++,
      feeRateBps: 0n,
      side: side === 'buy' ? 0 : 1,
      signatureType: 0, // EOA
    };

    // Sign with EIP-712
    const signature = await this.wallet.signTypedData(
      EIP712_DOMAIN,
      ORDER_TYPES,
      {
        ...order,
        salt: order.salt.toString(),
        tokenId: order.tokenId.toString(),
        makerAmount: order.makerAmount.toString(),
        takerAmount: order.takerAmount.toString(),
        expiration: order.expiration.toString(),
        nonce: order.nonce.toString(),
        feeRateBps: order.feeRateBps.toString(),
      }
    );

    return { order, signature };
  }

  // Submit order to CLOB API
  async submitOrder(order: OrderStruct, signature: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const authHeaders = await this.generateAuthHeaders();

      const response = await fetch(`${CLOB_API}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          order: {
            salt: order.salt.toString(),
            maker: order.maker,
            signer: order.signer,
            taker: order.taker,
            tokenId: order.tokenId.toString(),
            makerAmount: order.makerAmount.toString(),
            takerAmount: order.takerAmount.toString(),
            expiration: order.expiration.toString(),
            nonce: order.nonce.toString(),
            feeRateBps: order.feeRateBps.toString(),
            side: order.side,
            signatureType: order.signatureType,
          },
          signature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CLOB] Order submission failed:', response.status, errorText);
        return { success: false, error: errorText };
      }

      const result = await response.json();
      console.log('[CLOB] Order submitted:', result);
      return { success: true, orderId: result.id || result.orderID };
    } catch (err) {
      console.error('[CLOB] Order submission error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Execute a market order (taker order)
  async executeMarketOrder(signal: TradeSignal): Promise<TradeResult> {
    if (!this.wallet) {
      return { success: false, error: 'Wallet not initialized' };
    }

    try {
      console.log('[CLOB] Executing market order:', signal);

      // For market orders, we need to fetch the order book and fill existing orders
      const bookResponse = await fetch(`${CLOB_API}/book?token_id=${signal.tokenId}`);
      
      if (!bookResponse.ok) {
        return { success: false, error: 'Failed to fetch order book' };
      }

      const orderBook = await bookResponse.json();
      
      // Get best price based on direction
      const isBuy = signal.direction === 'buy';
      const orders = isBuy ? orderBook.asks : orderBook.bids;
      
      if (!orders || orders.length === 0) {
        return { success: false, error: 'No liquidity available' };
      }

      // Take the best available price
      const bestPrice = parseFloat(orders[0].price);
      
      // Create a taker order at the best price
      const { order, signature } = await this.createSignedOrder(
        signal.tokenId,
        signal.direction,
        bestPrice,
        signal.suggestedSize
      );

      // Submit to CLOB
      const result = await this.submitOrder(order, signature);

      if (result.success) {
        return {
          success: true,
          txHash: result.orderId || 'order-submitted',
          amountSpent: signal.suggestedSize,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Order submission failed',
        };
      }
    } catch (err) {
      console.error('[CLOB] Market order error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Trade execution failed',
      };
    }
  }

  // Cancel all open orders
  async cancelAllOrders(): Promise<boolean> {
    try {
      const authHeaders = await this.generateAuthHeaders();

      const response = await fetch(`${CLOB_API}/orders/cancel-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      return response.ok;
    } catch (err) {
      console.error('[CLOB] Cancel all orders error:', err);
      return false;
    }
  }

  // Get open orders
  async getOpenOrders(): Promise<any[]> {
    try {
      const authHeaders = await this.generateAuthHeaders();

      const response = await fetch(`${CLOB_API}/orders?market=all`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) return [];

      return await response.json();
    } catch (err) {
      console.error('[CLOB] Get orders error:', err);
      return [];
    }
  }

  // Get wallet address
  getAddress(): string | null {
    return this.wallet?.address || null;
  }
}

export const clobTradingService = new ClobTradingService();
