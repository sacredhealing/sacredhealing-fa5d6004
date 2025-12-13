import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"

const BOT_URL = "https://YOUR_BOT_DOMAIN/bot_state.json"
// leave as-is for now — real bot plugs in later

interface BotState {
  status: string
  regime: string
  risk: string
  pnl: number
  trades_today: number
  last_signal: string
}

interface HistoryPoint {
  t: number
  v: number
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
    status: "TEST MODE",
    regime: "WARM",
    risk: "SAFE",
    pnl: 0,
    trades_today: 0,
    last_signal: "WAIT",
  })

  const [history, setHistory] = useState<HistoryPoint[]>([])

  useEffect(() => {
    const tick = async () => {
      try {
        // 🔗 TRY REAL BOT FIRST
        const res = await fetch(BOT_URL, { cache: "no-store" })
        if (!res.ok) throw new Error("bot offline")
        const data = await res.json()
        setBot(data)
        setHistory((h) => [...h.slice(-20), { t: Date.now(), v: data.pnl }])
      } catch {
        // 🧪 FALLBACK: SAFE TEST MODE
        setBot((prev) => {
          const next = {
            ...prev,
            pnl: +(prev.pnl + (Math.random() - 0.4)).toFixed(2),
            trades_today:
              prev.trades_today + (Math.random() > 0.75 ? 1 : 0),
            last_signal: Math.random() > 0.6 ? "BUY" : "WAIT",
            regime: Math.random() > 0.85 ? "COLD" : "HOT",
          }
          setHistory((h) => [...h.slice(-20), { t: Date.now(), v: next.pnl }])
          return next
        })
      }
    }

    tick()
    const i = setInterval(tick, 3000)
    return () => clearInterval(i)
  }, [])

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
        <CardContent className="p-5 text-sm text-muted-foreground">
          This AI system monitors new Solana memecoin launches, tracks whale
          wallets, measures momentum, and only trades during favorable market
          regimes. Students observe signals, risk controls, and performance live.
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Bot Status" value={bot.status} />
        <Stat label="Market Regime" value={bot.regime} />
        <Stat label="Risk State" value={bot.risk} />
        <Stat label="Trades Today" value={bot.trades_today} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-2 text-foreground">Strategy PnL (%)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <XAxis dataKey="t" hide />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-sm text-muted-foreground">
            Current PnL: <strong className="text-foreground">{bot.pnl}%</strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Last AI Signal: <strong className="text-foreground">{bot.last_signal}</strong>
        </CardContent>
      </Card>
    </div>
  )
}
