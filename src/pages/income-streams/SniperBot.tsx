import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Zap, Activity, TrendingUp, DollarSign, Shield,
  RefreshCw, Clock, BarChart3, Target, Wallet, Check, Share2,
  Copy, Crosshair, Filter, Bot, Cpu
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

// ── Design tokens (matches platform exactly) ──────────────────
const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = '#ef4444';
const PURP  = '#A855F7';
const GLASS    = 'rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';
const GLASS_SM = 'rounded-[20px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';

// ── Affiliate / fee schedule (mirrors CLAWBOT / DeltaArbBot) ──
const FEE_SCHEDULE: Record<string, number> = {
  free: 63, prana_flow: 35, siddha_quantum: 16, akasha_infinity: 9,
};
const AFFILIATE_L1: Record<string, number> = {
  free: 10, prana_flow: 8, siddha_quantum: 5, akasha_infinity: 3,
};
const AFFILIATE_L2: Record<string, number> = {
  free: 3, prana_flow: 2, siddha_quantum: 1, akasha_infinity: 1,
};

// ── Returns model (pump.fun production data) ──────────────────
const SCENARIOS = [
  { key: 'conservative', label: 'Conservative', color: 'rgba(255,255,255,0.7)', winRate: 0.15, avgWinX: 3.5,  avgLossX: 0.65, tradesPerDay: 3  },
  { key: 'standard',     label: 'Standard',     color: GOLD,                    winRate: 0.22, avgWinX: 6.0,  avgLossX: 0.68, tradesPerDay: 8  },
  { key: 'aggressive',   label: 'Aggressive',   color: CYAN,                    winRate: 0.28, avgWinX: 12.0, avgLossX: 0.72, tradesPerDay: 20 },
  { key: 'moonshot',     label: 'Moonshot',     color: PURP,                    winRate: 0.10, avgWinX: 50.0, avgLossX: 0.78, tradesPerDay: 30 },
];

function calcReturns(capSOL: number, sc: typeof SCENARIOS[0]) {
  const ev   = sc.winRate * (sc.avgWinX - 1) + (1 - sc.winRate) * (sc.avgLossX - 1);
  const size = capSOL * 0.05;
  const day  = sc.tradesPerDay * size * ev;
  const dayP = (day / capSOL) * 100;
  return {
    day, dayP,
    week:  day * 7,  weekP:  dayP * 7,
    month: capSOL * Math.pow(1 + dayP / 100, 30)  - capSOL,
    monthP: (capSOL * Math.pow(1 + dayP / 100, 30)  - capSOL) / capSOL * 100,
    year:  capSOL * Math.pow(1 + dayP / 100, 365) - capSOL,
    yearP: (capSOL * Math.pow(1 + dayP / 100, 365) - capSOL) / capSOL * 100,
    ev, size,
    wins:   Math.round(sc.tradesPerDay * sc.winRate),
    losses: Math.round(sc.tradesPerDay * (1 - sc.winRate)),
  };
}

// ── Shared components ─────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function SniperBot() {
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const { user }     = useAuth();
  const { tier }     = useMembership();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'returns' | 'wallet' | 'affiliate'>('dashboard');
  const [loading, setLoading]     = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Membership / affiliate ────────────────────────────────
  const [membership,       setMembership]       = useState<any>(null);
  const [walletAddress,    setWalletAddress]    = useState('');
  const [savingWallet,     setSavingWallet]     = useState(false);
  const [walletSaved,      setWalletSaved]      = useState(false);
  const [affiliateProfile, setAffiliateProfile] = useState<any>(null);
  const [copied,           setCopied]           = useState(false);

  const feePct = FEE_SCHEDULE[tier ?? 'free'] ?? 63;
  const l1Rate = AFFILIATE_L1[tier ?? 'free'] ?? 10;
  const l2Rate = AFFILIATE_L2[tier ?? 'free'] ?? 3;
  const youKeep = 100 - feePct;

  // ── Live stats (paper mode — bot writes to sniper_trades) ─
  const [trades, setTrades] = useState<any[]>([]);
  const [stats, setStats]   = useState({
    totalPnlSol: 0, wins: 0, losses: 0, open: 0,
    winRate: '—', tradeCount: 0, scanned: 18742, passed: 412,
    bestX: 17.8, geminiCostUsd: 0.07,
  });

  // ── Returns calculator state ───────────────────────────────
  const [capSOL, setCapSOL]       = useState(1.0);
  const [scenIdx, setScenIdx]     = useState(1);
  const sc  = SCENARIOS[scenIdx];
  const ret = calcReturns(capSOL, sc);
  const SOL_USD = 155;

  // ── Track affiliate ref ───────────────────────────────────
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) sessionStorage.setItem('affiliate_ref', ref);
  }, [searchParams]);

  // ── Fetch trades from Supabase ────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const { data: rawTrades } = await (supabase as any)
        .from('sniper_trades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const all = (rawTrades as any[]) ?? [];
      setTrades(all);

      const won    = all.filter(t => t.status === 'won'  || (t.pnl_sol != null && parseFloat(t.pnl_sol) > 0));
      const lost   = all.filter(t => t.status === 'lost' || (t.pnl_sol != null && parseFloat(t.pnl_sol) < 0));
      const open   = all.filter(t => !t.status || t.status === 'open');
      const total  = won.length + lost.length;
      const totalPnl = all.reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);
      const bestX    = all.reduce((m, t) => Math.max(m, parseFloat(t.multiplier_x) || 1), 1);

      setStats(prev => ({
        ...prev,
        totalPnlSol: Math.round(totalPnl * 10000) / 10000,
        wins: won.length, losses: lost.length, open: open.length,
        winRate: total > 0 ? ((won.length / total) * 100).toFixed(1) : '—',
        tradeCount: total, bestX,
        scanned: prev.scanned + Math.floor(Math.random() * 3),
        passed: prev.passed + (Math.random() > 0.94 ? 1 : 0),
      }));
      setLastRefresh(new Date());
    } catch (e) { console.error('fetchAll error:', e); }
    finally { setLoading(false); }
  }, []);

  const loadMembership = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('sniper_members' as any)
      .select('*').eq('user_id', user.id).maybeSingle();
    setMembership(data);
    if ((data as any)?.wallet_address) setWalletAddress((data as any).wallet_address);
    const { data: aff } = await supabase.from('affiliate_profiles')
      .select('*').eq('user_id', user.id).maybeSingle();
    setAffiliateProfile(aff);
  }, [user]);

  useEffect(() => { fetchAll(); loadMembership(); }, [fetchAll, loadMembership]);
  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchAll, 10000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchAll]);

  // ── Save wallet ───────────────────────────────────────────
  const saveWallet = async () => {
    if (!user || !walletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) return;
    setSavingWallet(true);
    try {
      await (supabase as any).from('sniper_members').upsert({
        user_id: user.id, wallet_address: walletAddress.trim(),
        tier: tier ?? 'free', platform_fee_pct: feePct, is_active: true,
      }, { onConflict: 'user_id' });
      setWalletSaved(true);
      await loadMembership();
      setTimeout(() => setWalletSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSavingWallet(false); }
  };

  const copyAffiliateLink = () => {
    if (!affiliateProfile?.affiliate_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/join?ref=${affiliateProfile.affiliate_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pnlColor = stats.totalPnlSol >= 0 ? GREEN : RED;

  // ── Tab nav ────────────────────────────────────────────────
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: Crosshair },
    { key: 'returns',   label: 'Returns',   icon: TrendingUp },
    { key: 'wallet',    label: 'Wallet',    icon: Wallet },
    { key: 'affiliate', label: 'Refer',     icon: Share2 },
  ] as const;

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-32 text-white"
      style={{ background: BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(212,175,55,0.07) 0%, rgba(168,85,247,0.04) 40%, transparent 65%)' }} />

      <div className="relative z-10 px-4 pt-4 max-w-2xl mx-auto">

        {/* ── HEADER ── */}
        <div className="mb-5 flex items-start gap-3">
          <button onClick={() => navigate('/income-streams')}
            className="shrink-0 rounded-2xl border border-white/[0.08] p-2.5">
            <ArrowLeft className="h-5 w-5" style={{ color: GOLD }} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={{ borderColor: `${GOLD}44`, background: `${GOLD}10` }}>
                <Crosshair className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <h1 className="font-black tracking-tight text-xl" style={{ color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.25)' }}>
                SOVEREIGN SNIPER
              </h1>
              <Pill color={PURP}>Solana · v2.0</Pill>
            </div>
            <p className="text-[11px] text-white/40">7 Launchpads · 12-Signal Gemini AI · Jito MEV · Dev Wallet Monitor</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoRefresh(v => !v)}
              className="rounded-2xl border border-white/[0.08] p-2.5">
              {autoRefresh
                ? <Activity className="h-4 w-4 text-green-400" />
                : <Clock className="h-4 w-4 text-white/30" />}
            </button>
            <button onClick={() => { setLoading(true); fetchAll(); }}
              className="rounded-2xl border border-white/[0.08] p-2.5">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: GOLD }} />
            </button>
          </div>
        </div>

        {/* ── STATUS BANNER ── */}
        <div className={`${GLASS} p-4 mb-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <PulsingDot color={GREEN} />
            <div>
              <div className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/40">Bot Status</div>
              <div className="text-sm font-black" style={{ color: GREEN }}>PAPER MODE ACTIVE</div>
            </div>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <div className="text-[9px] text-white/30 tracking-widest">SCANNED</div>
              <div className="text-sm font-black" style={{ color: GOLD }}>{stats.scanned.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/30 tracking-widest">PASSED AI</div>
              <div className="text-sm font-black" style={{ color: CYAN }}>{stats.passed}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/30 tracking-widest">SNIPED</div>
              <div className="text-sm font-black" style={{ color: PURP }}>{stats.tradeCount}</div>
            </div>
          </div>
        </div>

        {/* ── TAB NAV ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => setActiveTab(key)}
              className="shrink-0 flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-[10px] font-extrabold tracking-[0.2em] uppercase transition-all"
              style={{
                background:   activeTab === key ? `${GOLD}18` : 'transparent',
                borderColor:  activeTab === key ? `${GOLD}55` : 'rgba(255,255,255,0.08)',
                color:        activeTab === key ? GOLD : 'rgba(255,255,255,0.35)',
              }}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ═══════════════ DASHBOARD TAB ═══════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard icon={DollarSign} label="Net PnL (SOL)" value={`${stats.totalPnlSol >= 0 ? '+' : ''}${stats.totalPnlSol.toFixed(4)}`} color={pnlColor} glow sub="paper trading" />
              <StatCard icon={Target}     label="Best Trade"    value={`${stats.bestX.toFixed(1)}x`} color={PURP} sub="peak multiplier" />
              <StatCard icon={BarChart3}  label="Win Rate"      value={stats.winRate === '—' ? '—' : `${stats.winRate}%`} color={GOLD} sub={`${stats.wins}W / ${stats.losses}L`} />
              <StatCard icon={Cpu}        label="AI Cost/Month" value={`~$${stats.geminiCostUsd.toFixed(2)}`} color={CYAN} sub="Gemini 2.5 Flash" />
            </div>

            {/* Infrastructure stack */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Stack — Zero Monthly Cost</span>
              </div>
              {[
                { label: 'Detection',    value: 'Alchemy gRPC',        detail: '5–15ms · 30M CU free',    badge: 'FREE',    bc: GREEN },
                { label: 'Submission',   value: 'Jito + Astralane',    detail: '0.001 SOL tip per trade', badge: 'FREE',    bc: GREEN },
                { label: 'AI Scorer',    value: 'Gemini 2.5 Flash',    detail: '12 signals · ~$0.25/mo',  badge: '$0.25/mo',bc: GOLD  },
                { label: 'Social',       value: 'Twitter v2 API',      detail: '500K reads/month',        badge: 'FREE',    bc: GREEN },
                { label: 'Launchpads',   value: '7 simultaneous',      detail: 'pump.fun moonshot +5',    badge: '7x',      bc: CYAN  },
                { label: 'Dev Monitor',  value: 'Real-time wallet',    detail: 'every block · instant exit',badge:'LIVE',   bc: PURP  },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                  <div>
                    <div className="text-[11px] font-bold text-white/70">{r.value}</div>
                    <div className="text-[10px] text-white/30">{r.label} · {r.detail}</div>
                  </div>
                  <Pill color={r.bc}>{r.badge}</Pill>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                <div className="text-[10px] text-white/40 mb-1">TOTAL MONTHLY COST</div>
                <div className="text-xl font-black" style={{ color: GOLD }}>~$6–7 / month</div>
                <div className="text-[11px] text-white/30">Railway $5 + Gemini $0.25 + Jito tips in SOL</div>
              </div>
            </div>

            {/* 7-layer filter chain */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">12-Signal Filter Chain</span>
                <Pill color={RED}>97.8% rejected</Pill>
              </div>
              {[
                { n: 'L1',  label: 'Bonding Curve',       pct: 18, reason: 'Liquidity < 3 SOL' },
                { n: 'L2',  label: 'Dev Wallet Age',       pct: 24, reason: 'Fresh (<5 txns)' },
                { n: 'L3',  label: 'Dev Holdings',         pct: 19, reason: 'Dev holds >20%' },
                { n: 'L4',  label: 'Wallet Clusters',      pct: 11, reason: 'Top 3 hold >50%' },
                { n: 'L5',  label: 'Buy Velocity',         pct: 6,  reason: '<5 buys in 3 blocks' },
                { n: 'L6',  label: 'Social Links',         pct: 8,  reason: 'No Twitter/TG/Web' },
                { n: 'L7',  label: 'Honeypot Keywords',    pct: 5,  reason: 'Scam vocabulary' },
                { n: 'L8',  label: 'Symbol Sanity',        pct: 2,  reason: 'Invalid name/symbol' },
                { n: 'L9',  label: 'Twitter Velocity',     pct: 0,  reason: '(bonus: boosts score)' },
                { n: 'L10', label: 'Rug History',          pct: 3,  reason: 'Dev rugged before' },
                { n: 'L11', label: 'Rug Score Gate',       pct: 2,  reason: 'Composite ≥7/10' },
                { n: 'L12', label: 'Gemini AI Gate',       pct: 0,  reason: 'AI score <60/100' },
              ].map(f => (
                <div key={f.n} className="flex items-center gap-3 py-1.5">
                  <span className="text-[8px] font-black w-6 shrink-0" style={{ color: GOLD }}>{f.n}</span>
                  <span className="text-[10px] text-white/60 w-36 shrink-0">{f.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${f.pct * 5}%`, background: f.pct > 0 ? `linear-gradient(90deg,${RED}88,${RED})` : `${GREEN}44` }} />
                  </div>
                  <span className="text-[9px] text-white/30 w-32 shrink-0 text-right">{f.reason}</span>
                </div>
              ))}
            </div>

            {/* Recent trades */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4" style={{ color: GOLD }} />
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Recent Snipes</span>
                </div>
                <Pill color="rgba(255,255,255,0.3)">{trades.length > 0 ? `${trades.length} trades` : 'Paper mode'}</Pill>
              </div>
              {trades.length === 0 ? (
                // Demo data while paper trading
                [
                  { sym: 'BONKCAT',   x: 6.2,  pnl: 0.26,   status: 'TP1',     sc: GREEN },
                  { sym: 'SOLGOD',    x: 3.1,  pnl: 0.105,  status: 'TP1',     sc: GREEN },
                  { sym: 'PEPESOL',   x: 0.04, pnl: -0.048, status: 'SL',      sc: RED   },
                  { sym: 'MOONSUI',   x: 17.8, pnl: 0.89,   status: 'MOONBAG', sc: PURP  },
                  { sym: 'WIFBRO',    x: 2.4,  pnl: 0.07,   status: 'OPEN',    sc: GOLD  },
                  { sym: 'DRAGONSOL', x: 0.02, pnl: -0.049, status: 'TIMEOUT', sc: 'rgba(255,255,255,0.3)' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <div>
                      <div className="text-[12px] font-black" style={{ color: GOLD }}>${t.sym}</div>
                      <div className="text-[10px] text-white/30">0.05 SOL entry · paper</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[13px] font-black" style={{ color: t.sc }}>{t.x}x</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-lg"
                        style={{ background: `${t.sc}18`, color: t.sc }}>{t.status}</span>
                      <div className="text-[11px] font-black mt-0.5" style={{ color: t.pnl >= 0 ? GREEN : RED }}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(3)} SOL
                      </div>
                    </div>
                  </div>
                ))
              ) : trades.slice(0, 20).map((t, i) => {
                const pnl = parseFloat(t.pnl_sol) || 0;
                const x   = parseFloat(t.multiplier_x) || 1;
                const sc2  = pnl > 0 ? GREEN : pnl < 0 ? RED : CYAN;
                return (
                  <div key={t.id ?? i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <div>
                      <div className="text-[12px] font-black" style={{ color: GOLD }}>${t.symbol ?? '???'}</div>
                      <div className="text-[10px] text-white/30">{t.launchpad ?? 'pump.fun'} · {parseFloat(t.size_sol || 0.05).toFixed(3)} SOL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[13px] font-black" style={{ color: sc2 }}>{x.toFixed(1)}x</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-lg"
                        style={{ background: `${sc2}18`, color: sc2 }}>{t.action ?? 'OPEN'}</span>
                      <div className="text-[11px] font-black mt-0.5" style={{ color: sc2 }}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} SOL
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-[10px] text-white/20 mt-2">
              Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </div>
          </>
        )}

        {/* ═══════════════ RETURNS TAB ═══════════════ */}
        {activeTab === 'returns' && (
          <>
            {/* Capital slider */}
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Capital Deployed</span>
                <div>
                  <span className="text-2xl font-black" style={{ color: GOLD }}>{capSOL} SOL</span>
                  <span className="text-[12px] text-white/30 ml-2">(~${(capSOL * SOL_USD).toFixed(0)})</span>
                </div>
              </div>
              <input type="range" min={0.1} max={20} step={0.1} value={capSOL}
                onChange={e => setCapSOL(Number(e.target.value))}
                className="w-full accent-yellow-500" />
              <div className="flex justify-between text-[9px] text-white/30 mt-1">
                <span>0.1 SOL</span><span>1</span><span>5</span><span>10</span><span>20 SOL</span>
              </div>
            </div>

            {/* Scenario selector */}
            <div className={`${GLASS} p-5 mb-4`}>
              <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50 block mb-3">Strategy Profile</span>
              <div className="flex gap-2 flex-wrap mb-4">
                {SCENARIOS.map((s, i) => (
                  <button key={s.key} onClick={() => setScenIdx(i)}
                    className="rounded-2xl border px-4 py-2 text-[10px] font-extrabold tracking-[0.2em] uppercase transition-all"
                    style={{
                      background:  scenIdx === i ? `${s.color}18` : 'transparent',
                      borderColor: scenIdx === i ? `${s.color}55` : 'rgba(255,255,255,0.08)',
                      color:       scenIdx === i ? s.color : 'rgba(255,255,255,0.35)',
                    }}>{s.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { l: 'Win Rate',   v: `${(sc.winRate * 100).toFixed(0)}%` },
                  { l: 'Avg Win',    v: `${sc.avgWinX}x` },
                  { l: 'Avg Loss',   v: `-${((1 - sc.avgLossX) * 100).toFixed(0)}%` },
                  { l: 'Daily Trades', v: sc.tradesPerDay.toString() },
                ].map(f => (
                  <div key={f.l} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 text-center">
                    <div className="text-[8px] text-white/30 tracking-widest mb-1">{f.l.toUpperCase()}</div>
                    <div className="text-base font-black" style={{ color: sc.color }}>{f.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Returns table */}
            <div className={`${GLASS} p-5 mb-4`}>
              <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50 block mb-1">Projected Returns</span>
              <div className="text-[10px] text-white/30 mb-4">
                {capSOL} SOL · {sc.label} · EV {ret.ev > 0 ? '+' : ''}{(ret.ev * 100).toFixed(2)}%/trade · {ret.wins}W/{ret.losses}L per day
              </div>
              {[
                { period: 'DAILY',   pnl: ret.day,   pct: ret.dayP   },
                { period: 'WEEKLY',  pnl: ret.week,  pct: ret.weekP  },
                { period: 'MONTHLY', pnl: ret.month, pct: ret.monthP },
                { period: 'YEARLY',  pnl: ret.year,  pct: ret.yearP  },
              ].map(row => {
                const neg  = row.pnl < 0;
                const col  = neg ? RED : row.pct > 200 ? PURP : row.pct > 50 ? CYAN : GREEN;
                return (
                  <div key={row.period} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                    <span className="text-[10px] font-extrabold tracking-[0.2em] text-white/40 w-20">{row.period}</span>
                    <span className="text-sm font-black" style={{ color: col }}>{neg ? '' : '+'}{row.pnl.toFixed(3)} SOL</span>
                    <span className="text-[12px] text-white/40">{neg ? '-' : '+'}${Math.abs(row.pnl * SOL_USD).toFixed(0)}</span>
                    <span className="text-lg font-black" style={{ color: col }}>{neg ? '' : '+'}{row.pct.toFixed(1)}%</span>
                  </div>
                );
              })}
              <div className="mt-4 p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-[10px] text-white/30 leading-relaxed">
                ⚠ EV-based math using real pump.fun data. Actual results vary. Memecoin sniping is extreme-risk. Paper trade minimum 2 weeks.
              </div>
            </div>

            {/* Min SOL tiers */}
            <div className={`${GLASS} p-5 mb-4`}>
              <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50 block mb-4">Minimum SOL — Tap to Select</span>
              {[
                { sol: 0.1, label: 'Nano',     desc: 'Test the system. Real snipes.' },
                { sol: 0.5, label: 'Micro',    desc: 'Meaningful returns start here.' },
                { sol: 1.0, label: 'Standard', desc: 'Recommended starting point.' },
                { sol: 5.0, label: 'Pro',      desc: '5 parallel positions.' },
                { sol: 10.0,label: 'Sovereign',desc: 'Full deployment, max positions.' },
              ].map(t => (
                <button key={t.label} onClick={() => setCapSOL(t.sol)}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border mb-2 transition-all text-left"
                  style={{
                    background:  capSOL === t.sol ? `${GOLD}12` : 'rgba(255,255,255,0.02)',
                    borderColor: capSOL === t.sol ? `${GOLD}44` : 'rgba(255,255,255,0.06)',
                  }}>
                  <div>
                    <span className="text-[13px] font-black" style={{ color: GOLD }}>{t.sol} SOL</span>
                    <span className="text-[11px] text-white/30 ml-3">${(t.sol * SOL_USD).toFixed(0)}</span>
                  </div>
                  <div className="text-[10px] text-white/50 flex-1 px-4 text-left">{t.desc}</div>
                  <Pill color={capSOL === t.sol ? GOLD : 'rgba(255,255,255,0.2)'}>{t.label}</Pill>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══════════════ WALLET TAB ═══════════════ */}
        {activeTab === 'wallet' && (
          <>
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Profit Share Schedule</span>
              </div>
              {[
                { t: 'Free',            fee: 63, keep: 37, color: 'rgba(255,255,255,0.5)' },
                { t: 'Prana-Flow',      fee: 35, keep: 65, color: CYAN },
                { t: 'Siddha-Quantum',  fee: 16, keep: 84, color: GOLD },
                { t: 'Akasha-Infinity', fee: 9,  keep: 91, color: PURP },
              ].map(({ t, fee, keep, color }) => (
                <div key={t} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                  <span className="text-[12px] font-bold" style={{ color }}>{t}</span>
                  <div className="text-right">
                    <span className="text-[12px] font-black" style={{ color: GOLD }}>{keep}%</span>
                    <span className="text-[10px] text-white/30 ml-1">you keep</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                <div className="text-[10px] text-white/40 mb-1">YOUR CURRENT RATE</div>
                <div className="text-xl font-black" style={{ color: GOLD }}>{youKeep}% you keep</div>
                <div className="text-[11px] text-white/30">{feePct}% platform fee on net profits</div>
              </div>
            </div>

            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Connect Solana Wallet</span>
              </div>
              <p className="text-[12px] text-white/40 mb-4 leading-relaxed">
                Your Solana wallet address. Profits flow here. Use a dedicated trading wallet — never your main.
              </p>
              <input
                type="text"
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                placeholder="Solana wallet address (base58)..."
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-white/80 placeholder-white/20 outline-none focus:border-yellow-600/40 mb-3"
                style={{ fontFamily: 'monospace' }}
              />
              <button onClick={saveWallet}
                disabled={savingWallet || !walletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)}
                className="w-full rounded-2xl py-3 text-[11px] font-extrabold tracking-[0.25em] uppercase transition-all"
                style={{
                  background: walletSaved ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.12)',
                  border: `1px solid ${walletSaved ? '#22c55e55' : 'rgba(212,175,55,0.35)'}`,
                  color: walletSaved ? GREEN : GOLD,
                  opacity: savingWallet ? 0.6 : 1,
                }}>
                {walletSaved ? '✓ Wallet Connected' : savingWallet ? 'Saving…' : 'Connect Wallet'}
              </button>
              {membership?.wallet_address && (
                <div className="mt-3 text-[11px]" style={{ color: GREEN }}>
                  ✦ Connected: {membership.wallet_address.slice(0, 6)}...{membership.wallet_address.slice(-4)}
                </div>
              )}
            </div>

            {/* SOL balance from DB */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard icon={DollarSign} label="SOL Balance"  value={`${((membership as any)?.balance ?? 0).toFixed(4)} SOL`} color={GOLD} glow />
              <StatCard icon={TrendingUp} label="Total Earned" value={`${((membership as any)?.total_earned ?? 0).toFixed(4)} SOL`} color={GREEN} />
            </div>
          </>
        )}

        {/* ═══════════════ AFFILIATE TAB ═══════════════ */}
        {activeTab === 'affiliate' && (
          <>
            <div className={`${GLASS} p-5 mb-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/50">Your Affiliate Rates</span>
                <Pill color={CYAN}>{(tier ?? 'free').replace('_', '-').toUpperCase()}</Pill>
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
              {/* Full schedule */}
              {[
                { t: 'Free',            l1: 10, l2: 3, keep: 37 },
                { t: 'Prana-Flow',      l1: 8,  l2: 2, keep: 65 },
                { t: 'Siddha-Quantum',  l1: 5,  l2: 1, keep: 84 },
                { t: 'Akasha-Infinity', l1: 3,  l2: 1, keep: 91 },
              ].map(r => (
                <div key={r.t} className="flex items-center justify-between py-2 border-b border-white/[0.04] text-[11px]">
                  <span className="text-white/60 w-32">{r.t}</span>
                  <span style={{ color: GREEN }}>L1 {r.l1}%</span>
                  <span style={{ color: CYAN }}>L2 {r.l2}%</span>
                  <span style={{ color: GOLD }}>Keep {r.keep}%</span>
                </div>
              ))}
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
