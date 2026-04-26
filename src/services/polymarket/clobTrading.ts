// Polymarket CLOB Trading Service
// Real order execution via EIP-712 signing + L2 HMAC auth, routed through
// the polymarket-proxy edge function (no browser CORS issues).
//
// Important: modern Polymarket markets settle on the NEG_RISK CTF Exchange
// using native USDC (0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359). Orders must
// be EIP-712-signed against the NEG_RISK exchange contract or the CLOB will
// reject them.

import { ethers } from 'ethers';
import type { TradeResult, TradeSignal } from '@/types/polymarket';

// Route via Supabase edge function to bypass clob.polymarket.com CORS.
const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polymarket-proxy`;

// NEG_RISK CTF Exchange — native USDC, current default for Polymarket markets.
const NEG_RISK_CTF_EXCHANGE = '0xC5d563A36AE78145C45a50134d48A1215220f80a';

// EIP-712 domain for orders (must match the verifyingContract the CLOB expects).
const EIP712_DOMAIN = {
  name: 'Polymarket CTF Exchange',
  version: '1',
  chainId: 137, // Polygon
  verifyingContract: NEG_RISK_CTF_EXCHANGE,
};

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

// ClobAuth (L1) — used to derive API credentials.
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
  side: number; // 0 = BUY, 1 = SELL
  signatureType: number; // 0 = EOA
}

interface ApiCreds {
  apiKey: string;
  secret: string;
  passphrase: string;
  apiKeyVersion?: string;
}

const CREDS_LS_KEY = (addr: string) => `pm_clob_creds_v1_${addr.toLowerCase()}`;

// Polymarket L2 signature = HMAC-SHA256(base64-decode(secret), `${ts}${method}${path}${body}`)
// then base64url-encoded.
async function hmacSha256B64Url(secretB64: string, message: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(secretB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message)));
  let bin = '';
  sigBytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export class ClobTradingService {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private creds: ApiCreds | null = null;
  private nonce = 0n;

  async initialize(privateKey: string, rpcUrl: string): Promise<string> {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    console.log('[CLOB] Initialized with wallet:', this.wallet.address);

    try {
      const cached = localStorage.getItem(CREDS_LS_KEY(this.wallet.address));
      if (cached) this.creds = JSON.parse(cached);
    } catch {
      /* storage blocked */
    }

    return this.wallet.address;
  }

  private async generateL1Headers(): Promise<Record<string, string>> {
    if (!this.wallet) throw new Error('Wallet not initialized');

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.nonce++;

    const authData = {
      address: this.wallet.address,
      timestamp,
      nonce,
      message: 'This message attests that I control the given wallet',
    };

    const signature = await this.wallet.signTypedData(CLOB_AUTH_DOMAIN, CLOB_AUTH_TYPES, authData);

    return {
      POLY_ADDRESS: this.wallet.address,
      POLY_SIGNATURE: signature,
      POLY_TIMESTAMP: timestamp,
      POLY_NONCE: nonce.toString(),
    };
  }

  private async generateL2Headers(method: string, path: string, body: string): Promise<Record<string, string>> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    if (!this.creds) throw new Error('API credentials missing — call ensureApiKey() first');

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${timestamp}${method}${path}${body}`;
    const signature = await hmacSha256B64Url(this.creds.secret, message);
    const version = this.creds.apiKeyVersion ?? '1';

    return {
      POLY_ADDRESS: this.wallet.address,
      POLY_SIGNATURE: signature,
      POLY_TIMESTAMP: timestamp,
      POLY_API_KEY: this.creds.apiKey,
      POLY_PASSPHRASE: this.creds.passphrase,
      POLY_API_KEY_VERSION: version,
    };
  }

  async ensureApiKey(): Promise<ApiCreds> {
    if (this.creds) return this.creds;
    if (!this.wallet) throw new Error('Wallet not initialized');

    let resp = await fetch(`${PROXY_URL}?endpoint=auth/derive-api-key`, {
      method: 'GET',
      headers: await this.generateL1Headers(),
    });

    if (!resp.ok) {
      resp = await fetch(`${PROXY_URL}?endpoint=auth/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await this.generateL1Headers()) },
        body: JSON.stringify({}),
      });
    }

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`API key derivation failed: ${resp.status} ${errorText}`);
    }

    const data = await resp.json();
    const apiKey = data.apiKey?.key ?? data.apiKey ?? data.key;
    const secret = data.apiKey?.secret ?? data.secret;
    const passphrase = data.apiKey?.passphrase ?? data.passphrase;
    const apiKeyVersion =
      data.apiKey?.version ?? data.apiKeyVersion ?? data.version ?? '1';

    if (!apiKey || !secret || !passphrase) {
      throw new Error(`Malformed API key response: ${JSON.stringify(data).slice(0, 200)}`);
    }

    this.creds = { apiKey, secret, passphrase, apiKeyVersion: String(apiKeyVersion) };
    try {
      localStorage.setItem(CREDS_LS_KEY(this.wallet.address), JSON.stringify(this.creds));
    } catch {
      /* storage blocked */
    }
    console.log('[CLOB] API credentials ready');
    return this.creds;
  }

  async createSignedOrder(
    tokenId: string,
    side: 'buy' | 'sell',
    price: number, // 0 < p < 1
    sizeUSDC: number
  ): Promise<{ order: OrderStruct; signature: string }> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    if (price <= 0 || price >= 1) throw new Error(`Invalid price ${price}`);
    if (sizeUSDC <= 0) throw new Error(`Invalid size ${sizeUSDC}`);

    const usdcAmount = BigInt(Math.floor(sizeUSDC * 1e6));
    const shareAmount = BigInt(Math.floor((sizeUSDC / price) * 1e6));

    const isBuy = side === 'buy';
    const makerAmount = isBuy ? usdcAmount : shareAmount;
    const takerAmount = isBuy ? shareAmount : usdcAmount;

    const order: OrderStruct = {
      salt: BigInt(Math.floor(Math.random() * 1e18)),
      maker: this.wallet.address,
      signer: this.wallet.address,
      taker: ethers.ZeroAddress,
      tokenId: BigInt(tokenId),
      makerAmount,
      takerAmount,
      expiration: 0n,
      nonce: 0n,
      feeRateBps: 0n,
      side: isBuy ? 0 : 1,
      signatureType: 0,
    };

    const signature = await this.wallet.signTypedData(EIP712_DOMAIN, ORDER_TYPES, {
      ...order,
      salt: order.salt.toString(),
      tokenId: order.tokenId.toString(),
      makerAmount: order.makerAmount.toString(),
      takerAmount: order.takerAmount.toString(),
      expiration: order.expiration.toString(),
      nonce: order.nonce.toString(),
      feeRateBps: order.feeRateBps.toString(),
    });

    return { order, signature };
  }

  async submitOrder(
    order: OrderStruct,
    signature: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      await this.ensureApiKey();

      const orderBody = {
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
          side: order.side === 0 ? 'BUY' : 'SELL',
          signatureType: order.signatureType,
          owner: order.maker,
        },
        signature,
        owner: order.maker,
        orderType: 'FOK',
      };

      const body = JSON.stringify(orderBody);
      const path = '/order';
      const headers = await this.generateL2Headers('POST', path, body);

      const response = await fetch(`${PROXY_URL}?endpoint=order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body,
      });

      const respText = await response.text();

      if (!response.ok) {
        console.error('[CLOB] Order rejected:', response.status, respText);
        return { success: false, error: `${response.status}: ${respText}` };
      }

      let result: { orderID?: string; orderId?: string; id?: string } = {};
      try {
        result = JSON.parse(respText);
      } catch {
        /* non-JSON OK response */
      }

      console.log('[CLOB] Order accepted:', result);
      return { success: true, orderId: result.orderID || result.orderId || result.id };
    } catch (err) {
      console.error('[CLOB] Order submission error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async executeMarketOrder(signal: TradeSignal): Promise<TradeResult> {
    if (!this.wallet) {
      return { success: false, error: 'Wallet not initialized' };
    }

    try {
      console.log('[CLOB] Executing market order:', signal);

      const bookResp = await fetch(
        `${PROXY_URL}?endpoint=book&params=${encodeURIComponent(`token_id=${signal.tokenId}`)}`
      );
      if (!bookResp.ok) {
        return { success: false, error: 'Failed to fetch order book' };
      }
      const orderBook = await bookResp.json();

      const isBuy = signal.direction === 'buy';
      const orders = isBuy ? orderBook.asks : orderBook.bids;

      if (!Array.isArray(orders) || orders.length === 0) {
        return { success: false, error: 'No liquidity available' };
      }

      const sorted = [...orders].sort((a: { price: string }, b: { price: string }) => {
        const ap = parseFloat(a.price);
        const bp = parseFloat(b.price);
        return isBuy ? ap - bp : bp - ap;
      });
      const bestPrice = parseFloat(sorted[0].price);
      if (!Number.isFinite(bestPrice) || bestPrice <= 0 || bestPrice >= 1) {
        return { success: false, error: `Invalid best price ${sorted[0].price}` };
      }

      const { order, signature } = await this.createSignedOrder(
        signal.tokenId,
        signal.direction,
        bestPrice,
        signal.suggestedSize
      );

      const result = await this.submitOrder(order, signature);

      if (result.success) {
        return {
          success: true,
          txHash: result.orderId || 'order-submitted',
          amountSpent: signal.suggestedSize,
          executionPrice: bestPrice,
        };
      }
      return { success: false, error: result.error || 'Order submission failed' };
    } catch (err) {
      console.error('[CLOB] Market order error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Trade execution failed' };
    }
  }

  async cancelAllOrders(): Promise<boolean> {
    try {
      const path = '/orders/cancel-all';
      const headers = await this.generateL2Headers('DELETE', path, '');
      const response = await fetch(`${PROXY_URL}?endpoint=orders/cancel-all`, {
        method: 'DELETE',
        headers,
      });
      return response.ok;
    } catch (err) {
      console.error('[CLOB] Cancel all orders error:', err);
      return false;
    }
  }

  async getOpenOrders(): Promise<unknown[]> {
    try {
      const path = '/orders';
      const headers = await this.generateL2Headers('GET', path, '');
      const response = await fetch(`${PROXY_URL}?endpoint=orders&params=${encodeURIComponent('market=all')}`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error('[CLOB] Get orders error:', err);
      return [];
    }
  }

  getAddress(): string | null {
    return this.wallet?.address || null;
  }

  hasCredentials(): boolean {
    return !!this.creds;
  }
}

export const clobTradingService = new ClobTradingService();
