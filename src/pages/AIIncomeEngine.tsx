import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"

interface BotState {
  status: string
  regime: string
  risk: string
  pnl: number
  trades_today: number
  last_signal: string
}

interface StatProps {
  label: string
  value: string | number
}

function Stat({ label, value }: StatProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AIIncomeEngine() {
  const [bot, setBot] = useState<BotState>({
    status: "ACTIVE",
    regime: "HOT",
    risk: "NORMAL",
    pnl: 0,
    trades_today: 0,
    last_signal: "WAIT",
  })

  // 🔁 SIMULATED LIVE BOT (auto-updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setBot((prev) => ({
        ...prev,
        pnl: +(prev.pnl + (Math.random() - 0.3)).toFixed(2),
        trades_today: prev.trades_today + (Math.random() > 0.7 ? 1 : 0),
        last_signal: Math.random() > 0.6 ? "BUY" : "WAIT",
        regime: Math.random() > 0.8 ? "COLD" : "HOT",
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const pnlData = [
    { t: "Now", v: bot.pnl }
  ]

  return (
    <div className="p-6 space-y-6">
      <motion.h1
        className="text-3xl font-bold text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        AI Income Engine
      </motion.h1>

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          This AI system scans new Solana memecoin launches, tracks whale wallets,
          measures momentum, and only trades during favorable market conditions.
          Students can observe signals and performance live.
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Status" value={bot.status} />
        <Stat label="Market Regime" value={bot.regime} />
        <Stat label="Risk State" value={bot.risk} />
        <Stat label="Trades Today" value={bot.trades_today} />
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-2 text-foreground">Live Strategy PnL (%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={pnlData}>
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-sm text-muted-foreground">Current PnL: {bot.pnl}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Last AI Signal: <strong className="text-foreground">{bot.last_signal}</strong>
        </CardContent>
      </Card>
    </div>
  )
}
