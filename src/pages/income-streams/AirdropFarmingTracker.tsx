import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Circle, Flame, Plus, Trash2, HelpCircle, ChevronDown } from 'lucide-react';

const GOLD = '#D4AF37';
const BG = '#050505';
const GREEN = '#22c55e';
const AMBER = '#f59e0b';

const PROTOCOLS = [
  {
    id: 'meteora',
    name: 'Meteora',
    tag: 'Jupiter-owned LP · no token',
    hint: 'Add/manage a small DLMM liquidity position, or rebalance an existing one.',
  },
  {
    id: 'monad',
    name: 'Monad',
    tag: 'VC L1 · $244M raised · no token',
    hint: 'Use a live app on Monad — swap, mint, lend. Not just a bridge transaction.',
  },
  {
    id: 'polymarket',
    name: 'Polymarket',
    tag: 'Confirmed airdrop · points live',
    hint: 'Take a real position on a market you have a view on. Vary size and market type.',
  },
];

const HYGIENE_ITEMS = [
  'Farming wallet stays separate from bot / main wallets',
  'No identical tx amounts across wallets or weeks',
  'Timing varied — not the same day/hour pattern',
  'No round-trip in the same session (in and out within minutes)',
];

const STORAGE_KEY_ENTRIES = 'sqi_airdrop_entries_v1';
const STORAGE_KEY_HYGIENE = 'sqi_airdrop_hygiene_v1';

function isoWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

type Entry = { protocolId: string; week: string; note: string; date: string };

export default function AirdropFarmingTracker() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [hygiene, setHygiene] = useState<Record<string, boolean>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [showExplainer, setShowExplainer] = useState(false);

  const currentWeek = isoWeek(new Date());

  useEffect(() => {
    try {
      const e = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (e) setEntries(JSON.parse(e));
      const h = localStorage.getItem(STORAGE_KEY_HYGIENE);
      if (h) setHygiene(JSON.parse(h));
    } catch {}
  }, []);

  function persistEntries(next: Record<string, Entry>) {
    setEntries(next);
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(next));
    } catch {}
  }

  function persistHygiene(next: Record<string, boolean>) {
    setHygiene(next);
    try {
      localStorage.setItem(STORAGE_KEY_HYGIENE, JSON.stringify(next));
    } catch {}
  }

  function logAction(protocolId: string) {
    const note = (noteDraft[protocolId] || '').trim();
    const key = `${protocolId}:${currentWeek}`;
    persistEntries({
      ...entries,
      [key]: { protocolId, week: currentWeek, note: note || 'Action logged', date: new Date().toISOString() },
    });
    setNoteDraft({ ...noteDraft, [protocolId]: '' });
  }

  function removeAction(protocolId: string) {
    const key = `${protocolId}:${currentWeek}`;
    const next = { ...entries };
    delete next[key];
    persistEntries(next);
  }

  function toggleHygiene(item: string) {
    const key = `${currentWeek}:${item}`;
    persistHygiene({ ...hygiene, [key]: !hygiene[key] });
  }

  function streakFor(protocolId: string) {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 52; i++) {
      const wk = isoWeek(d);
      if (entries[`${protocolId}:${wk}`]) {
        streak++;
        d.setUTCDate(d.getUTCDate() - 7);
      } else if (wk === currentWeek) {
        d.setUTCDate(d.getUTCDate() - 7);
      } else {
        break;
      }
    }
    return streak;
  }

  const allEntries = Object.values(entries).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const g = 'rounded-[28px] border border-white/[0.06] bg-white/[0.02]';

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#fff', paddingBottom: 100 }}>
      <div style={{ padding: '16px 16px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => navigate('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, cursor: 'pointer' }}
          >
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 18, color: GOLD, letterSpacing: '-0.03em' }}>AIRDROP FARMING</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', color: GREEN, border: `1px solid ${GREEN}55`, borderRadius: 99, padding: '2px 8px' }}>
                MANUAL
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              Week {currentWeek} · logged locally on this device
            </div>
          </div>
        </div>

        {/* Explainer toggle */}
        <button
          onClick={() => setShowExplainer(!showExplainer)}
          className={g}
          style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer', textAlign: 'left' }}
        >
          <HelpCircle size={16} color={GOLD} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>What is this, and how does it make money?</span>
          <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ transform: showExplainer ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showExplainer && (
          <div className={g} style={{ padding: 18, marginBottom: 16, background: 'rgba(212,175,55,0.04)', borderColor: 'rgba(212,175,55,0.2)' }}>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>
              Some crypto apps don't have their own coin yet. Before launching one, many reward the people
              who used the app early — for free. That's an <b style={{ color: GOLD }}>airdrop</b>. Nobody
              promises it in advance. It's a gift if it happens, not guaranteed income.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>
              <b style={{ color: GOLD }}>How you make money:</b> use the 3 apps below a little bit, every
              week, for months, with one dedicated wallet. If one of them eventually gives out tokens to
              early users, your wallet gets some. You then sell or hold.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
              <b style={{ color: AMBER }}>Reality check:</b> most give nothing. The ones that do pay out have
              ranged from a couple hundred to a few thousand dollars, historically. Treat any payout as a
              bonus, never as budgeted income.
            </p>
          </div>
        )}

        {/* Protocol cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {PROTOCOLS.map((p) => {
            const done = entries[`${p.id}:${currentWeek}`];
            const streak = streakFor(p.id);
            return (
              <div key={p.id} className={g} style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{p.tag}</div>
                  </div>
                  {streak > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: AMBER }}>
                      <Flame size={13} color={AMBER} />
                      <span>{streak}</span>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 14 }}>{p.hint}</div>

                {done ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Check size={15} color={GREEN} />
                      <span style={{ fontSize: 13, color: '#bdf5cf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{done.note}</span>
                    </div>
                    <button onClick={() => removeAction(p.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={14} color="rgba(255,255,255,0.3)" />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                      placeholder="What did you do this week?"
                      value={noteDraft[p.id] || ''}
                      onChange={(e) => setNoteDraft({ ...noteDraft, [p.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && logAction(p.id)}
                    />
                    <button
                      onClick={() => logAction(p.id)}
                      style={{ background: GOLD, border: 'none', borderRadius: 10, width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                    >
                      <Plus size={15} color={BG} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Wallet hygiene */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
            WALLET HYGIENE · THIS WEEK
          </div>
          <div className={g} style={{ padding: 6 }}>
            {HYGIENE_ITEMS.map((item) => {
              const key = `${currentWeek}:${item}`;
              const checked = !!hygiene[key];
              return (
                <button
                  key={item}
                  onClick={() => toggleHygiene(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                >
                  {checked ? <Check size={15} color={GREEN} /> : <Circle size={15} color="rgba(255,255,255,0.25)" />}
                  <span style={{ fontSize: 13, lineHeight: 1.4, color: checked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)', textDecoration: checked ? 'line-through' : 'none' }}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent log */}
        {allEntries.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
              RECENT LOG
            </div>
            <div className={g} style={{ padding: 14 }}>
              {allEntries.slice(0, 10).map((e, i) => {
                const p = PROTOCOLS.find((pp) => pp.id === e.protocolId);
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '7px 4px', borderBottom: i < allEntries.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', width: 62, flexShrink: 0 }}>{e.week}</span>
                    <span style={{ color: GOLD, width: 78, flexShrink: 0, fontWeight: 700 }}>{p?.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.note}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
