import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { usePhantomWallet } from "@/hooks/usePhantomWallet"
import { Wallet, Play, Square, TrendingUp, DollarSign, Calendar } from "lucide-react"

const LANG = {
  en: { start: "Start", stop: "Stop", connect: "Connect Phantom", balance: "Balance", profit: "Total Profit", daily: "Daily Income", admin: "Admin Daily Income", risk: "Risk %", adminDashboard: "Admin Dashboard", feeRate: "Fee Rate" },
  sv: { start: "Starta", stop: "Stoppa", connect: "Anslut Phantom", balance: "Saldo", profit: "Total Vinst", daily: "Daglig Inkomst", admin: "Admin Daglig Inkomst", risk: "Risk %", adminDashboard: "Admin Dashboard", feeRate: "Avgift" },
  no: { start: "Start", stop: "Stopp", connect: "Koble Phantom", balance: "Saldo", profit: "Total Profitt", daily: "Daglig Inntekt", admin: "Admin Daglig Inntekt", risk: "Risiko %", adminDashboard: "Admin Dashboard", feeRate: "Gebyr" },
  es: { start: "Iniciar", stop: "Detener", connect: "Conectar Phantom", balance: "Saldo", profit: "Ganancia Total", daily: "Ingreso Diario", admin: "Ingreso Diario Admin", risk: "Riesgo %", adminDashboard: "Panel de Admin", feeRate: "Tarifa" }
}

type LangKey = keyof typeof LANG

const ADMIN_FEE = 0.1111

export default function AIIncomeEngine() {
  const [lang, setLang] = useState<LangKey>("en")
  const [balance, setBalance] = useState(0)
  const [totalPnl, setTotalPnl] = useState(0)
  const [running, setRunning] = useState(false)
  const [risk, setRisk] = useState(5)

  const [studentDaily, setStudentDaily] = useState(0)
  const [adminDaily, setAdminDaily] = useState(0)
  const [dayStamp, setDayStamp] = useState(new Date().toDateString())

  const { walletAddress, connectWallet, isConnecting } = usePhantomWallet()

  // Auto language detection
  useEffect(() => {
    const l = navigator.language.slice(0, 2) as LangKey
    if (LANG[l]) setLang(l)
  }, [])

  // Reset daily counters every new day
  useEffect(() => {
    const today = new Date().toDateString()
    if (today !== dayStamp) {
      setStudentDaily(0)
      setAdminDaily(0)
      setDayStamp(today)
    }
  })

  // Live balance sync from Solana
  useEffect(() => {
    if (!walletAddress) return

    const fetchBalance = async () => {
      try {
        const response = await fetch(`https://api.mainnet-beta.solana.com`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [walletAddress]
          })
        })
        const data = await response.json()
        if (data.result?.value) {
          setBalance(data.result.value / 1e9)
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 5000)
    return () => clearInterval(interval)
  }, [walletAddress])

  // Bot loop with PROFIT SPLIT
  useEffect(() => {
    if (!running || !walletAddress) return

    const interval = setInterval(() => {
      const tradeSize = balance * (risk / 100)
      const tradeResult = tradeSize * (Math.random() - 0.45)

      if (tradeResult > 0) {
        const adminCut = tradeResult * ADMIN_FEE
        const studentCut = tradeResult - adminCut

        setAdminDaily(a => a + adminCut)
        setStudentDaily(s => s + studentCut)
      }

      setBalance(b => b + tradeResult)
      setTotalPnl(p => p + tradeResult)
    }, 4000)

    return () => clearInterval(interval)
  }, [running, balance, walletAddress, risk])

  const t = LANG[lang]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">AI Income Engine</h1>
        <Select value={lang} onValueChange={(v) => setLang(v as LangKey)}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(LANG).map(l => (
              <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">{t.balance}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{balance.toFixed(4)} SOL</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">{t.profit}</span>
            </div>
            <p className={`text-lg font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnl.toFixed(4)} SOL
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{t.daily}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{studentDaily.toFixed(4)} SOL</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">{t.risk}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{risk}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="risk" className="text-foreground">{t.risk}</Label>
            <Input
              id="risk"
              type="number"
              min={1}
              max={15}
              value={risk}
              onChange={(e) => setRisk(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={connectWallet}
              disabled={!!walletAddress || isConnecting}
              variant="outline"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : t.connect}
            </Button>

            <Button
              onClick={() => setRunning(true)}
              disabled={!walletAddress || running}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {t.start}
            </Button>

            <Button
              onClick={() => setRunning(false)}
              disabled={!running}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              {t.stop}
            </Button>
          </div>

          {running && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-green-500"
            >
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Bot Active</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Admin Dashboard */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <h2 className="font-semibold text-foreground mb-4">{t.adminDashboard}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t.admin}</p>
              <p className="text-lg font-bold text-foreground">{adminDaily.toFixed(4)} SOL</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.feeRate}</p>
              <p className="text-lg font-bold text-foreground">11.11%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Note: This is a <strong className="text-foreground">simulated bot</strong>. No real trades are executed. Students observe performance for educational purposes.
        </CardContent>
      </Card>
    </div>
  )
}
