import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useSacredGeometryProgress } from '@/hooks/useSacredGeometryProgress';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import ModuleReaderShell from '@/components/education/ModuleReaderShell';
import { gold, fade } from '@/components/education/tokens';
import SacredGeometryContent from '@/components/SacredGeometryContent';

export default function SacredGeometryModule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, markComplete, touchAccessed, stats } = useSacredGeometryProgress(membershipReady);

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.module_number - b.module_number), [courses]);
  const module = useMemo(() => sortedCourses.find((c) => c.id === id), [sortedCourses, id]);

  React.useEffect(() => {
    if (module?.id && user?.id) void touchAccessed(module.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id, user?.id]);

  const idx = module ? sortedCourses.findIndex((c) => c.id === module.id) : -1;
  const prevModule = idx > 0 ? sortedCourses[idx - 1] : null;
  const nextModule = idx >= 0 && idx < sortedCourses.length - 1 ? sortedCourses[idx + 1] : null;
  const nextAllowed = nextModule
    ? hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(nextModule.tier_required))
    : false;

  const railGroups = useMemo(() => {
    const tierOrder: { slug: string; label: string }[] = [
      { slug: 'free', label: 'Atma-Seed' },
      { slug: 'prana-flow', label: 'Prana-Flow' },
      { slug: 'siddha-quantum', label: 'Siddha-Quantum' },
      { slug: 'akasha-infinity', label: 'Akasha-Infinity' },
    ];
    return tierOrder.map((t) => {
      const items = sortedCourses.filter((c) => (c.tier_required || 'free') === t.slug);
      const doneCount = items.filter((c) => progressByModuleId[c.id]?.completed).length;
      const containsCurrent = module ? items.some((c) => c.id === module.id) : false;
      return {
        id: `tier-${t.slug}`,
        title: t.label,
        meta: `${doneCount} / ${items.length} modules${doneCount === items.length && items.length > 0 ? ' complete' : ''}`,
        done: items.length > 0 && doneCount === items.length,
        current: containsCurrent,
        items: items.map((c) => {
          const done = Boolean(progressByModuleId[c.id]?.completed);
          const isCurrentModule = module ? c.id === module.id : false;
          const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(c.tier_required));
          const state: 'done' | 'current' | 'available' | 'locked' = done
            ? 'done'
            : isCurrentModule
              ? 'current'
              : allowed
                ? 'available'
                : 'locked';
          return { id: c.id, number: c.module_number, title: c.title, state, href: `/sacred-geometry/module/${c.id}` };
        }),
      };
    });
  }, [sortedCourses, progressByModuleId, module, isAdmin, tier]);

  if (!membershipReady || !module) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(212,175,55,.2)', borderTopColor: '#D4AF37', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(module.tier_required));
  const accent = gold(0.9);
  const salesHref = getSalesPageForRank(getCourseTierRequiredRank(module.tier_required));

  return (
    <ModuleReaderShell
      accent={accent}
      academyName="Sacred Geometry Education"
      academyHref="/sacred-geometry"
      courseTitle="The Language of Creation"
      courseIcon={<Hexagon size={24} />}
      moduleNumber={module.module_number}
      totalModules={stats.totalModules}
      moduleTitle={module.title}
      thesis={module.subtitle || undefined}
      progressLabel={`${stats.completedModules} / ${stats.totalModules} · ${stats.completionPercent}%`}
      progressPercent={stats.completionPercent}
      railGroups={railGroups}
      contentBlocks={[]}
      locked={!allowed}
      lockedCta={
        <button
          type="button"
          onClick={() => navigate(salesHref)}
          style={{
            borderRadius: 999, padding: '13px 26px',
            background: `linear-gradient(135deg, ${accent}, ${fade(accent, 0.7)})`,
            border: 'none', color: '#050505', fontSize: 10, fontWeight: 800,
            letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Unlock This Module
        </button>
      }
      onMarkComplete={() => void markComplete(module.id)}
      isComplete={Boolean(progressByModuleId[module.id]?.completed)}
      prevHref={prevModule ? `/sacred-geometry/module/${prevModule.id}` : null}
      nextHref={nextModule && nextAllowed ? `/sacred-geometry/module/${nextModule.id}` : null}
      footerExtra={
        user?.id ? (
          <SacredGeometryContent moduleKey={module.module_key} dbModuleId={module.id} />
        ) : null
      }
    />
  );
}
