import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useJyotishVidyaProgress } from '@/hooks/useJyotishVidyaProgress';
import { JYOTISH_MODULES } from '@/lib/jyotishModules';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import ModuleReaderShell from '@/components/education/ModuleReaderShell';
import { fade } from '@/components/education/tokens';
import JyotishVidyaContent from '@/components/JyotishVidyaContent';

const CYAN = 'rgba(34,211,238,0.9)';

export default function JyotishModuleViewer() {
  const { moduleId: moduleIdParam } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { progressByModuleId, markComplete, touchAccess } = useJyotishVidyaProgress(membershipReady);

  const sortedModules = useMemo(() => [...JYOTISH_MODULES].sort((a, b) => a.id - b.id), []);
  const moduleId = Number(moduleIdParam);
  const module = useMemo(() => sortedModules.find((m) => m.id === moduleId), [sortedModules, moduleId]);

  React.useEffect(() => {
    if (module?.id && user?.id) void touchAccess(module.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id, user?.id]);

  const idx = module ? sortedModules.findIndex((m) => m.id === module.id) : -1;
  const prevModule = idx > 0 ? sortedModules[idx - 1] : null;
  const nextModule = idx >= 0 && idx < sortedModules.length - 1 ? sortedModules[idx + 1] : null;
  const nextAllowed = nextModule
    ? hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(nextModule.tier))
    : false;

  const railGroups = useMemo(() => {
    const tierOrder: { slug: 'free' | 'prana' | 'siddha' | 'akasha'; label: string }[] = [
      { slug: 'free', label: 'Atma-Seed' },
      { slug: 'prana', label: 'Prana-Flow' },
      { slug: 'siddha', label: 'Siddha-Quantum' },
      { slug: 'akasha', label: 'Akasha-Infinity' },
    ];
    return tierOrder.map((t) => {
      const items = sortedModules.filter((m) => m.tier === t.slug);
      const doneCount = items.filter((m) => {
        const p = progressByModuleId[m.id];
        return p && (p.status === 'completed' || p.completion_percentage >= 100);
      }).length;
      const containsCurrent = module ? items.some((m) => m.id === module.id) : false;
      return {
        id: `tier-${t.slug}`,
        title: t.label,
        meta: `${doneCount} / ${items.length} modules${doneCount === items.length && items.length > 0 ? ' complete' : ''}`,
        done: items.length > 0 && doneCount === items.length,
        current: containsCurrent,
        items: items.map((m) => {
          const p = progressByModuleId[m.id];
          const done = Boolean(p && (p.status === 'completed' || p.completion_percentage >= 100));
          const isCurrentModule = module ? m.id === module.id : false;
          const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(m.tier));
          const state: 'done' | 'current' | 'available' | 'locked' = done
            ? 'done'
            : isCurrentModule
              ? 'current'
              : allowed
                ? 'available'
                : 'locked';
          return { id: String(m.id), number: m.id, title: m.title, state, href: `/jyotish-vidya/module/${m.id}` };
        }),
      };
    });
  }, [sortedModules, progressByModuleId, module, isAdmin, tier]);

  if (!module) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(34,211,238,.2)', borderTopColor: '#22D3EE', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(module.tier));
  const accent = CYAN;
  const salesHref = getSalesPageForRank(getCourseTierRequiredRank(module.tier));
  const p = progressByModuleId[module.id];
  const isComplete = Boolean(p && (p.status === 'completed' || p.completion_percentage >= 100));
  const completedCount = Object.values(progressByModuleId).filter((row) => row.status === 'completed' || row.completion_percentage >= 100).length;

  return (
    <ModuleReaderShell
      accent={accent}
      academyName="Sovereign Jyotish Vidya"
      academyHref="/jyotish-vidya"
      courseTitle="Bhrigu's Living Transmission"
      courseIcon={<Star size={24} />}
      moduleNumber={module.id}
      totalModules={sortedModules.length}
      moduleTitle={module.title}
      thesis={module.subtitle || undefined}
      progressLabel={`${completedCount} / ${sortedModules.length} · ${Math.round((completedCount / sortedModules.length) * 100)}%`}
      progressPercent={Math.round((completedCount / sortedModules.length) * 100)}
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
      isComplete={isComplete}
      prevHref={prevModule ? `/jyotish-vidya/module/${prevModule.id}` : null}
      nextHref={nextModule && nextAllowed ? `/jyotish-vidya/module/${nextModule.id}` : null}
      footerExtra={
        user?.id ? (
          <JyotishVidyaContent moduleId={module.id} dbModuleId={String(module.id)} />
        ) : null
      }
    />
  );
}
