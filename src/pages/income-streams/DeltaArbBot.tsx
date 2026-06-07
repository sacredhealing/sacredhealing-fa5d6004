import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Activity, TrendingUp, DollarSign, Shield, RefreshCw, AlertCircle, Clock, BarChart3, Users, Target, Wallet, Settings, Check, Share2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

const GOLD   = '#D4AF37';
const BG     = '#050505';
const CYAN   = '#22D3EE';
const GLASS  = 'rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';
const GLASS_SM = 'rounded-[20px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';

// Platform fee per tier (% of winnings to platform)
const FEE_SCHEDULE: Record<string, number> = {
  free:             50,
  prana_flow:       25,
  siddha_quantum:   10,
  akasha_infinity:   5,
};

// Affiliate commission rates per tier (% of gross win)
const AFFILIATE_L1: Record<string, number> = {
  free: 10, prana_flow: 8, siddha_quantum: 5, akasha_infinity: 3,
};
const AFFILIATE_L2: Record<string, number> = {
  free: 3, prana_flow: 2, siddha_quantum: 1, akasha_infinity: 1,
};

// ROI projections (capped, realistic)
const ROI_SCENARIOS = [
  { label: 'Conservative',  wr: 85, tpd: 10,  daily: 8,  monthly: 400  },
  { label: 'Moderate',      wr: 90, tpd: 20,  daily: 15, monthly: 900  },
  { label: 'Aggressive',    wr: 93, tpd: 40,  daily: 25, monthly: 2000 },
];

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

export default function DeltaArbBot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useMembership();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'earnings' | 'affiliate'>('dashboard');

  // Bot health + trades (from Railway via proxy)
  const PROXY = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/delta-arb-proxy';
  const [health, setHealth] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Wallet
  const [membership, setMembership] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);
  const [myTrades, setMyTrades] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);

  // Affiliate
  const [affiliateProfile, setAffiliateProfile] = useState<any>(null);
  const [affiliateStats, setAffiliateStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const feePct   = FEE_SCHEDULE[tier] ?? 50;
  const l1Rate   = AFFILIATE_L1[tier]  ?? 10;
  const l2Rate   = AFFILIATE_L2[tier]  ?? 3;

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [healthRes, tradesRes] = await Promise.allSettled([
        fetch(`${PROXY}?endpoint=health`),
        fetch(`${PROXY}?endpoint=trades&limit=20`),
      ]);
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const h = await healthRes.value.json();
        if (!h.error) setHealth(h); else setError('Bot offline');
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
    const { data } = await supabase.from('delta_arb_members').select('*').eq('user_id', user.id).maybeSingle();
    setMembership(data);
    if (data?.poly_wallet_address) setWalletAddress(data.poly_wallet_address);

    const { data: trades } = await supabase.from('delta_arb_trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    setMyTrades(trades ?? []);

    const { data: fees } = await supabase.from('delta_arb_fee_ledger').select('gross_pnl_usdc,fee_usdc,net_pnl_usdc').eq('user_id', user.id);
    if (fees?.length) {
      setMyStats({
        totalGross: fees.reduce((s, f) => s + parseFloat(f.gross_pnl_usdc || 0), 0),
        totalFees:  fees.reduce((s, f) => s + parseFloat(f.fee_usdc || 0), 0),
        totalNet:   fees.reduce((s, f) => s + parseFloat(f.net_pnl_usdc || 0), 0),
        payouts:    fees.length,
      });
    }
  }, [user]);

  const loadAffiliate = useCallback(async () => {
    if (!user) return;
    const { data: aff } = await supabase.from('affiliate_profiles').select('*').eq('user_id', user.id).maybeSingle();
    setAffiliateProfile(aff);

    if (aff) {
      const { data: commissions } = await sb
        .from('affiliate_commissions')
        .select('commission_amount,level,source')
        .eq('affiliate_user_id', user.id)
        .eq('status', 'approved')
        .like('source', 'trading%');
      if (commissions?.length) {
        const l1 = commissions.filter(c => c.level === 1).reduce((s, c) => s + parseFloat(c.commission_amount), 0);
        const l2 = commissions.filter(c => c.level === 2).reduce((s, c) => s + parseFloat(c.commission_amount), 0);
        setAffiliateStats({ l1Total: l1, l2Total: l2, totalCommissions: commissions.length });
      }
    }
  }, [user]);

  useEffect(() => { fetchAll(); loadMembership(); loadAffiliate(); }, [fetchAll, loadMembership, loadAffiliate]);
  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchAll]);

  const saveWallet = async () => {
    if (!user || !walletAddress.startsWith('0x')) return;
    setSavingWallet(true);
    try {
      await supabase.from('delta_arb_members').upsert({
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

  const copyAffiliateLink = () => {
    if (!affiliateProfile?.affiliate_code) return;
    const link = `${window.location.origin}/join?ref=${affiliateProfile.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lastScanAgo = health?.lastScan
    ? Math.floor((Date.now() - new Date(health.lastScan).getTime()) / 1000)
    : null;
  const uptimeHrs = health ? (health.uptime / 3600).toFixed(1) : '—';

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-32 text-white"
      style={{ background: BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(34,211,238,0.06) 0%, rgba(212,175,55,0.04) 40%, transparent 65%)' }} />

      <div className="relative z-10 px-4 pt-4 max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-5 flex items-start gap-3">
          <button onClick={() => navigate('/income-streams')}
            className="shrink-0 rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors">
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
              className="rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors">
              {autoRefresh ? <Activity className="h-4 w-4 text-green-400" /> : <Clock className="h-4 w-4 text-white/30" />}
            </button>
            <button onClick={() => { setLoading(true); fetchAll(); }}
              className="rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04] transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: GOLD }} />
            </button>
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

        {/* ────────────────── DASHBOARD TAB ────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            {/* Status banner */}
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
                    <><PulsingDot color={CYAN} /><span className="text-sm font-bold" style={{ color: CYAN }}>CONNECTING…</span></>
                  )}
                </div>
                <Pill color={health?.mode === 'PAPER' ? '#94a3b8' : '#22c55e'}>{health?.mode ?? '—'} MODE</Pill>
              </div>
              {health && lastScanAgo !== null && (
                <div className="mt-3 text-[11px] text-white/30">
                  Last scan {lastScanAgo < 60 ? `${lastScanAgo}s ago` : `${Math.floor(lastScanAgo / 60)}m ago`}
                  {' · '}{lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Stats */}
            {health && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard icon={DollarSign} label="Balance"  value={`$${health.balance?.toFixed(2)}`} sub="Paper wallet" glow />
                <StatCard icon={BarChart3}  label="Signals"  value={health.signalCount ?? '—'} sub="Delta triggers" />
                <StatCard icon={TrendingUp} label="Trades"   value={health.tradeCount ?? '—'} sub={`${health.winRate ?? '—'}% win rate`} />
                <StatCard icon={Zap}        label="Uptime"   value={`${uptimeHrs}h`} sub="Continuous" />
              </div>
            )}

            {/* Strategy explainer */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4" style={{ color: CYAN }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">How The Edge Works</span>
              </div>
              {[
                ['⚡', 'Binance WebSocket', 'BTC/ETH/SOL price streamed at sub-50ms latency'],
                ['📐', 'Delta Detection',   'Bot measures % move from window open price'],
                ['🎯', 'Signal Filter',      '0.15%+ delta = 92%+ certainty. Below threshold = ignored'],
                ['⏱', 'Oracle Lag',         'Chainlink updates every 10–30s. Bot fires in that gap'],
                ['💥', 'Entry',              'Buy winning token while Polymarket still shows ~50/50'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04]">
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
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">ROI Projections (capped)</span>
              </div>
              {ROI_SCENARIOS.map(s => (
                <div key={s.label} className="py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-white/70">{s.label}</span>
                    <span className="text-[11px] font-black" style={{ color: GOLD }}>{s.wr}% win rate</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['Daily', `+${s.daily}%`], ['Monthly', `+${s.monthly}%`], ['Trades/Day', `${s.tpd}`]].map(([lbl, val]) => (
                      <div key={lbl} className="rounded-xl bg-white/[0.03] p-2 text-center">
                        <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">{lbl}</div>
                        <div className="text-[12px] font-black" style={{ color: CYAN }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-white/20 mt-3 leading-relaxed">
                ⚠ Paper mode runs 72h before going live. Kill switch stops bot at −20% session loss. Past signals do not guarantee future results.
              </p>
            </div>

            {/* Recent trades */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Recent Signals</span>
                </div>
                {health && <Pill color={health.tradeCount > 0 ? '#22c55e' : '#94a3b8'}>{health.tradeCount ?? 0} total</Pill>}
              </div>
              {trades.length === 0 ? (
                <div className="text-center py-6">
                  <BarChart3 className="h-8 w-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/25">Waiting for 0.15%+ delta signal…</p>
                </div>
              ) : trades.slice(0, 8).map((t, i) => (
                <div key={i} className="flex items-start justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white/70">{t.asset ?? 'BTC'} {t.interval ?? '15m'}</div>
                    <div className="flex gap-2 mt-0.5">
                      {t.signal && <span className={`text-[10px] font-bold ${t.signal === 'UP' ? 'text-green-400' : 'text-red-400'}`}>{t.signal}</span>}
                      {t.delta && <span className="text-[10px] text-white/30">Δ {t.delta}</span>}
                    </div>
                  </div>
                  {t.size_usd && <div className="text-[11px] font-bold ml-3" style={{ color: GOLD }}>${t.size_usd}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ────────────────── WALLET TAB ────────────────── */}
        {activeTab === 'wallet' && (
          <>
            {/* Fee schedule */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Profit Share Schedule</span>
              </div>
              {[
                { t: 'Free',            fee: '50%', color: '#94a3b8' },
                { t: 'Prana-Flow',      fee: '25%', color: CYAN      },
                { t: 'Siddha-Quantum',  fee: '10%', color: GOLD      },
                { t: 'Akasha-Infinity', fee: '5%',  color: '#E879F9' },
              ].map(({ t, fee, color }) => (
                <div key={t} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
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
                Enter your Polygon wallet. Delta-Arb Bot will execute BTC/ETH/SOL 15-minute signals automatically.
              </p>
              <div className="mb-3">
                <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-2">Polygon Wallet Address</label>
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
                  color:   walletSaved ? '#22c55e' : GOLD,
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
                ['1', 'Bot detects 0.15%+ BTC/ETH/SOL momentum on Binance', CYAN],
                ['2', 'Confirms Polymarket oracle still shows ~50/50', '#94a3b8'],
                ['3', 'Executes buy on winning token (8–45s before close)', '#22c55e'],
                ['4', 'Market resolves — you win or lose', '#94a3b8'],
                [`5`, `Platform fee (${feePct}%) deducted from winnings`, '#E879F9'],
                ['6', 'Net profit stays in your Polymarket wallet', GOLD],
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

        {/* ────────────────── EARNINGS TAB ────────────────── */}
        {activeTab === 'earnings' && (
          <>
            {myStats ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard icon={DollarSign} label="Gross Won"  value={`$${myStats.totalGross.toFixed(2)}`} glow />
                <StatCard icon={Shield}     label="Fees Paid"  value={`$${myStats.totalFees.toFixed(2)}`} sub={`${feePct}% rate`} />
                <StatCard icon={TrendingUp} label="Net Profit" value={`$${myStats.totalNet.toFixed(2)}`}  sub="After fees" />
                <StatCard icon={Target}     label="Payouts"    value={myStats.payouts} sub="Winning trades" />
              </div>
            ) : (
              <div className={`${GLASS} p-8 mb-4 text-center`}>
                <BarChart3 className="h-10 w-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">No earnings yet</p>
                <p className="text-[11px] text-white/20 mt-1">Connect your wallet and wait for the first delta signal</p>
              </div>
            )}

            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">My Trades</span>
                </div>
                <Pill color="#94a3b8">{myTrades.length} total</Pill>
              </div>
              {myTrades.length === 0 ? (
                <p className="text-[12px] text-white/25 text-center py-6">Trades appear here once wallet is connected</p>
              ) : myTrades.slice(0, 10).map((t, i) => (
                <div key={i} className="flex items-start justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white/70 truncate">{t.asset ?? 'BTC'} {t.interval ?? '15m'} {t.signal ?? ''}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold ${t.status === 'won' ? 'text-green-400' : t.status === 'lost' ? 'text-red-400' : 'text-white/40'}`}>
                        {t.status?.toUpperCase()}
                      </span>
                      {t.delta && <span className="text-[10px] text-white/25">Δ {t.delta}</span>}
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-[11px] font-bold" style={{ color: GOLD }}>${parseFloat(t.size_usd || 0).toFixed(2)}</div>
                    {t.net_pnl_usdc && (
                      <div className={`text-[10px] font-bold ${parseFloat(t.net_pnl_usdc) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(t.net_pnl_usdc) >= 0 ? '+' : ''}{parseFloat(t.net_pnl_usdc).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ────────────────── AFFILIATE TAB ────────────────── */}
        {activeTab === 'affiliate' && (
          <>
            {/* Commission rates for this tier */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Your Affiliate Rates</span>
                <Pill color={CYAN}>{tier?.replace('_', '-').toUpperCase()}</Pill>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 text-center">
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/30 mb-1">Level 1 Commission</div>
                  <div className="text-3xl font-black" style={{ color: GOLD }}>{l1Rate}%</div>
                  <div className="text-[10px] text-white/25 mt-1">of their gross wins</div>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 text-center">
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/30 mb-1">Level 2 Commission</div>
                  <div className="text-3xl font-black" style={{ color: CYAN }}>{l2Rate}%</div>
                  <div className="text-[10px] text-white/25 mt-1">from their referrals</div>
                </div>
              </div>

              {/* Full rate table */}
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/25 mb-3">Full Rate Schedule</div>
                <div className="grid grid-cols-4 gap-1 text-center mb-1">
                  {['Tier', 'L1', 'L2', 'Keep'].map(h => (
                    <div key={h} className="text-[9px] font-bold tracking-widest uppercase text-white/25">{h}</div>
                  ))}
                </div>
                {[
                  { t: 'Free',    l1: 10, l2: 3,  keep: 37,  color: '#94a3b8' },
                  { t: 'Prana',   l1: 8,  l2: 2,  keep: 65,  color: CYAN      },
                  { t: 'Siddha',  l1: 5,  l2: 1,  keep: 84,  color: GOLD      },
                  { t: 'Akasha',  l1: 3,  l2: 1,  keep: 91,  color: '#E879F9' },
                ].map(row => (
                  <div key={row.t} className="grid grid-cols-4 gap-1 text-center py-1.5 border-t border-white/[0.04]">
                    <div className="text-[11px] font-bold" style={{ color: row.color }}>{row.t}</div>
                    <div className="text-[11px] font-black" style={{ color: GOLD }}>{row.l1}%</div>
                    <div className="text-[11px] font-black" style={{ color: CYAN }}>{row.l2}%</div>
                    <div className="text-[11px] font-bold text-green-400">{row.keep}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Affiliate link */}
            {affiliateProfile ? (
              <div className={`${GLASS} p-5 mb-4`}>
                <div className="flex items-center gap-2 mb-4">
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
                    color: copied ? '#22c55e' : GOLD,
                  }}>
                  {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Link</>}
                </button>
              </div>
            ) : (
              <div className={`${GLASS} p-6 mb-4 text-center`}>
                <Share2 className="h-8 w-8 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40">No affiliate profile yet</p>
                <p className="text-[11px] text-white/20 mt-1">Go to the Affiliate section to activate your referral link</p>
                <button onClick={() => navigate('/income-streams/affiliate')}
                  className="mt-4 rounded-2xl border px-5 py-2 text-[11px] font-extrabold tracking-[0.2em] uppercase"
                  style={{ borderColor: `${GOLD}44`, color: GOLD }}>
                  Activate Affiliate
                </button>
              </div>
            )}

            {/* Affiliate earnings */}
            {affiliateStats && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard icon={DollarSign} label="L1 Trading Commissions" value={`$${affiliateStats.l1Total.toFixed(2)}`} glow />
                <StatCard icon={Users}      label="L2 Trading Commissions" value={`$${affiliateStats.l2Total.toFixed(2)}`} />
              </div>
            )}

            {/* How affiliate works */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">How Referrals Work</span>
              </div>
              {[
                [`You refer Person B with your link`, GOLD],
                [`Person B wins a trade → you earn ${l1Rate}% of their gross win`, '#22c55e'],
                [`Person B refers Person C → you earn ${l2Rate}% of C's wins too`, CYAN],
                [`Commissions credited automatically, every winning trade`, '#E879F9'],
                [`Upgrade your tier to earn higher % on every referral`, GOLD],
              ].map(([text, color], i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04]">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: `${color}22`, color }}>
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-white/50">{text}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
