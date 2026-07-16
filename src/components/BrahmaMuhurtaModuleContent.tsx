import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { BRAHMA_MODULES } from '@/data/brahmaMuhurtaModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const GOLD = '#D4AF37';

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

const BrahmaMuhurtaModuleContent: React.FC<{ moduleId: string; dbModuleId: string }> = ({ moduleId, dbModuleId }) => {
  const bModule = BRAHMA_MODULES.find((m) => `m${m.id}` === moduleId);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_brahma_muhurta_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!bModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = [
    { sectionId: 'teaching', title: bModule.title, render: () => (
      <>
        <p style={bodyStyle}>{bModule.body}</p>
        {bModule.data && bModule.data.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 18 }}>
            {bModule.data.map((d, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{d.value}</div>
              </div>
            ))}
          </div>
        )}
      </>
    ) },
  ];

  if (bModule.innerTitle && bModule.innerBody) {
    cards.push({
      sectionId: 'inner', title: bModule.innerTitle, render: () => <p style={bodyStyle}>{bModule.innerBody}</p>,
    });
  }

  if (bModule.steps && bModule.steps.length > 0) {
    cards.push({
      sectionId: 'steps', title: 'Practice Sequence', render: () => (
        <div>
          {bModule.steps!.map((s) => (
            <div key={s.num} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1.5px solid ${GOLD}`, color: GOLD, fontSize: 12, fontWeight: 800,
              }}>{s.num}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>{s.title} <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>· {s.time}</span></div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: "'Cormorant Garamond',serif", margin: '4px 0 0' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (bModule.mantras && bModule.mantras.length > 0) {
    cards.push({
      sectionId: 'mantras', title: 'Sacred Mantras', render: () => (
        <div>
          {bModule.mantras!.map((mt, i) => (
            <div key={i} style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 18, padding: '18px 20px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>{mt.label}</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 600, color: 'rgba(255,255,255,0.92)', margin: '0 0 8px' }}>{mt.text}</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{mt.meaning}</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (bModule.secret) {
    cards.push({
      sectionId: 'secret', title: bModule.secret.label, render: () => (
        <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 18, padding: '20px' }}>
          <p style={bodyStyle}>{bModule.secret!.body}</p>
        </div>
      ),
    });
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
            border: `1px solid ${isOpen ? 'rgba(212,175,55,0.35)' : isDone ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.012)',
          }}>
            <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? GOLD : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(212,175,55,0.22)' : isOpen ? 'rgba(212,175,55,0.14)' : 'transparent',
                  color: isDone || isOpen ? GOLD : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700, color: isOpen ? GOLD : 'rgba(255,255,255,0.85)' }}>
                  {c.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? GOLD : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {c.render()}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Notes</span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: GOLD, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Saved</span>}
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
                    background: isDone ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? GOLD : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === cards.length - 1} onClick={() => setOpenIndex(Math.min(cards.length - 1, i + 1))} style={{
                    background: i === cards.length - 1 ? 'transparent' : 'rgba(212,175,55,0.14)',
                    border: `1px solid ${i === cards.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.4)'}`,
                    color: i === cards.length - 1 ? 'rgba(255,255,255,0.25)' : GOLD,
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

export default BrahmaMuhurtaModuleContent;
