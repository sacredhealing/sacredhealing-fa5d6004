import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Activity, TrendingUp, DollarSign, Zap, Shield, Eye, RefreshCw, AlertCircle, Clock, BarChart3, Users, Target } from 'lucide-react';

const GOLD = '#D4AF37';
const BG = '#050505';
const PROXY = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/clawbot-proxy';

const GLASS = 'rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';
const GLASS_SM = 'rounded-[20px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';

interface BotHealth {
  status: string;
  bot: string;
  mode: string;
  liveEnabled: boolean;
  balance: number;
  tradeCount: number;
  scanCount: number;
  openPositions: number;
  maxPositions: number;
  whaleFilter: { minWR: string; minTrades: number };
  approvedWhales: string[];
  riskPct: string;
  tradeSize: number;
  lastScan: string;
  uptime: number;
  recentErrors: string[];
}

interface Trade {
  id?: string;
  market?: string;
  side?: string;
  size?: number;
  price?: number;
  pnl?: number;
  timestamp?: string;
  whale?: string;
}

interface WhaleData {
  address?: string;
  winRate?: number;
  tradeCount?: number;
  totalPnl?: number;
}

function Pill({ children, color = GOLD }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block rounded-full border px-3 py-0.5 text-[9px] font-extrabold tracking-[0.25em] uppercase"
      style={{ borderColor: `${color}55`, color }}
    >
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, glow = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; glow?: boolean;
}) {
  return (
    <div className={`${GLASS_SM} p-5 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl border"
          style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.07)' }}
        >
          <Icon className="h-4 w-4" style={{ color: GOLD }} />
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">{label}</span>
      </div>
      <div
        className="text-2xl font-black tracking-tight"
        style={{ color: GOLD, textShadow: glow ? '0 0 20px rgba(212,175,55,0.4)' : 'none' }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-white/30">{sub}</div>}
    </div>
  );
}

function PulsingDot({ color = '#22c55e' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

export default function ClawbotDashboard() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<BotHealth | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [whales, setWhales] = useState<WhaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [healthRes, tradesRes, whalesRes] = await Promise.allSettled([
        fetch(`${PROXY}?endpoint=health`),
        fetch(`${PROXY}?endpoint=trades&limit=20`),
        fetch(`${PROXY}?endpoint=whales`),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const h = await healthRes.value.json();
        if (h.error) { setError('Bot offline'); } else { setHealth(h); }
      } else {
        setError('Bot offline or unreachable');
      }

      if (tradesRes.status === 'fulfilled' && tradesRes.value.ok) {
        const t = await tradesRes.value.json();
        if (!t.error) setTrades(Array.isArray(t) ? t : t.trades ?? []);
      }

      if (whalesRes.status === 'fulfilled' && whalesRes.value.ok) {
        const w = await whalesRes.value.json();
        if (!w.error) setWhales(Array.isArray(w) ? w : w.whales ?? []);
      }

      setLastRefresh(new Date());
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchAll]);

  const uptimeHrs = health ? (health.uptime / 3600).toFixed(1) : '—';
  const lastScanAgo = health?.lastScan
    ? Math.floor((Date.now() - new Date(health.lastScan).getTime()) / 1000)
    : null;

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden pb-32 text-white"
      style={{ background: BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 60%)' }}
      />
      <div className="relative z-10 px-4 pt-4 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <button onClick={() => navigate('/income-streams')}
            className="shrink-0 rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors">
            <ArrowLeft className="h-5 w-5" style={{ color: GOLD }} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.08)' }}>
                <Bot className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <h1 className="font-black tracking-tight text-xl sm:text-2xl"
                style={{ color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.25)' }}>
                CLAWBOT
              </h1>
              <Pill>Polymarket Oracle</Pill>
            </div>
            <p className="text-[12px] text-white/40">SQI-2050 Sovereign Signal Intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoRefresh(v => !v)}
              className="rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors"
              title={autoRefresh ? 'Pause' : 'Resume'}>
              {autoRefresh
                ? <Activity className="h-4 w-4 text-green-400" />
                : <Clock className="h-4 w-4 text-white/30" />}
            </button>
            <button onClick={() => { setLoading(true); fetchAll(); }}
              className="rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: GOLD }} />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`${GLASS} p-5 mb-4`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {error ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span className="text-sm font-bold text-red-400">{error}</span>
                </>
              ) : health ? (
                <>
                  <PulsingDot color="#22c55e" />
                  <span className="text-sm font-bold text-green-400">{health.status.toUpperCase()}</span>
                  <span className="text-white/30 text-xs">•</span>
                  <span className="text-xs text-white/50">{health.bot}</span>
                </>
              ) : (
                <>
                  <PulsingDot color={GOLD} />
                  <span className="text-sm font-bold" style={{ color: GOLD }}>CONNECTING…</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Pill color={health?.mode === 'PAPER' ? '#94a3b8' : '#22c55e'}>
                {health?.mode ?? '—'} MODE
              </Pill>
              {health?.liveEnabled && <Pill color="#f59e0b">LIVE</Pill>}
            </div>
          </div>
          {health && lastScanAgo !== null && (
            <div className="mt-3 text-[11px] text-white/30">
              Last scan {lastScanAgo < 60 ? `${lastScanAgo}s ago` : `${Math.floor(lastScanAgo / 60)}m ago`}
              {' · '}Auto-refresh {autoRefresh ? 'ON (15s)' : 'OFF'}
              {' · '}{lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Stats */}
        {health && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard icon={DollarSign} label="Balance" value={`$${health.balance.toFixed(2)}`} sub="Paper wallet" glow />
            <StatCard icon={BarChart3} label="Scans" value={health.scanCount} sub="Markets analysed" />
            <StatCard icon={TrendingUp} label="Trades" value={health.tradeCount} sub={`${health.openPositions} open / ${health.maxPositions} max`} />
            <StatCard icon={Zap} label="Uptime" value={`${uptimeHrs}h`} sub="Continuous" />
          </div>
        )}

        {/* Risk Config */}
        {health && (
          <div className={`${GLASS} p-5 mb-4`}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4" style={{ color: GOLD }} />
              <h2 className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Risk Parameters</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Risk / trade', health.riskPct],
                ['Trade size', `$${health.tradeSize}`],
                ['Min whale WR', health.whaleFilter.minWR],
                ['Min trades', String(health.whaleFilter.minTrades)],
                ['Max positions', String(health.maxPositions)],
                ['Open now', String(health.openPositions)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                  <span className="text-white/40 text-[11px]">{k}</span>
                  <span className="font-bold text-[12px]" style={{ color: GOLD }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Whales */}
        <div className={`${GLASS} p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: GOLD }} />
              <h2 className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Elite Whales</h2>
            </div>
            <span className="text-[10px] text-white/30">
              {health?.approvedWhales?.length ?? whales.length} active
            </span>
          </div>
          {whales.length === 0 ? (
            <div className="text-center py-6">
              <Eye className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/25">Scanning whale wallets…</p>
              <p className="text-[10px] text-white/15 mt-1">9 elite wallets tracked in real time</p>
            </div>
          ) : whales.map((w, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[11px] font-mono text-white/40">
                {w.address ? `${w.address.slice(0, 6)}…${w.address.slice(-4)}` : `Whale ${i + 1}`}
              </span>
              <div className="flex gap-3">
                {w.winRate !== undefined && (
                  <span className="text-[11px] font-bold" style={{ color: GOLD }}>{(w.winRate * 100).toFixed(0)}% WR</span>
                )}
                {w.tradeCount !== undefined && (
                  <span className="text-[11px] text-white/30">{w.tradeCount} trades</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trades */}
        <div className={`${GLASS} p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: GOLD }} />
              <h2 className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Recent Trades</h2>
            </div>
            {health && <Pill color={health.tradeCount > 0 ? '#22c55e' : '#94a3b8'}>{health.tradeCount} total</Pill>}
          </div>
          {trades.length === 0 ? (
            <div className="text-center py-6">
              <BarChart3 className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/25">No trades yet — scanning markets</p>
              <p className="text-[10px] text-white/15 mt-1">Paper mode active · waiting for high-probability signals</p>
            </div>
          ) : trades.slice(0, 10).map((t, i) => (
            <div key={t.id ?? i} className="flex items-start justify-between py-3 border-b border-white/[0.04]">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-white/70 truncate">{t.market ?? 'Market'}</div>
                <div className="flex gap-2 mt-0.5">
                  {t.side && <span className={`text-[10px] font-bold ${t.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>{t.side}</span>}
                  {t.timestamp && <span className="text-[10px] text-white/20">{new Date(t.timestamp).toLocaleTimeString()}</span>}
                </div>
              </div>
              <div className="text-right ml-3">
                {t.size !== undefined && <div className="text-[11px] font-bold" style={{ color: GOLD }}>${t.size}</div>}
                {t.pnl !== undefined && (
                  <div className={`text-[10px] font-bold ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Errors */}
        {health?.recentErrors && health.recentErrors.length > 0 && (
          <div className={`${GLASS} p-5 mb-4`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <h2 className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Errors</h2>
            </div>
            {health.recentErrors.map((e, i) => (
              <div key={i} className="text-[11px] text-red-400/70 py-1 border-b border-white/[0.04]">{e}</div>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className={`${GLASS} p-6 mb-4 text-center`}>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border mb-3"
            style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.08)' }}>
            <Zap className="h-6 w-6" style={{ color: GOLD }} />
          </div>
          <h3 className="font-black tracking-tight text-lg mb-1" style={{ color: GOLD }}>
            PAPER MODE ACTIVE
          </h3>
          <p className="text-xs text-white/40 mb-4">
            CLAWBOT scanning markets & validating whale signals.<br />
            No real capital deployed until live mode activated.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-white/50">Scanning every 15 seconds</span>
          </div>
        </div>

      </div>
    </div>
  );
}
