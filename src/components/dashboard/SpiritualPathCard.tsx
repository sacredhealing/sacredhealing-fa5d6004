import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpiritualPaths } from '@/hooks/useSpiritualPaths';
import { Skeleton } from '@/components/ui/skeleton';
import { isInnerPeacePathSlug, normalizeSpiritualPathSlugKey } from '@/lib/spiritualPathSlug';

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
      const pathSlugKey = normalizeSpiritualPathSlugKey(activePath.slug);
      const pathTitle = t(`spiritualPath.paths.${pathSlugKey}.title`, activePath.title);
      const pathDesc = t(`spiritualPath.paths.${pathSlugKey}.description`, activePath.description || '');
      const pathLabel = toTitleCase(activePath.slug);
      const isInnerPeace = isInnerPeacePathSlug(activePath.slug);
      const displayLabel = isInnerPeace ? t('spiritualPath.innerPeaceLabel') : pathLabel;
      const displayTitle = isInnerPeace ? t('spiritualPath.innerPeaceEquilibriumTitle') : pathTitle;
      const continueLabel = t('spiritualPath.resumeTransmissionCycle', { day: activeProgress.current_day });

      return (
        <Link to={`/paths/${activePath.slug}`} className="sq-path-card block text-inherit no-underline" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)' }}>
          <div className="sq-path-header">
            <div className="sq-path-title">{displayLabel}</div>
            <div className="sq-path-day">{t('spiritualPath.daySlashTotal', { current: activeProgress.current_day, total: activePath.duration_days })}</div>
          </div>
          <div className="sq-path-name">{displayTitle}</div>
          <div className="sq-path-desc">{pathDesc}</div>
          <div className="sq-path-bar-wrap">
            <div className="sq-path-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="sq-path-footer">
            <div className="sq-path-pct">{t('spiritualPath.progressComplete', { percent: progressPercent })}</div>
            <span className="sq-path-btn">▷ {continueLabel}</span>
          </div>
        </Link>
      );
    }
  }

  const recommendedPath = paths[0];
  if (!recommendedPath) return null;

  const recSlugKey = normalizeSpiritualPathSlugKey(recommendedPath.slug);
  const pathTitle = t(`spiritualPath.paths.${recSlugKey}.title`, recommendedPath.title);
  const pathDesc = t(`spiritualPath.paths.${recSlugKey}.description`, recommendedPath.description || '');
  const pathLabel = toTitleCase(recommendedPath.slug);
  const isInnerPeaceRec = isInnerPeacePathSlug(recommendedPath.slug);
  const displayLabelRec = isInnerPeaceRec ? t('spiritualPath.innerPeaceLabel') : pathLabel;
  const displayTitleRec = isInnerPeaceRec ? t('spiritualPath.innerPeaceEquilibriumTitle') : pathTitle;

  return (
    <Link to={`/paths/${recommendedPath.slug}`} className="sq-path-card block text-inherit no-underline" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)' }}>
      <div className="sq-path-header">
        <div className="sq-path-title">{displayLabelRec}</div>
        <div className="sq-path-day">{t('spiritualPath.daySlashTotal', { current: 0, total: recommendedPath.duration_days })}</div>
      </div>
      <div className="sq-path-name">{displayTitleRec}</div>
      <div className="sq-path-desc">{pathDesc}</div>
      <div className="sq-path-bar-wrap">
        <div className="sq-path-bar" style={{ width: '0%' }} />
      </div>
      <div className="sq-path-footer">
        <div className="sq-path-pct">{t('spiritualPath.progressComplete', { percent: 0 })}</div>
        <span className="sq-path-btn">▷ {t('spiritualPath.startJourney')}</span>
      </div>
    </Link>
  );
};
