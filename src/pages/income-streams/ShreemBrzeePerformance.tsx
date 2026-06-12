import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// ── SQI 2050 Design Tokens ─────────────────────────────────────────────
const COLORS = {
  gold:        '#D4AF37',
  black:       '#050505',
  cyan:        '#22D3EE',
  green:       '#4ADE80',
  red:         '#F87171',
  glassBg:     'rgba(255,255,255,0.02)',
  glassBorder: 'rgba(255,255,255,0.05)',
};
const glass: React.CSSProperties = {
  background: COLORS.glassBg, backdropFilter: 'blur(40px)',
  border: `1px solid ${COLORS.glassBorder}`, borderRadius: 24, padding: 20,
};
const microLabel: React.CSSProperties = {
  fontSize: 8, fontWeight: 800, letterSpacing: '0.45em',
  textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)',
};

interface Signal {
  id: number;
  sig: string;
  wallet: string;
  label: string;
  action: 'BUY' | 'SELL';
  mint: string;
  symbol?: string;
  amount_sol?: number;
  token_amount?: number;
  is_pump_fun?: boolean;
  block_time?: number;
  created_at: string;
}

interface Stats {
  total: number;
  buys: number;
  sells: number;
  totalVolumeSol: number;
  uniqueTokens: number;
  whaleBreakdown: Record<string, { buys: number; sells: number; volume: number }>;
}

export default function ShreemBrzeePerformance() {
  const navigate = useNavigate();
  const [signals, setSignals]     = useState<Signal[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [activeTab, setActiveTab] = useState<'signals' | 'whales' | 'about'>('signals');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('shreem_brzee_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (timeFilter !== 'all') {
        const hours = timeFilter === '24h' ? 24 : timeFilter === '7d' ? 168 : 720;
        const since = new Date(Date.now() - hours * 3600000).toISOString();
        query = query.gte('created_at', since);
      }

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data || []) as Signal[];
      setSignals(rows);

      // Compute stats
      const whaleBreakdown: Stats['whaleBreakdown'] = {};
      let totalVolume = 0;
      const mints = new Set<string>();
      rows.forEach(r => {
        if (!whaleBreakdown[r.label]) whaleBreakdown[r.label] = { buys: 0, sells: 0, volume: 0 };
        if (r.action === 'BUY') whaleBreakdown[r.label].buys++;
        else whaleBreakdown[r.label].sells++;
        whaleBreakdown[r.label].volume += r.amount_sol || 0;
        totalVolume += r.amount_sol || 0;
        mints.add(r.mint);
      });
      setStats({
        total: rows.length,
        buys: rows.filter(r => r.action === 'BUY').length,
        sells: rows.filter(r => r.action === 'SELL').length,
        totalVolumeSol: totalVolume,
        uniqueTokens: mints.size,
        whaleBreakdown,
      });
    } catch (e) {
      console.error('Error loading signals:', e);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('shreem_brzee_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shreem_brzee_signals' },
        () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const timeAgo = (ts: string | number) => {
    const ms = typeof ts === 'number' ? ts * 1000 : new Date(ts).getTime();
    const diff = Date.now() - ms;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.black, color: '#fff',
      fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => navigate('/affiliate/dashboard')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
            fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 16 }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ fontSize: 28 }}>🔱</div>
          <div>
            <p style={{ ...microLabel, color: 'rgba(212,175,55,0.6)', marginBottom: 4 }}>SQI 2050 · SOLANA</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.gold,
              letterSpacing: '-0.04em', margin: 0 }}>Shreem Brzee Bot</h1>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ ...microLabel, marginBottom: 2 }}>LIVE SIGNALS</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: COLORS.green, margin: 0 }}>
              {stats ? stats.total : '—'}
            </p>
          </div>
        </div>

        {/* Time filter */}
        <div style={{ display: 'flex', gap: 6, margin: '16px 0' }}>
          {(['24h','7d','30d','all'] as const).map(f => (
            <button key={f} onClick={() => setTimeFilter(f)} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 10, fontWeight: 800,
              letterSpacing: '0.15em', cursor: 'pointer', textTransform: 'uppercase' as const,
              background: timeFilter === f ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${timeFilter === f ? 'rgba(212,175,55,0.4)' : COLORS.glassBorder}`,
              color: timeFilter === f ? COLORS.gold : 'rgba(255,255,255,0.4)',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '0 20px 16px' }}>
          {[
            { label: 'TOTAL SIGNALS', value: stats.total },
            { label: 'BUYS',          value: stats.buys, color: COLORS.green },
            { label: 'SELLS',         value: stats.sells, color: COLORS.red },
            { label: 'TOKENS',        value: stats.uniqueTokens },
          ].map(s => (
            <div key={s.label} style={{ ...glass, textAlign: 'center', padding: '12px 8px' }}>
              <p style={{ ...microLabel, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 18, fontWeight: 900, margin: 0,
                color: s.color || COLORS.gold }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px 16px' }}>
        {(['signals','whales','about'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 16px', borderRadius: 12, fontSize: 9, fontWeight: 800,
            letterSpacing: '0.2em', cursor: 'pointer', textTransform: 'uppercase' as const,
            background: activeTab === t ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${activeTab === t ? 'rgba(212,175,55,0.3)' : COLORS.glassBorder}`,
            color: activeTab === t ? COLORS.gold : 'rgba(255,255,255,0.4)',
          }}>{t}</button>
        ))}
        <button onClick={loadData} style={{
          marginLeft: 'auto', padding: '8px 12px', borderRadius: 12, fontSize: 9,
          fontWeight: 800, cursor: 'pointer', background: 'rgba(34,211,238,0.06)',
          border: '1px solid rgba(34,211,238,0.2)', color: COLORS.cyan, letterSpacing: '0.15em',
        }}>↻ REFRESH</button>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* SIGNALS TAB */}
        {activeTab === 'signals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ ...glass, textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
                Loading signals…
              </div>
            ) : signals.length === 0 ? (
              <div style={{ ...glass, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  No signals yet for this period.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8 }}>
                  Helius webhook is live — signals appear here the moment a whale swaps.
                </p>
              </div>
            ) : signals.map(s => (
              <div key={s.id} style={{
                ...glass,
                borderLeft: `3px solid ${s.action === 'BUY' ? COLORS.green : COLORS.red}`,
                padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                        color: s.action === 'BUY' ? COLORS.green : COLORS.red,
                        background: s.action === 'BUY' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        border: `1px solid ${s.action === 'BUY' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                        borderRadius: 99, padding: '2px 8px',
                      }}>{s.action}</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: COLORS.gold }}>
                        {s.symbol || s.mint.slice(0,8) + '…'}
                      </span>
                      {s.is_pump_fun && (
                        <span style={{ fontSize: 8, color: 'rgba(168,85,247,0.8)', fontWeight: 700 }}>
                          pump.fun
                        </span>
                      )}
                    </div>
                    <p style={{ ...microLabel, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                      {s.label}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {s.amount_sol ? (
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>
                        {s.amount_sol.toFixed(3)} SOL
                      </p>
                    ) : null}
                    <p style={{ ...microLabel, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                      {timeAgo(s.block_time || s.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WHALES TAB */}
        {activeTab === 'whales' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(stats.whaleBreakdown)
              .sort((a, b) => b[1].buys + b[1].sells - (a[1].buys + a[1].sells))
              .map(([label, data]) => (
              <div key={label} style={glass}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 900, color: COLORS.gold, margin: '0 0 4px' }}>{label}</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 10, color: COLORS.green }}>
                        ↑ {data.buys} BUY
                      </span>
                      <span style={{ fontSize: 10, color: COLORS.red }}>
                        ↓ {data.sells} SELL
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>
                      {data.volume.toFixed(2)} SOL
                    </p>
                    <p style={{ ...microLabel, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                      TOTAL VOLUME
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(stats.whaleBreakdown).length === 0 && (
              <div style={{ ...glass, textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  No whale activity recorded yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🔱', title: 'What is Shreem Brzee Bot?',
                body: 'An automated Solana copy trading engine that mirrors trades from 21 elite whale wallets in real time. When a whale buys a meme coin, you buy the same token proportionally. When they sell, you sell.' },
              { icon: '⚡', title: 'How does detection work?',
                body: 'Helius webhook monitors all 21 wallet addresses 24/7 on Solana mainnet. Every swap transaction is captured server-side and stored in Supabase within 1-2 seconds. No browser needs to be open.' },
              { icon: '📊', title: 'Paper Mode First',
                body: '3-day paper trading session runs with 2 SOL simulated balance. Fees, slippage (3%), 12% transaction failure rate, and competition entry penalty are all simulated to match live conditions within 5%.' },
              { icon: '🐋', title: 'The Whales',
                body: '21 tracked wallets including Remusofmars (+$1.2M from $370), Cupsey, Heyitsyolo, and 18 others. VIP wallets get 2-3× higher risk allocation and priority fees.' },
              { icon: '💰', title: 'Live Trading',
                body: 'After paper validation, connect Phantom wallet and switch to LIVE mode. Jupiter v6 executes real swaps with skip-preflight and dynamic priority fees for fastest possible execution.' },
            ].map(item => (
              <div key={item.title} style={glass}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 900, color: COLORS.gold, margin: 0 }}>{item.title}</p>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}

            <div style={{ ...glass, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.2)', textAlign: 'center', padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: COLORS.gold, marginBottom: 8 }}>
                Start Paper Trading
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.6 }}>
                No wallet needed for paper mode. Test with 2 SOL simulated balance for 3 days.
              </p>
              <button
                onClick={() => navigate('/income-streams/fomo-copy-bot')}
                style={{
                  padding: '12px 28px', borderRadius: 14, cursor: 'pointer',
                  background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)',
                  color: COLORS.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.2em',
                }}
              >
                OPEN BOT →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
