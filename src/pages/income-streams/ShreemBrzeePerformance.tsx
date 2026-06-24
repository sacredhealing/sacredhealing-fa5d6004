import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const GOLD  = "#D4AF37";
const GREEN = "#10b981";
const RED   = "#ef4444";
const CYAN  = "#22D3EE";
const GRAY  = "rgba(255,255,255,0.4)";
const CARD  = "rgba(255,255,255,0.03)";
const BORDER= "rgba(255,255,255,0.06)";

const fmt  = (n: number) => n >= 0 ? `+${n.toFixed(4)}` : n.toFixed(4);
const fmtE = (n: number, rate: number) => `€${(Math.abs(n) * rate).toFixed(2)}`;
const ago  = (dt: string) => {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
};

async function getEurRate(): Promise<number> {
  try {
    const [s, fx] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT").then(r=>r.json()),
      fetch("https://api.exchangerate-api.com/v4/latest/USD").then(r=>r.json()),
    ]);
    return (parseFloat(s.price)||68) * (fx?.rates?.EUR||0.92);
  } catch { return 62.56; }
}

interface Trade {
  id: string;
  symbol: string;
  label: string;
  mint: string;
  action: string;
  status: string;
  sell_reason: string;
  pnl_sol: number;
  pnl_pct: number;
  amount_sol: number;
  opened_at: string;
  closed_at: string;
  tx_sig: string;
  tx_sig_close: string;
}

interface PeriodStats {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
}

function calcStats(trades: Trade[]): PeriodStats {
  const closed = trades.filter(t => t.status === 'closed' && t.pnl_sol !== null);
  const wins = closed.filter(t => t.pnl_sol > 0);
  const losses = closed.filter(t => t.pnl_sol <= 0);
  const pnl = closed.reduce((s, t) => s + (t.pnl_sol || 0), 0);
  return {
    trades: closed.length,
    wins: wins.length,
    losses: losses.length,
    pnl,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.pnl_pct || 0)) : 0,
    worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.pnl_pct || 0)) : 0,
    avgWin: wins.length > 0 ? wins.reduce((s,t) => s + (t.pnl_sol||0), 0) / wins.length : 0,
    avgLoss: losses.length > 0 ? losses.reduce((s,t) => s + (t.pnl_sol||0), 0) / losses.length : 0,
  };
}

export default function ShreemBrzeePerformance() {
  const nav = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [eurPerSol, setEurPerSol] = useState(62.56);
  const [period, setPeriod] = useState<'today'|'week'|'month'|'all'>('today');
  const [filter, setFilter] = useState<'all'|'wins'|'losses'|'stuck'>('all');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview'|'trades'|'whales'>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, rate] = await Promise.all([
      supabase.from('shreem_brzee_live_trades')
        .select('*')
        .order('opened_at', { ascending: false })
        .limit(500),
      getEurRate()
    ]);
    setTrades((data as Trade[]) || []);
    setEurPerSol(rate);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter by period
  const now = Date.now();
  const periodTrades = trades.filter(t => {
    if (!t.opened_at) return false;
    const age = now - new Date(t.opened_at).getTime();
    if (period === 'today') return age < 86400000;
    if (period === 'week')  return age < 604800000;
    if (period === 'month') return age < 2592000000;
    return true;
  });

  // Filter by type
  const displayTrades = periodTrades.filter(t => {
    if (filter === 'wins')   return t.pnl_sol > 0;
    if (filter === 'losses') return t.pnl_sol <= 0 && t.status === 'closed' && t.sell_reason !== 'closed_in_wallet';
    if (filter === 'stuck')  return t.sell_reason === 'closed_in_wallet' || (t.status === 'open');
    return true;
  });

  const stats = calcStats(periodTrades);

  // Whale breakdown
  const whaleStats: Record<string, PeriodStats & { name: string }> = {};
  const whaleNames = ['Cented','Remusofmars','trunoest','gake','clukz','Daumen','Doji'];
  for (const name of whaleNames) {
    const wt = periodTrades.filter(t => t.label === name);
    if (wt.length > 0) whaleStats[name] = { name, ...calcStats(wt) };
  }

  // Stuck positions
  const stuck = trades.filter(t => t.sell_reason === 'closed_in_wallet');
  const open  = trades.filter(t => t.status === 'open' || t.status === 'unconfirmed');

  const S: React.CSSProperties = {
    background: '#050505', minHeight: '100vh', color: '#fff',
    fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '0 0 80px',
  };

  return (
    <div style={S}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 22, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontSize: 11, color: GRAY, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Shreem Brzee</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em' }}>Performance Analytics</div>
        </div>
        <button onClick={load} style={{ marginLeft: 'auto', background: CARD, border: `1px solid ${BORDER}`, color: CYAN, borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0' }}>
        {(['today','week','month','all'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em',
            background: period === p ? GOLD : CARD,
            color: period === p ? '#000' : GRAY,
            border: `1px solid ${period === p ? GOLD : BORDER}`,
          }}>{p === 'today' ? '24h' : p === 'week' ? '7d' : p === 'month' ? '30d' : 'All'}</button>
        ))}
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
        {(['overview','trades','whales'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
            background: tab === t ? 'rgba(34,211,238,0.15)' : CARD,
            color: tab === t ? CYAN : GRAY,
            border: `1px solid ${tab === t ? CYAN : BORDER}`,
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: GRAY, padding: 40 }}>Loading...</div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div style={{ padding: '16px' }}>
              {/* Main PnL card */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: GRAY, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Total Realized PnL</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: stats.pnl >= 0 ? GREEN : RED, letterSpacing: '-0.04em' }}>
                  {fmt(stats.pnl)} SOL
                </div>
                <div style={{ fontSize: 16, color: stats.pnl >= 0 ? GREEN : RED, marginTop: 4 }}>
                  {stats.pnl >= 0 ? '+' : '-'}{fmtE(stats.pnl, eurPerSol)}
                </div>
                <div style={{ fontSize: 11, color: GRAY, marginTop: 8 }}>
                  Based on {stats.trades} closed trades · 1 SOL = €{eurPerSol.toFixed(2)}
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Win Rate', value: `${stats.winRate.toFixed(0)}%`, color: stats.winRate >= 50 ? GREEN : RED },
                  { label: 'Trades', value: `${stats.wins}W / ${stats.losses}L`, color: GOLD },
                  { label: 'Best Trade', value: `+${stats.bestTrade.toFixed(1)}%`, color: GREEN },
                  { label: 'Worst Trade', value: `${stats.worstTrade.toFixed(1)}%`, color: RED },
                  { label: 'Avg Win', value: `+${(stats.avgWin * eurPerSol).toFixed(3)} SOL`, color: GREEN },
                  { label: 'Avg Loss', value: `${(stats.avgLoss * eurPerSol).toFixed(3)} SOL`, color: RED },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 9, color: GRAY, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {stuck.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: RED, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>⚠ {stuck.length} Stuck Trades (closed_in_wallet)</div>
                  <div style={{ fontSize: 12, color: GRAY }}>These bought tokens never auto-sold. SOL spent but not returned. Check Phantom for leftover tokens.</div>
                </div>
              )}
              {open.length > 0 && (
                <div style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>◈ {open.length} Open Positions</div>
                  {open.map(t => (
                    <div key={t.id} style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>
                      {t.symbol || t.mint?.slice(0,8)} · {t.label} · {t.amount_sol?.toFixed(4)} SOL · {ago(t.opened_at)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRADES TAB */}
          {tab === 'trades' && (
            <div style={{ padding: '16px' }}>
              {/* Filter buttons */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['all','wins','losses','stuck'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                    background: filter === f ? 'rgba(255,255,255,0.1)' : CARD,
                    color: filter === f ? '#fff' : GRAY,
                    border: `1px solid ${filter === f ? 'rgba(255,255,255,0.2)' : BORDER}`,
                  }}>{f}</button>
                ))}
              </div>

              {displayTrades.slice(0, 100).map(t => (
                <div key={t.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.symbol || t.mint?.slice(0,8) || '—'}</div>
                      <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>
                        {t.label || 'Unknown'} · {t.sell_reason || t.status} · {t.opened_at ? ago(t.opened_at) : '—'}
                      </div>
                      {t.amount_sol > 0 && (
                        <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>
                          Size: {t.amount_sol.toFixed(4)} SOL (€{(t.amount_sol * eurPerSol).toFixed(2)})
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.pnl_sol > 0 ? GREEN : t.pnl_sol < 0 ? RED : GRAY }}>
                        {t.pnl_pct ? `${t.pnl_pct > 0 ? '+' : ''}${t.pnl_pct.toFixed(1)}%` : t.status}
                      </div>
                      {t.pnl_sol !== null && t.pnl_sol !== 0 && (
                        <div style={{ fontSize: 11, color: t.pnl_sol > 0 ? GREEN : RED }}>
                          {fmt(t.pnl_sol)} SOL
                        </div>
                      )}
                    </div>
                  </div>
                  {t.sell_reason === 'closed_in_wallet' && (
                    <div style={{ marginTop: 8, fontSize: 10, color: RED, background: 'rgba(239,68,68,0.1)', borderRadius: 6, padding: '4px 8px' }}>
                      ⚠ Token bought but never sold — SOL stuck
                    </div>
                  )}
                </div>
              ))}
              {displayTrades.length === 0 && (
                <div style={{ textAlign: 'center', color: GRAY, padding: 40 }}>No trades in this period</div>
              )}
            </div>
          )}

          {/* WHALES TAB */}
          {tab === 'whales' && (
            <div style={{ padding: '16px' }}>
              {Object.values(whaleStats).sort((a,b) => b.pnl - a.pnl).map(w => (
                <div key={w.name} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: GOLD }}>{w.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: w.pnl >= 0 ? GREEN : RED }}>
                      {fmt(w.pnl)} SOL
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: 11, color: GRAY }}>{w.trades} trades</div>
                    <div style={{ fontSize: 11, color: GREEN }}>{w.wins}W</div>
                    <div style={{ fontSize: 11, color: RED }}>{w.losses}L</div>
                    <div style={{ fontSize: 11, color: w.winRate >= 50 ? GREEN : RED }}>{w.winRate.toFixed(0)}% WR</div>
                    <div style={{ fontSize: 11, color: GRAY }}>Best: +{w.bestTrade.toFixed(0)}%</div>
                    <div style={{ fontSize: 11, color: RED }}>Worst: {w.worstTrade.toFixed(0)}%</div>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: GRAY }}>
                    €{(w.pnl * eurPerSol).toFixed(2)} · Avg win: +{(w.avgWin * eurPerSol).toFixed(3)} SOL · Avg loss: {(w.avgLoss * eurPerSol).toFixed(3)} SOL
                  </div>
                </div>
              ))}
              {Object.keys(whaleStats).length === 0 && (
                <div style={{ textAlign: 'center', color: GRAY, padding: 40 }}>No whale data in this period</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
