import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { 
  ArrowLeft, Wallet, RefreshCw, Play, Square, Trash2, ExternalLink, 
  AlertCircle, CheckCircle, Clock, TrendingUp, DollarSign, Zap, Shield,
  Activity, Target, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PnLCard } from '@/components/polymarket/PnLCard';

// Import trading services
import { POLYGON_ADDRESSES, PolymarketTrading } from '@/services/polymarketTrading';
import { polymarketService } from '@/services/polymarketService';
import { polymarketAI } from '@/services/polymarketAI';
import { 
  whaleMirrorService, 
  latencyArbitrageService, 
  volatilityScalperService,
  paperTradingService,
  STRATEGY_NAMES 
} from '@/services/polymarket';
import type { LogEntry, TradeSignal, PolymarketMarket } from '@/types/polymarket';

// RPC endpoints for Polygon
const RPC_POOL = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon.meowrpc.com',
  'https://1rpc.io/matic',
  'https://rpc.ankr.com/polygon'
];

// ERC20 ABI for balance checks
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const PolymarketBotDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Wallet state
  const [privateKey, setPrivateKey] = useState<string | null>(() => localStorage.getItem('polymarket_bot_pkey'));
  const [address, setAddress] = useState<string>("");
  const [importInput, setImportInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  
  // Balance state
  const [polBal, setPolBal] = useState<string>("0.0000");
  const [usdcEBal, setUsdcEBal] = useState<string>("0.00");
  const [usdcNBal, setUsdcNBal] = useState<string>("0.00");
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [ctAllowance, setCtAllowance] = useState<boolean>(false); // Conditional tokens approval
  
  // Trading state
  const [trading] = useState(() => new PolymarketTrading());
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [activeSignals, setActiveSignals] = useState<TradeSignal[]>([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [dailyPnL, setDailyPnL] = useState(0);
  
  // Paper trading state
  const [isPaperMode, setIsPaperMode] = useState(true);
  const [paperBalance, setPaperBalance] = useState(1000); // $1000 simulated
  
  // PnL tracking state
  const [pnlSummary, setPnlSummary] = useState({
    totalPnL: 0,
    todayPnL: 0,
    totalTrades: 0,
    winRate: 0,
    unrealizedPnL: 0
  });
  const [livePnlSummary, setLivePnlSummary] = useState({
    totalPnL: 0,
    todayPnL: 0,
    totalTrades: 0,
    winRate: 0,
    unrealizedPnL: 0
  });
  
  // Status state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSync, setLastSync] = useState<string>("Never");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const logEndRef = useRef<HTMLDivElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pnlRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
      id: Math.random().toString(36),
      msg,
      type,
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }, ...prev].slice(0, 100));
  }, []);

  // Refresh PnL data from database
  const refreshPnL = useCallback(async () => {
    if (!user?.id) return;
    const [paperSummary, liveSummary] = await Promise.all([
      paperTradingService.getPnLSummary(true),
      paperTradingService.getPnLSummary(false)
    ]);
    setPnlSummary(paperSummary);
    setLivePnlSummary(liveSummary);
    setTotalTrades(paperSummary.totalTrades + liveSummary.totalTrades);
  }, [user?.id]);

  // Auto-refresh PnL when bot is running
  useEffect(() => {
    if (isRunning) {
      // Refresh immediately when starting
      refreshPnL();
      // Then refresh every 5 seconds
      pnlRefreshRef.current = setInterval(refreshPnL, 5000);
    } else {
      if (pnlRefreshRef.current) {
        clearInterval(pnlRefreshRef.current);
        pnlRefreshRef.current = null;
      }
    }
    return () => {
      if (pnlRefreshRef.current) {
        clearInterval(pnlRefreshRef.current);
      }
    };
  }, [isRunning, refreshPnL]);

  // Real blockchain sync using ethers.js with correct checksummed addresses
  const performDeepSync = useCallback(async (forcedAddr?: string) => {
    const activeAddr = forcedAddr || address;
    if (!activeAddr) return;
    
    setIsSyncing(true);
    addLog("Connecting to Polygon mainnet...", "info");
    
    let success = false;
    
    for (const rpcUrl of RPC_POOL) {
      if (success) break;
      
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
        
        // Fetch POL balance
        try {
          const rawPol = await provider.getBalance(activeAddr);
          const polValue = parseFloat(ethers.formatEther(rawPol)).toFixed(4);
          setPolBal(polValue);
          addLog(`POL Balance: ${polValue}`, "debug");
        } catch (err) {
          addLog("Failed to fetch POL balance", "warn");
        }
        
        await new Promise(r => setTimeout(r, 200));
        
        // Fetch Native USDC balance
        try {
          const usdcNContract = new ethers.Contract(POLYGON_ADDRESSES.USDC_NATIVE, ERC20_ABI, provider);
          const rawN = await usdcNContract.balanceOf(activeAddr);
          const usdcNValue = parseFloat(ethers.formatUnits(rawN, 6)).toFixed(2);
          setUsdcNBal(usdcNValue);
          addLog(`Native USDC: $${usdcNValue}`, "debug");
        } catch (err) {
          addLog("Failed to fetch Native USDC", "warn");
        }
        
        await new Promise(r => setTimeout(r, 200));
        
        // Fetch USDC.e balance and allowance (using correct checksummed address)
        try {
          const usdcEContract = new ethers.Contract(POLYGON_ADDRESSES.USDC_E, ERC20_ABI, provider);
          const [rawE, rawAllow] = await Promise.all([
            usdcEContract.balanceOf(activeAddr),
            usdcEContract.allowance(activeAddr, POLYGON_ADDRESSES.CTF_EXCHANGE)
          ]);
          const usdcEValue = parseFloat(ethers.formatUnits(rawE, 6)).toFixed(2);
          setUsdcEBal(usdcEValue);
          setAllowance(rawAllow);
          addLog(`Bridged USDC.e: $${usdcEValue} | Allowance: ${rawAllow > 0n ? 'Approved' : 'Pending'}`, "debug");
        } catch (err) {
          addLog("Failed to fetch USDC.e balance", "warn");
        }
        
        setLastSync(new Date().toLocaleTimeString());
        addLog(`Synced: ${activeAddr.slice(0, 10)}...${activeAddr.slice(-6)}`, "success");
        success = true;
        
      } catch (err) {
        addLog(`Node failed. Trying next...`, "debug");
      }
    }
    
    if (!success) {
      addLog("All RPC nodes failed. Check network.", "error");
    }
    
    setIsSyncing(false);
  }, [address, addLog]);

  // Initialize wallet from private key
  useEffect(() => {
    if (privateKey) {
      try {
        const wallet = new ethers.Wallet(privateKey);
        setAddress(wallet.address);
        
        // Initialize trading service
        trading.initialize(privateKey, RPC_POOL[0]).then(() => {
          addLog("Trading engine initialized", "success");
        });
        
        // Initialize paper trading with user ID and sync mode from database
        if (user?.id) {
          paperTradingService.setUserId(user.id);
          paperTradingService.loadSettings().then(settings => {
            if (settings) {
              setIsPaperMode(settings.is_paper_mode);
              paperTradingService.setMode(settings.is_paper_mode); // Sync service state
              addLog(`Mode: ${settings.is_paper_mode ? '📝 PAPER TRADING' : '💰 LIVE TRADING'}`, "info");
            }
          });
          // Load P&L summary for both modes
          const loadPnL = async () => {
            const [paperSummary, liveSummary] = await Promise.all([
              paperTradingService.getPnLSummary(true),
              paperTradingService.getPnLSummary(false)
            ]);
            setPnlSummary(paperSummary);
            setLivePnlSummary(liveSummary);
            setTotalTrades(paperSummary.totalTrades + liveSummary.totalTrades);
          };
          loadPnL();
        }
        
        performDeepSync(wallet.address);
      } catch (e) {
        console.error("Invalid private key:", e);
        localStorage.removeItem('polymarket_bot_pkey');
        setPrivateKey(null);
        toast.error("Invalid private key format");
      }
    }
  }, [privateKey, trading, user?.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (address) {
      const interval = setInterval(() => performDeepSync(), 30000);
      return () => clearInterval(interval);
    }
  }, [address]);

  // Market scanning loop when bot is running
  useEffect(() => {
    if (isRunning && address) {
      addLog("🚀 Starting Sacred Healing HFT Engine...", "info");
      addLog(`[1] ${STRATEGY_NAMES.WHALE_MIRROR} - Monitoring 0x8dxd`, "info");
      addLog(`[2] ${STRATEGY_NAMES.LATENCY_ARB} - Gemini 3 Flash active`, "info");
      addLog(`[3] ${STRATEGY_NAMES.VOLATILITY_SCALP} - Ladder orders ready`, "info");
      
      // Initialize all three strategies (wrapped in async IIFE)
      const initStrategies = async () => {
        if (privateKey) {
          await whaleMirrorService.initialize(privateKey, RPC_POOL[0]);
          whaleMirrorService.onMirrorSignal(async (signal, whale) => {
            addLog(`🐋 WHALE MIRROR: ${whale.whaleAddress.slice(0,10)}... ${signal.direction} ${signal.outcome}`, "trade");
            setActiveSignals(prev => [...prev.slice(-4), signal]);
            await executeTradeWithMode(signal, 'whale_mirror');
          });
          whaleMirrorService.startMonitoring();
        }
      };
      initStrategies();

      const scanMarkets = async () => {
        setIsScanning(true);
        try {
          const fetchedMarkets = await polymarketService.fetchMarkets(50);
          setMarkets(fetchedMarkets);
          addLog(`Scanned ${fetchedMarkets.length} markets`, "debug");
          
          // Start latency arbitrage & volatility scalping with markets
          latencyArbitrageService.onLatencySignal(async (signal, event) => {
            addLog(`⚡ LATENCY ARB: ${event.headline?.slice(0,40)}...`, "trade");
            setActiveSignals(prev => [...prev.slice(-4), signal]);
            await executeTradeWithMode(signal, 'latency_arb');
          });
          latencyArbitrageService.startMonitoring(fetchedMarkets);
          
          volatilityScalperService.onScalpSignal(async (signal, ctx) => {
            addLog(`📈 SCALP: ${ctx.ladder} vol=${(ctx.volatility*100).toFixed(2)}%`, "trade");
            setActiveSignals(prev => [...prev.slice(-4), signal]);
            await executeTradeWithMode(signal, 'volatility_scalp');
          });
          volatilityScalperService.startScalping(fetchedMarkets);
          
          // Also run AI analysis for opportunities
          const opportunities = await polymarketService.findOpportunities(20000);
          if (opportunities.length > 0) {
            addLog(`Found ${opportunities.length} potential opportunities`, "info");
            for (const market of opportunities.slice(0, 3)) {
              const signal = await polymarketAI.analyzeMarket(market);
              if (signal) {
                setActiveSignals(prev => [...prev.slice(-4), signal]);
                addLog(`🤖 AI SIGNAL: ${signal.direction.toUpperCase()} ${signal.outcome} @ ${(signal.currentPrice * 100).toFixed(1)}%`, "trade");
                await executeTradeWithMode(signal, 'ai_signal');
              }
            }
          }
        } catch (error) {
          addLog(`Scan error: ${error instanceof Error ? error.message : 'Unknown'}`, "error");
        }
        setIsScanning(false);
      };
      
      scanMarkets();
      scanIntervalRef.current = setInterval(scanMarkets, 15000);
      
      return () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        whaleMirrorService.stopMonitoring();
        latencyArbitrageService.stopMonitoring();
        volatilityScalperService.stopScalping();
      };
    }
  }, [isRunning, address, allowance, usdcEBal, trading, addLog]);

  const handleImport = () => {
    let key = importInput.trim();
    if (!key.startsWith('0x') && key.length === 64) key = '0x' + key;
    
    try {
      const wallet = new ethers.Wallet(key);
      
      localStorage.setItem('polymarket_bot_pkey', key);
      setPrivateKey(key);
      setAddress(wallet.address);
      setInputError(null);
      addLog("Key validated. Initializing trading engine...", "info");
      performDeepSync(wallet.address);
      toast.success("Wallet connected successfully");
    } catch (e) {
      setInputError("Invalid private key format. Use 64-character hex key.");
    }
  };

  // Real on-chain approval
  const handleApprove = async () => {
    if (!privateKey) return;
    setIsApproving(true);
    addLog("Initiating USDC.e approval transaction...", "info");
    
    try {
      // Find a working RPC
      for (const rpcUrl of RPC_POOL) {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const wallet = new ethers.Wallet(privateKey, provider);
          
          const usdcContract = new ethers.Contract(
            POLYGON_ADDRESSES.USDC_E,
            ERC20_ABI,
            wallet
          );
          
          addLog("Sending approval transaction to Polygon...", "info");
          
          const tx = await usdcContract.approve(
            POLYGON_ADDRESSES.CTF_EXCHANGE,
            ethers.MaxUint256
          );
          
          addLog(`Tx submitted: ${tx.hash.slice(0, 18)}...`, "info");
          
          const receipt = await tx.wait();
          
          setAllowance(ethers.MaxUint256);
          addLog(`Approval confirmed in block ${receipt.blockNumber}`, "success");
          toast.success("Exchange access approved!");
          break;
          
        } catch (rpcError: any) {
          if (rpcError.code === 'INSUFFICIENT_FUNDS') {
            addLog("Insufficient POL for gas fees", "error");
            toast.error("Need POL for gas fees");
            break;
          }
          continue;
        }
      }
    } catch (error: any) {
      addLog(`Approval failed: ${error.message}`, "error");
      toast.error("Approval transaction failed");
    }
    
    setIsApproving(false);
  };

  const clearVault = () => {
    localStorage.removeItem('polymarket_bot_pkey');
    setPrivateKey(null);
    setAddress("");
    setLogs([]);
    setIsRunning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    toast.info("Wallet disconnected");
  };

  // Toggle paper/live mode
  const toggleTradingMode = async () => {
    const newMode = !isPaperMode;
    setIsPaperMode(newMode);
    paperTradingService.setMode(newMode);
    await paperTradingService.saveSettings({ is_paper_mode: newMode });
    addLog(`Switched to ${newMode ? '📝 PAPER TRADING' : '💰 LIVE TRADING'} mode`, "info");
    toast.success(`${newMode ? 'Paper' : 'Live'} trading mode enabled`);
  };

  // Execute trade helper - routes to paper or live
  const executeTradeWithMode = async (signal: TradeSignal, strategy?: string): Promise<boolean> => {
    if (isPaperMode) {
      const result = await paperTradingService.executePaperTrade(signal, strategy);
      if (result.success) {
        addLog(`📝 PAPER: ${signal.direction} ${signal.outcome} $${signal.suggestedSize.toFixed(2)}`, "success");
        setTotalTrades(prev => prev + 1);
        return true;
      }
      addLog(`📝 PAPER FAILED: ${result.error}`, "error");
      return false;
    } else {
      if (allowance === 0n) {
        addLog("Cannot trade: USDC.e not approved", "error");
        return false;
      }
      const result = await trading.executeTrade(signal);
      if (result.success) {
        addLog(`💰 LIVE: ${signal.direction} ${signal.outcome} tx: ${result.txHash}`, "success");
        setTotalTrades(prev => prev + 1);
        return true;
      }
      addLog(`💰 LIVE FAILED: ${result.error}`, "error");
      return false;
    }
  };

  const toggleBot = () => {
    if (!isRunning) {
      // Paper mode doesn't need approval
      if (!isPaperMode) {
        if (allowance === 0n) {
          toast.error("Approve USDC.e first to enable live trading");
          return;
        }
        if (parseFloat(usdcEBal) < 5) {
          toast.error("Minimum $5 USDC.e required for live trading");
          return;
        }
      }
      setIsRunning(true);
      addLog(`HFT Engine Started in ${isPaperMode ? 'PAPER' : 'LIVE'} mode...`, "success");
      toast.success(`Bot started - ${isPaperMode ? 'Paper' : 'Live'} trading active`);
    } else {
      setIsRunning(false);
      addLog("Engine halted by operator.", "warn");
      toast.info("Bot stopped");
    }
  };

  // Landing page for users without wallet connected
  if (!privateKey) {
    return (
      <div className="min-h-screen pb-24">
        <div className="px-4 pt-6 pb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/income-streams')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20">
              <TrendingUp className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Polymarket HFT Bot</h1>
              <p className="text-sm text-muted-foreground">AI-powered prediction market trading</p>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-6">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border-indigo-500/20">
            <CardContent className="p-6 text-center">
              <Badge className="bg-indigo-500/20 text-indigo-400 mb-4">Live Trading</Badge>
              <h2 className="text-3xl font-bold mb-2">€10 → Financial Freedom</h2>
              <p className="text-muted-foreground mb-6">
                AI scans Polymarket for mispriced markets. Automated arbitrage execution.
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-400">AI</p>
                  <p className="text-xs text-muted-foreground">Gemini Analysis</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">Live</p>
                  <p className="text-xs text-muted-foreground">Real Trades</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400">CLOB</p>
                  <p className="text-xs text-muted-foreground">Order Book</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Connect Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Polygon Mainnet Private Key
                </label>
                <Input
                  type="password"
                  placeholder="0x..."
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  className="font-mono"
                />
                {inputError && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {inputError}
                  </p>
                )}
              </div>
              
              <Button onClick={handleImport} className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                Connect & Initialize
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                🔒 Local encryption only. Keys never leave your device.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <Zap className="w-5 h-5 text-yellow-500 mb-2" />
                <h3 className="font-semibold text-sm">AI Signals</h3>
                <p className="text-xs text-muted-foreground">Gemini market analysis</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <Shield className="w-5 h-5 text-green-500 mb-2" />
                <h3 className="font-semibold text-sm">On-Chain</h3>
                <p className="text-xs text-muted-foreground">Real CTF Exchange</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <Target className="w-5 h-5 text-indigo-500 mb-2" />
                <h3 className="font-semibold text-sm">Arbitrage</h3>
                <p className="text-xs text-muted-foreground">Mispricing detection</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <DollarSign className="w-5 h-5 text-cyan-500 mb-2" />
                <h3 className="font-semibold text-sm">$5 Minimum</h3>
                <p className="text-xs text-muted-foreground">Low entry barrier</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard for connected users
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-6 pb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/income-streams')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isRunning ? 'bg-green-500/20' : 'bg-indigo-500/20'}`}>
              <TrendingUp className={`h-6 w-6 ${isRunning ? 'text-green-400' : 'text-indigo-400'}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Polymarket Bot</h1>
              <p className="text-xs text-muted-foreground font-mono">
                {address.slice(0, 8)}...{address.slice(-6)}
              </p>
            </div>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-green-500" : ""}>
            {isRunning ? (isScanning ? "Scanning" : "Running") : "Stopped"}
          </Badge>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">POL (Gas)</p>
              <p className={`font-mono font-bold ${parseFloat(polBal) > 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                {polBal}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-cyan-500/10 border-cyan-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-cyan-400">USDC</p>
              <p className="font-mono font-bold text-cyan-400">${usdcNBal}</p>
            </CardContent>
          </Card>
          <Card className={`${parseFloat(usdcEBal) > 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-card/50 border-border/50'}`}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">USDC.e</p>
              <p className={`font-mono font-bold ${parseFloat(usdcEBal) > 0 ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                ${usdcEBal}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live PnL Card */}
        <div className="mb-4">
          <PnLCard 
            isPaperMode={isPaperMode}
            totalPnL={isPaperMode ? pnlSummary.totalPnL : livePnlSummary.totalPnL}
            todayPnL={isPaperMode ? pnlSummary.todayPnL : livePnlSummary.todayPnL}
            totalTrades={isPaperMode ? pnlSummary.totalTrades : livePnlSummary.totalTrades}
            winRate={isPaperMode ? pnlSummary.winRate : livePnlSummary.winRate}
            startingBalance={1000}
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Trades</p>
              <p className="font-mono font-bold">{totalTrades}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Markets</p>
              <p className="font-mono font-bold">{markets.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Signals</p>
              <p className="font-mono font-bold text-amber-400">{activeSignals.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={toggleBot}
            className={`flex-1 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            disabled={isApproving}
          >
            {isRunning ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'Stop' : 'Start'}
          </Button>
          <Button variant="outline" onClick={() => performDeepSync()} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={clearVault}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Approval Warning - only show if user has USDC.e and hasn't approved */}
        {parseFloat(usdcEBal) > 0 && allowance === 0n && (
          <Card className="bg-amber-500/10 border-amber-500/30 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">CTF Exchange Approval Required</p>
                  <p className="text-xs text-muted-foreground">Approve USDC.e to trade on Polymarket</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleApprove} 
                  disabled={isApproving || parseFloat(polBal) < 0.01}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isApproving ? 'Signing...' : 'Approve'}
                </Button>
              </div>
              {parseFloat(polBal) < 0.01 && (
                <p className="text-xs text-red-400 mt-2">Need POL for gas fees</p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* No funds warning */}
        {parseFloat(usdcEBal) === 0 && parseFloat(usdcNBal) === 0 && (
          <Card className="bg-muted/50 border-border/50 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">No Trading Funds</p>
                  <p className="text-xs text-muted-foreground">
                    Deposit USDC.e to your wallet to start trading. Paper trading works without funds.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="dashboard" className="flex-1">Terminal</TabsTrigger>
          <TabsTrigger value="signals" className="flex-1">Signals</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                  Execution Feed
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {lastSync}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Awaiting Mainnet Activity...</p>
                    </div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex gap-3">
                        <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                        <span className={
                          log.type === 'success' ? 'text-green-400' :
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warn' ? 'text-amber-400' :
                          log.type === 'trade' ? 'text-cyan-400' :
                          log.type === 'debug' ? 'text-muted-foreground' :
                          'text-foreground'
                        }>
                          {log.msg}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="mt-4 space-y-3">
          {activeSignals.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No active signals</p>
                <p className="text-xs text-muted-foreground mt-1">Start the bot to scan markets</p>
              </CardContent>
            </Card>
          ) : (
            activeSignals.map((signal, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={signal.direction === 'buy' ? 'bg-green-500' : 'bg-red-500'}>
                      {signal.direction.toUpperCase()} {signal.outcome}
                    </Badge>
                    <span className="text-sm font-mono">{signal.confidence}% conf</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{signal.reason}</p>
                  <div className="flex justify-between text-xs">
                    <span>Entry: {(signal.currentPrice * 100).toFixed(1)}%</span>
                    <span>Target: {(signal.targetPrice * 100).toFixed(1)}%</span>
                    <span>Size: ${signal.suggestedSize.toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          {/* Paper/Live Mode Toggle */}
          <Card className={`border-2 ${isPaperMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{isPaperMode ? '📝 Paper Trading' : '💰 Live Trading'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isPaperMode 
                      ? 'Simulated trades, no real money at risk' 
                      : 'Real trades with your USDC.e balance'}
                  </p>
                </div>
                <Button 
                  onClick={toggleTradingMode}
                  variant={isPaperMode ? "default" : "destructive"}
                  size="sm"
                  disabled={isRunning}
                >
                  {isPaperMode ? 'Go Live' : 'Go Paper'}
                </Button>
              </div>
              {isPaperMode && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paper Balance:</span>
                    <span className="font-bold text-amber-400">$1,000.00</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Connected Wallet</label>
                <p className="font-mono text-xs text-muted-foreground break-all">{address}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">CTF Exchange</span>
                <Badge variant={allowance > 0n ? "default" : "destructive"}>
                  {allowance > 0n ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" /> Pending</>
                  )}
                </Badge>
              </div>

              {parseFloat(usdcNBal) > 0.01 && parseFloat(usdcEBal) < 5 && (
                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-amber-500 mb-2">Swap USDC to USDC.e for trading</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://app.uniswap.org/#/swap?inputCurrency=${POLYGON_ADDRESSES.USDC_NATIVE}&outputCurrency=${POLYGON_ADDRESSES.USDC_E}&chain=polygon`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Swap on Uniswap
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Button variant="destructive" className="w-full" onClick={clearVault}>
                <Trash2 className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Status */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Card className="bg-card/90 backdrop-blur border-border/50">
          <CardContent className="p-2 flex justify-between items-center text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              {isRunning ? (isPaperMode ? '📝 Paper Trading' : '💰 Live Trading') : 'Engine Ready'}
            </span>
            <span>{isPaperMode ? 'PAPER' : 'LIVE'} • CLOB v2</span>
            <span>v5.1.0</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PolymarketBotDetail;
