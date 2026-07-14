import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useSiddhaMedicineProgress } from '@/hooks/useSiddhaMedicineProgress';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import CourseSyllabus from '@/components/education/CourseSyllabus';
import { teal } from '@/components/education/tokens';

const TIER_ORDER: { slug: string; label: string }[] = [
  { slug: 'free', label: 'Siddha Awakening' },
  { slug: 'prana-flow', label: 'Prana-Flow' },
  { slug: 'siddha-quantum', label: 'Siddha-Quantum' },
  { slug: 'akasha-infinity', label: 'Akasha-Infinity' },
];

export default function SiddhaMedicineAcademy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingData } = useSiddhaMedicineProgress(membershipReady);

  const syllabusGroups = useMemo(() => {
    return TIER_ORDER.map((t) => {
      const mods = courses.filter((c) => (c.tier_required || 'free') === t.slug);
      const completed = mods.filter((c) => progressByModuleId[c.id]?.completed).length;
      return {
        id: `tier-${t.slug}`,
        title: t.label,
        meta: `${completed} / ${mods.length} modules${completed === mods.length && mods.length > 0 ? ' complete' : ''}`,
        done: mods.length > 0 && completed === mods.length,
        current: false,
        lessons: mods.map((m) => {
          const done = Boolean(progressByModuleId[m.id]?.completed);
          const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(m.tier_required));
          const state: 'done' | 'current' | 'available' | 'locked' = done ? 'done' : allowed ? 'available' : 'locked';
          return { id: m.id, number: m.module_number, title: m.title, state };
        }),
      };
    });
  }, [courses, progressByModuleId, isAdmin, tier]);

  if (!membershipReady || loadingData) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(52,211,153,.2)', borderTopColor: '#34D399', animation: 'spin 0.8s linear infinite' }} />
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
          <ArrowLeft size={14} color="rgba(52,211,153,.8)" /> Back
        </button>

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

        <CourseSyllabus
          accent={teal(0.9)}
          courseIcon={<Sparkles size={24} />}
          courseTitle="Siddha Medicine Academy"
          academyName="Siddha Medicine Academy"
          progressLabel={`${stats.completedModules} / ${courses.length || 32} · ${stats.completionPercent}%`}
          progressPercent={stats.completionPercent}
          groups={syllabusGroups}
          onLessonClick={(lessonId, locked) => {
            if (locked) {
              const c = courses.find((m) => m.id === lessonId);
              navigate(getSalesPageForRank(getCourseTierRequiredRank(c?.tier_required)));
            } else {
              navigate(`/siddha-medicine/module/${lessonId}`);
            }
          }}
        />

        <footer style={{ marginTop: 40, paddingBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
            Agathiyar's Living Curriculum
          </p>
        </footer>
      </div>
    </div>
  );
}
