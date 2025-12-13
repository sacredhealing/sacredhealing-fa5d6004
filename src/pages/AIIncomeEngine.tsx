import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"

const pnlData = [
  { time: "Day 1", pnl: 0 },
  { time: "Day 2", pnl: 4 },
  { time: "Day 3", pnl: 7 },
  { time: "Day 4", pnl: 5 },
  { time: "Day 5", pnl: 12 },
]

export default function AIIncomeEngine() {
  return (
    <div className="p-6 space-y-6">
      <motion.h1
        className="text-3xl font-bold text-foreground"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        AI Memecoin Income Engine
      </motion.h1>

      {/* WHAT IT IS */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">What This Is</h2>
          <p className="text-sm text-muted-foreground">
            This is a fully automated AI trading system that scans new Solana
            memecoin launches, tracks whale wallets, measures momentum, and
            executes trades only during favorable market conditions.
          </p>
          <p className="text-sm text-muted-foreground">
            Trades are protected with strict risk management, MEV-resistant
            execution, and automatic shutdown during bad market regimes.
          </p>
        </CardContent>
      </Card>

      {/* HOW TO JOIN */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">How Students Participate</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>No wallet connection required</li>
            <li>No funds deposited into this app</li>
            <li>View live performance, signals, and risk state</li>
            <li>Optionally mirror trades manually on your own wallet</li>
          </ul>
        </CardContent>
      </Card>

      {/* LIVE STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Bot Status</p>
            <p className="text-lg font-bold text-green-600">ACTIVE</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Market Regime</p>
            <p className="text-lg font-bold text-foreground">HOT</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Risk State</p>
            <p className="text-lg font-bold text-foreground">NORMAL</p>
          </CardContent>
        </Card>
      </div>

      {/* PNL CHART */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Strategy Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={pnlData}>
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            This dashboard updates in real time as the AI system trades.
          </p>
          <Button>Learn How This System Works</Button>
        </CardContent>
      </Card>
    </div>
  )
}
