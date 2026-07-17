import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useShaktiCycleProgress } from '@/hooks/useShaktiCycleProgress';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import { SHAKTI_PHASES, SHAKTI_HERBS, SHAKTI_PLANETS } from '@/data/shaktiCycleModuleContent';
import CourseSyllabus from '@/components/education/CourseSyllabus';

const ROSE = 'rgba(225,29,143,0.9)';

const TIER_ORDER: { slug: string; label: string }[] = [
  { slug: 'free', label: 'Atma-Seed' },
  { slug: 'prana-flow', label: 'Prana-Flow' },
  { slug: 'akasha-infinity', label: 'Akasha-Infinity' },
];

export default function SovereignHormonalAlchemy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingData, error: loadError } = useShaktiCycleProgress(membershipReady);
  const [showReference, setShowReference] = React.useState(false);

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
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(225,29,143,.2)', borderTopColor: '#E11D8F', animation: 'spin 0.8s linear infinite' }} />
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
          <ArrowLeft size={14} color={ROSE} /> Back
        </button>

        {!user && (
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              style={{
                borderRadius: 999, padding: '14px 40px', background: 'linear-gradient(135deg,#E11D8F,#9D174D)',
                border: 'none', color: '#050505', fontSize: 11, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: '0 0 40px rgba(225,29,143,0.22)',
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
          accent={ROSE}
          courseIcon={<Moon size={24} />}
          courseTitle="Sovereign Hormonal Alchemy"
          academyName="Sovereign Hormonal Alchemy"
          progressLabel={`${stats.completedModules} / ${courses.length || 35} · ${stats.completionPercent}%`}
          progressPercent={stats.completionPercent}
          groups={syllabusGroups}
          onLessonClick={(lessonId, locked) => {
            if (locked) {
              const c = courses.find((m) => m.id === lessonId);
              navigate(getSalesPageForRank(getCourseTierRequiredRank(c?.tier_required)));
            } else {
              navigate(`/sovereign-hormonal-alchemy/module/${lessonId}`);
            }
          }}
        />

        <button
          type="button"
          onClick={() => setShowReference((s) => !s)}
          style={{
            width: '100%', marginTop: 24, background: 'rgba(225,29,143,0.06)', border: '1px solid rgba(225,29,143,0.2)',
            borderRadius: 20, padding: '16px 20px', color: ROSE, fontSize: 11, fontWeight: 800,
            letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left',
          }}
        >
          {showReference ? '▲' : '▼'} Reference — Cycle Phases, Herbs & Planetary Timing
        </button>

        {showReference && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>The Four Phases</p>
            {SHAKTI_PHASES.map((p: any) => (
              <div key={p.id} style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.015)', padding: '16px 18px', marginBottom: 10 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 700, color: p.color }}>{p.icon} {p.name} — {p.subtitle}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '4px 0 8px' }}>{p.siddhaName} · {p.goddess} · {p.element} · {p.planet}</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{p.description}</p>
              </div>
            ))}

            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '20px 0 10px' }}>Plant Medicine</p>
            {SHAKTI_HERBS.map((h: any, i: number) => (
              <div key={i} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)', padding: '12px 16px', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>{h.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{h.name} <span style={{ fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>{h.latin}</span> — {h.role}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{h.for}</div>
                  <div style={{ fontSize: 11, color: 'rgba(212,175,55,0.7)', marginTop: 2 }}>{h.dosage}</div>
                </div>
              </div>
            ))}

            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '20px 0 10px' }}>Planetary Timing</p>
            {SHAKTI_PLANETS.map((p: any, i: number) => (
              <div key={i} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)', padding: '12px 16px', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{p.planet}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Rules: {p.rules}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Hormones: {p.hormone}</div>
                  <div style={{ fontSize: 11, color: 'rgba(212,175,55,0.7)', marginTop: 2 }}>{p.remedy} · {p.mantra}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer style={{ marginTop: 40, paddingBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
            Shakti Cycle Intelligence
          </p>
        </footer>
      </div>
    </div>
  );
}
