import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { usePhantomWallet } from "@/hooks/usePhantomWallet"
import { 
  Play, 
  Square, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Trophy, 
  XCircle, 
  Percent,
  Flame,
  Target,
  Terminal,
  Settings,
  RefreshCw,
  Zap
} from "lucide-react"

interface BotState {
  balance: number
  startingBalance: number
  pnl: number
  trades: number
  wins: number
  losses: number
  regime: "HOT" | "WARM" | "COLD"
  status: "STOPPED" | "RUNNING"
  lastSignal: "BUY" | "WAIT" | "EXIT"
  log: string[]
  testMode: boolean
  tradeSizeSOL: number
}

export default function AIIncomeEngine() {
  const [botState, setBotState] = useState<BotState>({
    balance: 100,
    startingBalance: 100,
    pnl: 0,
    trades: 0,
    wins: 0,
    losses: 0,
    regime: "HOT",
    status: "STOPPED",
    lastSignal: "WAIT",
    log: [],
    testMode: true,
    tradeSizeSOL: 0.1
  })

  const [tradeSizeInput, setTradeSizeInput] = useState("0.1")
  const [capitalInput, setCapitalInput] = useState("100")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { walletAddress, connectWallet, isConnecting } = usePhantomWallet()

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString()
    setBotState(prev => ({
      ...prev,
      log: [`[${time}] ${message}`, ...prev.log.slice(0, 49)]
    }))
  }, [])

  const botStep = useCallback(() => {
    setBotState(prev => {
      if (prev.status !== "RUNNING") return prev

      // Random regime
      const regimes: ("HOT" | "WARM" | "COLD")[] = ["HOT", "WARM", "COLD"]
      const newRegime = regimes[Math.floor(Math.random() * regimes.length)]

      // Random signal
      const signals: ("BUY" | "WAIT" | "EXIT")[] = ["BUY", "WAIT", "EXIT"]
      const newSignal = signals[Math.floor(Math.random() * signals.length)]

      let newState = { ...prev, regime: newRegime, lastSignal: newSignal }

      // Execute trade in test mode
      if (newSignal === "BUY" && newRegime !== "COLD" && prev.testMode) {
        const change = (Math.random() * 5 - 2) // -2% to +3%
        const newBalance = prev.balance + change
        const newPnl = ((newBalance - prev.startingBalance) / prev.startingBalance) * 100
        const isWin = change > 0

        const time = new Date().toLocaleTimeString()
        const logEntry = `[${time}] ${isWin ? '📈' : '📉'} SIM Trade ${change >= 0 ? '+' : ''}${change.toFixed(2)}% | Balance: $${newBalance.toFixed(2)}`

        newState = {
          ...newState,
          balance: newBalance,
          pnl: newPnl,
          trades: prev.trades + 1,
          wins: isWin ? prev.wins + 1 : prev.wins,
          losses: !isWin ? prev.losses + 1 : prev.losses,
          log: [logEntry, ...prev.log.slice(0, 49)]
        }

        // Auto-stop on drawdown
        if (newPnl <= -15) {
          const stopTime = new Date().toLocaleTimeString()
          newState = {
            ...newState,
            status: "STOPPED",
            log: [`[${stopTime}] 🛑 Hard stop hit (-15%). Bot stopped.`, ...newState.log]
          }
        }
      }

      return newState
    })
  }, [])

  const startBot = useCallback(() => {
    const time = new Date().toLocaleTimeString()
    setBotState(prev => ({
      ...prev,
      status: "RUNNING",
      log: [`[${time}] 🚀 Bot started`, ...prev.log]
    }))
  }, [])

  const stopBot = useCallback(() => {
    const time = new Date().toLocaleTimeString()
    setBotState(prev => ({
      ...prev,
      status: "STOPPED",
      log: [`[${time}] ⏹️ Bot stopped`, ...prev.log]
    }))
  }, [])

  const setTradeSize = useCallback(() => {
    const size = parseFloat(tradeSizeInput)
    if (!isNaN(size) && size > 0) {
      setBotState(prev => ({ ...prev, tradeSizeSOL: size }))
      addLog(`Trade size set to ${size} SOL`)
    }
  }, [tradeSizeInput, addLog])

  const resetCapital = useCallback(() => {
    const capital = parseFloat(capitalInput)
    if (!isNaN(capital) && capital > 0) {
      setBotState(prev => ({
        ...prev,
        balance: capital,
        startingBalance: capital,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        log: [`[${new Date().toLocaleTimeString()}] 🔄 Capital reset to $${capital}`]
      }))
    }
  }, [capitalInput])

  const toggleTestMode = useCallback((checked: boolean) => {
    setBotState(prev => ({ ...prev, testMode: checked }))
    addLog(checked ? "Switched to TEST mode" : "Switched to LIVE mode")
  }, [addLog])

  // Bot loop
  useEffect(() => {
    if (botState.status === "RUNNING") {
      intervalRef.current = setInterval(botStep, 3000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [botState.status, botStep])

  const winRate = botState.trades > 0 ? ((botState.wins / botState.trades) * 100).toFixed(1) : "0.0"

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case "HOT": return "bg-green-600"
      case "WARM": return "bg-yellow-600"
      case "COLD": return "bg-blue-600"
      default: return "bg-muted"
    }
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "BUY": return "bg-green-600"
      case "EXIT": return "bg-red-600"
      case "WAIT": return "bg-yellow-600"
      default: return "bg-muted"
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Solana Trading Bot</h1>
              <p className="text-sm text-muted-foreground">Automated Jupiter Swap Engine</p>
            </div>
          </div>
          <Badge 
            variant={botState.status === "RUNNING" ? "default" : "destructive"}
            className={`${botState.status === "RUNNING" ? "bg-green-600" : "bg-red-600"} text-white`}
          >
            <div className={`h-2 w-2 rounded-full mr-2 ${botState.status === "RUNNING" ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
            {botState.status}
          </Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Balance</p>
                <p className="text-4xl font-mono font-bold text-foreground mb-2">
                  ${botState.balance.toFixed(2)}
                </p>
                <div className="flex items-center gap-2">
                  {botState.pnl >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${botState.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {botState.pnl >= 0 ? "+" : ""}{botState.pnl.toFixed(2)}%
                  </span>
                  <span className="text-sm text-muted-foreground">PnL</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase">Total Trades</p>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{botState.trades}</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase">Wins</p>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">{botState.wins}</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase">Losses</p>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-500">{botState.losses}</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase">Win Rate</p>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className={`text-2xl font-bold ${parseFloat(winRate) >= 50 ? "text-green-500" : "text-red-500"}`}>
                    {winRate}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Regime & Signal */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-3">Market Regime</p>
                  <div className={`${getRegimeColor(botState.regime)} rounded-lg py-3 px-4 flex items-center justify-center gap-2`}>
                    <Flame className="h-5 w-5 text-white" />
                    <span className="text-lg font-bold text-white">{botState.regime}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-3">Last Signal</p>
                  <div className={`${getSignalColor(botState.lastSignal)} rounded-lg py-3 px-4 flex items-center justify-center gap-2`}>
                    <Target className="h-5 w-5 text-white" />
                    <span className="text-lg font-bold text-white">{botState.lastSignal}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Log */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Activity Log</p>
                </div>
                <ScrollArea className="h-64 rounded-lg bg-background/50 p-3">
                  {botState.log.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet. Start the bot to see logs.</p>
                  ) : (
                    <div className="space-y-1 font-mono text-sm">
                      {botState.log.map((entry, i) => (
                        <p key={i} className="text-muted-foreground">{entry}</p>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Controls */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-4">Controls</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Button
                    onClick={startBot}
                    disabled={botState.status === "RUNNING"}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    onClick={stopBot}
                    disabled={botState.status === "STOPPED"}
                    variant="outline"
                    className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
                <Button
                  onClick={connectWallet}
                  disabled={!!walletAddress || isConnecting}
                  variant="outline"
                  className="w-full"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "Connect Phantom"}
                </Button>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Mode:</span>
                  <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-500">
                    {botState.testMode ? "TEST" : "LIVE"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Settings</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="testMode" className="text-sm text-muted-foreground">Test Mode</Label>
                    <Switch
                      id="testMode"
                      checked={botState.testMode}
                      onCheckedChange={toggleTestMode}
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Trade Size (SOL)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={tradeSizeInput}
                        onChange={(e) => setTradeSizeInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" variant="secondary" onClick={setTradeSize}>Set</Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Reset Test Capital ($)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        value={capitalInput}
                        onChange={(e) => setCapitalInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="icon" variant="secondary" onClick={resetCapital}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-3">How it works</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Bot monitors market regime (HOT/WARM/COLD)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Generates BUY/WAIT/EXIT signals
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Auto-stops at -15% drawdown
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Test mode simulates trades safely
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
