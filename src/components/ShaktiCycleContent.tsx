import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { SHAKTI_MODULES } from '@/data/shaktiCycleModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const ROSE = '#E11D8F';

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch',
};

const ShaktiCycleContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const sModule = SHAKTI_MODULES.find((m) => m.id === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_shakti_cycle_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!sModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = sModule.curriculum.map((item, i): Card => ({
    sectionId: `l${i}`, title: item.title, render: () => (
      <>
        <p style={{ ...bodyStyle, marginBottom: item.practices || item.herbs || item.mantra ? 16 : 0 }}>{item.description}</p>
        {item.practices && item.practices.length > 0 && (
          <div style={{ background: 'rgba(225,29,143,0.05)', border: '1px solid rgba(225,29,143,0.18)', borderRadius: 18, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: ROSE, marginBottom: 10 }}>Practices</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {item.practices.map((p, pi) => <li key={pi} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>{p}</li>)}
            </ul>
          </div>
        )}
        {item.herbs && item.herbs.length > 0 && (
          <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 18, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 10 }}>Herbs</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {item.herbs.map((h, hi) => <li key={hi} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>{h}</li>)}
            </ul>
          </div>
        )}
        {item.mantra && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 600, color: ROSE, margin: 0 }}>{item.mantra}</p>
          </div>
        )}
      </>
    ),
  }));

  if (sModule.secretTeaching) {
    cards.push({ sectionId: 'secret', title: 'Secret Teaching', render: () => (
      <div style={{ background: 'rgba(225,29,143,0.06)', border: '1px solid rgba(225,29,143,0.25)', borderRadius: 18, padding: '20px' }}>
        <p style={{ ...bodyStyle, fontStyle: 'italic', margin: 0 }}>{sModule.secretTeaching}</p>
      </div>
    ) });
  }

  return (
    <div>
      {cards.map((c, i) => {
        const isOpen = openIndex === i;
        const sectionState = sectionRows[c.sectionId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[c.sectionId] ?? 'idle';
        return (
          <div key={c.sectionId} style={{
            marginBottom: 10, borderRadius: 20, overflow: 'hidden',
            border: `1px solid ${isOpen ? 'rgba(225,29,143,0.35)' : isDone ? 'rgba(225,29,143,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(225,29,143,0.04)' : 'rgba(255,255,255,0.012)',
          }}>
            <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? ROSE : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(225,29,143,0.22)' : isOpen ? 'rgba(225,29,143,0.14)' : 'transparent',
                  color: isDone || isOpen ? ROSE : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? ROSE : 'rgba(255,255,255,0.85)' }}>
                  {c.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? ROSE : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {c.render()}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Notes</span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: ROSE, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Saved</span>}
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
                    background: isDone ? 'rgba(225,29,143,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(225,29,143,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? ROSE : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === cards.length - 1} onClick={() => setOpenIndex(Math.min(cards.length - 1, i + 1))} style={{
                    background: i === cards.length - 1 ? 'transparent' : 'rgba(225,29,143,0.14)',
                    border: `1px solid ${i === cards.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(225,29,143,0.4)'}`,
                    color: i === cards.length - 1 ? 'rgba(255,255,255,0.25)' : ROSE,
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

export default ShaktiCycleContent;
