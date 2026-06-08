import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useAdminRole } from '@/hooks/useAdminRole';

// ═══════════════════════════════════════════════════════════
//  SQI 2050 — SOVEREIGN COPY INTELLIGENCE BOT  v10 [2026-06-07 17:04 UTC]
//  Shreem Brzee Freedom Bot | Solana Mainnet | Jupiter v6
//  + Live SOL price (Jupiter API, 60s refresh)
//  + Mint symbol resolution (Jupiter tokens API, cached)
//  + Live position tracker (correct SELL mirroring in LIVE)
//  + Slippage control (100/200/300/500/1000 bps)
//  + Pump.fun-only filter toggle
//  + Auto-sell timer (0–120 min, on-chain balance check)
//  + Verified whale presets (unverified addresses removed)
// ═══════════════════════════════════════════════════════════

// window.solana is declared in src/hooks/usePhantomWallet.ts

// ── Crash-proof wrapper — any error in this page stays contained ──
class BotErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ color: '#D4AF37', fontSize: 18, fontWeight: 900, marginBottom: 12 }}>Shreem Brzee Bot</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
            Something went wrong. Try refreshing the page.
          </div>
          <div style={{ color: 'rgba(248,113,113,0.7)', fontSize: 10, fontFamily: 'monospace', maxWidth: 320, wordBreak: 'break-all', textAlign: 'center' }}>
            {this.state.error}
          </div>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 24, padding: '12px 24px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em',
          }}>
            RELOAD PAGE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const COLORS = {
  gold: '#D4AF37',
  black: '#050505',
  cyan: '#22D3EE',
  green: '#4ADE80',
  red: '#F87171',
  glass: 'rgba(255,255,255,0.02)',
  glassBorder: 'rgba(255,255,255,0.06)',
  goldGlow: 'rgba(212,175,55,0.15)',
};

// ── RPC / WebSocket ───────────────────────────────────────
// ⚠ Rotate this key at helius.dev after going live — it appeared in chat
const HELIUS_KEY = (import.meta.env.VITE_HELIUS_API_KEY || '775d3d1f-6801-41de-a063-8aee4382d0f4').trim();
const HELIUS_RPC = HELIUS_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : 'https://api.mainnet-beta.solana.com';
const HELIUS_WS = HELIUS_KEY
  ? `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : 'wss://api.mainnet-beta.solana.com';
const HAS_HELIUS = HELIUS_KEY.length > 0;

// ── Jupiter endpoints ─────────────────────────────────────
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API  = 'https://quote-api.jup.ag/v6/swap';
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

// ── Constants ─────────────────────────────────────────────
const SOL_MINT         = 'So11111111111111111111111111111111111111112';
const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

// ── Known meme coin mints → symbols (instant, no API call) ─
const KNOWN_MINTS: Record<string, string> = {
  [SOL_MINT]:                                        'SOL',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263':  'BONK',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm':  'WIF',
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr':  'POPCAT',
  'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82':   'BOME',
  'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4': 'MYRO',
  '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7hnLap6A':  'SLERF',
  'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5':   'MEW',
  '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN':  'TRUMP',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN':   'JUP',
  
};

// Runtime cache — seeded with known mints, grows with API lookups
const mintSymbolCache = new Map<string, string>(Object.entries(KNOWN_MINTS));

// ── Verified whale presets ─────────────────────────────────
// Only Cupsey and Orange are verified from fomo.fund.
// The other 4 addresses from the previous version were REMOVED — unverifiable.
// Add more: fomo.fund → Leaderboard → sort 30d PnL → copy wallet address.
const WHALE_PRESETS: { label: string; address: string; note: string; isVIP?: boolean; riskMult?: number; priorityMult?: number }[] = [
  { label: 'Cupsey',       address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE', note: '⭐ Verified micro-cap sniper', isVIP: true, riskMult: 1.5, priorityMult: 2 },
  { label: 'Orange',       address: '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5', note: 'Pump.fun launch hunter' },
  { label: 'Shreem Brzee', address: 'HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt', note: 'High win-rate scalper' },
  { label: 'Heyitsyolo',   address: 'Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ', note: '⭐ Known FOMO.fund leaderboard trader', isVIP: true, riskMult: 1.5, priorityMult: 2 },
  { label: 'Lenion',       address: 'DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm', note: 'Meme coin specialist' },
  { label: 'Boredboar',    address: 'gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw',  note: 'Aggressive entry style' },
  { label: 'Hades',        address: 'HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp', note: 'High-frequency trader' },
  { label: 'Kubera 72',    address: 'AAvdewt71kkde2segr6gYnNemhNLfokyZpdzwwi4yDfm', note: 'Top leaderboard wallet' },
  { label: 'Brzee God',    address: 'JD38n7ynKYcgPpF7k1BhXEeREu1KqptU93fVGy3S624k', note: 'Sovereign copy target' },
  { label: 'GBack',        address: '9VPozuXeRi8FACAePmg8ckdSZkbeZfTJc6SqUDcKsUKm', note: 'Consistent performer' },
  { label: 'Tuna',         address: 'GjK3S2ZgxTVFEkxg43JE8eC1tbztWCseBYyZ8o8sg9f', note: 'Active meme trader' },
  { label: 'Fireball',     address: 'AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51', note: 'Fast entry sniper' },
  { label: 'Hachjdn',      address: 'EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS', note: 'Leaderboard regular' },
  { label: 'Crypto Circle',address: '5DzUSNro5kfNwB2dxkkTTYrPDXAi6vRnjf4mAN2an7Gc', note: 'Community whale' },
  { label: 'Crocodile',    address: '2cBedD94RXYSEhEfQJUyLaNaHB4PVoL9z7LK6Mu11sJv', note: 'Patient hunter' },
  { label: 'Snow Spirit',  address: '4ev7HVsESzFxKqGzQxJ5mzSM6NstGCTQXKXT8yHiaRP3', note: 'Consistent PnL' },
  { label: 'Cented',       address: 'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o', note: 'Active swing trader' },
  { label: 'The Grande',   address: 'Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA', note: 'Large position trader' },
  { label: 'Remusofmars',  address: 'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu', note: '⭐ $370→$1.2M WHITEWHALE · conviction early-entry', isVIP: true, riskMult: 2, priorityMult: 3 },
  { label: 'A Milly',      address: 'Fv9w9TQnqhzUszbDGRFPPkXwu5iJWG9VytmMJTCTnjxW', note: 'High-value trader' },
  { label: 'J2ANNaq',      address: 'J2ANNaq4uUk3iUGoNijKCwXTReGLyg2yQpGcAZjzyBZG', note: 'Tracked wallet' },
];

// ─────────────────────────────────────────────────────────
//  API HELPERS
// ─────────────────────────────────────────────────────────
async function rpcCall(method: string, params: any[]) {
  const res = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  return res.json();
}

async function getSOLBalance(walletAddress: string) {
  const data = await rpcCall('getBalance', [walletAddress]);
  return (data.result?.value || 0) / 1e9;
}

// Fetch actual on-chain token balance (lamports) — used by auto-sell
async function getTokenBalance(walletAddress: string, mint: string): Promise<number> {
  try {
    const data = await rpcCall('getTokenAccountsByOwner', [
      walletAddress,
      { mint },
      { encoding: 'jsonParsed' },
    ]);
    const accounts = data.result?.value || [];
    if (accounts.length === 0) return 0;
    return parseInt(accounts[0].account.data.parsed.info.tokenAmount.amount || '0');
  } catch { return 0; }
}

// Live SOL price from Jupiter — fallback 150 if unavailable
// Multi-source SOL price — tries 3 APIs in sequence, uses first that works
async function fetchSolPriceUSD(): Promise<number> {
  const sources = [
    // Binance — most reliable, no auth, CORS open
    async () => {
      const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
      const d = await r.json();
      const p = parseFloat(d.price);
      if (p > 0) return p;
      throw new Error('no price');
    },
    // CoinGecko free tier — CORS open
    async () => {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const d = await r.json();
      const p = d?.solana?.usd;
      if (p > 0) return p;
      throw new Error('no price');
    },
    // Jupiter v6 (older endpoint, sometimes CORS-friendlier)
    async () => {
      const r = await fetch('https://price.jup.ag/v6/price?ids=SOL');
      const d = await r.json();
      const p = d?.data?.SOL?.price;
      if (p > 0) return parseFloat(p);
      throw new Error('no price');
    },
  ];

  for (const source of sources) {
    try {
      const price = await source();
      if (price > 50 && price < 10000) return Math.round(price * 100) / 100;
    } catch {}
  }
  return 150; // final fallback
}

// Resolve mint → symbol via Jupiter token list API (cached)
async function resolveMintSymbol(mint: string): Promise<string> {
  if (mintSymbolCache.has(mint)) return mintSymbolCache.get(mint)!;
  try {
    const res = await fetch(`https://tokens.jup.ag/token/${mint}`);
    if (res.ok) {
      const data = await res.json();
      const sym = data.symbol || (mint.slice(0, 4) + '…' + mint.slice(-4));
      mintSymbolCache.set(mint, sym);
      return sym;
    }
  } catch {}
  const fallback = mint.slice(0, 4) + '…' + mint.slice(-4);
  mintSymbolCache.set(mint, fallback);
  return fallback;
}

// Helius Priority Fee Estimator
async function getPriorityFee(accountKeys: string[]): Promise<number> {
  if (!HAS_HELIUS) return 100_000;
  try {
    const data = await rpcCall('getPriorityFeeEstimate', [
      { accountKeys, options: { priorityLevel: 'High' } },
    ]);
    const est = data.result?.priorityFeeEstimate;
    if (typeof est === 'number' && est > 0) return Math.ceil(est);
  } catch {}
  return 100_000;
}

function isValidWallet(addr: string): boolean {
  if (!addr) return false;
  if (addr.length < 32 || addr.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
}

// Poll getSignatureStatuses every 2s until confirmed/failed/timeout (30s max)
async function pollConfirmation(
  sig: string,
  onConfirmed: () => void,
  onFailed: (reason: string) => void,
) {
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const data = await rpcCall('getSignatureStatuses', [[sig], { searchTransactionHistory: true }]);
      const status = data.result?.value?.[0];
      if (status === null || status === undefined) continue;
      if (status.err) { onFailed(JSON.stringify(status.err).slice(0, 60)); return; }
      if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
        onConfirmed(); return;
      }
    } catch {}
  }
  onFailed('timeout — check Solscan');
}

// ─────────────────────────────────────────────────────────
//  PARSE TRADE FROM PARSED TRANSACTION
// ─────────────────────────────────────────────────────────
type ParsedTrade = {
  sig: string;
  wallet: string;
  action: 'BUY' | 'SELL';
  mint: string;
  symbol?: string;
  amountSOL: number;
  tokenAmount: number;
  timestamp: number;
  isPumpFun?: boolean;
};

function isPumpFunTx(tx: any): boolean {
  const keys = tx?.transaction?.message?.accountKeys || [];
  return keys.some((k: any) => (k.pubkey || k) === PUMP_FUN_PROGRAM);
}

function parseTradeFromTx(tx: any, walletAddress: string, sig: string): ParsedTrade | null {
  if (!tx?.meta || tx.meta.err) return null;
  const pre    = tx.meta.preTokenBalances || [];
  const post   = tx.meta.postTokenBalances || [];
  const preSOL = tx.meta.preBalances?.[0] ?? 0;
  const postSOL= tx.meta.postBalances?.[0] ?? 0;
  const solDelta = (postSOL - preSOL) / 1e9;

  const balByMint: Record<string, { pre: number; post: number }> = {};
  for (const b of pre) {
    if (b.owner !== walletAddress) continue;
    balByMint[b.mint] = { pre: parseFloat(b.uiTokenAmount?.uiAmountString || '0'), post: 0 };
  }
  for (const b of post) {
    if (b.owner !== walletAddress) continue;
    const cur = balByMint[b.mint] || { pre: 0, post: 0 };
    cur.post = parseFloat(b.uiTokenAmount?.uiAmountString || '0');
    balByMint[b.mint] = cur;
  }

  let bestMint: string | null = null;
  let bestDelta = 0;
  for (const [mint, { pre: p, post: q }] of Object.entries(balByMint)) {
    if (mint === SOL_MINT) continue;
    const d = q - p;
    if (Math.abs(d) > Math.abs(bestDelta)) { bestDelta = d; bestMint = mint; }
  }
  if (!bestMint || bestDelta === 0) return null;

  return {
    sig,
    wallet: walletAddress,
    action: bestDelta > 0 ? 'BUY' : 'SELL',
    mint: bestMint,
    amountSOL: Math.abs(solDelta),
    tokenAmount: Math.abs(bestDelta),
    timestamp: Date.now(),
    isPumpFun: isPumpFunTx(tx),
  };
}

// ─────────────────────────────────────────────────────────
//  WALLET MONITOR
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
//  MULTI-WALLET MONITOR — ONE WebSocket for ALL whales
//
//  Critical fix: mobile browsers cap at ~6 concurrent WebSocket
//  connections. Old design (1 WS per wallet) silently dropped
//  all wallets after the 6th. Now ONE connection monitors all
//  21+ wallets simultaneously via accountInclude array.
//
//  On reconnect, re-subscribes with the full address list.
// ─────────────────────────────────────────────────────────
type WalletEntry = {
  address: string;
  label: string;
  config?: { isVIP?: boolean; riskMult?: number; priorityMult?: number };
};

class MultiWalletMonitor {
  wallets: WalletEntry[];
  onTrade: (trade: ParsedTrade, latencyMs: number, label: string, config?: WalletEntry['config']) => void;
  ws: WebSocket | null = null;
  reconnectTimer: any  = null;
  killed               = false;
  pingTimer: any       = null;

  constructor(
    wallets: WalletEntry[],
    onTrade: MultiWalletMonitor['onTrade'],
  ) {
    this.wallets = wallets;
    this.onTrade = onTrade;
  }

  onStatusChange?: (s: 'connecting'|'connected'|'error'|'disconnected') => void;
  onRawMessage?:   (type: string) => void;  // diagnostic counter

  connect() {
    if (this.killed) return;
    this.onStatusChange?.('connecting');
    this.ws           = new WebSocket(HELIUS_WS);
    this.ws.onopen    = () => { this.onStatusChange?.('connecting'); this._subscribe(); };
    this.ws.onmessage = (e) => this._onMessage(e);
    this.ws.onerror   = () => { this.onStatusChange?.('error'); };
    this.ws.onclose   = () => {
      clearInterval(this.pingTimer);
      this.onStatusChange?.('disconnected');
      if (this.killed) return;
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
  }

  _subscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const addresses = this.wallets.map(w => w.address);

    if (HAS_HELIUS) {
      // ONE subscription covers ALL wallets — no connection limit issue
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'transactionSubscribe',
        params: [
          { vote: false, failed: false, accountInclude: addresses },
          {
            commitment: 'processed',
            encoding: 'jsonParsed',
            transactionDetails: 'full',
            showRewards: false,
            maxSupportedTransactionVersion: 0,
          },
        ],
      }));
    } else {
      // Public RPC: subscribe to logs mentioning each wallet
      // (limited — only first wallet for fallback)
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'logsSubscribe',
        params: [{ mentions: addresses.slice(0, 1) }, { commitment: 'processed' }],
      }));
    }

    // Keep-alive ping every 20s to prevent mobile browser killing the socket
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'ping', params: [] }));
      }
    }, 20_000);
  }

  // Find which of our tracked wallets was involved in this tx
  _matchWallet(tx: any): WalletEntry | null {
    const keys: string[] = (tx?.transaction?.message?.accountKeys || [])
      .map((k: any) => k.pubkey || k);
    for (const w of this.wallets) {
      if (keys.includes(w.address)) return w;
    }
    return null;
  }

  async _onMessage(e: MessageEvent) {
    let data: any;
    try { data = JSON.parse(e.data); } catch { return; }

    // Count every raw message for diagnostics
    this.onRawMessage?.(data.method || (data.result !== undefined ? 'confirm' : 'other'));

    // Subscription confirmed — Helius sends {id:1, result: <subId>}
    if (data.id === 1 && typeof data.result === 'number') {
      this.onStatusChange?.('connected');
      return;
    }

    if (data.method === 'transactionNotification') {
      const t0    = Date.now();
      const value = data.params?.result?.transaction;
      const sig   = data.params?.result?.signature || value?.transaction?.signatures?.[0];
      if (!value || !sig) return;

      const matched = this._matchWallet(value);
      if (!matched) return;

      const trade = parseTradeFromTx(value, matched.address, sig);
      if (trade) this.onTrade(trade, Date.now() - t0, matched.label, matched.config);
      return;
    }

    if (data.method === 'logsNotification') {
      const sig = data.params?.result?.value?.signature;
      if (!sig) return;
      const t0 = Date.now();
      try {
        const txData = await rpcCall('getTransaction', [sig, {
          encoding: 'jsonParsed',
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        }]);
        const tx = txData.result;
        if (!tx) return;
        const matched = this._matchWallet(tx) || this.wallets[0];
        const trade = parseTradeFromTx(tx, matched.address, sig);
        if (trade) this.onTrade(trade, Date.now() - t0, matched.label, matched.config);
      } catch {}
    }
  }

  updateWallets(wallets: WalletEntry[]) {
    this.wallets = wallets;
    // Re-subscribe with updated wallet list
    if (this.ws?.readyState === WebSocket.OPEN) this._subscribe();
  }

  disconnect() {
    this.killed = true;
    clearInterval(this.pingTimer);
    clearTimeout(this.reconnectTimer);
    try { this.ws?.close(); } catch {}
  }
}

// ─────────────────────────────────────────────────────────
//  REALISTIC PAPER ENGINE — mirrors live trading costs
//
//  Every trade deducts the same costs as LIVE mode:
//  • Entry slippage  (e.g. 3% on position size)
//  • Exit slippage   (3% on exit value)
//  • Priority fee    (~0.002 SOL per tx — Helius estimate)
//  • Network fee     (0.000005 SOL per tx — Solana base)
//
//  P&L distribution based on real meme coin copy trading:
//  • 30% chance: -70% to -100%  (rug / dump)
//  • 25% chance: -20% to -70%   (loss, didn't catch exit)
//  • 20% chance: -5%  to  0%    (break-even after fees)
//  • 15% chance: 0%   to +100%  (decent win)
//  • 10% chance: +100% to +500% (strong early entry)
// ─────────────────────────────────────────────────────────
class PaperEngine {
  portfolio: number;
  positions: Record<string, { cost: number; entryTime: number }>;
  trades: any[];
  startBal: number;
  slippageBps: number;

  // Real Solana trading costs
  static PRIORITY_FEE = 0.002;   // SOL per tx — average Helius priority
  static NETWORK_FEE  = 0.000005; // SOL per tx — Solana base fee

  constructor(startingSOL = 0.1, slippageBps = 300) {
    this.portfolio   = startingSOL;
    this.startBal    = startingSOL;
    this.positions   = {};
    this.trades      = [];
    this.slippageBps = slippageBps;
  }

  private slippageCost(sol: number): number {
    return sol * (this.slippageBps / 10000);
  }

  private txFees(): number {
    return PaperEngine.PRIORITY_FEE + PaperEngine.NETWORK_FEE;
  }

  // Realistic meme coin exit multiplier based on actual copy trading stats
  private realisticMultiplier(): number {
    const r = Math.random();
    if (r < 0.30) return 0.05 + Math.random() * 0.25;   // 30% → rug/dump: -75% to -95%
    if (r < 0.55) return 0.30 + Math.random() * 0.50;   // 25% → loss: -20% to -70%
    if (r < 0.75) return 0.92 + Math.random() * 0.11;   // 20% → near break-even: -8% to +3%
    if (r < 0.90) return 1.10 + Math.random() * 0.90;   // 15% → win: +10% to +100%
    return 2.00 + Math.random() * 4.00;                   // 10% → big win: +100% to +500%
  }

  execute(trade: ParsedTrade, riskPct = 0.05, label?: string, slippageBps?: number) {
    if (slippageBps !== undefined) this.slippageBps = slippageBps;

    if (trade.action === 'BUY') {
      const gross   = Math.min(this.portfolio * riskPct, this.portfolio);
      if (gross <= 0) return null;

      const slip    = this.slippageCost(gross);   // slippage on entry
      const fees    = this.txFees();               // priority + network fee
      const net     = gross - slip - fees;         // actual position value after costs
      const total   = gross + fees;               // total SOL deducted from portfolio

      if (total > this.portfolio) return null;

      this.positions[trade.mint] = { cost: net, entryTime: Date.now() };
      this.portfolio -= total;

      const entry = {
        ...trade, riskSOL: gross, netPosition: net, slippagePaid: slip,
        feesPaid: fees, portfolio: this.portfolio, token: trade.mint,
        pnl: 0, label, id: Date.now(),
        costs: `slip $${(slip * 150).toFixed(2)} + fee $${(fees * 150).toFixed(2)}`,
      };
      this.trades.unshift(entry);
      return entry;

    } else {
      const pos = this.positions[trade.mint];
      if (!pos || pos.cost <= 0) {
        const entry = { ...trade, riskSOL: 0, portfolio: this.portfolio,
          token: trade.mint, pnl: 0, label, id: Date.now(), skipped: true };
        this.trades.unshift(entry);
        return entry;
      }

      const mult      = this.realisticMultiplier();
      const gross     = pos.cost * mult;           // exit value before costs
      const slip      = this.slippageCost(gross);  // slippage on exit
      const fees      = this.txFees();             // priority + network fee
      const net       = gross - slip - fees;       // actual SOL received
      const pnl       = net - (pos.cost + fees);   // true P&L (vs all-in cost)

      this.portfolio += net;
      delete this.positions[trade.mint];

      const entry = {
        ...trade, riskSOL: net, mult: mult.toFixed(2), slippagePaid: slip,
        feesPaid: fees, portfolio: this.portfolio, token: trade.mint,
        pnl, label, id: Date.now(),
        costs: `slip $${(slip * 150).toFixed(2)} + fee $${(fees * 150).toFixed(2)}`,
      };
      this.trades.unshift(entry);
      return entry;
    }
  }
}

// ─────────────────────────────────────────────────────────
//  JUPITER SWAP — VersionedTransaction, skip-preflight,
//  dynamic priority fee. Returns signature immediately.
// ─────────────────────────────────────────────────────────
async function executeJupiterSwap(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  walletAddress: string,
  slippageBps = 300,
  priorityMult = 1,   // VIP multiplier — 1x normal, 3x for Remusofmars etc.
): Promise<string> {
  if (!window.solana) throw new Error('Wallet not connected');

  const quoteUrl =
    `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amountLamports}&slippageBps=${slippageBps}&onlyDirectRoutes=false`;
  const quoteRes = await fetch(quoteUrl);
  const quote    = await quoteRes.json();
  if (!quote.outAmount) throw new Error(quote.error || 'No route found');

  const accountKeys = [walletAddress, inputMint, outputMint];
  const priorityFee = Math.ceil((await getPriorityFee(accountKeys)) * Math.max(1, priorityMult));

  const swapRes = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: walletAddress,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: priorityFee,
      asLegacyTransaction: false,
    }),
  });
  const { swapTransaction } = await swapRes.json();
  if (!swapTransaction) throw new Error('Jupiter did not return swap tx');

  const txBuf  = Buffer.from(swapTransaction as string, 'base64');
  const tx     = VersionedTransaction.deserialize(txBuf);
  const signed = await (window.solana as any).signTransaction(tx);

  const sendRes = await rpcCall('sendTransaction', [
    Buffer.from(signed.serialize()).toString('base64'),
    { encoding: 'base64', skipPreflight: true, maxRetries: 2 },
  ]);
  if (sendRes.error) throw new Error(sendRes.error.message || 'Send failed');
  return sendRes.result as string;
}

// ─────────────────────────────────────────────────────────
//  STYLE TOKENS
// ─────────────────────────────────────────────────────────
const glassCard: React.CSSProperties = {
  background: COLORS.glass,
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: `1px solid ${COLORS.glassBorder}`,
  borderRadius: 24,
};
const goldText: React.CSSProperties = {
  color: COLORS.gold,
  textShadow: `0 0 20px ${COLORS.goldGlow}`,
};
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 12,
  padding: '12px 14px',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 12,
  fontFamily: "'Plus Jakarta Sans', monospace",
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

// ─────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const STORAGE_KEY     = 'sqi_fomo_bot_v3';
const SESSION_KEY     = 'sqi_paper_session_v1';
const PAPER_DAYS      = 3;
const PAPER_MS        = PAPER_DAYS * 24 * 60 * 60 * 1000;

// Per-whale stats tracker
type WhaleStats = {
  label: string;
  trades: number;
  wins: number;
  pnl: number;
};

function FomoCopyBotInner() {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  // Auto-enter paper mode on mount — no wallet required
  React.useEffect(() => {
    if (!walletAddress) {
      const demo = 'Paper' + Math.random().toString(36).slice(2, 7).toUpperCase();
      setWalletAddress(demo);
      setSolBalance(startingSOL);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-add all presets on first load if no wallets tracked yet
  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const hasSaved = saved && JSON.parse(saved)?.trackedWallets?.length > 0;
    if (!hasSaved) {
      setTrackedWallets(WHALE_PRESETS.map(p => ({
        address: p.address,
        label: p.label,
        active: true,
        isVIP: p.isVIP,
        riskMult: p.riskMult,
        priorityMult: p.priorityMult,
      })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persisted state ─────────────────────────────────────
  const [trackedWallets, setTrackedWallets] = useState<{
    address: string;
    label: string;
    active: boolean;
    isVIP?: boolean;       // bypass pumpFunOnly filter, 3x priority fee
    riskMult?: number;     // risk multiplier vs base (e.g. 2 = 2x base risk%)
    priorityMult?: number; // priority fee multiplier (1–5)
  }[]>([]);
  const [riskPct,      setRiskPct]      = useState(5);
  const [startingSOL,  setStartingSOL]  = useState(0.07);
  const [mode,         setMode]         = useState<'paper' | 'live'>('paper');
  const [slippageBps,  setSlippageBps]  = useState(300);   // NEW
  const [pumpFunOnly,  setPumpFunOnly]  = useState(false); // NEW
  const [autoSellMins, setAutoSellMins] = useState(0);     // NEW: 0 = disabled
  const [maxPositions, setMaxPositions] = useState(15);    // concurrent position cap

  // ── Live state ──────────────────────────────────────────
  const [walletAddress,  setWalletAddress]  = useState<string | null>(null);
  const [solBalance,     setSolBalance]     = useState<number | null>(null);
  const [solUSD,         setSolUSD]         = useState(150);  // NEW: live price
  const [bulkInput,      setBulkInput]      = useState('');
  const [newWallet,      setNewWallet]      = useState('');
  const [newLabel,       setNewLabel]       = useState('');
  const [liveFeed,       setLiveFeed]       = useState<any[]>([]);
  const [myTrades,       setMyTrades]       = useState<any[]>([]);
  const [paperPortfolio, setPaperPortfolio] = useState(0.07);
  const [totalPnL,       setTotalPnL]       = useState(0);
  const [isMonitoring,   setIsMonitoring]   = useState(false);
  const [status,         setStatus]         = useState('OFFLINE');
  const [tab,            setTab]            = useState<'dashboard' | 'wallets' | 'feed' | 'trades' | 'setup'>('dashboard');
  const [lastLatency,    setLastLatency]    = useState<number | null>(null);
  const [avgLatency,     setAvgLatency]     = useState<number | null>(null);
  const [walletActivity, setWalletActivity] = useState<Map<string, 'checking' | 'active' | 'inactive'>>(new Map()); // NEW
  const [isVerifying,    setIsVerifying]    = useState(false);
  // ── Diagnostics ─────────────────────────────────────────
  const [rawMsgCount,  setRawMsgCount]  = useState(0);
  const [txCount,      setTxCount]      = useState(0);
  const [lastMsgTime,  setLastMsgTime]  = useState<string>('—');
  const rawCountRef = useRef(0);
  const txCountRef  = useRef(0);
  const [wsStatus,       setWsStatus]       = useState<'disconnected'|'connecting'|'connected'|'error'>('disconnected');

  // ── Paper session tracker ────────────────────────────────
  const [sessionStart,   setSessionStart]   = useState<number | null>(null);
  const [sessionActive,  setSessionActive]  = useState(false);
  const [whaleStats,     setWhaleStats]     = useState<Record<string, WhaleStats>>({});
  const [dailyPnL,       setDailyPnL]       = useState<number[]>([0, 0, 0]); // day 1, 2, 3
  const [bestTrade,      setBestTrade]       = useState<any>(null);
  const [worstTrade,     setWorstTrade]      = useState<any>(null);

  const monitorRef       = useRef<MultiWalletMonitor | null>(null);
  const paperRef         = useRef(new PaperEngine(0.07));
  const feedRef          = useRef<any[]>([]);
  const latencyBufRef    = useRef<number[]>([]);
  const livePositionsRef = useRef<Map<string, { lamports: number; entryTime: number }>>(new Map()); // NEW
  const walletRef        = useRef<string | null>(null); // NEW: sync ref for async callbacks
  const solBalRef        = useRef<number | null>(null); // NEW
  const slippageRef      = useRef(300);                 // NEW

  // Keep refs in sync
  useEffect(() => { walletRef.current  = walletAddress; }, [walletAddress]);
  useEffect(() => { solBalRef.current  = solBalance; },    [solBalance]);
  useEffect(() => { slippageRef.current = slippageBps; },  [slippageBps]);

  // ── Load from localStorage ───────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.trackedWallets)             setTrackedWallets(data.trackedWallets);
        if (typeof data.riskPct === 'number') setRiskPct(data.riskPct);
        if (typeof data.startingSOL === 'number') {
          setStartingSOL(data.startingSOL);
          paperRef.current = new PaperEngine(data.startingSOL);
          setPaperPortfolio(data.startingSOL);
        }
        if (typeof data.slippageBps === 'number')  setSlippageBps(data.slippageBps);
        if (typeof data.pumpFunOnly === 'boolean')  setPumpFunOnly(data.pumpFunOnly);
        if (typeof data.autoSellMins === 'number')  setAutoSellMins(data.autoSellMins);
        if (typeof data.maxPositions === 'number')  setMaxPositions(data.maxPositions);
      // Load paper session
      const sess = localStorage.getItem(SESSION_KEY);
      if (sess) {
        const sd = JSON.parse(sess);
        if (sd.sessionStart) setSessionStart(sd.sessionStart);
        if (sd.sessionActive) setSessionActive(sd.sessionActive);
        if (sd.whaleStats)   setWhaleStats(sd.whaleStats);
        if (sd.dailyPnL)     setDailyPnL(sd.dailyPnL);
        if (sd.bestTrade)    setBestTrade(sd.bestTrade);
        if (sd.worstTrade)   setWorstTrade(sd.worstTrade);
      }
      }
    } catch {}
  }, []);

  // ── Persist settings ─────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        trackedWallets, riskPct, startingSOL, slippageBps, pumpFunOnly, autoSellMins, maxPositions,
      }));
    } catch {}
  }, [trackedWallets, riskPct, startingSOL, slippageBps, pumpFunOnly, autoSellMins]);

  // ── Session persistence ──────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        sessionStart, sessionActive, whaleStats, dailyPnL, bestTrade, worstTrade,
      }));
    } catch {}
  }, [sessionStart, sessionActive, whaleStats, dailyPnL, bestTrade, worstTrade]);

  // ── Live SOL price fetch (every 60s) ──────────────────── NEW
  useEffect(() => {
    fetchSolPriceUSD().then(setSolUSD);
    const iv = setInterval(() => fetchSolPriceUSD().then(setSolUSD), 60_000);
    return () => clearInterval(iv);
  }, []);

  // ── Auto-sell timer (live mode only) ─────────────────── NEW
  useEffect(() => {
    if (autoSellMins === 0 || mode !== 'live' || !isMonitoring) return;
    const iv = setInterval(async () => {
      const wallet = walletRef.current;
      if (!wallet) return;
      const now = Date.now();
      for (const [mint, pos] of Array.from(livePositionsRef.current.entries())) {
        const ageMin = (now - pos.entryTime) / 60_000;
        if (ageMin < autoSellMins) continue;
        livePositionsRef.current.delete(mint);
        const sym      = mintSymbolCache.get(mint) || mint.slice(0, 6);
        const tokenBal = await getTokenBalance(wallet, mint);
        if (tokenBal <= 0) continue;
        setStatus(`⏱ AUTO-SELL: ${sym} held ${ageMin.toFixed(0)}min — exiting…`);
        executeJupiterSwap(mint, SOL_MINT, tokenBal, wallet, slippageRef.current)
          .then(sig => {
            setStatus(`✓ Auto-sold ${sym} → ${sig.slice(0, 8)}…`);
            getSOLBalance(wallet).then(setSolBalance);
          })
          .catch(err => setStatus(`✗ Auto-sell ${sym} failed: ${err.message}`));
      }
    }, 60_000);
    return () => clearInterval(iv);
  }, [autoSellMins, mode, isMonitoring]);

  // ── Connect Wallet ──────────────────────────────────────
  const connectWallet = async () => {
    // Try Phantom first (desktop only)
    if (window.solana?.isPhantom) {
      try {
        const resp = await window.solana.connect();
        const addr = resp.publicKey.toString();
        setWalletAddress(addr);
        const bal = await getSOLBalance(addr);
        setSolBalance(bal);
        setStatus('✅ Phantom connected — LIVE mode available');
        return;
      } catch (e: any) {
        setStatus(`⚠ Phantom error: ${e?.message || 'rejected'}`);
      }
    } else {
      // Mobile or no Phantom — paper mode only
      const demo = 'Paper' + Math.random().toString(36).slice(2, 7).toUpperCase();
      setWalletAddress(demo);
      setSolBalance(startingSOL);
      setStatus('📄 PAPER MODE — Install Phantom desktop extension for LIVE trading');
    }
  };

  // ── Process incoming whale trade ────────────────────────
  // ── SOVEREIGN COPY ENGINE ───────────────────────────────
  // Fire-first architecture: swap fires BEFORE symbol resolution.
  // Symbol lookup is async background — never blocks execution.
  // VIP whales: bypass pumpFunOnly, 2–3x priority fee, 1.5–2x risk.
  const handleWhaleTrade = useCallback((
    trade: ParsedTrade,
    latencyMs: number,
    label: string,
    walletConfig?: { isVIP?: boolean; riskMult?: number; priorityMult?: number },
  ) => {
    const isVIP = walletConfig?.isVIP ?? false;

    // Filter — VIP wallets always bypass pumpFunOnly
    if (pumpFunOnly && !trade.isPumpFun && !isVIP) return;

    // Latency tracking
    latencyBufRef.current = [latencyMs, ...latencyBufRef.current.slice(0, 19)];
    setLastLatency(latencyMs);
    setAvgLatency(Math.round(latencyBufRef.current.reduce((a, b) => a + b, 0) / latencyBufRef.current.length));

    // ── Get symbol from cache INSTANTLY (no await, no blocking) ──
    const cachedSymbol = mintSymbolCache.get(trade.mint) || (trade.mint.slice(0, 4) + '…');
    const tradeId      = `${trade.sig}_${Date.now()}`;
    const tradeEntry   = { ...trade, symbol: cachedSymbol, label, id: tradeId, isVIP };

    // Update feed immediately
    feedRef.current = [tradeEntry, ...feedRef.current.slice(0, 49)];
    setLiveFeed([...feedRef.current]);

    // Resolve real symbol in background — updates feed when ready
    if (!mintSymbolCache.has(trade.mint)) {
      resolveMintSymbol(trade.mint).then(symbol => {
        feedRef.current = feedRef.current.map(x => x.id === tradeId ? { ...x, symbol } : x);
        setLiveFeed([...feedRef.current]);
        setMyTrades(prev => prev.map(x => x.id === tradeId ? { ...x, symbol } : x));
      });
    }

    if (mode === 'paper') {
      const result = paperRef.current.execute({ ...trade, symbol: cachedSymbol }, riskPct / 100, label, slippageRef.current);
      if (result) {
        setMyTrades(prev => [{ ...result, isVIP }, ...prev.slice(0, 49)]);
        setPaperPortfolio(paperRef.current.portfolio);
        const newPnL = paperRef.current.trades.reduce((s, x) => s + (x.pnl || 0), 0);
        setTotalPnL(newPnL);

        // Track per-whale stats
        if (!result.skipped) {
          setWhaleStats(prev => {
            const key = label;
            const cur = prev[key] || { label, trades: 0, wins: 0, pnl: 0 };
            return {
              ...prev,
              [key]: {
                label,
                trades: cur.trades + 1,
                wins: cur.wins + (result.pnl > 0 ? 1 : 0),
                pnl: cur.pnl + (result.pnl || 0),
              },
            };
          });
        }

        // Track daily P&L
        if (sessionStart) {
          const dayIdx = Math.min(2, Math.floor((Date.now() - sessionStart) / (24 * 60 * 60 * 1000)));
          setDailyPnL(prev => {
            const next = [...prev];
            next[dayIdx] = (next[dayIdx] || 0) + (result.pnl || 0);
            return next;
          });
        }

        // Track best/worst trade
        if (result.pnl !== undefined && result.pnl !== 0 && !result.skipped) {
          setBestTrade((prev: any) => (!prev || result.pnl > prev.pnl) ? result : prev);
          setWorstTrade((prev: any) => (!prev || result.pnl < prev.pnl) ? result : prev);
        }
      }
      return;
    }

    // ── LIVE MODE — FIRE IMMEDIATELY ─────────────────────
    const wallet = walletRef.current;
    const bal    = solBalRef.current;
    if (!wallet || !bal) return;

    // Position cap (BUYs only)
    if (trade.action === 'BUY' && livePositionsRef.current.size >= maxPositions) {
      setStatus(`⚠ Max positions (${maxPositions}) reached — skipping ${cachedSymbol}`);
      return;
    }

    const effectiveRisk = riskPct * (walletConfig?.riskMult ?? 1) / 100;
    const riskLamports  = Math.floor(bal * effectiveRisk * 1e9);
    const pMult         = isVIP ? (walletConfig?.priorityMult ?? 3) : 1;
    const inputMint     = trade.action === 'BUY' ? SOL_MINT : trade.mint;
    const outputMint    = trade.action === 'BUY' ? trade.mint : SOL_MINT;

    if (riskLamports <= 0) return;

    setMyTrades(prev => [
      { ...tradeEntry, id: tradeId, executing: true, riskSOL: riskLamports / 1e9, isVIP },
      ...prev.slice(0, 49),
    ]);

    if (isVIP) setStatus(`⚡ VIP SIGNAL: ${label} ${trade.action} ${cachedSymbol} — firing ${pMult}x priority…`);

    executeJupiterSwap(inputMint, outputMint, riskLamports, wallet, slippageRef.current, pMult)
      .then(sig => {
        if (trade.action === 'BUY') {
          livePositionsRef.current.set(trade.mint, { lamports: riskLamports, entryTime: Date.now() });
        } else {
          livePositionsRef.current.delete(trade.mint);
        }
        setMyTrades(prev => prev.map(x =>
          x.id === tradeId ? { ...x, sig, executing: false, executed: true, confirming: true } : x
        ));
        getSOLBalance(wallet).then(setSolBalance);

        pollConfirmation(
          sig,
          () => setMyTrades(prev => prev.map(x =>
            x.id === tradeId ? { ...x, confirming: false, confirmed: true } : x
          )),
          (reason) => setMyTrades(prev => prev.map(x =>
            x.id === tradeId ? { ...x, confirming: false, confirmError: reason } : x
          )),
        );
      })
      .catch(err => {
        setMyTrades(prev => prev.map(x =>
          x.id === tradeId ? { ...x, executing: false, error: err.message } : x
        ));
      });
  }, [mode, riskPct, pumpFunOnly, maxPositions]);

  // ── Start/Stop Monitoring ───────────────────────────────
  // ── POLLING ENGINE — fallback when WebSocket fails ───────
  const pollingRef      = useRef<any>(null);
  const lastSigRef      = useRef<Record<string, string>>({});

  const pollWallets = useCallback(async () => {
    const active = trackedWallets.filter(w => isValidWallet(w.address) && w.active);
    for (const tw of active) {
      try {
        const data = await rpcCall('getSignaturesForAddress', [tw.address, { limit: 5, commitment: 'confirmed' }]);
        const sigs: any[] = data.result || [];
        if (!sigs.length) continue;
        const newest = sigs[0].signature;
        if (lastSigRef.current[tw.address] === newest) continue; // no new txs
        const prev = lastSigRef.current[tw.address];
        lastSigRef.current[tw.address] = newest;
        if (!prev) continue; // first poll — just record baseline
        // Fetch new transactions since last seen sig
        const newSigs = sigs.filter((s: any) => s.signature !== prev && !s.err);
        for (const sigInfo of newSigs.slice(0, 3)) {
          const txData = await rpcCall('getTransaction', [sigInfo.signature, {
            encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed',
          }]);
          if (!txData.result) continue;
          const trade = parseTradeFromTx(txData.result, tw.address, sigInfo.signature);
          if (!trade) continue;
          // Fire as if WebSocket delivered it
          rawCountRef.current += 1; setRawMsgCount(rawCountRef.current);
          txCountRef.current += 1;  setTxCount(txCountRef.current);
          setLastMsgTime(new Date().toLocaleTimeString());
          handleWhaleTrade(trade, Date.now() - (sigInfo.blockTime * 1000), tw.label,
            { isVIP: tw.isVIP, riskMult: tw.riskMult, priorityMult: tw.priorityMult });
        }
      } catch {}
      await new Promise(r => setTimeout(r, 200)); // gentle rate limit between wallets
    }
  }, [trackedWallets, handleWhaleTrade]);

  const startMonitoring = useCallback(() => {
    const active = trackedWallets.filter(w => isValidWallet(w.address) && w.active);
    if (active.length === 0) {
      setStatus('⚠ No active wallets — go to Wallets tab');
      setTab('wallets');
      return;
    }

    // ── Try WebSocket first ──────────────────────────────
    monitorRef.current?.disconnect();
    const entries = active.map(tw => ({
      address: tw.address, label: tw.label,
      config: { isVIP: tw.isVIP, riskMult: tw.riskMult, priorityMult: tw.priorityMult },
    }));

    const monitor = new MultiWalletMonitor(
      entries,
      (trade, lat, label, config) => handleWhaleTrade(trade, lat, label, config),
    );
    monitor.onRawMessage = (type) => {
      rawCountRef.current += 1; setRawMsgCount(rawCountRef.current);
      setLastMsgTime(new Date().toLocaleTimeString());
      if (type === 'transactionNotification') { txCountRef.current += 1; setTxCount(txCountRef.current); }
    };
    monitor.onStatusChange = (s) => {
      setWsStatus(s);
      if (s === 'connected') setStatus(`✅ WS LIVE — ${active.length} whales via Helius`);
      if (s === 'error')     setStatus('⚠ WS error — polling active as fallback');
    };
    monitor.connect();
    monitorRef.current = monitor;

    // ── Start HTTP polling immediately as reliable fallback ──
    // Records baseline signatures on first poll, then catches new ones every 15s
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => pollWallets(), 15_000);
    // Baseline poll immediately
    setTimeout(() => pollWallets(), 2000);

    setIsMonitoring(true);
    rawCountRef.current = 0; txCountRef.current = 0;
    setRawMsgCount(0); setTxCount(0);
    setStatus(`🟢 MONITORING ${active.length} WHALES — WS + polling active`);
  }, [trackedWallets, handleWhaleTrade, pollWallets]);

  const stopMonitoring = useCallback(() => {
    monitorRef.current?.disconnect();
    monitorRef.current = null;
    clearInterval(pollingRef.current);
    pollingRef.current = null;
    setIsMonitoring(false);
    setWsStatus('disconnected');
    rawCountRef.current = 0; txCountRef.current = 0;
    setRawMsgCount(0); setTxCount(0); setLastMsgTime('—');
    setStatus('⏹ STOPPED');
  }, []);

  // ── Demo trade injector ─────────────────────────────────
  const injectDemoTrade = () => {
    const mints   = Object.entries(KNOWN_MINTS).filter(([m]) => m !== SOL_MINT);
    const [mint, symbol] = mints[Math.floor(Math.random() * mints.length)];
    const action: 'BUY' | 'SELL' = Math.random() > 0.4 ? 'BUY' : 'SELL';
    const demo: ParsedTrade = {
      sig: Math.random().toString(36).slice(2, 14),
      wallet: trackedWallets[0]?.address || 'DemoWallet',
      action, mint, symbol,
      amountSOL:   +(Math.random() * 0.5 + 0.05).toFixed(4),
      tokenAmount: Math.floor(Math.random() * 1_000_000),
      timestamp:   Date.now(),
      isPumpFun:   Math.random() > 0.5,
    };
    handleWhaleTrade(demo, 50 + Math.floor(Math.random() * 80), trackedWallets[0]?.label || 'Demo Whale');
  };

  // ── Bulk add wallets ────────────────────────────────────
  const bulkAddWallets = () => {
    const lines = bulkInput.split(/[\n,;\s]+/).map(s => s.trim()).filter(Boolean);
    const valid  = lines.filter(isValidWallet);
    if (valid.length === 0) { setStatus('⚠ No valid wallets in paste'); return; }
    setTrackedWallets(tw => {
      const existing = new Set(tw.map(w => w.address));
      const additions = valid.filter(a => !existing.has(a)).map((a, i) => ({
        address: a, label: `Whale ${tw.length + i + 1}`, active: true,
      }));
      return [...tw, ...additions];
    });
    setBulkInput('');
    setStatus(`✓ Added ${valid.length} wallets`);
  };

  const addAllPresets = () => {
    setTrackedWallets(WHALE_PRESETS.map(p => ({
      address: p.address, label: p.label, active: true,
      isVIP: p.isVIP, riskMult: p.riskMult, priorityMult: p.priorityMult,
    })));
    setStatus(`✓ All ${WHALE_PRESETS.length} whale presets loaded and active`);
  };

  const addPresetWhale = (preset: typeof WHALE_PRESETS[number]) => {
    setTrackedWallets(tw => {
      if (tw.some(w => w.address === preset.address)) return tw;
      return [...tw, { address: preset.address, label: preset.label, active: true, isVIP: preset.isVIP, riskMult: preset.riskMult, priorityMult: preset.priorityMult }];
    });
  };

  // ── Paper session controls ──────────────────────────────
  const startPaperSession = () => {
    const now = Date.now();
    setSessionStart(now);
    setSessionActive(true);
    setWhaleStats({});
    setDailyPnL([0, 0, 0]);
    setBestTrade(null);
    setWorstTrade(null);
    setMyTrades([]);
    setTotalPnL(0);
    paperRef.current = new PaperEngine(startingSOL);
    setPaperPortfolio(startingSOL);
    setStatus('📄 3-DAY PAPER SESSION STARTED — tracking all trades');
  };

  const resetPaperSession = () => {
    setSessionStart(null);
    setSessionActive(false);
    setWhaleStats({});
    setDailyPnL([0, 0, 0]);
    setBestTrade(null);
    setWorstTrade(null);
    setMyTrades([]);
    setTotalPnL(0);
    paperRef.current = new PaperEngine(startingSOL);
    setPaperPortfolio(startingSOL);
    localStorage.removeItem(SESSION_KEY);
    setStatus('Session reset');
  };

  // ── Solscan / on-chain wallet verifier ──────────────── NEW
  const verifyWallet = async (address: string) => {
    setWalletActivity(prev => new Map(prev).set(address, 'checking'));
    try {
      const data = await rpcCall('getSignaturesForAddress', [address, { limit: 5 }]);
      const sigs = data.result || [];
      setWalletActivity(prev => new Map(prev).set(address, sigs.length > 0 ? 'active' : 'inactive'));
    } catch {
      setWalletActivity(prev => new Map(prev).set(address, 'inactive'));
    }
  };

  const verifyAllWallets = async () => {
    setIsVerifying(true);
    setStatus('🔍 Verifying wallets on Solana mainnet…');
    const toCheck = trackedWallets.filter(w => isValidWallet(w.address));
    for (const tw of toCheck) {
      await verifyWallet(tw.address);
      await new Promise(r => setTimeout(r, 350)); // gentle rate limit
    }
    setIsVerifying(false);
    const active = Array.from(walletActivity.values()).filter(v => v === 'active').length;
    setStatus(`✓ Verification done — ${active}/${toCheck.length} wallets have real on-chain activity`);
  };

  useEffect(() => () => { monitorRef.current?.disconnect(); clearInterval(pollingRef.current); }, []);

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  const portfolioUSD     = (paperPortfolio * solUSD).toFixed(2);
  const pnlPct           = startingSOL > 0 ? ((totalPnL / startingSOL) * 100).toFixed(1) : '0.0';
  const validWalletCount = trackedWallets.filter(w => isValidWallet(w.address) && w.active).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.black,
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      color: 'rgba(255,255,255,0.85)',
      padding: '0 0 100px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes sqi-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes sqi-glow { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.6)} 50%{box-shadow:0 0 0 8px rgba(74,222,128,0)} }
        .sqi-pulse-dot { animation: sqi-glow 1.6s infinite; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)', padding: 4,
        }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', color: COLORS.gold, textTransform: 'uppercase' }}>
            SQI 2050 · SOLANA
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, ...goldText, letterSpacing: '-0.03em' }}>
            Shreem Brzee Bot
          </div>
        </div>
        {/* Live SOL price badge */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
            SOL / USD
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.cyan }}>
            ${solUSD.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{ padding: '8px 20px 4px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 9, color: isMonitoring ? COLORS.green : 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.15em', flex: 1 }}>
          {status || 'OFFLINE'}
        </div>
        {isMonitoring && (
          <div style={{
            fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', padding: '3px 8px', borderRadius: 8,
            background: wsStatus === 'connected' ? 'rgba(74,222,128,0.1)' : wsStatus === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
            color: wsStatus === 'connected' ? COLORS.green : wsStatus === 'error' ? COLORS.red : COLORS.cyan,
            border: `1px solid ${wsStatus === 'connected' ? 'rgba(74,222,128,0.2)' : wsStatus === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            {wsStatus === 'connected' ? '● WS LIVE' : wsStatus === 'connecting' ? '◌ CONNECTING' : wsStatus === 'error' ? '✗ WS ERROR' : '○ WS OFF'}
          </div>
        )}
      </div>

      {/* ── CONNECT + MODE ── */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!walletAddress ? (
            <button onClick={connectWallet} style={{
              flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', fontWeight: 800,
              fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase',
              background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: COLORS.gold,
            }}>
              ENTER PAPER MODE
            </button>
          ) : (
            <div style={{ ...glassCard, padding: '10px 16px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>WALLET</div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: COLORS.cyan }}>
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {walletAddress?.startsWith('Paper') || walletAddress?.startsWith('Demo') ? (
                  <button onClick={connectWallet} style={{
                    padding: '5px 12px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
                    color: COLORS.gold, fontSize: 8, fontWeight: 800, letterSpacing: '0.15em',
                  }}>
                    CONNECT PHANTOM
                  </button>
                ) : (
                  <>
                    <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>BALANCE</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: COLORS.gold }}>
                      {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : '—'}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                      {solBalance !== null ? `≈ $${(solBalance * solUSD).toFixed(2)}` : ''}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {(['paper', 'live'] as const).map(m => {
            const isLiveOnMobile = m === 'live' && (!window.solana?.isPhantom);
            return (
            <button key={m} onClick={() => {
              if (isLiveOnMobile) { setStatus('⚠ LIVE mode requires Phantom — desktop only'); return; }
              setMode(m);
            }} style={{
              padding: '12px 18px', borderRadius: 14, cursor: 'pointer',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase',
              background: mode === m
                ? (m === 'live' ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.10)')
                : 'rgba(255,255,255,0.03)',
              color: mode === m ? (m === 'live' ? COLORS.red : COLORS.green) : 'rgba(255,255,255,0.3)',
              border: `1px solid ${mode === m ? (m === 'live' ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.2)') : COLORS.glassBorder}`,
              opacity: isLiveOnMobile ? 0.4 : 1,
            }}>
              {m === 'live' ? '⚡ LIVE' : '📄 PAPER'}
            </button>
            );
          })}
        </div>

        {/* START / STOP + SIM */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            disabled={!walletAddress}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', fontWeight: 900,
              fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
              background: isMonitoring ? 'rgba(248,113,113,0.1)' : 'rgba(212,175,55,0.1)',
              border: `1px solid ${isMonitoring ? 'rgba(248,113,113,0.2)' : 'rgba(212,175,55,0.2)'}`,
              color: isMonitoring ? COLORS.red : COLORS.gold,
              opacity: !walletAddress ? 0.4 : 1,
            }}>
            {isMonitoring ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="sqi-pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS.green }} />
                STOP COPY TRADING
              </span>
            ) : '▶ START COPY TRADING'}
          </button>
          <button onClick={injectDemoTrade} style={{
            padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.glassBorder}`,
            color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
          }}>
            SIM
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px', marginBottom: 16, overflowX: 'auto' }}>
        {(['dashboard', 'wallets', 'feed', 'trades', 'setup'] as const).map(tabName => (
          <button key={tabName} onClick={() => setTab(tabName)} style={{
            padding: '8px 14px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
            background: tab === tabName ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tab === tabName ? 'rgba(212,175,55,0.2)' : COLORS.glassBorder}`,
            color: tab === tabName ? COLORS.gold : 'rgba(255,255,255,0.35)',
          }}>
            {tabName === 'wallets' ? `${tabName} (${validWalletCount})` : tabName}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ padding: '0 20px' }}>

        {/* ════ DASHBOARD ════ */}
        {tab === 'dashboard' && (() => {
          const now = Date.now();
          const elapsed = sessionStart ? now - sessionStart : 0;
          const remaining = sessionStart ? Math.max(0, PAPER_MS - elapsed) : PAPER_MS;
          const daysLeft  = Math.floor(remaining / 86400000);
          const hoursLeft = Math.floor((remaining % 86400000) / 3600000);
          const minsLeft  = Math.floor((remaining % 3600000) / 60000);
          const pct       = sessionStart ? Math.min(100, (elapsed / PAPER_MS) * 100) : 0;
          const done      = sessionStart && elapsed >= PAPER_MS;
          const winCount  = myTrades.filter(t => t.pnl > 0).length;
          const lossCount = myTrades.filter(t => t.pnl < 0 && !t.skipped).length;
          const winRate   = (winCount + lossCount) > 0 ? Math.round((winCount / (winCount + lossCount)) * 100) : 0;
          const topWhales = Object.values(whaleStats).sort((a: any, b: any) => b.pnl - a.pnl);

          return (
          <div>
            {/* ── 3-DAY SESSION BANNER ── */}
            <div style={{ ...glassCard, padding: 20, marginBottom: 14,
              border: `1px solid ${done ? 'rgba(212,175,55,0.3)' : sessionActive ? 'rgba(74,222,128,0.2)' : COLORS.glassBorder}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', color: COLORS.gold, textTransform: 'uppercase' }}>
                    📄 PAPER SESSION — {PAPER_DAYS} DAYS
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: done ? COLORS.gold : sessionActive ? COLORS.green : 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    {done ? '✅ SESSION COMPLETE — REVIEW BEFORE GOING LIVE'
                      : sessionActive ? `${daysLeft}d ${hoursLeft}h ${minsLeft}m remaining`
                      : 'Tap START to begin 3-day paper trial'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!sessionActive && !done && (
                    <button onClick={startPaperSession} style={{
                      padding: '8px 16px', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                      color: COLORS.green, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                    }}>▶ START</button>
                  )}
                  {(sessionActive || done) && (
                    <button onClick={resetPaperSession} style={{
                      padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.glassBorder}`,
                      color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800,
                    }}>RESET</button>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                <div style={{ background: done ? COLORS.gold : COLORS.green, width: `${pct}%`, height: '100%',
                  borderRadius: 4, transition: 'width 1s linear' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                <span>Day 1</span><span>Day 2</span><span>Day 3</span><span>Live?</span>
              </div>
            </div>

            {/* ── STATS GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'PORTFOLIO',    value: `$${portfolioUSD}`,   sub: `${paperPortfolio.toFixed(3)} SOL` },
                { label: 'TOTAL P&L',    value: `${totalPnL >= 0 ? '+' : ''}${(totalPnL * solUSD).toFixed(2)}$`,
                  sub: `${totalPnL >= 0 ? '+' : ''}${pnlPct}%`, color: totalPnL >= 0 ? COLORS.green : COLORS.red },
                { label: 'WIN RATE',     value: `${winRate}%`,        sub: `${winCount}W / ${lossCount}L`, color: winRate >= 60 ? COLORS.green : winRate >= 45 ? COLORS.gold : COLORS.red },
                { label: 'LATENCY',      value: lastLatency != null ? `${lastLatency}ms` : '—', sub: `avg ${avgLatency ?? '—'}ms` },
              ].map(stat => (
                <div key={stat.label} style={{ ...glassCard, padding: '14px 16px' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 5 }}>{stat.label}</div>
                  <div style={{ fontSize: 19, fontWeight: 900, color: stat.color || COLORS.gold, letterSpacing: '-0.02em' }}>{stat.value}</div>
                  {stat.sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{stat.sub}</div>}
                </div>
              ))}
            </div>

            {/* ── DAILY BREAKDOWN ── */}
            {sessionActive && (
              <div style={{ ...glassCard, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 12 }}>
                  📅 DAILY P&L BREAKDOWN
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {['Day 1', 'Day 2', 'Day 3'].map((d, i) => {
                    const val = dailyPnL[i] || 0;
                    const usd = (val * solUSD).toFixed(2);
                    return (
                      <div key={d} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '12px 10px', textAlign: 'center',
                        border: `1px solid ${val > 0 ? 'rgba(74,222,128,0.15)' : val < 0 ? 'rgba(248,113,113,0.15)' : COLORS.glassBorder}` }}>
                        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>{d}</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: val > 0 ? COLORS.green : val < 0 ? COLORS.red : 'rgba(255,255,255,0.3)' }}>
                          {val === 0 ? '—' : `${val >= 0 ? '+' : ''}$${Math.abs(+usd).toFixed(2)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── WHALE LEADERBOARD ── */}
            {topWhales.length > 0 && (
              <div style={{ ...glassCard, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 12 }}>
                  🐋 WHALE PERFORMANCE
                </div>
                {topWhales.slice(0, 8).map((w: any, i) => {
                  const wr = w.trades > 0 ? Math.round((w.wins / w.trades) * 100) : 0;
                  const usd = (w.pnl * solUSD).toFixed(2);
                  return (
                    <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                      borderBottom: `1px solid ${COLORS.glassBorder}` }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', minWidth: 14, fontWeight: 800 }}>#{i+1}</div>
                      <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{w.label}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{w.trades}T · {wr}%WR</div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: w.pnl >= 0 ? COLORS.green : COLORS.red, minWidth: 60, textAlign: 'right' }}>
                        {w.pnl >= 0 ? '+$' : '-$'}{Math.abs(parseFloat(usd)).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── BEST / WORST TRADE ── */}
            {(bestTrade || worstTrade) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {bestTrade && (
                  <div style={{ ...glassCard, padding: 14, border: '1px solid rgba(74,222,128,0.2)' }}>
                    <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', color: COLORS.green, textTransform: 'uppercase', marginBottom: 8 }}>🏆 BEST</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold }}>{bestTrade.symbol || '—'}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.green }}>+${(bestTrade.pnl * solUSD).toFixed(2)}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{bestTrade.label}</div>
                  </div>
                )}
                {worstTrade && (
                  <div style={{ ...glassCard, padding: 14, border: '1px solid rgba(248,113,113,0.2)' }}>
                    <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', color: COLORS.red, textTransform: 'uppercase', marginBottom: 8 }}>📉 WORST</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold }}>{worstTrade.symbol || '—'}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.red }}>${(worstTrade.pnl * solUSD).toFixed(2)}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{worstTrade.label}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── SESSION VERDICT (when done) ── */}
            {done && (
              <div style={{ ...glassCard, padding: 20, marginBottom: 12,
                border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.04)' }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 14 }}>
                  ⚡ 3-DAY VERDICT — GO LIVE?
                </div>
                {[
                  ['Win Rate',    `${winRate}%`,   winRate >= 55 ? '✅ Good — go live' : winRate >= 45 ? '⚠️ Marginal — wait' : '❌ Not ready — improve whale list'],
                  ['Total P&L',  `${totalPnL >= 0 ? '+' : ''}$${(totalPnL * solUSD).toFixed(0)}`,  totalPnL > 0 ? '✅ Profitable' : '❌ Negative — do not go live'],
                  ['Latency',    `${avgLatency ?? '—'}ms`,  (avgLatency ?? 999) < 500 ? '✅ Fast enough' : '⚠️ Check Helius key'],
                  ['Top Whale',  topWhales[0]?.label || '—',  topWhales[0]?.pnl > 0 ? '✅ Keep as VIP' : '⚠️ Swap out'],
                ].map(([k, v, verdict]) => (
                  <div key={k as string} style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.glassBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{k}</span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: COLORS.gold }}>{v}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{verdict}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Connection Diagnostics ── */}
            {isMonitoring && (
              <div style={{ ...glassCard, padding: 16, marginBottom: 12,
                border: `1px solid ${rawMsgCount > 0 ? 'rgba(74,222,128,0.2)' : 'rgba(255,165,0,0.2)'}` }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 12 }}>
                  🔌 CONNECTION DIAGNOSTICS
                </div>
                {[
                  ['WS STATUS',      wsStatus.toUpperCase(),        wsStatus === 'connected' ? COLORS.green : wsStatus === 'error' ? COLORS.red : COLORS.cyan],
                  ['RAW MESSAGES',   `${rawMsgCount} received`,     rawMsgCount > 0 ? COLORS.green : 'rgba(255,165,0,0.9)'],
                  ['TX EVENTS',      `${txCount} whale txs`,        txCount > 0 ? COLORS.green : 'rgba(255,255,255,0.5)'],
                  ['TRADES PARSED',  `${myTrades.length} trades`,   myTrades.length > 0 ? COLORS.green : 'rgba(255,255,255,0.5)'],
                  ['LAST SIGNAL',    lastMsgTime,                   'rgba(255,255,255,0.6)'],
                  ['HELIUS KEY',     HAS_HELIUS ? '✓ SET' : '✗ MISSING', HAS_HELIUS ? COLORS.green : COLORS.red],
                  ['MODE',           wsStatus === 'connected' ? 'WS (50ms)' : 'POLLING (15s)', wsStatus === 'connected' ? COLORS.green : COLORS.cyan],
                  ['WALLETS',        `${trackedWallets.filter(w => w.active).length} active`, COLORS.gold],
                ].map(([k, v, col]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                    borderBottom: `1px solid ${COLORS.glassBorder}`, fontSize: 10 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 700, letterSpacing: '0.2em' }}>{k}</span>
                    <span style={{ color: col as string, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
                {rawMsgCount === 0 && wsStatus === 'connected' && (
                  <div style={{ fontSize: 9, color: 'rgba(255,165,0,0.8)', marginTop: 10, lineHeight: 1.6 }}>
                    ⚠ WS connected but no messages yet. Either whales aren't trading right now or Helius subscription is pending. Tap SIM to test paper engine.
                  </div>
                )}
                {wsStatus === 'error' || wsStatus === 'disconnected' ? (
                  <div style={{ fontSize: 9, color: COLORS.red, marginTop: 10 }}>
                    ✗ WebSocket not connected. Tap STOP then START to reconnect.
                  </div>
                ) : null}
              </div>
            )}

            {/* Recent trades preview */}
            {myTrades.slice(0, 3).map((x, i) => <TradeRow key={x.id || i} trade={x} showPnL solUSD={solUSD} />)}
          </div>
          );
        })()}

        {/* ════ WALLETS ════ */}
        {tab === 'wallets' && (
          <div>
            {/* ADD ALL button — top of wallets tab */}
            <button onClick={addAllPresets} style={{
              width: '100%', padding: '14px 0', borderRadius: 16, cursor: 'pointer', marginBottom: 14,
              background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
              color: COLORS.gold, fontSize: 11, fontWeight: 900, letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
            }}>
              ⭐ ADD ALL {WHALE_PRESETS.length} WHALE PRESETS
            </button>

            <div style={{ ...glassCard, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 12 }}>
                ◈ WHALE PRESETS — TAP TO ADD
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 12, lineHeight: 1.6 }}>
                Tap any preset below to add individually, or use ADD ALL above to load all at once.
              </div>
              {WHALE_PRESETS.map(p => {
                const isAdded = trackedWallets.some(w => w.address === p.address);
                return (
                <button key={p.address} onClick={() => addPresetWhale(p)} style={{
                  display: 'block', width: '100%', textAlign: 'left', marginBottom: 8,
                  padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  background: isAdded ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isAdded ? 'rgba(74,222,128,0.2)' : COLORS.glassBorder}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: p.isVIP ? COLORS.gold : 'rgba(255,255,255,0.8)' }}>
                      {p.isVIP ? '⭐ ' : ''}{p.label}
                    </div>
                    {isAdded && <span style={{ fontSize: 8, color: COLORS.green, fontWeight: 800 }}>✓ ADDED</span>}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{p.note}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: 4 }}>
                    {p.address.slice(0, 10)}…{p.address.slice(-6)}
                  </div>
                </button>
                );
              })}
            </div>

            <div style={{ ...glassCard, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 12 }}>
                ⊕ ADD WALLETS
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input value={newWallet} onChange={e => setNewWallet(e.target.value)}
                  placeholder="Solana wallet address…"
                  style={{ ...inputStyle, flex: 2 }} />
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label"
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
              <button onClick={() => {
                if (!isValidWallet(newWallet)) { setStatus('⚠ Invalid address'); return; }
                setTrackedWallets(tw => [...tw, { address: newWallet, label: newLabel || `Whale ${tw.length + 1}`, active: true }]);
                setNewWallet(''); setNewLabel('');
              }} style={{
                width: '100%', padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)',
                color: COLORS.gold, fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', marginBottom: 14,
              }}>
                + ADD SINGLE
              </button>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                placeholder="Bulk paste — one address per line or comma-separated…"
                rows={3} style={{ ...inputStyle, resize: 'none' as const }} />
              <button onClick={bulkAddWallets} style={{
                width: '100%', padding: '10px 0', borderRadius: 12, cursor: 'pointer', marginTop: 8,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.glassBorder}`,
                color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em',
              }}>
                BULK ADD
              </button>
            </div>

            {trackedWallets.length === 0 ? (
              <div style={{ ...glassCard, padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                No whales tracked yet. Tap a preset above or paste addresses.
              </div>
            ) : (
              <>
                {/* Verify all button */}
                <button
                  onClick={verifyAllWallets}
                  disabled={isVerifying}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 14, cursor: 'pointer', marginBottom: 12,
                    background: 'rgba(34,211,238,0.06)', border: `1px solid rgba(34,211,238,0.2)`,
                    color: COLORS.cyan, fontSize: 9, fontWeight: 800, letterSpacing: '0.25em',
                    opacity: isVerifying ? 0.6 : 1,
                  }}>
                  {isVerifying ? '⏳ VERIFYING ON-CHAIN…' : '🔍 VERIFY ALL WALLETS ON SOLANA'}
                </button>
                {trackedWallets.map((tw, i) => {
                  const valid    = isValidWallet(tw.address);
                  const activity = walletActivity.get(tw.address);
                  const actColor = activity === 'active' ? COLORS.green : activity === 'inactive' ? COLORS.red : activity === 'checking' ? COLORS.cyan : 'rgba(255,255,255,0.2)';
                  const actLabel = activity === 'active' ? '✅ REAL' : activity === 'inactive' ? '❌ DEAD' : activity === 'checking' ? '⏳…' : '?';
                  return (
                    <div key={i} style={{ ...glassCard, padding: '14px 18px', marginBottom: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                            {tw.isVIP && <span style={{ color: COLORS.gold }}>⭐ </span>}{tw.label}
                          </div>
                          {tw.isVIP && (
                            <span style={{ fontSize: 7, color: COLORS.gold, fontWeight: 800, letterSpacing: '0.2em' }}>
                              {tw.riskMult ?? 1}x · {tw.priorityMult ?? 1}x PRI
                            </span>
                          )}
                          {activity && (
                            <div style={{ fontSize: 7, fontWeight: 800, color: actColor, letterSpacing: '0.2em' }}>
                              {actLabel}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                          color: valid ? 'rgba(255,255,255,0.7)' : COLORS.red,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tw.address || '← Enter address'}{!valid && tw.address && ' ✗ invalid'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => setTrackedWallets(arr => arr.map((w, j) => j === i ? { ...w, isVIP: !w.isVIP, riskMult: !w.isVIP ? 2 : 1, priorityMult: !w.isVIP ? 3 : 1 } : w))}
                          style={{
                            padding: '5px 10px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 9, fontWeight: 800,
                            background: tw.isVIP ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${tw.isVIP ? 'rgba(212,175,55,0.3)' : COLORS.glassBorder}`,
                            color: tw.isVIP ? COLORS.gold : 'rgba(255,255,255,0.3)',
                          }}>⭐</button>
                        <button onClick={() => verifyWallet(tw.address)}
                          style={{
                            padding: '5px 10px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 9, fontWeight: 800,
                            background: 'rgba(34,211,238,0.06)', border: `1px solid rgba(34,211,238,0.15)`,
                            color: COLORS.cyan,
                          }}>🔍</button>
                        <a href={`https://solscan.io/account/${tw.address}`} target="_blank" rel="noreferrer"
                          style={{
                            padding: '5px 10px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 9, fontWeight: 800, textDecoration: 'none',
                            background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.glassBorder}`,
                            color: 'rgba(255,255,255,0.4)',
                          }}>SC</a>
                        <button onClick={() => setTrackedWallets(arr => arr.map((w, j) => j === i ? { ...w, active: !w.active } : w))}
                          style={{
                            padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                            background: tw.active ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                            color: tw.active ? COLORS.green : 'rgba(255,255,255,0.3)',
                            border: `1px solid ${tw.active ? 'rgba(74,222,128,0.2)' : COLORS.glassBorder}`,
                          }}>
                          {tw.active ? '●' : '○'}
                        </button>
                        <button onClick={() => setTrackedWallets(arr => arr.filter((_, j) => j !== i))}
                          style={{
                            padding: '6px 10px', borderRadius: 10,
                            border: '1px solid rgba(248,113,113,0.2)',
                            background: 'rgba(248,113,113,0.06)', color: COLORS.red,
                            cursor: 'pointer', fontSize: 9, fontWeight: 800,
                          }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ════ LIVE FEED ════ */}
        {tab === 'feed' && (
          <div style={{ ...glassCard, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase' }}>
                ⚡ WHALE ACTIVITY FEED
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {pumpFunOnly && (
                  <span style={{ fontSize: 8, fontWeight: 800, color: COLORS.cyan, letterSpacing: '0.15em' }}>
                    PUMP.FUN ONLY
                  </span>
                )}
                <div style={{ fontSize: 9, color: isMonitoring ? COLORS.green : 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.2em' }}>
                  {isMonitoring ? '● LIVE' : '○ OFFLINE'}
                </div>
              </div>
            </div>
            {liveFeed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>
                Watching for swaps on tracked whales…
              </div>
            ) : liveFeed.map((x, i) => (
              <div key={x.id || i} style={{
                padding: '12px 14px', marginBottom: 8,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${x.action === 'BUY' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'}`,
                borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0,
                  background: x.action === 'BUY' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                  color: x.action === 'BUY' ? COLORS.green : COLORS.red,
                  border: `1px solid ${x.action === 'BUY' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                }}>
                  {x.action === 'BUY' ? '↑' : '↓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: x.action === 'BUY' ? COLORS.green : COLORS.red }}>
                    {x.isVIP && <span style={{ color: COLORS.gold, fontSize: 8, marginRight: 6 }}>⭐</span>}{x.action} · <span style={{ color: COLORS.gold }}>{x.symbol || (x.mint?.slice(0, 6) + '…')}</span> · {x.amountSOL?.toFixed?.(3) || '—'} SOL
                    {x.isPumpFun && <span style={{ color: COLORS.cyan, fontSize: 8, marginLeft: 6 }}>PUMP</span>}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {x.label} · {new Date(x.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <a href={`https://solscan.io/tx/${x.sig}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 9, color: COLORS.cyan, textDecoration: 'none', fontWeight: 700 }}>
                  {x.sig?.slice(0, 8)}…
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ════ MY TRADES ════ */}
        {tab === 'trades' && (
          <div style={{ ...glassCard, padding: 20 }}>
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 16 }}>
              ◈ MY COPY TRADE HISTORY
            </div>
            {myTrades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>
                No trades executed yet.
              </div>
            ) : myTrades.map((x, i) => <TradeRow key={x.id || i} trade={x} showPnL solUSD={solUSD} />)}
          </div>
        )}

        {/* ════ SETUP ════ */}
        {tab === 'setup' && (
          <div>
            <div style={{ ...glassCard, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 20 }}>
                ⚙ RISK MANAGEMENT
              </div>

              <SettingRow label="RISK PER TRADE (%)" value={`${riskPct}%`}
                hint={`${(paperPortfolio * riskPct / 100).toFixed(4)} SOL ≈ $${(paperPortfolio * riskPct / 100 * solUSD).toFixed(2)}`}>
                <input type="range" min={1} max={20} value={riskPct}
                  onChange={e => setRiskPct(+e.target.value)}
                  style={{ width: '100%', accentColor: COLORS.gold }} />
              </SettingRow>

              <SettingRow label="STARTING BALANCE (SOL)"
                value={`${startingSOL} SOL ≈ $${(startingSOL * solUSD).toFixed(0)}`}
                hint="Set this to what you plan to trade with in LIVE mode">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                  {[0.5, 1, 2, 5, 10].map(n => (
                    <button key={n} onClick={() => {
                      setStartingSOL(n);
                      paperRef.current = new PaperEngine(n, slippageBps);
                      setPaperPortfolio(n);
                      setMyTrades([]); setTotalPnL(0);
                    }} style={{
                      padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 11, fontWeight: 900,
                      background: startingSOL === n ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${startingSOL === n ? 'rgba(212,175,55,0.3)' : COLORS.glassBorder}`,
                      color: startingSOL === n ? COLORS.gold : 'rgba(255,255,255,0.5)',
                    }}>
                      {n} SOL
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                  Or type custom: <input type="number" min={0.01} step={0.01} value={startingSOL}
                    onChange={e => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, ''); // strip leading zeros
                      const v = parseFloat(raw);
                      if (!isNaN(v) && v > 0) {
                        setStartingSOL(v);
                        paperRef.current = new PaperEngine(v, slippageBps);
                        setPaperPortfolio(v);
                        setMyTrades([]); setTotalPnL(0);
                      }
                    }}
                    style={{ ...inputStyle, width: 80, display: 'inline-block', marginLeft: 8 }} />
                </div>
              </SettingRow>

              {/* NEW: Slippage */}
              <SettingRow label="SLIPPAGE" value={`${slippageBps / 100}% (${slippageBps} bps)`}
                hint="Higher = better fill on fast launches but worse avg price. 3% is standard.">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[100, 200, 300, 500, 1000].map(bps => (
                    <button key={bps} onClick={() => setSlippageBps(bps)} style={{
                      padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 9, fontWeight: 800,
                      background: slippageBps === bps ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${slippageBps === bps ? 'rgba(212,175,55,0.3)' : COLORS.glassBorder}`,
                      color: slippageBps === bps ? COLORS.gold : 'rgba(255,255,255,0.4)',
                    }}>
                      {bps / 100}%
                    </button>
                  ))}
                </div>
              </SettingRow>

              {/* NEW: Pump.fun filter */}
              <SettingRow label="PUMP.FUN ONLY" value={pumpFunOnly ? '✓ ENABLED' : 'ALL DEXs'}
                hint="ON = only copy swaps that touch the Pump.fun program. Best for meme sniping.">
                <button onClick={() => setPumpFunOnly(v => !v)} style={{
                  padding: '8px 20px', borderRadius: 12, cursor: 'pointer',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                  background: pumpFunOnly ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${pumpFunOnly ? 'rgba(34,211,238,0.25)' : COLORS.glassBorder}`,
                  color: pumpFunOnly ? COLORS.cyan : 'rgba(255,255,255,0.4)',
                }}>
                  {pumpFunOnly ? '● PUMP.FUN ONLY' : '○ ALL DEXs'}
                </button>
              </SettingRow>

              {/* NEW: Auto-sell timer */}
              <SettingRow label="AUTO-SELL TIMER"
                value={autoSellMins > 0 ? `${autoSellMins} MIN` : 'DISABLED'}
                hint={autoSellMins > 0
                  ? `Live positions auto-exit after ${autoSellMins} min if whale has not sold`
                  : 'Holds until whale sells or you stop manually'}>
                <input type="range" min={0} max={120} step={5} value={autoSellMins}
                  onChange={e => setAutoSellMins(+e.target.value)}
                  style={{ width: '100%', accentColor: COLORS.gold }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  <span>OFF</span><span>30m</span><span>60m</span><span>90m</span><span>120m</span>
                </div>
              </SettingRow>

              {/* NEW: Max concurrent positions */}
              <SettingRow label="MAX OPEN POSITIONS"
                value={`${maxPositions} simultaneous`}
                hint={`Bot skips new BUYs once ${maxPositions} positions are open. Protects capital fragmentation.`}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20, 25, 30].map(n => (
                    <button key={n} onClick={() => setMaxPositions(n)} style={{
                      padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 10, fontWeight: 800,
                      background: maxPositions === n ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${maxPositions === n ? 'rgba(212,175,55,0.3)' : COLORS.glassBorder}`,
                      color: maxPositions === n ? COLORS.gold : 'rgba(255,255,255,0.4)',
                    }}>
                      {n}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="COPY MODE" value={mode.toUpperCase()}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                  📄 PAPER — Simulates trades without real money. Use this first.<br />
                  ⚡ LIVE — Executes real swaps via Jupiter v6 with skip-preflight + dynamic priority fees.<br />
                  <span style={{ color: COLORS.red }}>⚠ Only enable LIVE after validating in PAPER for several hours.</span>
                </div>
              </SettingRow>
            </div>

            <div style={{ ...glassCard, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 16 }}>
                🔑 HELIUS RPC — CRITICAL FOR SPEED
              </div>
              <div style={{ fontSize: 11, color: HAS_HELIUS ? COLORS.green : COLORS.red, fontWeight: 700, letterSpacing: '0.15em', marginBottom: 14 }}>
                {HAS_HELIUS
                  ? '✓ HELIUS KEY DETECTED — Enhanced WebSocket active (50–200ms latency)'
                  : '✗ NO HELIUS KEY — Running on public RPC (2–5s latency — too slow for meme coins)'}
              </div>
              {[
                '1. Go to helius.dev → Create free account (2 min)',
                '2. Copy your API key from the dashboard',
                '3. Vercel → Project → Settings → Environment Variables',
                '4. Add: VITE_HELIUS_API_KEY = <your key> → Redeploy',
                '5. Free tier: 1M credits/month — enough for 24/7 monitoring of 5–10 whales',
                '6. Helius transactionSubscribe: 50–200ms vs 2–5s on public RPC',
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', padding: '5px 0', borderBottom: `1px solid ${COLORS.glassBorder}` }}>
                  {s}
                </div>
              ))}
            </div>

            <div style={{ ...glassCard, padding: 24 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 16 }}>
                📋 HOW TO FIND TOP WHALES
              </div>
              {[
                '1. Go to fomo.fund on your browser',
                '2. Sort leaderboard by 30d realized PnL',
                '3. Click a trader → copy their Solana wallet address',
                '4. Paste in WALLETS tab above (single or bulk)',
                '5. Activate the wallet → START COPY TRADING',
                '6. Max 5–10 whales on free Helius tier',
                '7. Only add wallets with verifiable on-chain history on Solscan',
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', padding: '5px 0', borderBottom: `1px solid ${COLORS.glassBorder}` }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── LIVE-mode warning bar ── */}
      {mode === 'live' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(248,113,113,0.08)',
          borderTop: '1px solid rgba(248,113,113,0.2)',
          padding: '10px 22px',
          fontSize: 9, color: COLORS.red, fontWeight: 700, letterSpacing: '0.15em',
          textAlign: 'center', zIndex: 100,
        }}>
          ⚡ LIVE MODE — Real SOL on every copied trade · {slippageBps / 100}% slippage · skip-preflight enabled
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────
function TradeRow({ trade, showPnL, solUSD = 150 }: { trade: any; showPnL?: boolean; solUSD?: number }) {
  const isSkipped      = trade.skipped;
  const isExecuting    = trade.executing;
  const isConfirming   = trade.confirming;
  const isConfirmed    = trade.confirmed;
  const isConfirmError = !!trade.confirmError;
  const isError        = !!trade.error;
  const symbol         = trade.symbol || (trade.token || trade.mint || '—').slice(0, 6) + '…';

  const statusSuffix = isExecuting    ? ' ⏳ sending…'
    : isConfirming   ? ' 🔄 confirming…'
    : isConfirmed    ? ' ✅ confirmed'
    : isConfirmError ? ` ⚠ ${trade.confirmError}`
    : isError        ? ` ✗ ${trade.error}`
    : trade.executed ? ' ✓ sent'
    : '';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', marginBottom: 6,
      background: 'rgba(255,255,255,0.01)',
      border: `1px solid ${isError || isConfirmError
        ? 'rgba(248,113,113,0.15)'
        : isConfirmed
          ? 'rgba(74,222,128,0.15)'
          : trade.action === 'BUY'
            ? 'rgba(74,222,128,0.08)'
            : 'rgba(248,113,113,0.08)'}`,
      borderRadius: 14,
      opacity: isSkipped ? 0.55 : 1,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: trade.action === 'BUY' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
        color: trade.action === 'BUY' ? COLORS.green : COLORS.red,
        fontSize: 14, fontWeight: 900, flexShrink: 0,
      }}>
        {trade.action === 'BUY' ? '↑' : '↓'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700,
          color: trade.action === 'BUY' ? COLORS.green : COLORS.red,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {trade.action} · <span style={{ color: COLORS.gold }}>{symbol}</span>
          {isSkipped && ' (no position)'}
          {statusSuffix}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
          {(trade.riskSOL || 0).toFixed(4)} SOL · {trade.label || ''} · {new Date(trade.timestamp).toLocaleTimeString()}{trade.costs ? <span style={{color:'rgba(248,113,113,0.6)',marginLeft:6}}>{trade.costs}</span> : ''}
          {trade.sig && !isExecuting && (
            <a href={`https://solscan.io/tx/${trade.sig}`} target="_blank" rel="noreferrer"
              style={{ color: COLORS.cyan, textDecoration: 'none', marginLeft: 6 }}>
              {trade.sig.slice(0, 8)}…
            </a>
          )}
        </div>
      </div>
      {showPnL && trade.pnl !== undefined && !isSkipped && (
        <div style={{ fontSize: 13, fontWeight: 900, color: trade.pnl >= 0 ? COLORS.green : COLORS.red, flexShrink: 0 }}>
          {trade.pnl >= 0 ? '+' : ''}{(trade.pnl * solUSD).toFixed(2)}$
        </div>
      )}
    </div>
  );
}

function SettingRow({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.glassBorder}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.gold }}>{value}</div>
      </div>
      {hint && <div style={{ fontSize: 9, color: COLORS.cyan, marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

export default function FomoCopyBot() {
  const { isAdmin, isLoading } = useAdminRole();
  // Safety timeout — if admin hook hangs >3s just render the page.
  // The route is already protected by the router; this prevents infinite spinner.
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (isLoading && !timedOut) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }
  // Only redirect if hook resolved AND confirmed not admin (not a timeout)
  if (!isLoading && !isAdmin && !timedOut) {
    return <Navigate to="/income-streams" replace />;
  }
  return <BotErrorBoundary><FomoCopyBotInner /></BotErrorBoundary>;
}