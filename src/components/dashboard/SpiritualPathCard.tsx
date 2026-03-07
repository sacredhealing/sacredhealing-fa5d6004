import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { useSpiritualPaths } from '@/hooks/useSpiritualPaths';
import { Skeleton } from '@/components/ui/skeleton';

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

  // If user has an active path, show progress (image layout: INNER PEACE PATH card)
  if (activeProgress) {
    const activePath = paths.find(p => p.id === activeProgress.path_id);
    if (activePath) {
      const progressPercent = Math.round((activeProgress.current_day / activePath.duration_days) * 100);
      const pathTitle = t(`spiritualPath.paths.${activePath.slug.replace(/-/g, '_')}.title`, activePath.title);
      const pathDesc = t(`spiritualPath.paths.${activePath.slug.replace(/-/g, '_')}.description`, activePath.description || '');

      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-[rgba(212,175,55,0.7)]"
              style={{ fontFamily: 'Montserrat,sans-serif' }}
            >
              {activePath.slug.replace(/-/g, ' ')}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider text-[rgba(212,175,55,0.5)]"
              style={{ fontFamily: 'Montserrat,sans-serif' }}
            >
              Day {activeProgress.current_day} / {activePath.duration_days}
            </span>
          </div>
          <p
            className="text-lg font-serif text-white/90 leading-tight"
            style={{ fontFamily: 'Cormorant Garamond, Cinzel, serif' }}
          >
            {pathTitle}
          </p>
          <p className="text-xs text-white/50" style={{ fontFamily: 'Montserrat,sans-serif' }}>
            {pathDesc}
          </p>
          <div className="flex flex-col gap-2">
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: '#D4AF37',
                  boxShadow: '0 0 10px rgba(212,175,55,0.4)',
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(212,175,55,0.6)]"
                style={{ fontFamily: 'Montserrat,sans-serif' }}
              >
                {progressPercent}% complete
              </span>
              <Link to={`/paths/${activePath.slug}`}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/60 bg-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
                  style={{ fontFamily: 'Montserrat,sans-serif' }}
                >
                  <Play className="h-3 w-3 fill-current" />
                  {t('spiritualPath.continueDayWithNumber', { day: activeProgress.current_day, defaultValue: `Continue Day ${activeProgress.current_day}` })}
                </button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // Show recommended paths if no active path
  const recommendedPath = paths[0];
  if (!recommendedPath) {
    return null;
  }

  const pathTitle = t(`spiritualPath.paths.${recommendedPath.slug.replace(/-/g, '_')}.title`, recommendedPath.title);
  const pathDesc = t(`spiritualPath.paths.${recommendedPath.slug.replace(/-/g, '_')}.description`, recommendedPath.description || '');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-[rgba(212,175,55,0.7)]"
          style={{ fontFamily: 'Montserrat,sans-serif' }}
        >
          {recommendedPath.slug.replace(/-/g, ' ')}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider text-[rgba(212,175,55,0.5)]"
          style={{ fontFamily: 'Montserrat,sans-serif' }}
        >
          Day 0 / {recommendedPath.duration_days}
        </span>
      </div>
      <p
        className="text-lg font-serif text-white/90 leading-tight"
        style={{ fontFamily: 'Cormorant Garamond, Cinzel, serif' }}
      >
        {pathTitle}
      </p>
      <p className="text-xs text-white/50" style={{ fontFamily: 'Montserrat,sans-serif' }}>
        {pathDesc}
      </p>
      <Link to={`/paths/${recommendedPath.slug}`}>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/60 bg-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
          style={{ fontFamily: 'Montserrat,sans-serif' }}
        >
          <Play className="h-3 w-3 fill-current" />
          {t('spiritualPath.startJourney', 'Start Journey')}
        </button>
      </Link>
    </div>
  );
};
