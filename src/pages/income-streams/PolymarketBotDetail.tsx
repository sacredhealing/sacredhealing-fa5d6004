import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Activity, TrendingUp, DollarSign, Zap, Shield, Eye, RefreshCw, AlertCircle, Clock, BarChart3, Users, Target, Wallet, Settings, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

const GOLD = '#D4AF37';
const BG = '#050505';
const PROXY = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/clawbot-proxy';

const WHALE_LIST = [
  { alias: 'BAA2BC — Iran Insider',  wr: 83, pnl: 191503, days: 14 },
  { alias: 'ED107A — NoMachine99x',  wr: 89, pnl: 58947,  days: 42 },
  { alias: 'A7A8C1 — WorldCup',      wr: 87, pnl: 47554,  days: 60 },
  { alias: '204F72 — PerfectWR',     wr: 100, pnl: 25928, days: 90 },
  { alias: '06DC51 — CryptoOracle',  wr: 78, pnl: 131298, days: 90 },
  { alias: 'E9076A — CoTrader',      wr: 83, pnl: 30103,  days: 90 },
  { alias: 'F49CE4 — HighFreq',      wr: 52, pnl: 41975,  days: 90 },
  { alias: 'A77105',                 wr: 78, pnl: 6136,   days: 90 },
  { alias: 'FEA31B — Elite',         wr: 75, pnl: 2151,   days: 90 },
];

const GLASS = 'rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';
const GLASS_SM = 'rounded-[20px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';

const FEE_SCHEDULE: Record<string, number> = {
  free: 50,
  prana_flow: 25,
  siddha_quantum: 10,
  akasha_infinity: 5,
};

function Pill({ children, color = GOLD }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-block rounded-full border px-3 py-0.5 text-[9px] font-extrabold tracking-[0.25em] uppercase"
      style={{ borderColor: `${color}55`, color }}>
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
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border"
          style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.07)' }}>
          <Icon className="h-4 w-4" style={{ color: GOLD }} />
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">{label}</span>
      </div>
      <div className="text-2xl font-black tracking-tight"
        style={{ color: GOLD, textShadow: glow ? '0 0 20px rgba(212,175,55,0.4)' : 'none' }}>
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
  const { user } = useAuth();
  const { tier } = useMembership();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'earnings'>('dashboard');
  const [health, setHealth] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedWhale, setExpandedWhale] = useState<number|null>(null);

  // Wallet connection state
  const [membership, setMembership] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);
  const [myTrades, setMyTrades] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);

  const feePct = FEE_SCHEDULE[tier] ?? 50;

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [healthRes, tradesRes] = await Promise.allSettled([
        fetch(`${PROXY}?endpoint=health`),
        fetch(`${PROXY}?endpoint=trades&limit=20`),
      ]);
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const h = await healthRes.value.json();
        if (!h.error) setHealth(h);
        else setError('Bot offline');
      } else setError('Bot offline or unreachable');
      if (tradesRes.status === 'fulfilled' && tradesRes.value.ok) {
        const t = await tradesRes.value.json();
        if (!t.error) setTrades(Array.isArray(t) ? t : t.trades ?? []);
      }
      setLastRefresh(new Date());
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }, []);

  const loadMembership = useCallback(async () => {
    if (!user) return;
    const { data } = await sb
      .from('clawbot_members')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setMembership(data);
    if (data?.poly_wallet_address) setWalletAddress(data.poly_wallet_address);

    // Load my trades
    const { data: trades } = await sb
      .from('polymarket_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setMyTrades(trades ?? []);

    // Load my fee ledger stats
    const { data: fees } = await sb
      .from('clawbot_fee_ledger')
      .select('gross_pnl_usdc, fee_usdc, net_pnl_usdc')
      .eq('user_id', user.id);
    if (fees?.length) {
      const totalGross = fees.reduce((s, f) => s + parseFloat(f.gross_pnl_usdc || 0), 0);
      const totalFees  = fees.reduce((s, f) => s + parseFloat(f.fee_usdc || 0), 0);
      const totalNet   = fees.reduce((s, f) => s + parseFloat(f.net_pnl_usdc || 0), 0);
      setMyStats({ totalGross, totalFees, totalNet, payouts: fees.length });
    }
  }, [user]);

  useEffect(() => { fetchAll(); loadMembership(); }, [fetchAll, loadMembership]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchAll]);

  const saveWallet = async () => {
    if (!user || !walletAddress.startsWith('0x')) return;
    setSavingWallet(true);
    try {
      await sb.from('clawbot_members').upsert({
        user_id: user.id,
        poly_wallet_address: walletAddress.toLowerCase().trim(),
        tier,
        platform_fee_pct: feePct,
        is_active: true,
        paper_mode: true,
      }, { onConflict: 'user_id' });
      setWalletSaved(true);
      await loadMembership();
      setTimeout(() => setWalletSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSavingWallet(false); }
  };

  const lastScanAgo = health?.lastScan
    ? Math.floor((Date.now() - new Date(health.lastScan).getTime()) / 1000)
    : null;
  const uptimeHrs = health ? (health.uptime / 3600).toFixed(1) : '—';

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-32 text-white"
      style={{ background: BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 60%)' }} />

      <div className="relative z-10 px-4 pt-4 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-5 flex items-start gap-3">
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
              <h1 className="font-black tracking-tight text-xl" style={{ color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.25)' }}>
                CLAWBOT
              </h1>
              <Pill>Polymarket Oracle</Pill>
            </div>
            <p className="text-[11px] text-white/40">SQI-2050 Sovereign Signal Intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoRefresh(v => !v)}
              className="rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors">
              {autoRefresh ? <Activity className="h-4 w-4 text-green-400" /> : <Clock className="h-4 w-4 text-white/30" />}
            </button>
            <button onClick={() => { setLoading(true); fetchAll(); }}
              className="rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: GOLD }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['dashboard', 'wallet', 'earnings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-2xl border py-2.5 text-[10px] font-extrabold tracking-[0.2em] uppercase transition-all"
              style={{
                borderColor: activeTab === tab ? `${GOLD}55` : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? GOLD : 'rgba(255,255,255,0.35)',
                background: activeTab === tab ? 'rgba(212,175,55,0.06)' : 'transparent',
              }}>
              {tab === 'dashboard' ? '📡 Live' : tab === 'wallet' ? '🔗 My Wallet' : '💰 Earnings'}
            </button>
          ))}
        </div>

        {/* ─── DASHBOARD TAB ─── */}
        {activeTab === 'dashboard' && (
          <>
            {/* Status Banner */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {error ? (
                    <><AlertCircle className="h-5 w-5 text-red-400" /><span className="text-sm font-bold text-red-400">{error}</span></>
                  ) : health ? (
                    <><PulsingDot color="#22c55e" /><span className="text-sm font-bold text-green-400">RUNNING</span>
                    <span className="text-white/30 text-xs">•</span>
                    <span className="text-xs text-white/50">{health.bot}</span></>
                  ) : (
                    <><PulsingDot color={GOLD} /><span className="text-sm font-bold" style={{ color: GOLD }}>CONNECTING…</span></>
                  )}
                </div>
                <Pill color={health?.mode === 'PAPER' ? '#94a3b8' : '#22c55e'}>{health?.mode ?? '—'} MODE</Pill>
              </div>
              {health && lastScanAgo !== null && (
                <div className="mt-3 text-[11px] text-white/30">
                  Last scan {lastScanAgo < 60 ? `${lastScanAgo}s ago` : `${Math.floor(lastScanAgo/60)}m ago`}
                  {' · '}{lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Stats */}
            {health && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard icon={DollarSign} label="Balance" value={`$${health.balance?.toFixed(2)}`} sub="Paper wallet" glow />
                <StatCard icon={BarChart3} label="Scans" value={health.scanCount} sub="Markets analysed" />
                <StatCard icon={TrendingUp} label="Trades" value={health.tradeCount} sub={`${health.openPositions} open / ${health.maxPositions} max`} />
                <StatCard icon={Zap} label="Uptime" value={`${uptimeHrs}h`} sub="Continuous" />
              </div>
            )}

            {/* Whales */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">9 Elite Whales</span>
                </div>
                <Pill color="#22c55e">TRACKING</Pill>
              </div>
              {WHALE_LIST.map((w, i) => {
                const daily   = w.pnl / w.days;
                const weekly  = daily * 7;
                const monthly = daily * 30;
                const yearly  = daily * 365;
                return (
                  <div key={i}>
                    <button
                      className="w-full flex items-center justify-between py-2.5 border-b border-white/[0.04]"
                      onClick={() => setExpandedWhale(expandedWhale === i ? null : i)}
                    >
                      <span className="text-[12px] text-white/70 text-left">{w.alias}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black" style={{ color: GOLD }}>{w.wr}% WR</span>
                        <span className="text-[10px] text-white/25">{expandedWhale === i ? '▴' : '▾'}</span>
                      </div>
                    </button>
                    {expandedWhale === i && (
                      <div className="mb-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 grid grid-cols-2 gap-2">
                        {[
                          ['Daily',   `$${daily.toFixed(0)}`,                    `${(daily/w.pnl*100).toFixed(1)}%/day`],
                          ['Weekly',  `$${weekly.toFixed(0)}`,                   `${(weekly/w.pnl*100).toFixed(0)}%/wk`],
                          ['Monthly', `$${monthly.toFixed(0)}`,                  `${(monthly/w.pnl*100).toFixed(0)}%/mo`],
                          ['Yearly',  `$${Math.round(yearly).toLocaleString()}`, `${(yearly/w.pnl*100).toFixed(0)}%/yr`],
                        ].map(([label, amt, pct]) => (
                          <div key={label} className="rounded-xl bg-white/[0.03] p-2.5">
                            <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-1">{label}</div>
                            <div className="text-[14px] font-black" style={{ color: GOLD }}>{amt}</div>
                            <div className="text-[10px] text-white/30">{pct}</div>
                          </div>
                        ))}
                        <div className="col-span-2 rounded-xl bg-white/[0.03] p-2.5 flex justify-between items-center">
                          <span className="text-[10px] text-white/30">Total PnL (historical)</span>
                          <span className="text-[13px] font-black text-green-400">${w.pnl.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recent trades */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Recent Trades</span>
                </div>
                {health && <Pill color={health.tradeCount > 0 ? '#22c55e' : '#94a3b8'}>{health.tradeCount} total</Pill>}
              </div>
              {trades.length === 0 ? (
                <div className="text-center py-6">
                  <BarChart3 className="h-8 w-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/25">Waiting for whale signals…</p>
                </div>
              ) : trades.slice(0, 8).map((t, i) => (
                <div key={i} className="flex items-start justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white/70 truncate">{t.market ?? t.outcome ?? 'Signal'}</div>
                    <div className="flex gap-2 mt-0.5">
                      {t.side && <span className={`text-[10px] font-bold ${t.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>{t.side}</span>}
                      {t.strategy && <span className="text-[10px] text-white/25">{t.strategy}</span>}
                    </div>
                  </div>
                  {t.size && <div className="text-[11px] font-bold ml-3" style={{ color: GOLD }}>${t.size}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── WALLET TAB ─── */}
        {activeTab === 'wallet' && (
          <>
            {/* Fee schedule */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Profit Share Schedule</span>
              </div>
              {[
                { tier: 'Free',             fee: '50%', color: '#94a3b8' },
                { tier: 'Prana-Flow',       fee: '25%', color: '#22D3EE' },
                { tier: 'Siddha-Quantum',   fee: '10%', color: GOLD      },
                { tier: 'Akasha-Infinity',  fee: '5%',  color: '#E879F9' },
              ].map(({ tier: t, fee, color }) => (
                <div key={t} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    {tier?.toLowerCase().replace('-','_') === t.toLowerCase().replace('-','_').replace(' ','_') && (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    )}
                    <span className="text-[12px] font-bold" style={{ color }}>{t}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-black" style={{ color: GOLD }}>{fee}</span>
                    <span className="text-[10px] text-white/30 ml-1">to platform</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                <div className="text-[10px] text-white/40 mb-1">YOUR CURRENT RATE</div>
                <div className="text-xl font-black" style={{ color: GOLD }}>{feePct}% platform fee</div>
                <div className="text-[11px] text-white/30">You keep {100 - feePct}% of all winnings</div>
              </div>
            </div>

            {/* Wallet connection */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Connect Polymarket Wallet</span>
              </div>
              <p className="text-[12px] text-white/40 mb-4 leading-relaxed">
                Enter your Polymarket wallet address. CLAWBOT will copy all 9 elite whale signals to your wallet automatically.
              </p>
              <div className="mb-3">
                <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-2">
                  Polygon Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={e => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-white/80 placeholder-white/20 outline-none focus:border-yellow-600/40"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <button
                onClick={saveWallet}
                disabled={savingWallet || !walletAddress.startsWith('0x')}
                className="w-full rounded-2xl py-3 text-[11px] font-extrabold tracking-[0.25em] uppercase transition-all"
                style={{
                  background: walletSaved ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.12)',
                  border: `1px solid ${walletSaved ? '#22c55e55' : 'rgba(212,175,55,0.35)'}`,
                  color: walletSaved ? '#22c55e' : GOLD,
                  opacity: savingWallet ? 0.6 : 1,
                }}>
                {walletSaved ? '✓ Wallet Connected' : savingWallet ? 'Saving…' : 'Connect Wallet'}
              </button>

              {membership && (
                <div className="mt-4 p-3 rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1">
                    <PulsingDot color="#22c55e" />
                    <span className="text-[11px] font-bold text-green-400">ACTIVE</span>
                  </div>
                  <div className="text-[11px] text-white/40 font-mono">{membership.poly_wallet_address}</div>
                  <div className="text-[10px] text-white/25 mt-1">
                    {membership.paper_mode ? 'Paper mode' : 'Live mode'} · {membership.tier} · {membership.platform_fee_pct}% fee
                  </div>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">How It Works</span>
              </div>
              {[
                ['1', 'CLAWBOT detects a whale trade on Polygon', '#D4AF37'],
                ['2', 'Signal copied to your wallet automatically', '#22c55e'],
                ['3', 'Trade resolves — you win or lose', '#94a3b8'],
                ['4', `Platform fee (${feePct}%) deducted from winnings`, '#E879F9'],
                ['5', 'Net profit stays in your Polymarket wallet', GOLD],
              ].map(([step, text, color]) => (
                <div key={step} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04]">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: `${color}22`, color }}>
                    {step}
                  </span>
                  <span className="text-[12px] text-white/50">{text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── EARNINGS TAB ─── */}
        {activeTab === 'earnings' && (
          <>
            {myStats ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard icon={DollarSign} label="Gross Won" value={`$${myStats.totalGross.toFixed(2)}`} glow />
                <StatCard icon={Shield} label="Fees Paid" value={`$${myStats.totalFees.toFixed(2)}`} sub={`${feePct}% rate`} />
                <StatCard icon={TrendingUp} label="Net Profit" value={`$${myStats.totalNet.toFixed(2)}`} sub="After fees" />
                <StatCard icon={Target} label="Payouts" value={myStats.payouts} sub="Winning trades" />
              </div>
            ) : (
              <div className={`${GLASS} p-8 mb-4 text-center`}>
                <Eye className="h-10 w-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">No earnings yet</p>
                <p className="text-[11px] text-white/20 mt-1">Connect your wallet and wait for the first winning signal</p>
              </div>
            )}

            {/* My trades */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">My Trades</span>
                </div>
                <Pill color="#94a3b8">{myTrades.length} total</Pill>
              </div>
              {myTrades.length === 0 ? (
                <p className="text-[12px] text-white/25 text-center py-6">
                  Trades will appear here once your wallet is connected and signals fire
                </p>
              ) : myTrades.slice(0, 10).map((t, i) => (
                <div key={i} className="flex items-start justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white/70 truncate">{t.market_question || 'Market'}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold ${
                        t.status === 'won' ? 'text-green-400' : t.status === 'lost' ? 'text-red-400' : 'text-white/40'
                      }`}>{t.status?.toUpperCase()}</span>
                      <span className="text-[10px] text-white/25">{t.strategy}</span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-[11px] font-bold" style={{ color: GOLD }}>${parseFloat(t.amount_usdc || 0).toFixed(2)}</div>
                    {t.pnl_usdc && (
                      <div className={`text-[10px] font-bold ${parseFloat(t.pnl_usdc) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(t.pnl_usdc) >= 0 ? '+' : ''}{parseFloat(t.pnl_usdc).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
