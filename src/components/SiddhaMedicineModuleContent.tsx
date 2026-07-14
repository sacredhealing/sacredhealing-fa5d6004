import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { SIDDHA_MEDICINE_CURRICULUM, type SiddhaMedicineLesson } from '@/data/siddhaMedicineModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const TEAL = '#34D399';
const GOLD = '#D4AF37';

function renderBody(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'rgba(255,255,255,0.98)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch',
};

/** One lesson card. Owns its own "which teaching is open" state, so each
 * lesson's 3 numbered teachings are also single-open -- same nested
 * pattern as the lesson-level accordion, one level deeper. */
function LessonCard({
  lesson, index, total, isOpen, isDone, noteValue, noteStatus,
  onToggleOpen, onToggleComplete, onNotesChange, onGoNext,
}: {
  lesson: SiddhaMedicineLesson;
  index: number;
  total: number;
  isOpen: boolean;
  isDone: boolean;
  noteValue: string;
  noteStatus: 'idle' | 'saving' | 'saved' | 'error';
  onToggleOpen: () => void;
  onToggleComplete: () => void;
  onNotesChange: (v: string) => void;
  onGoNext: () => void;
}) {
  const [openTeaching, setOpenTeaching] = React.useState(0);
  const c = lesson.content;

  return (
    <div
      style={{
        marginBottom: 10, borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${isOpen ? 'rgba(52,211,153,0.35)' : isDone ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
        background: isOpen ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.012)',
      }}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
            border: `1.5px solid ${isDone || isOpen ? TEAL : 'rgba(255,255,255,0.15)'}`,
            background: isDone ? 'rgba(52,211,153,0.22)' : isOpen ? 'rgba(52,211,153,0.14)' : 'transparent',
            color: isDone || isOpen ? TEAL : 'rgba(255,255,255,0.4)',
          }}>
            {isDone ? <CheckCircle size={13} /> : index + 1}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700, color: isOpen ? TEAL : 'rgba(255,255,255,0.85)' }}>
              {lesson.title}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{lesson.duration} · {lesson.type}</div>
          </div>
        </div>
        <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? TEAL : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {isOpen && c && (
        <div style={{ padding: '0 20px 24px' }}>
          <p style={{ ...bodyStyle, marginBottom: 24 }}>{renderBody(c.overview)}</p>

          {/* Nested single-open: one teaching visible at a time, not all 3 stacked */}
          {c.teachings?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {c.teachings.map((t, ti) => (
                  <button
                    key={ti}
                    type="button"
                    onClick={() => setOpenTeaching(ti)}
                    style={{
                      padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 800, cursor: 'pointer',
                      border: `1px solid ${openTeaching === ti ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      background: openTeaching === ti ? 'rgba(52,211,153,0.1)' : 'transparent',
                      color: openTeaching === ti ? TEAL : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {t.num}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: TEAL, marginBottom: 6 }}>
                {c.teachings[openTeaching]?.title}
              </div>
              <p style={bodyStyle}>{renderBody(c.teachings[openTeaching]?.body || '')}</p>
            </div>
          )}

          {c.technique && (
            <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 18, padding: '18px 20px', marginTop: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.35em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
                Technique — {c.technique.name}
              </div>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {c.technique.steps.map((s, si) => (
                  <li key={si} style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 8 }}>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {c.medicines?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                Medicines
              </div>
              {c.medicines.map((med, mi) => (
                <div key={mi} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>{med.label}</div>
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{med.text}</p>
                </div>
              ))}
            </div>
          )}

          {c.quote && (
            <div style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 18, padding: '18px 20px', marginTop: 10, marginBottom: 8, textAlign: 'center' }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, color: 'rgba(255,255,255,0.9)', margin: '0 0 8px', whiteSpace: 'pre-line' }}>{c.quote.tamil}</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>"{c.quote.english}"</p>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: GOLD, margin: 0 }}>{c.quote.master}</p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                Notes for this lesson
              </span>
              {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
              {noteStatus === 'saved' && (
                <span style={{ fontSize: 9, textTransform: 'uppercase', color: TEAL, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={10} /> Saved
                </span>
              )}
              {noteStatus === 'error' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#F87171' }}>Could not save</span>}
            </div>
            <textarea
              value={noteValue}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder="Your reflections on this lesson..."
              style={{
                width: '100%', resize: 'vertical', borderRadius: 14,
                border: '1px solid rgba(255,255,255,.1)', background: 'rgba(5,5,5,.6)',
                padding: '10px 12px', fontSize: 14.5, color: 'rgba(255,255,255,.85)',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              onClick={onToggleComplete}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: isDone ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isDone ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`,
                color: isDone ? TEAL : 'rgba(255,255,255,0.6)',
                padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onGoNext}
              style={{
                background: index === total - 1 ? 'transparent' : 'rgba(52,211,153,0.14)',
                border: `1px solid ${index === total - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(52,211,153,0.4)'}`,
                color: index === total - 1 ? 'rgba(255,255,255,0.25)' : TEAL,
                padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                cursor: index === total - 1 ? 'default' : 'pointer',
              }}
            >
              {index === total - 1 ? 'Last lesson' : 'Next lesson →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SiddhaMedicineModuleContent: React.FC<{ tier: string; moduleKey: string; moduleId: string }> = ({ tier, moduleKey, moduleId }) => {
  const smModule = SIDDHA_MEDICINE_CURRICULUM[tier]?.find((m) => m.id === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(moduleId, 'user_siddha_medicine_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!smModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  return (
    <div>
      {smModule.lessons.map((lesson, i) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          index={i}
          total={smModule.lessons.length}
          isOpen={openIndex === i}
          isDone={sectionRows[lesson.id]?.completed ?? false}
          noteValue={sectionRows[lesson.id]?.notes ?? ''}
          noteStatus={noteSaveStatus[lesson.id] ?? 'idle'}
          onToggleOpen={() => setOpenIndex(openIndex === i ? -1 : i)}
          onToggleComplete={() => void toggleSectionComplete(lesson.id)}
          onNotesChange={(v) => {
            setNoteSaveStatus((m) => ({ ...m, [lesson.id]: 'saving' }));
            setSectionNotes(lesson.id, v, (ok) => setNoteSaveStatus((m) => ({ ...m, [lesson.id]: ok ? 'saved' : 'error' })));
          }}
          onGoNext={() => setOpenIndex(Math.min(smModule.lessons.length - 1, i + 1))}
        />
      ))}
    </div>
  );
};

export default SiddhaMedicineModuleContent;
