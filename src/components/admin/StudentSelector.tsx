// src/components/admin/StudentSelector.tsx
// Admin-only student selector strip — used in Bhrigu Oracle & Ayurveda chat
// Fetches practitioner's students, sets active student in localStorage

import React, { useEffect, useState, useCallback } from 'react';
import {
  listStudents,
  getStudent,
  getActiveStudentId,
  setActiveStudentId,
  type Student,
} from '@/lib/codex/students';

const GOLD    = '#D4AF37';
const VAYU    = '#22D3EE';

interface Props {
  /** Called whenever the active student changes (or is cleared). */
  onStudentChange: (student: Student | null) => void;
}

export const StudentSelector: React.FC<Props> = ({ onStudentChange }) => {
  const [students,  setStudents]  = useState<Student[]>([]);
  const [activeId,  setActiveId]  = useState<string | null>(getActiveStudentId);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);

  // Load student list once
  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // When activeId changes, resolve and emit the full Student object
  useEffect(() => {
    if (!activeId) { onStudentChange(null); return; }
    getStudent(activeId)
      .then(s => onStudentChange(s))
      .catch(() => onStudentChange(null));
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep in sync if another component changes it (e.g. Apothecary)
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: string | null }>).detail.id;
      setActiveId(id);
    };
    window.addEventListener('sqi:active-student-changed', handler);
    return () => window.removeEventListener('sqi:active-student-changed', handler);
  }, []);

  const select = useCallback((id: string | null) => {
    setActiveStudentId(id);
    setActiveId(id);
    setOpen(false);
  }, []);

  const active = students.find(s => s.id === activeId) ?? null;

  const micro: React.CSSProperties = {
    fontSize: 8, fontWeight: 800, letterSpacing: '0.4em',
    textTransform: 'uppercase', color: `${GOLD}88`,
  };

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      {/* Trigger strip */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 14px',
          background: active ? `${GOLD}08` : 'rgba(255,255,255,0.02)',
          border: `1px solid ${active ? `${GOLD}25` : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 14, cursor: 'pointer', textAlign: 'left',
        }}
      >
        {/* Dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: active ? GOLD : 'rgba(255,255,255,0.15)',
          boxShadow: active ? `0 0 6px ${GOLD}80` : 'none',
        }} />

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={micro}>
            {active ? '✦ Reading for student' : '✦ Select student'}
          </div>
          {active && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {active.name}
              {(active.birth_date || active.birth_place) && (
                <span style={{ fontWeight: 400, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
                  {[active.birth_date, active.birth_time, active.birth_place].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          )}
          {!active && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {loading ? 'Loading students…' : students.length === 0 ? 'No students added yet' : 'Tap to choose a student for this reading'}
            </div>
          )}
        </div>

        {/* Chevron */}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          marginTop: 4,
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}>
          {/* Admin / own profile option */}
          <button
            onClick={() => select(null)}
            style={{
              width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
              background: !active ? `${VAYU}10` : 'transparent',
              border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: !active ? VAYU : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <div>
              <div style={{ ...micro, color: !active ? VAYU : `${GOLD}66` }}>My own chart</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>Default — reads admin Jyotish profile</div>
            </div>
          </button>

          {/* Students list */}
          {students.length === 0 && !loading && (
            <div style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              No students yet — add them in the Student Codex
            </div>
          )}
          {students.map(s => (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              style={{
                width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
                background: activeId === s.id ? `${GOLD}08` : 'transparent',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: activeId === s.id ? GOLD : 'rgba(255,255,255,0.15)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: activeId === s.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
                  {[s.birth_date, s.birth_time, s.birth_place].filter(Boolean).join(' · ') || 'No birth data'}
                </div>
                {s.notes && (
                  <div style={{ fontSize: 10, color: `${GOLD}55`, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.notes}
                  </div>
                )}
              </div>
              {activeId === s.id && <span style={{ fontSize: 10, color: GOLD, flexShrink: 0 }}>✦</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSelector;
