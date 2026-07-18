import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { usePractitionerCertProgress } from '@/hooks/usePractitionerCertProgress';
import { hasFeatureAccess, getCourseTierRequiredRank } from '@/lib/tierAccess';
import ModuleReaderShell from '@/components/education/ModuleReaderShell';
import { fade } from '@/components/education/tokens';
import PractitionerCertContent from '@/components/PractitionerCertContent';

const GOLD = 'rgba(212,175,55,0.9)';

export default function PractitionerCertModule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, markComplete, touchAccessed, stats } = usePractitionerCertProgress(membershipReady);

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.module_number - b.module_number), [courses]);
  const module = useMemo(() => sortedCourses.find((c) => c.id === id), [sortedCourses, id]);

  React.useEffect(() => {
    if (module?.id && user?.id) void touchAccessed(module.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id, user?.id]);

  const idx = module ? sortedCourses.findIndex((c) => c.id === module.id) : -1;
  const prevModule = idx > 0 ? sortedCourses[idx - 1] : null;
  const nextModule = idx >= 0 && idx < sortedCourses.length - 1 ? sortedCourses[idx + 1] : null;

  const railGroups = useMemo(() => {
    const doneCount = sortedCourses.filter((c) => progressByModuleId[c.id]?.completed).length;
    return [{
      id: 'akasha-infinity',
      title: 'The 12-Month Path',
      meta: `${doneCount} / ${sortedCourses.length} months${doneCount === sortedCourses.length && sortedCourses.length > 0 ? ' complete' : ''}`,
      done: sortedCourses.length > 0 && doneCount === sortedCourses.length,
      current: true,
      items: sortedCourses.map((c) => {
        const done = Boolean(progressByModuleId[c.id]?.completed);
        const isCurrentModule = module ? c.id === module.id : false;
        const state: 'done' | 'current' | 'available' = done ? 'done' : isCurrentModule ? 'current' : 'available';
        return { id: c.id, number: c.module_number, title: c.title, state, href: `/certification-path/module/${c.id}` };
      }),
    }];
  }, [sortedCourses, progressByModuleId, module]);

  const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank('akasha-infinity'));

  if (!membershipReady || !module) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(212,175,55,.2)', borderTopColor: '#D4AF37', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <ModuleReaderShell
      accent={GOLD}
      academyName="Siddha Healer's Sovereign Path"
      academyHref="/certification-path"
      courseTitle="12-Month Practitioner Certification"
      courseIcon={<Crown size={24} />}
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
          onClick={() => navigate('/certification')}
          style={{
            borderRadius: 999, padding: '13px 26px',
            background: `linear-gradient(135deg, ${GOLD}, ${fade(GOLD, 0.7)})`,
            border: 'none', color: '#050505', fontSize: 10, fontWeight: 800,
            letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Akasha-Infinity Exclusive — View Enrollment
        </button>
      }
      onMarkComplete={() => void markComplete(module.id)}
      isComplete={Boolean(progressByModuleId[module.id]?.completed)}
      prevHref={prevModule ? `/certification-path/module/${prevModule.id}` : null}
      nextHref={nextModule ? `/certification-path/module/${nextModule.id}` : null}
      footerExtra={
        user?.id ? (
          <PractitionerCertContent moduleKey={module.module_key} dbModuleId={module.id} />
        ) : null
      }
    />
  );
}
