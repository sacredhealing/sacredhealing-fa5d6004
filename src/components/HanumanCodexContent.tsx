import React from 'react';
import { CheckCircle, ChevronDown, Lock } from 'lucide-react';
import {
  HANUMAN_CHALISA_VERSES, HANUMAN_GHATA_MOVEMENTS, HANUMAN_SADHANA_CURRICULUM,
  HANUMAN_WEAPONS_DATA, HANUMAN_PHYSICAL_TRAINING, HANUMAN_SIDDHIS,
  HANUMAN_NINE_NIDHIS, HANUMAN_DEVOTION_PRACTICES,
} from '@/data/hanumanCodexContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import { useNavigate } from 'react-router-dom';

const AMBER = '#F97316';

const bodyStyle: React.CSSProperties = {
  fontSize: 19, lineHeight: 1.75, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

const labelStyle: React.CSSProperties = {
  fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: AMBER, marginBottom: 8,
};

function LockedCard({ tier, onUpgrade }: { tier: string; onUpgrade: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 14 }}>
      <Lock size={14} color="rgba(255,255,255,0.35)" />
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', flex: 1 }}>Requires {tier}</span>
      <button type="button" onClick={onUpgrade} style={{
        background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.4)', color: AMBER,
        padding: '6px 14px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
      }}>
        Unlock
      </button>
    </div>
  );
}

function renderChalisa(v: typeof HANUMAN_CHALISA_VERSES[number]) {
  return (
    <>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: AMBER, marginBottom: 10, whiteSpace: 'pre-line' }}>{v.devanagari}</p>
      <p style={{ fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>{v.transliteration}</p>
      <p style={{ ...bodyStyle, marginBottom: 16 }}>{v.translation}</p>
      <div style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 16, padding: '16px 18px', marginBottom: 10 }}>
        <div style={labelStyle}>{v.esotericKey}</div>
        <p style={{ ...bodyStyle, fontSize: 16, margin: 0 }}>{v.secretTeaching}</p>
      </div>
      <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ ...labelStyle, color: '#A78BFA' }}>SQI Transmission</div>
        <p style={{ ...bodyStyle, fontSize: 15, margin: 0, fontStyle: 'italic' }}>{v.sqiTransmission}</p>
      </div>
    </>
  );
}

function renderGhata(g: typeof HANUMAN_GHATA_MOVEMENTS[number]) {
  return (
    <>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, color: AMBER, marginBottom: 4 }}>{g.sanskritName}</p>
      <p style={{ ...bodyStyle, marginBottom: 16 }}>{g.description}</p>
      <ol style={{ margin: '0 0 16px', paddingLeft: 20 }}>
        {g.instructions.map((step, i) => (
          <li key={i} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>{step}</li>
        ))}
      </ol>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
        <span>⏱ {g.duration}</span><span>🕉 {g.mantra}</span><span>⚡ {g.shaktiActivated}</span>
      </div>
    </>
  );
}

function renderWeapon(w: typeof HANUMAN_WEAPONS_DATA[number]) {
  return (
    <>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: AMBER, marginBottom: 4 }}>{w.symbol} {w.sanskritName} — {w.weaponType}</p>
      <p style={{ ...bodyStyle, marginBottom: 14 }}>{w.description}</p>
      <div style={labelStyle}>Mythological Context</div>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        {w.mythological.map((m, i) => <li key={i} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>{m}</li>)}
      </ul>
      <div style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
        <div style={labelStyle}>Inner Meaning</div>
        <p style={{ ...bodyStyle, fontSize: 16, margin: 0 }}>{w.innerMeaning}</p>
      </div>
      <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ ...labelStyle, color: '#D4AF37' }}>{w.physicalName}</div>
        <p style={{ ...bodyStyle, fontSize: 15, marginBottom: 10 }}>{w.physicalDesc}</p>
        <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          {w.physicalSteps.map((s, i) => <li key={i} style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 4 }}>{s}</li>)}
        </ol>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{w.physicalMantra}</p>
      </div>
    </>
  );
}

function renderTraining(t: typeof HANUMAN_PHYSICAL_TRAINING[number]) {
  return <p style={bodyStyle}>{JSON.stringify(t).length > 0 ? Object.entries(t).filter(([k]) => !['id', 'name', 'tier'].includes(k)).map(([, v]) => (Array.isArray(v) ? v.join(' ') : String(v))).join('\n\n') : ''}</p>;
}

function renderSiddhi(s: typeof HANUMAN_SIDDHIS[number]) {
  return (
    <>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: AMBER, marginBottom: 10 }}>{s.sk} — {s.subtitle}</p>
      <div style={labelStyle}>In Hanuman</div>
      <p style={{ ...bodyStyle, fontSize: 16, marginBottom: 12 }}>{s.hanuman}</p>
      <div style={labelStyle}>Inner Meaning</div>
      <p style={{ ...bodyStyle, fontSize: 16, marginBottom: 12 }}>{s.inner}</p>
      <div style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 16, padding: '16px 18px', marginBottom: 12 }}>
        <div style={labelStyle}>Practice Path</div>
        <p style={{ ...bodyStyle, fontSize: 15, margin: 0 }}>{s.path}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{s.mantra}</p>
      </div>
      <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>{s.modern}</p>
    </>
  );
}

function renderNidhi(n: typeof HANUMAN_NINE_NIDHIS[number]) {
  return (
    <>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: AMBER, marginBottom: 10 }}>{n.meaning}</p>
      <p style={bodyStyle}>{n.aspect}</p>
    </>
  );
}

const SIDDHIS_AND_NIDHIS = [
  ...HANUMAN_SIDDHIS.map((s) => ({ ...s, __kind: 'siddhi' as const })),
  ...HANUMAN_NINE_NIDHIS.map((n) => ({ ...n, __kind: 'nidhi' as const })),
];

function renderDevotion(d: typeof HANUMAN_DEVOTION_PRACTICES[number]) {
  return <p style={bodyStyle}>{Object.entries(d).filter(([k]) => !['id', 'name', 'title', 'tier'].includes(k)).map(([, v]) => (Array.isArray(v) ? v.join('\n') : String(v))).join('\n\n')}</p>;
}

const SECTIONS: Record<string, { data: any[]; title: (item: any, i: number) => string; render: (item: any) => React.ReactNode }> = {
  chalisa: { data: HANUMAN_CHALISA_VERSES, title: (v) => `${v.number} — ${v.type === 'doha' ? 'Doha' : 'Chaupai'}`, render: renderChalisa },
  ghata: { data: HANUMAN_GHATA_MOVEMENTS, title: (g) => g.name, render: renderGhata },
  weapons: { data: HANUMAN_WEAPONS_DATA, title: (w) => w.name, render: renderWeapon },
  training: { data: HANUMAN_PHYSICAL_TRAINING, title: (t) => t.name || t.title || 'Training', render: renderTraining },
  siddhis: { data: SIDDHIS_AND_NIDHIS, title: (s) => (s.__kind === 'siddhi' ? `${s.number}. ${s.name}` : `Nidhi — ${s.name}`), render: (s) => (s.__kind === 'siddhi' ? renderSiddhi(s) : renderNidhi(s)) },
  devotion: { data: HANUMAN_DEVOTION_PRACTICES, title: (d) => d.name || d.title, render: renderDevotion },
  sadhana: { data: HANUMAN_SADHANA_CURRICULUM, title: (s) => s.title || `Level ${s.level}`, render: renderDevotion },
};

const HanumanCodexContent: React.FC<{ sectionKey: string; dbModuleId: string; tier: string | null; isAdmin: boolean }> = ({ sectionKey, dbModuleId, tier, isAdmin }) => {
  const navigate = useNavigate();
  const section = SECTIONS[sectionKey];
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_hanuman_codex_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!section) return <p style={bodyStyle}>This section's content is being prepared.</p>;

  const items = section.data;

  return (
    <div>
      {items.map((item, i) => {
        const cardId = `item-${i}`;
        const itemTier = item.tier as string | undefined;
        const itemAllowed = !itemTier || hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(itemTier));
        const isOpen = openIndex === i;
        const sectionState = sectionRows[cardId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[cardId] ?? 'idle';

        return (
          <div key={cardId} style={{
            marginBottom: 10, borderRadius: 20, overflow: 'hidden',
            border: `1px solid ${isOpen ? 'rgba(249,115,22,0.35)' : isDone ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(249,115,22,0.04)' : 'rgba(255,255,255,0.012)',
            opacity: itemAllowed ? 1 : 0.6,
          }}>
            <button type="button" onClick={() => itemAllowed && setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: itemAllowed ? 'pointer' : 'default', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? AMBER : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(249,115,22,0.22)' : isOpen ? 'rgba(249,115,22,0.14)' : 'transparent',
                  color: isDone || isOpen ? AMBER : 'rgba(255,255,255,0.4)',
                }}>
                  {!itemAllowed ? <Lock size={11} /> : isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? AMBER : 'rgba(255,255,255,0.85)' }}>
                  {section.title(item, i)}
                </div>
              </div>
              {itemAllowed && <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? AMBER : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
            </button>

            {!itemAllowed && (
              <div style={{ padding: '0 20px 16px' }}>
                <LockedCard tier={itemTier || 'a higher tier'} onUpgrade={() => navigate(getSalesPageForRank(getCourseTierRequiredRank(itemTier)))} />
              </div>
            )}

            {isOpen && itemAllowed && (
              <div style={{ padding: '0 20px 24px' }}>
                {section.render(item)}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Notes</span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: AMBER, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Saved</span>}
                    {noteStatus === 'error' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#F87171' }}>Could not save</span>}
                  </div>
                  <textarea
                    value={noteValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNoteSaveStatus((m) => ({ ...m, [cardId]: 'saving' }));
                      setSectionNotes(cardId, v, (ok) => setNoteSaveStatus((m) => ({ ...m, [cardId]: ok ? 'saved' : 'error' })));
                    }}
                    rows={3}
                    placeholder="Your reflections..."
                    style={{
                      width: '100%', resize: 'vertical', borderRadius: 14,
                      border: '1px solid rgba(255,255,255,.1)', background: 'rgba(5,5,5,.6)',
                      padding: '10px 12px', fontSize: 14.5, color: 'rgba(255,255,255,.85)',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 10 }}>
                  <button type="button" onClick={() => void toggleSectionComplete(cardId)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isDone ? 'rgba(249,115,22,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? AMBER : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === items.length - 1} onClick={() => setOpenIndex(Math.min(items.length - 1, i + 1))} style={{
                    background: i === items.length - 1 ? 'transparent' : 'rgba(249,115,22,0.14)',
                    border: `1px solid ${i === items.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(249,115,22,0.4)'}`,
                    color: i === items.length - 1 ? 'rgba(255,255,255,0.25)' : AMBER,
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                    cursor: i === items.length - 1 ? 'default' : 'pointer',
                  }}>
                    {i === items.length - 1 ? 'Last item' : 'Next →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HanumanCodexContent;
