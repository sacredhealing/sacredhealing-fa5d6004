import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  ArrowLeft, Wallet, RefreshCw, Play, Square, Trash2, ExternalLink,
  AlertCircle, CheckCircle, Clock, TrendingUp, DollarSign, Zap, Shield,
  Activity, Target, BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PnLCard } from '@/components/polymarket/PnLCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { POLYGON_ADDRESSES, PolymarketTrading } from '@/services/polymarketTrading';
import { polymarketService } from '@/services/polymarketService';
import { polymarketAI } from '@/services/polymarketAI';
import {
  whaleMirrorService,
  latencyArbitrageService,
  volatilityScalperService,
  paperTradingService,
  STRATEGY_NAMES,
  type PnLSummary,
} from '@/services/polymarket';
import type { LogEntry, TradeSignal, PolymarketMarket } from '@/types/polymarket';

// ─── SQI 2050 tokens ──────────────────────────────────────────────────────────
const G = '#D4AF37';
const CYAN = '#22D3EE';
const RED = '#FF4757';
const GREEN = '#2ECC71';
const AMBER = '#F59E0B';
const BLACK = '#050505';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
.sqi{font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;background:${BLACK};color:#fff;position:relative;overflow-x:hidden;}
.sqi *{box-sizing:border-box;}
.sqi-bg{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse at 15% 15%,rgba(212,175,55,0.06) 0%,transparent 55%),
             radial-gradient(ellipse at 85% 85%,rgba(34,211,238,0.04) 0%,transparent 55%);}
.sqi-z{position:relative;z-index:1;padding:0 20px 120px;}
.gc{background:rgba(255,255,255,0.025);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
    border:1px solid rgba(255,255,255,0.06);border-radius:22px;padding:18px;}
.gc-g{border-color:rgba(212,175,55,0.22);box-shadow:0 0 30px rgba(212,175,55,0.1);}
.gc-gr{border-color:rgba(46,204,113,0.2);background:rgba(46,204,113,0.07);}
.gc-r{border-color:rgba(255,71,87,0.2);background:rgba(255,71,87,0.07);}
.gc-a{border-color:rgba(245,158,11,0.25);background:rgba(245,158,11,0.07);}
.gc-c{border-color:rgba(34,211,238,0.2);background:rgba(34,211,238,0.07);}
.p{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:50px;
   font-size:8px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;}
.p-g{background:rgba(212,175,55,0.12);color:${G};border:1px solid rgba(212,175,55,0.25);}
.p-gr{background:rgba(46,204,113,0.12);color:${GREEN};border:1px solid rgba(46,204,113,0.25);}
.p-r{background:rgba(255,71,87,0.12);color:${RED};border:1px solid rgba(255,71,87,0.25);}
.p-c{background:rgba(34,211,238,0.1);color:${CYAN};border:1px solid rgba(34,211,238,0.25);}
.p-a{background:rgba(245,158,11,0.1);color:${AMBER};border:1px solid rgba(245,158,11,0.25);}
.sb{background:rgba(255,255,255,0.06);border-radius:14px;padding:12px 14px;}
.sb-lbl{font-size:7px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:5px;}
.sb-val{font-size:18px;font-weight:900;letter-spacing:-0.03em;}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;position:relative;vertical-align:middle;}
.dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;animation:ring 2s ease-out infinite;}
.dot-g{background:${GREEN};}.dot-g::after{border:1px solid ${GREEN};}
.dot-r{background:${RED};}.dot-r::after{border:1px solid ${RED};}
.dot-a{background:${AMBER};}.dot-a::after{border:1px solid ${AMBER};}
.dot-c{background:${CYAN};}.dot-c::after{border:1px solid ${CYAN};}
@keyframes ring{0%{opacity:.5;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;
     border-radius:16px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;
     font-size:10px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;transition:all .25s;width:100%;}
.btn-g{background:linear-gradient(135deg,${G},#f0c040);color:${BLACK};box-shadow:0 0 28px rgba(212,175,55,0.35);}
.btn-g:hover{box-shadow:0 0 45px rgba(212,175,55,0.55);transform:translateY(-1px);}
.btn-gr{background:linear-gradient(135deg,${GREEN},#27ae60);color:#fff;box-shadow:0 0 24px rgba(46,204,113,0.35);}
.btn-gr:hover{box-shadow:0 0 40px rgba(46,204,113,0.5);transform:translateY(-1px);}
.btn-r{background:linear-gradient(135deg,${RED},#c0392b);color:#fff;box-shadow:0 0 24px rgba(255,71,87,0.35);}
.btn-r:hover{box-shadow:0 0 40px rgba(255,71,87,0.5);}
.btn-ghost{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);
           border:1px solid rgba(255,255,255,0.08);padding:10px 14px;width:auto;}
.btn-ghost:hover{background:rgba(255,255,255,0.1);color:#fff;}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}
.tabs{display:flex;gap:3px;background:rgba(255,255,255,0.05);border-radius:16px;
      padding:4px;border:1px solid rgba(255,255,255,0.07);}
.tab{flex:1;padding:9px 6px;border-radius:12px;border:none;cursor:pointer;
     font-family:'Plus Jakarta Sans',sans-serif;font-size:8px;font-weight:800;
     letter-spacing:.2em;text-transform:uppercase;background:transparent;
     color:rgba(255,255,255,0.3);transition:all .2s;}
.tab.on{background:rgba(212,175,55,0.14);color:${G};border-bottom:1px solid ${G};}
.term{background:rgba(0,0,0,0.82);border:1px solid rgba(212,175,55,0.18);border-radius:16px;
      padding:12px 10px;height:min(52vh,380px);min-height:300px;overflow-y:auto;font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;font-size:13px;line-height:1.45;}
.term::-webkit-scrollbar{width:6px;}
.term::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.35);border-radius:3px;}
.term-line{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;margin-bottom:4px;border-radius:12px;border-left:3px solid transparent;background:rgba(255,255,255,0.045);}
.term-line--info{border-left-color:rgba(212,175,55,0.55);}
.term-line--success{border-left-color:rgba(46,204,113,0.7);}
.term-line--error{border-left-color:rgba(255,71,87,0.75);}
.term-line--warn{border-left-color:rgba(245,158,11,0.75);}
.term-line--trade{border-left-color:rgba(34,211,238,0.75);}
.term-line--debug{border-left-color:rgba(255,255,255,0.2);}
.li{color:rgba(255,255,255,0.92);font-weight:500;}
.ls{color:${GREEN};font-weight:600;}
.le{color:#ff8a95;font-weight:600;}
.lw{color:${AMBER};font-weight:600;}
.lt{color:#7ee8fb;font-weight:600;}
.ld{color:rgba(255,255,255,0.62);font-weight:500;}
.ltime{flex-shrink:0;min-width:76px;font-family:'Courier New',monospace;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.02em;padding-top:2px;}
.lmsg{flex:1;min-width:0;word-break:break-word;}
.term-hint{font-size:11px;line-height:1.5;color:rgba(255,255,255,0.52);margin-bottom:12px;padding:10px 12px;border-radius:12px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.12);}
.inp{width:100%;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.08);
     border-radius:14px;padding:12px 16px;color:#fff;font-family:'Courier New',monospace;
     font-size:12px;outline:none;transition:border-color .2s;}
.inp:focus{border-color:rgba(212,175,55,0.3);box-shadow:0 0 14px rgba(212,175,55,0.12);}
.inp::placeholder{color:rgba(255,255,255,0.2);}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.running{animation:pulse 2s ease-in-out infinite;}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.spinning{animation:spin 1s linear infinite;}
.statusbar{position:fixed;bottom:72px;left:0;right:0;padding:0 20px;z-index:50;}
.statusbar-inner{background:rgba(5,5,5,0.94);backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:10px 16px;
  display:flex;justify-content:space-between;align-items:center;
  font-size:9px;font-weight:700;letter-spacing:.2em;color:rgba(255,255,255,0.3);}
.feat{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);
      border-radius:18px;padding:16px;transition:border-color .2s,box-shadow .2s;}
.feat:hover{border-color:rgba(212,175,55,0.22);box-shadow:0 0 20px rgba(212,175,55,0.08);}
.feat-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
.sig{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:14px;margin-bottom:8px;}
.lbl{font-size:7px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.3);}
.title{font-size:28px;font-weight:900;letter-spacing:-.04em;line-height:1.1;
  background:linear-gradient(135deg,#fff 40%,${G} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.subtitle{font-size:9px;font-weight:700;letter-spacing:.4em;text-transform:uppercase;color:${G};}
.mono{font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,0.55);}
.body{font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;}
`;

const getRpcPool = (): string[] => {
  const viteUrls = [
    import.meta.env.VITE_RPC_URL_1,
    import.meta.env.VITE_RPC_URL_2,
    import.meta.env.VITE_RPC_URL_3,
    import.meta.env.VITE_POLYGON_RPC_URL_1,
    import.meta.env.VITE_POLYGON_RPC_URL_2,
    import.meta.env.VITE_POLYGON_RPC_URL_3,
    (import.meta.env as any).VITE_NEXT_PUBLIC_RPC_URL_1,
    (import.meta.env as any).VITE_NEXT_PUBLIC_RPC_URL_2,
    (import.meta.env as any).VITE_NEXT_PUBLIC_RPC_URL_3,
  ].filter((u): u is string => !!u);
  if (viteUrls.length > 0) return Array.from(new Set(viteUrls));
  return [
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.meowrpc.com',
    'https://1rpc.io/matic',
    'https://rpc.ankr.com/polygon'
  ];
};
const RPC_POOL = getRpcPool();

const PKEY_STORAGE_KEY = 'polymarket_bot_pkey';

/** Risk per live trade: 5% of balance, min €0.50, max €50 (paper sizing is enforced in paperTrading.executePaperTrade). */
const TRADE_RISK_FRACTION = 0.05;
const MIN_LIVE_TRADE_USD = 0.5;
const MAX_LIVE_TRADE_USD = 50;

function positionSizeFromBalance(balance: number): number {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  const raw = Math.min(MAX_LIVE_TRADE_USD, Math.max(MIN_LIVE_TRADE_USD, parseFloat((balance * TRADE_RISK_FRACTION).toFixed(2))));
  if (raw <= 0) return 0;
  return Math.min(raw, balance);
}

function readStoredPrivateKey(): string | null {
  try {
    const persisted = localStorage.getItem(PKEY_STORAGE_KEY);
    if (persisted) return persisted;
    // One-time migration: older builds kept the key only in sessionStorage (lost on tab close).
    const sessionOnly = sessionStorage.getItem(PKEY_STORAGE_KEY);
    if (sessionOnly) {
      localStorage.setItem(PKEY_STORAGE_KEY, sessionOnly);
      sessionStorage.removeItem(PKEY_STORAGE_KEY);
      return sessionOnly;
    }
  } catch { /* storage blocked */ }
  return null;
}

function setStoredPrivateKey(key: string) {
  try {
    localStorage.setItem(PKEY_STORAGE_KEY, key);
    sessionStorage.removeItem(PKEY_STORAGE_KEY);
  } catch { /* storage blocked */ }
}

function clearStoredPrivateKey() {
  try {
    sessionStorage.removeItem(PKEY_STORAGE_KEY);
    localStorage.removeItem(PKEY_STORAGE_KEY);
  } catch { /* storage blocked */ }
}

function logLineClass(type: LogEntry['type']): string {
  const m: Record<LogEntry['type'], string> = {
    info: 'li',
    success: 'ls',
    error: 'le',
    warn: 'lw',
    trade: 'lt',
    debug: 'ld',
  };
  return m[type] ?? 'li';
}

function termLineClass(type: LogEntry['type']): string {
  const m: Record<LogEntry['type'], string> = {
    info: 'term-line--info',
    success: 'term-line--success',
    error: 'term-line--error',
    warn: 'term-line--warn',
    trade: 'term-line--trade',
    debug: 'term-line--debug',
  };
  return `term-line ${m[type] ?? 'term-line--info'}`;
}

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

const PolymarketBotDetailInner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [privateKey, setPrivateKey] = useState<string | null>(() => readStoredPrivateKey());
  const [address, setAddress] = useState<string>('');
  const [importInput, setImportInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [polBal, setPolBal] = useState<string>('0.0000');
  const [usdcBal, setUsdcBal] = useState<string>('0.00');
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [trading] = useState(() => new PolymarketTrading());
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [activeSignals, setActiveSignals] = useState<TradeSignal[]>([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [isPaperMode, setIsPaperMode] = useState(true);
  const [paperBalance, setPaperBalance] = useState(10);
  /** Baseline for P&L % display — updated when settings load or user applies a new paper bankroll */
  const [paperBaseline, setPaperBaseline] = useState(10);
  const [paperBalanceDraft, setPaperBalanceDraft] = useState('10');
  const [totalFeesPaid, setTotalFeesPaid] = useState(0);
  const [pnlSummary, setPnlSummary] = useState<PnLSummary>({
    totalPnL: 0,
    todayPnL: 0,
    totalTrades: 0,
    winRate: 0,
    unrealizedPnL: 0,
  });
  const [livePnlSummary, setLivePnlSummary] = useState<PnLSummary>({
    totalPnL: 0,
    todayPnL: 0,
    totalTrades: 0,
    winRate: 0,
    unrealizedPnL: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isResettingPaperData, setIsResettingPaperData] = useState(false);
  const [lastSync, setLastSync] = useState<string>('Never');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const termScrollRef = useRef<HTMLDivElement>(null);
  const prevActiveTabRef = useRef(activeTab);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pnlRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [{
      id: Math.random().toString(36),
      msg,
      type,
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    const el = termScrollRef.current;
    if (el && logs.length > 0) el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (activeTab === 'settings' && prevActiveTabRef.current !== 'settings' && isPaperMode) {
      setPaperBalanceDraft(paperBalance.toFixed(2));
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab, isPaperMode, paperBalance]);

  const refreshPnL = useCallback(async () => {
    if (!user?.id) return;
    try {
      await Promise.all([
        paperTradingService.refreshPositionPrices(true),
        paperTradingService.refreshPositionPrices(false),
      ]);
      const [paperSummary, liveSummary, settings] = await Promise.all([
        paperTradingService.getPnLSummary(true),
        paperTradingService.getPnLSummary(false),
        paperTradingService.loadSettings(),
      ]);
      setPnlSummary(paperSummary);
      setLivePnlSummary(liveSummary);
      setTotalTrades(paperSummary.totalTrades + liveSummary.totalTrades);
      if (settings) {
        setPaperBalance(settings.paper_balance ?? 10);
        setTotalFeesPaid(settings.total_fees_paid ?? 0);
      }
      if (paperSummary.paperStakeBaseline != null) {
        setPaperBaseline(paperSummary.paperStakeBaseline);
      }
    } catch (e) {
      console.error('[PolymarketBot] refreshPnL:', e);
    }
  }, [user?.id]);

  const handleApplyPaperBalance = useCallback(async () => {
    const raw = paperBalanceDraft.replace(',', '.').trim();
    const v = parseFloat(raw);
    if (!Number.isFinite(v) || v < 0.01) {
      toast.error(t('polymarketBotDetail.paperBalanceInvalid'));
      return;
    }
    if (isRunning) {
      toast.error(t('polymarketBotDetail.paperBalanceStopEngine'));
      return;
    }
    if (!user?.id) {
      toast.error(t('polymarketBotDetail.paperBalanceNeedAuth'));
      return;
    }
    const cur = await paperTradingService.loadSettings();
    if (!cur) {
      toast.error(t('polymarketBotDetail.paperBalanceSaveFailed'));
      return;
    }
    const ok = await paperTradingService.saveSettings({ ...cur, paper_balance: v });
    if (ok) {
      paperTradingService.setPaperDisplayStake(v);
      setPaperBalance(v);
      setPaperBaseline(v);
      addLog(t('polymarketBotDetail.paperBalanceSavedLog', { amount: v.toFixed(2) }), 'success');
      toast.success(t('polymarketBotDetail.paperBalanceSaved'));
      void refreshPnL();
    } else {
      toast.error(t('polymarketBotDetail.paperBalanceSaveFailed'));
    }
  }, [paperBalanceDraft, isRunning, user?.id, t, addLog, refreshPnL]);

  const handleResetPaperBalance = useCallback(async () => {
    const success = await paperTradingService.resetPaperBalance(10);
    if (success) {
      setPaperBalance(10);
      setPaperBaseline(10);
      setPaperBalanceDraft('10.00');
      setTotalFeesPaid(0);
      addLog(t('polymarketBotDetail.paperBalanceResetLog', { amount: '10.00' }), 'success');
      toast.success(t('polymarketBotDetail.paperBalanceResetToast'));
      void refreshPnL();
    }
  }, [addLog, t, refreshPnL]);

  const handleResetPaperData = useCallback(async () => {
    if (!user?.id) {
      toast.error(t('polymarketBotDetail.paperBalanceNeedAuth'));
      return;
    }
    if (isRunning) {
      toast.error(t('polymarketBotDetail.paperBalanceStopEngine'));
      return;
    }
    const uid = user.id;
    setIsResettingPaperData(true);
    try {
      const { error: e1 } = await supabase
        .from('polymarket_trades')
        .delete()
        .eq('is_paper', true)
        .eq('user_id', uid);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('polymarket_positions')
        .delete()
        .eq('is_paper', true)
        .eq('user_id', uid);
      if (e2) throw e2;
      const { error: e3 } = await supabase
        .from('polymarket_pnl_daily')
        .delete()
        .eq('is_paper', true)
        .eq('user_id', uid);
      if (e3) throw e3;
      const { error: e4 } = await supabase
        .from('polymarket_bot_settings')
        .update({ paper_balance: 10, total_fees_paid: 0 })
        .eq('user_id', uid);
      if (e4) throw e4;

      paperTradingService.setPaperDisplayStake(10);
      if (typeof localStorage !== 'undefined') {
        const rm: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(`pm_paper_day_equity_v1_${uid}_`)) rm.push(k);
        }
        rm.forEach((k) => localStorage.removeItem(k));
      }
      setPaperBalance(10);
      setPaperBaseline(10);
      setPaperBalanceDraft('10.00');
      setTotalFeesPaid(0);
      addLog(t('polymarketBotDetail.paperBalanceResetLog', { amount: '10.00' }), 'success');
      toast.success(t('polymarketBotDetail.resetPaperDataSuccess'));
      void refreshPnL();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('polymarketBotDetail.resetPaperDataFailed');
      toast.error(msg);
    } finally {
      setIsResettingPaperData(false);
    }
  }, [user?.id, isRunning, t, addLog, refreshPnL]);

  useEffect(() => {
    if (isRunning) {
      refreshPnL();
      pnlRefreshRef.current = setInterval(refreshPnL, 5000);
    } else if (pnlRefreshRef.current) {
      clearInterval(pnlRefreshRef.current);
      pnlRefreshRef.current = null;
    }
    return () => {
      if (pnlRefreshRef.current) clearInterval(pnlRefreshRef.current);
    };
  }, [isRunning, refreshPnL]);

  /** Keep paper marks fresh while engine is stopped (PnL interval only runs when running). */
  useEffect(() => {
    if (!user?.id || !privateKey) return;
    if (isRunning) return;
    const id = window.setInterval(() => {
      void refreshPnL();
    }, 12000);
    return () => window.clearInterval(id);
  }, [user?.id, privateKey, isRunning, refreshPnL]);

  const performDeepSync = useCallback(async (forcedAddr?: string) => {
    const activeAddr = forcedAddr || address;
    if (!activeAddr) return;
    setIsSyncing(true);
    addLog('Connecting to Polygon mainnet...', 'info');
    let success = false;
    for (const rpcUrl of RPC_POOL) {
      if (success) break;
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
        try {
          const rawPol = await provider.getBalance(activeAddr);
          const pv = parseFloat(ethers.formatEther(rawPol)).toFixed(4);
          setPolBal(pv);
          addLog(`POL Balance: ${pv}`, 'debug');
        } catch {
          addLog('Failed to fetch POL balance', 'warn');
        }
        await new Promise((r) => setTimeout(r, 200));
        try {
          // Native USDC (0x3c499c...) — the only USDC Polymarket supports on Polygon
          const c = new ethers.Contract(POLYGON_ADDRESSES.USDC_NATIVE, ERC20_ABI, provider);
          const [rBal, rAllowance] = await Promise.all([
            c.balanceOf(activeAddr),
            c.allowance(activeAddr, POLYGON_ADDRESSES.CTF_EXCHANGE),
          ]);
          const v = parseFloat(ethers.formatUnits(rBal, 6)).toFixed(2);
          setUsdcBal(v);
          setAllowance(rAllowance);
          addLog(`Native USDC: $${v} | CTF Allowance: ${rAllowance > 0n ? 'Approved ✓' : 'Needs approval'}`, 'debug');
        } catch {
          addLog('Failed to fetch USDC balance', 'warn');
        }
        setLastSync(new Date().toLocaleTimeString());
        addLog(`Synced: ${activeAddr.slice(0, 10)}...${activeAddr.slice(-6)}`, 'success');
        success = true;
      } catch {
        addLog('Node failed. Trying next...', 'debug');
      }
    }
    if (!success) addLog('All RPC nodes failed. Check network.', 'error');
    setIsSyncing(false);
  }, [address, addLog]);

  useEffect(() => {
    if (privateKey) {
      try {
        const wallet = new ethers.Wallet(privateKey);
        setAddress(wallet.address);
        trading.initialize(privateKey, RPC_POOL[0])
          .then(() => addLog('Trading engine initialized', 'success'))
          .catch((err: unknown) => {
            console.error('[PolymarketBot] trading.initialize:', err);
            addLog(`Trading init failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
            toast.error('Trading engine failed to initialize');
          });
        if (user?.id) {
          paperTradingService.setUserId(user.id);
          paperTradingService.loadSettings().then(async (s) => {
            if (s) {
              setIsPaperMode(s.is_paper_mode);
              paperTradingService.setMode(s.is_paper_mode);
              addLog(`Mode: ${s.is_paper_mode ? '📝 PAPER TRADING' : '💰 LIVE TRADING'}`, 'info');

              // Legacy guard: cap oversized max_trade_size from old DB rows (live sizing: 5% of balance in UI; paper: service).
              if ((s.max_trade_size ?? 50) > 5) {
                await paperTradingService.saveSettings({ max_trade_size: 5 });
              }
              const pb = s.paper_balance ?? 10;
              setPaperBalance(pb);
              setPaperBalanceDraft(pb.toFixed(2));
              setTotalFeesPaid(s.total_fees_paid ?? 0);
            }
          }).catch((err: unknown) => console.error('[PolymarketBot] loadSettings:', err));
          void refreshPnL();
        }
        performDeepSync(wallet.address).catch((err: unknown) =>
          console.error('[PolymarketBot] performDeepSync:', err)
        );
      } catch (e) {
        console.error('Invalid private key:', e);
        clearStoredPrivateKey();
        setPrivateKey(null);
        toast.error('Invalid private key format');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init only when key/user changes; avoid re-init on sync fn identity
  }, [privateKey, trading, user?.id, refreshPnL]);

  useEffect(() => {
    if (address) {
      const i = setInterval(() => performDeepSync(), 30000);
      return () => clearInterval(i);
    }
  }, [address, performDeepSync]);

  const executeTradeWithMode = async (signal: TradeSignal, strategy?: string): Promise<boolean> => {
    let balance = 0;
    if (isPaperMode) {
      const st = await paperTradingService.loadSettings();
      balance = st?.paper_balance ?? paperBalance;
    } else {
      balance = parseFloat(usdcBal) || 0;
    }

    const sizeUsd = positionSizeFromBalance(balance);
    if (sizeUsd <= 0) {
      addLog(t('polymarketBotDetail.tradeSkippedLowBalance'), 'warn');
      return false;
    }

    const sizedSignal: TradeSignal = { ...signal, suggestedSize: sizeUsd };

    if (isPaperMode) {
      const result = await paperTradingService.executePaperTrade(sizedSignal, strategy);
      if (result.success) {
        addLog(
          t('polymarketBotDetail.paperTradeDone', {
            direction: sizedSignal.direction,
            outcome: sizedSignal.outcome,
            size: sizedSignal.suggestedSize.toFixed(2),
            balance: balance.toFixed(2),
          }),
          'success'
        );
        setTotalTrades((p) => p + 1);
        void refreshPnL();
        return true;
      }
      addLog(`📝 PAPER FAILED: ${result.error}`, 'error');
      return false;
    }
    if (allowance === 0n) {
      addLog('Cannot trade: USDC not approved for CTF Exchange', 'error');
      return false;
    }
    const result = await trading.executeTrade(sizedSignal);
    if (result.success) {
      addLog(
        t('polymarketBotDetail.liveTradeDone', {
          direction: sizedSignal.direction,
          outcome: sizedSignal.outcome,
          size: sizedSignal.suggestedSize.toFixed(2),
          balance: balance.toFixed(2),
          tx: result.txHash ?? '',
        }),
        'success'
      );
      setTotalTrades((p) => p + 1);
      void refreshPnL();
      return true;
    }
    addLog(`💰 LIVE FAILED: ${result.error}`, 'error');
    return false;
  };

  useEffect(() => {
    if (isRunning && address) {
      addLog('🚀 Starting Siddha Quantum Nexus HFT Engine...', 'info');
      addLog(`[1] ${STRATEGY_NAMES.WHALE_MIRROR} - Monitoring 0x8dxd`, 'info');
      addLog(`[2] ${STRATEGY_NAMES.LATENCY_ARB} - Gemini 3 Flash active`, 'info');
      addLog(`[3] ${STRATEGY_NAMES.VOLATILITY_SCALP} - Ladder orders ready`, 'info');
      const init = async () => {
        if (privateKey) {
          await whaleMirrorService.initialize(privateKey, RPC_POOL[0]);
          whaleMirrorService.onMirrorSignal(async (s, w) => {
            addLog(`🐋 WHALE MIRROR: ${w.whaleAddress.slice(0, 10)}... ${s.direction} ${s.outcome}`, 'trade');
            setActiveSignals((p) => [...p.slice(-4), s]);
            await executeTradeWithMode(s, 'whale_mirror');
          });
          whaleMirrorService.startMonitoring();
        }
      };
      init();
      const scan = async () => {
        setIsScanning(true);
        try {
          const fm = await polymarketService.fetchMarkets(50);
          setMarkets(fm);
          latencyArbitrageService.onLatencySignal(async (s, e) => {
            addLog(`⚡ LATENCY ARB: ${e.headline?.slice(0, 40)}...`, 'trade');
            setActiveSignals((p) => [...p.slice(-4), s]);
            await executeTradeWithMode(s, 'latency_arb');
          });
          latencyArbitrageService.startMonitoring(fm);
          volatilityScalperService.onScalpSignal(async (s, c) => {
            addLog(`📈 SCALP: ${c.ladder} vol=${(c.volatility * 100).toFixed(2)}%`, 'trade');
            setActiveSignals((p) => [...p.slice(-4), s]);
            await executeTradeWithMode(s, 'volatility_scalp');
          });
          volatilityScalperService.startScalping(fm);
          const opps = await polymarketService.findOpportunities(20000);
          addLog(
            t('polymarketBotDetail.logScanSummary', { markets: fm.length, aiPool: opps.length }),
            'info'
          );
          if (opps.length > 0) {
            addLog(`Found ${opps.length} potential opportunities`, 'info');
            for (const m of opps.slice(0, 3)) {
              const s = await polymarketAI.analyzeMarket(m);
              if (s) {
                setActiveSignals((p) => [...p.slice(-4), s]);
                addLog(`🤖 AI SIGNAL: ${s.direction.toUpperCase()} ${s.outcome} @ ${(s.currentPrice * 100).toFixed(1)}%`, 'trade');
                await executeTradeWithMode(s, 'ai_signal');
              }
            }
          }
        } catch (e) {
          addLog(`Scan error: ${e instanceof Error ? e.message : 'Unknown'}`, 'error');
        }
        setIsScanning(false);
      };
      scan();
      scanIntervalRef.current = setInterval(scan, 15000);
      return () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        whaleMirrorService.stopMonitoring();
        latencyArbitrageService.stopMonitoring();
        volatilityScalperService.stopScalping();
      };
    }
  }, [isRunning, address, allowance, usdcBal, trading, addLog, t]);

  const handleImport = () => {
    let key = importInput.trim();
    if (!key.startsWith('0x') && key.length === 64) key = `0x${key}`;
    try {
      const w = new ethers.Wallet(key);
      setStoredPrivateKey(key);
      setPrivateKey(key);
      setAddress(w.address);
      setInputError(null);
      addLog('Key validated. Initializing trading engine...', 'info');
      performDeepSync(w.address);
      toast.success('Wallet connected successfully');
    } catch {
      setInputError('Invalid private key format. Use 64-character hex key.');
    }
  };

  const handleApprove = async () => {
    if (!privateKey) return;
    setIsApproving(true);
    addLog('Initiating USDC approval for CTF Exchange...', 'info');
    try {
      for (const rpc of RPC_POOL) {
        try {
          const p = new ethers.JsonRpcProvider(rpc);
          const w = new ethers.Wallet(privateKey, p);
          const c = new ethers.Contract(POLYGON_ADDRESSES.USDC_E, ERC20_ABI, w);
          addLog('Sending approval transaction to Polygon...', 'info');
          const tx = await c.approve(POLYGON_ADDRESSES.CTF_EXCHANGE, ethers.MaxUint256);
          addLog(`Tx submitted: ${tx.hash.slice(0, 18)}...`, 'info');
          const receipt = await tx.wait();
          setAllowance(ethers.MaxUint256);
          addLog(`Approval confirmed in block ${receipt.blockNumber}`, 'success');
          toast.success('Exchange access approved!');
          break;
        } catch (e: any) {
          if (e.code === 'INSUFFICIENT_FUNDS') {
            addLog('Insufficient POL for gas fees', 'error');
            toast.error('Need POL for gas fees');
            break;
          }
        }
      }
    } catch (e: any) {
      addLog(`Approval failed: ${e.message}`, 'error');
      toast.error('Approval transaction failed');
    }
    setIsApproving(false);
  };

  const clearVault = () => {
    clearStoredPrivateKey();
    setPrivateKey(null);
    setAddress('');
    setLogs([]);
    setIsRunning(false);
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    toast.info('Wallet disconnected');
  };

  const toggleTradingMode = async () => {
    const n = !isPaperMode;
    setIsPaperMode(n);
    paperTradingService.setMode(n);
    await paperTradingService.saveSettings({ is_paper_mode: n });
    addLog(`Switched to ${n ? '📝 PAPER TRADING' : '💰 LIVE TRADING'} mode`, 'info');
    toast.success(`${n ? 'Paper' : 'Live'} trading mode enabled`);
  };

  const toggleBot = () => {
    if (!isRunning) {
      if (!isPaperMode) {
        if (allowance === 0n) {
          toast.error('Approve USDC for CTF Exchange first — click Approve button');
          return;
        }
        if (parseFloat(usdcBal) < 5) {
          toast.error(`Minimum $5 USDC required for live trading (balance: $${usdcBal})`);
          return;
        }
      }
      setIsRunning(true);
      addLog(`HFT Engine Started in ${isPaperMode ? 'PAPER' : 'LIVE'} mode...`, 'success');
      toast.success(`Bot started - ${isPaperMode ? 'Paper' : 'Live'} trading active`);
    } else {
      setIsRunning(false);
      addLog('Engine halted by operator.', 'warn');
      toast.info('Bot stopped');
    }
  };

  if (!privateKey) {
    return (
      <>
        <style>{CSS}</style>
        <div className="sqi">
          <div className="sqi-bg" />
          <div className="sqi-z">
            <div style={{ paddingTop: 24, paddingBottom: 20 }}>
              <button type="button" className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={() => navigate('/income-streams')}>
                <ArrowLeft size={13} /> Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                <div style={{ width: 50, height: 50, borderRadius: 15, background: `linear-gradient(135deg,${G},rgba(212,175,55,0.3))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 22px rgba(212,175,55,0.4)' }}>⟁</div>
                <div>
                  <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Polymarket HFT Bot</div>
                  <div className="subtitle">AI-Powered Prediction Market Trading</div>
                </div>
              </div>
            </div>

            <div className="gc gc-g" style={{ marginBottom: 16, textAlign: 'center' }}>
              <span className="p p-g" style={{ marginBottom: 16, display: 'inline-flex' }}>Live Trading · Polygon Mainnet</span>
              <div className="title" style={{ fontSize: 30, marginBottom: 12 }}>€10 → Financial Freedom</div>
              <div className="body" style={{ marginBottom: 20 }}>AI scans Polymarket for mispriced markets.<br />3 strategies running simultaneously.</div>
              <div className="g3">
                {[{ v: 'AI', s: 'Gemini Analysis', c: G }, { v: 'Live', s: 'Real Trades', c: GREEN }, { v: 'CLOB', s: 'Order Book', c: CYAN }].map((x, i) => (
                  <div key={i} className="sb" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: x.c, marginBottom: 4 }}>{x.v}</div>
                    <div className="lbl">{x.s}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="gc" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={16} color={G} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Connect Your Wallet</div>
                  <div className="lbl" style={{ marginTop: 2 }}>Polygon Mainnet Private Key</div>
                </div>
              </div>
              <input className="inp" type="password" placeholder="0x... (64-character hex key)" value={importInput} onChange={(e) => setImportInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleImport()} style={{ marginBottom: inputError ? 8 : 14 }} />
              {inputError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: RED, fontSize: 11, marginBottom: 12 }}>
                  <AlertCircle size={12} />
                  {inputError}
                </div>
              )}
              <button type="button" className="btn btn-g" onClick={handleImport}>
                <Wallet size={14} /> Connect & Initialize Engine
              </button>
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, lineHeight: 1.45, color: 'rgba(255,255,255,0.45)' }}>
                🔒 {t('polymarketBotDetail.keyStorageHint')}
              </div>
            </div>

            <div className="g2">
              {[
                { icon: <Zap size={15} color={G} />, bg: 'rgba(212,175,55,0.12)', t: 'AI Signals', s: 'Gemini market analysis' },
                { icon: <Shield size={15} color={GREEN} />, bg: 'rgba(46,204,113,0.12)', t: 'On-Chain', s: 'Real CTF Exchange' },
                { icon: <Target size={15} color={CYAN} />, bg: 'rgba(34,211,238,0.1)', t: 'Arbitrage', s: 'Mispricing detection' },
                { icon: <DollarSign size={15} color={AMBER} />, bg: 'rgba(245,158,11,0.1)', t: '€5 Minimum', s: 'Low entry barrier' },
              ].map((f, i) => (
                <div key={i} className="feat">
                  <div className="feat-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 3 }}>{f.t}</div>
                  <div className="body" style={{ fontSize: 11 }}>{f.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="sqi">
        <div className="sqi-bg" />
        <div className="sqi-z">

          <div style={{ paddingTop: 24, paddingBottom: 16 }}>
            <button type="button" className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('/income-streams')}>
              <ArrowLeft size={13} /> Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: isRunning ? 'rgba(46,204,113,0.12)' : 'rgba(212,175,55,0.12)', border: `1px solid ${isRunning ? 'rgba(46,204,113,0.25)' : 'rgba(212,175,55,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} color={isRunning ? GREEN : G} className={isRunning ? 'running' : ''} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', color: '#fff' }}>Polymarket HFT Bot</div>
                  <div className="mono">{address.slice(0, 8)}...{address.slice(-6)}</div>
                </div>
              </div>
              <span className={`p ${isRunning ? 'p-gr' : 'p-a'}`}>
                <span className={`dot ${isRunning ? 'dot-g' : 'dot-a'}`} />
                {isRunning ? (isScanning ? 'Scanning' : 'Running') : 'Stopped'}
              </span>
            </div>

            <div className="g3" style={{ marginBottom: 12 }}>
              <div className={`gc ${parseFloat(polBal) > 0.01 ? 'gc-gr' : 'gc-r'}`} style={{ padding: '12px', textAlign: 'center', borderRadius: 16 }}>
                <div className="lbl" style={{ marginBottom: 4 }}>POL Gas</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: parseFloat(polBal) > 0.01 ? GREEN : RED }}>{polBal}</div>
              </div>
              <div className="gc" style={{ padding: '12px', textAlign: 'center', borderRadius: 16, borderColor: parseFloat(usdcBal) >= 5 ? 'rgba(212,175,55,0.22)' : parseFloat(usdcBal) > 0 ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.06)' }}>
                <div className="lbl" style={{ marginBottom: 4, color: parseFloat(usdcBal) >= 5 ? G : AMBER }}>USDC</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: parseFloat(usdcBal) >= 5 ? G : parseFloat(usdcBal) > 0 ? AMBER : 'rgba(255,255,255,0.25)' }}>${usdcBal}</div>
              </div>
              <div className="gc" style={{ padding: '12px', textAlign: 'center', borderRadius: 16, borderColor: allowance > 0n ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)' }}>
                <div className="lbl" style={{ marginBottom: 4, color: allowance > 0n ? '#34D399' : 'rgba(255,255,255,0.4)' }}>CTF Approval</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 12, color: allowance > 0n ? '#34D399' : RED }}>{allowance > 0n ? '✓ Ready' : 'Needed'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <PnLCard
                isPaperMode={isPaperMode}
                totalPnL={isPaperMode ? pnlSummary.totalPnL : livePnlSummary.totalPnL}
                todayPnL={isPaperMode ? pnlSummary.todayPnL : livePnlSummary.todayPnL}
                totalTrades={isPaperMode ? pnlSummary.totalTrades : livePnlSummary.totalTrades}
                winRate={isPaperMode ? pnlSummary.winRate : livePnlSummary.winRate}
                startingBalance={paperBaseline}
                currentBalance={isPaperMode ? paperBalance : undefined}
                paperEquity={isPaperMode ? pnlSummary.paperEquity : undefined}
                totalFees={isPaperMode ? totalFeesPaid : undefined}
                onResetBalance={isPaperMode ? handleResetPaperBalance : undefined}
              />
            </div>

            <div className="g3" style={{ marginBottom: 12 }}>
              <div className="sb"><div className="sb-lbl">Trades</div><div className="sb-val">{totalTrades}</div></div>
              <div className="sb"><div className="sb-lbl">Markets</div><div className="sb-val">{markets.length}</div></div>
              <div className="sb"><div className="sb-lbl">Signals</div><div className="sb-val" style={{ color: G }}>{activeSignals.length}</div></div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button type="button" className={`btn ${isRunning ? 'btn-r' : 'btn-gr'}`} style={{ flex: 1 }} onClick={toggleBot} disabled={isApproving}>
                {isRunning ? <><Square size={13} /> Stop Engine</> : <><Play size={13} /> Start Engine</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => performDeepSync()} disabled={isSyncing}>
                <RefreshCw size={14} className={isSyncing ? 'spinning' : ''} />
              </button>
              <button type="button" className="btn btn-ghost" onClick={clearVault}><Trash2 size={14} /></button>
            </div>

            {parseFloat(usdcBal) > 0 && allowance === 0n && (
              <div className="gc gc-a" style={{ marginBottom: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertCircle size={18} color={AMBER} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 2 }}>CTF Exchange Approval Required</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Approve USDC (native) for Polymarket CTF Exchange — one-time transaction</div>
                  </div>
                  <button type="button" className="btn btn-g" style={{ width: 'auto', padding: '8px 14px' }} onClick={handleApprove} disabled={isApproving || parseFloat(polBal) < 0.01}>
                    {isApproving ? 'Signing...' : 'Approve'}
                  </button>
                </div>
                {parseFloat(polBal) < 0.01 && <div style={{ fontSize: 11, color: RED, marginTop: 8 }}>⚠ Need POL for gas fees to sign the approval</div>}
              </div>
            )}

            {parseFloat(usdcBal) === 0 && (
              <div className="gc" style={{ marginBottom: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <DollarSign size={18} color="rgba(255,255,255,0.25)" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 2 }}>No USDC Balance Detected</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Deposit native USDC (not USDC.e) to this wallet on Polygon. Paper mode works without funds.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="tabs" style={{ marginBottom: 16 }}>
            {[{ k: 'dashboard', l: '⬡ Terminal' }, { k: 'signals', l: '◈ Signals' }, { k: 'settings', l: '⚙ Settings' }].map((tab) => (
              <button key={tab.k} type="button" className={`tab ${activeTab === tab.k ? 'on' : ''}`} onClick={() => setActiveTab(tab.k)}>{tab.l}</button>
            ))}
          </div>

          {activeTab === 'dashboard' && (
            <div className="gc">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`dot ${isRunning ? 'dot-g' : 'dot-a'}`} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', color: isRunning ? GREEN : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Execution Feed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                  <Clock size={12} /> Last sync {lastSync}
                </div>
              </div>
              <p className="term-hint">{t('polymarketBotDetail.executionFeedHint')}</p>
              <div className="term" ref={termScrollRef}>
                {logs.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5 }}>
                    <Activity size={28} style={{ marginBottom: 12, opacity: 0.5, color: G }} />
                    <div>{t('polymarketBotDetail.feedEmpty')}</div>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className={termLineClass(log.type)}>
                      <span className="ltime">{log.time}</span>
                      <span className={`lmsg ${logLineClass(log.type)}`}>{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'signals' && (
            <>
              {activeSignals.length === 0 ? (
                <div className="gc" style={{ textAlign: 'center', padding: 40 }}>
                  <BarChart3 size={34} style={{ margin: '0 auto 12px', color: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>No active signals</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Start the engine to begin scanning</div>
                </div>
              ) : (
                activeSignals.map((s, i) => (
                  <div key={i} className="sig">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className={`p ${s.direction === 'buy' ? 'p-gr' : 'p-r'}`}>{s.direction.toUpperCase()} {s.outcome}</span>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: G, fontWeight: 800 }}>{s.confidence}% conf</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>{s.reason}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                      <span>Entry: {(s.currentPrice * 100).toFixed(1)}%</span>
                      <span>Target: {(s.targetPrice * 100).toFixed(1)}%</span>
                      <span style={{ color: G }}>Size: ${s.suggestedSize.toFixed(0)}</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className={`gc ${isPaperMode ? 'gc-a' : 'gc-gr'}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 4 }}>{isPaperMode ? '📝 Paper Trading' : '💰 Live Trading'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{isPaperMode ? 'Simulated — no real money at risk' : `Real trades · USDC balance: $${usdcBal}`}</div>
                  </div>
                  <button type="button" className={`btn ${isPaperMode ? 'btn-g' : 'btn-r'}`} style={{ width: 'auto', padding: '8px 14px' }} onClick={toggleTradingMode} disabled={isRunning}>
                    {isPaperMode ? 'Go Live' : 'Go Paper'}
                  </button>
                </div>
                {isPaperMode && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="lbl" style={{ marginBottom: 8 }}>{t('polymarketBotDetail.paperBalanceTitle')}</div>
                    <p className="body" style={{ fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
                      {t('polymarketBotDetail.paperBalanceHint')}
                    </p>
                    <div className="g2" style={{ marginBottom: 12 }}>
                      <input
                        className="inp"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label={t('polymarketBotDetail.paperBalanceTitle')}
                        placeholder={t('polymarketBotDetail.paperBalancePlaceholder')}
                        value={paperBalanceDraft}
                        onChange={(e) => setPaperBalanceDraft(e.target.value)}
                        disabled={isRunning}
                        style={{ marginBottom: 0 }}
                      />
                      <button
                        type="button"
                        className="btn btn-g"
                        style={{ padding: '12px 14px' }}
                        onClick={handleApplyPaperBalance}
                        disabled={isRunning}
                      >
                        {t('polymarketBotDetail.applyPaperBalance')}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('polymarketBotDetail.paperBalanceCurrent')}</span>
                      <span style={{ fontWeight: 900, color: AMBER }}>€{paperBalance.toFixed(2)}</span>
                    </div>
                    {isRunning && (
                      <p style={{ marginTop: 10, fontSize: 10, color: AMBER }}>{t('polymarketBotDetail.paperBalanceStopEngine')}</p>
                    )}
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <p style={{ fontSize: 11, color: 'rgba(255,100,100,0.85)', marginBottom: 10, lineHeight: 1.5 }}>
                        {t('polymarketBotDetail.resetPaperDataWarning')}
                      </p>
                      <button
                        type="button"
                        className="btn"
                        disabled={isRunning || isResettingPaperData}
                        onClick={() => void handleResetPaperData()}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'transparent',
                          border: `1px solid ${RED}`,
                          color: RED,
                          fontWeight: 800,
                          fontSize: 11,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isResettingPaperData ? t('common.loading') : t('polymarketBotDetail.resetPaperDataButton')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="gc">
                <div style={{ marginBottom: 14 }}>
                  <div className="lbl" style={{ marginBottom: 6 }}>Connected Wallet</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: G, wordBreak: 'break-all' }}>{address}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>CTF Exchange</span>
                  <span className={`p ${allowance > 0n ? 'p-gr' : 'p-r'}`}>
                    {allowance > 0n ? <><CheckCircle size={10} /> Approved</> : <><AlertCircle size={10} /> Pending</>}
                  </span>
                </div>

                {parseFloat(usdcBal) >= 5 && allowance === 0n && (
                  <div className="gc gc-a" style={{ marginBottom: 14, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: AMBER, marginBottom: 8 }}>⚡ USDC found — one approval needed to unlock live trading</div>
                    <button type="button" className="btn btn-g" style={{ fontSize: 10, width: 'auto', padding: '6px 12px' }} onClick={handleApprove} disabled={isApproving || parseFloat(polBal) < 0.01}>
                      {isApproving ? 'Signing...' : 'Approve USDC for CTF Exchange'}
                    </button>
                  </div>
                )}

                <button type="button" className="btn btn-r" onClick={clearVault}><Trash2 size={13} /> Disconnect Wallet</button>
              </div>
            </div>
          )}
        </div>

        <div className="statusbar">
          <div className="statusbar-inner">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`dot ${isRunning ? 'dot-g' : 'dot-a'}`} />
              {isRunning ? (isPaperMode ? '📝 Paper Trading' : '💰 Live Trading') : 'Engine Ready'}
            </span>
            <span style={{ color: G }}>{isPaperMode ? 'PAPER' : 'LIVE'} · CLOB v2</span>
            <span>v5.1.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

const PolymarketBotDetail: React.FC = () => (
  <ErrorBoundary
    fallbackRender={(error, _info, reset) => (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#050505] text-white">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2 text-[#D4AF37]">Polymarket engine error</h2>
        <p className="text-sm text-white/60 text-center mb-6 max-w-md break-words">{error.message}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl px-6 py-3 font-bold text-[#050505] bg-[#D4AF37] hover:opacity-90"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/income-streams')}
            className="rounded-2xl px-6 py-3 font-bold border border-white/20 text-white/90 hover:bg-white/10"
          >
            Back to income streams
          </button>
        </div>
      </div>
    )}
  >
    <PolymarketBotDetailInner />
  </ErrorBoundary>
);

export default PolymarketBotDetail;
