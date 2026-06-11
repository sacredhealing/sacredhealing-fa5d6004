import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, TrendingUp, Activity, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = '#ef4444';
const AMBER = '#f59e0b';

// External Supabase project that hosts the delta_arb_trades feed.
const FEED_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const FEED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';

type Capital = {
  ok: boolean;
  usdt?: number;
  btc?: number;
  btcPrice?: number;
  totalUsd?: number;
  canTrade?: boolean;
  error?: string;
  ts?: string;
};

export default function DeltaArbBot() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<any[]>([]);
  const [capital, setCapital] = useState<Capital | null>(null);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin] = useState(false);
  const [ts, setTs] = useState('');
  const [feedErr, setFeedErr] = useState('');

  const loadTrades = useCallback(async () => {
    try {
      const res = await fetch(
        `${FEED_URL}/rest/v1/delta_arb_trades?select=*&order=created_at.desc&limit=10000`,
        {
          headers: {
            apikey: FEED_KEY,
            Authorization: `Bearer ${FEED_KEY}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrades(data);
        setFeedErr('');
      } else {
        setFeedErr(`${res.status}: ${JSON.stringify(data).slice(0, 120)}`);
      }
    } catch (e: any) {
      setFeedErr(String(e?.message ?? e));
    }
  }, []);

  const loadCapital = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('binance-balance');
      if (error) {
        setCapital({ ok: false, error: error.message });
        return;
      }
      setCapital(data as Capital);
    } catch (e: any) {
      setCapital({ ok: false, error: String(e?.message ?? e) });
    }
  }, []);

  const refresh = useCallback(async () => {
    setSpin(true);
    await Promise.all([loadTrades(), loadCapital()]);
    setTs(new Date().toLocaleTimeString());
    setLoading(false);
    setSpin(false);
  }, [loadTrades, loadCapital]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const iv = setInterval(refresh, 15000); return () => clearInterval(iv); }, [refresh]);

  const won  = trades.filter(t => t.status === 'won');
  const lost = trades.filter(t => t.status === 'lost');
  const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const pc = totalPnl >= 0 ? GREEN : RED;
  const wr = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';

  const g = 'rounded-[32px] border border-white/[0.06] bg-white/[0.02]';

  // Health pills
  const binanceOk = !!capital?.ok;
  const feedOk = !feedErr;
  const feedAmber = feedOk && trades.length === 0;

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#fff', paddingBottom: 100 }}>
      <div style={{ padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={() => navigate('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, cursor: 'pointer' }}>
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color={CYAN} />
              <span style={{ fontWeight: 900, fontSize: 18, color: GOLD, letterSpacing: '-0.03em' }}>DELTA-ARB BOT</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', color: binanceOk ? GREEN : AMBER, border: `1px solid ${binanceOk ? GREEN : AMBER}55`, borderRadius: 99, padding: '2px 8px' }}>
                {binanceOk && capital?.canTrade ? 'LIVE' : 'READ-ONLY'}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              Binance spot · auto-refresh 15s · {ts || '...'}
            </div>
          </div>
          <button onClick={refresh} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD} style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Connection health strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <HealthPill
            label="Binance API"
            ok={binanceOk}
            detail={binanceOk ? (capital?.canTrade ? 'trade enabled' : 'read-only key') : (capital?.error ?? 'connecting...')}
          />
          <HealthPill
            label="Trade feed"
            ok={feedOk && !feedAmber}
            warn={feedAmber}
            detail={feedOk ? `${trades.length} rows` : feedErr}
          />
        </div>

        {/* BINANCE CAPITAL — top card */}
        <div className={g} style={{ padding: 20, marginBottom: 12, borderColor: binanceOk ? `${GOLD}33` : 'rgba(245,158,11,0.25)', background: binanceOk ? `${GOLD}06` : 'rgba(245,158,11,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Wallet size={14} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: GOLD }}>BINANCE CAPITAL</span>
            {binanceOk && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
                LIVE
              </span>
            )}
          </div>

          {!capital ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Loading account...</div>
          ) : capital.ok ? (
            <>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>TOTAL CAPITAL</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', textShadow: `0 0 24px ${GOLD}44` }}>
                    ${capital.totalUsd?.toFixed(2)}
                  </div>
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>BTC SPOT</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
                    ${capital.btcPrice?.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                <Tile label="USDT" value={`$${capital.usdt?.toFixed(2)}`} color={GOLD} />
                <Tile label="BTC" value={`${capital.btc?.toFixed(8)}`} sub={`$${((capital.btc ?? 0) * (capital.btcPrice ?? 0)).toFixed(2)}`} color={GOLD} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: AMBER, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Binance not connected</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>{capital.error}</div>
            </div>
          )}
        </div>

        {/* Bot trade log */}
        <div className={g} style={{ padding: 16, marginBottom: 12, borderColor: `${pc}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Activity size={13} color={CYAN} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: CYAN }}>BOT TRADE LOG</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>paper P&L · not part of Binance balance</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
            {[
              { l: 'TRADES', v: loading ? '...' : (won.length + lost.length), c: GOLD },
              { l: 'WIN RATE', v: loading ? '...' : wr, c: GOLD },
              { l: 'WINS', v: loading ? '...' : won.length, c: GREEN },
              { l: 'LOSSES', v: loading ? '...' : lost.length, c: lost.length > 0 ? RED : 'rgba(255,255,255,0.3)' },
              { l: 'TOTAL P&L', v: loading ? '...' : `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, c: pc },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: '9px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Feed */}
        <div className={g} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>RECENT TRADES</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{trades.length} total</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Loading...</div>
          ) : trades.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: AMBER, fontWeight: 700, marginBottom: 6 }}>No trades in feed yet</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                The Railway worker is not writing to <code style={{ color: GOLD }}>delta_arb_trades</code>.<br/>
                Once it inserts a row it will appear here within 15s.
              </div>
            </div>
          ) : trades.slice(0, 200).map((t, i) => {
            const isWon = t.status === 'won';
            const isLost = t.status === 'lost';
            const sc = isWon ? GREEN : isLost ? RED : CYAN;
            const pv = parseFloat(t.pnl_usdc) || 0;
            return (
              <div key={t.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    {t.asset ?? '?'}<span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>{t.interval ?? '15m'}</span>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: t.signal === 'UP' ? GREEN : RED, marginTop: 2 }}>
                    {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, marginLeft: 6 }}>{t.delta}</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 2 }}>
                    {t.created_at ? new Date(t.created_at).toLocaleTimeString() : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 99, background: `${sc}15`, color: sc, border: `1px solid ${sc}40` }}>
                    {isWon ? 'WIN' : isLost ? 'LOSS' : 'OPEN'}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 900, color: pv >= 0 ? GREEN : RED, marginTop: 4 }}>
                    {isWon || isLost ? `${pv >= 0 ? '+' : ''}$${pv.toFixed(2)}` : `$${parseFloat(t.size_usd || 0).toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className={g} style={{ padding: 20, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={14} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>HOW IT WORKS</span>
          </div>
          {[
            ['⚡', 'Binance WebSocket streams BTC at sub-50ms'],
            ['📐', 'Bot detects 0.12%+ price movement → direction locked'],
            ['🎯', 'Signal logged to delta_arb_trades feed'],
            ['💰', 'Live trades execute against Binance capital shown above'],
            ['🏆', 'Outcome resolved → win/loss recorded'],
          ].map(([icon, text]) => (
            <div key={String(text)} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function HealthPill({ label, ok, warn, detail }: { label: string; ok: boolean; warn?: boolean; detail?: string }) {
  const color = ok ? GREEN : warn ? AMBER : RED;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 99, border: `1px solid ${color}40`, background: `${color}0c`, fontSize: 10 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontWeight: 800, color, letterSpacing: '0.08em' }}>{label}</span>
      {detail && <span style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {detail}</span>}
    </div>
  );
}

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: '10px 12px' }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
