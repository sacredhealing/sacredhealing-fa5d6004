import React from 'react';
import { CheckCircle, ChevronDown, XCircle } from 'lucide-react';
import { PRANAYAMA_MODULES } from '@/data/pranayamaModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const CYAN = '#22D3EE';
const GOLD = '#D4AF37';

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch',
};

function QuizBlock({ quiz }: { quiz: { q: string; opts: string[]; correct: number }[] }) {
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  return (
    <div>
      {quiz.map((item, qi) => {
        const picked = answers[qi];
        return (
          <div key={qi} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 10 }}>{qi + 1}. {item.q}</p>
            {item.opts.map((opt, oi) => {
              const isPicked = picked === oi;
              const isCorrect = oi === item.correct;
              const showState = picked !== undefined;
              let borderColor = 'rgba(255,255,255,0.1)';
              let color = 'rgba(255,255,255,0.7)';
              if (showState && isPicked) {
                borderColor = isCorrect ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)';
                color = isCorrect ? '#4ADE80' : '#F87171';
              } else if (showState && isCorrect) {
                borderColor = 'rgba(74,222,128,0.5)';
                color = '#4ADE80';
              }
              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                    padding: '10px 14px', marginBottom: 6, borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.02)', color,
                    fontSize: 15, fontFamily: "'Cormorant Garamond',serif",
                  }}
                >
                  {showState && isPicked && (isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />)}
                  {opt}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const PranayamaModuleContent: React.FC<{ moduleId: string; dbModuleId: string }> = ({ moduleId, dbModuleId }) => {
  const pModule = PRANAYAMA_MODULES.find((m) => `m${m.id}` === moduleId);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_pranayama_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!pModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = [
    { sectionId: 'intro', title: pModule.title, render: () => (
      <>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 19, color: GOLD, marginBottom: 16 }}>"{pModule.quote}"</p>
        <p style={bodyStyle}>{pModule.intro}</p>
      </>
    ) },
    ...pModule.lessons.map((l, i): Card => ({
      sectionId: `lesson-${i}`, title: l.title, render: () => <p style={bodyStyle}>{l.body}</p>,
    })),
    ...pModule.techniques.map((t, i): Card => ({
      sectionId: `technique-${i}`, title: t.name, render: () => (
        <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            <span>⏱ {t.duration}</span><span>Ratio {t.ratio}</span><span>{t.rounds} rounds</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", margin: '0 0 10px' }}>{t.body}</p>
          <p style={{ fontSize: 13, color: GOLD, margin: 0 }}><strong>Bandha:</strong> {t.bandha}</p>
        </div>
      ),
    })),
    { sectionId: 'quiz', title: 'Knowledge Check', render: () => <QuizBlock quiz={pModule.quiz} /> },
    { sectionId: 'transmission', title: 'Transmission Field', render: () => (
      <div style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 18, padding: '20px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{pModule.transmission}</p>
      </div>
    ) },
  ];

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
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700, color: isOpen ? CYAN : 'rgba(255,255,255,0.85)' }}>
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

export default PranayamaModuleContent;
