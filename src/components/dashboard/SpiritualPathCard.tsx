import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpiritualPaths } from '@/hooks/useSpiritualPaths';
import { Skeleton } from '@/components/ui/skeleton';

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const SpiritualPathCard: React.FC = () => {
  const { t } = useTranslation();
  const { paths, userProgress, isLoading, getActiveProgress } = useSpiritualPaths();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  const activeProgress = getActiveProgress();

  if (activeProgress) {
    const activePath = paths.find(p => p.id === activeProgress.path_id);
    if (activePath) {
      const progressPercent = Math.round((activeProgress.current_day / activePath.duration_days) * 100);
      const pathTitle = t(`spiritualPath.paths.${activePath.slug.replace(/-/g, '_')}.title`, activePath.title);
      const pathDesc = t(`spiritualPath.paths.${activePath.slug.replace(/-/g, '_')}.description`, activePath.description || '');
      const pathLabel = toTitleCase(activePath.slug);

      return (
        <Link to={`/paths/${activePath.slug}`} className="sq-path-card block text-inherit no-underline" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)' }}>
          <div className="sq-path-header">
            <div className="sq-path-title">{pathLabel}</div>
            <div className="sq-path-day">Day {activeProgress.current_day} / {activePath.duration_days}</div>
          </div>
          <div className="sq-path-name">{pathTitle}</div>
          <div className="sq-path-desc">{pathDesc}</div>
          <div className="sq-path-bar-wrap">
            <div className="sq-path-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="sq-path-footer">
            <div className="sq-path-pct">{progressPercent}% complete</div>
            <span className="sq-path-btn">▷ {t('spiritualPath.continueDayWithNumber', { day: activeProgress.current_day, defaultValue: `Continue Day ${activeProgress.current_day}` })}</span>
          </div>
        </Link>
      );
    }
  }

  const recommendedPath = paths[0];
  if (!recommendedPath) return null;

  const pathTitle = t(`spiritualPath.paths.${recommendedPath.slug.replace(/-/g, '_')}.title`, recommendedPath.title);
  const pathDesc = t(`spiritualPath.paths.${recommendedPath.slug.replace(/-/g, '_')}.description`, recommendedPath.description || '');
  const pathLabel = toTitleCase(recommendedPath.slug);

  return (
    <Link to={`/paths/${recommendedPath.slug}`} className="sq-path-card block text-inherit no-underline" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)' }}>
      <div className="sq-path-header">
        <div className="sq-path-title">{pathLabel}</div>
        <div className="sq-path-day">Day 0 / {recommendedPath.duration_days}</div>
      </div>
      <div className="sq-path-name">{pathTitle}</div>
      <div className="sq-path-desc">{pathDesc}</div>
      <div className="sq-path-bar-wrap">
        <div className="sq-path-bar" style={{ width: '0%' }} />
      </div>
      <div className="sq-path-footer">
        <div className="sq-path-pct">0% complete</div>
        <span className="sq-path-btn">▷ {t('spiritualPath.startJourney', 'Start Journey')}</span>
      </div>
    </Link>
  );
};
