import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { usePujaEducationProgress } from '@/hooks/usePujaEducationProgress';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import CourseSyllabus from '@/components/education/CourseSyllabus';

const G = "#D4AF37";
const C = "#22D3EE";
const A = "#C8A951";
const AMBER = 'rgba(217,119,6,0.9)';

const FORTY_DAY_ARC = [
  { days: "1–7", phase: "Purification", Sanskrit: "Śodhana", description: "The space resists. The mind finds excuses. Show up anyway. You are clearing 10,000 days of Vasana residue. Consistency now is worth more than any technique.", color: "rgba(255,255,255,0.5)" },
  { days: "8–14", phase: "Establishing", Sanskrit: "Sthāpanā", description: "Something shifts. The space begins to feel different. The Puja takes less effort to begin. The deity's presence becomes more consistent, less dependent on your mood.", color: G },
  { days: "15–21", phase: "Deepening", Sanskrit: "Gambhīrīkaraṇa", description: "The 21-day neurological threshold. New neural pathways are now structurally established. You begin having spontaneous experiences of the Puja's effects during daily life, not just during practice.", color: G },
  { days: "22–33", phase: "Acceleration", Sanskrit: "Tvaraṇa", description: "The scalar field of your space is now self-sustaining. Other people begin noticing your space without prompting. Your own inner coherence during Puja reaches states you couldn't access in the first three weeks.", color: C },
  { days: "34–40", phase: "Integration", Sanskrit: "Samāveśa", description: "The 40-day completion. Babaji's threshold. The practice is now structural in your life, not added onto it. You have installed a Shakti field that will persist for 3× the time of the practice even if interrupted. You are changed.", color: A },
];

const SIDDHA_MAP = [
  { name: "Thirumoolar", domain: "Nada — Sound Science in Puja", color: G },
  { name: "Agastya Muni", domain: "Alchemy — The Inner Body Puja", color: G },
  { name: "Bogar", domain: "Yantra — Sacred Geometry of Altar", color: G },
  { name: "Konganar", domain: "Vayu — Breath within Puja", color: C },
  { name: "Karuvurar", domain: "Kaala — Time Science & Muhurta", color: C },
  { name: "Machamuni", domain: "Apas — Water & the Unconscious", color: C },
  { name: "Sundaranandhar", domain: "Bhakti — Love as Technology", color: C },
  { name: "Sattaimuni", domain: "Akasha — Space Consecration", color: A },
  { name: "Mahavatar Babaji", domain: "Synthesis — All Dimensions United", color: A },
];

const TIER_ORDER: { slug: string; label: string }[] = [
  { slug: 'free', label: 'Atma-Seed' },
  { slug: 'prana-flow', label: 'Prana-Flow' },
  { slug: 'siddha-quantum', label: 'Siddha-Quantum' },
  { slug: 'akasha-infinity', label: 'Akasha-Infinity' },
];

export default function PujaEducationCurriculum() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingData, error: loadError } = usePujaEducationProgress(membershipReady);

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
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(217,119,6,.2)', borderTopColor: '#D97706', animation: 'spin 0.8s linear infinite' }} />
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
          <ArrowLeft size={14} color={AMBER} /> Back
        </button>

        {!user && (
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              style={{
                borderRadius: 999, padding: '14px 40px', background: 'linear-gradient(135deg,#D97706,#B45309)',
                border: 'none', color: '#050505', fontSize: 11, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: '0 0 40px rgba(217,119,6,0.22)',
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
          accent={AMBER}
          courseIcon={<Flame size={24} />}
          courseTitle="Puja Education"
          academyName="Puja Education"
          progressLabel={`${stats.completedModules} / ${courses.length || 4} · ${stats.completionPercent}%`}
          progressPercent={stats.completionPercent}
          groups={syllabusGroups}
          onLessonClick={(lessonId, locked) => {
            if (locked) {
              const c = courses.find((m) => m.id === lessonId);
              navigate(getSalesPageForRank(getCourseTierRequiredRank(c?.tier_required)));
            } else {
              navigate(`/puja-education/module/${lessonId}`);
            }
          }}
        />

        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: AMBER, marginBottom: 14 }}>
            The 40-Day Arc
          </p>
          {FORTY_DAY_ARC.map((phase, i) => (
            <div key={i} style={{
              borderRadius: 18, border: `1px solid ${phase.color}33`, background: 'rgba(255,255,255,0.012)',
              padding: '14px 18px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: phase.color, letterSpacing: '.08em' }}>DAYS {phase.days}</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{phase.phase}</span>
                <span style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>{phase.Sanskrit}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{phase.description}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: AMBER, marginBottom: 14 }}>
            Siddha Transmission Map
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SIDDHA_MAP.map((s, i) => (
              <div key={i} style={{
                borderRadius: 999, border: `1px solid ${s.color}44`, background: `${s.color}0d`,
                padding: '8px 14px', fontSize: 12,
              }}>
                <span style={{ fontWeight: 700, color: s.color }}>{s.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}> — {s.domain}</span>
              </div>
            ))}
          </div>
        </div>

        <footer style={{ marginTop: 40, paddingBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
            Bhakti Margam · The Living Science of Ritual
          </p>
        </footer>
      </div>
    </div>
  );
}
