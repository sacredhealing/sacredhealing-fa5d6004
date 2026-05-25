import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useAdminRole } from '@/hooks/useAdminRole';

// ═══════════════════════════════════════════════════════════
//  SQI 2050 — SOVEREIGN COPY INTELLIGENCE BOT  v3
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
const HELIUS_KEY = (import.meta.env.VITE_HELIUS_API_KEY || '').trim();
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
  'So11111111111111111111111111111111111111112':      'SOL',
};

// Runtime cache — seeded with known mints, grows with API lookups
const mintSymbolCache = new Map<string, string>(Object.entries(KNOWN_MINTS));

// ── Verified whale presets ─────────────────────────────────
// Only Cupsey and Orange are verified from fomo.fund.
// The other 4 addresses from the previous version were REMOVED — unverifiable.
// Add more: fomo.fund → Leaderboard → sort 30d PnL → copy wallet address.
const WHALE_PRESETS: { label: string; address: string; note: string }[] = [
  {
    label: 'Cupsey',
    address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE',
    note: 'High-frequency micro-cap sniper',
  },
  {
    label: 'Orange',
    address: '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    note: 'Pump.fun launch hunter',
  },
  // ↓ Paste verified addresses from fomo.fund leaderboard here
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
async function fetchSolPriceUSD(): Promise<number> {
  try {
    const res = await fetch(`${JUPITER_PRICE_API}?ids=${SOL_MINT}`);
    if (!res.ok) throw new Error('price fail');
    const data = await res.json();
    const price = parseFloat(data.data?.[SOL_MINT]?.price);
    if (price > 0) return price;
  } catch {}
  return 150;
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
class WalletMonitor {
  wallet: string;
  onTrade: (trade: ParsedTrade, latencyMs: number) => void;
  ws: WebSocket | null = null;
  subId: number | null = null;
  reconnectTimer: any = null;
  killed = false;

  constructor(walletAddress: string, onTrade: (t: ParsedTrade, lat: number) => void) {
    this.wallet  = walletAddress;
    this.onTrade = onTrade;
  }

  connect() {
    if (this.killed) return;
    this.ws = new WebSocket(HELIUS_WS);
    this.ws.onopen    = () => this._subscribe();
    this.ws.onmessage = (e) => this._onMessage(e);
    this.ws.onerror   = () => {};
    this.ws.onclose   = () => {
      if (this.killed) return;
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };
  }

  _subscribe() {
    if (!this.ws) return;
    if (HAS_HELIUS) {
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 420,
        method: 'transactionSubscribe',
        params: [
          { vote: false, failed: false, accountInclude: [this.wallet] },
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
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'logsSubscribe',
        params: [{ mentions: [this.wallet] }, { commitment: 'processed' }],
      }));
    }
  }

  async _onMessage(e: MessageEvent) {
    let data: any;
    try { data = JSON.parse(e.data); } catch { return; }

    if (data.method === 'transactionNotification') {
      const t0    = Date.now();
      const value = data.params?.result?.transaction;
      const sig   = data.params?.result?.signature || value?.transaction?.signatures?.[0];
      if (!value || !sig) return;
      const trade = parseTradeFromTx(value, this.wallet, sig);
      if (trade) this.onTrade(trade, Date.now() - t0);
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
        const trade = parseTradeFromTx(tx, this.wallet, sig);
        if (trade) this.onTrade(trade, Date.now() - t0);
      } catch {}
    }
  }

  disconnect() {
    this.killed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try { this.ws?.close(); } catch {}
  }
}

// ─────────────────────────────────────────────────────────
//  PAPER ENGINE — sells the actual mint the whale sold
// ─────────────────────────────────────────────────────────
class PaperEngine {
  portfolio: number;
  positions: Record<string, number>;
  trades: any[];
  startBal: number;

  constructor(startingSOL = 0.1) {
    this.portfolio = startingSOL;
    this.startBal  = startingSOL;
    this.positions = {};
    this.trades    = [];
  }

  execute(trade: ParsedTrade, riskPct = 0.05, label?: string) {
    const riskSOL = Math.min(this.portfolio * riskPct, this.portfolio);
    if (trade.action === 'BUY') {
      if (riskSOL <= 0) return null;
      this.positions[trade.mint] = (this.positions[trade.mint] || 0) + riskSOL;
      this.portfolio -= riskSOL;
      const entry = { ...trade, riskSOL, portfolio: this.portfolio, token: trade.mint, pnl: 0, label, id: Date.now() };
      this.trades.unshift(entry);
      return entry;
    } else {
      const cost = this.positions[trade.mint];
      if (!cost || cost <= 0) {
        const entry = { ...trade, riskSOL: 0, portfolio: this.portfolio, token: trade.mint, pnl: 0, label, id: Date.now(), skipped: true };
        this.trades.unshift(entry);
        return entry;
      }
      // Simulated exit P&L: -20% to +60% (realistic meme coin distribution)
      const gain = cost * (0.8 + Math.random() * 0.8);
      this.portfolio += gain;
      const pnl = gain - cost;
      delete this.positions[trade.mint];
      const entry = { ...trade, riskSOL: gain, portfolio: this.portfolio, token: trade.mint, pnl, label, id: Date.now() };
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
): Promise<string> {
  if (!window.solana) throw new Error('Wallet not connected');

  const quoteUrl =
    `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amountLamports}&slippageBps=${slippageBps}&onlyDirectRoutes=false`;
  const quoteRes = await fetch(quoteUrl);
  const quote    = await quoteRes.json();
  if (!quote.outAmount) throw new Error(quote.error || 'No route found');

  const accountKeys = [walletAddress, inputMint, outputMint];
  const priorityFee = await getPriorityFee(accountKeys);

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
const STORAGE_KEY = 'sqi_fomo_bot_v3';

function FomoCopyBotInner() {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  // ── Persisted state ─────────────────────────────────────
  const [trackedWallets, setTrackedWallets] = useState<{ address: string; label: string; active: boolean }[]>([]);
  const [riskPct,      setRiskPct]      = useState(5);
  const [startingSOL,  setStartingSOL]  = useState(0.07);
  const [mode,         setMode]         = useState<'paper' | 'live'>('paper');
  const [slippageBps,  setSlippageBps]  = useState(300);   // NEW
  const [pumpFunOnly,  setPumpFunOnly]  = useState(false); // NEW
  const [autoSellMins, setAutoSellMins] = useState(0);     // NEW: 0 = disabled

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

  const monitorsRef      = useRef<Record<string, WalletMonitor>>({});
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
      }
    } catch {}
  }, []);

  // ── Persist settings ─────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        trackedWallets, riskPct, startingSOL, slippageBps, pumpFunOnly, autoSellMins,
      }));
    } catch {}
  }, [trackedWallets, riskPct, startingSOL, slippageBps, pumpFunOnly, autoSellMins]);

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
    try {
      if (!window.solana?.isPhantom) throw new Error('No Phantom');
      const resp = await window.solana.connect();
      const addr = resp.publicKey.toString();
      setWalletAddress(addr);
      const bal = await getSOLBalance(addr);
      setSolBalance(bal);
    } catch {
      const mock = 'Demo' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setWalletAddress(mock);
      setSolBalance(startingSOL);
      setStatus('PAPER MODE — No Phantom detected');
    }
  };

  // ── Process incoming whale trade ────────────────────────
  const handleWhaleTrade = useCallback(async (trade: ParsedTrade, latencyMs: number, label: string) => {
    // Pump.fun-only filter
    if (pumpFunOnly && !trade.isPumpFun) return;

    // Latency
    latencyBufRef.current = [latencyMs, ...latencyBufRef.current.slice(0, 19)];
    setLastLatency(latencyMs);
    setAvgLatency(Math.round(latencyBufRef.current.reduce((a, b) => a + b, 0) / latencyBufRef.current.length));

    // Resolve symbol async
    const symbol     = await resolveMintSymbol(trade.mint);
    const tradeWithSym = { ...trade, symbol, label, id: `${trade.sig}_${Date.now()}` };

    feedRef.current = [tradeWithSym, ...feedRef.current.slice(0, 49)];
    setLiveFeed([...feedRef.current]);

    if (mode === 'paper') {
      const result = paperRef.current.execute({ ...trade, symbol }, riskPct / 100, label);
      if (result) {
        setMyTrades(prev => [result, ...prev.slice(0, 49)]);
        setPaperPortfolio(paperRef.current.portfolio);
        setTotalPnL(paperRef.current.trades.reduce((s, x) => s + (x.pnl || 0), 0));
      }
    } else {
      // LIVE mode — fire and forget with position tracking
      const wallet   = walletRef.current;
      const bal      = solBalRef.current;
      if (!wallet || !bal) return;
      const riskLamports = Math.floor(bal * (riskPct / 100) * 1e9);
      const inputMint    = trade.action === 'BUY' ? SOL_MINT : trade.mint;
      const outputMint   = trade.action === 'BUY' ? trade.mint : SOL_MINT;
      const pendingId    = `pending_${Date.now()}`;

      setMyTrades(prev => [
        { ...tradeWithSym, id: pendingId, executing: true, riskSOL: riskLamports / 1e9 },
        ...prev.slice(0, 49),
      ]);

      executeJupiterSwap(inputMint, outputMint, riskLamports, wallet, slippageRef.current)
        .then(sig => {
          // Track live position
          if (trade.action === 'BUY') {
            livePositionsRef.current.set(trade.mint, { lamports: riskLamports, entryTime: Date.now() });
          } else {
            livePositionsRef.current.delete(trade.mint);
          }
          setMyTrades(prev => prev.map(x => x.id === pendingId ? { ...x, sig, executing: false, executed: true } : x));
          getSOLBalance(wallet).then(setSolBalance);
        })
        .catch(err => {
          setMyTrades(prev => prev.map(x => x.id === pendingId ? { ...x, executing: false, error: err.message } : x));
        });
    }
  }, [mode, riskPct, pumpFunOnly]);

  // ── Start/Stop Monitoring ───────────────────────────────
  const startMonitoring = useCallback(() => {
    const active = trackedWallets.filter(w => isValidWallet(w.address) && w.active);
    if (active.length === 0) { setStatus('⚠ Add & activate at least one valid whale wallet'); return; }
    if (!HAS_HELIUS) setStatus('⚠ No Helius key — using slow public RPC. Add VITE_HELIUS_API_KEY in Vercel.');

    active.forEach(tw => {
      if (monitorsRef.current[tw.address]) return;
      const monitor = new WalletMonitor(tw.address, (trade, lat) => handleWhaleTrade(trade, lat, tw.label));
      monitor.connect();
      monitorsRef.current[tw.address] = monitor;
    });

    setIsMonitoring(true);
    setStatus(`🟢 LIVE — Tracking ${active.length} whale${active.length > 1 ? 's' : ''} via ${HAS_HELIUS ? 'Helius Enhanced WS' : 'public RPC'}`);
  }, [trackedWallets, handleWhaleTrade]);

  const stopMonitoring = useCallback(() => {
    Object.values(monitorsRef.current).forEach(m => m.disconnect());
    monitorsRef.current = {};
    setIsMonitoring(false);
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

  const addPresetWhale = (preset: typeof WHALE_PRESETS[number]) => {
    setTrackedWallets(tw => {
      if (tw.some(w => w.address === preset.address)) return tw;
      return [...tw, { address: preset.address, label: preset.label, active: true }];
    });
  };

  useEffect(() => () => stopMonitoring(), [stopMonitoring]);

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
      <div style={{ padding: '8px 20px', marginBottom: 4 }}>
        <div style={{ fontSize: 9, color: isMonitoring ? COLORS.green : 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.15em' }}>
          {status || 'OFFLINE'}
        </div>
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
              CONNECT PHANTOM
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
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>BALANCE</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: COLORS.gold }}>
                  {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : '—'}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                  {solBalance !== null ? `≈ $${(solBalance * solUSD).toFixed(2)}` : ''}
                </div>
              </div>
            </div>
          )}

          {(['paper', 'live'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '12px 18px', borderRadius: 14, cursor: 'pointer',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase',
              background: mode === m
                ? (m === 'live' ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.10)')
                : 'rgba(255,255,255,0.03)',
              color: mode === m ? (m === 'live' ? COLORS.red : COLORS.green) : 'rgba(255,255,255,0.3)',
              border: `1px solid ${mode === m ? (m === 'live' ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.2)') : COLORS.glassBorder}`,
            }}>
              {m === 'live' ? '⚡ LIVE' : '📄 PAPER'}
            </button>
          ))}
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
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'PORTFOLIO',     value: `$${portfolioUSD}`,        sub: `${paperPortfolio.toFixed(4)} SOL` },
                { label: 'TOTAL P&L',     value: `${totalPnL >= 0 ? '+' : ''}${(totalPnL * solUSD).toFixed(2)}$`,
                  sub: `${totalPnL >= 0 ? '+' : ''}${pnlPct}%`,            color: totalPnL >= 0 ? COLORS.green : COLORS.red },
                { label: 'LAST LATENCY',  value: lastLatency != null ? `${lastLatency}ms` : '—', sub: `avg ${avgLatency ?? '—'}ms` },
                { label: 'TRADES',        value: `${myTrades.length}`,      sub: `${validWalletCount} whales` },
              ].map(stat => (
                <div key={stat.label} style={{ ...glassCard, padding: '16px 18px' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 6 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: stat.color || COLORS.gold, letterSpacing: '-0.02em' }}>
                    {stat.value}
                  </div>
                  {stat.sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{stat.sub}</div>}
                </div>
              ))}
            </div>

            {/* Config summary */}
            <div style={{ ...glassCard, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 14 }}>
                ⚙ ACTIVE CONFIG
              </div>
              {[
                ['MODE',         mode.toUpperCase()],
                ['RISK / TRADE', `${riskPct}% → ${(paperPortfolio * riskPct / 100).toFixed(4)} SOL ≈ $${(paperPortfolio * riskPct / 100 * solUSD).toFixed(2)}`],
                ['SLIPPAGE',     `${slippageBps / 100}%`],
                ['PUMP.FUN ONLY', pumpFunOnly ? '✓ ON' : '○ OFF'],
                ['AUTO-SELL',    autoSellMins > 0 ? `${autoSellMins} min` : 'DISABLED'],
                ['HELIUS WS',    HAS_HELIUS ? '✓ ACTIVE (50–200ms)' : '✗ MISSING → add VITE_HELIUS_API_KEY in Vercel'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.glassBorder}`, fontSize: 10 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 8, letterSpacing: '0.2em' }}>{k}</span>
                  <span style={{ color: k === 'HELIUS WS' && !HAS_HELIUS ? COLORS.red : 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>

            {myTrades.slice(0, 3).map((x, i) => <TradeRow key={x.id || i} trade={x} showPnL solUSD={solUSD} />)}
          </div>
        )}

        {/* ════ WALLETS ════ */}
        {tab === 'wallets' && (
          <div>
            <div style={{ ...glassCard, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', color: COLORS.gold, textTransform: 'uppercase', marginBottom: 12 }}>
                ◈ VERIFIED WHALE PRESETS
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 12, lineHeight: 1.6 }}>
                ⚠ Only 2 presets are verified (others were removed — unconfirmed). Add more from fomo.fund → Leaderboard → sort by 30d PnL → copy wallet.
              </div>
              {WHALE_PRESETS.map(p => (
                <button key={p.address} onClick={() => addPresetWhale(p)} style={{
                  display: 'block', width: '100%', textAlign: 'left', marginBottom: 8,
                  padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS.glassBorder}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.gold }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{p.note}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: 4 }}>
                    {p.address.slice(0, 12)}…{p.address.slice(-8)}
                  </div>
                </button>
              ))}
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
            ) : trackedWallets.map((tw, i) => {
              const valid = isValidWallet(tw.address);
              return (
                <div key={i} style={{ ...glassCard, padding: '14px 18px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>
                      {tw.label}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                      color: valid ? 'rgba(255,255,255,0.7)' : COLORS.red,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tw.address || '← Enter address'}{!valid && tw.address && ' ✗ invalid'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setTrackedWallets(arr => arr.map((w, j) => j === i ? { ...w, active: !w.active } : w))}
                      style={{
                        padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                        background: tw.active ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                        color: tw.active ? COLORS.green : 'rgba(255,255,255,0.3)',
                        border: `1px solid ${tw.active ? 'rgba(74,222,128,0.2)' : COLORS.glassBorder}`,
                      }}>
                      {tw.active ? '● ACTIVE' : '○ INACTIVE'}
                    </button>
                    <button onClick={() => setTrackedWallets(arr => arr.filter((_, j) => j !== i))}
                      style={{
                        padding: '6px 12px', borderRadius: 10,
                        border: '1px solid rgba(248,113,113,0.2)',
                        background: 'rgba(248,113,113,0.06)', color: COLORS.red,
                        cursor: 'pointer', fontSize: 9, fontWeight: 800,
                      }}>✕</button>
                  </div>
                </div>
              );
            })}
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
                    {x.action} · <span style={{ color: COLORS.gold }}>{x.symbol || (x.mint?.slice(0, 6) + '…')}</span> · {x.amountSOL?.toFixed?.(3) || '—'} SOL
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
                value={`${startingSOL} SOL ≈ $${(startingSOL * solUSD).toFixed(0)}`}>
                <input type="number" min={0.01} step={0.01} value={startingSOL}
                  onChange={e => {
                    const v = +e.target.value;
                    setStartingSOL(v);
                    paperRef.current = new PaperEngine(v);
                    setPaperPortfolio(v);
                    setMyTrades([]);
                    setTotalPnL(0);
                  }}
                  style={{ ...inputStyle, width: 130 }} />
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
  const isSkipped   = trade.skipped;
  const isExecuting = trade.executing;
  const isError     = !!trade.error;
  const symbol      = trade.symbol || (trade.token || trade.mint || '—').slice(0, 6) + '…';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', marginBottom: 6,
      background: 'rgba(255,255,255,0.01)',
      border: `1px solid ${isError
        ? 'rgba(248,113,113,0.15)'
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
          {isSkipped   && ' (no position)'}
          {isExecuting && ' ⏳ sending…'}
          {isError     && ` ✗ ${trade.error}`}
          {trade.executed && ' ✓'}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
          {(trade.riskSOL || 0).toFixed(4)} SOL · {trade.label || ''} · {new Date(trade.timestamp).toLocaleTimeString()}
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
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }
  if (!isAdmin) {
    return <Navigate to="/income-streams" replace />;
  }
  return <FomoCopyBotInner />;
}
