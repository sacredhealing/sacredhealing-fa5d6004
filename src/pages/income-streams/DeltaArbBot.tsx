import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Activity, TrendingUp, DollarSign, Shield, RefreshCw, AlertCircle, Clock, BarChart3, Users, Target, Wallet, Settings, Check, Share2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

const GOLD    = '#D4AF37';
const BG      = '#050505';
const CYAN    = '#22D3EE';
const GREEN   = '#22c55e';
const RED     = '#ef4444';
const GLASS   = 'rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';
const GLASS_SM = 'rounded-[20px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';

const FEE_SCHEDULE: Record<string, number> = { free: 50, prana_flow: 25, siddha_quantum: 10, akasha_infinity: 5 };
const AFFILIATE_L1: Record<string, number> = { free: 10, prana_flow: 8, siddha_quantum: 5, akasha_infinity: 3 };
const AFFILIATE_L2: Record<string, number> = { free: 3, prana_flow: 2, siddha_quantum: 1, akasha_infinity: 1 };
const STARTING_BALANCE = 100;

function Pill({ children, color = GOLD }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-block rounded-full border px-3 py-0.5 text-[9px] font-extrabold tracking-[0.25em] uppercase"
      style={{ borderColor: `${color}55`, color }}>
      {children}
    </span>
  );
}

function PulsingDot({ color = GREEN }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = GOLD, glow = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; glow?: boolean;
}) {
  return (
    <div className={`${GLASS_SM} p-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl border"
          style={{ borderColor: `${color}33`, background: `${color}10` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40">{label}</span>
      </div>
      <div className="text-2xl font-black tracking-tight"
        style={{ color, textShadow: glow ? `0 0 20px ${color}44` : 'none' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-white/30">{sub}</div>}
    </div>
  );
}

export default function DeltaArbBot() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { tier }  = useMembership();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'earnings' | 'affiliate'>('dashboard');

  // ── Core state ────────────────────────────────────────────────────────────
  const [trades, setTrades]           = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh,    setAutoRefresh]    = useState(true);
  const [activeStrategy, setActiveStrategy] = useState<'conservative'|'moderate'|'aggressive'>('moderate');
  const [savingStrategy, setSavingStrategy] = useState(false);

  // ── Computed stats from trades ────────────────────────────────────────────
  const [stats, setStats] = useState({
    balance:     STARTING_BALANCE,
    totalPnl:    0,
    wins:        0,
    losses:      0,
    open:        0,
    winRate:     '—',
    tradeCount:  0,
    signalCount: 0,
  });

  // ── Membership / affiliate ────────────────────────────────────────────────
  const [membership,      setMembership]      = useState<any>(null);
  const [walletAddress,   setWalletAddress]   = useState('');
  const [savingWallet,    setSavingWallet]     = useState(false);
  const [walletSaved,     setWalletSaved]      = useState(false);
  const [affiliateProfile, setAffiliateProfile] = useState<any>(null);
  const [copied,          setCopied]           = useState(false);

  const feePct = FEE_SCHEDULE[tier] ?? 50;
  const l1Rate = AFFILIATE_L1[tier]  ?? 10;
  const l2Rate = AFFILIATE_L2[tier]  ?? 3;

  // ── Main data fetch — reads directly from Supabase ────────────────────────
  const sb = supabase as any;

  const fetchAll = useCallback(async () => {
    try {
      const { data: rawTrades, error } = await sb
        .from('delta_arb_trades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Trades fetch error:', error);
      }

      const all = (rawTrades as any[]) ?? [];
      setTrades(all);

      // Compute stats
      const won    = all.filter(t => t.status === 'won');
      const lost   = all.filter(t => t.status === 'lost');
      const open   = all.filter(t => t.status === 'open' || !t.status);
      const total  = won.length + lost.length;
      const totalPnl = all.reduce((s, t) => {
        if (t.pnl_usdc !== null && t.pnl_usdc !== undefined) return s + (parseFloat(t.pnl_usdc) || 0);
        if (t.status === 'lost') return s - (parseFloat(t.size_usd) || 10);
        if (t.status === 'won')  return s + (parseFloat(t.size_usd) || 10) * 0.12;
        return s;
      }, 0);

      setStats({
        balance:     Math.round((STARTING_BALANCE + totalPnl) * 100) / 100,
        totalPnl:    Math.round(totalPnl * 100) / 100,
        wins:        won.length,
        losses:      lost.length,
        open:        open.length,
        winRate:     total > 0 ? ((won.length / total) * 100).toFixed(1) : '—',
        tradeCount:  total,
        signalCount: all.length,
      });

      // Load active strategy from platform config
      try {
        const { data: cfg } = await sb
          .from('delta_arb_platform_config')
          .select('active_strategy')
          .eq('id', 1)
          .maybeSingle();
        if (cfg?.active_strategy) {
          setActiveStrategy(cfg.active_strategy as any);
        }
      } catch (_) {}

      setLastRefresh(new Date());
    } catch (e) {
      console.error('fetchAll error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembership = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('delta_arb_members').select('*').eq('user_id', user.id).maybeSingle();
    setMembership(data);
    if (data?.poly_wallet_address) setWalletAddress(data.poly_wallet_address);
    const { data: aff } = await supabase.from('affiliate_profiles').select('*').eq('user_id', user.id).maybeSingle();
    setAffiliateProfile(aff);
  }, [user]);

  useEffect(() => { fetchAll(); loadMembership(); }, [fetchAll, loadMembership]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchAll, 10000); // refresh every 10s
    return () => clearInterval(iv);
  }, [autoRefresh, fetchAll]);

  // ── Wallet save ───────────────────────────────────────────────────────────
  const saveWallet = async () => {
    if (!user || !walletAddress.startsWith('0x')) return;
    setSavingWallet(true);
    try {
      await supabase.from('delta_arb_members').upsert({
        user_id: user.id, poly_wallet_address: walletAddress.toLowerCase().trim(),
        tier, platform_fee_pct: feePct, is_active: true, paper_mode: true,
      }, { onConflict: 'user_id' });
      setWalletSaved(true);
      await loadMembership();
      setTimeout(() => setWalletSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSavingWallet(false); }
  };

  const saveStrategy = async (s: 'conservative' | 'moderate' | 'aggressive') => {
    setSavingStrategy(true);
    try {
      await (supabase as any)
        .from('delta_arb_platform_config')
        .update({ active_strategy: s })
        .eq('id', 1);
      setActiveStrategy(s);
    } catch (e) { console.error(e); }
    finally { setSavingStrategy(false); }
  };

  const copyAffiliateLink = () => {
    if (!affiliateProfile?.affiliate_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/join?ref=${affiliateProfile.affiliate_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pnlColor = stats.totalPnl >= 0 ? GREEN : RED;
  const recentTrades = trades.slice(0, 20);

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-32 text-white"
      style={{ background: BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(34,211,238,0.06) 0%, rgba(212,175,55,0.04) 40%, transparent 65%)' }} />

      <div className="relative z-10 px-4 pt-4 max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-5 flex items-start gap-3">
          <button onClick={() => navigate('/income-streams')}
            className="shrink-0 rounded-2xl border border-white/[0.08] p-2.5">
            <ArrowLeft className="h-5 w-5" style={{ color: GOLD }} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={{ borderColor: `${CYAN}44`, background: `${CYAN}10` }}>
                <Zap className="h-5 w-5" style={{ color: CYAN }} />
              </div>
              <h1 className="font-black tracking-tight text-xl" style={{ color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.25)' }}>
                DELTA-ARB BOT
              </h1>
              <Pill color={CYAN}>Binance → Polymarket</Pill>
            </div>
            <p className="text-[11px] text-white/40">SQI-2050 Latency-Arb Signal Intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoRefresh(v => !v)}
              className="rounded-2xl border border-white/[0.08] p-2.5">
              {autoRefresh ? <Activity className="h-4 w-4 text-green-400" /> : <Clock className="h-4 w-4 text-white/30" />}
            </button>
            <button onClick={() => { setLoading(true); fetchAll(); }}
              className="rounded-2xl border border-white/[0.08] p-2.5">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: GOLD }} />
            </button>
          </div>
        </div>

        {/* ── Live P&L Banner — always visible ── */}
        <div className={`${GLASS} p-4 mb-4`}
          style={{ borderColor: `${pnlColor}33`, background: `${pnlColor}08` }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <PulsingDot color={GREEN} />
              <span className="text-sm font-black" style={{ color: GREEN }}>PAPER MODE — LIVE</span>
              <span className="text-white/30 text-xs">•</span>
              <span className="text-xs text-white/50">{lastRefresh.toLocaleTimeString()}</span>
            </div>
            <Pill color="#94a3b8">PAPER</Pill>
          </div>

          {/* Big P&L number */}
          <div className="mt-4 flex items-end gap-4 flex-wrap">
            <div>
              <div className="text-[9px] font-bold tracking-[0.25em] uppercase text-white/30 mb-1">Balance</div>
              <div className="text-4xl font-black tracking-tight" style={{ color: GOLD, textShadow: '0 0 25px rgba(212,175,55,0.4)' }}>
                ${stats.balance.toFixed(2)}
              </div>
            </div>
            <div className="mb-1">
              <div className="text-[9px] font-bold tracking-[0.25em] uppercase text-white/30 mb-1">Total P&L</div>
              <div className="text-2xl font-black" style={{ color: pnlColor }}>
                {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)} USDC
              </div>
            </div>
          </div>

          {/* Inline stats row */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { label: 'TRADES', value: stats.tradeCount },
              { label: 'WIN RATE', value: stats.winRate === '—' ? '—' : `${stats.winRate}%` },
              { label: 'WINS', value: stats.wins, color: GREEN },
              { label: 'LOSSES', value: stats.losses, color: stats.losses > 0 ? RED : 'rgba(255,255,255,0.3)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl bg-white/[0.03] p-2 text-center">
                <div className="text-[8px] font-bold tracking-widest uppercase text-white/25 mb-0.5">{label}</div>
                <div className="text-[13px] font-black" style={{ color: color ?? GOLD }}>{value}</div>
              </div>
            ))}
          </div>

          {stats.open > 0 && (
            <div className="mt-2 text-[10px] text-white/30 text-center">
              {stats.open} trade{stats.open > 1 ? 's' : ''} pending resolution…
            </div>
          )}

          {/* Strategy Selector */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="text-[9px] font-bold tracking-[0.25em] uppercase text-white/30 mb-3">
              ACTIVE STRATEGY — applies to both paper and live
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'conservative', label: 'Conservative', wr: '72-79%', pos: '6%', color: '#94a3b8' },
                { key: 'moderate',     label: 'Moderate',     wr: '79-85%', pos: '10%', color: CYAN },
                { key: 'aggressive',   label: 'Aggressive',   wr: '85-92%', pos: '15%', color: GOLD },
              ] as const).map(({ key, label, wr, pos, color }) => {
                const isActive = activeStrategy === key;
                return (
                  <button
                    key={key}
                    onClick={() => saveStrategy(key)}
                    disabled={savingStrategy}
                    className="rounded-2xl p-3 text-center transition-all"
                    style={{
                      background:  isActive ? `${color}18` : 'rgba(255,255,255,0.02)',
                      border:      `1px solid ${isActive ? color + '88' : 'rgba(255,255,255,0.06)'}`,
                      opacity:     savingStrategy ? 0.6 : 1,
                    }}>
                    <div className="text-[10px] font-black tracking-wide" style={{ color: isActive ? color : 'rgba(255,255,255,0.4)' }}>
                      {label}
                    </div>
                    <div className="text-[9px] text-white/30 mt-1">{wr} win</div>
                    <div className="text-[9px] mt-0.5" style={{ color: isActive ? color : 'rgba(255,255,255,0.2)' }}>{pos}/trade</div>
                    {isActive && (
                      <div className="mt-1 text-[8px] font-black tracking-widest uppercase" style={{ color }}>● ACTIVE</div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-white/20 mt-2 text-center leading-relaxed">
              Changing strategy updates Railway bot settings in real time
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-5">
          {(['dashboard', 'wallet', 'earnings', 'affiliate'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-2xl border py-2.5 text-[10px] font-extrabold tracking-[0.15em] uppercase transition-all"
              style={{
                borderColor: activeTab === tab ? `${GOLD}55` : 'rgba(255,255,255,0.05)',
                color:       activeTab === tab ? GOLD : 'rgba(255,255,255,0.35)',
                background:  activeTab === tab ? 'rgba(212,175,55,0.06)' : 'transparent',
              }}>
              {tab === 'dashboard' ? '⚡ Live' : tab === 'wallet' ? '🔗 Wallet' : tab === 'earnings' ? '💰 Earn' : '🤝 Refer'}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <>
            {/* Live trade feed */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Live Trade Feed</span>
                </div>
                <div className="flex items-center gap-2">
                  {stats.open > 0 && <Pill color={CYAN}>{stats.open} OPEN</Pill>}
                  <Pill color="#94a3b8">{stats.signalCount} TOTAL</Pill>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-6">
                  <RefreshCw className="h-6 w-6 animate-spin text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/25">Loading trades…</p>
                </div>
              ) : recentTrades.length === 0 ? (
                <div className="text-center py-6">
                  <Zap className="h-8 w-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/25">Waiting for first delta signal…</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {recentTrades.map((t, i) => {
                    const isWon  = t.status === 'won';
                    const isLost = t.status === 'lost';
                    const isOpen = !isWon && !isLost;
                    // Use pnl_usdc if set, else estimate from size (for pending resolver)
                    const rawPnl = t.pnl_usdc !== null && t.pnl_usdc !== undefined
                      ? parseFloat(t.pnl_usdc)
                      : isLost ? -(parseFloat(t.size_usd) || 10)
                      : isWon  ?  (parseFloat(t.size_usd) || 10) * 0.12
                      : 0;
                    const pnl = isNaN(rawPnl) ? 0 : rawPnl;
                    const statusColor = isWon ? GREEN : isLost ? RED : CYAN;
                    const statusLabel = isWon ? 'WIN' : isLost ? 'LOSS' : 'OPEN';
                    return (
                      <div key={t.id ?? i}
                        className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Asset + signal */}
                          <div className="shrink-0">
                            <div className="text-[12px] font-black text-white/80">
                              {t.asset ?? '?'} <span className="text-[10px] text-white/30">{t.interval ?? '15m'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold" style={{ color: t.signal === 'UP' ? GREEN : RED }}>
                                {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                              </span>
                              <span className="text-[10px] text-white/25">{t.delta}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side: status + pnl */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[9px] font-extrabold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                              style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44` }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="mt-0.5">
                            {isOpen ? (
                              <span className="text-[10px] text-white/25">${parseFloat(t.size_usd || 0).toFixed(2)} bet</span>
                            ) : (
                              <span className="text-[11px] font-black" style={{ color: pnl >= 0 ? GREEN : RED }}>
                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Strategy explainer */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4" style={{ color: CYAN }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">How The Edge Works</span>
              </div>
              {[
                ['⚡', 'Binance WebSocket', 'BTC/ETH/SOL price streamed at sub-50ms latency'],
                ['📐', 'Delta Detection',   'Bot measures % move from window open price'],
                ['🎯', 'Signal Filter',     '0.15%+ delta = 72–92% certainty. Below = ignored'],
                ['⏱', 'Oracle Lag',        'Chainlink updates every 10–30s. Bot fires in that gap'],
                ['💥', 'Entry',             'Buy winning token while Polymarket still shows ~50/50'],
              ].map(([icon, title, desc]) => (
                <div key={String(title)} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04]">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div>
                    <div className="text-[11px] font-black tracking-wide" style={{ color: GOLD }}>{title}</div>
                    <p className="text-[11px] text-white/40 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ROI projections */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">ROI Projections (Capped)</span>
              </div>
              {[
                { label: 'Conservative', wr: 72, daily: 5,  monthly: 250  },
                { label: 'Moderate',     wr: 80, daily: 10, monthly: 600  },
                { label: 'Aggressive',   wr: 88, daily: 18, monthly: 1200 },
              ].map(s => (
                <div key={s.label} className="py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-white/70">{s.label}</span>
                    <span className="text-[11px] font-black" style={{ color: GOLD }}>{s.wr}% win rate</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['Daily', `+${s.daily}%`], ['Monthly', `+${s.monthly}%`]].map(([lbl, val]) => (
                      <div key={lbl} className="rounded-xl bg-white/[0.03] p-2 text-center">
                        <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">{lbl}</div>
                        <div className="text-[12px] font-black" style={{ color: CYAN }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-white/20 mt-3 leading-relaxed">
                ⚠ Paper mode uses realistic 72–92% win probability based on delta strength. Past signals do not guarantee future results.
              </p>
            </div>
          </>
        )}

        {/* ── WALLET TAB ── */}
        {activeTab === 'wallet' && (
          <>
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Profit Share Schedule</span>
              </div>
              {[
                { t: 'Free',            fee: '50%', color: '#94a3b8' },
                { t: 'Prana-Flow',      fee: '25%', color: CYAN },
                { t: 'Siddha-Quantum',  fee: '10%', color: GOLD },
                { t: 'Akasha-Infinity', fee: '5%',  color: '#E879F9' },
              ].map(({ t, fee, color }) => (
                <div key={t} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                  <span className="text-[12px] font-bold" style={{ color }}>{t}</span>
                  <div>
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

            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Connect Polymarket Wallet</span>
              </div>
              <p className="text-[12px] text-white/40 mb-4 leading-relaxed">
                Your Polygon wallet address. Required to go live with real USDC.
              </p>
              <input
                type="text"
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-white/80 placeholder-white/20 outline-none focus:border-yellow-600/40 mb-3"
                style={{ fontFamily: 'monospace' }}
              />
              <button onClick={saveWallet} disabled={savingWallet || !walletAddress.startsWith('0x')}
                className="w-full rounded-2xl py-3 text-[11px] font-extrabold tracking-[0.25em] uppercase transition-all"
                style={{
                  background: walletSaved ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.12)',
                  border: `1px solid ${walletSaved ? '#22c55e55' : 'rgba(212,175,55,0.35)'}`,
                  color: walletSaved ? GREEN : GOLD,
                  opacity: savingWallet ? 0.6 : 1,
                }}>
                {walletSaved ? '✓ Wallet Connected' : savingWallet ? 'Saving…' : 'Connect Wallet'}
              </button>
            </div>
          </>
        )}

        {/* ── EARNINGS TAB ── */}
        {activeTab === 'earnings' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard icon={DollarSign} label="Balance" value={`$${stats.balance.toFixed(2)}`}
                color={stats.totalPnl >= 0 ? GREEN : RED} glow />
              <StatCard icon={TrendingUp} label="Total P&L"
                value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
                color={stats.totalPnl >= 0 ? GREEN : RED}
                sub={`From $${STARTING_BALANCE} start`} />
              <StatCard icon={Target} label="Win Rate"
                value={stats.winRate === '—' ? '—' : `${stats.winRate}%`}
                color={GOLD} sub={`${stats.wins}W / ${stats.losses}L`} />
              <StatCard icon={BarChart3} label="Trades" value={stats.tradeCount}
                color={CYAN} sub={`${stats.open} pending`} />
            </div>

            {/* Full trade history */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">All Trades</span>
                </div>
                <Pill color="#94a3b8">{trades.length} total</Pill>
              </div>
              {trades.length === 0 ? (
                <p className="text-[12px] text-white/25 text-center py-6">No trades yet</p>
              ) : trades.map((t, i) => {
                const isWon  = t.status === 'won';
                const isLost = t.status === 'lost';
                const rawEP = t.pnl_usdc !== null && t.pnl_usdc !== undefined
                  ? parseFloat(t.pnl_usdc)
                  : (t.status === 'lost' ? -(parseFloat(t.size_usd)||10) : (parseFloat(t.size_usd)||10)*0.12);
                const pnl = isNaN(rawEP) ? 0 : rawEP;
                const sc     = isWon ? GREEN : isLost ? RED : CYAN;
                return (
                  <div key={t.id ?? i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white/70">
                        {t.asset ?? '?'} {t.interval ?? '15m'}{' '}
                        <span style={{ color: t.signal === 'UP' ? GREEN : RED }}>
                          {t.signal === 'UP' ? '▲' : '▼'}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/30 mt-0.5">{t.delta} · ${parseFloat(t.size_usd||0).toFixed(2)}</div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <span className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-lg"
                        style={{ background: `${sc}18`, color: sc }}>
                        {isWon ? 'WIN' : isLost ? 'LOSS' : 'OPEN'}
                      </span>
                      <div className="text-[11px] font-black mt-0.5" style={{ color: pnl >= 0 ? GREEN : RED }}>
                        {t.status === 'open' || !t.status ? `$${parseFloat(t.size_usd||0).toFixed(2)} bet` :
                          `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── AFFILIATE TAB ── */}
        {activeTab === 'affiliate' && (
          <>
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Your Affiliate Rates</span>
                <Pill color={CYAN}>{tier?.replace('_', '-').toUpperCase()}</Pill>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 text-center">
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/30 mb-1">Level 1</div>
                  <div className="text-3xl font-black" style={{ color: GOLD }}>{l1Rate}%</div>
                  <div className="text-[10px] text-white/25 mt-1">of their gross wins</div>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 text-center">
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/30 mb-1">Level 2</div>
                  <div className="text-3xl font-black" style={{ color: CYAN }}>{l2Rate}%</div>
                  <div className="text-[10px] text-white/25 mt-1">from their referrals</div>
                </div>
              </div>
            </div>

            {affiliateProfile ? (
              <div className={`${GLASS} p-5 mb-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Your Referral Link</span>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] font-mono text-white/50 mb-3 break-all">
                  {window.location.origin}/join?ref={affiliateProfile.affiliate_code}
                </div>
                <button onClick={copyAffiliateLink}
                  className="w-full rounded-2xl py-3 text-[11px] font-extrabold tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-2"
                  style={{
                    background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.12)',
                    border: `1px solid ${copied ? '#22c55e55' : 'rgba(212,175,55,0.35)'}`,
                    color: copied ? GREEN : GOLD,
                  }}>
                  {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Link</>}
                </button>
              </div>
            ) : (
              <div className={`${GLASS} p-6 mb-4 text-center`}>
                <Share2 className="h-8 w-8 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40">No affiliate profile yet</p>
                <button onClick={() => navigate('/income-streams/affiliate')}
                  className="mt-4 rounded-2xl border px-5 py-2 text-[11px] font-extrabold tracking-[0.2em] uppercase"
                  style={{ borderColor: `${GOLD}44`, color: GOLD }}>
                  Activate Affiliate
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
