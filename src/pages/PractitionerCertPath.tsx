import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { usePractitionerCertProgress } from '@/hooks/usePractitionerCertProgress';
import { hasFeatureAccess, getCourseTierRequiredRank } from '@/lib/tierAccess';
import CourseSyllabus from '@/components/education/CourseSyllabus';

const GOLD = 'rgba(212,175,55,0.9)';

export default function PractitionerCertPath() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingData, error: loadError } = usePractitionerCertProgress(membershipReady);

  const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank('akasha-infinity'));

  const syllabusGroups = useMemo(() => {
    const sorted = [...courses].sort((a, b) => a.module_number - b.module_number);
    const completed = sorted.filter((c) => progressByModuleId[c.id]?.completed).length;
    return [{
      id: 'akasha-infinity',
      title: 'The 12-Month Path',
      meta: `${completed} / ${sorted.length} months${completed === sorted.length && sorted.length > 0 ? ' complete' : ''}`,
      done: sorted.length > 0 && completed === sorted.length,
      current: false,
      lessons: sorted.map((m) => {
        const done = Boolean(progressByModuleId[m.id]?.completed);
        const state: 'done' | 'available' | 'locked' = done ? 'done' : allowed ? 'available' : 'locked';
        return { id: m.id, number: m.module_number, title: m.title, state };
      }),
    }];
  }, [courses, progressByModuleId, allowed]);

  if (!membershipReady || loadingData) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(212,175,55,.2)', borderTopColor: '#D4AF37', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'rgba(255,255,255,0.9)', paddingBottom: 104 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 0' }}>
        <button
          type="button"
          onClick={() => navigate('/siddha-portal')}
          style={{
            marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 999, padding: '8px 16px', color: 'rgba(255,255,255,.55)',
            fontSize: 10, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} color={GOLD} /> Back
        </button>

        <div style={{
          marginBottom: 24, borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)',
          background: 'rgba(212,175,55,0.05)', padding: '16px 20px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px' }}>
            Akasha-Infinity Exclusive
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
            This 12-month practitioner certification is included with Akasha-Infinity lifetime membership.
            {!allowed && !user && ' Sign in and enroll to access this reader, or '}
            {!allowed && user && ' '}
            {!allowed && (
              <button
                type="button"
                onClick={() => navigate('/certification')}
                style={{ color: GOLD, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}
              >
                view enrollment details
              </button>
            )}
            {!allowed && '.'}
          </p>
        </div>

        {!user && (
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              style={{
                borderRadius: 999, padding: '14px 40px', background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                border: 'none', color: '#050505', fontSize: 11, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: '0 0 40px rgba(212,175,55,0.22)',
              }}
            >
              Begin Initiation
            </button>
          </div>
        )}

        {loadError && (
          <div style={{
            marginBottom: 24, borderRadius: 16, border: '1px solid rgba(248,113,113,0.3)',
            background: 'rgba(248,113,113,0.08)', padding: '14px 18px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F87171', margin: '0 0 4px' }}>Could not load this academy.</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', margin: 0 }}>{loadError}</p>
          </div>
        )}

        <CourseSyllabus
          accent={GOLD}
          courseIcon={<Crown size={24} />}
          courseTitle="Siddha Healer's Sovereign Path"
          academyName="Siddha Healer's Sovereign Path"
          progressLabel={`${stats.completedModules} / ${courses.length || 12} · ${stats.completionPercent}%`}
          progressPercent={stats.completionPercent}
          groups={syllabusGroups}
          onLessonClick={(lessonId, locked) => {
            if (locked) {
              navigate('/certification');
            } else {
              navigate(`/certification-path/module/${lessonId}`);
            }
          }}
        />

        <footer style={{ marginTop: 40, paddingBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
            12 Months · Personal Diksha · Certification
          </p>
        </footer>
      </div>
    </div>
  );
}
