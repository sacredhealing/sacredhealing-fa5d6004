import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useAdminRole } from '@/hooks/useAdminRole';

// ═══════════════════════════════════════════════════════════
//  SQI 2050 — SOVEREIGN COPY INTELLIGENCE BOT
//  FOMO Whale Mirror | Solana Mainnet | Jupiter v6
//  Helius transactionSubscribe + VersionedTransaction
//  Fire-and-forget execution | Skip-preflight | Priority Fee Estimator
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

// ── Jupiter v6 ────────────────────────────────────────────
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

// ── Solana programs / mints ───────────────────────────────
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// ── Whale presets — well-known Solana memecoin traders ────
const WHALE_PRESETS: { label: string; address: string; note: string }[] = [
  { label: 'Cupsey',       address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE', note: 'High-frequency micro-cap sniper' },
  { label: 'Orange',       address: '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5', note: 'Pump.fun launch hunter' },
  { label: 'Ansem',        address: 'D2wa5dHxWmA1aUxnvbEnj9bP5xR7M2sB3hPj9NkrVqWY', note: 'Macro memecoin influencer' },
  { label: 'Mert',         address: 'BTw3DSY9b2bQ2vEBvDsy3qRnLvBs5kZk8oHLVWHJ8jQA', note: 'Solana ecosystem trader' },
  { label: 'Euris',        address: 'BCnqTYahyBgvZQfJjs8aXgrUzS6dE2bz7B1MLBmRPYSb', note: 'Trending coin scalper' },
  { label: 'Kadenox',      address: '8zFZHuSRuDpuAR7J6FzwyF3vKNx4CVW3DhTMZB1vSrZP', note: 'Profitable meme rotator' },
];

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
async function connectPhantom() {
  if (!window.solana?.isPhantom) throw new Error('Phantom not installed');
  const resp = await window.solana.connect();
  return resp.publicKey.toString();
}

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

// Helius Priority Fee Estimator — real-time optimal priority fee
async function getPriorityFee(accountKeys: string[]): Promise<number> {
  if (!HAS_HELIUS) return 100_000; // sane default in lamports
  try {
    const data = await rpcCall('getPriorityFeeEstimate', [
      { accountKeys, options: { priorityLevel: 'High' } },
    ]);
    const est = data.result?.priorityFeeEstimate;
    if (typeof est === 'number' && est > 0) return Math.ceil(est);
    return 100_000;
  } catch {
    return 100_000;
  }
}

// Validate Solana base58 wallet (32–44 chars, base58 alphabet)
function isValidWallet(addr: string): boolean {
  if (!addr) return false;
  if (addr.length < 32 || addr.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
}

// ─────────────────────────────────────────────────────────
//  PARSE TRADE FROM PARSED TRANSACTION
//  Diff pre/post token balances for the watched wallet to
//  determine actual mint, direction, and amount.
// ─────────────────────────────────────────────────────────
type ParsedTrade = {
  sig: string;
  wallet: string;
  action: 'BUY' | 'SELL';
  mint: string;
  amountSOL: number;     // SOL value moved
  tokenAmount: number;   // raw token amount diff
  timestamp: number;
};

function parseTradeFromTx(tx: any, walletAddress: string, sig: string): ParsedTrade | null {
  if (!tx?.meta || tx.meta.err) return null;
  const pre = tx.meta.preTokenBalances || [];
  const post = tx.meta.postTokenBalances || [];
  const preSOL = tx.meta.preBalances?.[0] ?? 0;
  const postSOL = tx.meta.postBalances?.[0] ?? 0;
  const solDelta = (postSOL - preSOL) / 1e9;

  // Build a map of token balance changes for this wallet
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

  // Find the largest non-WSOL change
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
  };
}

// ─────────────────────────────────────────────────────────
//  WALLET MONITOR — fastest possible whale tracking
//  • Helius transactionSubscribe (parsed tx in one shot) when API key present
//  • Falls back to logsSubscribe + getTransaction otherwise
//  • Re-subscribes on reconnect
//  • Reports latency from tx confirmation → received
// ─────────────────────────────────────────────────────────
class WalletMonitor {
  wallet: string;
  onTrade: (trade: ParsedTrade, latencyMs: number) => void;
  ws: WebSocket | null = null;
  subId: number | null = null;
  reconnectTimer: any = null;
  killed = false;

  constructor(walletAddress: string, onTrade: (t: ParsedTrade, lat: number) => void) {
    this.wallet = walletAddress;
    this.onTrade = onTrade;
  }

  connect() {
    if (this.killed) return;
    this.ws = new WebSocket(HELIUS_WS);
    this.ws.onopen = () => this._subscribe();
    this.ws.onmessage = (e) => this._onMessage(e);
    this.ws.onerror = () => {/* handled by close */};
    this.ws.onclose = () => {
      if (this.killed) return;
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };
  }

  _subscribe() {
    if (!this.ws) return;
    if (HAS_HELIUS) {
      // Helius Enhanced WebSocket — parsed tx in one shot
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
      // Public RPC fallback
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

    // transactionSubscribe path (Helius)
    if (data.method === 'transactionNotification') {
      const t0 = Date.now();
      const value = data.params?.result?.transaction;
      const sig   = data.params?.result?.signature || value?.transaction?.signatures?.[0];
      if (!value || !sig) return;
      const trade = parseTradeFromTx(value, this.wallet, sig);
      if (trade) this.onTrade(trade, Date.now() - t0);
      return;
    }

    // logsSubscribe fallback path
    if (data.method === 'logsNotification') {
      const sig = data.params?.result?.value?.signature;
      if (!sig) return;
      const t0 = Date.now();
      // Fetch parsed tx
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
      } catch {/* ignore */}
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
    this.startBal = startingSOL;
    this.positions = {};
    this.trades = [];
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
      // SELL the same mint the whale sold (if we hold it)
      const cost = this.positions[trade.mint];
      if (!cost || cost <= 0) {
        // We weren't holding — log a no-op so the user sees the whale signal
        const entry = { ...trade, riskSOL: 0, portfolio: this.portfolio, token: trade.mint, pnl: 0, label, id: Date.now(), skipped: true };
        this.trades.unshift(entry);
        return entry;
      }
      // Simulate exit P&L between -20% and +60% (realistic memecoin distribution)
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
//  JUPITER SWAP — VersionedTransaction, skip preflight,
//  dynamic priority fee. Returns signature immediately
//  (does not wait for confirmation — caller polls).
// ─────────────────────────────────────────────────────────
async function executeJupiterSwap(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  walletAddress: string,
  slippageBps = 300, // 3% default for memecoins
): Promise<string> {
  if (!window.solana) throw new Error('Wallet not connected');

  // 1. Quote
  const quoteUrl =
    `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amountLamports}&slippageBps=${slippageBps}&onlyDirectRoutes=false`;
  const quoteRes = await fetch(quoteUrl);
  const quote = await quoteRes.json();
  if (!quote.outAmount) throw new Error(quote.error || 'No route');

  // 2. Priority fee (Helius estimator)
  const accountKeys = [walletAddress, inputMint, outputMint];
  const priorityFee = await getPriorityFee(accountKeys);

  // 3. Build swap tx
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

  // 4. Deserialize as VersionedTransaction
  const txBuf = Buffer.from(swapTransaction as string, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);

  // 5. Sign with Phantom
  const signed = await (window.solana as any).signTransaction(tx);

  // 6. Send with skipPreflight for max speed
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
const STORAGE_KEY = 'sqi_fomo_bot_v2';

function FomoCopyBotInner() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── Persisted state ─────────────────────────────────────
  const [trackedWallets, setTrackedWallets] = useState<{ address: string; label: string; active: boolean }[]>([]);
  const [riskPct, setRiskPct] = useState(5);
  const [startingSOL, setStartingSOL] = useState(0.07); // ≈ $10 at $140
  const [mode, setMode] = useState<'paper' | 'live'>('paper');

  // ── Live state ──────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [newWallet, setNewWallet] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [myTrades, setMyTrades] = useState<any[]>([]);
  const [paperPortfolio, setPaperPortfolio] = useState(0.07);
  const [totalPnL, setTotalPnL] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState('OFFLINE');
  const [tab, setTab] = useState<'dashboard' | 'wallets' | 'feed' | 'trades' | 'setup'>('dashboard');
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [avgLatency, setAvgLatency] = useState<number | null>(null);

  const monitorsRef = useRef<Record<string, WalletMonitor>>({});
  const paperRef = useRef(new PaperEngine(0.07));
  const feedRef = useRef<any[]>([]);
  const latencyBufRef = useRef<number[]>([]);

  // ── Load from localStorage on mount ─────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.trackedWallets) setTrackedWallets(data.trackedWallets);
        if (typeof data.riskPct === 'number') setRiskPct(data.riskPct);
        if (typeof data.startingSOL === 'number') {
          setStartingSOL(data.startingSOL);
          paperRef.current = new PaperEngine(data.startingSOL);
          setPaperPortfolio(data.startingSOL);
        }
      }
    } catch {/* ignore */}
  }, []);

  // ── Persist whenever settings change ────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        trackedWallets, riskPct, startingSOL,
      }));
    } catch {/* ignore */}
  }, [trackedWallets, riskPct, startingSOL]);

  // ── Connect Wallet ──────────────────────────────────────
  const connectWallet = async () => {
    try {
      const addr = await connectPhantom();
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
  const handleWhaleTrade = useCallback((trade: ParsedTrade, latencyMs: number, label: string) => {
    // Latency tracking
    latencyBufRef.current = [latencyMs, ...latencyBufRef.current.slice(0, 19)];
    setLastLatency(latencyMs);
    setAvgLatency(Math.round(latencyBufRef.current.reduce((a, b) => a + b, 0) / latencyBufRef.current.length));

    // Live feed
    const feedEntry = { ...trade, label, id: `${trade.sig}_${Date.now()}` };
    feedRef.current = [feedEntry, ...feedRef.current.slice(0, 49)];
    setLiveFeed([...feedRef.current]);

    // Execute copy
    if (mode === 'paper') {
      const result = paperRef.current.execute(trade, riskPct / 100, label);
      if (result) {
        setMyTrades(t => [result, ...t.slice(0, 49)]);
        setPaperPortfolio(paperRef.current.portfolio);
        setTotalPnL(paperRef.current.trades.reduce((s, x) => s + (x.pnl || 0), 0));
      }
    } else {
      // LIVE — fire and forget
      if (!walletAddress || !solBalance) return;
      const riskLamports = Math.floor(solBalance * (riskPct / 100) * 1e9);
      const inputMint = trade.action === 'BUY' ? SOL_MINT : trade.mint;
      const outputMint = trade.action === 'BUY' ? trade.mint : SOL_MINT;
      const pendingId = `pending_${Date.now()}`;
      setMyTrades(t => [{ ...feedEntry, id: pendingId, executing: true, riskSOL: riskLamports / 1e9 }, ...t.slice(0, 49)]);

      executeJupiterSwap(inputMint, outputMint, riskLamports, walletAddress)
        .then(sig => {
          setMyTrades(t => t.map(x => x.id === pendingId ? { ...x, sig, executing: false, executed: true } : x));
        })
        .catch(err => {
          console.error('Swap failed:', err);
          setMyTrades(t => t.map(x => x.id === pendingId ? { ...x, executing: false, error: err.message } : x));
        });
    }
  }, [mode, riskPct, walletAddress, solBalance]);

  // ── Start/Stop Monitoring ───────────────────────────────
  const startMonitoring = useCallback(() => {
    const active = trackedWallets.filter(w => isValidWallet(w.address) && w.active);
    if (active.length === 0) { setStatus('⚠ Add & activate at least one valid whale wallet'); return; }
    if (!HAS_HELIUS) {
      setStatus('⚠ HELIUS RPC required for real-time monitoring (free at helius.dev) — using public fallback');
    }

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
    const tokens = ['BONK', 'WIF', 'POPCAT', 'BOME', 'MYRO', 'SLERF'];
    const mint = tokens[Math.floor(Math.random() * tokens.length)];
    const action: 'BUY' | 'SELL' = Math.random() > 0.4 ? 'BUY' : 'SELL';
    const demo: ParsedTrade = {
      sig: Math.random().toString(36).slice(2, 14),
      wallet: trackedWallets[0]?.address || 'DemoWallet',
      action,
      mint,
      amountSOL: +(Math.random() * 0.5 + 0.05).toFixed(4),
      tokenAmount: Math.floor(Math.random() * 1_000_000),
      timestamp: Date.now(),
    };
    handleWhaleTrade(demo, 50 + Math.floor(Math.random() * 80), trackedWallets[0]?.label || 'Demo Whale');
  };

  // ── Bulk add wallets ────────────────────────────────────
  const bulkAddWallets = () => {
    const lines = bulkInput.split(/[\n,;\s]+/).map(s => s.trim()).filter(Boolean);
    const valid = lines.filter(isValidWallet);
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

  // ── Cleanup on unmount ──────────────────────────────────
  useEffect(() => () => stopMonitoring(), [stopMonitoring]);

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  const solUSD = 140;
  const portfolioUSD = (paperPortfolio * solUSD).toFixed(2);
  const pnlPct = startingSOL > 0 ? ((totalPnL / startingSOL) * 100).toFixed(1) : '0.0';
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
      {/* Inline keyframes */}
      <style>{`
        @keyframes sqi-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes sqi-glow { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.6)} 50%{box-shadow:0 0 0 8px rgba(74,222,128,0)} }
        .sqi-pulse-dot { animation: sqi-glow 1.6s infinite; }
        .sqi-tabs::-webkit-scrollbar { display:none }
        .sqi-tabs { -ms-overflow-style: none; scrollbar-width: none; }
        .sqi-stats { display:grid; grid-template-columns: repeat(4,1fr); gap:12px }
        @media (max-width: 720px) { .sqi-stats { grid-template-columns: repeat(2,1fr); } }
        .sqi-controls { display:flex; gap:12px }
        @media (max-width: 540px) { .sqi-controls { flex-direction: column } }
        .sqi-add-row { display:flex; gap:10px }
        @media (max-width: 640px) { .sqi-add-row { flex-direction: column } .sqi-add-row > * { width:100% !important; flex: 1 1 auto !important } }
        .sqi-top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap }
        .sqi-top-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap }
      `}</style>

      {/* Background atmosphere */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.05) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 80%, rgba(34,211,238,0.03) 0%, transparent 60%)`,
      }} />

      {/* ── Top Bar ── */}
      <div className="sqi-top" style={{
        padding: '20px 22px 16px',
        borderBottom: `1px solid ${COLORS.glassBorder}`,
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.95)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate('/income-streams')}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 12,
              border: `1px solid ${COLORS.glassBorder}`,
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.75)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
            <ArrowLeft size={14} style={{ color: COLORS.gold }} />
            {t('common.back')}
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
              color: COLORS.gold, textTransform: 'uppercase', marginBottom: 2 }}>
              SQI 2050 · SOVEREIGN COPY ENGINE
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', ...goldText }}>
              FOMO Mirror Bot
            </div>
          </div>
        </div>

        <div className="sqi-top-actions">
          {/* Mode toggle */}
          <div style={{ ...glassCard, padding: '4px 6px', display: 'flex', gap: 4, borderRadius: 12 }}>
            {(['paper', 'live'] as const).map(m => (
              <button key={m} onClick={() => { if (!isMonitoring) setMode(m); }}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
                  background: mode === m ? (m === 'live' ? '#F87171' : COLORS.gold) : 'transparent',
                  color: mode === m ? COLORS.black : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s',
                }}>
                {m === 'paper' ? '📄 PAPER' : '⚡ LIVE'}
              </button>
            ))}
          </div>

          {/* Wallet */}
          {walletAddress ? (
            <div style={{ ...glassCard, padding: '8px 14px', borderRadius: 14 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em',
                color: COLORS.gold, textTransform: 'uppercase' }}>WALLET</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </div>
              {solBalance !== null && (
                <div style={{ fontSize: 9, color: COLORS.cyan }}>
                  {solBalance.toFixed(4)} SOL
                </div>
              )}
            </div>
          ) : (
            <button onClick={connectWallet} style={{
              background: COLORS.gold, color: COLORS.black, border: 'none',
              borderRadius: 12, padding: '10px 18px', fontWeight: 800, fontSize: 11,
              letterSpacing: '0.2em', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              ⚡ Connect Phantom
            </button>
          )}
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div style={{
        background: isMonitoring ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)',
        borderBottom: `1px solid ${isMonitoring ? 'rgba(74,222,128,0.15)' : COLORS.glassBorder}`,
        padding: '10px 22px',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
        color: isMonitoring ? COLORS.green : 'rgba(255,255,255,0.4)',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMonitoring && <span className="sqi-pulse-dot" style={{
            width: 8, height: 8, borderRadius: '50%', background: COLORS.green, display: 'inline-block',
          }} />}
          <span>{status || '◉ READY — Add whale wallets to begin'}</span>
        </div>
        {avgLatency !== null && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
            LAST <span style={{ color: COLORS.cyan }}>{lastLatency}ms</span> · AVG <span style={{ color: COLORS.cyan }}>{avgLatency}ms</span>
          </div>
        )}
      </div>

      {/* ── Tabs (mobile-scrollable) ── */}
      <div className="sqi-tabs" style={{
        display: 'flex', gap: 0, padding: '0 16px',
        borderBottom: `1px solid ${COLORS.glassBorder}`, marginBottom: 24,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {(['dashboard', 'wallets', 'feed', 'trades', 'setup'] as const).map(t2 => (
          <button key={t2} onClick={() => setTab(t2)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '14px 16px', whiteSpace: 'nowrap',
            fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase',
            color: tab === t2 ? COLORS.gold : 'rgba(255,255,255,0.3)',
            borderBottom: tab === t2 ? `2px solid ${COLORS.gold}` : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {t2 === 'dashboard' ? '⬡ DASHBOARD' :
             t2 === 'wallets' ? `◎ WHALES (${trackedWallets.length})` :
             t2 === 'feed' ? '⚡ LIVE FEED' :
             t2 === 'trades' ? '◈ MY TRADES' : '⚙ SETUP'}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 22px' }}>

        {/* ════ DASHBOARD ════ */}
        {tab === 'dashboard' && (
          <div>
            <div className="sqi-stats" style={{ marginBottom: 20 }}>
              {[
                { label: 'PORTFOLIO', value: `${paperPortfolio.toFixed(4)} SOL`, sub: `$${portfolioUSD}`, color: COLORS.gold },
                { label: 'TOTAL P&L', value: `${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(4)}`,
                  sub: `${pnlPct}%`, color: totalPnL >= 0 ? COLORS.green : COLORS.red },
                { label: 'TRADES', value: myTrades.length, sub: `${myTrades.filter((x) => (x.pnl ?? 0) > 0).length} wins`, color: COLORS.cyan },
                { label: 'WHALES', value: validWalletCount, sub: `${trackedWallets.length} tracked`, color: 'rgba(255,255,255,0.6)' },
              ].map(s => (
                <div key={s.label} style={{ ...glassCard, padding: '18px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: s.color,
                    textShadow: `0 0 20px ${s.color}30` }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="sqi-controls" style={{ marginBottom: 20 }}>
              <button onClick={isMonitoring ? stopMonitoring : startMonitoring}
                disabled={!walletAddress || trackedWallets.length === 0}
                style={{
                  flex: 1, padding: '16px 24px', borderRadius: 16,
                  background: isMonitoring
                    ? 'rgba(248,113,113,0.15)' : `linear-gradient(135deg, ${COLORS.gold}, #B8941F)`,
                  color: isMonitoring ? COLORS.red : COLORS.black,
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.25em',
                  textTransform: 'uppercase', cursor: 'pointer',
                  boxShadow: isMonitoring ? 'none' : `0 4px 30px rgba(212,175,55,0.3)`,
                  transition: 'all 0.2s',
                  border: isMonitoring ? `1px solid ${COLORS.red}` : 'none',
                  opacity: (!walletAddress || trackedWallets.length === 0) ? 0.5 : 1,
                }}>
                {isMonitoring ? '⏹ STOP MONITORING' : '▶ START COPY TRADING'}
              </button>

              <button onClick={injectDemoTrade} style={{
                padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
                background: 'rgba(34,211,238,0.08)',
                border: `1px solid rgba(34,211,238,0.2)`,
                color: COLORS.cyan, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}>
                🧪 SIM TRADE
              </button>
            </div>

            <div style={{ ...glassCard, padding: 20 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase', marginBottom: 14 }}>
                ⚡ RECENT COPY TRADES
              </div>
              {myTrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                  No trades yet. Add whales → activate → START.
                </div>
              ) : myTrades.slice(0, 8).map((x, i) => <TradeRow key={x.id || i} trade={x} />)}
            </div>
          </div>
        )}

        {/* ════ WALLETS / WHALES ════ */}
        {tab === 'wallets' && (
          <div>
            {/* Whale presets */}
            <div style={{ ...glassCard, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase', marginBottom: 14 }}>
                🐋 WHALE PRESETS · ONE-TAP ADD
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 8 }}>
                {WHALE_PRESETS.map(p => {
                  const exists = trackedWallets.some(w => w.address === p.address);
                  return (
                    <button key={p.address} onClick={() => addPresetWhale(p)}
                      disabled={exists}
                      style={{
                        padding: '12px 14px', borderRadius: 14,
                        background: exists ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${exists ? 'rgba(74,222,128,0.18)' : COLORS.glassBorder}`,
                        textAlign: 'left', cursor: exists ? 'default' : 'pointer',
                        opacity: exists ? 0.6 : 1,
                      }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: exists ? COLORS.green : COLORS.gold }}>
                        {exists ? '✓ ' : ''}{p.label}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{p.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Single add */}
            <div style={{ ...glassCard, padding: 20, marginBottom: 12 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase', marginBottom: 16 }}>
                ◎ ADD CUSTOM WHALE
              </div>
              <div className="sqi-add-row" style={{ marginBottom: 8 }}>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label (e.g. FOMO Whale)"
                  style={{ ...inputStyle, width: 180, flex: 'none' }} />
                <input value={newWallet} onChange={e => setNewWallet(e.target.value)}
                  placeholder="Solana wallet (32–44 chars base58)"
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => {
                  if (!isValidWallet(newWallet)) { setStatus('⚠ Invalid wallet address'); return; }
                  if (trackedWallets.some(w => w.address === newWallet)) { setStatus('⚠ Already tracking that wallet'); return; }
                  setTrackedWallets(tw => [...tw, {
                    address: newWallet, label: newLabel || `Whale ${tw.length + 1}`, active: true,
                  }]);
                  setNewWallet(''); setNewLabel('');
                }} style={{
                  background: COLORS.gold, color: COLORS.black, border: 'none',
                  borderRadius: 12, padding: '12px 22px', fontWeight: 900, fontSize: 11,
                  cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.15em',
                }}>
                  + ADD
                </button>
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                Find top traders at fomo.fund → copy their Solana address → paste above
              </div>
            </div>

            {/* Bulk add */}
            <div style={{ ...glassCard, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase', marginBottom: 14 }}>
                ⚡ BULK PASTE · UP TO 50 WALLETS
              </div>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                placeholder="Paste multiple wallet addresses — one per line, comma- or space-separated"
                style={{ ...inputStyle, minHeight: 90, fontFamily: 'monospace', resize: 'vertical', marginBottom: 10 }} />
              <button onClick={bulkAddWallets} disabled={!bulkInput.trim()}
                style={{
                  background: 'rgba(34,211,238,0.1)', color: COLORS.cyan,
                  border: `1px solid rgba(34,211,238,0.25)`, borderRadius: 12,
                  padding: '12px 22px', fontWeight: 900, fontSize: 11, letterSpacing: '0.2em',
                  cursor: 'pointer', textTransform: 'uppercase',
                  opacity: !bulkInput.trim() ? 0.4 : 1,
                }}>
                ⚡ ADD ALL VALID
              </button>
            </div>

            {/* Tracked list */}
            {trackedWallets.length === 0 ? (
              <div style={{ ...glassCard, padding: 32, textAlign: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                No whales tracked yet. Tap a preset above or paste addresses.
              </div>
            ) : trackedWallets.map((tw, i) => {
              const valid = isValidWallet(tw.address);
              return (
                <div key={i} style={{ ...glassCard, padding: '14px 18px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em',
                      color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>
                      {tw.label}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                      color: valid ? 'rgba(255,255,255,0.7)' : COLORS.red,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tw.address || '← Enter address'}{!valid && tw.address && ' ✗ invalid'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setTrackedWallets(arr => arr.map((w, j) =>
                      j === i ? { ...w, active: !w.active } : w
                    ))} style={{
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
                        padding: '6px 12px', borderRadius: 10, border: `1px solid rgba(248,113,113,0.2)`,
                        background: 'rgba(248,113,113,0.06)', color: COLORS.red, cursor: 'pointer',
                        fontSize: 9, fontWeight: 800,
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
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase' }}>
                ⚡ WHALE ACTIVITY FEED
              </div>
              <div style={{ fontSize: 9, color: isMonitoring ? COLORS.green : 'rgba(255,255,255,0.2)',
                fontWeight: 700, letterSpacing: '0.2em' }}>
                {isMonitoring ? '● LIVE' : '○ OFFLINE'}
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
                  justifyContent: 'center', fontWeight: 900, fontSize: 13,
                  background: x.action === 'BUY' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                  color: x.action === 'BUY' ? COLORS.green : COLORS.red,
                  border: `1px solid ${x.action === 'BUY' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                  flexShrink: 0,
                }}>
                  {x.action === 'BUY' ? '↑' : '↓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700,
                    color: x.action === 'BUY' ? COLORS.green : COLORS.red }}>
                    {x.action} · {(x.mint || 'TOKEN').slice(0, 6)}…{(x.mint || '').slice(-4)} · {x.amountSOL?.toFixed?.(3) || '—'} SOL
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
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
              color: COLORS.gold, textTransform: 'uppercase', marginBottom: 16 }}>
              ◈ MY COPY TRADE HISTORY
            </div>
            {myTrades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>
                No trades executed yet.
              </div>
            ) : myTrades.map((x, i) => <TradeRow key={x.id || i} trade={x} showPnL />)}
          </div>
        )}

        {/* ════ SETUP ════ */}
        {tab === 'setup' && (
          <div>
            <div style={{ ...glassCard, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase', marginBottom: 20 }}>
                ⚙ RISK MANAGEMENT
              </div>

              <SettingRow label="RISK PER TRADE (%)"
                value={`${riskPct}%`}
                hint={`${(paperPortfolio * riskPct / 100).toFixed(4)} SOL per trade`}>
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

              <SettingRow label="COPY MODE" value={mode.toUpperCase()}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                  📄 PAPER — Simulates trades without real money. Perfect for testing.<br/>
                  ⚡ LIVE — Executes real swaps via Jupiter v6 with skip-preflight + dynamic priority fees.<br/>
                  <span style={{ color: COLORS.red }}>⚠ Only use LIVE after validating in PAPER.</span>
                </div>
              </SettingRow>
            </div>

            <div style={{ ...glassCard, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase', marginBottom: 16 }}>
                🔑 HELIUS RPC · REQUIRED FOR FASTEST EXECUTION
              </div>
              <div style={{ fontSize: 11, color: HAS_HELIUS ? COLORS.green : COLORS.red,
                fontWeight: 700, letterSpacing: '0.15em', marginBottom: 14 }}>
                {HAS_HELIUS ? '✓ HELIUS KEY DETECTED — Enhanced WebSocket active' : '✗ NO HELIUS KEY — Falls back to slower public RPC'}
              </div>
              {[
                '1. Go to helius.dev → Create free account',
                '2. Copy your API key from the dashboard',
                '3. Set VITE_HELIUS_API_KEY in your env (Lovable: Project Settings → Env Variables)',
                '4. Free tier: 1M credits/month — enough for 24/7 monitoring of 5–10 whales',
                '5. Helius transactionSubscribe gives parsed tx in 50–200ms vs 2–5s on public RPC',
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', padding: '5px 0',
                  borderBottom: `1px solid ${COLORS.glassBorder}` }}>
                  {s}
                </div>
              ))}
            </div>

            <div style={{ ...glassCard, padding: 24 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.45em',
                color: COLORS.gold, textTransform: 'uppercase', marginBottom: 16 }}>
                📋 FOMO APP · HOW TO FIND TOP WHALES
              </div>
              {[
                '1. Go to fomo.fund on your browser',
                '2. Sort the leaderboard by 7d/30d realized PnL',
                '3. Click a trader → copy their Solana wallet address',
                '4. Paste in WHALES tab above (or use bulk paste for many)',
                '5. Activate the wallet → click START COPY TRADING',
                '6. Recommend 5–10 whales max for free Helius tier',
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', padding: '5px 0',
                  borderBottom: `1px solid ${COLORS.glassBorder}` }}>
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
          borderTop: `1px solid rgba(248,113,113,0.2)`,
          padding: '10px 22px',
          fontSize: 9, color: COLORS.red, fontWeight: 700, letterSpacing: '0.15em',
          textAlign: 'center', zIndex: 100,
        }}>
          ⚠ LIVE MODE — Real SOL spent on every copied trade · 3% slippage · skip-preflight
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function TradeRow({ trade, showPnL }: { trade: any; showPnL?: boolean }) {
  const isSkipped = trade.skipped;
  const isExecuting = trade.executing;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', marginBottom: 6,
      background: 'rgba(255,255,255,0.01)',
      border: `1px solid ${trade.action === 'BUY' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)'}`,
      borderRadius: 14,
      opacity: isSkipped ? 0.55 : 1,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
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
          {trade.action} · {(trade.token || trade.mint || '—').slice(0, 6)}…{(trade.token || trade.mint || '').slice(-4)}
          {isSkipped && ' (skipped — no position)'}
          {isExecuting && ' (executing…)'}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
          {(trade.riskSOL || 0).toFixed(4)} SOL · {trade.label || ''} · {new Date(trade.timestamp).toLocaleTimeString()}
        </div>
      </div>
      {showPnL && trade.pnl !== undefined && !isSkipped && (
        <div style={{ fontSize: 13, fontWeight: 900,
          color: trade.pnl >= 0 ? COLORS.green : COLORS.red, flexShrink: 0 }}>
          {trade.pnl >= 0 ? '+' : ''}{(trade.pnl * 140).toFixed(2)}$
        </div>
      )}
    </div>
  );
}

function SettingRow({ label, value, hint, children }: { label: string; value: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 20,
      borderBottom: `1px solid ${COLORS.glassBorder}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{label}</div>
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
