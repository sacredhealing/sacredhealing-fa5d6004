import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { YAGNA_MODULES } from '@/data/yagnaModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const AMBER = '#D97706';

const bodyStyle: React.CSSProperties = {
  fontSize: 20, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

const YagnaContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const num = parseInt(moduleKey.replace('m', ''), 10);
  const yModule = YAGNA_MODULES.find((m) => parseInt(m.number, 10) === num);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_yagna_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!yModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = yModule.lessons.map((lesson, i): Card => ({
    sectionId: `l${i}`, title: lesson.title, render: () => (
      <>
        <p style={{ ...bodyStyle, marginBottom: 16 }}>{lesson.body}</p>
        {lesson.objectives.length > 0 && (
          <div style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 18, padding: '16px 20px' }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: AMBER, marginBottom: 10 }}>Objectives</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {lesson.objectives.map((o, oi) => <li key={oi} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>{o}</li>)}
            </ul>
          </div>
        )}
      </>
    ),
  }));

  cards.push({
    sectionId: 'practice', title: `Practice — ${yModule.practice.name}`, render: () => (
      <>
        <p style={{ fontSize: 12, fontWeight: 700, color: AMBER, letterSpacing: '.1em', marginBottom: 14 }}>{yModule.practice.duration}</p>
        <div style={{ marginBottom: 16 }}>
          {yModule.practice.elements.map((el, ei) => (
            <div key={ei} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span style={{ color: AMBER, flexShrink: 0 }}>◈</span>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{el}</p>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 18, padding: '16px 20px' }}>
          <p style={{ ...bodyStyle, fontStyle: 'italic', margin: 0, fontSize: 16 }}>{yModule.practice.sadhanaNote}</p>
        </div>
      </>
    ),
  });

  cards.push({
    sectionId: 'outcomes', title: 'Outcomes', render: () => (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {yModule.outcomes.map((o, oi) => <li key={oi} style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 8 }}>{o}</li>)}
      </ul>
    ),
  });

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
            border: `1px solid ${isOpen ? 'rgba(217,119,6,0.35)' : isDone ? 'rgba(217,119,6,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(217,119,6,0.04)' : 'rgba(255,255,255,0.012)',
          }}>
            <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? AMBER : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(217,119,6,0.22)' : isOpen ? 'rgba(217,119,6,0.14)' : 'transparent',
                  color: isDone || isOpen ? AMBER : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? AMBER : 'rgba(255,255,255,0.85)' }}>
                  {c.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? AMBER : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {c.render()}

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
                    background: isDone ? 'rgba(217,119,6,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(217,119,6,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? AMBER : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === cards.length - 1} onClick={() => setOpenIndex(Math.min(cards.length - 1, i + 1))} style={{
                    background: i === cards.length - 1 ? 'transparent' : 'rgba(217,119,6,0.14)',
                    border: `1px solid ${i === cards.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(217,119,6,0.4)'}`,
                    color: i === cards.length - 1 ? 'rgba(255,255,255,0.25)' : AMBER,
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

export default YagnaContent;
