import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useAdminRole } from '@/hooks/useAdminRole';

// ═══════════════════════════════════════════════════════════
//  SQI 2050 — SOVEREIGN COPY INTELLIGENCE BOT
//  FOMO App Wallet Mirror System | Solana Mainnet
//  Risk Engine: 5% per trade | Jupiter Swap Executor
// ═══════════════════════════════════════════════════════════

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signTransaction: (tx: Transaction) => Promise<Transaction>;
    };
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

const HELIUS_KEY = (import.meta.env.VITE_HELIUS_API_KEY || '').trim();
const HELIUS_RPC = HELIUS_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : 'https://api.mainnet-beta.solana.com';
const HELIUS_WS = HELIUS_KEY
  ? `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : 'wss://api.mainnet-beta.solana.com';

// ── Jupiter Swap API ──────────────────────────────────────
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

// Known Pump.fun & Raydium program IDs
const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const RAYDIUM_AMM = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// ── Solana helpers ─────────────────────────────────────────
async function connectPhantom() {
  if (!window.solana?.isPhantom) throw new Error('Phantom not installed');
  const resp = await window.solana.connect();
  return resp.publicKey.toString();
}

async function getSOLBalance(walletAddress: string, rpc: string = HELIUS_RPC) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "getBalance",
      params: [walletAddress],
    }),
  });
  const data = await res.json();
  return (data.result?.value || 0) / 1e9; // lamports → SOL
}

async function getTokenAccounts(walletAddress: string, rpc: string = HELIUS_RPC) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "getTokenAccountsByOwner",
      params: [walletAddress, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" }],
    }),
  });
  const data = await res.json();
  return data.result?.value || [];
}

async function executeJupiterSwap(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  walletAddress: string,
  slippage = 100
) {
  if (!window.solana) throw new Error('Wallet not connected');
  const quoteUrl = `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippage}`;
  const quoteRes = await fetch(quoteUrl);
  const quote = await quoteRes.json();
  if (!quote.outAmount) throw new Error('No quote returned');

  const swapRes = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: walletAddress,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
  const { swapTransaction } = await swapRes.json();

  const txBuf = Buffer.from(swapTransaction as string, 'base64');
  const tx = Transaction.from(txBuf);
  const signed = await window.solana.signTransaction(tx);

  const sendRes = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: [
        Buffer.from(signed.serialize()).toString('base64'),
        { encoding: 'base64', preflightCommitment: 'confirmed' },
      ],
    }),
  });
  const sendData = await sendRes.json();
  return sendData.result as string;
}

// ── WebSocket Monitor ─────────────────────────────────────
class WalletMonitor {
  constructor(walletAddress, onTrade) {
    this.wallet = walletAddress;
    this.onTrade = onTrade;
    this.ws = null;
    this.subId = null;
  }

  connect() {
    this.ws = new WebSocket(HELIUS_WS);
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "logsSubscribe",
        params: [{ mentions: [this.wallet] }, { commitment: "processed" }],
      }));
    };
    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.method === "logsNotification") {
        const logs = data.params?.result?.value?.logs || [];
        const sig  = data.params?.result?.value?.signature;
        this._parseLogs(logs, sig);
      }
    };
    this.ws.onerror = () => console.warn("WS error");
    this.ws.onclose = () => setTimeout(() => this.connect(), 3000); // auto-reconnect
  }

  _parseLogs(logs, sig) {
    const isPump   = logs.some(l => l.includes(PUMP_FUN_PROGRAM));
    const isRaydium= logs.some(l => l.includes(RAYDIUM_AMM));
    if (!isPump && !isRaydium) return;

    const isBuy  = logs.some(l => l.includes("buy") || l.includes("Buy"));
    const isSell = logs.some(l => l.includes("sell") || l.includes("Sell"));
    if (!isBuy && !isSell) return;

    this.onTrade({
      sig,
      wallet: this.wallet,
      action: isBuy ? "BUY" : "SELL",
      platform: isPump ? "Pump.fun" : "Raydium",
      timestamp: Date.now(),
    });
  }

  disconnect() {
    this.ws?.close();
  }
}

// ─────────────────────────────────────────────────────────
//  PAPER TRADE ENGINE
// ─────────────────────────────────────────────────────────
class PaperEngine {
  constructor(startingSOL = 0.1) {
    this.portfolio = startingSOL;
    this.positions = {};
    this.trades = [];
  }

  execute(trade, riskPct = 0.05) {
    const riskSOL = this.portfolio * riskPct;
    if (trade.action === "BUY") {
      const token = trade.mint || `TOKEN_${trade.sig?.slice(0, 6)}`;
      this.positions[token] = (this.positions[token] || 0) + riskSOL;
      this.portfolio -= riskSOL;
      const entry = { ...trade, riskSOL, portfolio: this.portfolio, token, pnl: 0 };
      this.trades.unshift(entry);
      return entry;
    } else {
      const tokens = Object.keys(this.positions);
      if (tokens.length === 0) return null;
      const token = tokens[0];
      const gain = this.positions[token] * (0.9 + Math.random() * 0.4); // sim P&L
      this.portfolio += gain;
      const pnl = gain - this.positions[token];
      delete this.positions[token];
      const entry = { ...trade, riskSOL: gain, portfolio: this.portfolio, token, pnl };
      this.trades.unshift(entry);
      return entry;
    }
  }
}

// ─────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const glassCard = {
  background: COLORS.glass,
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: `1px solid ${COLORS.glassBorder}`,
  borderRadius: 24,
};

const goldText = {
  color: COLORS.gold,
  textShadow: `0 0 20px ${COLORS.goldGlow}`,
};

function FomoCopyBotInner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // ── State ───────────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [trackedWallets, setTrackedWallets] = useState([
    { address: "", label: "FOMO Trader 1", active: false },
  ]);
  const [newWallet, setNewWallet] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [mode, setMode] = useState("paper"); // "paper" | "live"
  const [riskPct, setRiskPct] = useState(5);
  const [startingSOL, setStartingSOL] = useState(0.1); // ~$10
  const [liveFeed, setLiveFeed] = useState([]);
  const [myTrades, setMyTrades] = useState([]);
  const [paperPortfolio, setPaperPortfolio] = useState(0.1);
  const [totalPnL, setTotalPnL] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState("OFFLINE");
  const [tab, setTab] = useState("dashboard");

  const monitorsRef  = useRef({});
  const paperRef     = useRef(new PaperEngine(0.1));
  const feedRef      = useRef([]);

  // ── Connect Wallet ──────────────────────────────────────
  const connectWallet = async () => {
    try {
      const addr = await connectPhantom();
      setWalletAddress(addr);
      const bal = await getSOLBalance(addr);
      setSolBalance(bal);
      paperRef.current = new PaperEngine(bal > 0 ? bal : startingSOL);
      setPaperPortfolio(bal > 0 ? bal : startingSOL);
    } catch (e) {
      // Phantom not available (e.g., desktop browser without extension)
      // Use mock wallet for demo
      const mock = "Demo" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setWalletAddress(mock);
      setSolBalance(startingSOL);
      paperRef.current = new PaperEngine(startingSOL);
      setPaperPortfolio(startingSOL);
      setStatus("PAPER MODE — No Phantom detected");
    }
  };

  // ── Start/Stop Monitoring ───────────────────────────────
  const startMonitoring = useCallback(() => {
    const active = trackedWallets.filter(w => w.address.length > 30 && w.active);
    if (active.length === 0) { setStatus("⚠ Add & activate a wallet first"); return; }

    active.forEach(tw => {
      if (monitorsRef.current[tw.address]) return;
      const monitor = new WalletMonitor(tw.address, (trade) => {
        // Add to live feed
        const enriched = { ...trade, label: tw.label, id: Date.now() };
        feedRef.current = [enriched, ...feedRef.current.slice(0, 49)];
        setLiveFeed([...feedRef.current]);

        // Execute copy
        if (mode === "paper") {
          const result = paperRef.current.execute(enriched, riskPct / 100);
          if (result) {
            setMyTrades(t => [result, ...t.slice(0, 49)]);
            setPaperPortfolio(paperRef.current.portfolio);
            const newPnl = paperRef.current.trades.reduce((s, t2) => s + (t2.pnl || 0), 0);
            setTotalPnL(newPnl);
          }
        } else {
          // Live mode: execute real swap
          if (!walletAddress) return;
          const riskLamports = Math.floor(solBalance * (riskPct / 100) * 1e9);
          executeJupiterSwap(SOL_MINT, trade.mint || SOL_MINT, riskLamports, walletAddress)
            .then(sig => {
              setMyTrades(t => [{ ...enriched, sig, executed: true }, ...t.slice(0, 49)]);
            })
            .catch(err => console.error("Swap failed:", err));
        }
      });
      monitor.connect();
      monitorsRef.current[tw.address] = monitor;
    });

    setIsMonitoring(true);
    setStatus(`🟢 LIVE — ${active.length} wallet(s) tracked`);
  }, [trackedWallets, mode, riskPct, walletAddress, solBalance]);

  const stopMonitoring = useCallback(() => {
    Object.values(monitorsRef.current).forEach(m => m.disconnect());
    monitorsRef.current = {};
    setIsMonitoring(false);
    setStatus("⏹ STOPPED");
  }, []);

  // ── Demo: inject fake trades for UI testing ─────────────
  const injectDemoTrade = () => {
    const tokens = ["BONK", "WIF", "POPCAT", "BOME", "MYRO", "SLERF"];
    const tok = tokens[Math.floor(Math.random() * tokens.length)];
    const action = Math.random() > 0.5 ? "BUY" : "SELL";
    const demo = {
      id: Date.now(),
      sig: Math.random().toString(36).slice(2, 14),
      wallet: trackedWallets[0]?.address || "DemoWallet",
      label: trackedWallets[0]?.label || "FOMO Trader 1",
      action,
      platform: Math.random() > 0.5 ? "Pump.fun" : "Raydium",
      mint: tok,
      timestamp: Date.now(),
    };
    feedRef.current = [demo, ...feedRef.current.slice(0, 49)];
    setLiveFeed([...feedRef.current]);

    const result = paperRef.current.execute(demo, riskPct / 100);
    if (result) {
      setMyTrades(t => [result, ...t.slice(0, 49)]);
      setPaperPortfolio(paperRef.current.portfolio);
      setTotalPnL(paperRef.current.trades.reduce((s, t2) => s + (t2.pnl || 0), 0));
    }
  };

  // ── Cleanup ─────────────────────────────────────────────
  useEffect(() => () => stopMonitoring(), []);

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  const solUSD   = 140; // approx price
  const portfolioUSD = (paperPortfolio * solUSD).toFixed(2);
  const pnlUSD   = (totalPnL * solUSD).toFixed(2);
  const pnlPct   = startingSOL > 0 ? ((totalPnL / startingSOL) * 100).toFixed(1) : "0.0";

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.black,
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      color: "rgba(255,255,255,0.85)",
      padding: "0 0 80px 0",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ── Starfield Background ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 80%, rgba(34,211,238,0.03) 0%, transparent 60%)`,
      }} />

      {/* ── Top Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 28px 16px",
        borderBottom: `1px solid ${COLORS.glassBorder}`,
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,5,0.95)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate('/income-streams')}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 12,
              border: `1px solid ${COLORS.glassBorder}`,
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.75)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} style={{ color: COLORS.gold }} />
            {t('common.back')}
          </button>
          <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
            color: COLORS.gold, textTransform: "uppercase", marginBottom: 2 }}>
            SQI 2050 · SOVEREIGN COPY ENGINE
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em", ...goldText }}>
            FOMO Mirror Bot
          </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Mode toggle */}
          <div style={{ ...glassCard, padding: "4px 6px", display: "flex", gap: 4, borderRadius: 12 }}>
            {["paper", "live"].map(m => (
              <button key={m} onClick={() => { if (!isMonitoring) setMode(m); }}
                style={{
                  padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase",
                  background: mode === m ? (m === "live" ? "#F87171" : COLORS.gold) : "transparent",
                  color: mode === m ? COLORS.black : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                }}>
                {m === "paper" ? "📄 PAPER" : "⚡ LIVE"}
              </button>
            ))}
          </div>

          {/* Wallet */}
          {walletAddress ? (
            <div style={{ ...glassCard, padding: "8px 14px", borderRadius: 14 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.4em",
                color: COLORS.gold, textTransform: "uppercase" }}>WALLET</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
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
              background: COLORS.gold, color: COLORS.black, border: "none",
              borderRadius: 12, padding: "10px 18px", fontWeight: 800, fontSize: 11,
              letterSpacing: "0.2em", cursor: "pointer", textTransform: "uppercase",
            }}>
              ⚡ Connect Phantom
            </button>
          )}
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div style={{
        background: isMonitoring ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.02)",
        borderBottom: `1px solid ${isMonitoring ? "rgba(74,222,128,0.15)" : COLORS.glassBorder}`,
        padding: "8px 28px",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
        color: isMonitoring ? COLORS.green : "rgba(255,255,255,0.3)",
      }}>
        {status || "◉ READY — Add wallets to begin copy trading"}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, padding: "0 28px",
        borderBottom: `1px solid ${COLORS.glassBorder}`, marginBottom: 24 }}>
        {["dashboard", "wallets", "feed", "trades", "setup"].map(t2 => (
          <button key={t2} onClick={() => setTab(t2)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "14px 18px",
            fontSize: 8, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase",
            color: tab === t2 ? COLORS.gold : "rgba(255,255,255,0.3)",
            borderBottom: tab === t2 ? `2px solid ${COLORS.gold}` : "2px solid transparent",
            transition: "all 0.2s",
          }}>
            {t2 === "dashboard" ? "⬡ DASHBOARD" :
             t2 === "wallets" ? "◎ WALLETS" :
             t2 === "feed" ? "⚡ LIVE FEED" :
             t2 === "trades" ? "◈ MY TRADES" : "⚙ SETUP"}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 28px" }}>

        {/* ════ DASHBOARD TAB ════ */}
        {tab === "dashboard" && (
          <div>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "PORTFOLIO", value: `${paperPortfolio.toFixed(4)} SOL`, sub: `$${portfolioUSD}`, color: COLORS.gold },
                { label: "TOTAL P&L", value: `${totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(4)} SOL`,
                  sub: `${pnlPct}%`, color: totalPnL >= 0 ? COLORS.green : COLORS.red },
                { label: "TRADES", value: myTrades.length, sub: `${myTrades.filter((t2) => (t2.pnl ?? 0) > 0).length} wins`, color: COLORS.cyan },
                { label: "RISK/TRADE", value: `${riskPct}%`, sub: `${(paperPortfolio * riskPct / 100).toFixed(4)} SOL`, color: "rgba(255,255,255,0.6)" },
              ].map(s => (
                <div key={s.label} style={{ ...glassCard, padding: "18px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
                    color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: s.color,
                    textShadow: `0 0 20px ${s.color}30` }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Control buttons */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <button onClick={isMonitoring ? stopMonitoring : startMonitoring}
                disabled={!walletAddress}
                style={{
                  flex: 1, padding: "16px 24px", borderRadius: 16,
                  background: isMonitoring
                    ? "rgba(248,113,113,0.15)" : `linear-gradient(135deg, ${COLORS.gold}, #B8941F)`,
                  color: isMonitoring ? COLORS.red : COLORS.black,
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.25em",
                  textTransform: "uppercase", cursor: "pointer",
                  boxShadow: isMonitoring ? "none" : `0 4px 30px rgba(212,175,55,0.3)`,
                  transition: "all 0.2s",
                  border: isMonitoring ? `1px solid ${COLORS.red}` : "none",
                }}>
                {isMonitoring ? "⏹ STOP MONITORING" : "▶ START COPY TRADING"}
              </button>

              <button onClick={injectDemoTrade} style={{
                padding: "16px 20px", borderRadius: 16, cursor: "pointer",
                background: "rgba(34,211,238,0.08)",
                border: `1px solid rgba(34,211,238,0.2)`,
                color: COLORS.cyan, fontSize: 9, fontWeight: 800, letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}>
                🧪 SIM TRADE
              </button>
            </div>

            {/* Recent activity */}
            <div style={{ ...glassCard, padding: "20px" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
                color: COLORS.gold, textTransform: "uppercase", marginBottom: 14 }}>
                ⚡ RECENT COPY TRADES
              </div>
              {myTrades.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.2)",
                  fontSize: 12 }}>
                  No trades yet. Add a wallet and click START or SIM TRADE.
                </div>
              ) : myTrades.slice(0, 8).map((t2, i) => (
                <TradeRow key={t2.id || i} trade={t2} />
              ))}
            </div>
          </div>
        )}

        {/* ════ WALLETS TAB ════ */}
        {tab === "wallets" && (
          <div>
            <div style={{ ...glassCard, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
                color: COLORS.gold, textTransform: "uppercase", marginBottom: 16 }}>
                ◎ ADD FOMO TRADER WALLET
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label (e.g. FOMO Whale 1)"
                  style={{ ...inputStyle, width: 160, flex: "none" }} />
                <input value={newWallet} onChange={e => setNewWallet(e.target.value)}
                  placeholder="Solana wallet address (44 chars)"
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => {
                  if (!newWallet || newWallet.length < 32) return;
                  setTrackedWallets(tw => [...tw, {
                    address: newWallet, label: newLabel || `Trader ${tw.length + 1}`, active: true
                  }]);
                  setNewWallet(""); setNewLabel("");
                }} style={{
                  background: COLORS.gold, color: COLORS.black, border: "none",
                  borderRadius: 12, padding: "0 20px", fontWeight: 800, fontSize: 11,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  + ADD
                </button>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                Find top FOMO traders at fomo.fund → copy their wallet addresses
              </div>
            </div>

            {trackedWallets.map((tw, i) => (
              <div key={i} style={{ ...glassCard, padding: "16px 20px", marginBottom: 10,
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.4em",
                    color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>
                    {tw.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                    color: "rgba(255,255,255,0.7)" }}>
                    {tw.address || "← Enter address"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setTrackedWallets(arr => arr.map((w, j) =>
                    j === i ? { ...w, active: !w.active } : w
                  ))} style={{
                    padding: "6px 14px", borderRadius: 10, cursor: "pointer",
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.2em",
                    background: tw.active ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                    color: tw.active ? COLORS.green : "rgba(255,255,255,0.3)",
                    border: `1px solid ${tw.active ? "rgba(74,222,128,0.2)" : COLORS.glassBorder}`,
                  }}>
                    {tw.active ? "● ACTIVE" : "○ INACTIVE"}
                  </button>
                  <button onClick={() => setTrackedWallets(arr => arr.filter((_, j) => j !== i))}
                    style={{
                      padding: "6px 12px", borderRadius: 10, border: `1px solid rgba(248,113,113,0.2)`,
                      background: "rgba(248,113,113,0.06)", color: COLORS.red, cursor: "pointer",
                      fontSize: 9, fontWeight: 800,
                    }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ LIVE FEED TAB ════ */}
        {tab === "feed" && (
          <div style={{ ...glassCard, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
                color: COLORS.gold, textTransform: "uppercase" }}>
                ⚡ TRADER ACTIVITY FEED
              </div>
              <div style={{ fontSize: 9, color: isMonitoring ? COLORS.green : "rgba(255,255,255,0.2)",
                fontWeight: 700, letterSpacing: "0.2em" }}>
                {isMonitoring ? "● LIVE" : "○ OFFLINE"}
              </div>
            </div>
            {liveFeed.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.2)" }}>
                Watching for swaps on tracked wallets…
              </div>
            ) : liveFeed.map((t2, i) => (
              <div key={t2.id || i} style={{
                padding: "12px 14px", marginBottom: 8,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${t2.action === "BUY" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}`,
                borderRadius: 12, display: "flex", gap: 12, alignItems: "center",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 900, fontSize: 13,
                  background: t2.action === "BUY" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                  color: t2.action === "BUY" ? COLORS.green : COLORS.red,
                  border: `1px solid ${t2.action === "BUY" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                }}>
                  {t2.action === "BUY" ? "↑" : "↓"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700,
                    color: t2.action === "BUY" ? COLORS.green : COLORS.red }}>
                    {t2.action} · {t2.mint || "TOKEN"} · {t2.platform}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {t2.label} · {new Date(t2.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <a href={`https://solscan.io/tx/${t2.sig}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 9, color: COLORS.cyan, textDecoration: "none", fontWeight: 700 }}>
                  {t2.sig?.slice(0, 8)}…
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ════ MY TRADES TAB ════ */}
        {tab === "trades" && (
          <div style={{ ...glassCard, padding: "20px" }}>
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
              color: COLORS.gold, textTransform: "uppercase", marginBottom: 16 }}>
              ◈ MY COPY TRADE HISTORY
            </div>
            {myTrades.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.2)" }}>
                No trades executed yet.
              </div>
            ) : myTrades.map((t2, i) => <TradeRow key={t2.id || i} trade={t2} showPnL />)}
          </div>
        )}

        {/* ════ SETUP TAB ════ */}
        {tab === "setup" && (
          <div>
            <div style={{ ...glassCard, padding: "24px", marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
                color: COLORS.gold, textTransform: "uppercase", marginBottom: 20 }}>
                ⚙ RISK MANAGEMENT
              </div>

              <SettingRow label="RISK PER TRADE (%)"
                value={`${riskPct}%`}
                hint={`${(paperPortfolio * riskPct / 100).toFixed(4)} SOL per trade`}>
                <input type="range" min={1} max={20} value={riskPct}
                  onChange={e => setRiskPct(+e.target.value)}
                  style={{ width: "100%", accentColor: COLORS.gold }} />
              </SettingRow>

              <SettingRow label="STARTING BALANCE (SOL)"
                value={`${startingSOL} SOL ≈ $${(startingSOL * solUSD).toFixed(0)}`}>
                <input type="number" min={0.01} step={0.01} value={startingSOL}
                  onChange={e => setStartingSOL(+e.target.value)}
                  style={{ ...inputStyle, width: 100 }} />
              </SettingRow>

              <SettingRow label="COPY MODE" value={mode.toUpperCase()}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                  📄 PAPER — Simulates trades without real money. Perfect for testing.<br/>
                  ⚡ LIVE — Executes real swaps via Jupiter. Requires Phantom + SOL balance.<br/>
                  <span style={{ color: COLORS.red }}>⚠ Only use LIVE after validating in PAPER mode.</span>
                </div>
              </SettingRow>
            </div>

            <div style={{ ...glassCard, padding: "24px", marginBottom: 16 }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
                color: COLORS.gold, textTransform: "uppercase", marginBottom: 16 }}>
                🔑 HELIUS RPC SETUP
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: 14 }}>
                For real-time monitoring you need a free Helius API key:
              </div>
              {[
                "1. Go to helius.dev → Create free account",
                "2. Copy your API key from the dashboard",
                "3. Set VITE_HELIUS_API_KEY in your environment (Helius dashboard)",
                "4. Free tier: 1M credits/month — enough for 24/7 monitoring",
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", padding: "5px 0",
                  borderBottom: `1px solid ${COLORS.glassBorder}` }}>
                  {s}
                </div>
              ))}
            </div>

            <div style={{ ...glassCard, padding: "24px" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.45em",
                color: COLORS.gold, textTransform: "uppercase", marginBottom: 16 }}>
                📋 FOMO APP — FIND TOP TRADERS
              </div>
              {[
                "1. Go to fomo.fund on your browser",
                "2. Browse the leaderboard for top performing wallets",
                "3. Click a trader → copy their Solana wallet address",
                "4. Paste it in the WALLETS tab above",
                "5. Activate the wallet → click START COPY TRADING",
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", padding: "5px 0",
                  borderBottom: `1px solid ${COLORS.glassBorder}` }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Bottom disclaimer for LIVE mode ── */}
      {mode === "live" && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(248,113,113,0.08)",
          borderTop: `1px solid rgba(248,113,113,0.2)`,
          padding: "10px 28px",
          fontSize: 9, color: COLORS.red, fontWeight: 700, letterSpacing: "0.15em",
          textAlign: "center",
        }}>
          ⚠ LIVE MODE ACTIVE — Real SOL will be spent on each copied trade. Use at your own risk.
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function TradeRow({ trade, showPnL }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px", marginBottom: 6,
      background: "rgba(255,255,255,0.01)",
      border: `1px solid ${trade.action === "BUY" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)"}`,
      borderRadius: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: trade.action === "BUY" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
        color: trade.action === "BUY" ? COLORS.green : COLORS.red,
        fontSize: 14, fontWeight: 900,
      }}>
        {trade.action === "BUY" ? "↑" : "↓"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700,
          color: trade.action === "BUY" ? COLORS.green : COLORS.red }}>
          {trade.action} {trade.token || trade.mint || "—"} · {trade.platform || "—"}
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
          {(trade.riskSOL || 0).toFixed(4)} SOL · {new Date(trade.timestamp).toLocaleTimeString()}
        </div>
      </div>
      {showPnL && trade.pnl !== undefined && (
        <div style={{ fontSize: 13, fontWeight: 900,
          color: trade.pnl >= 0 ? COLORS.green : COLORS.red }}>
          {trade.pnl >= 0 ? "+" : ""}{(trade.pnl * 140).toFixed(2)}$
        </div>
      )}
    </div>
  );
}

function SettingRow({ label, value, hint, children }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 20,
      borderBottom: `1px solid ${COLORS.glassBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.4em",
          color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.gold }}>{value}</div>
      </div>
      {hint && <div style={{ fontSize: 9, color: COLORS.cyan, marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.03)",
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 10,
  padding: "10px 14px",
  color: "rgba(255,255,255,0.8)",
  fontSize: 11,
  fontFamily: "'Plus Jakarta Sans', monospace",
  outline: "none",
};

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
