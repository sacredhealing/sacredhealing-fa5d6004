import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { WATER_MODULES } from '@/data/waterAlchemyModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const CYAN = '#22D3EE';

const bodyStyle: React.CSSProperties = {
  fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)',
  fontFamily: "'Cormorant Garamond',serif", whiteSpace: 'pre-line',
};

const WaterAlchemyContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const wModule = WATER_MODULES.find((m) => m.id === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_water_alchemy_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!wModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = wModule.sections.map((s, i): Card => ({
    sectionId: `s${i}`, title: s.heading, render: () => <p style={bodyStyle}>{s.body}</p>,
  }));

  cards.push({
    sectionId: 'practice', title: 'Living Practice', render: () => (
      <>
        <p style={bodyStyle}>{wModule.practice}</p>
        {wModule.mantra && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: CYAN, margin: 0 }}>🕉 {wModule.mantra}</p>
          </div>
        )}
      </>
    ),
  });

  return (
    <div>
      <div style={{ padding: '16px 20px', marginBottom: 14, background: `${CYAN}08`, borderRadius: 20, borderLeft: `3px solid ${CYAN}` }}>
        <div style={{ fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: CYAN, fontWeight: 800, marginBottom: 8 }}>Essence</div>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>"{wModule.essence}"</p>
        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Transmitted by <span style={{ color: CYAN, fontWeight: 700 }}>{wModule.siddha}</span></div>
      </div>

      {cards.map((c, i) => {
        const isOpen = openIndex === i;
        const sectionState = sectionRows[c.sectionId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[c.sectionId] ?? 'idle';
        return (
          <div key={c.sectionId} style={{
            marginBottom: 10, borderRadius: 20, overflow: 'hidden',
            border: `1px solid ${isOpen ? 'rgba(34,211,238,0.35)' : isDone ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(34,211,238,0.04)' : 'rgba(255,255,255,0.012)',
          }}>
            <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? CYAN : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(34,211,238,0.22)' : isOpen ? 'rgba(34,211,238,0.14)' : 'transparent',
                  color: isDone || isOpen ? CYAN : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? CYAN : 'rgba(255,255,255,0.85)' }}>
                  {c.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? CYAN : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {c.render()}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Notes</span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: CYAN, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Saved</span>}
                    {noteStatus === 'error' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#F87171' }}>Could not save</span>}
                  </div>
                  <textarea
                    value={noteValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNoteSaveStatus((m) => ({ ...m, [c.sectionId]: 'saving' }));
                      setSectionNotes(c.sectionId, v, (ok) => setNoteSaveStatus((m) => ({ ...m, [c.sectionId]: ok ? 'saved' : 'error' })));
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
                  <button type="button" onClick={() => void toggleSectionComplete(c.sectionId)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isDone ? 'rgba(34,211,238,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? CYAN : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === cards.length - 1} onClick={() => setOpenIndex(Math.min(cards.length - 1, i + 1))} style={{
                    background: i === cards.length - 1 ? 'transparent' : 'rgba(34,211,238,0.14)',
                    border: `1px solid ${i === cards.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(34,211,238,0.4)'}`,
                    color: i === cards.length - 1 ? 'rgba(255,255,255,0.25)' : CYAN,
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                    cursor: i === cards.length - 1 ? 'default' : 'pointer',
                  }}>
                    {i === cards.length - 1 ? 'Last section' : 'Next section →'}
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

export default WaterAlchemyContent;
