import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useJyotishVidyaProgress } from '@/hooks/useJyotishVidyaProgress';
import { JYOTISH_MODULES } from '@/lib/jyotishModules';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import CourseSyllabus from '@/components/education/CourseSyllabus';

const CYAN = 'rgba(34,211,238,0.9)';

const TIER_ORDER: { slug: 'free' | 'prana' | 'siddha' | 'akasha'; label: string }[] = [
  { slug: 'free', label: 'Atma-Seed' },
  { slug: 'prana', label: 'Prana-Flow' },
  { slug: 'siddha', label: 'Siddha-Quantum' },
  { slug: 'akasha', label: 'Akasha-Infinity' },
];

export default function JyotishVidya() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { progressByModuleId, loading: loadingData, error: loadError } = useJyotishVidyaProgress(membershipReady);

  const sortedModules = useMemo(() => [...JYOTISH_MODULES].sort((a, b) => a.id - b.id), []);

  const completedCount = useMemo(
    () => Object.values(progressByModuleId).filter((p) => p.status === 'completed' || p.completion_percentage >= 100).length,
    [progressByModuleId],
  );
  const completionPercent = sortedModules.length > 0 ? Math.round((completedCount / sortedModules.length) * 100) : 0;

  const syllabusGroups = useMemo(() => {
    return TIER_ORDER.map((t) => {
      const mods = sortedModules.filter((m) => m.tier === t.slug);
      const completed = mods.filter((m) => {
        const p = progressByModuleId[m.id];
        return p && (p.status === 'completed' || p.completion_percentage >= 100);
      }).length;
      return {
        id: `tier-${t.slug}`,
        title: t.label,
        meta: `${completed} / ${mods.length} modules${completed === mods.length && mods.length > 0 ? ' complete' : ''}`,
        done: mods.length > 0 && completed === mods.length,
        current: false,
        lessons: mods.map((m) => {
          const p = progressByModuleId[m.id];
          const done = Boolean(p && (p.status === 'completed' || p.completion_percentage >= 100));
          const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(m.tier));
          const state: 'done' | 'current' | 'available' | 'locked' = done ? 'done' : allowed ? 'available' : 'locked';
          return { id: String(m.id), number: m.id, title: m.title, state };
        }),
      };
    });
  }, [sortedModules, progressByModuleId, isAdmin, tier]);

  // Module list is static data — render it immediately. Only progress
  // (badges, completion counts) needs to wait for membership/auth to settle.

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
          <ArrowLeft size={14} color={CYAN} /> Back
        </button>

        {loadingData && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.15em' }}>
            Syncing your progress…
          </p>
        )}

        {!user && (
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              style={{
                borderRadius: 999, padding: '14px 40px', background: 'linear-gradient(135deg,#22D3EE,#0891B2)',
                border: 'none', color: '#050505', fontSize: 11, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: '0 0 40px rgba(34,211,238,0.22)',
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
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F87171', margin: '0 0 4px' }}>Could not load your progress.</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', margin: 0 }}>{loadError}</p>
          </div>
        )}

        <CourseSyllabus
          accent={CYAN}
          courseIcon={<Star size={24} />}
          courseTitle="Sovereign Jyotish Vidya"
          academyName="Sovereign Jyotish Vidya"
          progressLabel={`${completedCount} / ${sortedModules.length} · ${completionPercent}%`}
          progressPercent={completionPercent}
          groups={syllabusGroups}
          onLessonClick={(lessonId, locked) => {
            if (locked) {
              const m = sortedModules.find((mod) => String(mod.id) === lessonId);
              navigate(getSalesPageForRank(getCourseTierRequiredRank(m?.tier)));
            } else {
              navigate(`/jyotish-vidya/module/${lessonId}`);
            }
          }}
        />

        <footer style={{ marginTop: 40, paddingBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
            The Eye of the Veda
          </p>
        </footer>
      </div>
    </div>
  );
}
