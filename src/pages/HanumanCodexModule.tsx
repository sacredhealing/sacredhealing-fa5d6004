import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useHanumanCodexProgress } from '@/hooks/useHanumanCodexProgress';
import ModuleReaderShell from '@/components/education/ModuleReaderShell';
import HanumanCodexContent from '@/components/HanumanCodexContent';

const AMBER = 'rgba(249,115,22,0.9)';

export default function HanumanCodexModule() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, markComplete, touchAccessed, progressByModuleId } = useHanumanCodexProgress(membershipReady);

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
    return [{
      id: 'sections',
      title: 'Hanuman Codex',
      meta: `${sortedCourses.length} sections`,
      done: false,
      current: true,
      items: sortedCourses.map((c) => ({
        id: c.id, number: c.module_number, title: c.title,
        state: (module && c.id === module.id ? 'current' : 'available') as 'current' | 'available',
        href: `/hanuman-codex/section/${c.id}`,
      })),
    }];
  }, [sortedCourses, module]);

  if (!membershipReady || !module) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(249,115,22,.2)', borderTopColor: '#F97316', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <ModuleReaderShell
      accent={AMBER}
      academyName="Hanuman Codex"
      academyHref="/hanuman-codex"
      courseTitle="The Complete Transmission"
      courseIcon={<Zap size={24} />}
      moduleNumber={module.module_number}
      totalModules={sortedCourses.length}
      moduleTitle={module.title}
      thesis={module.subtitle || undefined}
      progressLabel={`Section ${module.module_number} of ${sortedCourses.length}`}
      progressPercent={Math.round((module.module_number / sortedCourses.length) * 100)}
      railGroups={railGroups}
      contentBlocks={[]}
      locked={false}
      onMarkComplete={() => void markComplete(module.id)}
      isComplete={Boolean(progressByModuleId[module.id]?.completed)}
      prevHref={prevModule ? `/hanuman-codex/section/${prevModule.id}` : null}
      nextHref={nextModule ? `/hanuman-codex/section/${nextModule.id}` : null}
      footerExtra={
        user?.id ? (
          <HanumanCodexContent sectionKey={module.module_key} dbModuleId={module.id} tier={tier} isAdmin={isAdmin} />
        ) : null
      }
    />
  );
}
