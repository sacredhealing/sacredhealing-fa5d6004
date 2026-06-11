import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_UUIDS = [
  'bd0b21c9-577a-450b-bb1e-21c9d0423f17',
  'a711f099-3d34-456f-8473-8a65eab056d5',
];

const GOLD = '#D4AF37';
const CYAN = '#22D3EE';
const RED = 'rgba(255,80,80,0.9)';
const BG = '#050505';

type BotStatus = {
  balance: number | null;
  pnl: number | null;
  trades_won: number | null;
  trades_lost: number | null;
  win_rate: number | null;
  mode: string | null;
  updated_at: string | null;
};

type Trade = {
  id: string;
  asset: string | null;
  signal: string | null;
  delta: string | null;
  size_usd: number | null;
  status: string | null;
  pnl_usdc: number | null;
  mode: string | null;
  created_at: string | null;
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 28,
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
};

export default function AffiliateDashboard() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [hasStatus, setHasStatus] = useState<boolean | null>(null);

  const isAdmin = !!user && ADMIN_UUIDS.includes(user.id);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase
        .from('bot_status' as any)
        .select('balance, pnl, trades_won, trades_lost, win_rate, mode, updated_at')
        .eq('bot_id', 'delta-arb')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('bot_trades' as any)
        .select('id, asset, signal, delta, size_usd, status, pnl_usdc, mode, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    setStatus((s as any) ?? null);
    setHasStatus(!!s);
    setTrades(((t as any) ?? []) as Trade[]);
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [isAdmin, load]);

  if (loading) return <div style={{ background: BG, minHeight: '100vh' }} />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const mode = status?.mode ?? 'PAPER';
  const isLive = mode === 'LIVE';
  const pnl = Number(status?.pnl ?? 0);
  const pnlColor = pnl >= 0 ? GOLD : RED;

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px 16px 120px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ ...card, padding: 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', color: GOLD }}>DELTA-ARB BOT</span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
              color: isLive ? GOLD : CYAN,
              border: `1px solid ${isLive ? GOLD : CYAN}55`,
              borderRadius: 99, padding: '2px 8px',
            }}>{mode}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              {status?.updated_at ? new Date(status.updated_at).toLocaleTimeString() : '—'}
            </span>
          </div>

          {hasStatus === false ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              Awaiting first sync…
            </div>
          ) : (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>LIVE BALANCE</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', textShadow: `0 0 28px ${GOLD}55` }}>
                ${Number(status?.balance ?? 0).toFixed(2)}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: pnlColor, marginTop: 6 }}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} P&L
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 22 }}>
                {[
                  { l: 'WIN RATE', v: `${Number(status?.win_rate ?? 0).toFixed(1)}%`, c: GOLD },
                  { l: 'WINS', v: String(status?.trades_won ?? 0), c: GOLD },
                  { l: 'LOSSES', v: String(status?.trades_lost ?? 0), c: (status?.trades_lost ?? 0) > 0 ? RED : 'rgba(255,255,255,0.4)' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.45)' }}>TRADE FEED</span>
            <span style={{ marginLeft: 10, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{trades.length}</span>
          </div>
          {trades.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No trades yet</div>
          ) : trades.map((t) => {
            const isWon = t.status === 'won';
            const isLost = t.status === 'lost';
            const sc = isWon ? GOLD : isLost ? RED : CYAN;
            const pv = Number(t.pnl_usdc ?? 0);
            const up = t.signal === 'UP';
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{t.asset ?? '—'}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: up ? GOLD : RED, marginTop: 2 }}>
                    {up ? '▲ UP' : '▼ DOWN'}
                    {t.delta && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6, fontWeight: 400 }}>{t.delta}</span>}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                    {t.created_at ? new Date(t.created_at).toLocaleTimeString() : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 99, background: `${sc}15`, color: sc, border: `1px solid ${sc}40` }}>
                    {isWon ? 'WIN' : isLost ? 'LOSS' : 'OPEN'}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 900, color: pv >= 0 ? GOLD : RED, marginTop: 4 }}>
                    {isWon || isLost ? `${pv >= 0 ? '+' : ''}$${pv.toFixed(2)}` : `$${Number(t.size_usd ?? 0).toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
