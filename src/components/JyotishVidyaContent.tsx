import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { getModuleContent } from '@/data/content/content_index';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const CYAN = '#22D3EE';

const bodyStyle: React.CSSProperties = {
  fontSize: 20, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

function renderBody(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'rgba(255,255,255,0.98)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const JyotishVidyaContent: React.FC<{ moduleId: number; dbModuleId: string }> = ({ moduleId, dbModuleId }) => {
  const content = getModuleContent(moduleId);
  const [openIndex, setOpenIndex] = React.useState(0);
  const [quizAnswers, setQuizAnswers] = React.useState<Record<number, number>>({});
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_jyotish_vidya_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!content) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = [
    { sectionId: 'opening', title: 'Opening Transmission', render: () => <p style={bodyStyle}>{renderBody(content.opening)}</p> },
    ...content.sections.map((s, i): Card => ({
      sectionId: `section-${i}`, title: s.title, render: () => (
        <>
          <p style={{ ...bodyStyle, marginBottom: s.keyTerms && s.keyTerms.length > 0 ? 18 : 0 }}>{renderBody(s.body)}</p>
          {s.keyTerms && s.keyTerms.length > 0 && (
            <div style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.18)', borderRadius: 18, padding: '16px 20px' }}>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: CYAN, marginBottom: 10 }}>Key Terms</div>
              {s.keyTerms.map((kt, ki) => (
                <div key={ki} style={{ marginBottom: ki < s.keyTerms!.length - 1 ? 10 : 0 }}>
                  <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{kt.term}</span>
                  {kt.sanskrit && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6, fontSize: 13 }}>{kt.sanskrit}</span>}
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontFamily: "'Cormorant Garamond',serif" }}>{kt.definition}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ),
    })),
    { sectionId: 'practice', title: 'Practice', render: () => (
      <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 18, padding: '18px 20px' }}>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'rgba(255,255,255,0.85)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{renderBody(content.practice)}</p>
      </div>
    ) },
    { sectionId: 'closing', title: 'Closing Transmission', render: () => <p style={{ ...bodyStyle, fontStyle: 'italic' }}>{renderBody(content.closing)}</p> },
  ];

  if (content.quiz && content.quiz.length > 0) {
    cards.push({
      sectionId: 'quiz', title: `Quiz — ${content.quiz.length} Questions`, render: () => (
        <div>
          {content.quiz.map((q, qi) => {
            const selected = quizAnswers[qi];
            const answered = selected !== undefined;
            return (
              <div key={qi} style={{ marginBottom: qi < content.quiz.length - 1 ? 22 : 0 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 10, fontFamily: "'Cormorant Garamond',serif" }}>
                  {qi + 1}. {q.question}
                </p>
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answer;
                  const isSelected = selected === oi;
                  let bg = 'rgba(255,255,255,0.03)';
                  let border = 'rgba(255,255,255,0.1)';
                  if (answered && isCorrect) { bg = 'rgba(74,222,128,0.1)'; border = 'rgba(74,222,128,0.4)'; }
                  else if (answered && isSelected && !isCorrect) { bg = 'rgba(248,113,113,0.1)'; border = 'rgba(248,113,113,0.4)'; }
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={answered}
                      onClick={() => setQuizAnswers((m) => ({ ...m, [qi]: oi }))}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', marginBottom: 6,
                        padding: '10px 14px', borderRadius: 12, background: bg,
                        border: `1px solid ${border}`, color: 'rgba(255,255,255,0.8)',
                        fontSize: 14, cursor: answered ? 'default' : 'pointer',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
                {answered && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontStyle: 'italic' }}>{q.explanation}</p>
                )}
              </div>
            );
          })}
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

export default JyotishVidyaContent;
