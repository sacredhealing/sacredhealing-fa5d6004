import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, Activity, Target, TrendingUp } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const DIM   = 'rgba(255,255,255,0.6)';

const SB_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const PROXY_URL = `${SB_URL}/functions/v1/flasharb-proxy`;

const glass = (extra = {}) => ({
  borderRadius: 28,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  marginBottom: 12,
  ...extra,
});

const label = {
  fontWeight: 800,
  letterSpacing: '0.5em',
  textTransform: 'uppercase' as const,
  fontSize: 8,
  color: DIM,
};

export default function FlashArbMonitor() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<any>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [spin, setSpin] = useState(false);
  const [err, setErr] = useState('');
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(iv);
  }, []);

  const load = useCallback(async () => {
    setSpin(true);
    setErr('');
    try {
      const [h, c] = await Promise.all([
        fetch(`${PROXY_URL}?endpoint=health`).then((r) => r.json()),
        fetch(`${PROXY_URL}?endpoint=checks&limit=100`).then((r) => r.json()),
      ]);
      setHealth(h);
      if (Array.isArray(c)) setChecks(c);
    } catch (e) {
      setErr('Failed to reach scanner backend');
    } finally {
      setSpin(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const viableChecks = checks.filter((c) => c.viable);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', paddingBottom: 40 }}>
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/income-streams')}
          style={{ background: 'none', border: 'none', color: DIM, cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={label}>SQI 2050 · SOLANA</div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.05em' }}>
            Flash Arb Scanner
          </div>
        </div>
        <button
          onClick={load}
          style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer' }}
        >
          <RefreshCw size={18} style={{ animation: spin ? 'spin 0.8s linear' : 'none' }} />
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Status banner */}
        <div style={{ ...glass({ padding: 16 }), display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 8, height: 8, borderRadius: 999,
              background: CYAN,
              boxShadow: pulse ? `0 0 12px ${CYAN}` : 'none',
              transition: 'box-shadow 0.4s',
            }}
          />
          <div>
            <div style={{ fontWeight: 900, fontSize: 14 }}>DETECTION ONLY — no execution, no capital at risk</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>
              Watches Raydium/Orca large swaps, probes Jupiter for residual imbalance, logs net profitability after real fees.
            </div>
          </div>
        </div>

        {err && (
          <div style={{ ...glass({ padding: 12 }), color: '#f87171', fontSize: 13 }}>{err}</div>
        )}

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <StatCard icon={<Activity size={16} color={GOLD} />} title="TOTAL CHECKS" value={health?.totalChecks ?? '—'} />
          <StatCard icon={<Target size={16} color={CYAN} />} title="VIABLE HITS" value={health?.viableCount ?? '—'} highlight={health?.viableCount > 0} />
          <StatCard icon={<Zap size={16} color={GOLD} />} title="AVG LATENCY" value={health?.avgLatencyMs != null ? `${health.avgLatencyMs}ms` : '—'} />
          <StatCard
            icon={<TrendingUp size={16} color={GREEN} />}
            title="BEST NET (USD)"
            value={health?.bestNetProfitUsd != null ? `$${health.bestNetProfitUsd.toFixed(2)}` : '—'}
          />
        </div>

        {/* Viable opportunities */}
        {viableChecks.length > 0 && (
          <>
            <div style={{ ...label, marginTop: 20, marginBottom: 8 }}>VIABLE OPPORTUNITIES</div>
            {viableChecks.map((c) => (
              <div key={c.id} style={glass({ padding: 14, border: `1px solid rgba(34,211,238,0.4)` })}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: CYAN }}>${Number(c.net_profit_usd).toFixed(2)} net</span>
                  <span style={{ fontSize: 11, color: DIM }}>{new Date(c.created_at).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>
                  swap ${Number(c.estimated_swap_usd).toLocaleString()} · {c.latency_ms}ms latency
                </div>
              </div>
            ))}
          </>
        )}

        {/* Recent activity log */}
        <div style={{ ...label, marginTop: 20, marginBottom: 8 }}>RECENT ACTIVITY</div>
        {checks.slice(0, 30).map((c) => (
          <div key={c.id} style={glass({ padding: '10px 14px', marginBottom: 6 })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: c.viable ? CYAN : DIM }}>
                {c.viable ? 'VIABLE' : 'no edge'} · swap ${Number(c.estimated_swap_usd || 0).toLocaleString()}
              </span>
              <span style={{ color: DIM }}>{c.latency_ms}ms · net ${Number(c.net_profit_usd || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
        {checks.length === 0 && !err && (
          <div style={{ fontSize: 12, color: DIM, textAlign: 'center', padding: 20 }}>
            No checks logged yet — deploy monitor.js to Hetzner to start collecting data.
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ icon, title, value, highlight = false }: { icon: React.ReactNode; title: string; value: any; highlight?: boolean }) {
  return (
    <div style={glass({ padding: 14, border: highlight ? `1px solid rgba(34,211,238,0.4)` : undefined })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.05em' }}>{value}</div>
      <div style={{ ...label, marginTop: 4, fontSize: 7 }}>{title}</div>
    </div>
  );
}
